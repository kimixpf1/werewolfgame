# Todolist

## 本次目标

- 将临时匿名联机层切回正式 Supabase。
- 补齐版本 1 的房主/玩家 token、RLS 与房间恢复方案。
- 修复玩家误退出后无法回原位置、重复占位的问题。
- 完成构建、检查、模拟验证并准备推送部署。

## 当前状态

- 压缩包已恢复出 `app/` 项目目录。
- 已补齐 Pages 工作流、仓库忽略规则与规则文件。
- 已完成移动端 `dvh` 与底部安全区适配。
- 已拿到新的 Supabase 项目 URL、anon key 和原有表结构信息。
- 已完成 Supabase 客户端接入、会话恢复逻辑和误退出后原位置恢复方案的前端改造。
- 已生成 `supabase/schema.sql`，包含建表、索引、触发器、RLS、RPC 与 Realtime 初始化脚本。
- 已完成 `npx tsc -b`、`npx vite build` 与 `npx eslint@9 .` 验证。
- 已确认 Supabase 表已创建，但 PostgREST 还未刷新函数缓存，已在 SQL 脚本末尾补上 `notify pgrst, 'reload schema';`。
- 已确认 RPC 已进入缓存，但 `app_generate_token()` 依赖的 `gen_random_bytes()` 在当前库中不可用，已改为纯 SQL 生成 token。
- 已确认 `app_token_hash()` 依赖的 `digest()` 在当前库中也不可用，已改为直接使用 `md5()`。
- 已在真实 Supabase 上跑通建房、加入、房主补位、发牌、夜晚记录、误退出后回原座位、结算结果同步。
- 已重新安装依赖并完成最新一轮 `npm run build`、`npm run lint` 验证。
- 已定位 GitHub Actions 发布失败根因为仓库 Pages 站点未启用，正在切换为构建后直接发布 `gh-pages` 分支的方案。
- 已确认正式线上地址可访问，但当前 `gh-pages` 上的生产包过大，正在通过关闭生产调试插件并拆分静态图片资源来修复线上首屏挂载卡顿。
- 已完成管理员后台第一版前端实现：首页新增建议信箱入口，新增管理员登录页、基础统计看板与建议信箱处理页。
- 已补充管理员后台增量 SQL 文件 `supabase/admin_dashboard.sql`，包含管理员表、设备统计、建议信箱、后台 RPC 与权限配置。

## 待办事项

- 推送新的 `gh-pages` 发布工作流并等待仓库生成静态分支。
- 如仓库尚未开启 Pages，则在仓库设置中将 Pages 来源切到 `gh-pages` 分支。
- 等待新的生产包重新部署到 `gh-pages`。
- 在正式线上地址使用多玩家隔离会话继续做全链路联机验收。
- 在 Supabase SQL Editor 执行 `supabase/admin_dashboard.sql`，并把管理员邮箱替换成你的真实登录邮箱。
- 执行完 SQL 后验证管理员登录、统计数据与建议信箱流转。
