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

## 待办事项

- 提交代码并推送到 GitHub 仓库。
- 等待 GitHub Pages 工作流完成并确认正式访问地址。
