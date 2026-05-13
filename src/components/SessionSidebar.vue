<template>
  <aside class="sidebar" :class="{ dark: isDark }">
    <div class="sidebar-header">
      <div class="brand-row">
        <div class="logo-mark">☯️</div>
        <span class="logo-text">☯️ 无极 DeepSeek-TUI -WebUI</span>
      </div>
      <NButton quaternary circle size="small" @click="chatStore.newSession()" class="add-btn">
        <template #icon><NIcon><AddOutline /></NIcon></template>
      </NButton>
    </div>
    <div class="sidebar-search">
      <NInput v-model:value="searchQuery" placeholder="搜索对话..." size="small" clearable round>
        <template #prefix><NIcon size="14"><SearchOutline /></NIcon></template>
      </NInput>
    </div>
    <div class="sidebar-sessions">
      <div v-for="session in filteredSessions" :key="session.id" class="session-item" :class="{ active: session.id === chatStore.currentSessionId }" @click="chatStore.selectSession(session.id)">
        <div class="session-left">
          <div class="session-dot" :class="{ active: session.id === chatStore.currentSessionId }"></div>
          <div class="session-info">
            <div v-if="editingId === session.id" class="session-edit">
              <NInput v-model:value="editTitle" size="tiny" @blur="finishRename(session.id)" @keydown.enter="finishRename(session.id)" autofocus />
            </div>
            <span v-else class="session-title">{{ session.title || "新对话" }}</span>
            <span class="session-time">{{ formatDate(session.createdAt) }}</span>
          </div>
        </div>
        <div class="session-actions" v-show="session.id === chatStore.currentSessionId">
          <NTooltip trigger="hover"><template #trigger><NButton quaternary circle size="tiny" @click.stop="startRename(session)"><template #icon><NIcon size="12"><CreateOutline /></NIcon></template></NButton></template>重命名</NTooltip>
          <NPopconfirm @positive-click="chatStore.deleteCurrentSession()"><template #trigger><NTooltip trigger="hover"><template #trigger><NButton quaternary circle size="tiny" @click.stop><template #icon><NIcon size="12"><TrashOutline /></NIcon></template></NButton></template>删除</NTooltip></template>确定要删除此对话吗？</NPopconfirm>
        </div>
      </div>
      <div v-if="filteredSessions.length === 0" class="sidebar-empty">
        <NIcon size="32"><ChatbubbleOutline /></NIcon>
        <span>{{ searchQuery ? "没有匹配的对话" : "开始一段新对话" }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, inject } from "vue"
import { NButton, NIcon, NTooltip, NPopconfirm, NInput } from "naive-ui"
import { AddOutline, ChatbubbleOutline, CreateOutline, TrashOutline, SearchOutline } from "@vicons/ionicons5"
import { useChatStore } from "../stores/chat.js"
const chatStore = useChatStore()
const { isDark } = inject("appTheme")
const searchQuery = ref("")
const editingId = ref(null)
const editTitle = ref("")
const filteredSessions = computed(() => { const q = searchQuery.value.trim().toLowerCase(); if (!q) return chatStore.sessions; return chatStore.sessions.filter(s => (s.title || "").toLowerCase().includes(q)) })
function formatDate(iso) { if (!iso) return ""; const d = new Date(iso); const now = new Date(); const pad = n => String(n).padStart(2, "0"); if (d.toDateString() === now.toDateString()) return pad(d.getHours()) + ":" + pad(d.getMinutes()); const dayDiff = Math.floor((now - d) / 86400000); if (dayDiff === 1) return "昨天"; if (dayDiff < 7) return dayDiff + "天前"; return (d.getMonth() + 1) + "/" + d.getDate() }
function startRename(session) { editingId.value = session.id; editTitle.value = session.title || "" }
function finishRename(id) { const title = editTitle.value.trim(); if (title) { chatStore.renameSession(id, title) } editingId.value = null }
</script>

<style scoped>
.sidebar { width: 272px; height: 100%; display: flex; flex-direction: column; background: #FDFBF7; border-right: 1px solid var(--n-border-color, #E8E0D3); flex-shrink: 0; }
.dark.sidebar { background: #1E1612; }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 14px 4px; flex-shrink: 0; }
.brand-row { display: flex; align-items: center; gap: 10px; }
.logo-mark { width: auto; height: auto; background: none; font-size: 26px; line-height: 1; }
.logo-text { font-size: 15px; font-weight: 700; letter-spacing: -0.2px; color: var(--n-text-color-1, var(--text-primary)); white-space: nowrap; }
.add-btn { transition: all 0.2s ease; }
.add-btn:hover { color: #E8742A; background: rgba(232, 116, 42, 0.08); }
.sidebar-search { padding: 12px 14px 8px; flex-shrink: 0; }
.sidebar-sessions { flex: 1; overflow-y: auto; padding: 4px 10px 16px; }
.session-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 2px; }
.session-item:hover { background: rgba(232,116,42,0.05); }
.dark .session-item:hover { background: rgba(255,255,255,0.06); }
.session-item.active { background: rgba(232, 116, 42, 0.1); }
.session-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.session-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--n-border-color, #E8E0D3); flex-shrink: 0; }
.session-dot.active { background: #E8742A; box-shadow: 0 0 6px rgba(232, 116, 42, 0.4); }
.session-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.session-title { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--n-text-color-1, var(--text-primary)); }
.session-time { font-size: 11px; opacity: 0.35; margin-top: 1px; }
.session-item.active .session-title { color: #D05E1A; font-weight: 500; }
.session-item.active .session-time { opacity: 0.5; }
.session-actions { display: flex; gap: 2px; flex-shrink: 0; }
.session-edit { width: 100%; }
.sidebar-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; opacity: 0.3; font-size: 13px; text-align: center; }
</style>