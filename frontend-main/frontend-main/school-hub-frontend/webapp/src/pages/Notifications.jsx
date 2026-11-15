import { useState, useEffect, useCallback } from 'react'
import styles from './Notifications.module.css'
import { getNotifications, markNotificationRead, markAllRead } from '../api/comms'

const TYPE_META = {
  FEE_REMINDER:      { icon: '💰', cls: 'fee'     },
  PAYMENT_CONFIRMED: { icon: '✅', cls: 'confirm'  },
  FEE_OVERDUE:       { icon: '⚠️', cls: 'fee'     },
  GENERAL:           { icon: '📢', cls: 'announce' },
  GPS_UPDATE:        { icon: '📍', cls: 'bus'      },
  ARRIVAL_ALERT:     { icon: '🏫', cls: 'bus'      },
  DELAY_ALERT:       { icon: '⏰', cls: 'bus'      },
  OTHER:             { icon: '🔔', cls: 'announce' },
}

function groupByDate(notifications) {
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const groups = {}
  notifications.forEach(n => {
    const d = n.sentAt ? new Date(n.sentAt) : new Date()
    d.setHours(0, 0, 0, 0)
    let label
    if (d >= today)      label = 'Today'
    else if (d >= yesterday) label = 'Yesterday'
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  })
  return groups
}

function fmtTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function Notifications({ activeChildId }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = useCallback(() => {
    if (!activeChildId) return
    setLoading(true)
    getNotifications(activeChildId)
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [activeChildId])

  useEffect(() => { load() }, [load])

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id)
      setNotifications(ns => ns.map(n => n.notificationId === id ? { ...n, isRead: true } : n))
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    if (!activeChildId || marking) return
    setMarking(true)
    try {
      await markAllRead(activeChildId)
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })))
    } catch { /* silent */ }
    finally { setMarking(false) }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const grouped = groupByDate(notifications)

  return (
    <div>
      <div className={styles.header}>
        <div className="screen-nav" style={{ marginBottom: 0 }}>
          <span className="screen-nav-title">Notifications</span>
          {unreadCount > 0 && (
            <button className={styles.markAll} onClick={handleMarkAllRead} disabled={marking}>
              {marking ? 'Marking…' : `Mark all read (${unreadCount})`}
            </button>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-muted, #888)' }}>
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>All caught up!</div>
            <div style={{ color: 'var(--ink-muted, #888)', fontSize: 13 }}>
              No notifications yet. Fee updates and school announcements will appear here.
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <div className={styles.groupLabel}>{label}</div>
              {items.map(n => {
                const meta = TYPE_META[n.triggerType] || TYPE_META.OTHER
                return (
                  <div
                    key={n.notificationId}
                    className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                    onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
                    style={{ cursor: !n.isRead ? 'pointer' : 'default' }}>
                    <div className={`${styles.icon} ${styles[meta.cls]}`}>{meta.icon}</div>
                    <div className={styles.text}>
                      <div className={styles.title}>{n.title || n.triggerType}</div>
                      <div className={styles.desc}>{n.message}</div>
                      <div className={styles.time}>{fmtTime(n.sentAt)}</div>
                    </div>
                    {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent, #E8521A)', flexShrink: 0, marginTop: 6 }} />}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
