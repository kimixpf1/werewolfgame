# 项目迭代记录

## 2026-04-02

### 本次目标

- 将狼人杀发牌助手从临时匿名联机层迁回正式 Supabase。
- 按版本 1 方案补齐 RLS、房主/玩家 token 和恢复原座位逻辑。
- 保持原功能与界面一致，并继续兼顾手机端微信体验。

### 当前状态

- 已确认项目为 Vite + React + TypeScript + Tailwind。
- 已确认核心能力包括创建房间、加入房间、联机同步、发牌、法官记录、电子法官、角色说明与历史记录。
- 已读取参考规则并在当前项目建立长期规则文件。
- 已定位原网页 `failed to fetch` 的核心风险为原 Supabase 域名不可解析，并已改造为新的匿名远程联机后端方案。
- 已补充 GitHub Pages 自动部署工作流与移动端安全区适配。
- 已收到新的 Supabase 项目地址、anon key 以及原始 `rooms`、`players` 表结构说明。
- 已确定当前版本走“版本 1：轻量安全版”，重点修复误退出后回房不新增占位。
- 已完成 Supabase 前端接入改造，新增房主/玩家 token、会话恢复、昵称认领原座位与离线状态心跳逻辑。
- 已生成 `supabase/schema.sql`，用于在 Supabase 中一次性创建表结构、RLS、RPC 和 Realtime 配置。
- 已通过 `npx tsc -b`、`npx vite build` 与 `npx eslint@9 .` 的本地检查。
- 已确认 SQL 执行后表结构生效，但 PostgREST 函数缓存尚未刷新，因此在脚本末尾补充了 `notify pgrst, 'reload schema';`。
- 已确认 RPC 缓存刷新后开始可调用，但 `app_generate_token()` 依赖的 `gen_random_bytes()` 在当前库中不可用，已改成纯 SQL 生成 token。
- 已确认 `app_token_hash()` 依赖的 `digest()` 在当前库中也不可用，已改成直接使用 `md5()`。
- 已用真实 Supabase 和双页面隔离上下文跑通建房、加入、房主补位、发牌、夜晚记录、误退出恢复原座位与结算弹窗同步。
- 已重新安装依赖并通过最新一轮 `npm run build`、`npm run lint` 检查。

### 下一步

- 提交当前代码并推送到 GitHub 仓库。
- 等待 GitHub Pages 工作流完成并确认可访问地址。
