import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Users, 
  Shuffle, 
  Crown,
  Skull,
  UserPlus,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Moon,
  Sun,
  Scroll,
  Eye,
  EyeOff,
  Trophy,
  X,
  Edit2,
  UserX,
  LogOut,
  Check,
  Mic
} from 'lucide-react';
import { 
  addPlayer,
  getPlayers, 
  updateRoomStatus, 
  updatePlayerRole, 
  batchUpdatePlayerRoles, 
  updatePlayerAlive, 
  updatePlayerName,
  removePlayer,
  subscribeToRoom, 
  subscribeToPlayers, 
  leaveChannel,
  getRoomConfig,
  updateRoom
} from '@/lib/supabase';
import { dealCards, getRoleName, getRoleColor, getRoleTeam, ROLES, MODERATOR_FLOW, saveGameRecord } from '@/lib/gameConfig';
import { RoleCard, RoleDetailModal } from '@/components/RoleCard';
import { ModeratorPanel } from '@/components/ModeratorPanel';
import { SheriffBadge } from '@/components/SheriffBadge';
import { AutoJudge } from '@/components/AutoJudge';
import type { Room, Player, RoleType, NightAction, DayVote, PlayerNote } from '@/types';

interface RoomSectionProps {
  room: Room;
  localPlayer: { playerId: string; roomId: string; isHost: boolean };
  onLeave: () => void;
}

export function RoomSection({ room: initialRoom, localPlayer, onLeave }: RoomSectionProps) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'moderator' | 'flow' | 'record' | 'notes'>('players');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [revealedRoles, setRevealedRoles] = useState<Set<string>>(new Set());
  
  // 法官记录
  const [nightActions, setNightActions] = useState<NightAction[]>([]);
  const [dayVotes, setDayVotes] = useState<DayVote[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  
  // 玩家个人记录
  const [playerNotes, setPlayerNotes] = useState<PlayerNote[]>([]);
  const [newNoteTarget, setNewNoteTarget] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePhase, setNewNotePhase] = useState<'night' | 'day'>('day');
  
  // 游戏结果
  const [gameResult, setGameResult] = useState<{ winner: 'good' | 'evil'; reason: string } | null>(null);

  // 警长
  const [sheriffId, setSheriffId] = useState<string | null>(room.sheriff_id || null);
  const [sheriffTorn, setSheriffTorn] = useState(room.sheriff_torn || false);

  // 修改名字相关
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 退出确认弹窗
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // 电子法官
  const [showAutoJudge, setShowAutoJudge] = useState(false);
  
  // 房间配置（从 localStorage 获取）
  const [roomConfig] = useState(() => getRoomConfig(room.id));

  // 获取当前玩家的角色（法官不显示角色）
  const myPlayer = players.find(p => p.id === localPlayer.playerId);
  const myRole = myPlayer?.is_host ? null : myPlayer?.role;
  
  // 判断是否是房主（电子法官模式下，host_id对应的玩家也是房主）
  const isRoomHost = (localPlayer as any).isHost || localPlayer.playerId === room.host_id;

  // 加载玩家列表
  const loadPlayers = useCallback(async () => {
    const { data } = await getPlayers(room.id);
    if (data) {
      setPlayers(data);
    }
  }, [room.id]);

  // 订阅房间和玩家变化
  useEffect(() => {
    loadPlayers();
    
    // 从localStorage读取游戏结果
    const savedResult = localStorage.getItem(`game_result_${room.id}`);
    if (savedResult) {
      setGameResult(JSON.parse(savedResult));
    }

    const roomChannel = subscribeToRoom(room.id, (payload) => {
      if (payload.new) {
        setRoom(payload.new as Room);
        setSheriffId(payload.new.sheriff_id);
        setSheriffTorn(payload.new.sheriff_torn);
        // 当房间状态变为ended时，从localStorage读取游戏结果
        if (payload.new.status === 'ended') {
          const result = localStorage.getItem(`game_result_${room.id}`);
          if (result) {
            setGameResult(JSON.parse(result));
          }
        }
      }
    });

    const playersChannel = subscribeToPlayers(room.id, () => {
      loadPlayers();
    });

    return () => {
      leaveChannel(roomChannel);
      leaveChannel(playersChannel);
    };
  }, [room.id, loadPlayers]);

  // 复制房间号
  const copyRoomInfo = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 添加玩家
  const handleAddPlayer = async () => {
    if (!newPlayerName.trim() || !isRoomHost) return;
    
    setLoading(true);
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await addPlayer(playerId, room.id, newPlayerName.trim(), false);
    
    setNewPlayerName('');
    setLoading(false);
    loadPlayers();
  };

  // 发牌
  const handleDealCards = async () => {
    // 过滤掉法官，只给普通玩家发牌
    const gamePlayers = players.filter(p => !p.is_host);
    if (!isRoomHost || gamePlayers.length !== room.player_count) return;
    
    setLoading(true);
    const shuffledRoles = dealCards(room.roles);
    
    const updates = gamePlayers.map((player, index) => ({
      playerId: player.id,
      role: shuffledRoles[index],
    }));
    
    await batchUpdatePlayerRoles(room.id, updates);
    await updateRoomStatus(room.id, 'playing');
    
    // 保存游戏记录
    const record = {
      id: `game_${Date.now()}`,
      roomId: room.id,
      createdAt: new Date().toISOString(),
      playerCount: room.player_count,
      players: gamePlayers.map((p, i) => ({ name: p.name, role: shuffledRoles[i] })),
      enableSheriff: room.enable_sheriff,
      winMode: room.win_mode,
    };
    saveGameRecord(record);
    
    setLoading(false);
  };

  // 重新开始
  const handleRestart = async () => {
    if (!isRoomHost) return;
    
    setLoading(true);
    
    // 只重置普通玩家（不含法官）
    const gamePlayers = players.filter(p => !p.is_host);
    for (const player of gamePlayers) {
      await updatePlayerRole(room.id, player.id, '');
      await updatePlayerAlive(room.id, player.id, true);
    }
    
    await updateRoomStatus(room.id, 'waiting');
    await updateRoom(room.id, { 
      sheriff_id: null, 
      sheriff_torn: false,
      current_round: 1 
    });
    
    setSheriffId(null);
    setSheriffTorn(false);
    setRevealedRoles(new Set());
    setNightActions([]);
    setDayVotes([]);
    setCurrentRound(1);
    setLoading(false);
  };

  // 切换玩家存活状态
  const togglePlayerAlive = async (playerId: string, currentStatus: boolean) => {
    if (!isRoomHost) return;
    await updatePlayerAlive(room.id, playerId, !currentStatus);
    
    // 如果警长出局，提示传递警徽
    const player = players.find(p => p.id === playerId);
    if (playerId === sheriffId && player?.is_alive) {
      // 警长即将出局
    }
  };

  // 传递警徽
  const handleTransferSheriff = async (newSheriffId: string | null) => {
    if (!isRoomHost) return;
    await updateRoom(room.id, { sheriff_id: newSheriffId });
    setSheriffId(newSheriffId);
  };

  // 撕毁警徽
  const handleTearSheriff = async () => {
    if (!isRoomHost) return;
    await updateRoom(room.id, { sheriff_torn: true, sheriff_id: null });
    setSheriffTorn(true);
    setSheriffId(null);
  };

  // 开始编辑玩家名字
  const startEditingName = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
  };

  // 保存玩家名字修改
  const savePlayerName = async () => {
    if (!editingPlayerId || !editingName.trim()) return;
    
    // 只能修改自己的名字，或者法官可以修改任何人的名字
    const targetPlayer = players.find(p => p.id === editingPlayerId);
    if (!targetPlayer) return;
    
    const canEdit = isRoomHost || editingPlayerId === localPlayer.playerId;
    if (!canEdit) return;
    
    await updatePlayerName(room.id, editingPlayerId, editingName.trim());
    setEditingPlayerId(null);
    setEditingName('');
    loadPlayers();
  };

  // 取消编辑名字
  const cancelEditingName = () => {
    setEditingPlayerId(null);
    setEditingName('');
  };

  // 法官踢出玩家
  const handleKickPlayer = async (playerId: string) => {
    if (!isRoomHost) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player || player.is_host) return; // 不能踢出法官
    
    if (!confirm(`确定要将 ${player.name} 踢出房间吗？`)) return;
    
    await removePlayer(room.id, playerId);
    loadPlayers();
  };

  // 处理退出房间
  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  // 确认退出
  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    onLeave();
  };

  // 取消退出
  const cancelLeave = () => {
    setShowLeaveConfirm(false);
  };

  // 添加夜晚记录
  const handleAddNightAction = (action: NightAction) => {
    setNightActions(prev => [...prev.filter(a => a.round !== action.round), action]);
  };

  // 添加白天记录
  const handleAddDayVote = (vote: DayVote) => {
    setDayVotes(prev => [...prev.filter(v => v.round !== vote.round), vote]);
    setCurrentRound(vote.round + 1);
  };
  
  // 处理玩家死亡（从法官记录触发）
  const handlePlayerDie = async (playerId: string) => {
    await updatePlayerAlive(room.id, playerId, false);
    loadPlayers();
  };
  
  // 处理游戏结束
  const handleGameEnd = async (winner: 'good' | 'evil', reason: string) => {
    const result = { winner, reason };
    setGameResult(result);
    // 保存到localStorage以便其他玩家同步
    localStorage.setItem(`game_result_${room.id}`, JSON.stringify(result));
    await updateRoomStatus(room.id, 'ended');
  };
  
  // 添加玩家个人记录
  const handleAddPlayerNote = () => {
    if (!newNoteTarget.trim() || !newNoteContent.trim()) return;
    
    const note: PlayerNote = {
      id: `note_${Date.now()}`,
      targetPlayer: newNoteTarget,
      round: currentRound,
      phase: newNotePhase,
      content: newNoteContent,
      createdAt: new Date().toISOString(),
    };
    
    setPlayerNotes(prev => [...prev, note]);
    setNewNoteContent('');
  };
  
  // 删除玩家记录
  const handleDeleteNote = (noteId: string) => {
    setPlayerNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // 渲染法官流程
  const renderModeratorFlow = () => {
    return (
      <div className="space-y-4">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            法官流程
          </h3>
          <div className="space-y-2">
            {MODERATOR_FLOW.map((tip, index) => (
              <div 
                key={index}
                onClick={() => setCurrentTipIndex(index)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentTipIndex === index 
                    ? 'bg-purple-500/20 border border-purple-500/50' 
                    : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tip.phase === 'night' && <Moon className="w-4 h-4 text-indigo-400" />}
                    {tip.phase === 'day' && <Sun className="w-4 h-4 text-yellow-400" />}
                    {tip.phase === 'sheriff' && <Crown className="w-4 h-4 text-yellow-500" />}
                    <span className={`font-medium ${currentTipIndex === index ? 'text-purple-400' : 'text-slate-300'}`}>
                      {tip.title}
                    </span>
                  </div>
                  {currentTipIndex === index && <ChevronRight className="w-4 h-4 text-purple-400" />}
                </div>
                {currentTipIndex === index && (
                  <div className="mt-2 space-y-2">
                    <p className="text-slate-400 text-sm">{tip.content}</p>
                    {tip.subSteps && (
                      <ul className="space-y-1">
                        {tip.subSteps.map((step, idx) => (
                          <li key={idx} className="text-slate-500 text-xs flex items-center gap-2">
                            <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 当前步骤 */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-400 text-sm font-medium mb-1">当前步骤</p>
          <div className="flex items-center gap-2">
            {MODERATOR_FLOW[currentTipIndex]?.phase === 'night' && <Moon className="w-5 h-5 text-indigo-400" />}
            {MODERATOR_FLOW[currentTipIndex]?.phase === 'day' && <Sun className="w-5 h-5 text-yellow-400" />}
            {MODERATOR_FLOW[currentTipIndex]?.phase === 'sheriff' && <Crown className="w-5 h-5 text-yellow-500" />}
            <p className="text-white text-lg font-medium">{MODERATOR_FLOW[currentTipIndex]?.title}</p>
          </div>
          <p className="text-slate-400 text-sm mt-1">{MODERATOR_FLOW[currentTipIndex]?.content}</p>
        </div>

        {/* 步骤控制 */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentTipIndex(Math.max(0, currentTipIndex - 1))}
            disabled={currentTipIndex === 0}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            上一步
          </button>
          <button
            onClick={() => setCurrentTipIndex(Math.min(MODERATOR_FLOW.length - 1, currentTipIndex + 1))}
            disabled={currentTipIndex === MODERATOR_FLOW.length - 1}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            下一步
          </button>
        </div>
      </div>
    );
  };

  // 渲染角色提示
  const renderRoleTips = () => {
    if (!myRole) return null;
    const roleInfo = ROLES[myRole as RoleType];
    const team = getRoleTeam(myRole as RoleType);
    
    return (
      <div className="space-y-4">
        {/* 角色卡片 */}
        <div className="flex justify-center">
          <div onClick={() => setSelectedRole(myRole as RoleType)}>
            <RoleCard role={myRole as RoleType} size="large" revealed={true} />
          </div>
        </div>

        {/* 角色提示 */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
            <Scroll className="w-5 h-5" />
            {roleInfo.name}游戏提示
          </h3>
          <div className="space-y-3">
            {roleInfo.tips.map((tip, index) => (
              <div key={index} className="flex gap-3">
                <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-slate-300 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 阵营信息 */}
        <div className={`rounded-xl p-4 ${
          team === 'good' 
            ? 'bg-blue-500/10 border border-blue-500/30' 
            : team === 'evil'
            ? 'bg-red-500/10 border border-red-500/30'
            : 'bg-gray-500/10 border border-gray-500/30'
        }`}>
          <p className="text-slate-400 text-sm mb-1">你的阵营</p>
          <p className={`text-lg font-medium ${
            team === 'good' 
              ? 'text-blue-400' 
              : team === 'evil'
              ? 'text-red-400'
              : 'text-gray-400'
          }`}>
            {team === 'good' ? '好人阵营' : team === 'evil' ? '狼人阵营' : '中立'}
          </p>
          <p className="text-slate-500 text-sm mt-2">{roleInfo.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLeaveClick} 
            className="flex flex-col items-center gap-0.5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="退出房间"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-[10px]">退出</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              房间 {room.id}
              {isRoomHost && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                  法官
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-xs">
              法官 1/1 · 玩家 {players.filter(p => !p.is_host).length}/{room.player_count}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomInfo}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
          {copied && (
            <span className="text-green-400 text-xs">已复制!</span>
          )}
        </div>
      </div>

      {/* 房间信息卡片 */}
      {isRoomHost && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
          <div>
            <p className="text-slate-400 text-xs">房间号</p>
            <p className="text-3xl font-bold text-white tracking-widest text-center py-2">{room.id}</p>
          </div>
          <p className="text-slate-500 text-xs text-center">分享给玩家，让他们加入游戏</p>
        </div>
      )}

      {/* 游戏配置信息 */}
      <div className="mx-4 mt-4 flex gap-2">
        <div className="flex-1 bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-slate-500 text-xs">模式</p>
          <p className="text-white font-medium text-sm">
            {roomConfig.win_mode === 'side' ? '屠边' : '屠城'}
          </p>
        </div>
        <div className="flex-1 bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-slate-500 text-xs">警长</p>
          <p className="text-white font-medium text-sm">
            {roomConfig.enable_sheriff ? '开启' : '关闭'}
          </p>
        </div>
        <div className="flex-1 bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-slate-500 text-xs">人数</p>
          <p className="text-white font-medium text-sm">{room.player_count}人</p>
        </div>
      </div>

      {/* 警长信息 */}
      {room.status === 'playing' && (
        <div className="mx-4 mt-4">
          <SheriffBadge
            sheriffId={sheriffId}
            isTorn={sheriffTorn}
            players={players}
            isHost={isRoomHost}
            onTransfer={handleTransferSheriff}
            onTear={handleTearSheriff}
          />
        </div>
      )}

      {/* 我的角色卡片 */}
      {room.status === 'playing' && myRole && (
        <div className="mx-4 mt-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-3 text-center">你的身份（仅自己可见）</p>
            <div className="flex justify-center">
              <div 
                onClick={() => {
                  // 点击卡片切换显示/隐藏
                  const newRevealed = new Set(revealedRoles);
                  if (newRevealed.has(localPlayer.playerId)) {
                    newRevealed.delete(localPlayer.playerId);
                  } else {
                    newRevealed.add(localPlayer.playerId);
                  }
                  setRevealedRoles(newRevealed);
                }}
                className="cursor-pointer"
              >
                <RoleCard role={myRole as RoleType} size="large" revealed={revealedRoles.has(localPlayer.playerId)} />
              </div>
            </div>
            <button
              onClick={() => {
                const newRevealed = new Set(revealedRoles);
                if (newRevealed.has(localPlayer.playerId)) {
                  newRevealed.delete(localPlayer.playerId);
                } else {
                  newRevealed.add(localPlayer.playerId);
                }
                setRevealedRoles(newRevealed);
              }}
              className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {revealedRoles.has(localPlayer.playerId) ? (
                <><EyeOff className="w-4 h-4" /> 盖回牌面</>
              ) : (
                <><Eye className="w-4 h-4" /> 翻开身份</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="mx-4 mt-4 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'players'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          玩家
        </button>
        {isRoomHost && (
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'flow'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            流程
          </button>
        )}
        {isRoomHost && room.status === 'playing' && (
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'record'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            记录
          </button>
        )}
        <button
          onClick={() => setActiveTab('moderator')}
          className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'moderator'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          提示
        </button>
        {room.status === 'playing' && (
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            我的记录
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4 pb-32">
        {activeTab === 'players' && (
          <div className="space-y-4">
            {/* 玩家列表 */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                玩家列表
              </h3>
              
              {/* 法官区域 */}
              {players.filter(p => p.is_host).map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl mb-2 ${
                    player.id === localPlayer.playerId ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{player.name}</span>
                    {player.id === localPlayer.playerId && (
                      <span className="text-xs text-purple-400">(你)</span>
                    )}
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">法官</span>
                  </div>
                </div>
              ))}
              
              {/* 普通玩家区域 */}
              <div className="mt-4">
                <p className="text-slate-500 text-xs mb-2">
                  游戏玩家 ({players.filter(p => !p.is_host).length}/{room.player_count})
                </p>
                <div className="space-y-2">
                  {players.filter(p => !p.is_host).map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        player.id === localPlayer.playerId ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {player.id === sheriffId && <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                        
                        {/* 名字显示或编辑 */}
                        {editingPlayerId === player.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 min-w-0 bg-slate-900 border border-purple-500/50 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') savePlayerName();
                                if (e.key === 'Escape') cancelEditingName();
                              }}
                            />
                            <button
                              onClick={savePlayerName}
                              className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditingName}
                              className="p-1 text-slate-400 hover:bg-slate-700 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-white truncate">{player.name}</span>
                            {player.id === localPlayer.playerId && (
                              <span className="text-xs text-purple-400 flex-shrink-0">(你)</span>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* 角色显示（法官可见） */}
                        {player.role && isRoomHost && (
                          <span className={`text-sm font-medium ${getRoleColor(player.role as RoleType)} mr-2`}>
                            {ROLES[player.role as RoleType].icon} {getRoleName(player.role as RoleType)}
                          </span>
                        )}
                        
                        {/* 修改名字按钮（自己或法官） */}
                        {editingPlayerId !== player.id && (isRoomHost || player.id === localPlayer.playerId) && (
                          <button
                            onClick={() => startEditingName(player)}
                            className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                            title="修改名字"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* 存活状态切换（法官） */}
                        {isRoomHost && room.status === 'playing' && (
                          <button
                            onClick={() => togglePlayerAlive(player.id, player.is_alive)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              player.is_alive 
                                ? 'text-green-400 hover:bg-green-500/20' 
                                : 'text-slate-500 hover:bg-slate-700'
                            }`}
                            title={player.is_alive ? '标记死亡' : '标记存活'}
                          >
                            <Skull className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* 踢出玩家按钮（法官，等待阶段） */}
                        {isRoomHost && room.status === 'waiting' && (
                          <button
                            onClick={() => handleKickPlayer(player.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="踢出房间"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!player.is_alive && !isRoomHost && (
                          <Skull className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 法官添加玩家 */}
              {isRoomHost && room.status === 'waiting' && players.filter(p => !p.is_host).length < room.player_count && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="输入玩家名字"
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  />
                  <button
                    onClick={handleAddPlayer}
                    disabled={loading || !newPlayerName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* 角色配置预览 */}
            {isRoomHost && room.status === 'waiting' && (
              <div className="bg-slate-800/30 rounded-xl p-4">
                <h3 className="text-slate-400 text-sm mb-3">角色配置</h3>
                <div className="flex flex-wrap gap-2">
                  {room.roles.map((role, idx) => (
                    Array(role.count).fill(null).map((_, i) => {
                      const roleInfo = ROLES[role.type as RoleType];
                      const team = roleInfo.team;
                      const bgClass = team === 'good' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                                     team === 'evil' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                     'bg-gray-500/20 text-gray-400 border-gray-500/30';
                      return (
                        <span
                          key={`${role.type}-${idx}-${i}`}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${bgClass}`}
                        >
                          {roleInfo.icon} {roleInfo.name}
                        </span>
                      );
                    })
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'flow' && isRoomHost && renderModeratorFlow()}

        {activeTab === 'record' && isRoomHost && room.status === 'playing' && (
          <ModeratorPanel
            players={players}
            roles={room.roles}
            winMode={roomConfig.win_mode}
            currentRound={currentRound}
            nightActions={nightActions}
            dayVotes={dayVotes}
            onAddNightAction={handleAddNightAction}
            onAddDayVote={handleAddDayVote}
            onPlayerDie={handlePlayerDie}
            onGameEnd={handleGameEnd}
          />
        )}

        {activeTab === 'moderator' && renderRoleTips()}
        
        {activeTab === 'notes' && room.status === 'playing' && (
          <div className="space-y-4">
            {/* 添加记录 */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                <Scroll className="w-5 h-5" />
                添加记录
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={newNoteTarget}
                    onChange={(e) => setNewNoteTarget(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">选择玩家</option>
                    {players.filter(p => !p.is_host && p.is_alive).map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={newNotePhase}
                    onChange={(e) => setNewNotePhase(e.target.value as 'night' | 'day')}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="day">白天</option>
                    <option value="night">夜晚</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="记录内容（如：发言、行为等）"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayerNote()}
                />
                <button
                  onClick={handleAddPlayerNote}
                  disabled={!newNoteTarget.trim() || !newNoteContent.trim()}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  添加记录
                </button>
              </div>
            </div>
            
            {/* 记录列表 */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                <Scroll className="w-5 h-5" />
                我的记录 ({playerNotes.length})
              </h3>
              {playerNotes.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">暂无记录</p>
              ) : (
                <div className="space-y-2">
                  {playerNotes.slice().reverse().map((note) => (
                    <div key={note.id} className="bg-slate-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{note.targetPlayer}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            note.phase === 'night' 
                              ? 'bg-indigo-500/20 text-indigo-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {note.phase === 'night' ? '夜晚' : '白天'}
                          </span>
                          <span className="text-slate-500 text-xs">第{note.round}回合</span>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-300 text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部控制面板 */}
      {isRoomHost && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
          {room.status === 'waiting' && (
            <div className="space-y-3">
              {/* 电子法官入口 */}
              <button
                onClick={() => setShowAutoJudge(true)}
                disabled={players.filter(p => !p.is_host).length !== room.player_count}
                className="w-full h-12 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Mic className="w-5 h-5" />
                {players.filter(p => !p.is_host).length === room.player_count 
                  ? '启用电子法官 (实验功能)' 
                  : `等待玩家加入 (${players.filter(p => !p.is_host).length}/${room.player_count})`}
              </button>
              
              <button
                onClick={handleDealCards}
                disabled={players.filter(p => !p.is_host).length !== room.player_count || loading}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all"
              >
                <Shuffle className="w-5 h-5" />
                开始发牌
              </button>
            </div>
          )}
          
          {room.status === 'playing' && (
            <button
              onClick={handleRestart}
              disabled={loading}
              className="w-full h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <RotateCcw className="w-5 h-5" />
              重新开始
            </button>
          )}
        </div>
      )}

      {/* 非法官等待提示 */}
      {!isRoomHost && room.status === 'waiting' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
          <div className="text-center text-slate-400 py-4 bg-slate-800/50 rounded-xl">
            <p>等待法官开始游戏...</p>
            <p className="text-sm mt-2">房间号: <span className="text-white font-mono text-lg">{room.id}</span></p>
          </div>
        </div>
      )}

      {/* 游戏结果弹窗 */}
      {gameResult && room.status === 'ended' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full border-2 ${
            gameResult.winner === 'good' 
              ? 'bg-blue-900/90 border-blue-500/50' 
              : 'bg-red-900/90 border-red-500/50'
          }`}>
            <div className="text-center mb-6">
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${
                gameResult.winner === 'good' ? 'text-blue-400' : 'text-red-400'
              }`} />
              <h2 className={`text-2xl font-bold mb-2 ${
                gameResult.winner === 'good' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {gameResult.winner === 'good' ? '好人阵营胜利！' : '狼人阵营胜利！'}
              </h2>
              <p className="text-slate-300">{gameResult.reason}</p>
            </div>
            
            <button
              onClick={() => setGameResult(null)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* 角色详情弹窗 */}
      {selectedRole && (
        <RoleDetailModal
          role={selectedRole}
          isOpen={true}
          onClose={() => setSelectedRole(null)}
        />
      )}

      {/* 退出确认弹窗 */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border-2 border-purple-500/50">
            <div className="text-center mb-6">
              <LogOut className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h2 className="text-xl font-bold text-white mb-2">
                确认退出房间？
              </h2>
              <p className="text-slate-400 text-sm">
                {isRoomHost 
                  ? '你是法官，退出后房间将关闭' 
                  : '退出后可以重新加入该房间'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmLeave}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                确认退出
              </button>
              <button
                onClick={cancelLeave}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 电子法官 */}
      {showAutoJudge && (
        <div className="fixed inset-0 z-50">
          <AutoJudge
            roomId={room.id}
            players={players}
            roles={room.roles.map(r => r.type as RoleType)}
            isHost={isRoomHost}
            currentPlayerId={localPlayer.playerId}
            currentPlayerRole={myRole || undefined}
            onExit={() => setShowAutoJudge(false)}
          />
        </div>
      )}
    </div>
  );
}
