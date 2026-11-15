import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import { getStudents } from '../api/students'
import { getInvoices } from '../api/finance'
import { getVehicles, getRoutes } from '../api/transport'

function formatINR(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString()}`
}

const QUICK = [
  { icon: '👥', label: 'Add Student',       sub: 'Enroll individually',  page: 'students' },
  { icon: '💰', label: 'Send Fee Reminder', sub: 'Bulk or by class',     page: 'finance' },
  { icon: '🚌', label: 'Assign Route',      sub: 'Student transport',    page: 'transport' },
  { icon: '💬', label: 'Message Parents',   sub: 'Broadcast or 1-to-1',  page: 'communication' },
]

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState({
    students: null, collected: null, outstanding: null, routes: null, vehicles: null,
  })
  const [recentStudents, setRecentStudents] = useState([])
  const [recentVehicles, setRecentVehicles] = useState([])

  useEffect(() => {
    Promise.all([
      getStudents().catch(() => []),
      getInvoices().catch(() => []),
      getVehicles().catch(() => []),
      getRoutes().catch(() => []),
    ]).then(([students, invoices, vehicles, routes]) => {
      const collected = invoices
        .filter(i => i.status === 'PAID')
        .reduce((s, i) => s + (i.totalAmount || 0), 0)
      const outstanding = invoices
        .filter(i => i.status !== 'PAID')
        .reduce((s, i) => s + (i.totalAmount || 0), 0)
      setData({
        students: students.length,
        collected,
        outstanding,
        routes: routes.length,
        vehicles: vehicles.length,
      })
      setRecentStudents(students.slice(-5).reverse())
      setRecentVehicles(vehicles.slice(0, 3))
    })
  }, [])

  const stats = [
    { label: 'Fee Collected', value: data.collected !== null ? formatINR(data.collected) : '…', icon: '💰', color: 'green',  trend: data.collected !== null ? `${data.collected === 0 ? 'No payments yet' : 'Paid invoices total'}` : '' },
    { label: 'Outstanding',   value: data.outstanding !== null ? formatINR(data.outstanding) : '…', icon: '⏳', color: 'orange', trend: data.outstanding !== null ? `${data.outstanding === 0 ? 'All clear' : 'Pending / unpaid'}` : '' },
    { label: 'Active Routes', value: data.routes !== null ? String(data.routes) : '…', icon: '🚌', color: 'blue',   trend: data.routes !== null ? (data.routes === 0 ? 'None created yet' : `Routes configured`) : '' },
    { label: 'Open Tickets',  value: '—',  icon: '🎫', color: 'red',    trend: 'Ticket system coming soon' },
    { label: 'Total Students',value: data.students !== null ? String(data.students) : '…', icon: '👥', color: 'teal',   trend: data.students !== null ? (data.students === 0 ? 'No students yet' : `Enrolled students`) : '' },
  ]

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Good morning, Admin 👋</div>
          <div className="page-sub">School Hub · AY 2025–26 · {today}</div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <div key={s.label} className={`stat-card ${styles.statCard}`}>
            <div className={styles.statTop}>
              <div className={`${styles.statIcon} ${styles[`icon_${s.color}`]}`}>{s.icon}</div>
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-trend">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        {/* Recent students */}
        <div className={`card ${styles.activityCard}`}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Recent Students</span>
            <button className="btn-ghost" onClick={() => onNavigate('students')}>View all →</button>
          </div>
          {recentStudents.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
              No students enrolled yet. <button className="btn-ghost" style={{ display: 'inline' }} onClick={() => onNavigate('students')}>Add students →</button>
            </div>
          ) : (
            <div className={styles.activityList}>
              {recentStudents.map(s => (
                <div key={s.studentId} className={styles.activityRow}>
                  <div className={`${styles.actIcon} ${styles.act_student}`}>👥</div>
                  <div className={styles.actText}>
                    <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                    <span style={{ color: 'var(--ink-muted)', marginLeft: 8, fontSize: 12 }}>
                      Grade {s.gradeLevel}{s.section ? ` · Section ${s.section}` : ''}
                    </span>
                  </div>
                  <div className={styles.actTime} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {s.admissionNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Quick actions */}
          <div className="card">
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Quick Actions</span>
            </div>
            <div className={styles.quickGrid}>
              {QUICK.map(q => (
                <button key={q.label} className={styles.quickCard} onClick={() => onNavigate(q.page)}>
                  <div className={styles.quickIcon}>{q.icon}</div>
                  <div className={styles.quickLabel}>{q.label}</div>
                  <div className={styles.quickSub}>{q.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fleet snapshot */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Fleet Snapshot</span>
              <button className="btn-ghost" onClick={() => onNavigate('transport')}>View all →</button>
            </div>
            {recentVehicles.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
                No vehicles registered yet. <button className="btn-ghost" style={{ display: 'inline' }} onClick={() => onNavigate('transport')}>Add vehicles →</button>
              </div>
            ) : (
              recentVehicles.map(v => (
                <div key={v.vehicleId} className={styles.busRow}>
                  <div>
                    <div className={styles.busRoute}>{v.registrationNumber}</div>
                    <div className={styles.busDriver}>Cap. {v.capacity} · {v.vehicleType}</div>
                  </div>
                  <span className={`badge ${v.status === 'ACTIVE' ? 'green' : 'red'}`}>
                    {v.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
