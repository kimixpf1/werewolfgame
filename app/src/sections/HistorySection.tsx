import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, Trash2 } from 'lucide-react';
import { getRoleName, getRoleTeam, getGameRecords, clearGameRecords } from '@/lib/gameConfig';
import type { RoleType } from '@/types';

interface GameRecord {
  id: string;
  roomId: string;
  createdAt: string;
  playerCount: number;
  players: { name: string; role: RoleType }[];
  enableSheriff: boolean;
  winner?: 'good' | 'evil';
}

interface HistorySectionProps {
  onBack: () => void;
}

export function HistorySection({ onBack }: HistorySectionProps) {
  const [records, setRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    setRecords(getGameRecords());
  }, []);

  const handleClear = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearGameRecords();
      setRecords([]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 统计阵营人数
  const countTeams = (players: { name: string; role: RoleType }[]) => {
    let good = 0;
    let evil = 0;
    players.forEach(p => {
      const team = getRoleTeam(p.role);
      if (team === 'good') good++;
      if (team === 'evil') evil++;
    });
    return { good, evil };
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">历史记录</h1>
        </div>
        {records.length > 0 && (
          <button 
            onClick={handleClear}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4 pb-8">
        {records.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">暂无游戏记录</p>
            <p className="text-slate-600 text-sm mt-2">完成一局游戏后会自动保存</p>
          </div>
        ) : (
          <>
            <div className="text-center text-slate-500 text-sm">
              共 {records.length} 局游戏
            </div>
            {records.map((record) => {
              const teams = countTeams(record.players);
              return (
                <div key={record.id} className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {formatDate(record.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <Users className="w-4 h-4" />
                      {record.playerCount}人
                      {record.enableSheriff && ' · 警长'}
                    </div>
                  </div>
                  
                  {/* 阵营统计 */}
                  <div className="flex gap-4 mb-3 text-sm">
                    <span className="text-blue-400">好人: {teams.good}人</span>
                    <span className="text-red-400">狼人: {teams.evil}人</span>
                  </div>

                  {/* 玩家角色列表 */}
                  <div className="flex flex-wrap gap-2">
                    {record.players.map((player, idx) => {
                      const team = getRoleTeam(player.role);
                      const bgClass = team === 'good' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                                     team === 'evil' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                     'bg-gray-500/20 text-gray-400 border-gray-500/30';
                      return (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${bgClass}`}
                        >
                          {player.name}:{getRoleName(player.role)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
