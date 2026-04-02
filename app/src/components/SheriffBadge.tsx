import { useState } from 'react';
import { Crown, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import type { Player } from '@/types';

interface SheriffBadgeProps {
  sheriffId: string | null | undefined;
  isTorn: boolean;
  players: Player[];
  isHost: boolean;
  onTransfer: (newSheriffId: string | null) => void;
  onTear: () => void;
}

export function SheriffBadge({ 
  sheriffId, 
  isTorn, 
  players, 
  isHost, 
  onTransfer, 
  onTear 
}: SheriffBadgeProps) {
  const [showTransfer, setShowTransfer] = useState(false);
  
  const sheriff = players.find(p => p.id === sheriffId);
  const alivePlayers = players.filter(p => p.is_alive);

  if (isTorn) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <AlertTriangle className="w-5 h-5" />
          <span>警徽已撕毁</span>
        </div>
      </div>
    );
  }

  if (!sheriff) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">暂无警长</p>
          {isHost && alivePlayers.length > 0 && (
            <button
              onClick={() => setShowTransfer(true)}
              className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm flex items-center gap-2 mx-auto transition-colors"
            >
              <Crown className="w-4 h-4" />
              颁发警徽
            </button>
          )}
        </div>

        {/* 颁发警徽弹窗 */}
        {showTransfer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl p-4 max-w-xs w-full">
              <h3 className="text-white font-medium mb-3">选择警长</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alivePlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => { onTransfer(player.id); setShowTransfer(false); }}
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left transition-colors"
                  >
                    {player.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTransfer(false)}
                className="w-full mt-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-yellow-400 text-sm font-medium">现任警长</p>
            <p className="text-white text-lg font-bold">{sheriff.name}</p>
            {sheriff.is_alive ? (
              <p className="text-green-400 text-xs">存活中</p>
            ) : (
              <p className="text-red-400 text-xs">已出局</p>
            )}
          </div>
        </div>

        {isHost && (
          <div className="flex gap-2">
            {!sheriff.is_alive && alivePlayers.length > 0 && (
              <button
                onClick={() => setShowTransfer(true)}
                className="p-2 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 rounded-lg transition-colors"
                title="传递警徽"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onTear}
              className="p-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg transition-colors"
              title="撕毁警徽"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 警长权限说明 */}
      <div className="mt-3 pt-3 border-t border-yellow-500/20">
        <p className="text-yellow-400/70 text-xs">警长权限:</p>
        <ul className="text-slate-400 text-xs mt-1 space-y-0.5">
          <li>• 投票时拥有 1.5 票</li>
          <li>• 最后发言并归票</li>
          <li>• 决定发言顺序</li>
        </ul>
      </div>

      {/* 传递警徽弹窗 */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-4 max-w-xs w-full">
            <h3 className="text-white font-medium mb-2">警长已出局</h3>
            <p className="text-slate-400 text-sm mb-3">选择一名玩家继承警徽，或撕毁警徽</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alivePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => { onTransfer(player.id); setShowTransfer(false); }}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left transition-colors"
                >
                  <Crown className="w-4 h-4 inline mr-2 text-yellow-400" />
                  {player.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { onTear(); setShowTransfer(false); }}
                className="flex-1 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg transition-colors"
              >
                撕毁警徽
              </button>
              <button
                onClick={() => setShowTransfer(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
