# 项目框架

## 当前结构

- `app/`：Vite + React + TypeScript 主项目目录。
- `app/src/main.tsx`：入口文件，渲染 `<App />` 到 `#root`。
- `app/src/App.tsx`（653行）：中央编排器，hash 路由、全部状态管理、事件处理。
  - Hash 路由：`#home`、`#create`、`#join`、`#room`、`#history`、`#roles`、`#guide`、`#feedback`、`#admin-login`、`#admin/stats`、`#admin/feedback`、`#legal`。
  - View 类型联合驱动视图切换，不使用 React Router。
  - 核心状态：`currentView`、`currentRoom`、`localPlayer`、`gameConfig`、`pollingTimer`。
  - 轮询机制：`startPolling()` / `stopPolling()` 定时调用 `getRoomSnapshot()` 同步房间。
- `app/src/types/index.ts`（298行）：全部 TypeScript 类型定义，含 RoleType（32种角色）、Player、Room、GameConfig、ModeratorRound 等。
- `app/src/sections/`：主视图组件。
  - `HomeSection.tsx`（121行）：导航枢纽，含建议信箱、管理员后台、版权入口。
  - `CreateRoomSection.tsx`：建房页，ROLE_GROUPS 重构为动态生成（ROLE_GROUP_META + ROLE_GROUP_ORDER + getRoleGroupRoles），自动推荐摘要与折叠详情使用同一个 `getRecommendedBoardResult()` 返回值。
  - `JoinRoomSection.tsx`（98行）：加入房间表单。
  - `RoomSection.tsx`（1130行）：主游戏房间，含等待、发牌确认、角色展示、法官面板、电子法官集成。
  - `HistorySection.tsx`（138行）：本地历史记录列表。
  - `RolesSection.tsx`（101行）：角色百科，当前硬编码 32 种角色，缺少 `thief`/`bomber` 的 'special' 分类展示。
  - `GuideSection.tsx`（146行）：使用指南。
  - `FeedbackSection.tsx`（110行）：建议信箱提交表单。
  - `AdminLoginSection.tsx`（89行）：管理员登录，支持 `xpf`/`admin` 短账号别名映射到 `@office.local`。
  - `AdminStatsSection.tsx`（313行）：管理员统计页，recharts 图表（LineChart、PieChart、BarChart），统计口径基于完整反馈列表前端重算。
  - `AdminFeedbackSection.tsx`（404行）：建议信箱管理，支持已读/未读筛选、单条/批量已读、单条/批量删除，旧 RPC 环境自动降级。
  - `LegalSection.tsx`（84行）：版权与免责声明。
- `app/src/components/`：UI 组件。
  - `RoleCard.tsx`（320行）：3D CSS 翻牌动画，显示角色头像、名称、阵营、技能提示。
  - `ModeratorPanel.tsx`（1498行）：法官记录面板，夜晚行动表单（守卫/女巫/预言家等）、白天投票（特殊技能如白狼自爆/骑士决斗/狼枪开枪）、游戏结束判定。
  - `AutoJudge.tsx`（1459行）：电子法官，Web Speech API 语音播报，房主主持 + 玩家跟随同步，微信/移动端 AudioContext 解锁，完整的 dealing → night → day → gameEnd 流程。
  - `SheriffBadge.tsx`（170行）：警长徽章管理，颁发/转移/撕毁，警长特权说明。
- `app/src/hooks/use-mobile.ts`（19行）：移动端检测，`matchMedia('(max-width: 767px)')`。
- `app/src/lib/utils.ts`（6行）：`cn()` 工具函数（clsx + tailwind-merge）。
- `app/src/lib/gameConfig.ts`（1360行）：核心游戏配置。
  - `ROLES`：32 种角色完整定义（名称、描述、阵营、颜色渐变、emoji 图标、技能说明、提示）。
  - `ROLE_CATEGORIES`：每个 RoleType 映射到 `god | villager | werewolf | special`。
  - `BOARD_CONFIGS`：19 个预设板子（6-20人，含屠城/屠边），角色总数已验证全部正确。
  - `getRecommendedBoardResult()`：精确匹配 → 同人数回退 → 最近人数回退。
  - `getBoardDescription()`：从 roles 生成摘要（如"预言家女巫猎人守卫白痴5民4狼"）。
  - `getTeamCount()`：统计阵营数量（good/evil/gods/villagers）。
  - `checkGameEnd()`：判断游戏结束（狼全死=好人胜，屠边=神/民全死则狼胜）。
  - `dealCards()`：Fisher-Yates 洗牌算法发牌。
  - `NIGHT_FLOW`/`MODERATOR_FLOW`：夜晚流程和法官完整流程提示。
  - 游戏记录：localStorage 存储，最多 50 条。
- `app/src/lib/supabase.ts`（865行）：Supabase 客户端封装。
  - `invokeRpc<T>()`：通用 RPC 包装，带错误克隆。
  - 核心房间函数：createRoom、joinRoom、restorePlayerSession、touchPlayerSession、markPlayerDisconnected、getRoom、getRoomSnapshot、addPlayer、updateRoomStatus、updateGameResult、updateRoom。
  - 玩家操作：batchUpdatePlayerRoles、updatePlayerRole、updatePlayerAlive、updatePlayerName、removePlayer。
  - 数据标准化：normalizeRoom、normalizePlayer、normalizeSnapshot、normalizeFeedback、normalizeAdminProfile、normalizeDashboard。
  - 管理员：signInAdmin（含短账号别名）、signOutAdmin、getAdminProfile、getAdminDashboardSummary。
  - 建议信箱：submitFeedback、listFeedbackMessages（旧签名兼容回退）、updateFeedbackMessage、markFeedbackRead（旧 RPC 降级逐条更新）、deleteFeedbackMessage、batchDeleteFeedbackMessages（旧 RPC 降级逐条删除）。
  - 兼容机制：`isMissingRpcInSchemaCache()` 检测缺失函数，`explainAdminSqlMissing()` 生成友好提示。
- `app/public/`：角色头像、卡牌等静态资源。
- `supabase/schema.sql`：版本 1 正式联机方案的建表、触发器、RLS、RPC 与 Realtime 初始化脚本。
- `supabase/admin_dashboard.sql`：管理员后台增量 SQL，包含管理员映射、设备统计、建议信箱、已读/删除批处理与后台查询/更新 RPC。
- `.github/workflows/`：GitHub Pages 自动部署流程，构建后发布到 `gh-pages` 分支。
- `.trae/rules/`：长期规则、项目框架、待办、迭代记录。

## 技术栈

- 前端框架：Vite 7.3.0 + React 19 + TypeScript
- 样式：Tailwind CSS，深色渐变主色调
- UI 库：shadcn/ui 组件、lucide-react 图标、sonner toast 通知
- 图表：recharts（管理员统计页）
- 后端：Supabase（PostgreSQL + Auth + RPC + Realtime）
- 部署：GitHub Pages（gh-pages 分支，Actions 自动构建推送）
- 本地存储：localStorage（游戏记录、设备 ID、房间配置缓存）

## 数据流

- 建房：CreateRoomSection → getRecommendedBoardResult() → createRoom RPC → 房间创建
- 加入：JoinRoomSection → joinRoom RPC → 轮询 getRoomSnapshot 同步
- 发牌：RoomSection → dealCards() → batchUpdatePlayerRoles RPC → 翻牌展示
- 法官记录：ModeratorPanel → calculateNightResult/checkGameEnd → 更新玩家存活状态
- 电子法官：AutoJudge → 房间 game_state 同步 → Web Speech API 播报 → 玩家端跟随
- 管理员：signInAdmin → Auth 登录 → admin RPC 查询 → 统计/信箱管理

## 已知问题与待办

- 电子法官微信内语音播报已完成 Chrome 分段、超时保护、AudioContext 解锁等优化（ccb31e9），多端真人验收待用户执行。
