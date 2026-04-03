import { useState, useEffect } from 'react';
import { HomeSection } from '@/sections/HomeSection';
import { CreateRoomSection } from '@/sections/CreateRoomSection';
import { JoinRoomSection } from '@/sections/JoinRoomSection';
import { RoomSection } from '@/sections/RoomSection';
import { HistorySection } from '@/sections/HistorySection';
import { RolesSection } from '@/sections/RolesSection';
import { GuideSection } from '@/sections/GuideSection';
import { 
  createRoom, 
  joinRoom,
  generateRoomId, 
  generatePlayerId, 
  markPlayerDisconnected,
  restorePlayerSession
} from '@/lib/supabase';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import type { Room, LocalPlayerInfo, RoleConfig, WinMode } from '@/types';

type View = 'home' | 'create' | 'join' | 'room' | 'history' | 'roles' | 'guide';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [localPlayer, setLocalPlayer] = useState<LocalPlayerInfo | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // 检查本地存储的登录状态
  useEffect(() => {
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
  }, []);

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
