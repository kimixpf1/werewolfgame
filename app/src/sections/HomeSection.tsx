import { Users, Plus, LogIn, History, BookOpen, HelpCircle, MessageSquareText, Shield } from 'lucide-react';

interface HomeSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onViewHistory: () => void;
  onViewRoles: () => void;
  onViewGuide: () => void;
  onOpenFeedback: () => void;
  onOpenAdmin: () => void;
}

export function HomeSection({
  onCreateRoom,
  onJoinRoom,
  onViewHistory,
  onViewRoles,
  onViewGuide,
  onOpenFeedback,
  onOpenAdmin,
}: HomeSectionProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 头部 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">狼人杀发牌员</h1>
          </div>
          <p className="text-slate-400 text-lg">线下狼人杀辅助工具</p>
        </div>

        {/* 功能按钮 */}
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={onCreateRoom}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 text-lg font-medium"
          >
            <Plus className="w-6 h-6" />
            创建房间
          </button>

          <button
            onClick={onJoinRoom}
            className="w-full h-16 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 text-lg font-medium"
          >
            <LogIn className="w-6 h-6" />
            加入房间
          </button>

          <button
            onClick={onViewHistory}
            className="w-full h-14 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <History className="w-5 h-5" />
            历史记录
          </button>
        </div>

        {/* 底部信息入口 */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={onViewRoles}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all text-sm"
          >
            <BookOpen className="w-4 h-4" />
            角色介绍
          </button>
          <button
            onClick={onViewGuide}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            用法简介
          </button>
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all text-sm"
          >
            <MessageSquareText className="w-4 h-4" />
            建议信箱
          </button>
        </div>

        {/* 特性说明 */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-slate-500 text-sm">创建游戏房间</p>
          <p className="text-slate-600 text-xs">作为法官创建房间，其他玩家通过房间号加入</p>
        </div>
      </div>

      {/* 底部 */}
      <div className="p-4 text-center text-slate-600 text-sm space-y-2">
        <div>狼人杀发牌员 - 让线下狼人杀更便捷</div>
        <button
          onClick={onOpenAdmin}
          className="mx-auto flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          管理员后台
        </button>
      </div>
    </div>
  );
}
