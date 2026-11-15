import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './Communication.module.css'
import { getStudents } from '../api/students'
import {
  getAllNotifications, createNotification, broadcastNotification, deleteNotification,
  getAllThreads, getThreadMessages, sendAdminMessage, markThreadReadByAdmin,
  getAllTickets, getTicketReplies, addAdminReply, updateTicketStatus, deleteTicket,
} from '../api/communications'

const DEPT_META = {
  FINANCE:      { label: 'Finance Office',   icon: '🏦' },
  ADMIN:        { label: 'School Admin',     icon: '🏫' },
  PRINCIPAL:    { label: 'Principal Office', icon: '🎓' },
  CLASS_TEACHER:{ label: 'Class Teacher',    icon: '👩‍🏫' },
  GENERAL:      { label: 'General',          icon: '💬' },
  TRANSPORT:    { label: 'Transport',        icon: '🚌' },
}

const TRIGGER_ICONS = {
  FEE_REMINDER:      '💰',
  PAYMENT_CONFIRMED: '✅',
  FEE_OVERDUE:       '⚠️',
  GENERAL:           '📢',
  OTHER:             '🔔',
  GPS_UPDATE:        '📍',
  ARRIVAL_ALERT:     '🏫',
  DELAY_ALERT:       '⏰',
}

const TICKET_STATUS = {
  OPEN:        { label: 'Open',        color: 'var(--blue)'  },
  IN_PROGRESS: { label: 'In Progress', color: 'var(--orange, #E8521A)' },
  RESOLVED:    { label: 'Resolved',    color: 'var(--green)' },
  CLOSED:      { label: 'Closed',      color: 'var(--ink-muted)' },
}

function fmtTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr  = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr  < 24) return `${diffHr}h ago`
  if (diffDay < 7)  return `${diffDay}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Communication() {
  const [tab, setTab] = useState('notifications')

  // shared
  const [students, setStudents] = useState([])
  useEffect(() => { getStudents().catch(() => []).then(setStudents) }, [])

  // ── Notifications tab ─────────────────────────────────────────────────────
  const [notifications,  setNotifications]  = useState([])
  const [notifLoading,   setNotifLoading]   = useState(false)
  const [broadcastForm,  setBroadcastForm]  = useState({ title: '', message: '', triggerType: 'GENERAL', target: 'all', gradeLevel: '', studentId: '' })
  const [broadcastSaving,setBroadcastSaving]= useState(false)
  const [broadcastMsg,   setBroadcastMsg]   = useState(null)
  const [broadcastErr,   setBroadcastErr]   = useState(null)

  const loadNotifications = useCallback(() => {
    setNotifLoading(true)
    getAllNotifications().then(setNotifications).catch(() => {}).finally(() => setNotifLoading(false))
  }, [])

  useEffect(() => { if (tab === 'notifications') loadNotifications() }, [tab, loadNotifications])

  async function handleBroadcast(e) {
    e.preventDefault()
    if (!broadcastForm.title || !broadcastForm.message) return setBroadcastErr('Title and message required.')
    setBroadcastErr(null); setBroadcastSaving(true)
    try {
      let studentIds = []
      if (broadcastForm.target === 'all') {
        studentIds = students.filter(s => s.status !== 'ARCHIVED').map(s => s.studentId)
      } else if (broadcastForm.target === 'grade' && broadcastForm.gradeLevel) {
        studentIds = students.filter(s => String(s.gradeLevel) === broadcastForm.gradeLevel && s.status !== 'ARCHIVED').map(s => s.studentId)
      } else if (broadcastForm.target === 'student' && broadcastForm.studentId) {
        studentIds = [Number(broadcastForm.studentId)]
      }
      if (studentIds.length === 0) return setBroadcastErr('No students matched the target selection.')
      await broadcastNotification({ studentIds, triggerType: broadcastForm.triggerType, title: broadcastForm.title, message: broadcastForm.message })
      setBroadcastMsg(`Sent to ${studentIds.length} student${studentIds.length > 1 ? 's' : ''}.`)
      setBroadcastForm(f => ({ ...f, title: '', message: '' }))
      loadNotifications()
      setTimeout(() => setBroadcastMsg(null), 4000)
    } catch (e) { setBroadcastErr(e.message) }
    finally { setBroadcastSaving(false) }
  }

  // ── Messages tab ──────────────────────────────────────────────────────────
  const [threads,      setThreads]      = useState([])
  const [threadLoading,setThreadLoading]= useState(false)
  const [activeThread, setActiveThread] = useState(null)
  const [messages,     setMessages]     = useState([])
  const [msgLoading,   setMsgLoading]   = useState(false)
  const [replyText,    setReplyText]    = useState('')
  const [replySending, setReplySending] = useState(false)
  const messagesEndRef = useRef(null)

  const loadThreads = useCallback(() => {
    setThreadLoading(true)
    getAllThreads().then(setThreads).catch(() => {}).finally(() => setThreadLoading(false))
  }, [])

  useEffect(() => { if (tab === 'messages') loadThreads() }, [tab, loadThreads])

  async function openThread(thread) {
    setActiveThread(thread)
    setMsgLoading(true)
    setReplyText('')
    try {
      const msgs = await getThreadMessages(thread.threadId)
      setMessages(msgs)
      await markThreadReadByAdmin(thread.threadId)
      setThreads(ts => ts.map(t => t.threadId === thread.threadId ? { ...t, unreadByAdmin: 0 } : t))
    } catch { setMessages([]) }
    finally { setMsgLoading(false) }
  }

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendReply() {
    if (!replyText.trim() || !activeThread) return
    setReplySending(true)
    try {
      const msg = await sendAdminMessage(activeThread.threadId, 'School Admin', replyText.trim())
      setMessages(ms => [...ms, msg])
      setReplyText('')
      setThreads(ts => ts.map(t => t.threadId === activeThread.threadId
        ? { ...t, lastMessageAt: msg.sentAt, unreadByParent: (t.unreadByParent || 0) + 1 }
        : t
      ))
    } catch (e) { alert('Failed to send: ' + e.message) }
    finally { setReplySending(false) }
  }

  // ── Tickets tab ───────────────────────────────────────────────────────────
  const [tickets,       setTickets]       = useState([])
  const [ticketLoading, setTicketLoading] = useState(false)
  const [ticketFilter,  setTicketFilter]  = useState('ALL')
  const [activeTicket,  setActiveTicket]  = useState(null)
  const [ticketReplies, setTicketReplies] = useState([])
  const [ticketReply,   setTicketReply]   = useState('')
  const [ticketReplySaving, setTicketReplySaving] = useState(false)

  const loadTickets = useCallback(() => {
    setTicketLoading(true)
    getAllTickets().then(setTickets).catch(() => {}).finally(() => setTicketLoading(false))
  }, [])

  useEffect(() => { if (tab === 'tickets') loadTickets() }, [tab, loadTickets])

  async function openTicket(ticket) {
    setActiveTicket(ticket)
    try {
      const replies = await getTicketReplies(ticket.ticketId)
      setTicketReplies(replies)
    } catch { setTicketReplies([]) }
    setTicketReply('')
  }

  async function handleTicketReply() {
    if (!ticketReply.trim() || !activeTicket) return
    setTicketReplySaving(true)
    try {
      const reply = await addAdminReply(activeTicket.ticketId, 'School Admin', ticketReply.trim())
      setTicketReplies(rs => [...rs, reply])
      setTicketReply('')
      // Refresh ticket to pick up status change (may become IN_PROGRESS)
      loadTickets()
    } catch (e) { alert('Failed: ' + e.message) }
    finally { setTicketReplySaving(false) }
  }

  async function handleTicketStatus(ticketId, status) {
    try {
      await updateTicketStatus(ticketId, status)
      setTickets(ts => ts.map(t => t.ticketId === ticketId ? { ...t, status } : t))
      if (activeTicket?.ticketId === ticketId) setActiveTicket(t => ({ ...t, status }))
    } catch (e) { alert('Failed: ' + e.message) }
  }

  const filteredTickets = ticketFilter === 'ALL' ? tickets : tickets.filter(t => t.status === ticketFilter)
  const gradeOptions = [...new Set(students.map(s => String(s.gradeLevel)))].sort((a, b) => Number(a) - Number(b))

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Communication</div>
          <div className="page-sub">Notifications, messages and support tickets</div>
        </div>
      </div>

      <div className="tab-bar">
        {[['notifications','🔔 Notifications'],['messages','💬 Messages'],['tickets','🎫 Support Tickets']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Notifications tab ── */}
      {tab === 'notifications' && (
        <div className={styles.commGrid}>
          {/* Compose form */}
          <div className="card">
            <div className="section-head">Send Notification</div>
            {broadcastMsg && <div className="badge green" style={{ marginBottom: 12, display: 'block' }}>✓ {broadcastMsg}</div>}
            {broadcastErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>⚠ {broadcastErr}</div>}
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label className="form-label">Notification Type</label>
                <select className="form-select" value={broadcastForm.triggerType} onChange={e => setBroadcastForm(f => ({ ...f, triggerType: e.target.value }))}>
                  <option value="GENERAL">📢 General Announcement</option>
                  <option value="FEE_REMINDER">💰 Fee Reminder</option>
                  <option value="FEE_OVERDUE">⚠️ Fee Overdue Alert</option>
                  <option value="OTHER">🔔 Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="e.g. Annual Day — March 20" required
                  value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" rows={4} placeholder="Write your notification message…" required
                  value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: 80 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Send To</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[['all','All Students'],['grade','Specific Grade'],['student','Specific Student']].map(([v, l]) => (
                    <button key={v} type="button"
                      className={broadcastForm.target === v ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: 12, padding: '5px 12px' }}
                      onClick={() => setBroadcastForm(f => ({ ...f, target: v }))}>
                      {l}
                    </button>
                  ))}
                </div>
                {broadcastForm.target === 'grade' && (
                  <select className="form-select" value={broadcastForm.gradeLevel} onChange={e => setBroadcastForm(f => ({ ...f, gradeLevel: e.target.value }))}>
                    <option value="">— Select Grade —</option>
                    {gradeOptions.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                )}
                {broadcastForm.target === 'student' && (
                  <select className="form-select" value={broadcastForm.studentId} onChange={e => setBroadcastForm(f => ({ ...f, studentId: e.target.value }))}>
                    <option value="">— Select Student —</option>
                    {students.filter(s => s.status !== 'ARCHIVED').map(s => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.firstName} {s.lastName} · Grade {s.gradeLevel}{s.section ? `-${s.section}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={broadcastSaving}>
                {broadcastSaving ? 'Sending…' : '🔔 Send Notification'}
              </button>
            </form>
          </div>

          {/* Notification history */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-head" style={{ margin: 0 }}>Recent Notifications</div>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={loadNotifications}>↻ Refresh</button>
            </div>
            {notifLoading ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</p>
            ) : notifications.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>No notifications sent yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.slice(0, 50).map(n => (
                  <div key={n.notificationId} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{TRIGGER_ICONS[n.triggerType] || '🔔'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{n.title || n.triggerType}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2, whiteSpace: 'pre-wrap' }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                        Student #{n.studentId} · {fmtTime(n.sentAt)}
                        {n.isRead && <span className="badge muted" style={{ marginLeft: 8, fontSize: 10 }}>Read</span>}
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 13 }}
                      onClick={() => deleteNotification(n.notificationId).then(loadNotifications)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Messages tab ── */}
      {tab === 'messages' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeThread ? '320px 1fr' : '1fr', gap: 16 }}>
          {/* Thread list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Conversations</span>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={loadThreads}>↻</button>
            </div>
            {threadLoading ? (
              <p style={{ padding: 16, color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</p>
            ) : threads.length === 0 ? (
              <p style={{ padding: 16, color: 'var(--ink-muted)', fontSize: 13 }}>No conversations yet.</p>
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {threads.map(t => {
                  const dept = DEPT_META[t.department] || DEPT_META.GENERAL
                  const isActive = activeThread?.threadId === t.threadId
                  return (
                    <button key={t.threadId} onClick={() => openThread(t)}
                      style={{ width: '100%', display: 'flex', gap: 12, padding: '12px 16px', background: isActive ? 'var(--blue-light)' : 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{dept.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>Student #{t.studentId}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{fmtTime(t.lastMessageAt)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{dept.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                      </div>
                      {t.unreadByAdmin > 0 && (
                        <span style={{ background: 'var(--accent)', color: 'white', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '2px 6px', flexShrink: 0 }}>{t.unreadByAdmin}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Message thread */}
          {activeThread && (
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 600 }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setActiveThread(null)}>← Back</button>
                <span style={{ fontSize: 18 }}>{DEPT_META[activeThread.department]?.icon || '💬'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Student #{activeThread.studentId} · {DEPT_META[activeThread.department]?.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{activeThread.subject}</div>
                </div>
                <span className={`badge ${activeThread.status === 'OPEN' ? 'blue' : 'muted'}`} style={{ marginLeft: 'auto', fontSize: 11 }}>{activeThread.status}</span>
              </div>
              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {msgLoading ? (
                  <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Loading messages…</p>
                ) : messages.map(m => (
                  <div key={m.messageId} style={{ display: 'flex', flexDirection: 'column', alignItems: m.senderType === 'ADMIN' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 13,
                      background: m.senderType === 'ADMIN' ? 'var(--accent)' : 'var(--bg)',
                      color: m.senderType === 'ADMIN' ? 'white' : 'var(--ink)',
                      border: m.senderType === 'ADMIN' ? 'none' : '1px solid var(--border)',
                    }}>{m.content}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>
                      {m.senderName} · {fmtTime(m.sentAt)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Reply input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <input className="form-input" style={{ flex: 1, fontSize: 13 }}
                  placeholder="Type a reply…"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }} />
                <button className="btn-primary" style={{ fontSize: 13, padding: '6px 14px' }}
                  onClick={handleSendReply} disabled={replySending || !replyText.trim()}>
                  {replySending ? '…' : 'Send →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tickets tab ── */}
      {tab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeTicket ? '360px 1fr' : '1fr', gap: 16 }}>
          {/* Ticket list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, marginRight: 4 }}>Support Tickets</span>
              {['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map(s => (
                <button key={s}
                  onClick={() => setTicketFilter(s)}
                  className={ticketFilter === s ? 'btn-primary' : 'btn-ghost'}
                  style={{ fontSize: 11, padding: '3px 8px' }}>
                  {s === 'ALL' ? 'All' : s.replace('_',' ')}
                  {s === 'ALL' ? '' : ` (${tickets.filter(t => t.status === s).length})`}
                </button>
              ))}
              <button className="btn-ghost" style={{ fontSize: 12, marginLeft: 'auto' }} onClick={loadTickets}>↻</button>
            </div>
            {ticketLoading ? (
              <p style={{ padding: 16, color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</p>
            ) : filteredTickets.length === 0 ? (
              <p style={{ padding: 16, color: 'var(--ink-muted)', fontSize: 13 }}>No tickets.</p>
            ) : (
              <div style={{ maxHeight: 620, overflowY: 'auto' }}>
                {filteredTickets.map(t => {
                  const s = TICKET_STATUS[t.status] || TICKET_STATUS.OPEN
                  const isActive = activeTicket?.ticketId === t.ticketId
                  return (
                    <button key={t.ticketId} onClick={() => openTicket(t)}
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 16px', background: isActive ? 'var(--blue-light)' : 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-muted)' }}>#{t.ticketId}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{t.subject}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                        {t.parentName || `Student #${t.studentId}`} · {t.category}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{fmtTime(t.createdAt)}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ticket detail */}
          {activeTicket && (
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: 640 }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>#{activeTicket.ticketId}</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{activeTicket.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>
                      {activeTicket.parentName || `Student #${activeTicket.studentId}`} · {activeTicket.category}
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setActiveTicket(null)}>✕</button>
                </div>
                {/* Status actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].filter(s => s !== activeTicket.status).map(s => (
                    <button key={s} className="btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => handleTicketStatus(activeTicket.ticketId, s)}>
                      → {s.replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>
              {/* Description */}
              <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Issue Description</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{activeTicket.description}</div>
              </div>
              {/* Replies */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ticketReplies.length === 0 ? (
                  <p style={{ color: 'var(--ink-muted)', fontSize: 12 }}>No replies yet. Send the first response below.</p>
                ) : ticketReplies.map(r => (
                  <div key={r.replyId} style={{ display: 'flex', flexDirection: 'column', alignItems: r.senderType === 'ADMIN' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '8px 12px', borderRadius: 10, fontSize: 13,
                      background: r.senderType === 'ADMIN' ? 'var(--accent)' : 'var(--bg)',
                      color: r.senderType === 'ADMIN' ? 'white' : 'var(--ink)',
                      border: r.senderType === 'ADMIN' ? 'none' : '1px solid var(--border)',
                    }}>{r.content}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>
                      {r.senderName} · {fmtTime(r.sentAt)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Reply input */}
              {activeTicket.status !== 'CLOSED' && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ flex: 1, fontSize: 13 }}
                    placeholder="Type a response…"
                    value={ticketReply}
                    onChange={e => setTicketReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleTicketReply() }} />
                  <button className="btn-primary" style={{ fontSize: 13, padding: '6px 14px' }}
                    onClick={handleTicketReply} disabled={ticketReplySaving || !ticketReply.trim()}>
                    {ticketReplySaving ? '…' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
