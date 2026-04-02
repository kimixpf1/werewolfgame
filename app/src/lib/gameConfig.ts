import type { RoleConfig, BoardConfig, RoleType, ModeratorTip, Player } from '@/types';

// 角色定义 - 包含纸牌样式颜色
export const ROLES: Record<RoleType, { 
  name: string; 
  description: string; 
  team: 'good' | 'evil' | 'neutral';
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  ability: string;
  tips: string[];
  nightAction?: string;
  specialAction?: string; // 特殊行动（如白天自爆、决斗等）
}> = {
  werewolf: { 
    name: '狼人', 
    description: '夜晚与狼队友一起选择击杀目标', 
    team: 'evil',
    color: '#ef4444',
    bgColor: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #991b1b 100%)',
    borderColor: '#fca5a5',
    icon: '🐺',
    ability: '每晚可杀一人',
    nightAction: 'werewolf',
    tips: [
      '夜晚请睁眼，与队友商量选择击杀目标',
      '所有狼人统一意见后告知法官',
      '确认目标后请闭眼',
      '白天可以悍跳神职，混淆视听'
    ]
  },
  villager: { 
    name: '平民', 
    description: '通过发言和投票找出狼人', 
    team: 'good',
    color: '#22c55e',
    bgColor: 'linear-gradient(135deg, #14532d 0%, #22c55e 50%, #15803d 100%)',
    borderColor: '#86efac',
    icon: '👤',
    ability: '无特殊技能，通过发言找狼',
    tips: [
      '仔细聆听其他玩家发言',
      '观察玩家的逻辑和表情',
      '配合神职找出狼人',
      '不要划水，积极发言'
    ]
  },
  seer: { 
    name: '预言家', 
    description: '夜晚可以查验一名玩家是好人还是狼人', 
    team: 'good',
    color: '#a855f7',
    bgColor: 'linear-gradient(135deg, #581c87 0%, #a855f7 50%, #7e22ce 100%)',
    borderColor: '#d8b4fe',
    icon: '🔮',
    ability: '每晚可查验一人身份',
    nightAction: 'seer',
    tips: [
      '夜晚请睁眼，选择要查验的玩家',
      '法官会手势告知该玩家是好人（拇指向上）还是狼人（拇指向下）',
      '请保护好自己，不要轻易暴露身份',
      '可以跳预言家带队，但要小心被狼人针对'
    ]
  },
  witch: { 
    name: '女巫', 
    description: '拥有一瓶解药和一瓶毒药，每瓶药只能用一次', 
    team: 'good',
    color: '#ec4899',
    bgColor: 'linear-gradient(135deg, #831843 0%, #ec4899 50%, #be185d 100%)',
    borderColor: '#fbcfe8',
    icon: '🧙‍♀️',
    ability: '解药救人，毒药杀人（各一瓶）',
    nightAction: 'witch',
    tips: [
      '夜晚请睁眼，法官会告知今晚的死者',
      '解药只有一瓶，谨慎使用（建议首夜救人）',
      '毒药只有一瓶，可以毒杀一名玩家',
      '解药和毒药不能在同一晚使用',
      '解药用完后无法知道当晚死者',
      '被毒死的玩家无法发动技能（如猎人不能开枪）'
    ]
  },
  hunter: { 
    name: '猎人', 
    description: '死亡时可以开枪带走一名玩家（被毒死不能开枪）', 
    team: 'good',
    color: '#f97316',
    bgColor: 'linear-gradient(135deg, #7c2d12 0%, #f97316 50%, #c2410c 100%)',
    borderColor: '#fdba74',
    icon: '🔫',
    ability: '死亡时可开枪带走一人',
    nightAction: 'hunter',
    tips: [
      '当你被投票出局或被狼人击杀时，可以开枪',
      '选择是否带走一名玩家',
      '⚠️ 如果被女巫毒死，不能开枪！',
      '可以明跳猎人威慑狼人',
      '开枪时考虑带走的对象是否为狼人'
    ]
  },
  idiot: { 
    name: '白痴', 
    description: '被投票出局时可以翻牌免疫', 
    team: 'good',
    color: '#eab308',
    bgColor: 'linear-gradient(135deg, #713f12 0%, #eab308 50%, #a16207 100%)',
    borderColor: '#fde047',
    icon: '🤪',
    ability: '被投出局可翻牌免疫',
    tips: [
      '被投票出局时可以选择翻牌',
      '翻牌后不会出局，但失去投票权',
      '可以继续发言，帮助好人阵营',
      '翻牌后免疫所有投票'
    ]
  },
  guard: { 
    name: '守卫', 
    description: '夜晚可以守护一名玩家不被狼人击杀，不能连续守护同一人', 
    team: 'good',
    color: '#3b82f6',
    bgColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
    borderColor: '#93c5fd',
    icon: '🛡️',
    ability: '每晚可守护一人',
    nightAction: 'guard',
    tips: [
      '夜晚请睁眼，选择要守护的玩家',
      '被守护的玩家当晚不会被狼人击杀',
      '⚠️ 不能连续两晚守护同一个人！',
      '可以自守，但要小心和女巫解药冲突（同守同救会死）',
      '建议守护疑似神职的玩家'
    ]
  },
  elder: { 
    name: '长老', 
    description: '有两条命，被狼人击杀两次才会死亡，被投票出局直接死亡', 
    team: 'good',
    color: '#14b8a6',
    bgColor: 'linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #0f766e 100%)',
    borderColor: '#5eead4',
    icon: '👴',
    ability: '有两条命',
    tips: [
      '长老被狼人击杀第一次不会死亡',
      '被击杀第二次才会真正死亡',
      '⚠️ 如果被投票出局直接死亡！',
      '长老死亡后所有神职失去技能',
      '建议隐藏身份，避免被投票'
    ]
  },
  whitewolf: { 
    name: '白狼王', 
    description: '白天投票前可以自爆，带走一名玩家', 
    team: 'evil',
    color: '#dc2626',
    bgColor: 'linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #991b1b 100%)',
    borderColor: '#fecaca',
    icon: '🐺👑',
    ability: '白天自爆可带走一人',
    nightAction: 'werewolf',
    specialAction: 'selfExplode',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 白天投票前可以随时自爆！',
      '自爆时可以带走一名玩家',
      '常用于带走明神职（如预言家）',
      '自爆后当天白天流程结束，直接进入黑夜'
    ]
  },
  wolfgun: { 
    name: '狼枪', 
    description: '狼人阵营，被投票出局时可以开枪带走一名玩家', 
    team: 'evil',
    color: '#b91c1c',
    bgColor: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 50%, #7f1d1d 100%)',
    borderColor: '#fca5a5',
    icon: '🐺🔫',
    ability: '被票出可开枪带走一人',
    nightAction: 'werewolf',
    specialAction: 'shootWhenExecuted',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 被投票出局时可以开枪带走一人！',
      '⚠️ 如果被女巫毒死，不能开枪！',
      '可以故意表现得像狼，吸引投票然后开枪',
      '开枪时考虑带走的对象'
    ]
  },
  knight: { 
    name: '骑士', 
    description: '白天发言阶段可以决斗一名玩家，对方是狼人则狼人死亡，否则骑士死亡', 
    team: 'good',
    color: '#6366f1',
    bgColor: 'linear-gradient(135deg, #312e81 0%, #6366f1 50%, #4338ca 100%)',
    borderColor: '#a5b4fc',
    icon: '⚔️',
    ability: '白天可决斗一名玩家',
    specialAction: 'duel',
    tips: [
      '白天发言阶段可以随时发起决斗',
      '选择一名玩家进行决斗',
      '如果对方是狼人，狼人立即死亡',
      '如果对方是好人，你立即死亡',
      '常用于验证疑似狼人的玩家',
      '决斗后当天白天流程结束，直接进入黑夜'
    ]
  },
  // 守墓人
  gravedigger: {
    name: '守墓人',
    description: '每晚可以得知上一个白天被放逐的玩家是好人还是狼人',
    team: 'good',
    color: '#78716c',
    bgColor: 'linear-gradient(135deg, #44403c 0%, #78716c 50%, #57534e 100%)',
    borderColor: '#d6d3d1',
    icon: '⚰️',
    ability: '每晚知道前一天被放逐者的阵营',
    nightAction: 'gravedigger',
    tips: [
      '夜晚请睁眼，法官会告知昨天被放逐玩家的阵营',
      '利用信息判断场上局势',
      '可以帮助好人确认放逐是否正确',
      '注意狼人可能会故意被放逐来误导你'
    ]
  },
  // 乌鸦
  crow: {
    name: '乌鸦',
    description: '每晚可以诅咒一名玩家，该玩家在下一个白天放逐时额外被投一票',
    team: 'good',
    color: '#1f2937',
    bgColor: 'linear-gradient(135deg, #030712 0%, #1f2937 50%, #111827 100%)',
    borderColor: '#4b5563',
    icon: '🐦‍⬛',
    ability: '每晚诅咒一人，放逐时额外一票',
    nightAction: 'crow',
    tips: [
      '夜晚请睁眼，选择要诅咒的玩家',
      '被诅咒的玩家在下次放逐投票时额外被投一票',
      '⚠️ 不能连续两晚诅咒同一名玩家！',
      '诅咒可以对自己使用',
      '常用于确保狼人被放逐'
    ]
  },
  // 魔术师
  magician: {
    name: '魔术师',
    description: '每晚可以交换两名玩家的号码牌，当晚有效',
    team: 'good',
    color: '#8b5cf6',
    bgColor: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 50%, #6d28d9 100%)',
    borderColor: '#c4b5fd',
    icon: '🎩',
    ability: '每晚交换两人号码牌',
    nightAction: 'magician',
    tips: [
      '夜晚请睁眼，选择两名玩家交换号码牌',
      '交换后狼人刀的人会变成另一个人',
      '预言家验的人也会改变',
      '⚠️ 整局游戏每个号码牌只能交换一次！',
      '可以让狼人自相残杀'
    ]
  },
  // 摄梦人
  dreamer: {
    name: '摄梦人',
    description: '每晚必须选择一名玩家成为梦游者，梦游者免疫夜间伤害',
    team: 'good',
    color: '#a78bfa',
    bgColor: 'linear-gradient(135deg, #5b21b6 0%, #a78bfa 50%, #7c3aed 100%)',
    borderColor: '#ddd6fe',
    icon: '💤',
    ability: '每晚选择梦游者，免疫夜间伤害',
    nightAction: 'dreamer',
    tips: [
      '夜晚请睁眼，选择一名玩家成为梦游者',
      '梦游者当晚免疫狼刀、毒药等伤害',
      '⚠️ 摄梦人夜间死亡则梦游者一并出局！',
      '⚠️ 同一玩家连续两晚成为梦游者也会出局！',
      '每晚必须选择目标，不能空守'
    ]
  },
  // 猎魔人
  demonhunter: {
    name: '猎魔人',
    description: '从第二晚开始，每晚狩猎一名玩家，对方是狼人则次日对方出局，否则自己出局',
    team: 'good',
    color: '#dc2626',
    bgColor: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #991b1b 100%)',
    borderColor: '#fca5a5',
    icon: '🏹',
    ability: '每晚狩猎，狼人死否则自己死',
    nightAction: 'demonhunter',
    tips: [
      '从第二晚开始，每晚选择一名玩家狩猎',
      '如果对方是狼人，次日狼人出局',
      '如果对方是好人，次日你出局',
      '⚠️ 免疫女巫毒药！',
      '可以重复狩猎，直到死亡'
    ]
  },
  // 禁言长老
  muter: {
    name: '禁言长老',
    description: '每晚可以指定一名玩家，该玩家下一个白天不能发言',
    team: 'good',
    color: '#71717a',
    bgColor: 'linear-gradient(135deg, #3f3f46 0%, #71717a 50%, #52525b 100%)',
    borderColor: '#d4d4d8',
    icon: '🤐',
    ability: '每晚禁言一名玩家',
    nightAction: 'muter',
    tips: [
      '夜晚请睁眼，选择要禁言的玩家',
      '被禁言的玩家下一个白天不能发言',
      '⚠️ 不能连续两晚禁言同一名玩家！',
      '可以选择不发动技能',
      '常用于限制狼人发言'
    ]
  },
  // 奇迹商人
  miracle: {
    name: '奇迹商人',
    description: '每晚可以选择一名玩家成为幸运儿，使其获得查验、毒药或守护技能之一',
    team: 'good',
    color: '#fbbf24',
    bgColor: 'linear-gradient(135deg, #92400e 0%, #fbbf24 50%, #d97706 100%)',
    borderColor: '#fde68a',
    icon: '✨',
    ability: '给幸运儿一个技能（查验/毒药/守护）',
    nightAction: 'miracle',
    tips: [
      '夜晚请睁眼，选择一名玩家成为幸运儿',
      '选择要给予的技能：查验、毒药或守护',
      '⚠️ 整局游戏只能使用一次！',
      '⚠️ 如果幸运儿是狼人，次日你出局！',
      '建议给可信的好人玩家'
    ]
  },
  // 纯白之女
  pure: {
    name: '纯白之女',
    description: '每晚查验玩家具体身份，从第二夜起查验到狼人则狼人被查验出局',
    team: 'good',
    color: '#f8fafc',
    bgColor: 'linear-gradient(135deg, #94a3b8 0%, #f8fafc 50%, #cbd5e1 100%)',
    borderColor: '#e2e8f0',
    icon: '👼',
    ability: '查验身份，验到狼人则狼人出局',
    nightAction: 'pure',
    tips: [
      '夜晚请睁眼，选择要查验的玩家',
      '法官会告知该玩家的具体身份',
      '⚠️ 从第二夜起，查验到狼人则狼人出局！',
      '可以重复查验同一个目标',
      '被守卫守护的狼人也会被查验出局'
    ]
  },
  // 定序王子
  prince: {
    name: '定序王子',
    description: '每局游戏限一次，可以在投票结束后逆转时空重新投票',
    team: 'good',
    color: '#f59e0b',
    bgColor: 'linear-gradient(135deg, #78350f 0%, #f59e0b 50%, #b45309 100%)',
    borderColor: '#fcd34d',
    icon: '👑',
    ability: '限一次，逆转投票重新投票',
    specialAction: 'reverse',
    tips: [
      '在第一次放逐投票结束后可以发动技能',
      '翻牌发动技能，逆转时空回到投票前',
      '可以进行一次额外发言',
      '⚠️ 每局游戏只能使用一次！',
      '发动技能后狼人不能自爆'
    ]
  },
  // 流光伯爵
  count: {
    name: '流光伯爵',
    description: '每晚可以选择一名玩家使用流光庇护，使其免疫夜间任何伤害',
    team: 'good',
    color: '#06b6d4',
    bgColor: 'linear-gradient(135deg, #164e63 0%, #06b6d4 50%, #0891b2 100%)',
    borderColor: '#a5f3fc',
    icon: '💫',
    ability: '每晚庇护一人，免疫夜间伤害',
    nightAction: 'count',
    tips: [
      '夜晚请睁眼，选择要庇护的玩家',
      '被庇护的玩家免疫夜间任何伤害',
      '⚠️ 不能连续两晚庇护同一人！',
      '⚠️ 不能对自己使用！',
      '可以免疫狼刀、毒药等多种伤害'
    ]
  },
  // 炼金魔女
  alchemist: {
    name: '炼金魔女',
    description: '拥有未明之雾和法老之蛇，可以限制狼人袭击范围并救活被袭击者',
    team: 'good',
    color: '#84cc16',
    bgColor: 'linear-gradient(135deg, #3f6212 0%, #84cc16 50%, #65a30d 100%)',
    borderColor: '#d9f99d',
    icon: '⚗️',
    ability: '未明之雾限制狼刀范围，法老之蛇救人',
    nightAction: 'alchemist',
    tips: [
      '拥有一团未明之雾和一条法老之蛇',
      '未明之雾：选定三名玩家，狼人必须从中选择袭击目标',
      '法老之蛇：在公布出局信息前决定是否救活该玩家',
      '⚠️ 各只能使用一次！',
      '法老之蛇可以对自己使用'
    ]
  },
  // 老流氓
  hooligan: {
    name: '老流氓',
    description: '被撒毒或射杀后进入中毒/负伤状态，第二天发言结束后才死亡',
    team: 'good',
    color: '#854d0e',
    bgColor: 'linear-gradient(135deg, #451a03 0%, #854d0e 50%, #713f12 100%)',
    borderColor: '#fde047',
    icon: '🍺',
    ability: '被毒/射杀后延迟死亡',
    tips: [
      '你是平民牌，被查验为好人',
      '⚠️ 被女巫毒杀后进入中毒状态',
      '⚠️ 被猎人射杀后进入负伤状态',
      '进入状态后当天不会死亡',
      '第二天发言结束后才死亡，珍惜最后一次发言机会'
    ]
  },
  // 狼美人
  wolfbeauty: {
    name: '狼美人',
    description: '每晚可以魅惑一名玩家，自己死亡时被魅惑者一起殉情出局',
    team: 'evil',
    color: '#db2777',
    bgColor: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #be185d 100%)',
    borderColor: '#fbcfe8',
    icon: '🐺💋',
    ability: '魅惑玩家，自己死亡时带走被魅惑者',
    nightAction: 'werewolf',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 每晚可以魅惑一名玩家！',
      '当你被毒/放逐/射杀出局时，被魅惑者一起殉情',
      '⚠️ 不能自爆或自刀！',
      '⚠️ 被骑士决斗则魅惑技能失效！',
      '被魅惑的玩家不知情'
    ]
  },
  // 石像鬼
  gargoyle: {
    name: '石像鬼',
    description: '每晚可以查验一名玩家的具体身份，狼队友全死后获得刀人能力',
    team: 'evil',
    color: '#64748b',
    bgColor: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #475569 100%)',
    borderColor: '#cbd5e1',
    icon: '🗿',
    ability: '每晚查验玩家具体身份',
    nightAction: 'gargoyle',
    tips: [
      '你是狼人阵营，但与其他狼人不见面',
      '⚠️ 每晚可以查验一名玩家的具体身份！',
      '不能验自己或重复验人',
      '其他狼人存活时你处于闭眼状态',
      '其他狼人全死后你获得刀人能力'
    ]
  },
  // 隐狼
  hiddenwolf: {
    name: '隐狼',
    description: '查验结果为好人，知道狼队友身份但不能刀人，狼队友全死后获得刀人能力',
    team: 'evil',
    color: '#475569',
    bgColor: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #334155 100%)',
    borderColor: '#94a3b8',
    icon: '🐺🎭',
    ability: '查验为好人，知道狼队友',
    nightAction: 'hiddenwolf',
    tips: [
      '你是狼人阵营，但查验结果为好人',
      '你知道其他狼人的身份',
      '⚠️ 不能与其他狼人一起刀人！',
      '其他狼人不知道你的身份',
      '其他狼人全死后你获得刀人能力'
    ]
  },
  // 恶灵骑士
  ghostknight: {
    name: '恶灵骑士',
    description: '拥有一次性反伤技能，被查验则预言家出局，被毒则女巫出局',
    team: 'evil',
    color: '#7c2d12',
    bgColor: 'linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #9a3412 100%)',
    borderColor: '#fdba74',
    icon: '👻⚔️',
    ability: '被查验/毒时反伤',
    nightAction: 'werewolf',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 拥有一次性反伤技能！',
      '被预言家查验则预言家次日出局',
      '被女巫毒杀则女巫次日出局',
      '⚠️ 被同验同毒，先发动技能者死亡！'
    ]
  },
  // 血月使徒
  bloodmoon: {
    name: '血月使徒',
    description: '自爆后当晚所有好人技能被封印，最后狼人被放逐可多活一天',
    team: 'evil',
    color: '#9f1239',
    bgColor: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)',
    borderColor: '#fda4af',
    icon: '🌑',
    ability: '自爆封印好人技能',
    nightAction: 'werewolf',
    specialAction: 'selfExplode',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 白天可以自爆！',
      '自爆后当晚所有好人技能被封印',
      '⚠️ 作为最后一个被放逐的狼人，可多活一天！',
      '最后一个狼人自爆则直接结束'
    ]
  },
  // 噩梦之影
  nightmare: {
    name: '噩梦之影',
    description: '每晚可以恐惧一名玩家，使其当晚无法发动技能',
    team: 'evil',
    color: '#312e81',
    bgColor: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    borderColor: '#a5b4fc',
    icon: '👹',
    ability: '每晚恐惧一人封印技能',
    nightAction: 'nightmare',
    tips: [
      '你是狼人阵营，但与其他狼人不见面',
      '⚠️ 每晚可以恐惧一名玩家！',
      '被恐惧的玩家当晚无法发动技能',
      '从第二晚开始可以恐惧狼队友使其多一刀',
      '可以恐惧自己免疫伤害'
    ]
  },
  // 狼巫
  wolfwitch: {
    name: '狼巫',
    description: '每晚查验玩家具体身份，从第二夜起验到纯白之女则纯白出局',
    team: 'evil',
    color: '#701a75',
    bgColor: 'linear-gradient(135deg, #4a044e 0%, #701a75 50%, #86198f 100%)',
    borderColor: '#e879f9',
    icon: '🐺🔮',
    ability: '查验身份，验到纯白则纯白出局',
    nightAction: 'wolfwitch',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 每晚可以查验玩家具体身份！',
      '从第二夜起，验到纯白之女则纯白出局',
      '可以重复查验同一个目标',
      '验人时机在狼队袭击之后'
    ]
  },
  // 赤月使徒
  redmoon: {
    name: '赤月使徒',
    description: '自爆后当晚所有好人技能被封印',
    team: 'evil',
    color: '#b91c1c',
    bgColor: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 50%, #991b1b 100%)',
    borderColor: '#fca5a5',
    icon: '🌙',
    ability: '自爆封印好人技能',
    nightAction: 'werewolf',
    specialAction: 'selfExplode',
    tips: [
      '你是狼人阵营，夜晚与狼队友一起行动',
      '⚠️ 白天可以自爆！',
      '自爆后当晚所有好人技能被封印',
      '自爆后会翻牌亮明身份',
      '常用于关键时刻封印神职技能'
    ]
  },
  // 丘比特
  cupid: {
    name: '丘比特',
    description: '第一夜选择两名玩家成为情侣，情侣同生共死',
    team: 'neutral',
    color: '#ec4899',
    bgColor: 'linear-gradient(135deg, #831843 0%, #ec4899 50%, #be185d 100%)',
    borderColor: '#fbcfe8',
    icon: '🏹💕',
    ability: '连接两名玩家成为情侣',
    nightAction: 'cupid',
    tips: [
      '第一夜请睁眼，选择两名玩家成为情侣',
      '情侣会互相知道对方身份',
      '⚠️ 一方死亡另一方立即殉情！',
      '如果情侣分属不同阵营，则成为第三方阵营',
      '第三方阵营需要淘汰所有其他玩家才能获胜'
    ]
  },
  // 暗恋者
  admirer: {
    name: '暗恋者',
    description: '第一夜选择一名玩家暗恋，获胜条件与暗恋对象相同',
    team: 'neutral',
    color: '#f472b6',
    bgColor: 'linear-gradient(135deg, #9d174d 0%, #f472b6 50%, #db2777 100%)',
    borderColor: '#f9a8d4',
    icon: '💘',
    ability: '暗恋一名玩家，阵营跟随暗恋对象',
    nightAction: 'admirer',
    tips: [
      '第一夜请睁眼，选择一名玩家作为暗恋对象',
      '⚠️ 你不知道暗恋对象的身份！',
      '暗恋对象也不知道被你暗恋',
      '你的获胜条件与暗恋对象相同',
      '被查验结果始终为好人'
    ]
  },
  // 盗贼
  thief: {
    name: '盗贼',
    description: '第一夜在两张身份牌中选择一张作为自己的身份',
    team: 'neutral',
    color: '#8b5cf6',
    bgColor: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 50%, #7c3aed 100%)',
    borderColor: '#c4b5fd',
    icon: '🎭',
    ability: '首夜选择一张身份牌作为自己的身份',
    nightAction: 'thief',
    tips: [
      '第一夜请睁眼，法官会展示两张身份牌',
      '选择其中一张作为你的身份',
      '另一张身份牌将被弃置',
      '你的阵营和技能将变为所选身份'
    ]
  },
  // 炸弹人
  bomber: {
    name: '炸弹人',
    description: '被投票出局时，带走所有投他的玩家',
    team: 'neutral',
    color: '#f59e0b',
    bgColor: 'linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #d97706 100%)',
    borderColor: '#fcd34d',
    icon: '💣',
    ability: '被投票出局时带走所有投他的人',
    tips: [
      '你的目标是让自己被投票出局',
      '被投票出局时，所有投你的玩家都会死亡',
      '如果被狼人击杀或毒死，技能不会触发',
      '尽量表现得像狼人，诱导好人投你'
    ]
  },
  moderator: { 
    name: '法官', 
    description: '主持游戏进程', 
    team: 'neutral',
    color: '#6b7280',
    bgColor: 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #4b5563 100%)',
    borderColor: '#d1d5db',
    icon: '⚖️',
    ability: '主持游戏',
    tips: [
      '按照流程主持游戏',
      '确保每个环节顺利进行',
      '记录夜晚行动和白天投票',
      '注意女巫解药/毒药只能用一次',
      '注意守卫不能连续守护同一人',
      '注意白狼王自爆、狼枪开枪等特殊技能'
    ]
  },
};

// 根据人数和胜负模式生成推荐板子
export function generateRecommendedBoard(
  playerCount: number, 
  winMode: 'city' | 'side' = 'side'
): RoleConfig[] {
  // 确保玩家数在合理范围内
  const count = Math.max(6, Math.min(20, playerCount));
  
  // 查找匹配的板子配置
  const config = BOARD_CONFIGS.find(c => c.playerCount === count && c.winMode === winMode);
  
  if (config) {
    return config.roles;
  }
  
  // 如果没有精确匹配，找最接近的人数配置
  const closestConfig = BOARD_CONFIGS
    .filter(c => c.winMode === winMode)
    .sort((a, b) => Math.abs(a.playerCount - count) - Math.abs(b.playerCount - count))[0];
  
  return closestConfig?.roles || BOARD_CONFIGS[0].roles;
}

// 获取指定人数的所有可选板子
export function getBoardOptions(playerCount: number): BoardConfig[] {
  const count = Math.max(6, Math.min(20, playerCount));
  return BOARD_CONFIGS.filter(c => c.playerCount === count);
}

// 获取角色名称
export function getRoleName(roleType: RoleType): string {
  return ROLES[roleType]?.name || roleType;
}

// 获取角色描述
export function getRoleDescription(roleType: RoleType): string {
  return ROLES[roleType]?.description || '';
}

// 获取角色阵营
export function getRoleTeam(roleType: RoleType): 'good' | 'evil' | 'neutral' {
  return ROLES[roleType]?.team || 'neutral';
}

// 获取角色提示
export function getRoleTips(roleType: RoleType): string[] {
  return ROLES[roleType]?.tips || [];
}

// 获取角色颜色
export function getRoleColor(roleType: RoleType): string {
  const team = getRoleTeam(roleType);
  switch (team) {
    case 'good':
      return 'text-blue-400';
    case 'evil':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

// 获取角色背景色
export function getRoleBgColor(roleType: RoleType): string {
  const team = getRoleTeam(roleType);
  switch (team) {
    case 'good':
      return 'bg-blue-100 border-blue-300';
    case 'evil':
      return 'bg-red-100 border-red-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
}

// 生成角色列表（用于发牌）
export function generateRoleList(roles: RoleConfig[]): RoleType[] {
  const list: RoleType[] = [];
  roles.forEach(role => {
    for (let i = 0; i < role.count; i++) {
      list.push(role.type);
    }
  });
  return list;
}

// 洗牌算法（Fisher-Yates）
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 发牌
export function dealCards(roles: RoleConfig[]): RoleType[] {
  const roleList = generateRoleList(roles);
  return shuffleArray(roleList);
}

// 夜晚流程（按顺序）
export const NIGHT_FLOW = [
  { role: 'guard', title: '守卫睁眼', description: '守卫请睁眼，今晚你要守护谁？' },
  { role: 'werewolf', title: '狼人睁眼', description: '狼人请睁眼，今晚你们要杀谁？' },
  { role: 'witch', title: '女巫睁眼', description: '女巫请睁眼，今晚TA死了，是否使用解药？是否使用毒药？' },
  { role: 'seer', title: '预言家睁眼', description: '预言家请睁眼，今晚你要查验谁的身份？' },
];

// 法官完整流程
export const MODERATOR_FLOW: ModeratorTip[] = [
  { 
    phase: 'night', 
    title: '天黑请闭眼', 
    content: '所有玩家请闭眼',
    subSteps: ['确认所有玩家已闭眼']
  },
  { 
    phase: 'night', 
    title: '守卫睁眼', 
    content: '守卫请睁眼，选择要守护的玩家',
    subSteps: ['守卫选择目标', '记录守护目标', '守卫请闭眼']
  },
  { 
    phase: 'night', 
    title: '狼人睁眼', 
    content: '狼人请睁眼，选择要击杀的目标',
    subSteps: ['狼人商量统一目标', '确认击杀目标', '狼人请闭眼']
  },
  { 
    phase: 'night', 
    title: '女巫睁眼', 
    content: '女巫请睁眼，今晚的死者是XX，是否使用解药？是否使用毒药？',
    subSteps: ['告知死者', '询问解药', '询问毒药', '记录女巫操作', '女巫请闭眼']
  },
  { 
    phase: 'night', 
    title: '预言家睁眼', 
    content: '预言家请睁眼，选择要查验的玩家',
    subSteps: ['预言家选择目标', '手势告知查验结果', '记录查验结果', '预言家请闭眼']
  },
  { 
    phase: 'day', 
    title: '天亮了', 
    content: '所有玩家请睁眼',
    subSteps: ['宣布昨晚情况', '处理死亡玩家', '死者发表遗言']
  },
  { 
    phase: 'day', 
    title: '警长竞选', 
    content: '想要竞选警长的玩家请举手',
    subSteps: ['确认竞选者', '竞选者发言', '投票选警长', '颁发警徽']
  },
  { 
    phase: 'day', 
    title: '发言环节', 
    content: '从警长左手边/右手边开始依次发言',
    subSteps: ['确定发言顺序', '玩家依次发言', '警长最后发言并归票']
  },
  { 
    phase: 'day', 
    title: '投票环节', 
    content: '所有玩家请投票',
    subSteps: ['宣布投票开始', '玩家依次投票', '统计票数', '宣布出局玩家']
  },
];

// 获取板子名称
export function getBoardName(boardId: string): string {
  const board = BOARD_CONFIGS.find(b => b.id === boardId);
  return board?.name || '自定义';
}

// 保存游戏记录
export function saveGameRecord(record: any) {
  const records = JSON.parse(localStorage.getItem('werewolf_history') || '[]');
  records.unshift(record);
  localStorage.setItem('werewolf_history', JSON.stringify(records.slice(0, 50)));
}

// 获取游戏记录
export function getGameRecords(): any[] {
  return JSON.parse(localStorage.getItem('werewolf_history') || '[]');
}

// 清除游戏记录
export function clearGameRecords() {
  localStorage.removeItem('werewolf_history');
}

// 判断是否有某角色
export function hasRole(roles: RoleConfig[], roleType: RoleType): boolean {
  return roles.some(r => r.type === roleType && r.count > 0);
}

// 获取角色数量
export function getRoleCount(roles: RoleConfig[], roleType: RoleType): number {
  return roles.find(r => r.type === roleType)?.count || 0;
}

// 角色分类（用于屠边判断和UI展示）
export const ROLE_CATEGORIES: Record<RoleType, 'god' | 'villager' | 'werewolf' | 'special'> = {
  // 好人阵营 - 神职
  seer: 'god',
  witch: 'god',
  hunter: 'god',
  idiot: 'god',
  guard: 'god',
  elder: 'god',
  knight: 'god',
  gravedigger: 'god',
  crow: 'god',
  magician: 'god',
  dreamer: 'god',
  demonhunter: 'god',
  muter: 'god',
  miracle: 'god',
  pure: 'god',
  prince: 'god',
  count: 'god',
  alchemist: 'god',
  // 好人阵营 - 平民
  villager: 'villager',
  hooligan: 'villager',
  // 狼人阵营
  werewolf: 'werewolf',
  whitewolf: 'werewolf',
  wolfgun: 'werewolf',
  wolfbeauty: 'werewolf',
  gargoyle: 'werewolf',
  hiddenwolf: 'werewolf',
  ghostknight: 'werewolf',
  bloodmoon: 'werewolf',
  nightmare: 'werewolf',
  wolfwitch: 'werewolf',
  redmoon: 'werewolf',
  // 第三方阵营（独立阵营）
  cupid: 'special',
  admirer: 'special',
  thief: 'special',
  bomber: 'special',
  // 法官
  moderator: 'god',
};

// 统计阵营数量
export function getTeamCount(roles: RoleConfig[]): { good: number; evil: number; gods: number; villagers: number } {
  let good = 0, evil = 0, gods = 0, villagers = 0;
  
  roles.forEach(role => {
    const category = ROLE_CATEGORIES[role.type];
    if (category === 'werewolf') {
      evil += role.count;
    } else if (category === 'god') {
      gods += role.count;
      good += role.count;
    } else if (category === 'villager') {
      villagers += role.count;
      good += role.count;
    }
  });
  
  return { good, evil, gods, villagers };
}

// 预设板子配置（主流配置）
export const BOARD_CONFIGS: BoardConfig[] = [
  {
    id: '6-city',
    name: '6人屠城',
    playerCount: 6,
    enableSheriff: false,
    winMode: 'city',
    description: '预言家+女巫+2民+2狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'villager', name: '平民', count: 2 },
      { type: 'werewolf', name: '狼人', count: 2 },
    ],
  },
  {
    id: '7-city',
    name: '7人屠城',
    playerCount: 7,
    enableSheriff: false,
    winMode: 'city',
    description: '预言家+女巫+3民+2狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'villager', name: '平民', count: 3 },
      { type: 'werewolf', name: '狼人', count: 2 },
    ],
  },
  {
    id: '8-city',
    name: '8人屠城',
    playerCount: 8,
    enableSheriff: true,
    winMode: 'city',
    description: '预言家+女巫+猎人+2民+3狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'villager', name: '平民', count: 2 },
      { type: 'werewolf', name: '狼人', count: 3 },
    ],
  },
  // 6-8人屠边模式
  {
    id: '6-side',
    name: '6人屠边',
    playerCount: 6,
    enableSheriff: false,
    winMode: 'side',
    description: '预言家+女巫+2民+2狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'villager', name: '平民', count: 2 },
      { type: 'werewolf', name: '狼人', count: 2 },
    ],
  },
  {
    id: '7-side',
    name: '7人屠边',
    playerCount: 7,
    enableSheriff: false,
    winMode: 'side',
    description: '预言家+女巫+3民+2狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'villager', name: '平民', count: 3 },
      { type: 'werewolf', name: '狼人', count: 2 },
    ],
  },
  {
    id: '8-side',
    name: '8人屠边',
    playerCount: 8,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+2民+3狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'villager', name: '平民', count: 2 },
      { type: 'werewolf', name: '狼人', count: 3 },
    ],
  },
  {
    id: '9-side',
    name: '9人预女猎',
    playerCount: 9,
    enableSheriff: false,
    winMode: 'side',
    description: '预言家+女巫+猎人+3民+3狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'villager', name: '平民', count: 3 },
      { type: 'werewolf', name: '狼人', count: 3 },
    ],
  },
  {
    id: '10-side',
    name: '10人预女猎',
    playerCount: 10,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+4民+3狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'villager', name: '平民', count: 4 },
      { type: 'werewolf', name: '狼人', count: 3 },
    ],
  },
  {
    id: '11-side',
    name: '11人预女猎白',
    playerCount: 11,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+白痴+3民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'villager', name: '平民', count: 3 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '12-pre-women-hunter-idiot',
    name: '12人预女猎白',
    playerCount: 12,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+白痴+4民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'villager', name: '平民', count: 4 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '12-pre-women-hunter-guard',
    name: '12人预女猎守',
    playerCount: 12,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+4民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'villager', name: '平民', count: 4 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '13-side',
    name: '13人预女猎守',
    playerCount: 13,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+4民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'villager', name: '平民', count: 4 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '14-side',
    name: '14人预女猎守白',
    playerCount: 14,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+4民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'villager', name: '平民', count: 4 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '15-side',
    name: '15人预女猎守白',
    playerCount: 15,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+5民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'villager', name: '平民', count: 5 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '16-side',
    name: '16人预女猎守白长',
    playerCount: 16,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+长老+4民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'elder', name: '长老', count: 1 },
      { type: 'villager', name: '平民', count: 4 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '17-side',
    name: '17人预女猎守白长',
    playerCount: 17,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+长老+5民+4狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'elder', name: '长老', count: 1 },
      { type: 'villager', name: '平民', count: 5 },
      { type: 'werewolf', name: '狼人', count: 4 },
    ],
  },
  {
    id: '18-side',
    name: '18人预女猎守白长',
    playerCount: 18,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+长老+5民+5狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'elder', name: '长老', count: 1 },
      { type: 'villager', name: '平民', count: 5 },
      { type: 'werewolf', name: '狼人', count: 5 },
    ],
  },
  {
    id: '19-side',
    name: '19人预女猎守白长',
    playerCount: 19,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+长老+6民+5狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'elder', name: '长老', count: 1 },
      { type: 'villager', name: '平民', count: 6 },
      { type: 'werewolf', name: '狼人', count: 5 },
    ],
  },
  {
    id: '20-side',
    name: '20人预女猎守白长',
    playerCount: 20,
    enableSheriff: true,
    winMode: 'side',
    description: '预言家+女巫+猎人+守卫+白痴+长老+6民+6狼',
    roles: [
      { type: 'seer', name: '预言家', count: 1 },
      { type: 'witch', name: '女巫', count: 1 },
      { type: 'hunter', name: '猎人', count: 1 },
      { type: 'guard', name: '守卫', count: 1 },
      { type: 'idiot', name: '白痴', count: 1 },
      { type: 'elder', name: '长老', count: 1 },
      { type: 'villager', name: '平民', count: 6 },
      { type: 'werewolf', name: '狼人', count: 6 },
    ],
  },
];

// 获取板子描述
export function getBoardDescription(roles: RoleConfig[]): string {
  const gods = roles.filter(r => ROLE_CATEGORIES[r.type] === 'god' && r.type !== 'moderator');
  const villagers = roles.find(r => r.type === 'villager')?.count || 0;
  const werewolves = roles.find(r => r.type === 'werewolf')?.count || 0;
  
  const godNames = gods.map(g => g.name).join('');
  return `${godNames}${villagers}民${werewolves}狼`;
}

// 判断游戏是否结束
export function checkGameEnd(
  alivePlayers: Player[], 
  winMode: 'city' | 'side'
): { ended: boolean; winner?: 'good' | 'evil'; reason?: string } {
  // 统计存活玩家阵营
  let aliveGods = 0, aliveVillagers = 0, aliveWerewolves = 0;
  
  alivePlayers.forEach(player => {
    if (!player.is_alive || !player.role) return;
    
    const role = player.role as RoleType;
    const category = ROLE_CATEGORIES[role];
    if (category === 'werewolf') {
      aliveWerewolves++;
    } else if (category === 'god') {
      aliveGods++;
    } else if (category === 'villager') {
      aliveVillagers++;
    }
  });
  
  const aliveGood = aliveGods + aliveVillagers;
  
  // 狼人全部死亡 - 好人胜利
  if (aliveWerewolves === 0) {
    return { ended: true, winner: 'good', reason: '所有狼人已死亡' };
  }
  
  // 好人全部死亡 - 狼人胜利
  if (aliveGood === 0) {
    return { ended: true, winner: 'evil', reason: '所有好人已死亡' };
  }
  
  // 屠边模式：神职或平民全部死亡则狼人胜利
  if (winMode === 'side') {
    if (aliveGods === 0) {
      return { ended: true, winner: 'evil', reason: '所有神职已死亡（屠边）' };
    }
    if (aliveVillagers === 0) {
      return { ended: true, winner: 'evil', reason: '所有平民已死亡（屠边）' };
    }
  }
  
  // 屠城模式：所有好人死亡则狼人胜利
  if (winMode === 'city' && aliveGood === 0) {
    return { ended: true, winner: 'evil', reason: '所有好人已死亡（屠城）' };
  }
  
  return { ended: false };
}

// 判断是否应该默认开启警长
export function shouldEnableSheriffDefault(playerCount: number): boolean {
  return playerCount >= 8;
}
