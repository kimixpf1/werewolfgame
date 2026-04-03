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

-- 把这里替换成你的管理员登录邮箱，执行一次即可授予后台权限。
insert into public.admin_users (user_id, email, role)
select id, email, 'admin'
from auth.users
where email in ('xpf@example.com', 'admin@example.com')
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role;

notify pgrst, 'reload schema';
