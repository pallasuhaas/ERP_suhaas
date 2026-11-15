import { useState, useEffect } from 'react'
import { getStudentInvoices } from '../api/parent'
import styles from './Finance.module.css'

const STATUS_CONFIG = {
  PAID:      { label: 'Paid',      color: styles.statusPaid    },
  UNPAID:    { label: 'Unpaid',    color: styles.statusPending },
  OVERDUE:   { label: 'Overdue',   color: styles.statusFailed  },
  CANCELLED: { label: 'Cancelled', color: styles.statusFailed  },
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-IN')
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function feeLabel(inv) {
  const fs = inv.feeStructure
  if (fs?.feeName) return fs.feeName
  if (fs?.feeType) return fs.feeType
  return 'Fee'
}

export default function Finance({ onNavigate, initialTab, parentData, activeChildId }) {
  const [tab, setTab] = useState(initialTab === 'history' ? 'history' : 'fees')
  const [invoicesByChild, setInvoicesByChild] = useState([]) // [{child, invoices}]
  const [loading, setLoading] = useState(true)

  // Resolve active child — fall back to first child
  const activeChild = (parentData?.children || []).find(c => c.studentId === activeChildId)
    || parentData?.children?.[0]
    || null

  useEffect(() => {
    if (!activeChild) { setLoading(false); return }
    setLoading(true)
    getStudentInvoices(activeChild.studentId)
      .catch(() => [])
      .then(invs => setInvoicesByChild([{ child: activeChild, invoices: invs }]))
      .finally(() => setLoading(false))
  }, [activeChild?.studentId])

  // Flatten all invoices for totals & history
  const allInvoices = invoicesByChild.flatMap(r => r.invoices)
  const totalDue = allInvoices
    .filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE')
    .reduce((s, i) => s + (i.totalAmount || 0), 0)
  const totalPaid = allInvoices
    .filter(i => i.status === 'PAID')
    .reduce((s, i) => s + (i.totalAmount || 0), 0)
  const totalAnnual = totalPaid + totalDue
  const historyInvoices = [...allInvoices].sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div className="screen-nav">
          <button className="back-btn" onClick={() => onNavigate('home')}>←</button>
          <span className="screen-nav-title">Finance</span>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'fees' ? styles.tabActive : ''}`}
            onClick={() => setTab('fees')}
          >
            Fee Details
          </button>
          <button
            className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setTab('history')}
          >
            History & Receipts
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.body} style={{ textAlign: 'center', paddingTop: 40, color: '#888' }}>
          Loading fees…
        </div>
      ) : tab === 'fees' ? (
        <div className={styles.body}>
          {/* Summary card */}
          <div className={styles.summaryCard}>
            <div className={styles.scLabel}>
              {totalDue > 0 ? 'Total Outstanding' : 'All Fees Paid ✅'}
            </div>
            <div className={styles.scAmount}>₹{fmt(totalDue)}</div>
            <div className={styles.scPills}>
              <div className={styles.pill}><strong>₹{fmt(totalAnnual)}</strong> Total</div>
              <div className={styles.pill}><strong>₹{fmt(totalPaid)}</strong> Paid</div>
              <div className={`${styles.pill} ${totalDue > 0 ? styles.pillDue : ''}`}>
                <strong>₹{fmt(totalDue)}</strong> Due
              </div>
            </div>
          </div>

          {/* Per-child breakdowns */}
          {invoicesByChild.map(({ child, invoices }) => {
            if (!invoices.length) return null
            const childName = `${child.firstName || ''} ${child.lastName || ''}`.trim() || 'Child'
            const grade = child.grade ? `Grade ${child.grade}` : ''
            const section = child.section ? `· Sec ${child.section}` : ''
            return (
              <div key={child.studentId} className={styles.breakdown}>
                <div className={styles.breakdownTitle}>
                  {childName} {grade} {section}
                </div>
                {invoices.map(inv => {
                  const overdue = inv.status === 'OVERDUE'
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.UNPAID
                  return (
                    <div key={inv.invoiceId} className={styles.feeItem}>
                      <div>
                        <div className={styles.fiName}>{feeLabel(inv)}</div>
                        <div className={styles.fiType}>Due {fmtDate(inv.dueDate)}</div>
                      </div>
                      <div className={styles.fiRight}>
                        <div className={`${styles.fiAmount} ${overdue ? styles.overdue : ''}`}>
                          ₹{fmt(inv.totalAmount)}
                        </div>
                        <span className={`${styles.histStatus} ${cfg.color}`}>{cfg.label}</span>
                        {overdue && <span className={styles.overdueTag}>OVERDUE</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Pay bar */}
          {totalDue > 0 && (
            <div className={styles.payBar}>
              <button className={styles.payBtn}>⚡ Pay ₹{fmt(totalDue)} Now</button>
              <div className={styles.payMethods}>
                <span className={styles.payTag}>UPI</span>
                <span className={styles.payTag}>Cards</span>
                <span className={styles.payTag}>Net Banking</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.historyHeader}>
            <span className={styles.historyCount}>{historyInvoices.length} transactions</span>
            <span className={styles.historyYear}>AY 2025–26</span>
          </div>

          {historyInvoices.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', paddingTop: 32 }}>
              No transaction history yet.
            </div>
          )}

          {historyInvoices.map((h, i) => {
            const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.UNPAID
            const icon = h.status === 'PAID' ? '✓' : h.status === 'OVERDUE' ? '⚠' : '…'
            const childName = (() => {
              const c = parentData?.children?.find(ch => ch.studentId === h.studentId)
              return c ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : ''
            })()
            return (
              <div
                key={h.invoiceId ?? i}
                className={`${styles.histItem} ${h.status === 'OVERDUE' ? styles.histFailed : ''}`}
              >
                <div className={styles.histLeft}>
                  <div className={`${styles.histIcon} ${h.status === 'PAID' ? styles.hist_paid : h.status === 'OVERDUE' ? styles.hist_failed : styles.hist_pending}`}>
                    {icon}
                  </div>
                  <div>
                    <div className={styles.histName}>{feeLabel(h)}</div>
                    <div className={styles.histDate}>
                      {fmtDate(h.invoiceDate)}{childName ? ` · ${childName}` : ''}
                    </div>
                  </div>
                </div>
                <div className={styles.histRight}>
                  <div className={styles.histAmount}>₹{fmt(h.totalAmount)}</div>
                  <div className={`${styles.histStatus} ${cfg.color}`}>{cfg.label}</div>
                  {h.status === 'PAID' && (
                    <button
                      className={styles.receiptBtn}
                      onClick={() => onNavigate('receipt')}
                    >
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
