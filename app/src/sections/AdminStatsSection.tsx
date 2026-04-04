import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  Gamepad2,
  Loader2,
  LogOut,
  Mailbox,
  MessageSquareText,
  RefreshCw,
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
import type { AdminDashboardSummary, AdminProfile } from '@/types';

interface AdminStatsSectionProps {
  profile: AdminProfile;
  summary: AdminDashboardSummary | null;
  loading?: boolean;
  error?: string;
  onBack: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
  onOpenFeedback: () => void;
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
  icon: ReactNode;
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

export function AdminStatsSection({
  profile,
  summary,
  loading = false,
  error = '',
  onBack,
  onSignOut,
  onRefresh,
  onOpenFeedback,
}: AdminStatsSectionProps) {
  const trendChartData = useMemo(
    () =>
      (summary?.trend ?? []).map((item) => ({
        date: item.date.slice(5),
        active_devices: item.active_devices,
        rooms_created: item.rooms_created,
        games_started: item.games_started,
        feedback_count: item.feedback_count,
      })),
    [summary]
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
            <h1 className="text-xl font-bold text-white">玩家统计中心</h1>
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
            <div className="text-white font-semibold">当前页面：玩家统计</div>
            <p className="text-slate-400 text-sm mt-1">这里专门查看设备、房间、开局和建议信箱整体趋势。</p>
          </div>
          <button
            onClick={onOpenFeedback}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <Mailbox className="w-4 h-4" />
            进入建议信箱
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            正在加载统计数据...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

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
    </div>
  );
}
