import type { Room, Player } from '@/types';

const BACKEND_BASE_URL = 'https://dweet.cc';
const ROOM_THING_PREFIX = 'werewolf-game-room';
const POLL_INTERVAL_MS = 1500;

type RoomConfig = {
  enable_sheriff: boolean;
  win_mode: 'city' | 'side';
  enable_auto_judge: boolean;
};

type RoomStore = {
  room: Room & Record<string, any>;
  players: Player[];
  revision: number;
  updated_at: string;
};

type ChannelHandle = {
  stop: () => void;
};

function roomThingName(roomId: string) {
  return `${ROOM_THING_PREFIX}-${roomId}`;
}

function cloneError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : '联机服务暂不可用，请稍后重试');
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`请求失败 (${response.status})`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    throw new Error(`联机服务不可用：${cloneError(error).message}`);
  }
}

function normalizeRoom(raw: any): Room & Record<string, any> {
  return {
    id: raw.id,
    created_at: raw.created_at || new Date().toISOString(),
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
    joined_at: raw.joined_at || new Date().toISOString(),
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

async function loadStore(roomId: string): Promise<RoomStore | null> {
  const response = await requestJson<any>(`/get/latest/dweet/for/${roomThingName(roomId)}`);
  const latest = Array.isArray(response?.with) ? response.with[0] : null;
  const store = latest?.content?.store ?? latest?.content ?? null;

  if (!store?.room) {
    return null;
  }

  const normalizedStore: RoomStore = {
    room: normalizeRoom(store.room),
    players: Array.isArray(store.players)
      ? store.players.map(normalizePlayer).sort((a: Player, b: Player) => a.joined_at.localeCompare(b.joined_at))
      : [],
    revision: Number.isFinite(store.revision) ? store.revision : 0,
    updated_at: store.updated_at || latest.created || new Date().toISOString(),
  };

  saveRoomConfigLocally(normalizedStore.room);
  return normalizedStore;
}

async function saveStore(roomId: string, store: RoomStore): Promise<RoomStore> {
  const normalizedStore: RoomStore = {
    room: normalizeRoom(store.room),
    players: [...store.players]
      .map(normalizePlayer)
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at)),
    revision: (store.revision || 0) + 1,
    updated_at: new Date().toISOString(),
  };

  await requestJson(`/dweet/for/${roomThingName(roomId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ store: normalizedStore }),
  });

  saveRoomConfigLocally(normalizedStore.room);
  return normalizedStore;
}

async function mutateRoomStore<T>(
  roomId: string,
  updater: (store: RoomStore) => T
): Promise<{ data: T | null; error: any }> {
  try {
    const store = await loadStore(roomId);
    if (!store) {
      return { data: null, error: new Error('房间不存在，请重新创建') };
    }

    const data = updater(store);
    await saveStore(roomId, store);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: cloneError(error) };
  }
}

// 生成随机房间ID (6位数字)
export function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成玩家ID
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function createRoom(
  roomId: string,
  hostId: string, 
  playerCount: number, 
  roles: any[],
  _enableSheriff: boolean = true,
  _winMode: 'city' | 'side' = 'side',
  _enableAutoJudge: boolean = false
): Promise<{ data: Room | null; error: any }> {
  try {
    const existing = await loadStore(roomId);
    if (existing) {
      return { data: null, error: new Error('房间号已存在，请重试') };
    }

    const room: Room & Record<string, any> = {
      id: roomId,
      created_at: new Date().toISOString(),
      status: 'waiting',
      player_count: playerCount,
      host_id: hostId,
      current_phase: 'night',
      roles,
      enable_sheriff: _enableSheriff,
      current_round: 1,
      sheriff_id: null,
      sheriff_torn: false,
      win_mode: _winMode,
      game_result: null,
      enable_auto_judge: _enableAutoJudge,
      updated_at: new Date().toISOString(),
    };

    await saveStore(roomId, {
      room,
      players: [],
      revision: 0,
      updated_at: new Date().toISOString(),
    });

    return { data: room, error: null };
  } catch (error) {
    return { data: null, error: cloneError(error) };
  }
}

export function getRoomConfig(roomId: string): { enable_sheriff: boolean; win_mode: 'city' | 'side'; enable_auto_judge: boolean } {
  try {
    const saved = localStorage.getItem(`room_config_${roomId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load room config:', e);
  }
  return {
    enable_sheriff: true,
    win_mode: 'side',
    enable_auto_judge: false,
  };
}

export async function getRoom(roomId: string): Promise<{ data: Room | null; error: any }> {
  try {
    const store = await loadStore(roomId);
    return { data: store?.room || null, error: store ? null : new Error('房间不存在') };
  } catch (error) {
    return { data: null, error: cloneError(error) };
  }
}

export async function updateRoomStatus(
  roomId: string, 
  status: string
): Promise<{ data: any; error: any }> {
  return updateRoom(roomId, { status });
}

export async function updateGameResult(
  roomId: string, 
  winner: 'good' | 'evil',
  reason: string
): Promise<{ data: any; error: any }> {
  return updateRoom(roomId, {
    game_result: {
      winner,
      reason,
      ended_at: new Date().toISOString(),
    }
  });
}

export async function addPlayer(
  playerId: string,
  roomId: string, 
  name: string, 
  isHost: boolean = false
): Promise<{ data: Player | null; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    const existing = store.players.find(player => player.id === playerId);
    if (existing) {
      return existing;
    }

    const gamePlayerCount = store.players.filter(player => !player.is_host).length;
    if (!isHost && gamePlayerCount >= store.room.player_count) {
      throw new Error('房间已满，请联系法官调整玩家后重试');
    }

    const player: Player = normalizePlayer({
      id: playerId,
      room_id: roomId,
      name,
      is_host: isHost,
      is_alive: true,
      joined_at: new Date().toISOString(),
    });

    store.players.push(player);
    return player;
  });
}

export async function getPlayers(roomId: string): Promise<{ data: Player[] | null; error: any }> {
  try {
    const store = await loadStore(roomId);
    return { data: store?.players || [], error: null };
  } catch (error) {
    return { data: null, error: cloneError(error) };
  }
}

export async function updatePlayerRole(
  roomId: string,
  playerId: string, 
  role: string
): Promise<{ data: any; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    const player = store.players.find(item => item.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }
    player.role = role as Player['role'];
    return player;
  });
}

export async function batchUpdatePlayerRoles(
  roomId: string,
  updates: { playerId: string; role: string }[]
): Promise<{ data: any; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    updates.forEach(({ playerId, role }) => {
      const player = store.players.find(item => item.id === playerId);
      if (player) {
        player.role = role as Player['role'];
      }
    });
    return store.players;
  });
}

export async function updatePlayerAlive(
  roomId: string,
  playerId: string, 
  isAlive: boolean
): Promise<{ data: any; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    const player = store.players.find(item => item.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }
    player.is_alive = isAlive;
    return player;
  });
}

export async function updatePlayerName(
  roomId: string,
  playerId: string, 
  name: string
): Promise<{ data: any; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    const player = store.players.find(item => item.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }
    player.name = name;
    return player;
  });
}

export async function removePlayer(roomId: string, playerId: string): Promise<{ data: any; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    const player = store.players.find(item => item.id === playerId);
    store.players = store.players.filter(item => item.id !== playerId);
    return player || null;
  });
}

export function subscribeToRoom(roomId: string, callback: (payload: any) => void) {
  return createPollingChannel(roomId, 'room', callback);
}

export function subscribeToPlayers(roomId: string, callback: (payload: any) => void) {
  return createPollingChannel(roomId, 'players', callback);
}

export function leaveChannel(channel: any) {
  channel?.stop?.();
}

export async function updateSheriff(
  roomId: string,
  sheriffId: string | null,
  torn: boolean = false
): Promise<{ data: any; error: any }> {
  return updateRoom(roomId, {
    sheriff_id: sheriffId,
    sheriff_torn: torn,
  });
}

export async function updateRoom(
  roomId: string,
  updates: Partial<Room> & Record<string, any>
): Promise<{ data: Room | null; error: any }> {
  return mutateRoomStore(roomId, (store) => {
    store.room = normalizeRoom({
      ...store.room,
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return store.room;
  });
}

function createPollingChannel(roomId: string, type: 'room' | 'players', callback: (payload: any) => void): ChannelHandle {
  let active = true;
  let previousSignature = '';

  const poll = async () => {
    if (!active) {
      return;
    }

    try {
      const store = await loadStore(roomId);
      const payload = type === 'room' ? store?.room || null : store?.players || [];
      const signature = JSON.stringify(payload);

      if (signature !== previousSignature) {
        previousSignature = signature;
        callback({ new: payload });
      }
    } catch (error) {
      console.error('Polling channel failed:', error);
    }
  };

  poll();

  const timerId = window.setInterval(poll, POLL_INTERVAL_MS);

  return {
    stop: () => {
      active = false;
      window.clearInterval(timerId);
    },
  };
}
