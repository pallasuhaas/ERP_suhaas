const BASE = '/api'

async function req(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || res.statusText)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : null
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications     = studentId => req(`${BASE}/notifications/student/${studentId}`)
export const markNotificationRead = id => req(`${BASE}/notifications/${id}/read`, { method: 'PATCH' })
export const markAllRead          = studentId => req(`${BASE}/notifications/student/${studentId}/read-all`, { method: 'PATCH' })

// ── Chat ──────────────────────────────────────────────────────────────────────
export const getThreads       = studentId => req(`${BASE}/chat/student/${studentId}`)
export const getOrCreateThread = (studentId, department, subject) =>
  req(`${BASE}/chat/student/${studentId}`, {
    method: 'POST',
    body: JSON.stringify({ department, subject }),
  })
export const getMessages      = threadId => req(`${BASE}/chat/${threadId}/messages`)
export const sendMessage      = (threadId, senderName, content) =>
  req(`${BASE}/chat/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ senderType: 'PARENT', senderName, content }),
  })
export const markChatReadByParent = threadId =>
  req(`${BASE}/chat/${threadId}/read-parent`, { method: 'PATCH' })

// ── Support Tickets ───────────────────────────────────────────────────────────
export const getMyTickets   = studentId => req(`${BASE}/tickets/student/${studentId}`)
export const createTicket   = (studentId, data) =>
  req(`${BASE}/tickets/student/${studentId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
export const getTicketReplies = ticketId => req(`${BASE}/tickets/${ticketId}/replies`)
export const addParentReply   = (ticketId, senderName, content) =>
  req(`${BASE}/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ senderType: 'PARENT', senderName, content }),
  })
