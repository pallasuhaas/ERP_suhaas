import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './Help.module.css'
import { getMyTickets, createTicket, getTicketReplies, addParentReply } from '../api/comms'

const CATEGORIES = ['Fee Payment', 'Transport / Bus', 'Account Access', 'School Communication', 'Other']

const FAQS = [
  { q: 'How do I pay fees online?',           a: 'Go to Finance → Fee Details and tap "Pay Now". You can use UPI, card, or net banking.' },
  { q: 'Can I download a payment receipt?',   a: 'Yes. Go to Finance → History & Receipts and tap "Receipt" next to any paid transaction.' },
  { q: 'What if my bus is delayed?',          a: "You'll get an automatic push notification. You can also check live status in the Bus tab." },
  { q: 'How do I update my contact number?',  a: 'Go to Settings → Profile & Contact Info and update your mobile number.' },
]

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        cls: styles.statusOpen },
  IN_PROGRESS: { label: 'In Progress', cls: styles.statusInProgress },
  RESOLVED:    { label: 'Resolved',    cls: styles.statusResolved },
  CLOSED:      { label: 'Closed',      cls: styles.statusClosed },
}

function fmtDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function Help({ activeChildId, parentData, onNavigate }) {
  const [activeTab,    setActiveTab]    = useState('raise')
  // Raise ticket
  const [category,     setCategory]     = useState('')
  const [description,  setDescription]  = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const [submitError,  setSubmitError]  = useState('')
  // My tickets
  const [tickets,      setTickets]      = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState(null)
  const [replies,      setReplies]      = useState({})       // ticketId → reply[]
  const [repliesLoading, setRepliesLoading] = useState({})   // ticketId → bool
  const [replyText,    setReplyText]    = useState({})       // ticketId → string
  const [sendingReply, setSendingReply] = useState({})       // ticketId → bool
  // FAQs
  const [openFaq,      setOpenFaq]      = useState(null)

  const parentName = parentData?.name || 'Parent'

  const loadTickets = useCallback(() => {
    if (!activeChildId) return
    setTicketsLoading(true)
    getMyTickets(activeChildId)
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false))
  }, [activeChildId])

  useEffect(() => {
    if (activeTab === 'track') loadTickets()
  }, [activeTab, loadTickets])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!category || description.trim().length < 10 || !activeChildId) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await createTicket(activeChildId, {
        parentName,
        category,
        subject: category,
        description: description.trim(),
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError('Failed to submit ticket: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSubmitted(false)
    setCategory('')
    setDescription('')
    setSubmitError('')
  }

  async function toggleTicket(ticketId) {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null)
      return
    }
    setExpandedTicket(ticketId)
    if (!replies[ticketId]) {
      setRepliesLoading(r => ({ ...r, [ticketId]: true }))
      try {
        const data = await getTicketReplies(ticketId)
        setReplies(r => ({ ...r, [ticketId]: Array.isArray(data) ? data : [] }))
      } catch {
        setReplies(r => ({ ...r, [ticketId]: [] }))
      } finally {
        setRepliesLoading(r => ({ ...r, [ticketId]: false }))
      }
    }
  }

  async function handleReply(ticketId) {
    const text = (replyText[ticketId] || '').trim()
    if (!text || sendingReply[ticketId]) return
    setSendingReply(s => ({ ...s, [ticketId]: true }))
    try {
      const reply = await addParentReply(ticketId, parentName, text)
      setReplies(r => ({ ...r, [ticketId]: [...(r[ticketId] || []), reply] }))
      setReplyText(r => ({ ...r, [ticketId]: '' }))
    } catch (err) {
      alert('Failed to send reply: ' + err.message)
    } finally {
      setSendingReply(s => ({ ...s, [ticketId]: false }))
    }
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div className="screen-nav">
          <button className="back-btn" onClick={() => onNavigate('home')}>←</button>
          <span className="screen-nav-title">Help & Support</span>
        </div>

        {/* Call quick link */}
        <a href="tel:+918001234567" className={styles.callBar}>
          <div className={styles.callIcon}>📞</div>
          <div>
            <div className={styles.callTitle}>Call School Office</div>
            <div className={styles.callSub}>Mon–Sat · 8 AM – 5 PM</div>
          </div>
          <span className={styles.callArrow}>→</span>
        </a>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[['raise','Raise Ticket'],['track','My Tickets'],['faq','FAQs']].map(([id, label]) => (
            <button
              key={id}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>

        {/* ── Raise Ticket ── */}
        {activeTab === 'raise' && (
          submitted ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✅</div>
              <div className={styles.successTitle}>Ticket Submitted!</div>
              <div className={styles.successSub}>
                We&apos;ve received your request. You&apos;ll get a response within 24 hours. Track it under &ldquo;My Tickets&rdquo;.
              </div>
              <button className={styles.btnAccent} onClick={resetForm}>Raise Another</button>
              <button className={styles.btnGhost} onClick={() => { resetForm(); setActiveTab('track') }}>
                Track Ticket
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <div className={styles.categoryGrid}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.catChip} ${category === c ? styles.catChipActive : ''}`}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Describe your issue</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Please describe the issue in detail…"
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 500))}
                  required
                />
                <span className={styles.charCount}>{description.length} / 500</span>
              </div>

              {submitError && (
                <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: -8 }}>{submitError}</div>
              )}

              <button
                type="submit"
                className={styles.btnAccent}
                disabled={!category || description.trim().length < 10 || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </form>
          )
        )}

        {/* ── My Tickets ── */}
        {activeTab === 'track' && (
          <div>
            {ticketsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-muted)' }}>
                Loading tickets…
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>No tickets yet</div>
                <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
                  Raise a support ticket and track responses here.
                </div>
                <button
                  className={styles.btnAccent}
                  style={{ marginTop: 20 }}
                  onClick={() => setActiveTab('raise')}
                >
                  Raise a Ticket
                </button>
              </div>
            ) : (
              tickets.map(t => {
                const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN
                const isOpen = expandedTicket === t.ticketId
                const ticketReplies = replies[t.ticketId] || []
                const loading = repliesLoading[t.ticketId]

                return (
                  <div key={t.ticketId} className={styles.ticketCard}>
                    <button
                      className={styles.ticketHeader}
                      onClick={() => toggleTicket(t.ticketId)}
                    >
                      <div className={styles.ticketTop}>
                        <span className={styles.ticketId}>#{t.ticketId}</span>
                        <span className={`${styles.ticketStatus} ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <div className={styles.ticketTitle}>{t.subject || t.category}</div>
                      <div className={styles.ticketMeta}>
                        <span className={styles.ticketCat}>{t.category}</span>
                        <span className={styles.ticketDate}>{fmtDate(t.createdAt)}</span>
                      </div>
                      <div className={styles.ticketChevron}>{isOpen ? '▲' : '▼'}</div>
                    </button>

                    {isOpen && (
                      <div className={styles.ticketBody}>
                        {/* Original description */}
                        <div className={styles.ticketDesc}>
                          <div className={styles.replyMeta}>Your message · {fmtDate(t.createdAt)}</div>
                          <div className={styles.replyContent}>{t.description}</div>
                        </div>

                        {/* Replies */}
                        {loading ? (
                          <div className={styles.replyLoading}>Loading replies…</div>
                        ) : ticketReplies.length > 0 ? (
                          <div className={styles.replyList}>
                            {ticketReplies.map(r => (
                              <div
                                key={r.replyId}
                                className={`${styles.replyItem} ${r.senderType === 'PARENT' ? styles.replyParent : styles.replyAdmin}`}
                              >
                                <div className={styles.replyMeta}>
                                  {r.senderType === 'PARENT' ? `You` : `School Staff · ${r.senderName}`}
                                  {' · '}{fmtDate(r.sentAt)} {fmtTime(r.sentAt)}
                                </div>
                                <div className={styles.replyContent}>{r.content}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.replyLoading}>No replies yet. We'll respond within 24 hours.</div>
                        )}

                        {/* Reply input — only if not CLOSED/RESOLVED */}
                        {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') && (
                          <div className={styles.replyInputWrap}>
                            <textarea
                              className={styles.replyInput}
                              placeholder="Write a follow-up message…"
                              rows={2}
                              value={replyText[t.ticketId] || ''}
                              onChange={e => setReplyText(r => ({ ...r, [t.ticketId]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleReply(t.ticketId)
                                }
                              }}
                              disabled={sendingReply[t.ticketId]}
                            />
                            <button
                              className={styles.replyBtn}
                              onClick={() => handleReply(t.ticketId)}
                              disabled={sendingReply[t.ticketId] || !(replyText[t.ticketId] || '').trim()}
                            >
                              {sendingReply[t.ticketId] ? '…' : 'Send'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── FAQs ── */}
        {activeTab === 'faq' && (
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} className={styles.faqItem}>
                <button
                  className={styles.faqQ}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className={styles.faqArrow}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className={styles.faqA}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
