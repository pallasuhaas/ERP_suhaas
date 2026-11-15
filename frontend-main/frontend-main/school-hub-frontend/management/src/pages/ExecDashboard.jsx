import styles from './ExecDashboard.module.css'

const KPIS = [
  { label: 'Fee Target (AY)',       icon: '🎯', color: 'purple', api: 'fee_target_annual' },
  { label: 'Collected (AY)',        icon: '✅', color: 'green',  api: 'fee_collected_annual' },
  { label: 'Outstanding',           icon: '⏳', color: 'orange', api: 'fee_outstanding' },
  { label: 'Transport Utilisation', icon: '🚌', color: 'blue',   api: 'transport_utilisation_pct', unit: '%' },
  { label: 'Total Students',        icon: '👥', color: 'teal',   api: 'students_total' },
]

const TREND_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

export default function ExecDashboard({ onNavigate }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Executive Dashboard</div>
          <div className="page-sub">Top-level KPIs at a glance · Data loads from backend API</div>
        </div>
        <button className="btn-secondary">⬇ Export Summary</button>
      </div>

      {/* KPI row */}
      <div className={styles.kpiGrid}>
        {KPIS.map(k => (
          <div key={k.label} className={`kpi-card ${styles.kpiCard} ${styles[`kpi_${k.color}`]}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <div className={`${styles.kpiIcon} ${styles[`icon_${k.color}`]}`}>{k.icon}</div>
            </div>
            <div className={styles.kpiValue}>—</div>
            <div className={styles.kpiApi}>API: <code>{k.api}</code></div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Monthly collection trend */}
        <div className="card">
          <div className={styles.chartHead}>
            <div>
              <div className={styles.chartTitle}>Monthly Collection Trend</div>
              <div className={styles.chartSub}>Fee target vs collected vs outstanding per month</div>
            </div>
            <select className="filter-select">
              <option>AY 2025–26</option>
            </select>
          </div>
          <div className={styles.barChartArea}>
            <div className={styles.barChartAxis}>
              {['100%','75%','50%','25%','0'].map(l => <div key={l} className={styles.axisLabel}>{l}</div>)}
            </div>
            <div className={styles.barChartBars}>
              {TREND_MONTHS.map(m => (
                <div key={m} className={styles.barGroup}>
                  <div className={styles.barWrap}>
                    <div className={`${styles.bar} ${styles.barTarget}`} style={{ height: '70%' }} />
                    <div className={`${styles.bar} ${styles.barCollected}`} style={{ height: '0%' }} />
                  </div>
                  <div className={styles.barLabel}>{m}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.chartLegend}>
            <span className={`${styles.legendDot} ${styles.ldTarget}`} />Target
            <span className={`${styles.legendDot} ${styles.ldCollected}`} />Collected
            <span className={`${styles.legendDot} ${styles.ldOutstanding}`} />Outstanding
            <div className={styles.legendNote}>* Bars will fill once connected to backend</div>
          </div>
        </div>

        {/* Right column — mini KPI cards */}
        <div className={styles.rightCol}>
          <div className="card">
            <div className={styles.chartTitle} style={{ marginBottom: 14 }}>% of Fee Target Collected</div>
            <div className={styles.donutWrap}>
              <svg viewBox="0 0 80 80" className={styles.donut}>
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--surface2)" strokeWidth="10" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--accent)" strokeWidth="10"
                  strokeDasharray="0 188.5" strokeLinecap="round"
                  transform="rotate(-90 40 40)" />
              </svg>
              <div className={styles.donutCenter}>
                <div className={styles.donutValue}>—%</div>
                <div className={styles.donutSub}>collected</div>
              </div>
            </div>
            <div className={styles.progressNote}>Will update from API</div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.chartTitle} style={{ marginBottom: 12 }}>Quick Navigation</div>
            {[
              { label: 'Fee Forecasting',  icon: '📊', page: 'fee' },
              { label: 'Route Performance',icon: '🗺️', page: 'transport' },
              { label: 'Document Library', icon: '📂', page: 'documents' },
            ].map(q => (
              <button key={q.label} className={styles.quickRow} onClick={() => onNavigate(q.page)}>
                <span>{q.icon}</span>
                <span>{q.label}</span>
                <span className={styles.quickArrow}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
