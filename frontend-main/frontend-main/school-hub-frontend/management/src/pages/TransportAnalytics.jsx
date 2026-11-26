import { useState } from 'react'
import styles from './TransportAnalytics.module.css'

const ROUTE_COLS    = ['Route', 'Occupancy %', 'On-Time %', 'Incidents (30d)', 'Avg Delay (min)', 'Status', 'Action']
const FUEL_COLS     = ['Vehicle Reg', 'Route', 'Fuel Cost (₹)', 'KMs Covered', 'Cost per KM', 'Month', 'vs Prior Month']
const INCIDENT_COLS = ['Incident ID', 'Route / Bus', 'Severity', 'Description', 'Reported On', 'Status', 'Action']

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
                <div className="empty-sub">Connects to backend API — data will appear once integrated.</div>
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

export default function TransportAnalytics() {
  const [tab, setTab] = useState('routes')

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transport Analytics</div>
          <div className="page-sub">Fleet insights · Read-only · Data loads from backend API</div>
        </div>
        <button className="btn-secondary">⬇ Export Report</button>
      </div>

      <div className="tab-bar">
        {[
          ['routes',    '🗺️ Route Performance'],
          ['fuel',      '⛽ Fuel & Expense'],
          ['incidents', '⚠️ Incident Review'],
          ['gps',       '📍 Live GPS'],
        ].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Route Performance ── */}
      {tab === 'routes' && (
        <div>
          <div className={styles.kpiRow}>
            {[
              { label: 'Active Routes',      api: 'transport_routes_active' },
              { label: 'Avg Occupancy %',    api: 'transport_avg_occupancy' },
              { label: 'On-Time Rate (avg)', api: 'transport_ontime_pct' },
              { label: 'Underperforming',    api: 'transport_underperforming_count' },
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
              <div className={styles.cardTitle}>Per-Route Occupancy %</div>
              <ChartBox label="Horizontal bar — occupancy per route" hint="/api/analytics/transport/route-occupancy" height={200} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>On-Time % per Route</div>
              <ChartBox label="Bar chart — on-time rate per route" hint="/api/analytics/transport/ontime-by-route" height={200} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.sectionRow}>
              <div>
                <div className={styles.cardTitle}>Route Performance Table</div>
                <div className={styles.cardSub}>Per-route breakdown — underperforming routes flagged automatically</div>
              </div>
              <button className="btn-secondary">⬇ Export Route Report</button>
            </div>
            <EmptyTable cols={ROUTE_COLS} />
          </div>
        </div>
      )}

      {/* ── Fuel & Expense ── */}
      {tab === 'fuel' && (
        <div>
          <div className={styles.kpiRow}>
            {[
              { label: 'Total Transport OpEx',     api: 'transport_total_opex' },
              { label: 'Avg Fuel Cost / Vehicle',  api: 'transport_avg_fuel_per_vehicle' },
              { label: 'Month-on-Month Variance %', api: 'transport_fuel_mom_variance' },
              { label: 'Highest Cost Route',        api: 'transport_highest_cost_route' },
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
              <div className={styles.cardTitle}>Monthly Fuel Cost per Vehicle</div>
              <ChartBox label="Multi-line — fuel cost per vehicle over months" hint="/api/analytics/transport/fuel-monthly" height={210} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Month-on-Month Variance</div>
              <ChartBox label="Bar chart — opex variance vs prior month" hint="/api/analytics/transport/fuel-variance" height={210} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.filterRow}>
              <select className="filter-select"><option>All Vehicles</option></select>
              <select className="filter-select"><option>Last 6 months</option><option>Last 12 months</option></select>
            </div>
            <EmptyTable cols={FUEL_COLS} />
          </div>
        </div>
      )}

      {/* ── Incident Review ── */}
      {tab === 'incidents' && (
        <div>
          <div className={styles.kpiRow}>
            {[
              { label: 'Total Incidents (30d)', api: 'incidents_total_30d',    color: '' },
              { label: 'High Severity',         api: 'incidents_high_severity', color: 'red' },
              { label: 'Medium Severity',       api: 'incidents_medium',       color: 'orange' },
              { label: 'Resolved',              api: 'incidents_resolved',     color: 'green' },
            ].map(k => (
              <div key={k.label} className={`kpi-card ${styles.miniKpi} ${k.color ? styles[`kpi_${k.color}`] : ''}`}>
                <div className="kpi-label">{k.label}</div>
                <div className={styles.miniKpiValue}>—</div>
                <div className={styles.apiTag}><code>{k.api}</code></div>
              </div>
            ))}
          </div>

          <div className={styles.twoCol}>
            <div className="card">
              <div className={styles.cardTitle}>Incidents by Severity</div>
              <ChartBox label="Donut — High / Medium / Low severity split" hint="/api/analytics/incidents/severity-split" height={180} />
            </div>
            <div className="card">
              <div className={styles.cardTitle}>Incidents by Route / Bus</div>
              <ChartBox label="Bar — incident count per route" hint="/api/analytics/incidents/by-route" height={180} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className={styles.sectionRow}>
              <div>
                <div className={styles.cardTitle}>All Incidents</div>
                <div className={styles.cardSub}>Drill down by route or severity. Full incident report can be exported.</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="filter-select"><option>All Severities</option><option>High</option><option>Medium</option><option>Low</option></select>
                <button className="btn-secondary">⬇ Full Report</button>
              </div>
            </div>
            <EmptyTable cols={INCIDENT_COLS} />
          </div>
        </div>
      )}

      {/* ── Live GPS ── */}
      {tab === 'gps' && (
        <div>
          <div className={styles.readOnlyBanner}>
            <span className={styles.readOnlyIcon}>👁️</span>
            <div>
              <div className={styles.readOnlyTitle}>View-Only Mode</div>
              <div className={styles.readOnlyDesc}>This map is read-only. Operational controls (reassign, alert, message) are available in the Admin Portal.</div>
            </div>
          </div>

          <div className={styles.kpiRow} style={{ marginBottom: 16 }}>
            {[
              { label: 'Active Vehicles',  api: 'fleet_active_count' },
              { label: 'Delayed',          api: 'fleet_delayed_count' },
              { label: 'Offline',          api: 'fleet_offline_count' },
              { label: 'Students on Board',api: 'fleet_students_onboard' },
            ].map(k => (
              <div key={k.label} className={`kpi-card ${styles.miniKpi}`}>
                <div className="kpi-label">{k.label}</div>
                <div className={styles.miniKpiValue}>—</div>
                <div className={styles.apiTag}><code>{k.api}</code></div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className={styles.mapHeader}>
              <span className={styles.mapTitle}>Real-Time Fleet Map</span>
              {/* BUG-024: no GPS feed is connected; the pins are placeholders */}
              <span className={styles.liveBadge} title="Placeholder map: GPS feed not connected yet">PREVIEW</span>
            </div>
            <div className={styles.mapArea}>
              <div className={styles.mapGrid} />
              {/* Road lines */}
              <div className={styles.road} style={{ top: '35%', left: 0, right: 0, height: 3 }} />
              <div className={styles.road} style={{ left: '40%', top: 0, bottom: 0, width: 3 }} />
              {/* Placeholder pins */}
              {[{l:'20%',t:'30%'},{l:'55%',t:'55%'},{l:'70%',t:'28%'},{l:'35%',t:'70%'}].map((p,i) => (
                <div key={i} className={styles.busPin} style={{ left: p.l, top: p.t }}>🚌</div>
              ))}
              <div className={styles.mapOverlay}>
                <div className={styles.mapOverlayText}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>📡</div>
                  <div>Live vehicle positions load from GPS API</div>
                  <code style={{ fontSize: 11, opacity: 0.6, marginTop: 4, display: 'block' }}>GET /api/transport/fleet/live</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
