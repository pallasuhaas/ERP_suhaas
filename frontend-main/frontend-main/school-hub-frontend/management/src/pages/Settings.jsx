import { useState } from 'react'
import styles from './Settings.module.css'

function Toggle({ on, onToggle }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onToggle}>
      <div className="toggle-thumb" />
    </button>
  )
}

const PERM_ROWS = [
  { module: 'Executive Dashboard',    view: true,  export: true,  admin: false },
  { module: 'Fee Analytics',         view: true,  export: true,  admin: false },
  { module: 'Transport Analytics',   view: true,  export: true,  admin: false },
  { module: 'Documents & Reports',   view: true,  export: true,  admin: true  },
  { module: 'Admin Portal Access',   view: false, export: false, admin: false },
]

export default function Settings({ onNavigate }) {
  const [notifs, setNotifs] = useState({
    weeklyReport: true,
    feeAlerts: true,
    transportAlerts: false,
    systemAlerts: true,
  })

  return (
    <div className={styles.grid}>
      {/* Profile */}
      <div className="card">
        <div className="section-head">Profile</div>
        <div className={styles.profileBanner}>
          <div className={styles.profileAvatar}>MG</div>
          <div>
            <div className={styles.profileName}>Manager</div>
            <div className={styles.profileRole}>Super User · Delhi Public School</div>
          </div>
          <button className="btn-secondary" style={{ marginLeft: 'auto' }}>Edit Profile</button>
        </div>
        <div className={styles.formGrid}>
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="Your name" /></div>
          <div className="form-group"><label className="form-label">Designation</label><input className="form-input" placeholder="e.g. Principal" /></div>
          <div className="form-group"><label className="form-label">Work Email</label><input className="form-input" type="email" placeholder="you@school.edu.in" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="+91" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary">Change Password</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="card">
        <div className="section-head">Notification Preferences</div>
        {[
          ['weeklyReport',   'Weekly analytics summary email'],
          ['feeAlerts',      'Fee milestone alerts (target reached)'],
          ['transportAlerts','Transport incident alerts'],
          ['systemAlerts',   'System maintenance & downtime alerts'],
        ].map(([key, label]) => (
          <div key={key} className={styles.prefRow}>
            <span>{label}</span>
            <Toggle on={notifs[key]} onToggle={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
          </div>
        ))}
      </div>

      {/* Access & permissions overview */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="section-head">Access & Permissions Overview</div>
        <div className={styles.permNote}>
          Your role is <strong>Super User (Read-Only Analytics)</strong>. Permissions are managed by the system administrator.
          To request changes, contact your Admin Portal administrator.
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>View Access</th>
                <th>Export Data</th>
                <th>Admin Controls</th>
              </tr>
            </thead>
            <tbody>
              {PERM_ROWS.map(r => (
                <tr key={r.module}>
                  <td><span style={{ fontWeight: 600 }}>{r.module}</span></td>
                  <td>{r.view  ? <span className="badge green">✓ Granted</span> : <span className="badge red">✕ Denied</span>}</td>
                  <td>{r.export? <span className="badge green">✓ Granted</span> : <span className="badge red">✕ Denied</span>}</td>
                  <td>{r.admin ? <span className="badge green">✓ Granted</span> : <span className="badge muted">Not applicable</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logout */}
      <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-danger" style={{ padding: '10px 24px' }} onClick={() => onNavigate('__logout__')}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  )
}
