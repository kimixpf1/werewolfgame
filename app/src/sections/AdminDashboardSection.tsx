import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCheck,
  Eye,
  EyeOff,
  Gamepad2,
  Inbox,
  Loader2,
  LogOut,
  Mailbox,
  MessageSquareText,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { AdminDashboardSummary, AdminProfile, FeedbackMessage, FeedbackStatus } from '@/types';

interface AdminDashboardSectionProps {
  profile: AdminProfile;
  summary: AdminDashboardSummary | null;
  feedbackList: FeedbackMessage[];
  loading?: boolean;
  feedbackFilter: FeedbackStatus | 'all';
  feedbackReadFilter: boolean | 'all';
  onBack: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
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

function MetricCard({
  title,
  value,
  caption,
  icon,
}: {
  title: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-slate-400 text-sm">{title}</div>
          <div className="text-3xl font-bold text-white mt-2">{value}</div>
          <div className="text-xs text-slate-500 mt-1">{caption}</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
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

export function AdminDashboardSection({
  profile,
  summary,
  feedbackList,
  loading = false,
  feedbackFilter,
  feedbackReadFilter,
  onBack,
  onSignOut,
  onRefresh,
  onChangeFilter,
  onChangeReadFilter,
  onUpdateFeedback,
  onMarkRead,
  onDeleteFeedback,
  onBatchDeleteFeedback,
}: AdminDashboardSectionProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'feedback'>('stats');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const trend = useMemo(() => summary?.trend ?? [], [summary]);
  const selectedCount = selectedIds.length;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => feedbackList.some((item) => item.id === id)));
  }, [feedbackList]);

  const trendChartData = useMemo(
    () =>
      trend.map((item) => ({
        date: item.date.slice(5),
        active_devices: item.active_devices,
        rooms_created: item.rooms_created,
        games_started: item.games_started,
        feedback_count: item.feedback_count,
      })),
    [trend]
  );

  const feedbackReadChartData = useMemo(
    () => [
      { name: '未读', value: summary?.unread_feedback ?? 0, color: '#fb7185' },
      { name: '已读', value: summary?.read_feedback ?? 0, color: '#38bdf8' },
    ],
    [summary]
  );

  const workflowChartData = useMemo(
    () => [
      { name: '待处理', value: summary?.pending_feedback ?? 0, color: '#f59e0b' },
      { name: '处理中', value: summary?.processing_feedback ?? 0, color: '#38bdf8' },
      { name: '已完结', value: summary?.resolved_feedback ?? 0, color: '#10b981' },
    ],
    [summary]
  );

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

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              activeTab === 'stats'
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center gap-3 text-white">
              <BarChart3 className="w-5 h-5 text-purple-300" />
              <div>
                <div className="font-semibold">玩家统计</div>
                <div className="text-sm text-slate-400">统计面板、活跃趋势和转化图表</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              activeTab === 'feedback'
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center gap-3 text-white">
              <Mailbox className="w-5 h-5 text-purple-300" />
              <div>
                <div className="font-semibold">建议信箱</div>
                <div className="text-sm text-slate-400">批量已读、批量删除和单条处理</div>
              </div>
            </div>
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="设备总量"
                value={summary?.total_devices ?? 0}
                caption={`近 7 天活跃 ${summary?.active_devices_7d ?? 0}`}
                icon={<Users className="w-5 h-5" />}
              />
              <MetricCard
                title="房间总量"
                value={summary?.total_rooms ?? 0}
                caption={`已开局 ${summary?.games_started ?? 0} / 已结束 ${summary?.games_ended ?? 0}`}
                icon={<Gamepad2 className="w-5 h-5" />}
              />
              <MetricCard
                title="加入事件"
                value={summary?.total_join_events ?? 0}
                caption="累计玩家加入房间事件"
                icon={<Activity className="w-5 h-5" />}
              />
              <MetricCard
                title="建议总量"
                value={summary?.total_feedback ?? 0}
                caption={`未读 ${summary?.unread_feedback ?? 0} / 待处理 ${summary?.pending_feedback ?? 0}`}
                icon={<MessageSquareText className="w-5 h-5" />}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-4">
                  <h2 className="text-white text-lg font-semibold">近 14 天玩家与开局趋势</h2>
                  <p className="text-slate-500 text-sm mt-1">观察活跃设备、建房和开局变化</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: '#020617',
                          border: '1px solid #334155',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="active_devices" name="活跃设备" stroke="#a855f7" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="rooms_created" name="新建房间" stroke="#22c55e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="games_started" name="开始对局" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="mb-4">
                    <h2 className="text-white text-lg font-semibold">建议信箱阅读分布</h2>
                    <p className="text-slate-500 text-sm mt-1">快速判断后台积压情况</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={feedbackReadChartData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={4}>
                          {feedbackReadChartData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#020617',
                            border: '1px solid #334155',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="mb-4">
                    <h2 className="text-white text-lg font-semibold">处理进度</h2>
                    <p className="text-slate-500 text-sm mt-1">待处理、处理中、已完结</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workflowChartData}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            background: '#020617',
                            border: '1px solid #334155',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {workflowChartData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-4">
                <h2 className="text-white text-lg font-semibold">每日建议趋势</h2>
                <p className="text-slate-500 text-sm mt-1">统计玩家反馈提交波动</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: '#020617',
                        border: '1px solid #334155',
                        borderRadius: 12,
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="feedback_count" name="新增建议" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-white text-lg font-semibold">建议信箱</h2>
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
        )}
      </div>
    </div>
  );
}
