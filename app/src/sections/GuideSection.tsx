import { ArrowLeft, Users, Plus, LogIn, Crown, Shuffle, BookOpen } from 'lucide-react';

interface GuideSectionProps {
  onBack: () => void;
}

const GUIDE_STEPS = [
  {
    icon: Plus,
    title: '创建房间',
    description: '点击"创建房间"，输入法官名字，选择玩家人数和角色配置。系统会根据人数自动推荐板子。',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  },
  {
    icon: LogIn,
    title: '玩家加入',
    description: '其他玩家点击"加入房间"，输入6位房间号和玩家名字即可加入。建议格式：位置+姓名（如"1号张三"）。',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  {
    icon: Crown,
    title: '法官管理',
    description: '法官可以修改玩家名字、踢出玩家、颁发警徽、标记玩家存活状态等。',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10'
  },
  {
    icon: Shuffle,
    title: '开始发牌',
    description: '所有玩家加入后，法官点击"开始发牌"，系统会随机分配角色给所有玩家。',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  {
    icon: BookOpen,
    title: '查看身份',
    description: '玩家点击自己的角色卡片查看身份，可以翻转隐藏。切换到"提示"标签页查看角色游戏提示。',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10'
  }
];

const FEATURES = [
  {
    title: '跨设备同步',
    description: '所有操作实时同步，玩家列表、游戏状态即时更新'
  },
  {
    title: '32种角色',
    description: '支持预言家、女巫、狼美人、石像鬼等32种角色自由组合'
  },
  {
    title: '自动推荐板子',
    description: '根据人数自动推荐平衡的角色配置'
  },
  {
    title: '法官记录面板',
    description: '记录每晚行动和白天投票，自动判断游戏结束'
  },
  {
    title: '警长系统',
    description: '支持警徽颁发、传递、撕毁'
  },
  {
    title: '屠城/屠边模式',
    description: '支持两种胜负模式，自动判断获胜阵营'
  }
];

export function GuideSection({ onBack }: GuideSectionProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-10">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">用法简介</h1>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* 游戏流程 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              游戏流程
            </h2>
            <div className="space-y-3">
              {GUIDE_STEPS.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{index + 1}. {step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 功能特点 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">功能特点</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((feature, index) => (
                <div key={index} className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="font-bold text-purple-400 mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 注意事项 */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <h3 className="font-bold text-yellow-400 mb-2">注意事项</h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• 法官不计入玩家人数</li>
              <li>• 角色总数必须与玩家人数相等才能开始发牌</li>
              <li>• 踢人功能仅在等待阶段可用</li>
              <li>• 角色身份仅自己可见，请勿展示给其他玩家</li>
            </ul>
          </div>

          {/* 提示 */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              更多问题请联系法官或重新创建房间
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
