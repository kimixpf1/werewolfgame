create extension if not exists pgcrypto;

create or replace function public.app_name_key(p_name text)
returns text
language sql
immutable
as $$
  select lower(trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')))
$$;

create or replace function public.app_token_hash(p_token text)
returns text
language sql
immutable
as $$
  select md5(coalesce(p_token, ''))
$$;

create or replace function public.app_generate_token()
returns text
language sql
volatile
as $$
  select md5(random()::text || clock_timestamp()::text || txid_current()::text)
       || md5(random()::text || clock_timestamp()::text || txid_current()::text)
$$;

create table if not exists public.rooms (
  id text primary key check (id ~ '^[0-9]{6}$'),
  host_id text not null,
  player_count integer not null check (player_count > 0),
  roles jsonb not null default '[]'::jsonb,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'ended')),
  current_phase text not null default 'night' check (current_phase in ('night', 'day', 'voting', 'ended')),
  enable_sheriff boolean not null default true,
  current_round integer not null default 1,
  sheriff_id text,
  sheriff_torn boolean not null default false,
  win_mode text not null default 'side' check (win_mode in ('city', 'side')),
  game_result jsonb,
  game_state jsonb,
  night_actions jsonb not null default '[]'::jsonb,
  enable_auto_judge boolean not null default false,
  host_token_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.players (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  name_key text not null,
  role text,
  is_alive boolean not null default true,
  is_host boolean not null default false,
  is_connected boolean not null default true,
  last_seen_at timestamptz not null default timezone('utc', now()),
  joined_at timestamptz not null default timezone('utc', now()),
  player_token_hash text
);

create unique index if not exists players_room_name_key_key on public.players (room_id, name_key);
create index if not exists players_room_joined_at_idx on public.players (room_id, joined_at);
create index if not exists players_room_last_seen_idx on public.players (room_id, last_seen_at);

create or replace function public.app_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists admin_users_email_key on public.admin_users ((lower(email)));

create table if not exists public.app_devices (
  device_id text primary key,
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_room_id text,
  last_player_name text
);

create index if not exists app_devices_last_seen_idx on public.app_devices (last_seen_at desc);

create table if not exists public.app_usage_events (
  id bigint generated always as identity primary key,
  device_id text not null references public.app_devices(device_id) on delete cascade,
  event_type text not null,
  room_id text,
  player_id text,
  player_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_usage_events_created_idx on public.app_usage_events (created_at desc);
create index if not exists app_usage_events_type_idx on public.app_usage_events (event_type, created_at desc);
create index if not exists app_usage_events_room_idx on public.app_usage_events (room_id, created_at desc);
create index if not exists app_usage_events_device_idx on public.app_usage_events (device_id, created_at desc);

create table if not exists public.feedback_messages (
  id bigint generated always as identity primary key,
  device_id text not null references public.app_devices(device_id) on delete cascade,
  room_id text,
  player_name text,
  contact text,
  content text not null,
  status text not null default 'new' check (status in ('new', 'processing', 'done', 'ignored')),
  admin_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists feedback_messages_status_idx on public.feedback_messages (status, created_at desc);
create index if not exists feedback_messages_created_idx on public.feedback_messages (created_at desc);

drop trigger if exists feedback_messages_set_updated_at on public.feedback_messages;

create trigger feedback_messages_set_updated_at
before update on public.feedback_messages
for each row
execute function public.app_set_updated_at();

create or replace function public.app_require_admin()
returns public.admin_users
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_admin public.admin_users;
begin
  if auth.uid() is null then
    raise exception '请先登录管理员账号';
  end if;

  select * into v_admin
  from public.admin_users
  where user_id = auth.uid();

  if not found then
    raise exception '没有管理员权限';
  end if;

  return v_admin;
end;
$$;

create or replace function public.app_track_event(
  p_device_id text,
  p_event_type text,
  p_room_id text default null,
  p_player_id text default null,
  p_player_name text default null,
  p_payload jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id text := trim(coalesce(p_device_id, ''));
  v_event_type text := trim(coalesce(p_event_type, ''));
  v_player_name text := nullif(trim(coalesce(p_player_name, '')), '');
begin
  if v_device_id = '' then
    raise exception '设备标识不能为空';
  end if;

  if v_event_type = '' then
    raise exception '事件类型不能为空';
  end if;

  insert into public.app_devices as d (
    device_id,
    first_seen_at,
    last_seen_at,
    last_room_id,
    last_player_name
  ) values (
    v_device_id,
    timezone('utc', now()),
    timezone('utc', now()),
    nullif(trim(coalesce(p_room_id, '')), ''),
    v_player_name
  )
  on conflict (device_id) do update
  set last_seen_at = timezone('utc', now()),
      last_room_id = coalesce(excluded.last_room_id, d.last_room_id),
      last_player_name = coalesce(excluded.last_player_name, d.last_player_name);

  insert into public.app_usage_events (
    device_id,
    event_type,
    room_id,
    player_id,
    player_name,
    payload,
    created_at
  ) values (
    v_device_id,
    v_event_type,
    nullif(trim(coalesce(p_room_id, '')), ''),
    nullif(trim(coalesce(p_player_id, '')), ''),
    v_player_name,
    coalesce(p_payload, '{}'::jsonb),
    timezone('utc', now())
  );

  return true;
end;
$$;

create or replace function public.app_submit_feedback(
  p_device_id text,
  p_player_name text default null,
  p_room_id text default null,
  p_contact text default null,
  p_content text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text := trim(coalesce(p_content, ''));
  v_feedback public.feedback_messages;
begin
  if v_content = '' then
    raise exception '建议内容不能为空';
  end if;

  perform public.app_track_event(
    p_device_id,
    'feedback_submitted',
    p_room_id,
    null,
    p_player_name,
    jsonb_build_object('contact', nullif(trim(coalesce(p_contact, '')), ''))
  );

  insert into public.feedback_messages (
    device_id,
    room_id,
    player_name,
    contact,
    content,
    status
  ) values (
    trim(coalesce(p_device_id, '')),
    nullif(trim(coalesce(p_room_id, '')), ''),
    nullif(trim(coalesce(p_player_name, '')), ''),
    nullif(trim(coalesce(p_contact, '')), ''),
    v_content,
    'new'
  )
  returning * into v_feedback;

  return to_jsonb(v_feedback);
end;
$$;

create or replace function public.admin_get_me()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin public.admin_users;
begin
  v_admin := public.app_require_admin();

  return jsonb_build_object(
    'user_id', v_admin.user_id,
    'email', v_admin.email,
    'role', v_admin.role
  );
end;
$$;

create or replace function public.admin_get_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin public.admin_users;
begin
  v_admin := public.app_require_admin();

  return jsonb_build_object(
    'total_devices', (select count(*) from public.app_devices),
    'active_devices_7d', (
      select count(*)
      from public.app_devices
      where last_seen_at >= timezone('utc', now()) - interval '7 days'
    ),
    'total_rooms', (select count(*) from public.rooms),
    'games_started', (
      select count(*)
      from public.rooms
      where status in ('playing', 'ended')
    ),
    'games_ended', (
      select count(*)
      from public.rooms
      where status = 'ended'
    ),
    'total_feedback', (select count(*) from public.feedback_messages),
    'pending_feedback', (
      select count(*)
      from public.feedback_messages
      where status in ('new', 'processing')
    ),
    'total_join_events', (
      select count(*)
      from public.app_usage_events
      where event_type = 'room_joined'
    ),
    'trend', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', to_char(d.day, 'YYYY-MM-DD'),
          'rooms_created', coalesce(r.rooms_created, 0),
          'games_started', coalesce(g.games_started, 0),
          'feedback_count', coalesce(f.feedback_count, 0),
          'active_devices', coalesce(a.active_devices, 0)
        )
        order by d.day
      )
      from (
        select generate_series(
          current_date - interval '13 days',
          current_date,
          interval '1 day'
        )::date as day
      ) d
      left join (
        select date(created_at) as day, count(*) as rooms_created
        from public.rooms
        group by 1
      ) r on r.day = d.day
      left join (
        select date(created_at) as day, count(*) as games_started
        from public.rooms
        where status in ('playing', 'ended')
        group by 1
      ) g on g.day = d.day
      left join (
        select date(created_at) as day, count(*) as feedback_count
        from public.feedback_messages
        group by 1
      ) f on f.day = d.day
      left join (
        select date(created_at) as day, count(distinct device_id) as active_devices
        from public.app_usage_events
        group by 1
      ) a on a.day = d.day
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_list_feedback(
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin public.admin_users;
begin
  v_admin := public.app_require_admin();

  if p_status is not null and p_status not in ('new', 'processing', 'done', 'ignored') then
    raise exception '无效的建议状态';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(f) order by f.created_at desc)
    from public.feedback_messages f
    where p_status is null or f.status = p_status
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_update_feedback(
  p_feedback_id bigint,
  p_status text,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin public.admin_users;
  v_feedback public.feedback_messages;
begin
  v_admin := public.app_require_admin();

  if p_status not in ('new', 'processing', 'done', 'ignored') then
    raise exception '无效的建议状态';
  end if;

  update public.feedback_messages
  set status = p_status,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), '')
  where id = p_feedback_id
  returning * into v_feedback;

  if not found then
    raise exception '建议不存在';
  end if;

  return to_jsonb(v_feedback);
end;
$$;

alter table public.admin_users enable row level security;
alter table public.app_devices enable row level security;
alter table public.app_usage_events enable row level security;
alter table public.feedback_messages enable row level security;

revoke all on public.admin_users from anon, authenticated;
revoke all on public.app_devices from anon, authenticated;
revoke all on public.app_usage_events from anon, authenticated;
revoke all on public.feedback_messages from anon, authenticated;

grant execute on function public.app_track_event(text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.app_submit_feedback(text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_get_me() to authenticated;
grant execute on function public.admin_get_dashboard_summary() to authenticated;
grant execute on function public.admin_list_feedback(text) to authenticated;
grant execute on function public.admin_update_feedback(bigint, text, text) to authenticated;

notify pgrst, 'reload schema';

notify pgrst, 'reload schema';

drop trigger if exists rooms_set_updated_at on public.rooms;

create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute function public.app_set_updated_at();

create or replace function public.app_room_json(p_room public.rooms)
returns jsonb
language sql
stable
as $$
  select to_jsonb(p_room) - 'host_token_hash'
$$;

create or replace function public.app_player_json(p_player public.players, p_show_role boolean)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', p_player.id,
    'room_id', p_player.room_id,
    'name', p_player.name,
    'role', case when p_show_role then p_player.role else null end,
    'is_alive', p_player.is_alive,
    'is_host', p_player.is_host,
    'is_connected', p_player.is_connected,
    'last_seen_at', p_player.last_seen_at,
    'joined_at', p_player.joined_at
  )
$$;

create or replace function public.app_create_room(
  p_room_id text,
  p_host_id text,
  p_host_name text,
  p_player_count integer,
  p_roles jsonb,
  p_enable_sheriff boolean,
  p_win_mode text,
  p_enable_auto_judge boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_player public.players;
  v_host_token text := public.app_generate_token();
  v_player_token text := public.app_generate_token();
  v_host_is_host boolean := not coalesce(p_enable_auto_judge, false);
  v_name text := trim(coalesce(p_host_name, ''));
begin
  if v_name = '' then
    raise exception '房主昵称不能为空';
  end if;

  insert into public.rooms (
    id,
    host_id,
    player_count,
    roles,
    status,
    current_phase,
    enable_sheriff,
    current_round,
    sheriff_id,
    sheriff_torn,
    win_mode,
    game_result,
    game_state,
    night_actions,
    enable_auto_judge,
    host_token_hash
  ) values (
    p_room_id,
    p_host_id,
    p_player_count,
    coalesce(p_roles, '[]'::jsonb),
    'waiting',
    'night',
    coalesce(p_enable_sheriff, true),
    1,
    null,
    false,
    coalesce(p_win_mode, 'side'),
    null,
    null,
    '[]'::jsonb,
    coalesce(p_enable_auto_judge, false),
    public.app_token_hash(v_host_token)
  )
  returning * into v_room;

  insert into public.players (
    id,
    room_id,
    name,
    name_key,
    role,
    is_alive,
    is_host,
    is_connected,
    last_seen_at,
    joined_at,
    player_token_hash
  ) values (
    p_host_id,
    p_room_id,
    v_name,
    public.app_name_key(v_name),
    null,
    true,
    v_host_is_host,
    true,
    timezone('utc', now()),
    timezone('utc', now()),
    public.app_token_hash(v_player_token)
  )
  returning * into v_player;

  return jsonb_build_object(
    'room', public.app_room_json(v_room),
    'player', public.app_player_json(v_player, true),
    'host_token', v_host_token,
    'player_token', v_player_token
  );
exception
  when unique_violation then
    raise exception '房间号已存在，请重试';
end;
$$;

create or replace function public.app_join_room(
  p_room_id text,
  p_player_name text,
  p_existing_player_id text default null,
  p_existing_player_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_player public.players;
  v_existing public.players;
  v_name_player public.players;
  v_player_token text := public.app_generate_token();
  v_name text := trim(coalesce(p_player_name, ''));
  v_name_key text := public.app_name_key(trim(coalesce(p_player_name, '')));
  v_game_player_count integer;
begin
  if v_name = '' then
    raise exception '昵称不能为空';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception '房间不存在，请检查房间号';
  end if;

  if p_existing_player_id is not null and p_existing_player_token is not null then
    select * into v_existing
    from public.players
    where room_id = p_room_id
      and id = p_existing_player_id
      and player_token_hash = public.app_token_hash(p_existing_player_token)
    for update;

    if found then
      update public.players
      set is_connected = true,
          last_seen_at = timezone('utc', now())
      where id = v_existing.id
      returning * into v_player;

      return jsonb_build_object(
        'room', public.app_room_json(v_room),
        'player', public.app_player_json(v_player, v_player.id = v_room.host_id),
        'player_token', p_existing_player_token,
        'restored', true,
        'reclaimed', false
      );
    end if;
  end if;

  select * into v_name_player
  from public.players
  where room_id = p_room_id
    and name_key = v_name_key
  for update;

  if found then
    if coalesce(v_name_player.is_connected, false)
      and coalesce(v_name_player.last_seen_at, timezone('utc', now())) > timezone('utc', now()) - interval '2 minutes'
    then
      raise exception '该昵称已在房间中使用，请换一个昵称';
    end if;

    update public.players
    set name = v_name,
        name_key = v_name_key,
        is_connected = true,
        last_seen_at = timezone('utc', now()),
        player_token_hash = public.app_token_hash(v_player_token)
    where id = v_name_player.id
    returning * into v_player;

    return jsonb_build_object(
      'room', public.app_room_json(v_room),
      'player', public.app_player_json(v_player, v_player.id = v_room.host_id),
      'player_token', v_player_token,
      'restored', false,
      'reclaimed', true
    );
  end if;

  if v_room.status <> 'waiting' then
    raise exception '游戏已经开始，无法以新身份加入';
  end if;

  select count(*)
  into v_game_player_count
  from public.players
  where room_id = p_room_id
    and is_host = false;

  if v_game_player_count >= v_room.player_count then
    raise exception '房间已满，请联系法官调整玩家后重试';
  end if;

  insert into public.players (
    id,
    room_id,
    name,
    name_key,
    role,
    is_alive,
    is_host,
    is_connected,
    last_seen_at,
    joined_at,
    player_token_hash
  ) values (
    'player_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 9),
    p_room_id,
    v_name,
    v_name_key,
    null,
    true,
    false,
    true,
    timezone('utc', now()),
    timezone('utc', now()),
    public.app_token_hash(v_player_token)
  )
  returning * into v_player;

  return jsonb_build_object(
    'room', public.app_room_json(v_room),
    'player', public.app_player_json(v_player, false),
    'player_token', v_player_token,
    'restored', false,
    'reclaimed', false
  );
end;
$$;

create or replace function public.app_restore_player_session(
  p_room_id text,
  p_player_id text,
  p_player_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_player public.players;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id;

  if not found then
    raise exception '房间不存在，请检查房间号';
  end if;

  select * into v_player
  from public.players
  where room_id = p_room_id
    and id = p_player_id
    and player_token_hash = public.app_token_hash(p_player_token)
  for update;

  if not found then
    raise exception '玩家身份已失效，请重新加入房间';
  end if;

  update public.players
  set is_connected = true,
      last_seen_at = timezone('utc', now())
  where id = v_player.id
  returning * into v_player;

  return jsonb_build_object(
    'room', public.app_room_json(v_room),
    'player', public.app_player_json(v_player, v_player.id = v_room.host_id),
    'player_token', p_player_token,
    'restored', true,
    'reclaimed', false
  );
end;
$$;

create or replace function public.app_touch_player_session(
  p_room_id text,
  p_player_id text,
  p_player_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
  set is_connected = true,
      last_seen_at = timezone('utc', now())
  where room_id = p_room_id
    and id = p_player_id
    and player_token_hash = public.app_token_hash(p_player_token);

  return found;
end;
$$;

create or replace function public.app_set_player_connection(
  p_room_id text,
  p_player_id text,
  p_player_token text,
  p_is_connected boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
  set is_connected = coalesce(p_is_connected, false),
      last_seen_at = timezone('utc', now())
  where room_id = p_room_id
    and id = p_player_id
    and player_token_hash = public.app_token_hash(p_player_token);

  return found;
end;
$$;

create or replace function public.app_get_room_snapshot(
  p_room_id text,
  p_player_id text default null,
  p_player_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_actor public.players;
  v_is_host boolean := false;
  v_players jsonb := '[]'::jsonb;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id;

  if not found then
    raise exception '房间不存在，请检查房间号';
  end if;

  if p_player_id is not null and p_player_token is not null then
    select * into v_actor
    from public.players
    where room_id = p_room_id
      and id = p_player_id
      and player_token_hash = public.app_token_hash(p_player_token);

    if found then
      v_is_host := v_actor.id = v_room.host_id;
    end if;
  end if;

  select coalesce(
    jsonb_agg(
      public.app_player_json(
        p,
        v_is_host or (v_actor.id is not null and p.id = v_actor.id)
      )
      order by p.joined_at
    ),
    '[]'::jsonb
  )
  into v_players
  from public.players p
  where p.room_id = p_room_id;

  return jsonb_build_object(
    'room', public.app_room_json(v_room),
    'players', v_players
  );
end;
$$;

create or replace function public.app_host_add_player(
  p_room_id text,
  p_host_token text,
  p_player_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_player public.players;
  v_name text := trim(coalesce(p_player_name, ''));
  v_name_key text := public.app_name_key(trim(coalesce(p_player_name, '')));
  v_game_player_count integer;
begin
  if v_name = '' then
    raise exception '玩家昵称不能为空';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id
    and host_token_hash = public.app_token_hash(p_host_token)
  for update;

  if not found then
    raise exception '房主身份已失效，请重新进入房间';
  end if;

  if v_room.status <> 'waiting' then
    raise exception '游戏已经开始，不能继续添加新玩家';
  end if;

  if exists (
    select 1
    from public.players
    where room_id = p_room_id
      and name_key = v_name_key
  ) then
    raise exception '该昵称已在房间中使用，请换一个昵称';
  end if;

  select count(*)
  into v_game_player_count
  from public.players
  where room_id = p_room_id
    and is_host = false;

  if v_game_player_count >= v_room.player_count then
    raise exception '房间已满，请联系法官调整玩家后重试';
  end if;

  insert into public.players (
    id,
    room_id,
    name,
    name_key,
    role,
    is_alive,
    is_host,
    is_connected,
    last_seen_at,
    joined_at,
    player_token_hash
  ) values (
    'player_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 9),
    p_room_id,
    v_name,
    v_name_key,
    null,
    true,
    false,
    false,
    timezone('utc', now()),
    timezone('utc', now()),
    null
  )
  returning * into v_player;

  return public.app_player_json(v_player, false);
end;
$$;

create or replace function public.app_update_room(
  p_room_id text,
  p_host_token text,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  update public.rooms
  set status = coalesce(nullif(p_patch->>'status', ''), status),
      current_phase = coalesce(nullif(p_patch->>'current_phase', ''), current_phase),
      enable_sheriff = case when p_patch ? 'enable_sheriff' then coalesce((p_patch->>'enable_sheriff')::boolean, enable_sheriff) else enable_sheriff end,
      current_round = case when p_patch ? 'current_round' then coalesce((p_patch->>'current_round')::integer, current_round) else current_round end,
      sheriff_id = case when p_patch ? 'sheriff_id' then nullif(p_patch->>'sheriff_id', '') else sheriff_id end,
      sheriff_torn = case when p_patch ? 'sheriff_torn' then coalesce((p_patch->>'sheriff_torn')::boolean, sheriff_torn) else sheriff_torn end,
      win_mode = coalesce(nullif(p_patch->>'win_mode', ''), win_mode),
      game_result = case when p_patch ? 'game_result' then p_patch->'game_result' else game_result end,
      game_state = case when p_patch ? 'game_state' then p_patch->'game_state' else game_state end,
      night_actions = case when p_patch ? 'night_actions' then p_patch->'night_actions' else night_actions end,
      enable_auto_judge = case when p_patch ? 'enable_auto_judge' then coalesce((p_patch->>'enable_auto_judge')::boolean, enable_auto_judge) else enable_auto_judge end
  where id = p_room_id
    and host_token_hash = public.app_token_hash(p_host_token)
  returning * into v_room;

  if not found then
    raise exception '房主身份已失效，请重新进入房间';
  end if;

  return public.app_room_json(v_room);
end;
$$;

create or replace function public.app_host_batch_assign_roles(
  p_room_id text,
  p_host_token text,
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_item jsonb;
  v_players jsonb := '[]'::jsonb;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id
    and host_token_hash = public.app_token_hash(p_host_token);

  if not found then
    raise exception '房主身份已失效，请重新进入房间';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb))
  loop
    update public.players
    set role = nullif(v_item->>'role', '')
    where room_id = p_room_id
      and id = v_item->>'playerId';
  end loop;

  select coalesce(
    jsonb_agg(public.app_player_json(p, true) order by p.joined_at),
    '[]'::jsonb
  )
  into v_players
  from public.players p
  where p.room_id = p_room_id;

  return v_players;
end;
$$;

create or replace function public.app_update_player(
  p_room_id text,
  p_target_player_id text,
  p_patch jsonb,
  p_player_id text default null,
  p_player_token text default null,
  p_host_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_actor public.players;
  v_target public.players;
  v_is_host boolean := false;
  v_name text;
  v_name_key text;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id;

  if not found then
    raise exception '房间不存在，请检查房间号';
  end if;

  if p_host_token is not null then
    select * into v_room
    from public.rooms
    where id = p_room_id
      and host_token_hash = public.app_token_hash(p_host_token);

    if found then
      v_is_host := true;
    end if;
  end if;

  if not v_is_host and p_player_id is not null and p_player_token is not null then
    select * into v_actor
    from public.players
    where room_id = p_room_id
      and id = p_player_id
      and player_token_hash = public.app_token_hash(p_player_token);
  end if;

  select * into v_target
  from public.players
  where room_id = p_room_id
    and id = p_target_player_id
  for update;

  if not found then
    raise exception '玩家不存在';
  end if;

  if not v_is_host and v_actor.id is distinct from v_target.id then
    raise exception '没有权限修改该玩家';
  end if;

  if p_patch ? 'name' then
    v_name := trim(coalesce(p_patch->>'name', ''));
    if v_name = '' then
      raise exception '昵称不能为空';
    end if;
    v_name_key := public.app_name_key(v_name);

    if exists (
      select 1
      from public.players
      where room_id = p_room_id
        and name_key = v_name_key
        and id <> p_target_player_id
    ) then
      raise exception '该昵称已在房间中使用，请换一个昵称';
    end if;

    v_target.name := v_name;
    v_target.name_key := v_name_key;
  end if;

  if p_patch ? 'role' then
    if not v_is_host then
      raise exception '只有房主可以修改角色';
    end if;
    v_target.role := nullif(p_patch->>'role', '');
  end if;

  if p_patch ? 'is_alive' then
    if not v_is_host then
      raise exception '只有房主可以修改存活状态';
    end if;
    v_target.is_alive := coalesce((p_patch->>'is_alive')::boolean, v_target.is_alive);
  end if;

  if p_patch ? 'is_connected' then
    if not v_is_host and v_actor.id is distinct from v_target.id then
      raise exception '只有本人可以修改连接状态';
    end if;
    v_target.is_connected := coalesce((p_patch->>'is_connected')::boolean, v_target.is_connected);
  end if;

  v_target.last_seen_at := timezone('utc', now());

  update public.players
  set name = v_target.name,
      name_key = v_target.name_key,
      role = v_target.role,
      is_alive = v_target.is_alive,
      is_connected = v_target.is_connected,
      last_seen_at = v_target.last_seen_at
  where id = v_target.id
  returning * into v_target;

  return public.app_player_json(v_target, v_is_host or v_target.id = p_player_id or v_target.id = v_room.host_id);
end;
$$;

create or replace function public.app_host_remove_player(
  p_room_id text,
  p_host_token text,
  p_player_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id
    and host_token_hash = public.app_token_hash(p_host_token);

  if not found then
    raise exception '房主身份已失效，请重新进入房间';
  end if;

  if p_player_id = v_room.host_id then
    raise exception '不能移除房主';
  end if;

  delete from public.players
  where room_id = p_room_id
    and id = p_player_id;

  return found;
end;
$$;

alter table public.rooms enable row level security;
alter table public.players enable row level security;

revoke all on public.rooms from anon, authenticated;
revoke all on public.players from anon, authenticated;

grant execute on function public.app_create_room(text, text, text, integer, jsonb, boolean, text, boolean) to anon, authenticated;
grant execute on function public.app_join_room(text, text, text, text) to anon, authenticated;
grant execute on function public.app_restore_player_session(text, text, text) to anon, authenticated;
grant execute on function public.app_touch_player_session(text, text, text) to anon, authenticated;
grant execute on function public.app_set_player_connection(text, text, text, boolean) to anon, authenticated;
grant execute on function public.app_get_room_snapshot(text, text, text) to anon, authenticated;
grant execute on function public.app_host_add_player(text, text, text) to anon, authenticated;
grant execute on function public.app_update_room(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_host_batch_assign_roles(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_update_player(text, text, jsonb, text, text, text) to anon, authenticated;
grant execute on function public.app_host_remove_player(text, text, text) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.rooms;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.players;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;
