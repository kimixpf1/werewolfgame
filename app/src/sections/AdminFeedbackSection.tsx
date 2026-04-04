import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CheckCheck,
  Inbox,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
  EyeOff,
} from 'lucide-react';
import type { AdminDashboardSummary, AdminProfile, FeedbackMessage, FeedbackStatus } from '@/types';

interface AdminFeedbackSectionProps {
  profile: AdminProfile;
  summary: AdminDashboardSummary | null;
  feedbackList: FeedbackMessage[];
  loading?: boolean;
  error?: string;
  feedbackFilter: FeedbackStatus | 'all';
  feedbackReadFilter: boolean | 'all';
  onBack: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
  onOpenStats: () => void;
  onChangeFilter: (status: FeedbackStatus | 'all') => void;
  onChangeReadFilter: (readState: boolean | 'all') => void;
  onUpdateFeedback: (feedbackId: number, status: FeedbackStatus, adminNote: string) => void;
  onMarkRead: (feedbackIds: number[], isRead: boolean) => void;
  onDeleteFeedback: (feedbackId: number) => void;
  onBatchDeleteFeedback: (feedbackIds: number[]) => void;
}

const STATUS_OPTIONS: Array<{ value: FeedbackStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'new', label: '新建议' },
  { value: 'processing', label: '处理中' },
  { value: 'done', label: '已处理' },
  { value: 'ignored', label: '已忽略' },
];

const READ_OPTIONS: Array<{ value: boolean | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: false, label: '未读' },
  { value: true, label: '已读' },
];

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  processing: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  ignored: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: '新建议',
  processing: '处理中',
  done: '已处理',
  ignored: '已忽略',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function FeedbackItem({
  item,
  selected,
  onToggleSelect,
  onUpdate,
  onMarkRead,
  onDelete,
}: {
  item: FeedbackMessage;
  selected: boolean;
  onToggleSelect: (feedbackId: number) => void;
  onUpdate: (feedbackId: number, status: FeedbackStatus, adminNote: string) => void;
  onMarkRead: (feedbackIds: number[], isRead: boolean) => void;
  onDelete: (feedbackId: number) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [note, setNote] = useState(item.admin_note ?? '');

  useEffect(() => {
    setStatus(item.status);
    setNote(item.admin_note ?? '');
  }, [item]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onToggleSelect(item.id)}
          className={`w-5 h-5 rounded border transition-colors ${
            selected ? 'bg-purple-600 border-purple-500' : 'border-slate-600 bg-slate-800'
          }`}
          aria-label={selected ? '取消选择' : '选择建议'}
        />
        <span className={`px-2.5 py-1 rounded-full border text-xs ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <span className={`px-2.5 py-1 rounded-full border text-xs ${item.is_read ? 'bg-slate-500/15 text-slate-300 border-slate-500/20' : 'bg-rose-500/15 text-rose-300 border-rose-500/20'}`}>
          {item.is_read ? '已读' : '未读'}
        </span>
        <span className="text-slate-500 text-xs">ID #{item.id}</span>
        <span className="text-slate-500 text-xs">{formatDateTime(item.created_at)}</span>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-white font-medium">{item.player_name || '匿名玩家'}</div>
          {item.read_at && <div className="text-slate-500 text-xs">已读于 {formatDateTime(item.read_at)}</div>}
        </div>
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
          <option value="new">新建议</option>
          <option value="processing">处理中</option>
          <option value="done">已处理</option>
          <option value="ignored">已忽略</option>
        </select>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="管理员备注"
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onUpdate(item.id, status, note)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            保存
          </button>
          <button
            onClick={() => onMarkRead([item.id], !item.is_read)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {item.is_read ? '标未读' : '标已读'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('确认删除这条建议吗？删除后无法恢复。')) {
                onDelete(item.id);
              }
            }}
            className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/20 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminFeedbackSection({
  profile,
  summary,
  feedbackList,
  loading = false,
  error = '',
  feedbackFilter,
  feedbackReadFilter,
  onBack,
  onSignOut,
  onRefresh,
  onOpenStats,
  onChangeFilter,
  onChangeReadFilter,
  onUpdateFeedback,
  onMarkRead,
  onDeleteFeedback,
  onBatchDeleteFeedback,
}: AdminFeedbackSectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectedCount = selectedIds.length;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => feedbackList.some((item) => item.id === id)));
  }, [feedbackList]);

  const toggleSelect = (feedbackId: number) => {
    setSelectedIds((prev) =>
      prev.includes(feedbackId) ? prev.filter((id) => id !== feedbackId) : [...prev, feedbackId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === feedbackList.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(feedbackList.map((item) => item.id));
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="返回首页"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">建议信箱</h1>
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
        <div className="rounded-2xl border border-purple-500/20 bg-slate-900/70 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-white font-semibold">当前页面：建议信箱</div>
            <p className="text-slate-400 text-sm mt-1">这里专门处理玩家建议，支持筛选、批量已读和批量删除。</p>
          </div>
          <button
            onClick={onOpenStats}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            返回玩家统计
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            正在加载信箱数据...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-white text-lg font-semibold">信箱处理台</h2>
              <p className="text-slate-500 text-sm mt-1">
                当前共 {summary?.total_feedback ?? 0} 条建议，未读 {summary?.unread_feedback ?? 0} 条
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onMarkRead(selectedIds, true)}
                disabled={!selectedCount}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                批量已读
              </button>
              <button
                onClick={() => onMarkRead(selectedIds, false)}
                disabled={!selectedCount}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                批量未读
              </button>
              <button
                onClick={() => {
                  if (!selectedCount) return;
                  if (window.confirm(`确认删除选中的 ${selectedCount} 条建议吗？删除后无法恢复。`)) {
                    onBatchDeleteFeedback(selectedIds);
                  }
                }}
                disabled={!selectedCount}
                className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 border border-red-500/20 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                批量删除
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
            <div>
              <div className="text-slate-300 text-sm font-medium mb-2">状态筛选</div>
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

            <div>
              <div className="text-slate-300 text-sm font-medium mb-2">阅读筛选</div>
              <div className="flex flex-wrap gap-2">
                {READ_OPTIONS.map((option) => (
                  <button
                    key={String(option.value)}
                    onClick={() => onChangeReadFilter(option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      feedbackReadFilter === option.value
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-sm"
              >
                {selectedIds.length === feedbackList.length && feedbackList.length > 0 ? '取消全选' : '全选当前结果'}
              </button>
              <div className="text-slate-500 text-sm">
                已选择 {selectedCount} 条
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {feedbackList.map((item) => (
              <FeedbackItem
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={toggleSelect}
                onUpdate={onUpdateFeedback}
                onMarkRead={onMarkRead}
                onDelete={onDeleteFeedback}
              />
            ))}
            {!feedbackList.length && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <div className="text-slate-400">当前筛选条件下暂无建议</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
