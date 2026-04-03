import { Users, Plus, LogIn, History, BookOpen, HelpCircle, MessageSquareText, Shield, ScrollText, MoonStar, Sparkles, Radio } from 'lucide-react';
import werewolfAvatar from '../../public/avatars/werewolf.png';
import seerAvatar from '../../public/avatars/seer.png';
import witchAvatar from '../../public/avatars/witch.png';

interface HomeSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onViewHistory: () => void;
  onViewRoles: () => void;
  onViewGuide: () => void;
  onOpenFeedback: () => void;
  onOpenAdmin: () => void;
  onOpenLegal: () => void;
}

export function HomeSection({
  onCreateRoom,
  onJoinRoom,
  onViewHistory,
  onViewRoles,
  onViewGuide,
  onOpenFeedback,
  onOpenAdmin,
  onOpenLegal,
}: HomeSectionProps) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.2),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(244,63,94,0.14),_transparent_28%)] bg-slate-950 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute right-[-3rem] top-32 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute left-[-2rem] bottom-28 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col p-6 pb-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
              <MoonStar className="h-3.5 w-3.5" />
              暗夜主持模式
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
              <Radio className="h-3.5 w-3.5" />
              多设备同步
            </span>
          </div>

          <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-wide text-white">狼人杀发牌员</h1>
                    <p className="text-sm text-slate-400">线下狼人杀辅助工具</p>
                  </div>
                </div>
                <p className="max-w-xs text-sm leading-6 text-slate-300">
                  为面杀局提供发牌、同步、法官记录与电子主持支持，让整场夜晚流程更稳、更快、更像正式场。
                </p>
              </div>

              <div className="relative hidden shrink-0 sm:block">
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl" />
                <div className="relative grid grid-cols-2 gap-2">
                  <img src={werewolfAvatar} alt="狼人" className="h-14 w-14 rounded-2xl border border-red-500/20 bg-slate-950/60 object-cover" />
                  <img src={seerAvatar} alt="预言家" className="mt-6 h-14 w-14 rounded-2xl border border-indigo-500/20 bg-slate-950/60 object-cover" />
                  <img src={witchAvatar} alt="女巫" className="-mt-4 ml-4 h-14 w-14 rounded-2xl border border-fuchsia-500/20 bg-slate-950/60 object-cover" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-xs text-slate-500">玩法支持</div>
                <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  32 角色
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-xs text-slate-500">核心体验</div>
                <div className="mt-1 text-sm font-semibold text-white">发牌 + 法官</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-xs text-slate-500">适用场景</div>
                <div className="mt-1 text-sm font-semibold text-white">手机面杀局</div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={onCreateRoom}
              className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Plus className="w-6 h-6" />
              创建房间
            </button>

            <button
              onClick={onJoinRoom}
              className="w-full h-16 bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 text-lg font-medium"
            >
              <LogIn className="w-6 h-6" />
              加入房间
            </button>

            <button
              onClick={onViewHistory}
              className="w-full h-14 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 rounded-2xl border border-slate-800/80 transition-all flex items-center justify-center gap-3"
            >
              <History className="w-5 h-5" />
              历史记录
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={onViewRoles}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-all text-sm"
            >
              <BookOpen className="w-4 h-4" />
              角色介绍
            </button>
            <button
              onClick={onViewGuide}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-all text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              用法简介
            </button>
            <button
              onClick={onOpenFeedback}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-all text-sm"
            >
              <MessageSquareText className="w-4 h-4" />
              建议信箱
            </button>
            <button
              onClick={onOpenLegal}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-all text-sm"
            >
              <ScrollText className="w-4 h-4" />
              版权与免责
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 text-sm font-medium text-slate-200">产品建议</div>
            <p className="text-sm leading-6 text-slate-400">
              首页建议始终保持“创建 / 加入”双主按钮最大化，其余信息通过品牌卡、玩法标签和辅助入口承接，这样既显得更高级，也不会牺牲首次使用效率。
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-slate-900/80 bg-slate-950/90 px-4 py-4 text-center text-slate-600 text-sm backdrop-blur">
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span>狼人杀发牌员</span>
          <span>面杀辅助</span>
          <span>跨设备同步</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            管理员后台
          </button>
          <button
            onClick={onOpenLegal}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ScrollText className="w-3.5 h-3.5" />
            免责声明
          </button>
        </div>
      </div>
    </div>
  );
}
