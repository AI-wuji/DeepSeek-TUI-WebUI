# ☯️ 无极 DeepSeek-TUI -WebUI v1.1

**一句話**：DeepSeek TUI 桌面可视化对话平台，支持 Chat/Reasoner 双模型、一键更新 TUI、暗夜主题、第三方 API。

---

## 🎯 这是什么？

☯️ **无极 DeepSeek-TUI -WebUI** 是一个基于爱马仕 WebUI 风格的 DeepSeek TUI 桌面可视化界面。解决了 DeepSeek TUI 原生命令行不便的问题，提供完整的 Web 对话体验。

### 核心特性

| 特性 | 说明 |
|------|------|
| ☯️ | 太极品牌视觉 |
| ⚡ | Chat / Reasoner 双模型切换 |
| 🔄 | **一键更新 DeepSeek TUI**（设置 → 系统维护） |
| 🌓 | 暗夜 / 浅色双主题 |
| 💬 | 对话历史管理 + 搜索 |
| 📝 | Markdown 渲染 + 代码高亮 + 复制 |
| ⚙️ | 可视化参数调节（温度 / Top P / Token） |
| 🔑 | 第三方 API 兼容（OpenRouter / 硅基流动等） |
| 📥 | 对话导出 / 导入 |
| 🎯 | 版本号实时显示，更新前后对比 |

---

## 🏛️ 架构

```
用户
  ↓
Express Server (端口 :18080)
  ├─ 静态资源 (dist/)
  ├─ SSE 流式代理
  ├─ 会话持久化
  └─ 一键更新 TUI API
  ↓
Vue 3 SPA (Pinia + Vue Router + Naive UI)
  ├─ ChatView / SessionSidebar / MessageList
  ├─ ChatInput / MessageItem / SettingsModal
  └─ 系统维护面板（版本号 + 一键更新）
  ↓
DeepSeek API / 第三方兼容 API
```

---

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/AI-wuji/DeepSeek-TUI-WebUI.git
cd DeepSeek-TUI-WebUI
npm install
```

### 启动

```bash
npm run build
npm start
```

浏览器打开 → `http://127.0.0.1:18080`

### 一键更新 DeepSeek TUI

打开设置（⚙️）→ 划到"系统维护" → 查看当前/最新版本 → 点击"升级"

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API) + Vite 6 |
| UI | Naive UI 2.40 |
| 状态 | Pinia 2 |
| 路由 | Vue Router 4 |
| 图标 | ionicons5 (vicons) |
| 后端 | Express 4 |
| API | DeepSeek Chat Completions (SSE) |

---

## 📊 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| **v1.1** | 2026-05-13 | 一键更新 DeepSeek TUI、太极 Logo、版本号显示、E 盘自动备份 |
| v1.0 | 2026-05-13 | 初始版本 |

---

## 💝 支持作者

如果这个项目对你有帮助，欢迎赞助支持！

<div align="center">

<img src="./赞赏码.jpg" width="250" alt="赞赏码">

**微信赞赏码**

</div>

---

**☯️ 无极出品，精于思考。**

**License**：MIT