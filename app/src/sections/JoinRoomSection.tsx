import { useState } from 'react';
import { ArrowLeft, Loader2, User, Hash } from 'lucide-react';

interface JoinRoomSectionProps {
  onBack: () => void;
  onJoin: (playerName: string, roomId: string) => void;
  loading?: boolean;
  error?: string;
}

export function JoinRoomSection({ onBack, onJoin, loading = false, error = '' }: JoinRoomSectionProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (!playerName.trim() || roomId.length !== 6) return;
    onJoin(playerName.trim(), roomId.trim());
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800">
        <button 
          onClick={onBack} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">加入房间</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* 提示 */}
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-slate-300">输入法官提供的房间号</p>
          <p className="text-slate-500 text-sm mt-1">提示：房间号由法官创建房间后提供</p>
        </div>

        {/* 你的名字 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            你的名字
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="如：位置1+大飞"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-slate-500 text-xs">建议格式：位置+姓名，方便按座次游戏</p>
        </div>

        {/* 房间号 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Hash className="w-4 h-4" />
            房间号（6位数字）
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="请输入6位房间号"
            maxLength={6}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* 加入按钮 */}
        <button
          onClick={handleJoin}
          disabled={!playerName.trim() || roomId.length !== 6 || loading}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              加入中...
            </>
          ) : (
            '加入房间'
          )}
        </button>
      </div>
    </div>
  );
}
