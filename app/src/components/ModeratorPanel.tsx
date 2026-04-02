import { useState } from 'react';
import { 
  Moon, Sun, Scroll, Skull, Shield, Eye, 
  FlaskConical, ChevronDown, ChevronUp,
  Check, X, Trophy, AlertTriangle, Heart, Ghost, Zap, Star
} from 'lucide-react';
import type { Player, NightAction, DayVote, DaySpecialAction, RoleConfig, RoleType, WinMode } from '@/types';
import { ROLES, ROLE_CATEGORIES, checkGameEnd } from '@/lib/gameConfig';

interface ModeratorPanelProps {
  players: Player[];
  roles: RoleConfig[];
  winMode: WinMode;
  currentRound: number;
  nightActions: NightAction[];
  dayVotes: DayVote[];
  onAddNightAction: (action: NightAction) => void;
  onAddDayVote: (vote: DayVote) => void;
  onPlayerDie: (playerId: string) => void;
  onGameEnd: (winner: 'good' | 'evil', reason: string) => void;
}

// 计算夜晚结果
function calculateNightResult(
  action: NightAction,
  players: Player[]
): { died: string[]; isPeaceful: boolean; details: string[] } {
  const died: string[] = [];
  const details: string[] = [];
  
  // 狼人击杀
  if (action.werewolfKill) {
    const target = players.find(p => p.name === action.werewolfKill);
    if (target) {
      // 检查是否被守卫守护
      const isGuarded = action.guardProtect === action.werewolfKill;
      // 检查是否被女巫救
      const isSaved = action.witchSave;
      
      if (isGuarded && isSaved) {
        details.push(`${action.werewolfKill} 被守卫守护且被女巫解救（同守同救，死亡）`);
        died.push(target.id);
      } else if (isGuarded) {
        details.push(`${action.werewolfKill} 被守卫守护，平安夜`);
      } else if (isSaved) {
        details.push(`${action.werewolfKill} 被女巫解救，平安夜`);
      } else {
        details.push(`${action.werewolfKill} 被狼人击杀`);
        died.push(target.id);
      }
    }
  }
  
  // 女巫毒杀
  if (action.witchPoison) {
    const target = players.find(p => p.name === action.witchPoison);
    if (target && !died.includes(target.id)) {
      details.push(`${action.witchPoison} 被女巫毒杀`);
      died.push(target.id);
    }
  }
  
  return {
    died,
    isPeaceful: died.length === 0,
    details
  };
}

// 夜晚记录表单
function NightActionForm({ 
  players, 
  roles,
  round,
  allNightActions,
  onSave, 
  onCancel 
}: { 
  players: Player[]; 
  roles: RoleConfig[];
  round: number;
  allNightActions: NightAction[];
  onSave: (action: NightAction) => void; 
  onCancel: () => void;
}) {
  // 基础角色状态
  const [seerTarget, setSeerTarget] = useState('');
  const [werewolfTarget, setWerewolfTarget] = useState('');
  const [witchSave, setWitchSave] = useState(false);
  const [witchPoison, setWitchPoison] = useState('');
  const [guardTarget, setGuardTarget] = useState('');
  const [guardWarning, setGuardWarning] = useState('');
  
  // 新增角色状态
  const [gravediggerTarget, setGravediggerTarget] = useState('');
  const [crowTarget, setCrowTarget] = useState('');
  const [crowWarning, setCrowWarning] = useState('');
  const [magicianSwap1, setMagicianSwap1] = useState('');
  const [magicianSwap2, setMagicianSwap2] = useState('');
  const [dreamerTarget, setDreamerTarget] = useState('');
  const [dreamerWarning, setDreamerWarning] = useState('');
  const [demonhunterTarget, setDemonhunterTarget] = useState('');
  const [muterTarget, setMuterTarget] = useState('');
  const [muterWarning, setMuterWarning] = useState('');
  const [miracleTarget, setMiracleTarget] = useState('');
  const [miracleSkill, setMiracleSkill] = useState<'seer' | 'witch' | 'guard'>('seer');
  const [pureTarget, setPureTarget] = useState('');
  const [countTarget, setCountTarget] = useState('');
  const [countWarning, setCountWarning] = useState('');
  const [alchemistFog, setAlchemistFog] = useState<string[]>([]);
  const [alchemistSave, setAlchemistSave] = useState('');
  const [wolfbeautyTarget, setWolfbeautyTarget] = useState('');
  const [wolfbeautyWarning, setWolfbeautyWarning] = useState('');
  const [gargoyleTarget, setGargoyleTarget] = useState('');
  const [nightmareTarget, setNightmareTarget] = useState('');
  const [wolfwitchTarget, setWolfwitchTarget] = useState('');
  const [cupidLovers, setCupidLovers] = useState<[string, string]>(['', '']);
  const [admirerTarget, setAdmirerTarget] = useState('');

  const alivePlayers = players.filter(p => p.is_alive && !p.is_host);
  
  // 检查板子中有哪些角色
  const hasRole = (type: RoleType) => roles.some(r => r.type === type && r.count > 0);
  const hasGuard = hasRole('guard');
  const hasGravedigger = hasRole('gravedigger');
  const hasCrow = hasRole('crow');
  const hasMagician = hasRole('magician');
  const hasDreamer = hasRole('dreamer');
  const hasDemonhunter = hasRole('demonhunter');
  const hasMuter = hasRole('muter');
  const hasMiracle = hasRole('miracle');
  const hasPure = hasRole('pure');
  const hasCount = hasRole('count');
  const hasAlchemist = hasRole('alchemist');
  const hasWolfbeauty = hasRole('wolfbeauty');
  const hasGargoyle = hasRole('gargoyle');
  const hasNightmare = hasRole('nightmare');
  const hasWolfwitch = hasRole('wolfwitch');
  const hasCupid = hasRole('cupid');
  const hasAdmirer = hasRole('admirer');
  
  // 获取上一晚的记录
  const previousNightAction = allNightActions.find(a => a.round === round - 1);
  
  // 检查女巫是否已经使用过解药/毒药
  const hasWitchUsedSave = allNightActions.some(a => a.witchSave);
  const hasWitchUsedPoison = allNightActions.some(a => a.witchPoison);
  
  // 检查奇迹商人是否使用过技能
  const hasMiracleUsed = allNightActions.some(a => a.miracleTarget);
  
  // 检查炼金魔女是否使用过技能
  const hasAlchemistFogUsed = allNightActions.some(a => a.alchemistFog);
  const hasAlchemistSaveUsed = allNightActions.some(a => a.alchemistSave);
  
  // 获取玩家实际角色
  const getPlayerRole = (playerName: string): RoleType | null => {
    const player = players.find(p => p.name === playerName);
    return player?.role as RoleType || null;
  };

  const isWerewolf = (playerName: string): boolean => {
    const role = getPlayerRole(playerName);
    return role ? ROLE_CATEGORIES[role] === 'werewolf' : false;
  };

  const getSeerResult = (playerName: string): 'good' | 'evil' => {
    return isWerewolf(playerName) ? 'evil' : 'good';
  };
  
  // 守卫连续守护检查
  const handleGuardTargetChange = (value: string) => {
    setGuardTarget(value);
    if (value && previousNightAction?.guardProtect === value) {
      setGuardWarning(`⚠️ 守卫不能连续两晚守护同一个人（上一晚守护了 ${value}）`);
    } else {
      setGuardWarning('');
    }
  };
  
  // 乌鸦连续诅咒检查
  const handleCrowTargetChange = (value: string) => {
    setCrowTarget(value);
    if (value && previousNightAction?.crowCurse === value) {
      setCrowWarning(`⚠️ 乌鸦不能连续两晚诅咒同一个人（上一晚诅咒了 ${value}）`);
    } else {
      setCrowWarning('');
    }
  };
  
  // 摄梦人连续摄梦检查
  const handleDreamerTargetChange = (value: string) => {
    setDreamerTarget(value);
    if (value && previousNightAction?.dreamerTarget === value) {
      setDreamerWarning(`⚠️ 摄梦人不能连续两晚选择同一个人（上一晚选择了 ${value}）`);
    } else {
      setDreamerWarning('');
    }
  };
  
  // 禁言长老连续禁言检查
  const handleMuterTargetChange = (value: string) => {
    setMuterTarget(value);
    if (value && previousNightAction?.muterTarget === value) {
      setMuterWarning(`⚠️ 禁言长老不能连续两晚禁言同一个人（上一晚禁言了 ${value}）`);
    } else {
      setMuterWarning('');
    }
  };
  
  // 流光伯爵连续庇护检查
  const handleCountTargetChange = (value: string) => {
    setCountTarget(value);
    if (value && previousNightAction?.countTarget === value) {
      setCountWarning(`⚠️ 流光伯爵不能连续两晚庇护同一个人（上一晚庇护了 ${value}）`);
    } else {
      setCountWarning('');
    }
  };
  
  // 狼美人连续魅惑检查
  const handleWolfbeautyTargetChange = (value: string) => {
    setWolfbeautyTarget(value);
    if (value && previousNightAction?.wolfbeautyCharm === value) {
      setWolfbeautyWarning(`⚠️ 狼美人不能连续两晚魅惑同一个人（上一晚魅惑了 ${value}）`);
    } else {
      setWolfbeautyWarning('');
    }
  };
  
  // 女巫用药互斥
  const handleWitchSaveChange = (value: boolean) => {
    if (hasWitchUsedSave) return;
    setWitchSave(value);
    if (value) {
      setWitchPoison('');
    }
  };
  
  const handleWitchPoisonChange = (value: string) => {
    if (hasWitchUsedPoison) return;
    if (witchSave) return;
    setWitchPoison(value);
  };
  
  // 炼金魔女未明之雾选择
  const handleAlchemistFogChange = (playerName: string) => {
    setAlchemistFog(prev => {
      if (prev.includes(playerName)) {
        return prev.filter(p => p !== playerName);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, playerName];
    });
  };

  const handleSave = () => {
    const action: NightAction = {
      round,
      // 基础角色
      seerCheck: seerTarget ? { target: seerTarget, result: getSeerResult(seerTarget) } : undefined,
      werewolfKill: werewolfTarget || undefined,
      witchSave,
      witchPoison: witchPoison || undefined,
      guardProtect: guardTarget || undefined,
      // 新增角色
      gravediggerCheck: gravediggerTarget ? { 
        target: gravediggerTarget, 
        result: isWerewolf(gravediggerTarget) ? 'evil' : 'good' 
      } : undefined,
      crowCurse: crowTarget || undefined,
      magicianSwap: (magicianSwap1 && magicianSwap2) ? { player1: magicianSwap1, player2: magicianSwap2 } : undefined,
      dreamerTarget: dreamerTarget || undefined,
      demonhunterTarget: demonhunterTarget || undefined,
      muterTarget: muterTarget || undefined,
      miracleTarget: miracleTarget || undefined,
      miracleSkill: miracleTarget ? miracleSkill : undefined,
      pureCheck: pureTarget ? { 
        target: pureTarget, 
        result: isWerewolf(pureTarget) ? (round >= 2 ? 'killed' : 'evil') : 'good' 
      } : undefined,
      countTarget: countTarget || undefined,
      alchemistFog: alchemistFog.length > 0 ? alchemistFog : undefined,
      alchemistSave: alchemistSave || undefined,
      wolfbeautyCharm: wolfbeautyTarget || undefined,
      gargoyleCheck: gargoyleTarget ? { 
        target: gargoyleTarget, 
        role: getPlayerRole(gargoyleTarget) || '未知' 
      } : undefined,
      nightmareTarget: nightmareTarget || undefined,
      wolfwitchCheck: wolfwitchTarget ? { 
        target: wolfwitchTarget, 
        role: getPlayerRole(wolfwitchTarget) || '未知' 
      } : undefined,
      cupidLovers: (cupidLovers[0] && cupidLovers[1]) ? cupidLovers : undefined,
      admirerTarget: admirerTarget || undefined,
    };
    onSave(action);
  };

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <h4 className="text-purple-400 font-medium flex items-center gap-2">
        <Moon className="w-4 h-4" />
        第{round}晚记录
      </h4>
      
      {/* 丘比特（仅第一晚） */}
      {hasCupid && round === 1 && (
        <div className="space-y-2 border-b border-pink-500/30 pb-4">
          <label className="text-pink-400 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" />
            丘比特连情侣
          </label>
          <div className="flex gap-2">
            <select
              value={cupidLovers[0]}
              onChange={(e) => setCupidLovers([e.target.value, cupidLovers[1]])}
              className="flex-1 bg-slate-900 border border-pink-500/50 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">选择第一人</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <span className="text-pink-400 self-center">💕</span>
            <select
              value={cupidLovers[1]}
              onChange={(e) => setCupidLovers([cupidLovers[0], e.target.value])}
              className="flex-1 bg-slate-900 border border-pink-500/50 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">选择第二人</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* 暗恋者（仅第一晚） */}
      {hasAdmirer && round === 1 && (
        <div className="space-y-2 border-b border-pink-500/30 pb-4">
          <label className="text-pink-400 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" />
            暗恋者选择暗恋对象
          </label>
          <select
            value={admirerTarget}
            onChange={(e) => setAdmirerTarget(e.target.value)}
            className="w-full bg-slate-900 border border-pink-500/50 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未选择</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* 魔术师 */}
      {hasMagician && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            魔术师交换
          </label>
          <div className="flex gap-2">
            <select
              value={magicianSwap1}
              onChange={(e) => setMagicianSwap1(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">选择第一人</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <span className="text-purple-400 self-center">⇄</span>
            <select
              value={magicianSwap2}
              onChange={(e) => setMagicianSwap2(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">选择第二人</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* 守卫 */}
      {hasGuard && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            守卫守护
          </label>
          <select
            value={guardTarget}
            onChange={(e) => handleGuardTargetChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未守护</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {guardWarning && (
            <p className="text-yellow-500 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {guardWarning}
            </p>
          )}
        </div>
      )}
      
      {/* 流光伯爵 */}
      {hasCount && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-cyan-400" />
            流光伯爵庇护
          </label>
          <select
            value={countTarget}
            onChange={(e) => handleCountTargetChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未庇护</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {countWarning && (
            <p className="text-yellow-500 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {countWarning}
            </p>
          )}
        </div>
      )}

      {/* 狼人 */}
      <div className="space-y-2">
        <label className="text-slate-400 text-sm flex items-center gap-2">
          <Skull className="w-4 h-4 text-red-400" />
          狼人击杀
        </label>
        <select
          value={werewolfTarget}
          onChange={(e) => setWerewolfTarget(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="">空刀</option>
          {alivePlayers.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>
      
      {/* 噩梦之影 */}
      {hasNightmare && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Ghost className="w-4 h-4 text-indigo-400" />
            噩梦之影恐惧
          </label>
          <select
            value={nightmareTarget}
            onChange={(e) => setNightmareTarget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未恐惧</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* 狼美人 */}
      {hasWolfbeauty && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400" />
            狼美人魅惑
          </label>
          <select
            value={wolfbeautyTarget}
            onChange={(e) => handleWolfbeautyTargetChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未魅惑</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {wolfbeautyWarning && (
            <p className="text-yellow-500 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {wolfbeautyWarning}
            </p>
          )}
        </div>
      )}

      {/* 女巫 */}
      <div className="space-y-2">
        <label className="text-slate-400 text-sm flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-pink-400" />
          女巫操作
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleWitchSaveChange(!witchSave)}
            disabled={hasWitchUsedSave}
            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
              hasWitchUsedSave
                ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                : witchSave 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                  : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            {hasWitchUsedSave 
              ? '解药已用完' 
              : witchSave 
                ? '✓ 使用解药' 
                : '使用解药'}
          </button>
        </div>
        {hasWitchUsedSave && (
          <p className="text-slate-500 text-xs">女巫解药只有一瓶，已在之前的夜晚使用</p>
        )}
        <select
          value={witchPoison}
          onChange={(e) => handleWitchPoisonChange(e.target.value)}
          disabled={witchSave || hasWitchUsedPoison}
          className={`w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm ${
            witchSave || hasWitchUsedPoison ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value="">
            {hasWitchUsedPoison ? '毒药已用完' : '不使用毒药'}
          </option>
          {!hasWitchUsedPoison && alivePlayers.map(p => (
            <option key={p.id} value={p.name}>毒 {p.name}</option>
          ))}
        </select>
        {witchSave && !hasWitchUsedSave && (
          <p className="text-yellow-500 text-xs">使用解药后不能使用毒药</p>
        )}
        {hasWitchUsedPoison && (
          <p className="text-slate-500 text-xs">女巫毒药只有一瓶，已在之前的夜晚使用</p>
        )}
      </div>
      
      {/* 摄梦人 */}
      {hasDreamer && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            摄梦人选择梦游者
          </label>
          <select
            value={dreamerTarget}
            onChange={(e) => handleDreamerTargetChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未选择</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {dreamerWarning && (
            <p className="text-yellow-500 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {dreamerWarning}
            </p>
          )}
        </div>
      )}
      
      {/* 炼金魔女 */}
      {hasAlchemist && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-lime-400" />
            炼金魔女
          </label>
          {!hasAlchemistFogUsed && (
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">未明之雾（选择3人，狼人必须从中刀人）</p>
              <div className="flex flex-wrap gap-2">
                {alivePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAlchemistFogChange(p.name)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      alchemistFog.includes(p.name)
                        ? 'bg-lime-500/30 text-lime-400 border border-lime-500/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {p.name} {alchemistFog.includes(p.name) && '✓'}
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs">已选择: {alchemistFog.join(', ') || '无'}</p>
            </div>
          )}
          {hasAlchemistFogUsed && <p className="text-slate-500 text-xs">未明之雾已使用</p>}
          
          {!hasAlchemistSaveUsed && (
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">法老之蛇（救活该玩家）</p>
              <select
                value={alchemistSave}
                onChange={(e) => setAlchemistSave(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="">不使用</option>
                {alivePlayers.map(p => (
                  <option key={p.id} value={p.name}>救 {p.name}</option>
                ))}
              </select>
            </div>
          )}
          {hasAlchemistSaveUsed && <p className="text-slate-500 text-xs">法老之蛇已使用</p>}
        </div>
      )}

      {/* 预言家 */}
      <div className="space-y-2">
        <label className="text-slate-400 text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          预言家查验
        </label>
        <div className="flex gap-2">
          <select
            value={seerTarget}
            onChange={(e) => setSeerTarget(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未查验</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {seerTarget && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              getSeerResult(seerTarget) === 'good'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
              {getSeerResult(seerTarget) === 'good' ? '好人' : '狼人'}
            </div>
          )}
        </div>
      </div>
      
      {/* 纯白之女 */}
      {hasPure && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            纯白之女查验
          </label>
          <div className="flex gap-2">
            <select
              value={pureTarget}
              onChange={(e) => setPureTarget(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">未查验</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            {pureTarget && (
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                isWerewolf(pureTarget)
                  ? round >= 2 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              }`}>
                {isWerewolf(pureTarget) 
                  ? (round >= 2 ? '狼人(出局!)' : '狼人') 
                  : '好人'}
              </div>
            )}
          </div>
          {round >= 2 && (
            <p className="text-yellow-500 text-xs">⚠️ 从第二夜起，查验到狼人则狼人出局！</p>
          )}
        </div>
      )}
      
      {/* 石像鬼 */}
      {hasGargoyle && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            石像鬼查验
          </label>
          <div className="flex gap-2">
            <select
              value={gargoyleTarget}
              onChange={(e) => setGargoyleTarget(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">未查验</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            {gargoyleTarget && (
              <div className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-500/20 text-gray-300 border border-gray-500/50">
                {getPlayerRole(gargoyleTarget) ? ROLES[getPlayerRole(gargoyleTarget)!]?.name : '未知'}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 狼巫 */}
      {hasWolfwitch && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-fuchsia-400" />
            狼巫查验
          </label>
          <div className="flex gap-2">
            <select
              value={wolfwitchTarget}
              onChange={(e) => setWolfwitchTarget(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">未查验</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            {wolfwitchTarget && (
              <div className="px-3 py-2 rounded-lg text-sm font-medium bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50">
                {getPlayerRole(wolfwitchTarget) ? ROLES[getPlayerRole(wolfwitchTarget)!]?.name : '未知'}
                {getPlayerRole(wolfwitchTarget) === 'pure' && round >= 2 && ' (纯白出局!)'}
              </div>
            )}
          </div>
          {round >= 2 && (
            <p className="text-yellow-500 text-xs">⚠️ 从第二夜起，验到纯白之女则纯白出局！</p>
          )}
        </div>
      )}
      
      {/* 猎魔人 */}
      {hasDemonhunter && round >= 2 && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-500" />
            猎魔人狩猎
          </label>
          <select
            value={demonhunterTarget}
            onChange={(e) => setDemonhunterTarget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未狩猎</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {demonhunterTarget && (
            <p className={`text-xs ${isWerewolf(demonhunterTarget) ? 'text-red-400' : 'text-yellow-400'}`}>
              {isWerewolf(demonhunterTarget) ? '对方是狼人，次日狼人出局' : '对方是好人，次日猎魔人出局'}
            </p>
          )}
        </div>
      )}
      
      {/* 乌鸦 */}
      {hasCrow && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Skull className="w-4 h-4 text-gray-600" />
            乌鸦诅咒
          </label>
          <select
            value={crowTarget}
            onChange={(e) => handleCrowTargetChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未诅咒</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {crowWarning && (
            <p className="text-yellow-500 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {crowWarning}
            </p>
          )}
        </div>
      )}
      
      {/* 禁言长老 */}
      {hasMuter && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            禁言长老禁言
          </label>
          <select
            value={muterTarget}
            onChange={(e) => handleMuterTargetChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未禁言</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {muterWarning && (
            <p className="text-yellow-500 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {muterWarning}
            </p>
          )}
        </div>
      )}
      
      {/* 奇迹商人 */}
      {hasMiracle && !hasMiracleUsed && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            奇迹商人给技能
          </label>
          <select
            value={miracleTarget}
            onChange={(e) => setMiracleTarget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未选择</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {miracleTarget && (
            <div className="flex gap-2">
              {(['seer', 'witch', 'guard'] as const).map((skill) => (
                <button
                  key={skill}
                  onClick={() => setMiracleSkill(skill)}
                  className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                    miracleSkill === skill
                      ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  {skill === 'seer' ? '查验' : skill === 'witch' ? '毒药' : '守护'}
                </button>
              ))}
            </div>
          )}
          {miracleTarget && isWerewolf(miracleTarget) && (
            <p className="text-red-400 text-xs">⚠️ 幸运儿是狼人，次日奇迹商人出局！</p>
          )}
        </div>
      )}
      {hasMiracleUsed && (
        <p className="text-slate-500 text-xs">奇迹商人技能已使用</p>
      )}
      
      {/* 守墓人 */}
      {hasGravedigger && round > 1 && (
        <div className="space-y-2">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <Skull className="w-4 h-4 text-stone-400" />
            守墓人查验昨天放逐者
          </label>
          <select
            value={gravediggerTarget}
            onChange={(e) => setGravediggerTarget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">未查验</option>
            {alivePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {gravediggerTarget && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              isWerewolf(gravediggerTarget)
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            }`}>
              {isWerewolf(gravediggerTarget) ? '狼人' : '好人'}
            </div>
          )}
        </div>
      )}

      {/* 按钮 */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center justify-center gap-1"
        >
          <Check className="w-4 h-4" />
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  );
}

// 白天投票表单
function DayVoteForm({ 
  players, 
  roles,
  round,
  allDayVotes = [],
  onSave, 
  onCancel 
}: { 
  players: Player[]; 
  roles: RoleConfig[];
  round: number;
  allDayVotes?: DayVote[];
  onSave: (vote: DayVote & { specialActions?: DaySpecialAction[] }) => void; 
  onCancel: () => void;
}) {
  const [executed, setExecuted] = useState('');
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [specialActions, setSpecialActions] = useState<DaySpecialAction[]>([]);

  const alivePlayers = players.filter(p => p.is_alive && !p.is_host);
  
  // 检查是否有特殊角色
  const hasWolfgun = roles.some(r => r.type === 'wolfgun' && r.count > 0);
  const hasWhitewolf = roles.some(r => r.type === 'whitewolf' && r.count > 0);
  const hasKnight = roles.some(r => r.type === 'knight' && r.count > 0);
  const hasPrince = roles.some(r => r.type === 'prince' && r.count > 0);
  const hasBloodmoon = roles.some(r => r.type === 'bloodmoon' && r.count > 0);
  const hasRedmoon = roles.some(r => r.type === 'redmoon' && r.count > 0);
  
  // 获取玩家角色
  const getPlayerRole = (playerName: string): RoleType | null => {
    const player = players.find(p => p.name === playerName);
    return player?.role as RoleType || null;
  };
  
  // 检查是否是特定角色
  const isWolfgun = (playerName: string): boolean => getPlayerRole(playerName) === 'wolfgun';
  const isWhitewolf = (playerName: string): boolean => getPlayerRole(playerName) === 'whitewolf';
  const isKnight = (playerName: string): boolean => getPlayerRole(playerName) === 'knight';
  const isPrince = (playerName: string): boolean => getPlayerRole(playerName) === 'prince';
  const isBloodmoon = (playerName: string): boolean => getPlayerRole(playerName) === 'bloodmoon';
  const isRedmoon = (playerName: string): boolean => getPlayerRole(playerName) === 'redmoon';
  
  // 检查是否是狼人阵营
  const isWerewolfTeam = (playerName: string): boolean => {
    const role = getPlayerRole(playerName);
    return role ? ROLE_CATEGORIES[role] === 'werewolf' : false;
  };
  
  // 检查定序王子是否已使用过技能
  const hasPrinceUsed = allDayVotes.some((v: DayVote) => v.specialActions?.some((a: DaySpecialAction) => a.type === 'prince_reverse'));

  const handleSave = () => {
    onSave({
      round,
      executed: executed || undefined,
      votes,
      specialActions: specialActions.length > 0 ? specialActions : undefined,
    });
  };
  
  // 添加特殊行动
  const addSpecialAction = (action: DaySpecialAction) => {
    setSpecialActions(prev => [...prev, action]);
  };
  
  // 移除特殊行动
  const removeSpecialAction = (index: number) => {
    setSpecialActions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 space-y-4">
      <h4 className="text-yellow-400 font-medium flex items-center gap-2">
        <Sun className="w-4 h-4" />
        第{round}天投票
      </h4>
      
      {/* 特殊行动记录 */}
      {(hasWolfgun || hasWhitewolf || hasKnight || hasPrince || hasBloodmoon || hasRedmoon) && (
        <div className="space-y-2 border-b border-slate-700 pb-4">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            特殊行动记录
          </label>
          
          {/* 白狼王自爆 */}
          {hasWhitewolf && (
            <div className="space-y-2">
              <label className="text-slate-500 text-xs">白狼王自爆</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      addSpecialAction({
                        type: 'whitewolf_explode',
                        player: e.target.value,
                      });
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">选择自爆的白狼王</option>
                  {alivePlayers.filter(p => isWhitewolf(p.name)).map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
                  onChange={(e) => {
                    const lastAction = specialActions[specialActions.length - 1];
                    if (lastAction?.type === 'whitewolf_explode' && e.target.value) {
                      const updated = [...specialActions];
                      updated[updated.length - 1] = { ...lastAction, target: e.target.value };
                      setSpecialActions(updated);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">选择带走的目标</option>
                  {alivePlayers.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* 骑士决斗 */}
          {hasKnight && (
            <div className="space-y-2">
              <label className="text-slate-500 text-xs">骑士决斗</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      addSpecialAction({
                        type: 'knight_duel',
                        player: e.target.value,
                      });
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">选择发起决斗的骑士</option>
                  {alivePlayers.filter(p => isKnight(p.name)).map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
                  onChange={(e) => {
                    const lastAction = specialActions[specialActions.length - 1];
                    if (lastAction?.type === 'knight_duel' && e.target.value) {
                      const updated = [...specialActions];
                      updated[updated.length - 1] = { 
                        ...lastAction, 
                        target: e.target.value,
                        result: isWerewolfTeam(e.target.value) ? 'success' : 'fail'
                      };
                      setSpecialActions(updated);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">选择决斗目标</option>
                  {alivePlayers.filter(p => !isKnight(p.name)).map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* 定序王子逆转投票 */}
          {hasPrince && !hasPrinceUsed && (
            <div className="space-y-2">
              <label className="text-slate-500 text-xs">定序王子逆转投票</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    addSpecialAction({
                      type: 'prince_reverse',
                      player: e.target.value,
                    });
                    e.target.value = '';
                  }
                }}
              >
                <option value="">选择发动技能的定序王子</option>
                {alivePlayers.filter(p => isPrince(p.name)).map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* 血月使徒/赤月使徒自爆 */}
          {(hasBloodmoon || hasRedmoon) && (
            <div className="space-y-2">
              <label className="text-slate-500 text-xs">血月使徒/赤月使徒自爆</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    addSpecialAction({
                      type: 'whitewolf_explode',
                      player: e.target.value,
                    });
                    e.target.value = '';
                  }
                }}
              >
                <option value="">选择自爆的玩家</option>
                {alivePlayers.filter(p => isBloodmoon(p.name) || isRedmoon(p.name)).map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <p className="text-yellow-500 text-xs">⚠️ 自爆后当晚所有好人技能被封印！</p>
            </div>
          )}
          
          {/* 已记录的特殊行动 */}
          {specialActions.length > 0 && (
            <div className="space-y-1 mt-2">
              {specialActions.map((action, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900 rounded-lg px-2 py-1">
                  <span className="text-slate-300 text-xs">
                    {action.type === 'whitewolf_explode' && `🐺👑 ${action.player} 自爆${action.target ? `带走 ${action.target}` : ''}`}
                    {action.type === 'knight_duel' && `⚔️ ${action.player} 决斗 ${action.target} (${action.result === 'success' ? '成功' : '失败'})`}
                    {action.type === 'prince_reverse' && `👑 ${action.player} 发动定序，逆转投票重新投票`}
                    {action.type === 'wolfgun_shoot' && `🐺🔫 ${action.player} 开枪带走 ${action.target}`}
                  </span>
                  <button
                    onClick={() => removeSpecialAction(idx)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 出局玩家 */}
      <div className="space-y-2">
        <label className="text-slate-400 text-sm">被投出局</label>
        <select
          value={executed}
          onChange={(e) => {
            setExecuted(e.target.value);
            // 如果被投出局的是狼枪，自动添加开枪记录
            if (e.target.value && isWolfgun(e.target.value)) {
              // 狼枪被票出可以开枪，但需要在保存时处理
            }
          }}
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="">平票/无人出局</option>
          {alivePlayers.map(p => (
            <option key={p.id} value={p.name}>
              {p.name} {isWolfgun(p.name) ? '(狼枪可开枪)' : ''}
            </option>
          ))}
        </select>
        {executed && isWolfgun(executed) && (
          <div className="space-y-2 mt-2">
            <label className="text-slate-500 text-xs">狼枪开枪目标</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  addSpecialAction({
                    type: 'wolfgun_shoot',
                    player: executed,
                    target: e.target.value,
                  });
                }
              }}
            >
              <option value="">选择开枪目标（可选）</option>
              {alivePlayers.filter(p => p.name !== executed).map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 投票记录 */}
      <div className="space-y-2">
        <label className="text-slate-400 text-sm">投票记录</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {alivePlayers.map(voter => (
            <div key={voter.id} className="flex items-center gap-2">
              <span className="text-slate-300 text-sm w-16 truncate">{voter.name}</span>
              <span className="text-slate-500">→</span>
              <select
                value={votes[voter.name] || ''}
                onChange={(e) => setVotes({ ...votes, [voter.name]: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-sm"
              >
                <option value="">弃票</option>
                {alivePlayers.filter(p => p.id !== voter.id).map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm flex items-center justify-center gap-1"
        >
          <Check className="w-4 h-4" />
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  );
}

// 游戏结束弹窗
function GameEndModal({ 
  winner, 
  reason, 
  onConfirm, 
  onCancel 
}: { 
  winner: 'good' | 'evil'; 
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border-2 border-purple-500/50">
        <div className="text-center mb-6">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${
            winner === 'good' ? 'text-blue-400' : 'text-red-400'
          }`} />
          <h2 className={`text-2xl font-bold mb-2 ${
            winner === 'good' ? 'text-blue-400' : 'text-red-400'
          }`}>
            {winner === 'good' ? '好人阵营胜利！' : '狼人阵营胜利！'}
          </h2>
          <p className="text-slate-400">{reason}</p>
        </div>
        
        <p className="text-slate-500 text-sm text-center mb-6">
          确认后将结束游戏并同步结果给所有玩家
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            确认结束
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            继续游戏
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModeratorPanel({ 
  players, 
  roles,
  winMode,
  currentRound, 
  nightActions, 
  dayVotes,
  onAddNightAction,
  onAddDayVote,
  onPlayerDie,
  onGameEnd,
}: ModeratorPanelProps) {
  const [showNightForm, setShowNightForm] = useState(false);
  const [showDayForm, setShowDayForm] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState<number[]>([1]);
  const [pendingGameEnd, setPendingGameEnd] = useState<{ winner: 'good' | 'evil'; reason: string } | null>(null);

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => 
      prev.includes(round) 
        ? prev.filter(r => r !== round)
        : [...prev, round]
    );
  };

  // 合并所有记录按回合排序
  const allRounds = Array.from(new Set([
    ...nightActions.map(a => a.round),
    ...dayVotes.map(v => v.round),
  ])).sort((a, b) => a - b);

  // 处理夜晚记录保存
  const handleNightActionSave = (action: NightAction) => {
    // 计算夜晚结果
    const result = calculateNightResult(action, players);
    
    // 将结果添加到action中
    const actionWithResult: NightAction = {
      ...action,
      result,
    };
    
    // 更新玩家死亡状态
    result.died.forEach(playerId => {
      onPlayerDie(playerId);
    });
    
    // 保存记录
    onAddNightAction(actionWithResult);
    setShowNightForm(false);
    
    // 检查游戏是否结束
    const updatedPlayers = players.map(p => 
      result.died.includes(p.id) ? { ...p, is_alive: false } : p
    );
    const gameEnd = checkGameEnd(updatedPlayers, winMode);
    if (gameEnd.ended) {
      setPendingGameEnd({ winner: gameEnd.winner!, reason: gameEnd.reason! });
    }
  };

  // 处理白天投票保存
  const handleDayVoteSave = (vote: DayVote & { specialActions?: DaySpecialAction[] }) => {
    // 更新被投出局的玩家
    if (vote.executed) {
      const executedPlayer = players.find(p => p.name === vote.executed);
      if (executedPlayer) {
        onPlayerDie(executedPlayer.id);
      }
    }
    
    // 处理特殊行动导致的死亡
    if (vote.specialActions) {
      vote.specialActions.forEach(action => {
        if (action.type === 'whitewolf_explode' && action.target) {
          // 白狼王自爆带走目标
          const target = players.find(p => p.name === action.target);
          if (target) {
            onPlayerDie(target.id);
          }
          // 白狼王自己也死亡
          const whiteWolf = players.find(p => p.name === action.player);
          if (whiteWolf) {
            onPlayerDie(whiteWolf.id);
          }
        } else if (action.type === 'knight_duel') {
          // 骑士决斗
          if (action.result === 'success' && action.target) {
            // 决斗成功，狼人死亡
            const target = players.find(p => p.name === action.target);
            if (target) {
              onPlayerDie(target.id);
            }
          } else if (action.result === 'fail') {
            // 决斗失败，骑士死亡
            const knight = players.find(p => p.name === action.player);
            if (knight) {
              onPlayerDie(knight.id);
            }
          }
        } else if (action.type === 'wolfgun_shoot' && action.target) {
          // 狼枪开枪带走目标
          const target = players.find(p => p.name === action.target);
          if (target) {
            onPlayerDie(target.id);
          }
        }
      });
    }
    
    // 保存记录
    onAddDayVote(vote);
    setShowDayForm(false);
    
    // 检查游戏是否结束
    let updatedPlayers = players.map(p => {
      if (vote.executed && p.name === vote.executed) {
        return { ...p, is_alive: false };
      }
      // 处理特殊行动死亡
      if (vote.specialActions) {
        vote.specialActions.forEach(action => {
          if (action.target && p.name === action.target) {
            return { ...p, is_alive: false };
          }
          if (p.name === action.player && (action.type === 'whitewolf_explode' || 
            (action.type === 'knight_duel' && action.result === 'fail'))) {
            return { ...p, is_alive: false };
          }
        });
      }
      return p;
    });
    
    const gameEnd = checkGameEnd(updatedPlayers, winMode);
    if (gameEnd.ended) {
      setPendingGameEnd({ winner: gameEnd.winner!, reason: gameEnd.reason! });
    }
  };

  // 确认游戏结束
  const handleConfirmGameEnd = () => {
    if (pendingGameEnd) {
      onGameEnd(pendingGameEnd.winner, pendingGameEnd.reason);
      setPendingGameEnd(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 游戏结束弹窗 */}
      {pendingGameEnd && (
        <GameEndModal
          winner={pendingGameEnd.winner}
          reason={pendingGameEnd.reason}
          onConfirm={handleConfirmGameEnd}
          onCancel={() => setPendingGameEnd(null)}
        />
      )}

      {/* 快速操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowNightForm(true); setShowDayForm(false); }}
          className="flex-1 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Moon className="w-4 h-4" />
          记录夜晚
        </button>
        <button
          onClick={() => { setShowDayForm(true); setShowNightForm(false); }}
          className="flex-1 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Sun className="w-4 h-4" />
          记录白天
        </button>
      </div>

      {/* 记录表单 */}
      {showNightForm && (
        <NightActionForm
          players={players}
          roles={roles}
          round={currentRound}
          allNightActions={nightActions}
          onSave={handleNightActionSave}
          onCancel={() => setShowNightForm(false)}
        />
      )}

      {showDayForm && (
        <DayVoteForm
          players={players}
          roles={roles}
          round={currentRound}
          allDayVotes={dayVotes}
          onSave={handleDayVoteSave}
          onCancel={() => setShowDayForm(false)}
        />
      )}

      {/* 历史记录 */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
          <Scroll className="w-5 h-5" />
          游戏记录
        </h3>

        {allRounds.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">暂无记录</p>
        ) : (
          <div className="space-y-2">
            {allRounds.map(round => {
              const nightAction = nightActions.find(a => a.round === round);
              const dayVote = dayVotes.find(v => v.round === round);
              const isExpanded = expandedRounds.includes(round);

              return (
                <div key={round} className="bg-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleRound(round)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-white font-medium">第 {round} 回合</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* 夜晚记录 */}
                      {nightAction && (
                        <div className="space-y-1">
                          <p className="text-indigo-400 text-sm font-medium flex items-center gap-1">
                            <Moon className="w-3 h-3" />
                            夜晚
                          </p>
                          {nightAction.guardProtect && (
                            <p className="text-slate-400 text-xs pl-4">
                              <Shield className="w-3 h-3 inline mr-1 text-blue-400" />
                              守卫守护: {nightAction.guardProtect}
                            </p>
                          )}
                          {nightAction.werewolfKill && (
                            <p className="text-slate-400 text-xs pl-4">
                              <Skull className="w-3 h-3 inline mr-1 text-red-400" />
                              狼人击杀: {nightAction.werewolfKill}
                            </p>
                          )}
                          {nightAction.witchSave && (
                            <p className="text-slate-400 text-xs pl-4">
                              <FlaskConical className="w-3 h-3 inline mr-1 text-green-400" />
                              女巫使用解药
                            </p>
                          )}
                          {nightAction.witchPoison && (
                            <p className="text-slate-400 text-xs pl-4">
                              <FlaskConical className="w-3 h-3 inline mr-1 text-pink-400" />
                              女巫毒杀: {nightAction.witchPoison}
                            </p>
                          )}
                          {nightAction.seerCheck && (
                            <p className="text-slate-400 text-xs pl-4">
                              <Eye className="w-3 h-3 inline mr-1 text-purple-400" />
                              预言家查验 {nightAction.seerCheck.target}: 
                              <span className={nightAction.seerCheck.result === 'good' ? 'text-blue-400' : 'text-red-400'}>
                                {nightAction.seerCheck.result === 'good' ? '好人' : '狼人'}
                              </span>
                            </p>
                          )}
                          {/* 夜晚结果 */}
                          {nightAction.result && (
                            <div className={`mt-2 pl-4 py-2 rounded-lg ${
                              nightAction.result.isPeaceful 
                                ? 'bg-green-500/10' 
                                : 'bg-red-500/10'
                            }`}>
                              <p className={`text-xs font-medium ${
                                nightAction.result.isPeaceful ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {nightAction.result.isPeaceful ? (
                                  <><Check className="w-3 h-3 inline mr-1" /> 平安夜</>
                                ) : (
                                  <><Skull className="w-3 h-3 inline mr-1" /> 出局玩家</>
                                )}
                              </p>
                              {nightAction.result.details.map((detail, idx) => (
                                <p key={idx} className="text-slate-400 text-xs mt-0.5">{detail}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 白天记录 */}
                      {dayVote && (
                        <div className="space-y-1">
                          <p className="text-yellow-400 text-sm font-medium flex items-center gap-1">
                            <Sun className="w-3 h-3" />
                            白天
                          </p>
                          {dayVote.executed ? (
                            <p className="text-slate-400 text-xs pl-4">
                              <Skull className="w-3 h-3 inline mr-1 text-red-400" />
                              被投出局: {dayVote.executed}
                            </p>
                          ) : (
                            <p className="text-slate-500 text-xs pl-4">平票，无人出局</p>
                          )}
                          {Object.entries(dayVote.votes).filter(([_, v]) => v).length > 0 && (
                            <div className="pl-4">
                              <p className="text-slate-500 text-xs">投票详情:</p>
                              {Object.entries(dayVote.votes).filter(([_, v]) => v).map(([voter, target]) => (
                                <p key={voter} className="text-slate-400 text-xs pl-2">
                                  {voter} → {target}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
