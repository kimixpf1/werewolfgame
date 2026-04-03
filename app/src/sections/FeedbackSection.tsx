import { useState } from 'react';
import { ArrowLeft, Loader2, Mail, MessageSquareText, User } from 'lucide-react';

interface FeedbackSectionProps {
  onBack: () => void;
  onSubmit: (payload: { playerName: string; contact: string; content: string }) => void;
  loading?: boolean;
  initialPlayerName?: string;
  initialRoomId?: string;
}

export function FeedbackSection({
  onBack,
  onSubmit,
  loading = false,
  initialPlayerName = '',
  initialRoomId = '',
}: FeedbackSectionProps) {
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [contact, setContact] = useState('');
  const [content, setContent] = useState('');

  const canSubmit = content.trim().length >= 5;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex items-center gap-4 p-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">建议信箱</h1>
          <p className="text-slate-500 text-sm">欢迎反馈体验问题、新功能建议或规则需求</p>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto space-y-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300">
          <p className="text-sm leading-6">
            你的建议会进入管理员后台。联系方式选填，方便我后续联系你了解细节。
          </p>
          {initialRoomId && (
            <p className="mt-2 text-xs text-slate-500">当前房间：{initialRoomId}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            昵称
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="方便我知道你是谁，可不填"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            联系方式
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="微信 / QQ / 邮箱，可不填"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <MessageSquareText className="w-4 h-4" />
            建议内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="例如：希望支持某种板子、某个交互不顺手、某个功能有 bug..."
            rows={7}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="text-right text-xs text-slate-500">{content.length} 字</div>
        </div>

        <button
          onClick={() => onSubmit({ playerName: playerName.trim(), contact: contact.trim(), content: content.trim() })}
          disabled={!canSubmit || loading}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              提交中...
            </>
          ) : (
            '提交建议'
          )}
        </button>
      </div>
    </div>
  );
}
