import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './Chat.module.css'
import { getThreads, getOrCreateThread, getMessages, sendMessage, markChatReadByParent } from '../api/comms'

const DEPT_CONTACTS = [
  { department: 'FINANCE',       name: 'Finance Office',    role: 'Fee payments & receipts',           avatar: '🏦' },
  { department: 'ADMIN',         name: 'School Admin',      role: 'General enquiries & admissions',    avatar: '🏫' },
  { department: 'CLASS_TEACHER', name: 'Class Teacher',     role: 'Academics & student progress',      avatar: '👩‍🏫' },
  { department: 'PRINCIPAL',     name: 'Principal Office',  role: 'Escalations & special requests',    avatar: '🎓' },
  { department: 'GENERAL',       name: 'General Support',   role: 'Any other queries',                 avatar: '💬' },
]

function fmtTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diffMs = now - d
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffDay === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7)  return d.toLocaleDateString('en-IN', { weekday: 'short' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Chat({ parentData, activeChildId }) {
  const [threads,       setThreads]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeThread,  setActiveThread]  = useState(null)
  const [messages,      setMessages]      = useState([])
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [inputText,     setInputText]     = useState('')
  const [sending,       setSending]       = useState(false)
  const [openingDept,   setOpeningDept]   = useState(null)
  const messagesEndRef = useRef(null)

  const parentName = parentData?.name || 'Parent'

  const loadThreads = useCallback(() => {
    if (!activeChildId) return
    setLoading(true)
    getThreads(activeChildId)
      .then(data => setThreads(Array.isArray(data) ? data : []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false))
  }, [activeChildId])

  useEffect(() => { loadThreads() }, [loadThreads])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function openDeptThread(contact) {
    if (!activeChildId) return
    setOpeningDept(contact.department)
    try {
      const thread = await getOrCreateThread(activeChildId, contact.department, `${contact.name} Enquiry`)
      await enterThread(thread, contact)
      // Refresh thread list
      loadThreads()
    } catch (e) {
      alert('Could not open conversation: ' + e.message)
    } finally {
      setOpeningDept(null)
    }
  }

  async function enterThread(thread, contactHint) {
    setActiveThread({ ...thread, _contact: contactHint })
    setMsgLoading(true)
    setInputText('')
    try {
      const msgs = await getMessages(thread.threadId)
      setMessages(Array.isArray(msgs) ? msgs : [])
      await markChatReadByParent(thread.threadId)
      setThreads(ts => ts.map(t => t.threadId === thread.threadId ? { ...t, unreadByParent: 0 } : t))
    } catch { setMessages([]) }
    finally { setMsgLoading(false) }
  }

  async function handleSend() {
    if (!inputText.trim() || !activeThread || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(activeThread.threadId, parentName, inputText.trim())
      setMessages(ms => [...ms, msg])
      setInputText('')
      setThreads(ts => ts.map(t => t.threadId === activeThread.threadId
        ? { ...t, lastMessageAt: msg.sentAt }
        : t
      ))
    } catch (e) {
      alert('Failed to send message: ' + e.message)
    } finally {
      setSending(false)
    }
  }

  // ── Thread view ─────────────────────────────────────────────────────────────
  if (activeThread) {
    const contact = activeThread._contact || DEPT_CONTACTS.find(c => c.department === activeThread.department)
    const deptName = contact?.name || activeThread.department
    const deptAvatar = contact?.avatar || '💬'

    return (
      <div className={styles.screen}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <button className={styles.backBtn} onClick={() => { setActiveThread(null); setMessages([]) }}>←</button>
            <div className={styles.contactAvatar}>{deptAvatar}</div>
            <div className={styles.headerInfo}>
              <div className={styles.headerName}>{deptName}</div>
              <div className={`${styles.headerStatus} ${styles.online}`}>● School Staff</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.chatArea}>
          {msgLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-muted)' }}>Loading messages…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-muted)', fontSize: 13 }}>
              No messages yet. Send your first message below.
            </div>
          ) : messages.map(m => (
            <div key={m.messageId} className={`${styles.bubble} ${m.senderType === 'PARENT' ? styles.sent : styles.received}`}>
              <div className={styles.bubbleText}>{m.content}</div>
              <div className={styles.bubbleTime}>
                {m.senderType === 'PARENT' ? `You · ${fmtTime(m.sentAt)}` : `${deptName} · ${fmtTime(m.sentAt)}`}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className={styles.inputBar}>
          <input
            className={styles.inputReal}
            placeholder="Type a message…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            disabled={sending}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={sending || !inputText.trim()}>
            {sending ? '…' : '→'}
          </button>
        </div>
      </div>
    )
  }

  // ── Contact list view ───────────────────────────────────────────────────────
  // Build a map of existing threads by department
  const threadByDept = {}
  threads.forEach(t => { threadByDept[t.department] = t })

  return (
    <div className={styles.screen}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>Messages</span>
        <span className={styles.listSub}>Contact school staff directly</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-muted)' }}>Loading…</div>
      ) : (
        <div className={styles.contactList}>
          {DEPT_CONTACTS.map(contact => {
            const thread = threadByDept[contact.department]
            const unread = thread?.unreadByParent || 0
            const lastMsg = thread?.subject
            const lastTime = thread ? fmtTime(thread.lastMessageAt) : ''
            const isOpening = openingDept === contact.department

            return (
              <button
                key={contact.department}
                className={styles.contactRow}
                onClick={() => thread ? enterThread(thread, contact) : openDeptThread(contact)}
                disabled={isOpening}>
                <div className={styles.contactAvatarWrap}>
                  <div className={styles.contactAvatar}>{isOpening ? '…' : contact.avatar}</div>
                </div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactName}>{contact.name}</div>
                  <div className={styles.contactRole}>{contact.role}</div>
                  {thread ? (
                    <div className={styles.contactPreview} style={{ color: unread > 0 ? 'var(--ink)' : undefined, fontWeight: unread > 0 ? 600 : 400 }}>
                      {thread.status === 'OPEN' ? '💬 Active conversation' : '✅ Conversation closed'}
                    </div>
                  ) : (
                    <div className={styles.contactPreview} style={{ fontStyle: 'italic' }}>Tap to start a conversation</div>
                  )}
                </div>
                <div className={styles.contactMeta}>
                  {lastTime && <div className={styles.contactTime}>{lastTime}</div>}
                  {unread > 0 && <div className={styles.unreadBadge}>{unread}</div>}
                  {!thread && <div style={{ fontSize: 16, color: 'var(--ink-muted)' }}>→</div>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
