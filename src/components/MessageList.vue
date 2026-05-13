<template>
  <div class="message-list" ref="listRef" @scroll="onScroll" :class="{ dark: isDark }">
    <div class="messages-container">
      <div v-if="chatStore.currentSession && chatStore.messages.length === 0" class="empty-state">
        <div class="empty-logo">☯️</div>
        <div class="empty-greeting">☯️ 无极 DeepSeek-TUI -WebUI</div>
        <div class="empty-slogan">卓越 · 精于思考</div>
        <div class="empty-hint">发送消息开始对话</div>
      </div>
      <MessageItem v-for="(msg, i) in chatStore.messages" :key="i" :msg="msg" :index="i" />
      <div v-if="chatStore.isStreaming && lastMsg?.role === 'assistant' && !lastMsg?.content" class="streaming-indicator">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showScrollBtn" class="scroll-bottom-btn" @click="scrollToBottom()">
        <NIcon size="18"><ChevronDownOutline /></NIcon>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, inject } from "vue"
import { NIcon } from "naive-ui"
import { ChevronDownOutline } from "@vicons/ionicons5"
import { useChatStore } from "../stores/chat.js"
import MessageItem from "./MessageItem.vue"
const chatStore = useChatStore()
const { isDark } = inject("appTheme")
const listRef = ref(null)
const showScrollBtn = ref(false)
const lastMsg = computed(() => { const msgs = chatStore.messages; return msgs.length > 0 ? msgs[msgs.length - 1] : null })
function isNearBottom() { const el = listRef.value; if (!el) return true; return el.scrollHeight - el.scrollTop - el.clientHeight < 80 }
function scrollToBottom(smooth = false) { const el = listRef.value; if (!el) return; requestAnimationFrame(() => { el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" }) }) }
function onScroll() { showScrollBtn.value = !isNearBottom() }
watch(() => chatStore.messages.length, () => { if (isNearBottom()) { nextTick(() => scrollToBottom()) } })
watch(() => lastMsg.value?.content, () => { if (isNearBottom()) { nextTick(() => scrollToBottom(true)) } })
watch(() => chatStore.currentSessionId, async () => { await nextTick(); scrollToBottom() })
</script>

<style scoped>
.message-list { flex: 1; overflow-y: auto; position: relative; scroll-behavior: smooth; }
.messages-container { padding: 20px 0 24px; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 20px 60px; text-align: center; }
.empty-logo { width: auto; height: auto; background: none; font-size: 48px; line-height: 1; margin-bottom: 16px; }
.empty-greeting { font-size: 28px; font-weight: 700; color: var(--n-text-color-1, var(--text-primary)); margin-bottom: 6px; letter-spacing: -0.5px; }
.empty-slogan { font-size: 14px; color: #E8742A; font-weight: 500; letter-spacing: 2px; margin-bottom: 16px; }
.empty-hint { font-size: 13px; opacity: 0.45; color: var(--n-text-color-3, var(--text-tertiary)); }
.streaming-indicator { display: flex; align-items: center; padding: 8px 36px; }
.typing-dots { display: flex; gap: 4px; align-items: center; }
.typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #E8742A; animation: typing-bounce 1.4s ease-in-out infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-bounce { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-4px); } }
.scroll-bottom-btn { position: absolute; bottom: 16px; right: 24px; width: 38px; height: 38px; border-radius: 50%; background: #FFFFFF; border: 1px solid var(--n-border-color, #E8E0D3); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: all 0.25s ease; z-index: 10; }
.dark .scroll-bottom-btn { background: #241C16; }
.scroll-bottom-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-color: #E8742A; color: #E8742A; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>