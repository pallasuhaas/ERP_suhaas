import { friendlyError, safeFetch } from './errors'

const BASE = '/api'

async function req(url, opts = {}) {
  const res = await safeFetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(friendlyError(res.status, text))
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : null
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const getAllNotifications  = () => req(`${BASE}/notifications`)
export const createNotification   = data => req(`${BASE}/notifications`, { method: 'POST', body: JSON.stringify(data) })
export const broadcastNotification = data => req(`${BASE}/notifications/broadcast`, { method: 'POST', body: JSON.stringify(data) })
export const deleteNotification   = id => req(`${BASE}/notifications/${id}`, { method: 'DELETE' })

// ── Chat ──────────────────────────────────────────────────────────────────────
export const getAllThreads    = () => req(`${BASE}/chat`)
export const getThreadMessages = threadId => req(`${BASE}/chat/${threadId}/messages`)
export const sendAdminMessage  = (threadId, senderName, content) =>
  req(`${BASE}/chat/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ senderType: 'ADMIN', senderName, content }),
  })
export const markThreadReadByAdmin = threadId =>
  req(`${BASE}/chat/${threadId}/read-admin`, { method: 'PATCH' })

// ── Support Tickets ───────────────────────────────────────────────────────────
export const getAllTickets    = () => req(`${BASE}/tickets`)
export const getTicketReplies = ticketId => req(`${BASE}/tickets/${ticketId}/replies`)
export const addAdminReply    = (ticketId, senderName, content) =>
  req(`${BASE}/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ senderType: 'ADMIN', senderName, content }),
  })
export const updateTicketStatus = (ticketId, status) =>
  req(`${BASE}/tickets/${ticketId}/status?status=${status}`, { method: 'PATCH' })
export const deleteTicket = ticketId => req(`${BASE}/tickets/${ticketId}`, { method: 'DELETE' })
