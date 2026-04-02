# 项目框架

## 当前结构

- `app/`：Vite + React + TypeScript 主项目目录。
- `app/src/sections/`：首页、创建房间、加入房间、房间内、历史记录、角色介绍、使用指南等主视图。
- `app/src/components/`：角色卡、法官记录面板、警长徽章、电子法官与 UI 组件。
- `app/src/lib/gameConfig.ts`：角色配置、推荐板子、法官流程、发牌和本地历史记录逻辑。
- `app/src/lib/supabase.ts`：当前已改造成基于匿名 HTTP 存储服务的房间、玩家、轮询同步与状态更新层。
- `app/public/`：角色头像、卡牌等静态资源。
- `.github/workflows/`：GitHub Pages 自动部署流程。
- `.trae/rules/`：长期规则、项目框架、待办、迭代记录。

## 现阶段判断

- 产品是一个偏移动端的狼人杀发牌与法官辅助网页。
- 原始压缩包依赖 Supabase，但原后端域名已失效；当前版本已切换为无需账号初始化的匿名远程存储方案，保证 GitHub Pages 上仍可跨设备联机。
- 页面主色调为深色渐变，交互以全屏单页切换为主，底部固定操作区较多。
- GitHub Pages 负责静态站点托管，前端通过远程 JSON 消息服务同步房间与玩家状态。
