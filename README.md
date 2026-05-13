# ☯️ 无极-DeepSeek-WebUI / Wuji DeepSeek WebUI v1.0

**一句话 / One Sentence**：
DeepSeek 大模型对话平台，支持 V4 Pro/Flash 双模型切换 & 第三方 API / DeepSeek LLM chat platform with V4 Pro/Flash dual-model switching & 3rd-party API support

**适配架构 / Architecture**：
DeepSeek API (V4 Pro / V4 Flash) + Express 代理后端 / Express proxy backend

---

## 🎯 这是什么？ / What is this?

☯️ **无极-DeepSeek-WebUI** 是一个极致优雅的 DeepSeek 大模型对话 Web 平台。
支持 V4 Pro / V4 Flash 双模型一键切换，内置第三方兼容 API 配置，开箱即用。

### 核心特性 / Key Features

| 特性 Feature | 中文 | English |
|-------------|------|---------|
| 🎨 | 优雅界面设计 | Elegant UI Design |
| ⚡ | V4 Pro / V4 Flash 双模型 | Dual Model Switching |
| 🔑 | 第三方 API 支持 | 3rd-Party API Ready |
| 🌓 | 暗夜/浅色双主题 | Dark / Light Themes |
| 💬 | 对话历史管理 | Session Management |
| 📝 | Markdown 渲染 + 代码高亮 | Markdown + Code Highlighting |
| ⚙️ | 可视化参数调节 | Visual Parameter Tuning |
| 🔒 | API Key 本地配置 | Local API Key Config |

---

## 🏛️ 核心架构 / Core Architecture

```
用户 User
    ↓
🌐 Express Server (端口 / Port :18080)
    ├─ 静态资源 / Static Assets (dist/)
    ├─ SSE 流式代理 / Streaming Proxy
    └─ 会话持久化 / Session Persistence
    ↓
☯️ Vue 3 SPA (Pinia + Vue Router)
    ├─ ChatView（对话视图）
    ├─ SessionSidebar（会话侧边栏）
    ├─ ChatInput（输入区域）
    ├─ MessageItem（消息气泡）
    ├─ MessageList（消息列表）
    └─ SettingsModal（设置弹窗）
    ↓
🔗 DeepSeek API / Third-Party API
    ├─ deepseek-v4-pro（性能优先 / Performance）
    └─ deepseek-v4-flash（速度优先 / Speed）
```

---

## 🚀 快速开始 / Quick Start

### 安装 / Installation

```bash
git clone https://github.com/AI-wuji/wuji-deepseek-webui.git
cd wuji-deepseek-webui
npm install
```

### 使用 / Usage

```bash
# 构建并启动 / Build & Start
npm run build
npm start

# 或开发模式 / Dev Mode
npm run dev
npm run server
```

浏览器打开 / Open browser → `http://127.0.0.1:18080`

### 配置 API / API Configuration

在设置弹窗（右上角齿轮）中填入 / Fill in the Settings modal (gear icon, top right)：

| 字段 Field | 说明 Description |
|-----------|-----------------|
| API Key | 你的 DeepSeek / 第三方 API 密钥 |
| API 地址 / URL | 默认 `https://api.deepseek.com`，支持 OpenRouter、硅基流动等 |

> 未配置时自动读取 `~/.deepseek/config.toml` 或环境变量 / Falls back to `~/.deepseek/config.toml` or env vars

---

## 📁 文件结构 / File Structure

```
wuji-deepseek-webui/
├── public/                  # 静态资源
├── src/
│   ├── api/                 # API 请求层
│   ├── assets/              # 样式资源
│   ├── components/          # Vue 组件
│   │   ├── ChatInput.vue    # 输入框
│   │   ├── MessageItem.vue  # 消息气泡
│   │   ├── MessageList.vue  # 消息列表
│   │   ├── SessionSidebar.vue # 会话侧边栏
│   │   └── SettingsModal.vue # 设置弹窗
│   ├── lib/                 # 工具库（Markdown 渲染）
│   ├── stores/              # Pinia 状态管理
│   ├── views/               # 页面视图
│   │   └── ChatView.vue     # 主对话页面
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── server.js                # Express 代理后端
├── 启动DeepSeek.bat          # Windows 一键启动
├── package.json
└── README.md
```

---

## 🛠️ 技术栈 / Tech Stack

| 层级 Layer | 技术 Technology |
|-----------|---------------|
| 🖥️ 前端 / Frontend | Vue 3 (Composition API) + Vite 6 |
| 🎨 UI 组件库 / UI Lib | Naive UI 2.40 |
| 📦 状态管理 / State | Pinia 2 |
| 🗺️ 路由 / Router | Vue Router 4 |
| 📝 Markdown | markdown-it + highlight.js |
| 🎭 图标 / Icons | ionicons5 (vicons) |
| ⚙️ 后端 / Backend | Express 4 + CORS |
| 🔌 API | DeepSeek Chat Completions (SSE) |

---

## 📊 版本历史 / Version History

| Version | Date | Major Update |
|---------|------|-------------|
| **v1.0** | 2026-05-13 | V4 Pro/Flash 双模型，第三方 API，暗夜模式，393K Token 支持 |

---

## 💝 支持作者 / Support the Author

| 中文 | English |
|------|---------|
| 如果这个项目对你有帮助，欢迎赞助支持！ | If this project helps you, feel free to support! |

<div align="center">

<img src="./赞赏码.jpg" width="250" alt="赞赏码 Donation QR">

**微信赞赏码 / WeChat Donation QR Code**

感谢支持！Thank you for your support!

</div>

---

**☯️ 无极出品，精于思考。开始对话吧！**
**☯️ Wuji presents, crafted for thinking. Start a conversation!**

**License**：MIT
