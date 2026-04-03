import { useCallback, useEffect, useState } from 'react';
import { HomeSection } from '@/sections/HomeSection';
import { CreateRoomSection } from '@/sections/CreateRoomSection';
import { JoinRoomSection } from '@/sections/JoinRoomSection';
import { RoomSection } from '@/sections/RoomSection';
import { HistorySection } from '@/sections/HistorySection';
import { RolesSection } from '@/sections/RolesSection';
import { GuideSection } from '@/sections/GuideSection';
import { FeedbackSection } from '@/sections/FeedbackSection';
import { AdminLoginSection } from '@/sections/AdminLoginSection';
import { AdminDashboardSection } from '@/sections/AdminDashboardSection';
import { 
  getAdminDashboardSummary,
  getAdminProfile,
  getOrCreateDeviceId,
  createRoom, 
  joinRoom,
  generateRoomId, 
  generatePlayerId, 
  markPlayerDisconnected,
  restorePlayerSession,
  listFeedbackMessages,
  signInAdmin,
  signOutAdmin,
  submitFeedback,
  trackUsageEvent,
  updateFeedbackMessage,
} from '@/lib/supabase';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import type {
  AdminDashboardSummary,
  AdminProfile,
  FeedbackMessage,
  FeedbackStatus,
  LocalPlayerInfo,
  RoleConfig,
  Room,
  WinMode,
} from '@/types';

type View = 'home' | 'create' | 'join' | 'room' | 'history' | 'roles' | 'guide' | 'feedback' | 'admin';

function resolveInitialView(): View {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const hash = window.location.hash.replace(/^#/, '').replace(/^\//, '');
  if (hash === 'admin') return 'admin';
  if (hash === 'feedback') return 'feedback';
  return 'home';
}

function App() {
  const [currentView, setCurrentView] = useState<View>(() => resolveInitialView());
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [localPlayer, setLocalPlayer] = useState<LocalPlayerInfo | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminDashboardSummary | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackMessage[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackStatus | 'all'>('all');

  const loadAdminDashboard = useCallback(async (status: FeedbackStatus | 'all') => {
    setAdminLoading(true);
    const [{ data: summary, error: summaryError }, { data: feedbackData, error: feedbackError }] = await Promise.all([
      getAdminDashboardSummary(),
      listFeedbackMessages(status),
    ]);

    if (summaryError || feedbackError) {
      setAdminError(summaryError?.message || feedbackError?.message || '加载后台数据失败');
    } else {
      setAdminError('');
      setAdminSummary(summary);
      setFeedbackList(feedbackData || []);
    }

    setAdminLoading(false);
  }, []);

  // 检查本地存储的登录状态
  useEffect(() => {
    getOrCreateDeviceId();
    void trackUsageEvent({
      eventType: 'app_open',
      payload: { entry: resolveInitialView() },
    });

    const saved = localStorage.getItem('werewolf_player');
    if (saved) {
      try {
        const playerInfo: LocalPlayerInfo = JSON.parse(saved);
        restorePlayerSession(playerInfo).then(({ data }) => {
          if (data?.room) {
            setLocalPlayer(playerInfo);
            setCurrentRoom(data.room);
            setCurrentView('room');
          } else {
            localStorage.removeItem('werewolf_player');
          }
        });
      } catch (e) {
        console.error('Failed to parse saved player:', e);
        localStorage.removeItem('werewolf_player');
      }
    }

    getAdminProfile().then(({ data }) => {
      if (data) {
        setAdminProfile(data);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hash = currentView === 'admin'
      ? '#admin'
      : currentView === 'feedback'
        ? '#feedback'
        : '';

    const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'admin' && adminProfile) {
      void loadAdminDashboard(feedbackFilter);
    }
  }, [adminProfile, currentView, feedbackFilter, loadAdminDashboard]);

  // 创建房间
  const handleCreateRoom = async (
    hostName: string, 
    playerCount: number, 
    roles: RoleConfig[], 
    enableSheriff: boolean, 
    winMode: WinMode,
    enableAutoJudge: boolean
  ) => {
    try {
      console.log('Creating room with:', { hostName, playerCount, roles, enableSheriff, winMode, enableAutoJudge });
      const hostId = generatePlayerId();
      let roomId = '';
      let roomData: { room: Room; playerToken: string; hostToken: string } | null = null;
      let roomError: any = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        roomId = generateRoomId();
        console.log('Generated roomId:', roomId, 'hostId:', hostId, 'attempt:', attempt + 1);
        const result = await createRoom(
          roomId,
          hostId,
          hostName,
          playerCount,
          roles,
          enableSheriff,
          winMode,
          enableAutoJudge
        );

        roomData = result.data;
        roomError = result.error;

        if (roomData) {
          break;
        }

        if (roomError?.message !== '房间号已存在，请重试') {
          break;
        }
      }

      if (roomError || !roomData) {
        toast.error('创建房间失败：' + (roomError?.message || '未知错误'));
        console.error('Create room error:', roomError);
        return;
      }
      console.log('Room created:', roomData.room);

      const playerInfo: LocalPlayerInfo = {
        playerId: hostId,
        roomId,
        isHost: !enableAutoJudge,
        playerToken: roomData.playerToken,
        hostToken: roomData.hostToken,
        playerName: hostName.trim(),
      };
      localStorage.setItem('werewolf_player', JSON.stringify(playerInfo));

      setCurrentRoom(roomData.room);
      setLocalPlayer(playerInfo);
      setCurrentView('room');
      void trackUsageEvent({
        eventType: 'room_created',
        roomId,
        playerId: hostId,
        playerName: hostName.trim(),
        payload: {
          playerCount,
          enableSheriff,
          winMode,
          enableAutoJudge,
        },
      });
      toast.success(enableAutoJudge ? '电子法官房间创建成功！你将以普通玩家身份加入' : '房间创建成功！');
    } catch (error) {
      console.error('Create room error:', error);
      toast.error('创建房间失败，请重试');
    }
  };

  // 加入房间
  const handleJoinRoom = async (playerName: string, roomId: string) => {
    setJoinLoading(true);
    setJoinError('');

    try {
      const saved = localStorage.getItem('werewolf_player');
      let existingSession: LocalPlayerInfo | null = null;

      if (saved) {
        try {
          const parsed: LocalPlayerInfo = JSON.parse(saved);
          if (parsed.roomId === roomId) {
            existingSession = parsed;
          }
        } catch (error) {
          console.warn('Failed to parse local session:', error);
        }
      }

      const { data, error } = await joinRoom(roomId, playerName, existingSession);

      if (error || !data) {
        setJoinError(error?.message || '加入失败，请重试');
        setJoinLoading(false);
        return;
      }

      const playerInfo: LocalPlayerInfo = {
        playerId: data.player.id,
        roomId,
        isHost: false,
        playerToken: data.playerToken,
        playerName: data.player.name,
        hostToken: null,
      };
      localStorage.setItem('werewolf_player', JSON.stringify(playerInfo));

      setCurrentRoom(data.room);
      setLocalPlayer(playerInfo);
      setCurrentView('room');
      void trackUsageEvent({
        eventType: 'room_joined',
        roomId,
        playerId: data.player.id,
        playerName: data.player.name,
        payload: {
          reclaimed: data.reclaimed,
          restored: data.restored,
        },
      });

      if (data.restored) {
        toast.success('已恢复你原来的房间身份');
      } else if (data.reclaimed) {
        toast.success('已找回你原来的座位');
      } else {
        toast.success('成功加入房间！');
      }
    } catch (error) {
      console.error('Join room error:', error);
      setJoinError('网络错误，请重试');
    } finally {
      setJoinLoading(false);
    }
  };

  // 离开房间
  const handleLeaveRoom = async () => {
    if (localPlayer) {
      await markPlayerDisconnected(localPlayer);
    }
    setCurrentRoom(null);
    setLocalPlayer(null);
    localStorage.removeItem('werewolf_player');
    setCurrentView('home');
    toast.info('已离开房间');
  };

  const handleSubmitFeedback = async ({
    playerName,
    contact,
    content,
  }: {
    playerName: string;
    contact: string;
    content: string;
  }) => {
    setFeedbackLoading(true);
    const { error } = await submitFeedback({
      content,
      contact: contact || null,
      playerName: playerName || localPlayer?.playerName || null,
      roomId: currentRoom?.id || localPlayer?.roomId || null,
    });
    setFeedbackLoading(false);

    if (error) {
      toast.error(error.message || '提交建议失败');
      return;
    }

    toast.success('建议已提交，感谢反馈');
    setCurrentView('home');
  };

  const handleAdminLogin = async (email: string, password: string) => {
    setAdminLoading(true);
    setAdminError('');
    const { data, error } = await signInAdmin(email, password);
    if (error || !data) {
      setAdminLoading(false);
      setAdminError(error?.message || '登录失败');
      return;
    }

    setAdminProfile(data);
    setAdminError('');
    setCurrentView('admin');
    setAdminLoading(false);
  };

  const handleAdminSignOut = async () => {
    await signOutAdmin();
    setAdminProfile(null);
    setAdminSummary(null);
    setFeedbackList([]);
    setAdminError('');
    setCurrentView('home');
    toast.success('已退出管理员后台');
  };

  const handleAdminFeedbackUpdate = async (feedbackId: number, status: FeedbackStatus, adminNote: string) => {
    const { error } = await updateFeedbackMessage(feedbackId, status, adminNote);
    if (error) {
      toast.error(error.message || '更新建议失败');
      return;
    }

    toast.success('建议状态已更新');
    await loadAdminDashboard(feedbackFilter);
  };

  // 渲染当前视图
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeSection
            onCreateRoom={() => setCurrentView('create')}
            onJoinRoom={() => setCurrentView('join')}
            onViewHistory={() => setCurrentView('history')}
            onViewRoles={() => setCurrentView('roles')}
            onViewGuide={() => setCurrentView('guide')}
            onOpenFeedback={() => setCurrentView('feedback')}
            onOpenAdmin={() => setCurrentView('admin')}
          />
        );
      case 'create':
        return (
          <CreateRoomSection
            onBack={() => setCurrentView('home')}
            onCreate={handleCreateRoom}
          />
        );
      case 'join':
        return (
          <JoinRoomSection
            onBack={() => setCurrentView('home')}
            onJoin={handleJoinRoom}
            loading={joinLoading}
            error={joinError}
          />
        );
      case 'room':
        if (currentRoom && localPlayer) {
          return (
            <RoomSection
              room={currentRoom}
              localPlayer={localPlayer}
              onLeave={handleLeaveRoom}
            />
          );
        }
        return null;
      case 'history':
        return <HistorySection onBack={() => setCurrentView('home')} />;
      case 'roles':
        return <RolesSection onBack={() => setCurrentView('home')} />;
      case 'guide':
        return <GuideSection onBack={() => setCurrentView('home')} />;
      case 'feedback':
        return (
          <FeedbackSection
            onBack={() => setCurrentView('home')}
            onSubmit={handleSubmitFeedback}
            loading={feedbackLoading}
            initialPlayerName={localPlayer?.playerName}
            initialRoomId={currentRoom?.id || localPlayer?.roomId}
          />
        );
      case 'admin':
        if (!adminProfile) {
          return (
            <AdminLoginSection
              onBack={() => setCurrentView('home')}
              onLogin={handleAdminLogin}
              loading={adminLoading}
              error={adminError}
            />
          );
        }

        return (
          <AdminDashboardSection
            profile={adminProfile}
            summary={adminSummary}
            feedbackList={feedbackList}
            loading={adminLoading}
            feedbackFilter={feedbackFilter}
            onBack={() => setCurrentView('home')}
            onSignOut={handleAdminSignOut}
            onRefresh={() => loadAdminDashboard(feedbackFilter)}
            onChangeFilter={setFeedbackFilter}
            onUpdateFeedback={handleAdminFeedbackUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderView()}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
        }}
      />
    </>
  );
}

export default App;
