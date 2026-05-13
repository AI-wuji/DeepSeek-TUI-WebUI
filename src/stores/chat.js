import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api/index.js'

export const DEEPSEEK_MODELS = [{ label: "DeepSeek Chat - 快速对话", value: "deepseek-chat" }, { label: "DeepSeek Reasoner - 深度思考", value: "deepseek-reasoner" }]
export function getModelOptions() { return DEEPSEEK_MODELS }
export const useChatStore = defineStore('chat', () => {
  const sessions = ref([])
  const currentSessionId = ref(null)
  const isStreaming = ref(false)
  const abortFn = ref(null)
  const error = ref(null)

  const settings = ref({
    model: 'deepseek-chat',
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 393216,
    systemPrompt: '',
    apiKey: '',
    baseUrl: ''
  })

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  const messages = computed(() => currentSession.value?.messages || [])

  async function init() {
    sessions.value = await api.fetchSessions()
    if (sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id
    } else {
      await newSession()
    }
  }

  async function newSession(title) {
    const session = await api.createSession(title || '新对话')
    sessions.value.unshift(session)
    currentSessionId.value = session.id
  }

  function selectSession(id) {
    currentSessionId.value = id
  }

  async function deleteCurrentSession() {
    if (!currentSessionId.value) return
    await api.deleteSession(currentSessionId.value)
    sessions.value = sessions.value.filter(s => s.id !== currentSessionId.value)
    if (sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id
    } else {
      currentSessionId.value = null
      await newSession()
    }
  }

  async function renameSession(id, title) {
    await api.renameSession(id, title)
    const s = sessions.value.find(s => s.id === id)
    if (s) s.title = title
  }

  function collectMessages(session, upToIndex) {
    const msgs = []
    if (settings.value.systemPrompt) {
      msgs.push({ role: 'system', content: settings.value.systemPrompt })
    }
    const targets = session.messages.slice(0, upToIndex !== undefined ? upToIndex + 1 : undefined)
    targets.forEach(m => {
      if (m.role === 'user' || (m.role === 'assistant' && m.content)) {
        msgs.push({ role: m.role, content: m.content })
      }
    })
    return msgs
  }

  function sendMessage(content, model) {
    if (!currentSessionId.value || isStreaming.value) return
    error.value = null

    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (!session) return

    const userMsg = { role: 'user', content, time: Date.now() }
    session.messages.push(userMsg)
    api.saveMessage(currentSessionId.value, userMsg)

    const assistantIdx = session.messages.push({ role: 'assistant', content: '', reasoning_content: '', time: Date.now() }) - 1
    const sid = currentSessionId.value

    const msgs = collectMessages(session, assistantIdx - 1)

    isStreaming.value = true

    abortFn.value = api.chatCompletions(
      msgs,
      model || settings.value.model || null,
      settings.value,
      (chunk) => {
        const s = sessions.value.find(s => s.id === sid)
        if (s && s.messages[assistantIdx]) {
          s.messages[assistantIdx].content += chunk
        }
      },
      (reasoning) => {
        const s = sessions.value.find(s => s.id === sid)
        if (s && s.messages[assistantIdx]) {
          s.messages[assistantIdx].reasoning_content += reasoning
        }
      },
      () => {
        isStreaming.value = false
        const s = sessions.value.find(s => s.id === sid)
        if (s && s.messages[assistantIdx]) {
          api.saveMessage(sid, s.messages[assistantIdx])
        }
        if (s && s.messages.length === 2) {
          const title = content.slice(0, 30)
          s.title = title
          api.renameSession(s.id, title)
        }
      },
      (err) => {
        isStreaming.value = false
        error.value = err.message
        const s = sessions.value.find(s => s.id === sid)
        if (s && s.messages[assistantIdx]) {
          s.messages[assistantIdx].content = s.messages[assistantIdx].content || `[错误] ${err.message}`
        }
      }
    )
  }

  function stopStreaming() {
    if (abortFn.value) {
      abortFn.value()
      abortFn.value = null
    }
    isStreaming.value = false
  }

  function editMessage(sessionId, msgIndex, newContent) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (!s) return
    s.messages[msgIndex].content = newContent
    s.messages.splice(msgIndex + 1)
    api.saveMessage(sessionId, s.messages[msgIndex])
    sendMessage(newContent)
  }

  function regenerateMessage() {
    if (!currentSessionId.value || isStreaming.value) return
    const s = sessions.value.find(s => s.id === currentSessionId.value)
    if (!s || s.messages.length < 2) return
    const lastUserIdx = s.messages.length - 2
    if (s.messages[lastUserIdx]?.role !== 'user') return
    s.messages.pop()
    sendMessage(s.messages[lastUserIdx].content)
  }

  function deleteMessage(index) {
    if (!currentSessionId.value) return
    const s = sessions.value.find(s => s.id === currentSessionId.value)
    if (!s) return
    s.messages.splice(index, 1)
    api.saveMessage(currentSessionId.value, null)
  }

  function updateSettings(newSettings) {
    Object.assign(settings.value, newSettings)
  }

  function setModel(model) {
    settings.value.model = model
  }

  const tokenCount = computed(() => {
    const s = sessions.value.find(s => s.id === currentSessionId.value)
    if (!s) return 0
    return s.messages.reduce((sum, m) => sum + (m.content || '').length, 0)
  })

  async function exportSessions() {
    const data = JSON.stringify(sessions.value.map(s => ({
      id: s.id, title: s.title, createdAt: s.createdAt, messages: s.messages
    })), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'deepseek-sessions-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importSessions(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Invalid format')
    let count = 0
    for (const item of data) {
      const session = await api.createSession(item.title || 'Imported')
      if (item.messages) {
        for (const msg of item.messages) {
          await api.saveMessage(session.id, msg)
        }
        session.messages = item.messages
      }
      sessions.value.unshift(session)
      count++
    }
    return count
  }

  return {
    sessions, currentSessionId, isStreaming, error, settings,
    currentSession, messages,
    init, newSession, selectSession, deleteCurrentSession, renameSession,
    sendMessage, stopStreaming, editMessage, regenerateMessage, deleteMessage,
    updateSettings, setModel, tokenCount, exportSessions, importSessions
  }
})
