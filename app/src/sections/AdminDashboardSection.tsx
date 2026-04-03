import { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Loader2, LogOut, Mailbox, MessageSquareText, RefreshCw, Users } from 'lucide-react';
import type { AdminDashboardSummary, AdminProfile, FeedbackMessage, FeedbackStatus } from '@/types';

interface AdminDashboardSectionProps {
  profile: AdminProfile;
  summary: AdminDashboardSummary | null;
  feedbackList: FeedbackMessage[];
  loading?: boolean;
  feedbackFilter: FeedbackStatus | 'all';
  onBack: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
  onChangeFilter: (status: FeedbackStatus | 'all') => void;
  onUpdateFeedback: (feedbackId: number, status: FeedbackStatus, adminNote: string) => void;
}

const STATUS_OPTIONS: Array<{ value: FeedbackStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'new', label: '新建议' },
  { value: 'processing', label: '处理中' },
  { value: 'done', label: '已处理' },
  { value: 'ignored', label: '已忽略' },
];

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  processing: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  ignored: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
};

function FeedbackItem({
  item,
  onUpdate,
}: {
  item: FeedbackMessage;
  onUpdate: (feedbackId: number, status: FeedbackStatus, adminNote: string) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [note, setNote] = useState(item.admin_note ?? '');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full border text-xs ${STATUS_COLORS[item.status]}`}>
          {item.status}
        </span>
        <span className="text-slate-500 text-xs">ID #{item.id}</span>
        <span className="text-slate-500 text-xs">{new Date(item.created_at).toLocaleString()}</span>
      </div>

      <div className="space-y-2">
        <div className="text-white font-medium">{item.player_name || '匿名玩家'}</div>
        {item.room_id && <div className="text-slate-400 text-sm">房间号：{item.room_id}</div>}
        {item.contact && <div className="text-slate-400 text-sm">联系方式：{item.contact}</div>}
        <div className="whitespace-pre-wrap text-slate-200 leading-6">{item.content}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="new">new</option>
          <option value="processing">processing</option>
          <option value="done">done</option>
          <option value="ignored">ignored</option>
        </select>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="管理员备注"
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={() => onUpdate(item.id, status, note)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}

export function AdminDashboardSection({
  profile,
  summary,
  feedbackList,
  loading = false,
  feedbackFilter,
  onBack,
  onSignOut,
  onRefresh,
  onChangeFilter,
  onUpdateFeedback,
}: AdminDashboardSectionProps) {
  const trend = useMemo(() => summary?.trend ?? [], [summary]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">管理员后台</h1>
            <p className="text-slate-500 text-sm">{profile.email} · {profile.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onSignOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            正在加载后台数据...
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400 text-sm flex items-center gap-2"><Users className="w-4 h-4" />设备数</div>
            <div className="text-3xl font-bold text-white mt-2">{summary?.total_devices ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">近 7 天活跃 {summary?.active_devices_7d ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400 text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" />房间统计</div>
            <div className="text-3xl font-bold text-white mt-2">{summary?.total_rooms ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">开始 {summary?.games_started ?? 0} / 结束 {summary?.games_ended ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400 text-sm flex items-center gap-2"><MessageSquareText className="w-4 h-4" />建议总数</div>
            <div className="text-3xl font-bold text-white mt-2">{summary?.total_feedback ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">待处理 {summary?.pending_feedback ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400 text-sm flex items-center gap-2"><Mailbox className="w-4 h-4" />参与事件</div>
            <div className="text-3xl font-bold text-white mt-2">{summary?.total_join_events ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">累计加入房间事件</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-white text-lg font-semibold mb-4">近 14 天趋势</h2>
          <div className="grid gap-2">
            {trend.map((item) => (
              <div
                key={item.date}
                className="grid grid-cols-2 md:grid-cols-5 gap-3 rounded-xl bg-slate-800/60 px-4 py-3 text-sm"
              >
                <div className="text-slate-300">{item.date}</div>
                <div className="text-slate-400">设备 {item.active_devices}</div>
                <div className="text-slate-400">建房 {item.rooms_created}</div>
                <div className="text-slate-400">开局 {item.games_started}</div>
                <div className="text-slate-400">建议 {item.feedback_count}</div>
              </div>
            ))}
            {!trend.length && <div className="text-slate-500 text-sm">暂无趋势数据</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-white text-lg font-semibold">建议信箱</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onChangeFilter(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    feedbackFilter === option.value
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {feedbackList.map((item) => (
              <FeedbackItem key={item.id} item={item} onUpdate={onUpdateFeedback} />
            ))}
            {!feedbackList.length && (
              <div className="text-slate-500 text-sm">当前筛选条件下暂无建议</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
