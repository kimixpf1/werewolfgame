import { ArrowLeft, ShieldAlert, ScrollText } from 'lucide-react';

interface LegalSectionProps {
  onBack: () => void;
}

const LEGAL_ITEMS = [
  {
    title: '版权声明',
    content:
      '本页面及其前端交互、视觉排版、统计与辅助能力为“狼人杀发牌员”项目自有实现。狼人杀相关角色名称、民间规则和阵营叫法主要来源于桌游常用称呼，仅用于玩法说明与聚会辅助，不代表对任何第三方品牌、赛事或商业发行方的官方授权关系。',
  },
  {
    title: '非官方声明',
    content:
      '本工具是线下聚会的辅助网页，不属于任何官方狼人杀游戏客户端、赛事平台或出版发行方，也不提供在线赌博、现金交易、代练托管等服务。',
  },
  {
    title: '使用免责',
    content:
      '房主、法官和玩家应自行确认线下活动规则、年龄适配、场地安全和参与秩序。因网络波动、设备兼容性、用户误操作、浏览器静音、第三方服务中断等原因导致的流程中断、记录偏差或体验问题，开发者不对线下对局结果、争议或衍生损失承担责任。',
  },
  {
    title: '数据说明',
    content:
      '为保障房间同步、设备统计、建议信箱和管理员后台能力，系统会记录必要的房间编号、设备标识、玩家昵称、事件时间和建议内容。请勿在房间名、昵称、建议或备注中提交身份证号、银行卡号、精确住址等敏感信息。',
  },
  {
    title: '内容边界',
    content:
      '用户应确保自己填写和传播的昵称、建议、房间信息与截图内容不侵犯他人名誉、隐私、著作权或其他合法权益。如收到侵权、违法或不当内容反馈，项目方有权删除相关信息并限制继续使用。',
  },
  {
    title: '联系与处理',
    content:
      '如需反馈版权、侵权、内容合规或功能风险问题，可通过首页“建议信箱”提交，建议附上房间号、时间和问题说明，便于后台跟进处理。',
  },
];

export function LegalSection({ onBack }: LegalSectionProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={onBack}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">版权与免责声明</h1>
            <p className="text-sm text-slate-500">降低误用、侵权与活动争议风险</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 p-4 pb-20">
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
          <div className="flex items-center gap-3 text-amber-300">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-semibold">使用前提示</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            本页内容旨在帮助房主、法官和玩家明确工具定位与使用边界，不能替代你所在地适用的法律法规、平台规则或线下活动组织责任。
          </p>
        </div>

        {LEGAL_ITEMS.map((item) => (
          <section
            key={item.title}
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20"
          >
            <div className="mb-3 flex items-center gap-2 text-purple-300">
              <ScrollText className="h-4 w-4" />
              <h2 className="text-base font-semibold text-white">{item.title}</h2>
            </div>
            <p className="text-sm leading-7 text-slate-300">{item.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
