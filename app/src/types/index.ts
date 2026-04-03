// 游戏角色类型
export type RoleType = 
  // 好人阵营 - 神职
  | 'seer'          // 预言家
  | 'witch'         // 女巫
  | 'hunter'        // 猎人
  | 'idiot'         // 白痴
  | 'guard'         // 守卫
  | 'elder'         // 长老
  | 'knight'        // 骑士（白天可决斗一人）
  | 'gravedigger'   // 守墓人（每晚知道前一天被放逐的玩家阵营）
  | 'crow'          // 乌鸦（每晚诅咒一名玩家，放逐时额外一票）
  | 'magician'      // 魔术师（每晚交换两人号码牌）
  | 'dreamer'       // 摄梦人（每晚选择梦游者，免疫夜间伤害）
  | 'demonhunter'   // 猎魔人（每晚狩猎，狼人死否则自己死）
  | 'muter'         // 禁言长老（每晚禁言一名玩家白天不能发言）
  | 'miracle'       // 奇迹商人（给幸运儿一个技能）
  | 'pure'          // 纯白之女（查验到狼人则狼人出局）
  | 'prince'        // 定序王子（可以逆转投票重新投票）
  | 'count'         // 流光伯爵（庇护玩家免疫夜间伤害）
  | 'alchemist'     // 炼金魔女（未明之雾+法老之蛇）
  // 好人阵营 - 平民
  | 'villager'      // 平民
  | 'hooligan'      // 老流氓（被毒/射杀后延迟死亡）
  // 狼人阵营
  | 'werewolf'      // 狼人
  | 'whitewolf'     // 白狼王（白天自爆可带走一人）
  | 'wolfgun'       // 狼枪（被票出可开枪带走一人）
  | 'wolfbeauty'    // 狼美人（魅惑玩家，自己死亡时带走被魅惑者）
  | 'gargoyle'      // 石像鬼（每晚查验玩家具体身份）
  | 'hiddenwolf'    // 隐狼（查验为好人，知道狼队友但不能刀人）
  | 'ghostknight'   // 恶灵骑士（被查验/毒时反伤）
  | 'bloodmoon'     // 血月使徒（自爆封印好人技能）
  | 'nightmare'     // 噩梦之影（每晚恐惧一名玩家封印技能）
  | 'wolfwitch'     // 狼巫（查验玩家，验到纯白则纯白出局）
  | 'redmoon'       // 赤月使徒（自爆封印好人技能）
  // 第三方阵营
  | 'cupid'         // 丘比特（连接情侣）
  | 'admirer'       // 暗恋者（暗恋一名玩家，阵营跟随暗恋对象）
  | 'thief'         // 盗贼（首夜选择身份）
  | 'bomber'        // 炸弹人（被投票出局时带走所有投他的人）
  // 法官
  | 'moderator';    // 法官

// 胜负模式
export type WinMode = 'city' | 'side'; // city=屠城, side=屠边

// 角色配置
export interface RoleConfig {
  type: RoleType;
  name: string;
  count: number;
  description?: string;
}

// 游戏板子配置
export interface BoardConfig {
  id: string;
  name: string;
  playerCount: number; // 不含法官的玩家数
  roles: RoleConfig[];
  enableSheriff: boolean;
  winMode: WinMode;
  description: string;
}

// 房间状态
export type RoomStatus = 'waiting' | 'playing' | 'ended';

// 游戏阶段
export type GamePhase = 'night' | 'day' | 'voting' | 'ended';

// 夜晚行动记录
export interface NightAction {
  round: number;
  // 预言家
  seerCheck?: { target: string; result: 'good' | 'evil' };
  // 狼人
  werewolfKill?: string;
  // 女巫
  witchSave?: boolean;
  witchPoison?: string;
  // 守卫
  guardProtect?: string;
  // 守墓人
  gravediggerCheck?: { target: string; result: 'good' | 'evil' };
  // 乌鸦
  crowCurse?: string;
  // 魔术师
  magicianSwap?: { player1: string; player2: string };
  // 摄梦人
  dreamerTarget?: string;
  // 猎魔人
  demonhunterTarget?: string;
  // 禁言长老
  muterTarget?: string;
  // 奇迹商人
  miracleTarget?: string;
  miracleSkill?: 'seer' | 'witch' | 'guard';
  // 纯白之女
  pureCheck?: { target: string; result: 'good' | 'evil' | 'killed' };
  // 流光伯爵
  countTarget?: string;
  // 炼金魔女
  alchemistFog?: string[]; // 未明之雾选定的三个玩家
  alchemistSave?: string; // 法老之蛇救活的目标
  // 狼美人
  wolfbeautyCharm?: string;
  // 石像鬼
  gargoyleCheck?: { target: string; role: string };
  // 噩梦之影
  nightmareTarget?: string;
  // 狼巫
  wolfwitchCheck?: { target: string; role: string };
  // 丘比特
  cupidLovers?: [string, string];
  // 暗恋者
  admirerTarget?: string;
  // 结果
  result?: {
    died: string[]; // 死亡的玩家ID
    isPeaceful: boolean;
    details: string[]; // 出局详情描述
  };
}

// 白天特殊行动
export interface DaySpecialAction {
  type: 
    | 'wolfgun_shoot'     // 狼枪开枪
    | 'whitewolf_explode' // 白狼王自爆
    | 'knight_duel'       // 骑士决斗
    | 'prince_reverse'    // 定序王子逆转投票
    | 'wolfbeauty_charm_broken' // 狼美人被决斗魅惑失效
    | 'miracle_death'     // 奇迹商人给狼人技能后死亡
    | 'alchemist_reveal'; // 炼金魔女公布出局信息前
  player: string;
  target?: string;
  result?: 'success' | 'fail';
}

// 白天投票记录
export interface DayVote {
  round: number;
  executed?: string;
  votes: Record<string, string>;
  specialActions?: DaySpecialAction[];
}

// 玩家
export interface Player {
  id: string;
  room_id: string;
  name: string;
  role?: RoleType;
  is_host: boolean;
  is_alive: boolean;
  joined_at: string;
  is_connected?: boolean;
  last_seen_at?: string | null;
}

// 房间
export interface Room {
  id: string;
  created_at: string;
  status: RoomStatus;
  player_count: number; // 不含法官的玩家数
  host_id: string;
  current_phase: GamePhase | string;
  roles: RoleConfig[];
  enable_sheriff: boolean;
  current_round: number;
  sheriff_id?: string | null;
  sheriff_torn: boolean;
  win_mode: WinMode;
  game_result?: {
    winner: 'good' | 'evil';
    reason: string;
    ended_at: string;
  } | null;
}

// 本地存储的玩家信息
export interface LocalPlayerInfo {
  playerId: string;
  roomId: string;
  isHost: boolean;
  playerToken: string;
  playerName: string;
  hostToken?: string | null;
}

// 游戏记录
export interface GameRecord {
  id: string;
  roomId: string;
  createdAt: string;
  playerCount: number;
  players: { name: string; role: RoleType }[];
  enableSheriff: boolean;
  winMode: WinMode;
  winner?: 'good' | 'evil';
}

// 法官提示
export interface ModeratorTip {
  phase: 'night' | 'day' | 'sheriff';
  title: string;
  content: string;
  subSteps?: string[];
}

// 阵营统计
export interface TeamCount {
  good: number;
  evil: number;
  gods: number; // 神职数量
  villagers: number; // 平民数量
}

// 玩家个人记录
export interface PlayerNote {
  id: string;
  targetPlayer: string; // 记录关于哪个玩家
  round: number;
  phase: 'night' | 'day';
  content: string;
  createdAt: string;
}

// 游戏结果
export interface GameResult {
  winner: 'good' | 'evil';
  reason: string;
  endedAt: string;
}
