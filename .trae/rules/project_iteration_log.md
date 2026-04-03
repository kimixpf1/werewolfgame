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
- 已定位 GitHub Pages 工作流失败原因为仓库尚未启用 Pages 站点，当前改为通过 Actions 构建后直接发布 `gh-pages` 分支。
- 已确认正式线上地址可访问，但当前 `gh-pages` 生产包体积异常偏大，正在通过关闭生产调试插件和拆分静态图片资源修复线上空白挂载问题。
- 已完成管理员后台第一版实现，包含首页建议信箱入口、管理员登录、基础数据统计和建议信箱处理页。
- 已新增 `supabase/admin_dashboard.sql` 增量脚本，覆盖管理员账号映射、设备统计埋点、建议提交和后台查询 RPC。

### 下一步

- 推送新的 `gh-pages` 发布工作流并等待静态分支生成。
- 如仓库仍未对外发布，则在仓库设置中将 Pages 来源切到 `gh-pages` 分支。
- 等待新的生产包重新部署到 `gh-pages`。
- 在正式线上地址继续做多玩家全链路联机验收。
- 在 Supabase SQL Editor 执行 `supabase/admin_dashboard.sql`，并填入真实管理员邮箱。
- 执行完 SQL 后验证管理员后台登录、统计数据与建议流转。
