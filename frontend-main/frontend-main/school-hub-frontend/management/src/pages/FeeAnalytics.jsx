import { useState } from 'react'
import styles from './FeeAnalytics.module.css'

/* Column definitions — no data, just schema */
const FEE_FORECAST_COLS  = ['Month', 'Fee Category', 'Expected (₹)', 'Actual Collected (₹)', 'Variance (₹)', 'Forecast Accuracy %']
const PAYMENT_BEHAV_COLS = ['Student ID', 'Name', 'Class', 'Days to Pay (avg)', 'Payment Mode', 'Behaviour Tag']
const DEFAULTER_COLS     = ['Student ID', 'Name', 'Class', 'Overdue Since', 'Overdue Amount (₹)', 'Attempts']
const DISCOUNT_COLS      = ['Student ID', 'Name', 'Discount Type', 'Discount %', 'Approved Amount (₹)', 'Approved By']
const TICKET_COLS        = ['Ticket ID', 'Category', 'Student', 'Status', 'Opened On', 'Resolved On', 'Resolution Time']

function EmptyTable({ cols }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td colSpan={cols.length}>
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <div className="empty-title">No data yet</div>
                <div className="empty-sub">This table will populate once the backend API is connected.</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ChartBox({ label, hint, height = 200 }) {
  return (
    <div className="chart-placeholder" style={{ height }}>
      <div className="chart-icon">📊</div>
      <div className="chart-label">{label}</div>
      <div className="chart-hint">{hint}</div>
    </div>
  )
}

export default function FeeAnalytics() {
  const [tab, setTab] = useState('forecast')

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Fee Analytics</div>
          <div className="page-sub">Revenue insights · Read-only · Data loads from backend API</div>
        </div>
        <button className="btn-secondary">⬇ Export Report</button>
      </div>

      <div className="tab-bar">
        {[
          ['forecast',   '📊 Fee Forecasting'],
          ['behaviour',  '💳 Payment Behaviour'],
          ['discounts',  '🏷️ Discount Reports'],
          ['tickets',    '🎫 Tickets Report'],
        ].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Fee Forecasting ── */}
      {tab === 'forecast' && (
        <div>
          <div className={styles.filterRow}>
            <select className="filter-select"><option>AY 2025–26</option></select>
            <select className="filter-select"><option>All Categories</option><option>Tuition Fee</option><option>Transport Fee</option><option>Activity Fee</option></select>
            <select className="filter-select"><option>All Months</option></select>
          </div>

          <div className={styles.kpiRow}>
            {[
              { label: 'Annual Fee Target',      icon: '🎯', api: 'fee_target_annual' },
              { label: 'Expected (this month)',   icon: '📅', api: 'fee_expected_month' },
              { label: 'Actual Collected',        icon: '✅', api: 'fee_collected_actual' },
              { label: '% of Forecast Collected', icon: '📈', api: 'forecast_pct' },
            ].map(k => (
              <div key={k.label} className={`kpi-card ${styles.miniKpi}`}>
                <div className="kpi-label">{k.label}</div>
                <div className={styles.miniKpiValue}>—</div>
                <div className={styles.apiTag}><code>{k.api}</code></div>
              </div>
            ))}
          </div>

          <div className={styles.twoCol}>
            <div className="card">
              <div className={styles.cardTitle}>Expected vs Actual (Monthly)</div>
              <div className={styles.cardSub}>Month-wise revenue forecast vs collected</div>
              <ChartBox label="Bar / Line chart — Expected vs Actual" hint="Connects to /api/analytics/fee/monthly-trend" height={220} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Variance by Fee Category</div>
              <div className={styles.cardSub}>Deviation from target per category</div>
              <ChartBox label="Grouped bar — category variance" hint="Connects to /api/analytics/fee/category-variance" height={220} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.cardTitle}>Forecast Detail Table</div>
            <div className={styles.cardSub} style={{ marginBottom: 14 }}>Row-level monthly forecast vs actuals</div>
            <EmptyTable cols={FEE_FORECAST_COLS} />
          </div>
        </div>
      )}

      {/* ── Payment Behaviour ── */}
      {tab === 'behaviour' && (
        <div>
          <div className={styles.kpiRow}>
            {[
              { label: 'Paying Early',   icon: '⚡', api: 'pct_early',    color: 'green' },
              { label: 'Paying On-Time', icon: '✅', api: 'pct_on_time',  color: 'blue' },
              { label: 'Paying Late',    icon: '⏰', api: 'pct_late',     color: 'orange' },
              { label: 'Repeat Defaulters', icon: '🤖', api: 'defaulter_count', color: 'red' },
            ].map(k => (
              <div key={k.label} className={`kpi-card ${styles.miniKpi} ${styles[`kpi_${k.color}`]}`}>
                <div className="kpi-label">{k.label}</div>
                <div className={styles.miniKpiValue}>—</div>
                <div className={styles.apiTag}><code>{k.api}</code></div>
              </div>
            ))}
          </div>

          <div className={styles.threeCol}>
            <div className="card">
              <div className={styles.cardTitle}>Payment Timing Split</div>
              <ChartBox label="Donut — Early / On-time / Late" hint="/api/analytics/fee/payment-timing" height={180} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Payment Mode Distribution</div>
              <ChartBox label="Pie — UPI / Card / Net Banking / Cash" hint="/api/analytics/fee/payment-mode" height={180} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Monthly Late Payment Trend</div>
              <ChartBox label="Line chart — late payment count per month" hint="/api/analytics/fee/late-trend" height={180} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.sectionRow}>
              <div>
                <div className={styles.cardTitle}>Repeat Defaulters <span className={styles.aiTag}>🤖 AI flagged</span></div>
                <div className={styles.cardSub}>Students consistently paying late or not paying — AI-identified patterns</div>
              </div>
              <button className="btn-secondary">⬇ Export</button>
            </div>
            <EmptyTable cols={DEFAULTER_COLS} />
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.sectionRow}>
              <div>
                <div className={styles.cardTitle}>Individual Payment Behaviour</div>
                <div className={styles.cardSub}>Per-student payment pattern breakdown</div>
              </div>
            </div>
            <EmptyTable cols={PAYMENT_BEHAV_COLS} />
          </div>
        </div>
      )}

      {/* ── Discount Reports ── */}
      {tab === 'discounts' && (
        <div>
          <div className={styles.filterRow}>
            <select className="filter-select"><option>All Discount Types</option><option>Sibling Discount</option><option>Merit Scholarship</option><option>Staff Concession</option><option>Need-based</option></select>
            <select className="filter-select"><option>AY 2025–26</option></select>
            <button className="btn-secondary">⬇ Export</button>
          </div>

          <div className={styles.kpiRow}>
            {[
              { label: 'Total Discount Value',      api: 'discount_total_value' },
              { label: 'Students on Discount',      api: 'discount_student_count' },
              { label: 'Discount vs Fee Target %',  api: 'discount_pct_of_target' },
              { label: 'Highest Discount Category', api: 'discount_top_category' },
            ].map(k => (
              <div key={k.label} className={`kpi-card ${styles.miniKpi}`}>
                <div className="kpi-label">{k.label}</div>
                <div className={styles.miniKpiValue}>—</div>
                <div className={styles.apiTag}><code>{k.api}</code></div>
              </div>
            ))}
          </div>

          <div className={styles.twoCol}>
            <div className="card">
              <div className={styles.cardTitle}>By Discount Category</div>
              <ChartBox label="Bar chart — students per discount type" hint="/api/analytics/discounts/by-category" height={200} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Total Value vs Fee Target</div>
              <ChartBox label="Gauge / stacked bar — discount value vs target" hint="/api/analytics/discounts/value-vs-target" height={200} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.cardTitle}>Discount Detail</div>
            <div className={styles.cardSub} style={{ marginBottom: 14 }}>All approved discounts with student-level breakdown</div>
            <EmptyTable cols={DISCOUNT_COLS} />
          </div>
        </div>
      )}

      {/* ── Tickets Report ── */}
      {tab === 'tickets' && (
        <div>
          <div className={styles.kpiRow}>
            {[
              { label: 'Total Open',        icon: '🔴', api: 'tickets_open',        color: 'red' },
              { label: 'In Progress',       icon: '🟠', api: 'tickets_in_progress', color: 'orange' },
              { label: 'Resolved',          icon: '🟢', api: 'tickets_resolved',    color: 'green' },
              { label: 'Avg Resolution Time',icon: '⏱', api: 'tickets_avg_ttc',    color: '' },
            ].map(k => (
              <div key={k.label} className={`kpi-card ${styles.miniKpi} ${k.color ? styles[`kpi_${k.color}`] : ''}`}>
                <div className="kpi-label">{k.icon} {k.label}</div>
                <div className={styles.miniKpiValue}>—</div>
                <div className={styles.apiTag}><code>{k.api}</code></div>
              </div>
            ))}
          </div>

          <div className={styles.twoCol}>
            <div className="card">
              <div className={styles.cardTitle}>Category Breakdown + Sparklines</div>
              <div className={styles.cardSub} style={{ marginBottom: 14 }}>Ticket volume by category with trend sparkline</div>
              {['Finance', 'Transport', 'Attendance', 'ID Card', 'Other'].map(cat => (
                <div key={cat} className={styles.sparkRow}>
                  <span className={styles.sparkCat}>{cat}</span>
                  <div className={styles.sparkBar}><div className={styles.sparkFill} style={{ width: '0%' }} /></div>
                  <span className={styles.sparkVal}>—</span>
                  <div className={styles.sparkline}>
                    {[0,0,0,0,0,0,0,0].map((_, i) => <div key={i} className={styles.sparkDot} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Ticket Volume Over Time</div>
              <ChartBox label="Line chart — open / resolved per week" hint="/api/analytics/tickets/timeline" height={200} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.filterRow} style={{ marginBottom: 14 }}>
              <input className="search-input" placeholder="Search tickets…" />
              <select className="filter-select"><option>All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select>
              <select className="filter-select"><option>All Categories</option></select>
            </div>
            <EmptyTable cols={TICKET_COLS} />
          </div>
        </div>
      )}
    </div>
  )
}
