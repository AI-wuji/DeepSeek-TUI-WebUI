const BASE = '/api'

export async function fetchSessions() {
  const res = await fetch(BASE + '/sessions')
  return res.json()
}

export async function createSession(title) {
  const res = await fetch(BASE + '/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title || '\u65b0\u5bf9\u8bdd' })
  })
  return res.json()
}

export async function deleteSession(id) {
  await fetch(BASE + '/sessions/' + id, { method: 'DELETE' })
}

export async function fetchSession(id) {
  const res = await fetch(BASE + '/sessions/' + id)
  return res.json()
}

export async function renameSession(id, title) {
  const res = await fetch(BASE + '/sessions/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
  return res.json()
}

export async function saveMessage(sessionId, message) {
  await fetch(BASE + '/sessions/' + sessionId + '/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
}

export async function saveMessages(sessionId, messages) {
  await fetch(BASE + '/sessions/' + sessionId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })
}

export async function clearMessages(sessionId) {
  await fetch(BASE + '/sessions/' + sessionId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [] })
  })
}

export function chatCompletions(messages, model, settings, onChunk, onReasoning, onDone, onError) {
  const controller = new AbortController()
  const body = { messages, model, stream: true }
  if (settings) {
    if (settings.temperature != null) body.temperature = settings.temperature
    if (settings.topP != null) body.top_p = settings.topP
    if (settings.maxTokens != null) body.max_tokens = settings.maxTokens
    if (settings.apiKey) body.api_key = settings.apiKey
    if (settings.baseUrl) body.base_url = settings.baseUrl
  }
  fetch(BASE + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.text()
      onError(new Error(err || '\u8bf7\u6c42\u5931\u8d25 (' + response.status + ')'))
      return
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') { onDone(); return }
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta
          if (delta?.reasoning_content && onReasoning) onReasoning(delta.reasoning_content)
          if (delta?.content) onChunk(delta.content)
        } catch (_) {}
      }
    }
    onDone()
  }).catch(err => {
    if (err.name === 'AbortError') return
    onError(err)
  })
  return () => controller.abort()
}