<template>
  <div v-if="msg" class="message-item" :class="{ 'msg-user': msg.role === 'user', 'msg-assistant': msg.role === 'assistant', dark: isDark }">
    <div class="msg-avatar">
      <div class="avatar-circle" :class="msg.role">
        <span v-if="msg.role === 'user'">我</span>
        <span v-else>☯️</span>
      </div>
    </div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-name">{{ msg.role === 'user' ? '我' : '☯️ 无极 DeepSeek-TUI -WebUI' }}</span>
        <span class="msg-time" v-if="msg.time">{{ formatTime(msg.time) }}</span>
      </div>
      <div v-if="hasReasoning" class="reasoning-block">
        <div class="reasoning-header" @click="reasoningOpen = !reasoningOpen">
          <span class="reasoning-dot"></span><span>思考过程</span>
          <NIcon size="14" class="collapse-icon" :class="{ open: reasoningOpen }"><ChevronDownOutline /></NIcon>
        </div>
        <div v-show="reasoningOpen" class="reasoning-content" v-html="renderedReasoning"></div>
      </div>
      <div v-if="msg.role === 'user' && isEditing" class="edit-box">
        <NInput v-model:value="editContent" type="textarea" :autosize="{ minRows: 1, maxRows: 6 }" @keydown.enter.exact="confirmEdit" />
        <div class="edit-actions">
          <NButton size="tiny" quaternary @click="isEditing = false">取消</NButton>
          <NButton size="tiny" type="primary" @click="confirmEdit">保存并发送</NButton>
        </div>
      </div>
      <div v-else class="msg-content">
        <div v-if="msg.role === 'assistant'" class="msg-md" v-html="renderedContent"></div>
        <div v-else class="msg-bubble user-bubble">{{ msg.content }}</div>
        <div v-if="!chatStore.isStreaming || (msg.role === 'user')" class="msg-actions">
          <NTooltip trigger="hover"><template #trigger><NButton quaternary circle size="tiny" @click="copyMessage"><template #icon><NIcon size="14"><CopyOutline /></NIcon></template></NButton></template>复制</NTooltip>
          <NTooltip v-if="msg.role === 'user' && !isEditing" trigger="hover"><template #trigger><NButton quaternary circle size="tiny" @click="startEdit"><template #icon><NIcon size="14"><CreateOutline /></NIcon></template></NButton></template>编辑</NTooltip>
          <NTooltip v-if="msg.role === 'assistant' && index === chatStore.messages.length - 1" trigger="hover"><template #trigger><NButton quaternary circle size="tiny" @click="regenerate"><template #icon><NIcon size="14"><RefreshOutline /></NIcon></template></NButton></template>重新生成</NTooltip>
          <NPopconfirm @positive-click="deleteMsg"><template #trigger><NTooltip trigger="hover"><template #trigger><NButton quaternary circle size="tiny"><template #icon><NIcon size="14"><TrashOutline /></NIcon></template></NButton></template>删除</NTooltip></template>确定要删除这条消息吗？</NPopconfirm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject } from "vue"
import { NButton, NIcon, NTooltip, NInput, NPopconfirm } from "naive-ui"
import { CopyOutline, CreateOutline, RefreshOutline, TrashOutline, ChevronDownOutline } from "@vicons/ionicons5"
import { useChatStore } from "../stores/chat.js"
import md from "../lib/markdown.js"
const props = defineProps({ msg: Object, index: Number })
const chatStore = useChatStore()
const { isDark } = inject("appTheme")
const reasoningOpen = ref(false)
const isEditing = ref(false)
const editContent = ref("")
const hasReasoning = computed(() => !!(props.msg?.reasoning_content))
const renderedReasoning = computed(() => props.msg?.reasoning_content ? md.render(props.msg.reasoning_content) : "")
const renderedContent = computed(() => { if (!props.msg?.content) return props.msg?.reasoning_content ? '<span class="thinking-msg">思考中...</span>' : ""; return md.render(props.msg.content || "") })
function formatTime(ts) { const d = new Date(ts); const now = new Date(); const pad = n => String(n).padStart(2, "0"); const time = pad(d.getHours()) + ":" + pad(d.getMinutes()); if (d.toDateString() === now.toDateString()) return time; return (d.getMonth() + 1) + "/" + d.getDate() + " " + time }
async function copyMessage() { const text = props.msg.content || props.msg.reasoning_content || ""; try { await navigator.clipboard.writeText(text) } catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta) } }
function startEdit() { editContent.value = props.msg.content; isEditing.value = true }
function confirmEdit() { const newContent = editContent.value.trim(); if (!newContent) return; chatStore.editMessage(chatStore.currentSessionId, props.index, newContent); isEditing.value = false }
function regenerate() { chatStore.regenerateMessage() }
function deleteMsg() { chatStore.deleteMessage(props.index) }
</script>

<style scoped>
.message-item { display: flex; gap: 14px; padding: 18px 24px; max-width: 880px; margin: 0 auto; width: 100%; animation: msgIn 0.3s ease-out; }
@keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.msg-user { flex-direction: row-reverse; }
.msg-avatar { flex-shrink: 0; padding-top: 2px; }
.avatar-circle { background: none; width: auto; height: auto; border-radius: 0; display: inline; font-size: 28px; line-height: 1; }
.avatar-circle.user { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #E8742A 0%, #D05E1A 100%); color: #FFF; box-shadow: 0 2px 8px rgba(232, 116, 42, 0.25); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.avatar-circle.assistant { background: none; color: #E8742A; box-shadow: none; }
.msg-body { flex: 1; min-width: 0; }
.msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.msg-name { font-size: 13px; font-weight: 600; color: var(--n-text-color-1, var(--text-primary)); }
.msg-time { font-size: 11px; opacity: 0.35; }
.msg-content { position: relative; }
.msg-bubble { padding: 12px 16px; border-radius: 16px 4px 16px 16px; display: inline-block; max-width: 100%; word-break: break-word; font-size: 14px; line-height: 1.7; }
.user-bubble { background: linear-gradient(135deg, #E8742A 0%, #D05E1A 100%); color: #FFF; box-shadow: 0 2px 12px rgba(232, 116, 42, 0.2); }
.msg-md { font-size: 14px; line-height: 1.8; word-break: break-word; }
.msg-md :deep(p) { margin: 0 0 10px 0; }
.msg-md :deep(p:last-child) { margin-bottom: 0; }
.msg-md :deep(pre) { background: var(--n-code-color, #1E1A16); color: #E5DDD5; border-radius: 10px; padding: 16px 18px; overflow-x: auto; font-size: 13px; line-height: 1.6; position: relative; border: 1px solid var(--n-border-color, #E8E0D3); margin: 8px 0; }
.dark .msg-md :deep(pre) { background: #0E0C0A; }
.msg-md :deep(code) { font-family: "Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace; }
.msg-md :deep(:not(pre) > code) { background: rgba(232,116,42,0.08); color: #E8742A; padding: 2px 7px; border-radius: 5px; font-size: 0.9em; font-weight: 500; }
.dark .msg-md :deep(:not(pre) > code) { background: rgba(232,116,42,0.15); }
.msg-md :deep(ul), .msg-md :deep(ol) { padding-left: 22px; margin: 8px 0; }
.msg-md :deep(li) { margin: 4px 0; line-height: 1.7; }
.msg-md :deep(blockquote) { border-left: 3px solid #E8742A; padding-left: 14px; margin: 10px 0; opacity: 0.8; font-style: italic; }
.msg-md :deep(table) { border-collapse: collapse; margin: 10px 0; width: 100%; }
.msg-md :deep(th), .msg-md :deep(td) { border: 1px solid var(--n-border-color, #E8E0D3); padding: 8px 14px; text-align: left; }
.msg-md :deep(th) { background: rgba(232,116,42,0.05); font-weight: 600; }
.dark .msg-md :deep(th) { background: rgba(232,116,42,0.1); }
.msg-md :deep(h1), .msg-md :deep(h2), .msg-md :deep(h3) { margin: 16px 0 8px 0; font-weight: 600; color: var(--n-text-color-1, var(--text-primary)); }
.msg-md :deep(a) { color: #E8742A; text-decoration: none; border-bottom: 1px solid rgba(232,116,42,0.3); transition: border-color 0.2s; }
.msg-md :deep(a:hover) { border-bottom-color: #E8742A; }
.msg-md :deep(hr) { border: none; border-top: 1px solid var(--n-border-color, #E8E0D3); margin: 16px 0; }
.msg-actions { display: flex; gap: 2px; margin-top: 6px; opacity: 0; transition: opacity 0.2s ease; }
.msg-user .msg-actions { justify-content: flex-end; }
.message-item:hover .msg-actions { opacity: 1; }
.reasoning-block { margin-bottom: 10px; border: 1px solid var(--n-border-color, #E8E0D3); border-radius: 10px; overflow: hidden; background: rgba(232,116,42,0.02); }
.dark .reasoning-block { background: rgba(255,255,255,0.03); }
.reasoning-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer; font-size: 12px; font-weight: 500; opacity: 0.6; user-select: none; transition: opacity 0.2s; }
.reasoning-header:hover { opacity: 0.9; }
.reasoning-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8742A; animation: pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
.reasoning-content { padding: 10px 16px 14px; font-size: 13px; opacity: 0.7; line-height: 1.7; border-top: 1px solid var(--n-border-color, #E8E0D3); }
.collapse-icon { transition: transform 0.25s ease; }
.collapse-icon.open { transform: rotate(180deg); }
.thinking-msg { opacity: 0.4; font-style: italic; }
.edit-box { display: flex; flex-direction: column; gap: 8px; }
.edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>