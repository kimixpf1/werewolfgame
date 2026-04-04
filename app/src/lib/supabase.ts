import { createClient } from '@supabase/supabase-js';
import type {
  AdminDashboardSummary,
  AdminProfile,
  FeedbackMessage,
  FeedbackStatus,
  LocalPlayerInfo,
  Player,
  Room,
  RoomStatus,
} from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ejeiuqcmkznfbglvbkbe.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZWl1cWNta3puZmJnbHZia2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODU4NzIsImV4cCI6MjA4NzE2MTg3Mn0.NfmTSA9DhuP51XKF0qfTuPINtSc7i26u5yIbl69cdAg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'werewolf_admin_auth',
  },
});

const DEVICE_STORAGE_KEY = 'werewolf_device_id';

type RoomConfig = {
  enable_sheriff: boolean;
  win_mode: 'city' | 'side';
  enable_auto_judge: boolean;
};

type SessionLike = Pick<LocalPlayerInfo, 'playerId' | 'playerToken'> & Partial<Pick<LocalPlayerInfo, 'hostToken' | 'roomId'>>;

type SnapshotPayload = {
  room: any;
  players: any[];
};

type CreateRoomPayload = {
  room: any;
  player: any;
  player_token: string;
  host_token: string;
};

type JoinRoomPayload = {
  room: any;
  player: any;
  player_token: string;
  reclaimed?: boolean;
  restored?: boolean;
};

type AdminMePayload = {
  user_id: string;
  email: string;
  role: 'admin' | 'viewer';
};

type AdminDashboardPayload = {
  total_devices: number;
  active_devices_7d: number;
  total_rooms: number;
  games_started: number;
  games_ended: number;
  total_feedback: number;
  unread_feedback: number;
  read_feedback: number;
  pending_feedback: number;
  processing_feedback: number;
  resolved_feedback: number;
  total_join_events: number;
  trend: Array<{
    date: string;
    rooms_created: number;
    games_started: number;
    feedback_count: number;
    active_devices: number;
  }>;
};

function cloneError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : '联机服务暂不可用，请稍后重试');
}

function normalizeRoom(raw: any): Room & Record<string, any> {
  return {
    id: raw.id,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
    status: raw.status || 'waiting',
    player_count: raw.player_count || 0,
    host_id: raw.host_id || '',
    current_phase: raw.current_phase || 'night',
    roles: Array.isArray(raw.roles) ? raw.roles : [],
    enable_sheriff: raw.enable_sheriff ?? true,
    current_round: raw.current_round || 1,
    sheriff_id: raw.sheriff_id ?? null,
    sheriff_torn: raw.sheriff_torn ?? false,
    win_mode: raw.win_mode || 'side',
    game_state: raw.game_state ?? null,
    night_actions: Array.isArray(raw.night_actions) ? raw.night_actions : [],
    enable_auto_judge: !!raw.enable_auto_judge,
    game_result: raw.game_result ?? null,
    ...raw,
  };
}

function normalizePlayer(raw: any): Player {
  return {
    id: raw.id,
    room_id: raw.room_id,
    name: raw.name || '',
    role: raw.role || undefined,
    is_host: !!raw.is_host,
    is_alive: raw.is_alive ?? true,
    joined_at: raw.joined_at || raw.created_at || new Date().toISOString(),
    is_connected: raw.is_connected ?? true,
    last_seen_at: raw.last_seen_at ?? null,
  };
}

function normalizeSnapshot(payload: SnapshotPayload | null) {
  const room = payload?.room ? normalizeRoom(payload.room) : null;
  const players = Array.isArray(payload?.players)
    ? payload.players.map(normalizePlayer).sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    : [];

  if (room) {
    saveRoomConfigLocally(room);
  }

  return { room, players };
}

function normalizeFeedback(raw: any): FeedbackMessage {
  return {
    id: Number(raw.id),
    device_id: raw.device_id,
    room_id: raw.room_id ?? null,
    player_name: raw.player_name ?? null,
    contact: raw.contact ?? null,
    content: raw.content ?? '',
    status: raw.status ?? 'new',
    is_read: !!raw.is_read,
    admin_note: raw.admin_note ?? null,
    read_at: raw.read_at ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function normalizeAdminProfile(raw: any): AdminProfile {
  return {
    user_id: raw.user_id,
    email: raw.email ?? '',
    role: raw.role === 'viewer' ? 'viewer' : 'admin',
  };
}

function normalizeDashboard(raw: any): AdminDashboardSummary {
  return {
    total_devices: Number(raw.total_devices ?? 0),
    active_devices_7d: Number(raw.active_devices_7d ?? 0),
    total_rooms: Number(raw.total_rooms ?? 0),
    games_started: Number(raw.games_started ?? 0),
    games_ended: Number(raw.games_ended ?? 0),
    total_feedback: Number(raw.total_feedback ?? 0),
    unread_feedback: Number(raw.unread_feedback ?? 0),
    read_feedback: Number(raw.read_feedback ?? 0),
    pending_feedback: Number(raw.pending_feedback ?? 0),
    processing_feedback: Number(raw.processing_feedback ?? 0),
    resolved_feedback: Number(raw.resolved_feedback ?? 0),
    total_join_events: Number(raw.total_join_events ?? 0),
    trend: Array.isArray(raw.trend)
      ? raw.trend.map((item: any) => ({
          date: item.date,
          rooms_created: Number(item.rooms_created ?? 0),
          games_started: Number(item.games_started ?? 0),
          feedback_count: Number(item.feedback_count ?? 0),
          active_devices: Number(item.active_devices ?? 0),
        }))
      : [],
  };
}

function saveRoomConfigLocally(room: Partial<Room> & Record<string, any>) {
  if (typeof localStorage === 'undefined' || !room.id) {
    return;
  }

  const roomConfig: RoomConfig = {
    enable_sheriff: room.enable_sheriff ?? true,
    win_mode: room.win_mode === 'city' ? 'city' : 'side',
    enable_auto_judge: !!room.enable_auto_judge,
  };

  localStorage.setItem(`room_config_${room.id}`, JSON.stringify(roomConfig));
}

function sessionParams(session?: Partial<SessionLike> | null) {
  return {
    p_player_id: session?.playerId ?? null,
    p_player_token: session?.playerToken ?? null,
  };
}

async function invokeRpc<T>(fn: string, params: Record<string, unknown>): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc(fn, params);

    if (error) {
      return { data: null, error: cloneError(error.message || error) };
    }

    return { data: (data ?? null) as T | null, error: null };
  } catch (error) {
    return { data: null, error: cloneError(error) };
  }
}

export function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const value =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(DEVICE_STORAGE_KEY, value);
  return value;
}

export function getRoomConfig(roomId: string): { enable_sheriff: boolean; win_mode: 'city' | 'side'; enable_auto_judge: boolean } {
  try {
    const saved = localStorage.getItem(`room_config_${roomId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load room config:', error);
  }

  return {
    enable_sheriff: true,
    win_mode: 'side',
    enable_auto_judge: false,
  };
}

export async function createRoom(
  roomId: string,
  hostId: string,
  hostName: string,
  playerCount: number,
  roles: any[],
  enableSheriff: boolean = true,
  winMode: 'city' | 'side' = 'side',
  enableAutoJudge: boolean = false
): Promise<{ data: { room: Room; player: Player; playerToken: string; hostToken: string } | null; error: any }> {
  const { data, error } = await invokeRpc<CreateRoomPayload>('app_create_room', {
    p_room_id: roomId,
    p_host_id: hostId,
    p_host_name: hostName.trim(),
    p_player_count: playerCount,
    p_roles: roles,
    p_enable_sheriff: enableSheriff,
    p_win_mode: winMode,
    p_enable_auto_judge: enableAutoJudge,
  });

  if (error || !data) {
    return { data: null, error };
  }

  const room = normalizeRoom(data.room);
  const player = normalizePlayer(data.player);
  saveRoomConfigLocally(room);

  return {
    data: {
      room,
      player,
      playerToken: data.player_token,
      hostToken: data.host_token,
    },
    error: null,
  };
}

export async function joinRoom(
  roomId: string,
  playerName: string,
  existingSession?: Partial<SessionLike> | null
): Promise<{ data: { room: Room; player: Player; playerToken: string; reclaimed: boolean; restored: boolean } | null; error: any }> {
  const { data, error } = await invokeRpc<JoinRoomPayload>('app_join_room', {
    p_room_id: roomId,
    p_player_name: playerName.trim(),
    p_existing_player_id: existingSession?.playerId ?? null,
    p_existing_player_token: existingSession?.playerToken ?? null,
  });

  if (error || !data) {
    return { data: null, error };
  }

  const room = normalizeRoom(data.room);
  const player = normalizePlayer(data.player);
  saveRoomConfigLocally(room);

  return {
    data: {
      room,
      player,
      playerToken: data.player_token,
      reclaimed: !!data.reclaimed,
      restored: !!data.restored,
    },
    error: null,
  };
}

export async function restorePlayerSession(
  session: Pick<LocalPlayerInfo, 'roomId' | 'playerId' | 'playerToken'>
): Promise<{ data: { room: Room; player: Player } | null; error: any }> {
  const { data, error } = await invokeRpc<JoinRoomPayload>('app_restore_player_session', {
    p_room_id: session.roomId,
    p_player_id: session.playerId,
    p_player_token: session.playerToken,
  });

  if (error || !data) {
    return { data: null, error };
  }

  const room = normalizeRoom(data.room);
  const player = normalizePlayer(data.player);
  saveRoomConfigLocally(room);

  return {
    data: { room, player },
    error: null,
  };
}

export async function touchPlayerSession(
  session: Pick<LocalPlayerInfo, 'roomId' | 'playerId' | 'playerToken'>
): Promise<{ data: boolean; error: any }> {
  const { error } = await invokeRpc<boolean>('app_touch_player_session', {
    p_room_id: session.roomId,
    p_player_id: session.playerId,
    p_player_token: session.playerToken,
  });

  return { data: !error, error };
}

export async function markPlayerDisconnected(
  session: Pick<LocalPlayerInfo, 'roomId' | 'playerId' | 'playerToken'>
): Promise<{ data: boolean; error: any }> {
  const { error } = await invokeRpc<boolean>('app_set_player_connection', {
    p_room_id: session.roomId,
    p_player_id: session.playerId,
    p_player_token: session.playerToken,
    p_is_connected: false,
  });

  return { data: !error, error };
}

export async function getRoom(roomId: string, session?: Partial<SessionLike> | null): Promise<{ data: Room | null; error: any }> {
  const { data, error } = await invokeRpc<SnapshotPayload>('app_get_room_snapshot', {
    p_room_id: roomId,
    ...sessionParams(session),
  });

  if (error) {
    return { data: null, error };
  }

  const snapshot = normalizeSnapshot(data);
  return { data: snapshot.room, error: snapshot.room ? null : new Error('房间不存在') };
}

export async function getRoomSnapshot(
  roomId: string,
  session?: Partial<SessionLike> | null
): Promise<{ data: { room: Room; players: Player[] } | null; error: any }> {
  const { data, error } = await invokeRpc<SnapshotPayload>('app_get_room_snapshot', {
    p_room_id: roomId,
    ...sessionParams(session),
  });

  if (error || !data) {
    return { data: null, error };
  }

  const snapshot = normalizeSnapshot(data);
  if (!snapshot.room) {
    return { data: null, error: new Error('房间不存在') };
  }

  return {
    data: {
      room: snapshot.room,
      players: snapshot.players,
    },
    error: null,
  };
}

export async function addPlayer(
  roomId: string,
  hostToken: string,
  name: string
): Promise<{ data: Player | null; error: any }> {
  const { data, error } = await invokeRpc<any>('app_host_add_player', {
    p_room_id: roomId,
    p_host_token: hostToken,
    p_player_name: name.trim(),
  });

  return {
    data: data ? normalizePlayer(data) : null,
    error,
  };
}

export async function updateRoomStatus(
  roomId: string,
  hostToken: string,
  status: RoomStatus
): Promise<{ data: Room | null; error: any }> {
  return updateRoom(roomId, hostToken, { status });
}

export async function updateGameResult(
  roomId: string,
  hostToken: string,
  winner: 'good' | 'evil',
  reason: string
): Promise<{ data: Room | null; error: any }> {
  return updateRoom(roomId, hostToken, {
    game_result: {
      winner,
      reason,
      ended_at: new Date().toISOString(),
    },
  });
}

export async function updateRoom(
  roomId: string,
  hostToken: string,
  updates: Partial<Room> & Record<string, any>
): Promise<{ data: Room | null; error: any }> {
  const { data, error } = await invokeRpc<any>('app_update_room', {
    p_room_id: roomId,
    p_host_token: hostToken,
    p_patch: updates,
  });

  const room = data ? normalizeRoom(data) : null;
  if (room) {
    saveRoomConfigLocally(room);
  }

  return { data: room, error };
}

export async function batchUpdatePlayerRoles(
  roomId: string,
  hostToken: string,
  updates: { playerId: string; role: string }[]
): Promise<{ data: Player[] | null; error: any }> {
  const { data, error } = await invokeRpc<any[]>('app_host_batch_assign_roles', {
    p_room_id: roomId,
    p_host_token: hostToken,
    p_updates: updates,
  });

  return {
    data: Array.isArray(data) ? data.map(normalizePlayer) : null,
    error,
  };
}

async function updatePlayerByActor(
  roomId: string,
  targetPlayerId: string,
  patch: Record<string, unknown>,
  session?: Partial<SessionLike> | null
): Promise<{ data: Player | null; error: any }> {
  const { data, error } = await invokeRpc<any>('app_update_player', {
    p_room_id: roomId,
    p_target_player_id: targetPlayerId,
    p_patch: patch,
    p_player_id: session?.playerId ?? null,
    p_player_token: session?.playerToken ?? null,
    p_host_token: session?.hostToken ?? null,
  });

  return {
    data: data ? normalizePlayer(data) : null,
    error,
  };
}

export async function updatePlayerRole(
  roomId: string,
  hostToken: string,
  playerId: string,
  role: string
): Promise<{ data: Player | null; error: any }> {
  return updatePlayerByActor(roomId, playerId, { role }, { hostToken });
}

export async function updatePlayerAlive(
  roomId: string,
  hostToken: string,
  playerId: string,
  isAlive: boolean
): Promise<{ data: Player | null; error: any }> {
  return updatePlayerByActor(roomId, playerId, { is_alive: isAlive }, { hostToken });
}

export async function updatePlayerName(
  roomId: string,
  session: Pick<LocalPlayerInfo, 'playerId' | 'playerToken'> & Partial<Pick<LocalPlayerInfo, 'hostToken'>>,
  playerId: string,
  name: string
): Promise<{ data: Player | null; error: any }> {
  return updatePlayerByActor(roomId, playerId, { name: name.trim() }, session);
}

export async function removePlayer(
  roomId: string,
  hostToken: string,
  playerId: string
): Promise<{ data: boolean; error: any }> {
  const { error } = await invokeRpc<boolean>('app_host_remove_player', {
    p_room_id: roomId,
    p_host_token: hostToken,
    p_player_id: playerId,
  });

  return { data: !error, error };
}

export async function trackUsageEvent({
  eventType,
  roomId = null,
  playerId = null,
  playerName = null,
  payload = {},
  deviceId = getOrCreateDeviceId(),
}: {
  eventType: string;
  roomId?: string | null;
  playerId?: string | null;
  playerName?: string | null;
  payload?: Record<string, unknown>;
  deviceId?: string;
}): Promise<{ data: boolean; error: any }> {
  const { error } = await invokeRpc<boolean>('app_track_event', {
    p_device_id: deviceId,
    p_event_type: eventType,
    p_room_id: roomId,
    p_player_id: playerId,
    p_player_name: playerName,
    p_payload: payload,
  });

  return { data: !error, error };
}

export async function submitFeedback({
  content,
  playerName = null,
  roomId = null,
  contact = null,
}: {
  content: string;
  playerName?: string | null;
  roomId?: string | null;
  contact?: string | null;
}): Promise<{ data: FeedbackMessage | null; error: any }> {
  const { data, error } = await invokeRpc<any>('app_submit_feedback', {
    p_device_id: getOrCreateDeviceId(),
    p_player_name: playerName,
    p_room_id: roomId,
    p_contact: contact,
    p_content: content.trim(),
  });

  return {
    data: data ? normalizeFeedback(data) : null,
    error,
  };
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<{ data: AdminProfile | null; error: any }> {
  try {
    const rawLogin = email.trim().toLowerCase();
    const normalizedEmail =
      rawLogin.includes('@')
        ? rawLogin
        : rawLogin === 'xpf' || rawLogin === 'admin'
          ? `${rawLogin}@office.local`
          : rawLogin;

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return { data: null, error: cloneError(error.message || error) };
    }

    const profile = await getAdminProfile();
    if (profile.error || !profile.data) {
      await supabase.auth.signOut();
      return { data: null, error: profile.error || new Error('没有管理员权限') };
    }

    return profile;
  } catch (error) {
    return { data: null, error: cloneError(error) };
  }
}

export async function signOutAdmin(): Promise<{ data: boolean; error: any }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { data: !error, error: error ? cloneError(error.message || error) : null };
  } catch (error) {
    return { data: false, error: cloneError(error) };
  }
}

export async function getAdminProfile(): Promise<{ data: AdminProfile | null; error: any }> {
  const { data, error } = await invokeRpc<AdminMePayload>('admin_get_me', {});
  return {
    data: data ? normalizeAdminProfile(data) : null,
    error,
  };
}

export async function getAdminDashboardSummary(): Promise<{ data: AdminDashboardSummary | null; error: any }> {
  const { data, error } = await invokeRpc<AdminDashboardPayload>('admin_get_dashboard_summary', {});
  return {
    data: data ? normalizeDashboard(data) : null,
    error,
  };
}

export async function listFeedbackMessages(
  options: {
    status?: FeedbackStatus | 'all';
    isRead?: boolean | 'all';
  } = {}
): Promise<{ data: FeedbackMessage[] | null; error: any }> {
  const status = options.status ?? 'all';
  const isRead = options.isRead ?? 'all';
  const { data, error } = await invokeRpc<any[]>('admin_list_feedback', {
    p_status: status === 'all' ? null : status,
    p_is_read: isRead === 'all' ? null : isRead,
  });

  return {
    data: Array.isArray(data) ? data.map(normalizeFeedback) : null,
    error,
  };
}

export async function updateFeedbackMessage(
  feedbackId: number,
  status: FeedbackStatus,
  adminNote: string
): Promise<{ data: FeedbackMessage | null; error: any }> {
  const { data, error } = await invokeRpc<any>('admin_update_feedback', {
    p_feedback_id: feedbackId,
    p_status: status,
    p_admin_note: adminNote.trim() || null,
  });

  return {
    data: data ? normalizeFeedback(data) : null,
    error,
  };
}

export async function markFeedbackRead(
  feedbackIds: number[],
  isRead: boolean = true
): Promise<{ data: number | null; error: any }> {
  const { data, error } = await invokeRpc<number>('admin_batch_mark_feedback_read', {
    p_feedback_ids: feedbackIds,
    p_is_read: isRead,
  });

  return {
    data: typeof data === 'number' ? data : Number(data ?? 0),
    error,
  };
}

export async function deleteFeedbackMessage(
  feedbackId: number
): Promise<{ data: boolean; error: any }> {
  const { data, error } = await invokeRpc<boolean>('admin_delete_feedback', {
    p_feedback_id: feedbackId,
  });

  return {
    data: !!data,
    error,
  };
}

export async function batchDeleteFeedbackMessages(
  feedbackIds: number[]
): Promise<{ data: number | null; error: any }> {
  const { data, error } = await invokeRpc<number>('admin_batch_delete_feedback', {
    p_feedback_ids: feedbackIds,
  });

  return {
    data: typeof data === 'number' ? data : Number(data ?? 0),
    error,
  };
}
