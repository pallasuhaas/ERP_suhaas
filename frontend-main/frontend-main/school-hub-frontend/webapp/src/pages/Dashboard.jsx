import { useState, useEffect } from 'react'
import { getStudentInvoices, getStudentTransport } from '../api/parent'
import styles from './Dashboard.module.css'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-IN')
}

export default function Dashboard({ onNavigate, parentData, activeChildId }) {
  const [invoices, setInvoices] = useState([])
  const [transports, setTransports] = useState([])
  const [loading, setLoading] = useState(true)

  // Resolve active child — fall back to first child
  const activeChild = (parentData?.children || []).find(c => c.studentId === activeChildId)
    || parentData?.children?.[0]
    || null

  useEffect(() => {
    if (!activeChild) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getStudentInvoices(activeChild.studentId).catch(() => []),
      getStudentTransport(activeChild.studentId).catch(() => []),
    ]).then(([invs, trns]) => {
      setInvoices(invs)
      setTransports(trns)
    }).finally(() => setLoading(false))
  }, [activeChild?.studentId])

  const guardianName = parentData?.name || 'Parent'
  const initials = parentData?.initials || 'P'

  // Fee summary — sum UNPAID / OVERDUE invoices
  const pendingInvoices = invoices.filter(inv =>
    inv.status === 'UNPAID' || inv.status === 'OVERDUE'
  )
  const totalDue = pendingInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0)
  const nextDue = [...pendingInvoices].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
  const nextDueDateStr = nextDue
    ? new Date(nextDue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // First active transport assignment for the active child
  const firstTransport = transports.find(t => !t.effectiveTo) || transports[0] || null
  const routeName = firstTransport?.route?.routeName || null
  const childFirstName = activeChild?.firstName || 'Child'

  return (
    <div>
      {/* Dark header */}
      <div className={styles.header}>
        <div className={styles.headerDecor} />
        <div className={styles.headerTop}>
          <div>
            <div className={styles.greeting}>{getGreeting()}</div>
            <div className={styles.name}>{guardianName}</div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.notifBtn}
              onClick={() => onNavigate('alerts')}
              aria-label="Notifications"
            >
              🔔
              <span className={styles.notifDot} />
            </button>
            <button
              className={styles.avatarBtn}
              onClick={() => onNavigate('settings')}
              aria-label="Settings"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* Fee due card */}
        <div className={styles.feeCard}>
          <div className={styles.feeLabel}>
            {loading ? 'Loading fees…' : totalDue > 0 ? 'Total Fees Due' : 'Fees'}
          </div>
          <div className={styles.feeAmount}>
            <span>₹</span>{loading ? '—' : fmt(totalDue)}
          </div>
          <div className={styles.feeDueRow}>
            <span className={styles.feeDueDate}>
              {nextDueDateStr
                ? `📅 Due: ${nextDueDateStr}`
                : (!loading && totalDue === 0 ? '✅ All fees paid' : '')}
            </span>
            {totalDue > 0 && (
              <button className={styles.payBtn} onClick={() => onNavigate('fees')}>
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Bus status */}
        {routeName && (
          <>
            <div className="section-title">Bus Status</div>
            <div className={styles.busCard}>
              <div className={styles.busCardTop}>
                <div>
                  <div className={styles.busLabel}>🚌 {childFirstName}&apos;s Bus</div>
                  <div className={styles.busNumber}>{routeName}</div>
                </div>
                <div className={styles.liveBadge}>ASSIGNED</div>
              </div>
              <div className={styles.etaRow}>
                <span className={styles.etaText}>
                  📍 {firstTransport.pickupPoint}
                </span>
                <button className={styles.trackLink} onClick={() => onNavigate('bus')}>
                  View details →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Quick links */}
        <div className="section-title">Quick Access</div>
        <div className={styles.quickGrid}>
          <button className={`${styles.qlItem} ${styles.qlFee}`} onClick={() => onNavigate('fees')}>
            <div className={styles.qlIcon}>💰</div>
            <div className={styles.qlLabel}>Fee Payment</div>
            <div className={styles.qlSub}>
              {loading ? 'Loading…' : totalDue > 0 ? `₹${fmt(totalDue)} pending` : 'All clear'}
            </div>
          </button>
          <button className={`${styles.qlItem} ${styles.qlBus}`} onClick={() => onNavigate('bus')}>
            <div className={styles.qlIcon}>🗺️</div>
            <div className={styles.qlLabel}>Transport</div>
            <div className={styles.qlSub}>{routeName || 'No route assigned'}</div>
          </button>
          <button className={`${styles.qlItem} ${styles.qlMsg}`} onClick={() => onNavigate('chat')}>
            <div className={styles.qlIcon}>💬</div>
            <div className={styles.qlLabel}>Messages</div>
            <div className={styles.qlSub}>School communication</div>
          </button>
          <button className={`${styles.qlItem} ${styles.qlHistory}`} onClick={() => onNavigate('history')}>
            <div className={styles.qlIcon}>🧾</div>
            <div className={styles.qlLabel}>Receipts</div>
            <div className={styles.qlSub}>Payment history</div>
          </button>
        </div>

        {/* Help & Raise Ticket — prominent card */}
        <div className={styles.helpCard}>
          <div className={styles.helpLeft}>
            <div className={styles.helpIcon}>🎫</div>
            <div>
              <div className={styles.helpTitle}>Help & Support</div>
              <div className={styles.helpSub}>Raise a ticket · Track status · FAQs</div>
            </div>
          </div>
          <button
            className={styles.helpBtn}
            onClick={() => onNavigate('help')}
          >
            Get Help
          </button>
        </div>
      </div>
    </div>
  )
}
