# Todolist

## 已完成（2026-04-06）

- ✅ 更新 `project_rules.md` 新增代码简洁高效和依赖管理规则。
- ✅ 重写 `project_framework.md` 全面反映当前项目状态。
- ✅ 修复 `RolesSection.tsx` 缺少 thief/bomber 第三方阵营显示。
- ✅ 重构 `CreateRoomSection.tsx` ROLE_GROUPS 为动态生成。
- ✅ 修复 14 人推荐板子摘要与折叠详情不一致问题。
- ✅ 构建验证通过，已提交并推送部署（27eaa41, 40a3e0b）。

## 遗留待办

- **[高优先]** 线上 Supabase 执行最新版 `admin_dashboard.sql`，补齐 `feedback_messages.is_read/read_at` 字段和删除/批量删除/批量已读 RPC。
- **[中优先]** 电子法官微信内语音播报稳定性优化。
- **[中优先]** 电子法官多端同步真人验收。
- **[低优先]** 首页视觉升级（等用户确认方向）。

## 长期目标

- 保持现有联机链路稳定：建房、加入、发牌、法官面板、电子法官、角色介绍、历史记录。
- 保持管理员后台功能完整：统计看板、建议信箱管理。
- 移动端微信内优先兼容。
