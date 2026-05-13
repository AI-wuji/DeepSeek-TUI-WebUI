<template>
  <div class="chat-view" :class="{ dark: isDark }">
  <SessionSidebar />
    <div class="main-area">
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="brand-mark">☯️</div>
        <div class="title-group">
          <h2 class="top-bar-title">{{ chatStore.currentSession?.title || "新对话" }}</h2>
          <span class="top-bar-sub">☯️ 无极 DeepSeek-TUI -WebUI</span>
        </div>
      </div>
      <div class="top-bar-center">
        <div class="center-row">
          <NSelect size="small" class="model-select" v-model:value="chatStore.settings.model" :options="modelOptions" placeholder="选择模型" clearable />
          <div class="token-badge">
            <span class="token-label">tokens</span>
            <span class="token-value">{{ chatStore.tokenCount.toLocaleString() }}</span>
          </div>
        </div>
      </div>
      <div class="top-bar-right">
        <NButton quaternary size="small" :loading="updating" @click="handleUpdate" class="action-btn update-btn"><template #icon><NIcon><RefreshOutline /></NIcon></template>更新</NButton>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary circle size="small" @click="handleExport" class="action-btn"><template #icon><NIcon><DownloadOutline /></NIcon></template></NButton>
          </template>
          导出对话
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary circle size="small" @click="triggerImport" class="action-btn"><template #icon><NIcon><CloudUploadOutline /></NIcon></template></NButton>
          </template>
          导入对话
        </NTooltip>
        <input ref="importInput" type="file" accept=".json" style="display:none" @change="handleImport" />
        <div class="divider-line"></div>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary circle size="small" @click="showSettings = true" class="action-btn"><template #icon><NIcon><SettingsOutline /></NIcon></template></NButton>
          </template>
          {{ chatStore.settings.systemPrompt ? "已设置系统提示词" : "对话设置" }}
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary circle size="small" @click="toggleTheme" class="action-btn"><template #icon><NIcon><component :is="isDark ? SunnyOutline : MoonOutline" /></NIcon></template></NButton>
          </template>
          {{ isDark ? "亮色模式" : "暗色模式" }}
        </NTooltip>
      </div>
    </header>
    <MessageList />
    <ChatInput />
    <SettingsModal v-model:show="showSettings" />
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from "vue"
import { NButton, NIcon, NSelect, NTooltip, useMessage } from "naive-ui"
import { SettingsOutline, SunnyOutline, MoonOutline, DownloadOutline, CloudUploadOutline, RefreshOutline } from "@vicons/ionicons5"
import { useChatStore, getModelOptions } from "../stores/chat.js"
import MessageList from "../components/MessageList.vue"
import ChatInput from "../components/ChatInput.vue"
import SessionSidebar from "../components/SessionSidebar.vue"
import SettingsModal from "../components/SettingsModal.vue"

const chatStore = useChatStore()
const { isDark, toggle: toggleTheme } = inject("appTheme")
const message = useMessage()
const showSettings = ref(false)
const importInput = ref(null)
const updating = ref(false)
const modelOptions = computed(() => getModelOptions())

async function handleUpdate() {
  updating.value = true
  try {
    const res = await fetch("/api/update-deepseek", { method: "POST" })
    const data = await res.json()
    if (data.success) {
      message.success("DeepSeek TUI 更新成功！")
    } else {
      message.error("更新失败: " + (data.error || "未知错误"))
    }
  } catch (e) {
    message.error("更新请求失败")
  }
  updating.value = false
}

function handleExport() {
  chatStore.exportSessions()
  message.success("导出成功")
}

function triggerImport() {
  importInput.value?.click()
}

function handleImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  chatStore.importSessions(file).then(count => {
    message.success("成功导入 " + count + " 个对话")
  }).catch(err => {
    message.error(err.message || "导入失败")
  })
  e.target.value = ""
}
</script>

<style scoped>
.chat-view { display: flex; flex-direction: row; height: 100vh; overflow: hidden; background: var(--bg-primary); }
.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.dark.chat-view { background: var(--bg-primary); }
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 56px; border-bottom: 1px solid var(--n-border-color, var(--border-color)); background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); flex-shrink: 0; gap: 12px; z-index: 10; }
.dark .top-bar { background: rgba(30, 22, 18, 0.88); }
.top-bar-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex-shrink: 0; }
.brand-mark { width: auto; height: auto; background: none; font-size: 28px; line-height: 1; flex-shrink: 0; }
.title-group { display: flex; flex-direction: column; min-width: 0; }
.top-bar-title { font-size: 14px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; color: var(--n-text-color-1, var(--text-primary)); line-height: 1.3; }
.top-bar-sub { font-size: 11px; opacity: 0.35; white-space: nowrap; line-height: 1; }
.top-bar-center { flex: 1; display: flex; justify-content: center; min-width: 0; }
.center-row { display: flex; align-items: center; gap: 12px; }
.model-select { width: 180px; }
.token-badge { display: flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 6px; background: rgba(232, 116, 42, 0.08); font-size: 11px; white-space: nowrap; }
.token-label { opacity: 0.45; text-transform: uppercase; letter-spacing: 0.5px; }
.token-value { font-weight: 600; color: #E8742A; font-variant-numeric: tabular-nums; }
.top-bar-right { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.divider-line { width: 1px; height: 20px; background: var(--n-border-color, var(--border-color)); margin: 0 4px; }
.action-btn { transition: all 0.2s ease; color: var(--n-text-color-2, var(--text-secondary)); }
.action-btn:hover { color: #E8742A; background: rgba(232, 116, 42, 0.08); }
.dark .action-btn:hover { background: rgba(255, 255, 255, 0.06); }
.update-btn { font-weight: 500; gap: 4px; }
</style>