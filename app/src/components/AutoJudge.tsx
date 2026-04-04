import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Mic, Volume2, VolumeX, Moon, Sun, 
  Play, SkipForward, Users, Eye,
  Crown, Skull, RotateCcw, LogOut, Shield, Heart, Bell
} from 'lucide-react';
import type { AutoJudgePhaseState, AutoJudgeSyncState, Player, RoleType, RoomStatus } from '@/types';
import { ROLES } from '@/lib/gameConfig';
import { updateRoom } from '@/lib/supabase';

// 夜晚环节定义
interface NightPhase {
  id: string;
  name: string;
  role: RoleType | 'all';
  announcement: string;
  closeEyesAnnouncement: string;
  actionPrompt: string;
  actionType: 'single' | 'double' | 'witch' | 'none';
}

// 出局信息
interface DeathInfo {
  playerId: string;
  playerName: string;
  role: RoleType;
  reason: string;
}

// 夜晚操作记录
interface NightAction {
  phaseId: string;
  playerId?: string;
  targetId?: string;
  secondTargetId?: string;
  action?: string;
}

interface AutoJudgeProps {
  roomId: string;
  players: Player[];
  roles: RoleType[];
  isHost: boolean;
  hostToken?: string | null;
  roomStatus?: RoomStatus;
  syncedState?: AutoJudgeSyncState | string | null;
  syncedRound?: number;
  syncedActions?: unknown[];
  autoJudgeEnabled?: boolean;
  enableSheriff?: boolean;
  currentPlayerId?: string;
  currentPlayerRole?: RoleType;
  onExit: () => void;
}

const AUTO_JUDGE_STATES: AutoJudgePhaseState[] = ['waiting', 'dealing', 'night', 'day', 'ended'];

function isAutoJudgePhaseState(value: unknown): value is AutoJudgePhaseState {
  return typeof value === 'string' && AUTO_JUDGE_STATES.includes(value as AutoJudgePhaseState);
}

function normalizeSyncedState(raw: AutoJudgeSyncState | string | null | undefined): AutoJudgeSyncState | null {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    return isAutoJudgePhaseState(raw) ? { state: raw } : null;
  }

  if (!isAutoJudgePhaseState(raw.state)) {
    return null;
  }

  return {
    state: raw.state,
    detailPhase: typeof raw.detailPhase === 'string' ? raw.detailPhase : null,
    round: typeof raw.round === 'number' ? raw.round : undefined,
    waitingForAction: !!raw.waitingForAction,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

function normalizeNightActions(raw: unknown): NightAction[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      phaseId: typeof item.phaseId === 'string' ? item.phaseId : '',
      playerId: typeof item.playerId === 'string' ? item.playerId : undefined,
      targetId: typeof item.targetId === 'string' ? item.targetId : undefined,
      secondTargetId: typeof item.secondTargetId === 'string' ? item.secondTargetId : undefined,
      action: typeof item.action === 'string' ? item.action : undefined,
    }))
    .filter((item) => item.phaseId);
}

// 语音合成 - 兼容微信浏览器
const useSpeech = () => {
  const [isReady, setIsReady] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
        const loadVoices = () => {
          const voices = synthRef.current?.getVoices();
          if (voices && voices.length > 0) {
            setIsReady(true);
          }
        };
        loadVoices();
        if (synthRef.current.onvoiceschanged !== undefined) {
          synthRef.current.onvoiceschanged = loadVoices;
        }
      }

      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const ContextCtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        audioContextRef.current = new ContextCtor();
      }

      // 某些移动端环境即使 voices 延迟，也允许先尝试 speak。
      setIsReady(true);
    }

    const unlockAudio = () => {
      if (unlockedRef.current) {
        return;
      }

      unlockedRef.current = true;
      void audioContextRef.current?.resume();

      if (synthRef.current) {
        try {
          const warmup = new SpeechSynthesisUtterance(' ');
          warmup.volume = 0;
          synthRef.current.cancel();
          synthRef.current.speak(warmup);
        } catch (error) {
          console.warn('Speech warmup failed:', error);
        }
      }
    };

    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('WeixinJSBridgeReady', unlockAudio as EventListener, { once: true });

    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      document.removeEventListener('WeixinJSBridgeReady', unlockAudio as EventListener);
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const unlock = useCallback(() => {
    if (unlockedRef.current) {
      return;
    }
    unlockedRef.current = true;
    void audioContextRef.current?.resume();
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) {
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      onEnd?.();
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = synthRef.current.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (error) => {
      console.warn('Speech synthesis failed, fallback to vibration:', error);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      onEnd?.();
    };

    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { speak, stop, isReady, unlock };
};

export function AutoJudge({ 
  roomId,
  players, 
  roles, 
  isHost, 
  hostToken,
  roomStatus = 'waiting',
  syncedState,
  syncedRound = 1,
  syncedActions,
  autoJudgeEnabled = false,
  enableSheriff = true,
  currentPlayerId,
  currentPlayerRole,
  onExit 
}: AutoJudgeProps) {
  const initialSyncedState = normalizeSyncedState(syncedState);
  const initialRound = initialSyncedState?.round ?? syncedRound ?? 1;
  const initialGameState: AutoJudgePhaseState =
    initialSyncedState?.state ?? (roomStatus === 'playing' && autoJudgeEnabled ? 'dealing' : 'waiting');

  // 状态
  const [gameState, setGameState] = useState<AutoJudgePhaseState>(initialGameState);
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [currentPhase, setCurrentPhase] = useState<string>(initialSyncedState?.detailPhase ?? '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [deathInfo, setDeathInfo] = useState<DeathInfo[]>([]);
  const [showDeathInfo, setShowDeathInfo] = useState(false);
  const [nightActions, setNightActions] = useState<NightAction[]>(() => normalizeNightActions(syncedActions));
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedSecondPlayer, setSelectedPlayer2] = useState<string>('');
  const [witchSaveUsed, setWitchSaveUsed] = useState(false);
  const [witchPoisonUsed, setWitchPoisonUsed] = useState(false);
  const [waitingForAction, setWaitingForAction] = useState(false);
  const [showMyAction, setShowMyAction] = useState(false);
  const [actionResult, setActionResult] = useState<string>('');
  
  const waitingForActionRef = useRef(false);
  const { speak, unlock, isReady } = useSpeech();
  const alivePlayers = players.filter(p => !p.is_host && p.is_alive);

  useEffect(() => {
    waitingForActionRef.current = waitingForAction;
  }, [waitingForAction]);

  useEffect(() => {
    const nextSyncedState = normalizeSyncedState(syncedState);
    const nextActions = normalizeNightActions(syncedActions);

    if (nextSyncedState?.state) {
      setGameState(nextSyncedState.state);
    } else if (roomStatus === 'playing' && autoJudgeEnabled) {
      setGameState((prev) => (prev === 'waiting' ? 'dealing' : prev));
    }

    if (typeof nextSyncedState?.round === 'number') {
      setCurrentRound(nextSyncedState.round);
    } else if (typeof syncedRound === 'number' && syncedRound > 0) {
      setCurrentRound(syncedRound);
    }

    if (typeof nextSyncedState?.detailPhase === 'string') {
      setCurrentPhase(nextSyncedState.detailPhase);
    } else if (nextSyncedState?.state === 'day') {
      setCurrentPhase('day_start');
    }

    setWaitingForAction(!!nextSyncedState?.waitingForAction);
    setNightActions(nextActions);
  }, [autoJudgeEnabled, roomStatus, syncedActions, syncedRound, syncedState]);

  useEffect(() => {
    if (!waitingForAction || !currentPhase) {
      return;
    }

    if (nightActions.some((action) => action.phaseId === currentPhase)) {
      setWaitingForAction(false);
      setShowMyAction(false);
    }
  }, [currentPhase, nightActions, waitingForAction]);
  
  // 判断是否有某个角色
  const hasRole = useCallback((role: RoleType) => {
    return roles.includes(role);
  }, [roles]);
  
  // 获取夜晚流程
  const getNightPhases = useCallback((round: number = currentRound): NightPhase[] => {
    const phases: NightPhase[] = [];
    
    // 第一夜特殊流程
    if (round === 1) {
      if (hasRole('cupid')) {
        phases.push({
          id: 'cupid',
          name: '丘比特',
          role: 'cupid',
          announcement: '丘比特请睁眼',
          closeEyesAnnouncement: '丘比特请闭眼',
          actionPrompt: '请选择两名玩家成为情侣',
          actionType: 'double'
        });
      }
      if (hasRole('admirer')) {
        phases.push({
          id: 'admirer',
          name: '暗恋者',
          role: 'admirer',
          announcement: '暗恋者请睁眼',
          closeEyesAnnouncement: '暗恋者请闭眼',
          actionPrompt: '请选择暗恋对象',
          actionType: 'single'
        });
      }
      if (hasRole('miracle')) {
        phases.push({
          id: 'miracle',
          name: '奇迹商人',
          role: 'miracle',
          announcement: '奇迹商人请睁眼',
          closeEyesAnnouncement: '奇迹商人请闭眼',
          actionPrompt: '请选择幸运儿并给予技能',
          actionType: 'single'
        });
      }
    }
    
    // 守卫
    if (hasRole('guard')) {
      phases.push({
        id: 'guard',
        name: '守卫',
        role: 'guard',
        announcement: '守卫请睁眼',
        closeEyesAnnouncement: '守卫请闭眼',
        actionPrompt: '请选择今晚要守护的玩家',
        actionType: 'single'
      });
    }
    
    // 魔术师
    if (hasRole('magician')) {
      phases.push({
        id: 'magician',
        name: '魔术师',
        role: 'magician',
        announcement: '魔术师请睁眼',
        closeEyesAnnouncement: '魔术师请闭眼',
        actionPrompt: '请选择要交换号码牌的两名玩家',
        actionType: 'double'
      });
    }
    
    // 摄梦人
    if (hasRole('dreamer')) {
      phases.push({
        id: 'dreamer',
        name: '摄梦人',
        role: 'dreamer',
        announcement: '摄梦人请睁眼',
        closeEyesAnnouncement: '摄梦人请闭眼',
        actionPrompt: '请选择今晚的梦游者',
        actionType: 'single'
      });
    }
    
    // 流光伯爵
    if (hasRole('count')) {
      phases.push({
        id: 'count',
        name: '流光伯爵',
        role: 'count',
        announcement: '流光伯爵请睁眼',
        closeEyesAnnouncement: '流光伯爵请闭眼',
        actionPrompt: '请选择今晚要庇护的玩家',
        actionType: 'single'
      });
    }
    
    // 狼人
    phases.push({
      id: 'werewolf',
      name: '狼人',
      role: 'werewolf',
      announcement: '狼人请睁眼',
      closeEyesAnnouncement: '狼人请闭眼',
      actionPrompt: '请选择今晚要击杀的目标',
      actionType: 'single'
    });
    
    // 噩梦之影
    if (hasRole('nightmare')) {
      phases.push({
        id: 'nightmare',
        name: '噩梦之影',
        role: 'nightmare',
        announcement: '噩梦之影请睁眼',
        closeEyesAnnouncement: '噩梦之影请闭眼',
        actionPrompt: '请选择今晚要恐惧的玩家',
        actionType: 'single'
      });
    }
    
    // 狼美人
    if (hasRole('wolfbeauty')) {
      phases.push({
        id: 'wolfbeauty',
        name: '狼美人',
        role: 'wolfbeauty',
        announcement: '狼美人请睁眼',
        closeEyesAnnouncement: '狼美人请闭眼',
        actionPrompt: '请选择今晚要魅惑的玩家',
        actionType: 'single'
      });
    }
    
    // 石像鬼
    if (hasRole('gargoyle')) {
      phases.push({
        id: 'gargoyle',
        name: '石像鬼',
        role: 'gargoyle',
        announcement: '石像鬼请睁眼',
        closeEyesAnnouncement: '石像鬼请闭眼',
        actionPrompt: '请选择今晚要查验的玩家',
        actionType: 'single'
      });
    }
    
    // 狼巫
    if (hasRole('wolfwitch')) {
      phases.push({
        id: 'wolfwitch',
        name: '狼巫',
        role: 'wolfwitch',
        announcement: '狼巫请睁眼',
        closeEyesAnnouncement: '狼巫请闭眼',
        actionPrompt: '请选择今晚要查验的玩家',
        actionType: 'single'
      });
    }
    
    // 女巫
    if (hasRole('witch')) {
      phases.push({
        id: 'witch',
        name: '女巫',
        role: 'witch',
        announcement: '女巫请睁眼',
        closeEyesAnnouncement: '女巫请闭眼',
        actionPrompt: '请选择是否使用解药/毒药',
        actionType: 'witch'
      });
    }
    
    // 预言家
    if (hasRole('seer')) {
      phases.push({
        id: 'seer',
        name: '预言家',
        role: 'seer',
        announcement: '预言家请睁眼',
        closeEyesAnnouncement: '预言家请闭眼',
        actionPrompt: '请选择今晚要查验的玩家',
        actionType: 'single'
      });
    }
    
    // 纯白之女
    if (hasRole('pure')) {
      phases.push({
        id: 'pure',
        name: '纯白之女',
        role: 'pure',
        announcement: '纯白之女请睁眼',
        closeEyesAnnouncement: '纯白之女请闭眼',
        actionPrompt: '请选择今晚要查验的玩家',
        actionType: 'single'
      });
    }
    
    // 乌鸦
    if (hasRole('crow')) {
      phases.push({
        id: 'crow',
        name: '乌鸦',
        role: 'crow',
        announcement: '乌鸦请睁眼',
        closeEyesAnnouncement: '乌鸦请闭眼',
        actionPrompt: '请选择今晚要诅咒的玩家',
        actionType: 'single'
      });
    }
    
    // 禁言长老
    if (hasRole('muter')) {
      phases.push({
        id: 'muter',
        name: '禁言长老',
        role: 'muter',
        announcement: '禁言长老请睁眼',
        closeEyesAnnouncement: '禁言长老请闭眼',
        actionPrompt: '请选择今晚要禁言的玩家',
        actionType: 'single'
      });
    }
    
    // 猎魔人（第二晚开始）
    if (hasRole('demonhunter') && round >= 2) {
      phases.push({
        id: 'demonhunter',
        name: '猎魔人',
        role: 'demonhunter',
        announcement: '猎魔人请睁眼',
        closeEyesAnnouncement: '猎魔人请闭眼',
        actionPrompt: '请选择今晚要狩猎的目标',
        actionType: 'single'
      });
    }
    
    // 守墓人（第二晚开始）
    if (hasRole('gravedigger') && round >= 2) {
      phases.push({
        id: 'gravedigger',
        name: '守墓人',
        role: 'gravedigger',
        announcement: '守墓人请睁眼',
        closeEyesAnnouncement: '守墓人请闭眼',
        actionPrompt: '昨晚被放逐的玩家阵营是...',
        actionType: 'none'
      });
    }
    
    return phases;
  }, [currentRound, hasRole]);
  
  const syncGameState = useCallback(async (
    state: AutoJudgePhaseState,
    detailPhase?: string,
    actions?: NightAction[],
    options?: { round?: number; waitingForAction?: boolean }
  ) => {
    try {
      if (!hostToken) {
        return;
      }

      const round = options?.round ?? currentRound;
      const phaseBucket: RoomStatus | 'night' | 'day' | 'ended' =
        state === 'day' ? 'day' : state === 'ended' ? 'ended' : 'night';
      const nextActions = actions ?? nightActions;

      await updateRoom(roomId, hostToken, {
        enable_auto_judge: true,
        game_state: {
          state,
          detailPhase: detailPhase ?? null,
          round,
          waitingForAction: options?.waitingForAction ?? false,
          updatedAt: new Date().toISOString(),
        },
        current_phase: phaseBucket,
        current_round: round,
        night_actions: nextActions,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Sync game state failed:', e);
    }
  }, [currentRound, hostToken, nightActions, roomId]);
  
  // 开始夜晚
  const startNight = async (round: number = currentRound) => {
    unlock();
    setCurrentRound(round);
    setGameState('night');
    setCurrentPhase('start');
    setNightActions([]);
    setSelectedPlayer('');
    setSelectedPlayer2('');
    setWaitingForAction(false);
    setShowMyAction(false);
    setActionResult('');
    
    await syncGameState('night', 'start', [], { round, waitingForAction: false });
    
    if (voiceEnabled) {
      setIsSpeaking(true);
      speak(`天黑了，请所有人闭眼。第${round}夜开始。`, () => {
        setIsSpeaking(false);
        setTimeout(() => runNightPhases(round), 800);
      });
    } else {
      setTimeout(() => runNightPhases(round), 500);
    }
  };
  
  // 执行夜晚流程
  const runNightPhases = async (round: number = currentRound) => {
    const phases = getNightPhases(round);
    
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setCurrentPhase(phase.id);
      setSelectedPlayer('');
      setSelectedPlayer2('');
      setWaitingForAction(true);
      setShowMyAction(false);
      setActionResult('');
      
      await syncGameState('night', phase.id, undefined, { round, waitingForAction: true });
      
      // 播报睁眼
      if (voiceEnabled) {
        setIsSpeaking(true);
        await new Promise<void>((resolve) => {
          speak(`${phase.announcement}，${phase.actionPrompt}`, () => {
            setIsSpeaking(false);
            resolve();
          });
        });
      }
      
      // 检查当前玩家是否是该角色
      const isMyTurn = currentPlayerRole === phase.role;
      if (isMyTurn) {
        setShowMyAction(true);
        // 震动提示
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
      
      // 等待操作完成
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!waitingForActionRef.current) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 200);
        
        // 超时处理（30秒）
        setTimeout(() => {
          clearInterval(checkInterval);
          setWaitingForAction(false);
          setShowMyAction(false);
          resolve();
        }, 30000);
      });
      
      // 播报闭眼
      if (voiceEnabled && i < phases.length - 1) {
        setIsSpeaking(true);
        await new Promise<void>((resolve) => {
          speak(phase.closeEyesAnnouncement, () => {
            setIsSpeaking(false);
            resolve();
          });
        });
        await new Promise(r => setTimeout(r, 800));
      }
    }
    
    // 天亮
    endNight();
  };
  
  // 提交操作
  const submitAction = async () => {
    const phase = getNightPhases(currentRound).find(p => p.id === currentPhase);
    if (!phase) return;
    
    const action: NightAction = {
      phaseId: phase.id,
      playerId: currentPlayerId,
      targetId: selectedPlayer,
      secondTargetId: phase.actionType === 'double' ? selectedSecondPlayer : undefined,
      action: witchSaveUsed ? 'save' : witchPoisonUsed ? 'poison' : undefined
    };
    
    const newActions = [
      ...nightActions.filter((item) => !(item.phaseId === action.phaseId && item.playerId === action.playerId)),
      action
    ];
    setNightActions(newActions);
    setWaitingForAction(false);
    setShowMyAction(false);
    
    await syncGameState('night', currentPhase, newActions, { round: currentRound, waitingForAction: false });
    
    // 显示操作结果
    if (phase.actionType === 'single' && selectedPlayer) {
      const target = players.find(p => p.id === selectedPlayer);
      if (target) {
        if (phase.role === 'seer' || phase.role === 'pure' || phase.role === 'gargoyle' || phase.role === 'wolfwitch') {
          // 查验结果
          const targetRole = target.role || 'villager';
          const isWolf = ROLES[targetRole]?.team === 'evil';
          setActionResult(`${target.name} 是 ${isWolf ? '狼人' : '好人'}`);
        } else {
          setActionResult(`已选择: ${target.name}`);
        }
      }
    }
  };
  
  // 跳过操作
  const skipAction = async () => {
    setWaitingForAction(false);
    setShowMyAction(false);
    await syncGameState('night', currentPhase, nightActions, { round: currentRound, waitingForAction: false });
  };
  
  // 结束夜晚
  const endNight = async () => {
    setGameState('day');
    const nextDayPhase = enableSheriff && currentRound === 1 ? 'sheriff_campaign' : 'day_start';
    setCurrentPhase(nextDayPhase);
    setShowDeathInfo(false);
    
    // 计算死亡信息
    const deaths: DeathInfo[] = [];
    
    // 检查狼人击杀
    const werewolfAction = nightActions.find(a => a.phaseId === 'werewolf');
    if (werewolfAction?.targetId) {
      const target = players.find(p => p.id === werewolfAction.targetId);
      if (target) {
        const guardAction = nightActions.find(a => a.phaseId === 'guard');
        const isGuarded = guardAction?.targetId === werewolfAction.targetId;
        const witchSave = nightActions.find(a => a.action === 'save');
        
        if (!isGuarded && !witchSave) {
          deaths.push({
            playerId: target.id,
            playerName: target.name,
            role: target.role || 'villager',
            reason: '被狼人击杀'
          });
        }
      }
    }
    
    // 检查女巫毒药
    const witchPoison = nightActions.find(a => a.action === 'poison');
    if (witchPoison?.targetId) {
      const target = players.find(p => p.id === witchPoison.targetId);
      if (target && !deaths.find(d => d.playerId === target.id)) {
        deaths.push({
          playerId: target.id,
          playerName: target.name,
          role: target.role || 'villager',
          reason: '被女巫毒杀'
        });
      }
    }
    
    setDeathInfo(deaths);
    await syncGameState('day', nextDayPhase, nightActions, { round: currentRound, waitingForAction: false });
    
    // 播报天亮
    if (voiceEnabled) {
      setIsSpeaking(true);
      const deathText = enableSheriff && currentRound === 1
        ? '天亮了，请先进行警长竞选。竞选结束后再公布昨夜情况。'
        : deaths.length > 0
          ? `天亮了，昨晚死亡的是${deaths.map(d => d.playerName).join('、')}`
          : '天亮了，昨晚是平安夜';
      speak(deathText, () => {
        setIsSpeaking(false);
      });
    }
  };
  
  const testVoicePlayback = () => {
    unlock();
    if (!voiceEnabled) {
      setVoiceEnabled(true);
    }
    setIsSpeaking(true);
    speak('电子法官语音已解锁，现在可以开始主持流程。', () => {
      setIsSpeaking(false);
    });
  };

  useEffect(() => {
    const synced = normalizeSyncedState(syncedState);
    if (!isHost || !hostToken || !autoJudgeEnabled || synced?.state) {
      return;
    }

    const initialState: AutoJudgePhaseState = roomStatus === 'playing' ? 'dealing' : 'waiting';
    void syncGameState(initialState, initialState, normalizeNightActions(syncedActions), {
      round: syncedRound || 1,
      waitingForAction: false,
    });
  }, [autoJudgeEnabled, hostToken, isHost, roomStatus, syncGameState, syncedActions, syncedRound, syncedState]);

  const currentNightPhases = getNightPhases(currentRound);
  const currentPhaseInfo = currentNightPhases.find(p => p.id === currentPhase);
  const isMyTurn = currentPlayerRole === currentPhaseInfo?.role;
  const hasSubmittedCurrentPhase = !!currentPlayerId && !!currentPhase && nightActions.some(
    (action) => action.phaseId === currentPhase && action.playerId === currentPlayerId
  );
  const shouldShowPlayerAction = !!currentPhaseInfo && isMyTurn && !hasSubmittedCurrentPhase && (!isHost || showMyAction);
  const canSubmitAction = !!currentPhaseInfo && (
    currentPhaseInfo.actionType === 'none'
      || currentPhaseInfo.actionType === 'witch'
      || !!selectedPlayer
  ) && (
    currentPhaseInfo?.actionType !== 'double' || (!!selectedPlayer && !!selectedSecondPlayer)
  );

  const renderActionControls = () => {
    if (!currentPhaseInfo) {
      return null;
    }

    return (
      <>
        {currentPhaseInfo.actionType === 'witch' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span>使用解药</span>
              </div>
              <button
                onClick={() => setWitchSaveUsed(!witchSaveUsed)}
                className={`px-3 py-1 rounded text-sm ${
                  witchSaveUsed ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                }`}
              >
                {witchSaveUsed ? '已使用' : '使用'}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-purple-400" />
                <span>使用毒药</span>
              </div>
              <button
                onClick={() => setWitchPoisonUsed(!witchPoisonUsed)}
                className={`px-3 py-1 rounded text-sm ${
                  witchPoisonUsed ? 'bg-purple-600 text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                }`}
              >
                {witchPoisonUsed ? '已使用' : '使用'}
              </button>
            </div>
            {witchPoisonUsed && (
              <div className="mt-3">
                <p className="text-sm text-slate-400 mb-2">选择毒杀目标:</p>
                <div className="grid grid-cols-3 gap-2">
                  {alivePlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player.id)}
                      className={`p-2 rounded text-sm transition-colors ${
                        selectedPlayer === player.id ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhaseInfo.actionType === 'single' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {alivePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`p-3 rounded text-sm transition-colors ${
                    selectedPlayer === player.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentPhaseInfo.actionType === 'double' && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-2">选择第一名玩家:</p>
              <div className="grid grid-cols-3 gap-2">
                {alivePlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    className={`p-2 rounded text-sm transition-colors ${
                      selectedPlayer === player.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedPlayer && (
              <div>
                <p className="text-sm text-slate-400 mb-2">选择第二名玩家:</p>
                <div className="grid grid-cols-3 gap-2">
                  {alivePlayers.filter(p => p.id !== selectedPlayer).map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer2(player.id)}
                      className={`p-2 rounded text-sm transition-colors ${
                        selectedSecondPlayer === player.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };
  
  // 渲染等待界面（房主）
  if (gameState === 'waiting' && isHost) {
    return (
      <div className="min-h-dvh bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              电子法官
            </h1>
            <button onClick={onExit} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-2 text-purple-400">实验功能</h2>
            <p className="text-slate-300 text-sm mb-4">
              电子法官将自动播报夜晚流程，对应角色的玩家会在自己手机上收到操作提示。
            </p>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• 自动语音播报角色睁眼/闭眼</li>
              <li>• 玩家在自己手机上操作</li>
              <li>• 自动计算死亡结果</li>
              <li>• 出局信息仅房主可见</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-slate-300">语音播报</span>
                <p className="text-slate-500 text-xs mt-1">
                  {isReady ? '浏览器语音能力已就绪，建议先点一次测试播报。' : '正在等待浏览器加载语音能力...'}
                </p>
              </div>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={testVoicePlayback}
                className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
              >
                解锁并测试语音
              </button>
              <button
                onClick={unlock}
                className="py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
              >
                仅解锁音频
              </button>
            </div>
          </div>
          
          <button
            onClick={async () => {
              setGameState('dealing');
              await syncGameState('dealing', 'dealing', nightActions, {
                round: currentRound,
                waitingForAction: false,
              });
            }}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            进入发牌确认
          </button>
        </div>
      </div>
    );
  }
  
  // 渲染发牌界面（房主）
  if (gameState === 'dealing' && isHost) {
    return (
      <div className="min-h-dvh bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              发牌阶段
            </h1>
            <button onClick={() => setGameState('waiting')} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-400">请确认所有玩家已收到角色</h2>
            <p className="text-slate-300 text-sm mb-4">
              请确保每位玩家都已在手机上查看了自己的角色牌。
            </p>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-sm text-slate-400">玩家人数: <span className="text-white font-bold">{alivePlayers.length}</span> 人</p>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              玩家列表
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alivePlayers.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">#{idx + 1}</span>
                    <span className="text-white">{player.name}</span>
                    {player.role && (
                      <span className="text-xs text-slate-500">({ROLES[player.role]?.name})</span>
                    )}
                  </div>
                  <span className="text-xs text-green-400">已准备</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={startNight}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
          >
            <Mic className="w-6 h-6" />
            开始电子法官
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'dealing' && !isHost) {
    return (
      <div className="min-h-dvh bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">请确认身份</h2>
          <p className="text-slate-400">法官正在确认所有玩家都已查看角色牌</p>
        </div>
      </div>
    );
  }
  
  // 渲染夜晚界面 - 房主视角
  if (gameState === 'night' && isHost) {
    const phases = currentNightPhases;
    const phaseIndex = phases.findIndex(p => p.id === currentPhase);
    
    return (
      <div className="min-h-dvh bg-slate-950 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-bold">第{currentRound}夜</span>
            </div>
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg ${voiceEnabled ? 'text-green-400' : 'text-slate-500'}`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
          
          {/* 语音播报中 */}
          {isSpeaking && (
            <div className="bg-indigo-500/20 border border-indigo-500/50 rounded-xl p-6 mb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <p className="text-indigo-300 text-lg">正在播报...</p>
              {currentPhaseInfo && (
                <p className="text-white text-xl font-bold mt-2">{currentPhaseInfo.announcement}</p>
              )}
            </div>
          )}
          
          {/* 当前环节 */}
          {!isSpeaking && currentPhaseInfo && (
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <p className="text-indigo-400 text-sm mb-1">当前环节</p>
              <h2 className="text-2xl font-bold mb-2">{currentPhaseInfo.name}</h2>
              <p className="text-slate-400">{currentPhaseInfo.actionPrompt}</p>
              <div className="mt-3 flex items-center gap-2 text-yellow-400">
                <Bell className="w-4 h-4" />
                <span className="text-sm">已通知对应玩家</span>
              </div>
            </div>
          )}

          {!isSpeaking && shouldShowPlayerAction && currentPhaseInfo && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-emerald-300 mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-sm">你当前也需要执行这个角色操作</span>
              </div>
              <h3 className="text-lg font-bold mb-3">{currentPhaseInfo.actionPrompt}</h3>
              {renderActionControls()}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={submitAction}
                  disabled={!canSubmitAction}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold"
                >
                  提交我的操作
                </button>
                <button
                  onClick={skipAction}
                  className="py-3 px-5 bg-slate-700 hover:bg-slate-600 rounded-xl"
                >
                  跳过
                </button>
              </div>
            </div>
          )}
          
          {/* 环节进度 */}
          <div className="space-y-1 max-h-48 overflow-y-auto bg-slate-800/50 rounded-xl p-3">
            {phases.map((phase, idx) => (
              <div 
                key={phase.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  phase.id === currentPhase 
                    ? 'bg-indigo-500/20 border border-indigo-500/50' 
                    : phaseIndex > idx
                      ? 'bg-slate-700/50 opacity-60'
                      : 'bg-slate-800/30 opacity-40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  phase.id === currentPhase 
                    ? 'bg-indigo-500 text-white' 
                    : phaseIndex > idx
                      ? 'bg-green-500/50 text-green-400'
                      : 'bg-slate-700 text-slate-500'
                }`}>
                  {phaseIndex > idx ? '✓' : idx + 1}
                </div>
                <span className={`text-sm ${phase.id === currentPhase ? 'text-white' : 'text-slate-400'}`}>
                  {phase.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* 跳过到白天 */}
          <button
            onClick={endNight}
            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            跳过到白天
          </button>
        </div>
      </div>
    );
  }
  
  // 渲染夜晚界面 - 玩家操作视角
  if (gameState === 'night' && !isHost && shouldShowPlayerAction && currentPhaseInfo) {
    return (
      <div className="min-h-dvh bg-slate-950 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-bold">第{currentRound}夜</span>
            </div>
          </div>
          
          {/* 操作提示 */}
          <div className="bg-indigo-500/20 border border-indigo-500/50 rounded-xl p-6 mb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-indigo-300 text-center">{currentPhaseInfo.announcement}</p>
            <h2 className="text-2xl font-bold text-center mt-2">{currentPhaseInfo.actionPrompt}</h2>
          </div>
          
          {/* 操作结果 */}
          {actionResult && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-4">
              <p className="text-green-400 text-center font-bold">{actionResult}</p>
            </div>
          )}
          
          {renderActionControls()}
          
          {/* 操作按钮 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={submitAction}
              disabled={!canSubmitAction}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold"
            >
              确认操作
            </button>
            <button
              onClick={skipAction}
              className="py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl"
            >
              跳过
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // 渲染夜晚界面 - 普通玩家等待视角
  if (gameState === 'night' && !isHost && !shouldShowPlayerAction) {
    return (
      <div className="min-h-dvh bg-slate-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Moon className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">第{currentRound}夜</h2>
          <p className="text-slate-400">天黑了，请闭眼...</p>
          {currentPhaseInfo && (
            <p className="text-indigo-400 mt-4">{currentPhaseInfo.name}正在行动中</p>
          )}
        </div>
      </div>
    );
  }
  
  // 渲染白天界面（房主）
  if (gameState === 'day' && isHost) {
    const isSheriffCampaign = currentPhase === 'sheriff_campaign';

    return (
      <div className="min-h-dvh bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-yellow-400" />
              <span className="text-lg font-bold">第{currentRound}天</span>
            </div>
          </div>
          
          {isSheriffCampaign && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                警长竞选
              </h2>
              <p className="text-slate-300 text-sm leading-6 mb-4">
                按你的桌游流程，第一天白天先进行警长竞选。竞选和警徽处理结束后，再公布昨夜情况；如有人死亡，再进入遗言环节。
              </p>
              <button
                onClick={async () => {
                  setCurrentPhase('day_start');
                  await syncGameState('day', 'day_start', nightActions, {
                    round: currentRound,
                    waitingForAction: false,
                  });
                  if (voiceEnabled) {
                    const deathText = deathInfo.length > 0
                      ? `警长竞选结束。昨晚死亡的是${deathInfo.map(d => d.playerName).join('、')}`
                      : '警长竞选结束，昨晚是平安夜';
                    speak(deathText);
                  }
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 rounded-xl font-medium"
              >
                警长竞选结束，公布昨夜情况
              </button>
            </div>
          )}

          {/* 昨夜信息 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              昨夜信息
              {!showDeathInfo && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-auto">
                  {isSheriffCampaign ? '竞选后公布' : '待查看'}
                </span>
              )}
            </h2>
            
            {isSheriffCampaign ? (
              <div className="rounded-xl bg-slate-700/50 p-4 text-sm text-slate-400">
                当前处于警长竞选阶段，结束后再公布昨夜死亡与遗言信息。
              </div>
            ) : showDeathInfo ? (
              <div>
                {deathInfo.length > 0 ? (
                  <div className="space-y-2">
                    {deathInfo.map((death, idx) => (
                      <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Skull className="w-5 h-5 text-red-400" />
                          <span className="font-bold">{death.playerName}</span>
                          <span className="text-slate-400 text-sm">({ROLES[death.role]?.name})</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{death.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-green-400">
                    <p className="text-lg">✨ 平安夜</p>
                    <p className="text-sm text-slate-400">昨晚没有人死亡</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowDeathInfo(true)}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                点击查看昨夜信息
              </button>
            )}
          </div>
          
          {/* 夜晚操作记录 */}
          {nightActions.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                夜晚操作记录
              </h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {nightActions.map((action, idx) => {
                  const phase = getNightPhases().find(p => p.id === action.phaseId);
                  const target = players.find(p => p.id === action.targetId);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-slate-700/50 rounded">
                      <span className="text-indigo-400">{phase?.name}</span>
                      {target && <span className="text-slate-300">→ {target.name}</span>}
                      {action.action && <span className="text-yellow-400">({action.action === 'save' ? '解药' : '毒药'})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const nextRound = currentRound + 1;
                setCurrentRound(nextRound);
                setWitchSaveUsed(false);
                setWitchPoisonUsed(false);
                startNight(nextRound);
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-2"
            >
              <Moon className="w-5 h-5" />
              进入黑夜
            </button>
            <button
              onClick={() => setGameState('waiting')}
              className="py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // 渲染白天界面（普通玩家）
  if (gameState === 'day' && !isHost) {
    const isSheriffCampaign = currentPhase === 'sheriff_campaign';
    return (
      <div className="min-h-dvh bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Sun className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">第{currentRound}天</h2>
          <p className="text-slate-400">天亮了</p>
          <p className="text-green-400 mt-4">
            {isSheriffCampaign ? '请先等待警长竞选结束' : '请等待法官宣布昨夜信息'}
          </p>
        </div>
      </div>
    );
  }
  
  // 非房主等待界面
  if (!isHost && gameState === 'waiting') {
    return (
      <div className="min-h-dvh bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">等待法官开始</h2>
          <p className="text-slate-400">请等待法官开始电子法官模式</p>
        </div>
      </div>
    );
  }
  
  return null;
}
