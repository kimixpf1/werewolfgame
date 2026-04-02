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
  addPlayer, 
  generateRoomId, 
  generatePlayerId, 
  getRoom
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
        // 验证房间是否仍然存在
        getRoom(playerInfo.roomId).then(({ data }) => {
          if (data) {
            setLocalPlayer(playerInfo);
            setCurrentRoom(data);
            setCurrentView('room');
          } else {
            // 房间不存在，清除本地存储
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
      let room: Room | null = null;
      let roomError: any = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        roomId = generateRoomId();
        console.log('Generated roomId:', roomId, 'hostId:', hostId, 'attempt:', attempt + 1);
        const result = await createRoom(
          roomId,
          hostId,
          playerCount,
          roles,
          enableSheriff,
          winMode,
          enableAutoJudge
        );

        room = result.data;
        roomError = result.error;

        if (room) {
          break;
        }

        if (roomError?.message !== '房间号已存在，请重试') {
          break;
        }
      }

      if (roomError || !room) {
        toast.error('创建房间失败：' + (roomError?.message || '未知错误'));
        console.error('Create room error:', roomError);
        return;
      }
      console.log('Room created:', room);

      // 添加法官玩家（如果是电子法官模式，法官作为普通玩家加入）
      const { data: playerData, error: playerError } = await addPlayer(
        hostId, 
        roomId, 
        hostName, 
        !enableAutoJudge // 电子法官模式下，法官不作为host
      );

      if (playerError) {
        toast.error('创建玩家失败：' + (playerError?.message || '未知错误'));
        console.error('Add player error:', playerError);
        return;
      }
      console.log('Player added:', playerData);

      // 保存本地玩家信息
      const playerInfo: LocalPlayerInfo = {
        playerId: hostId,
        roomId,
        isHost: !enableAutoJudge, // 电子法官模式下，法官不是host
      };
      localStorage.setItem('werewolf_player', JSON.stringify(playerInfo));

      setCurrentRoom(room);
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
      // 检查房间是否存在
      const { data: room, error: roomError } = await getRoom(roomId);
      
      if (roomError || !room) {
        setJoinError(roomError?.message?.includes('联机服务不可用') ? roomError.message : '房间不存在，请检查房间号');
        setJoinLoading(false);
        return;
      }

      if (room.status !== 'waiting') {
        setJoinError('游戏已经开始，无法加入');
        setJoinLoading(false);
        return;
      }

      // 创建玩家
      const playerId = generatePlayerId();
      const { error: playerError } = await addPlayer(
        playerId,
        roomId,
        playerName,
        false
      );

      if (playerError) {
        setJoinError('加入失败，请重试');
        setJoinLoading(false);
        return;
      }

      // 保存本地玩家信息
      const playerInfo: LocalPlayerInfo = {
        playerId,
        roomId,
        isHost: false,
      };
      localStorage.setItem('werewolf_player', JSON.stringify(playerInfo));

      setCurrentRoom(room);
      setLocalPlayer(playerInfo);
      setCurrentView('room');
      toast.success('成功加入房间！');
    } catch (error) {
      console.error('Join room error:', error);
      setJoinError('网络错误，请重试');
    } finally {
      setJoinLoading(false);
    }
  };

  // 离开房间
  const handleLeaveRoom = () => {
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
