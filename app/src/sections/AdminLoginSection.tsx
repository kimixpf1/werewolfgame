import { useState } from 'react';
import { ArrowLeft, Loader2, Lock, Mail, Shield } from 'lucide-react';

interface AdminLoginSectionProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  loading?: boolean;
  error?: string;
}

export function AdminLoginSection({
  onBack,
  onLogin,
  loading = false,
  error = '',
}: AdminLoginSectionProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canLogin = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex items-center gap-4 p-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">管理员后台</h1>
      </div>

      <div className="max-w-md mx-auto p-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">管理员登录</h2>
            <p className="text-slate-400 text-sm mt-2">
              使用你的 Supabase 管理员账号登录查看统计和玩家建议
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="管理员邮箱"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="管理员密码"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              onClick={() => onLogin(email.trim(), password)}
              disabled={!canLogin || loading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '进入后台'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
