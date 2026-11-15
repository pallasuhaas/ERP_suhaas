import { useState } from 'react'
import styles from './Settings.module.css'

function Toggle({ on, onToggle }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onToggle}>
      <div className="toggle-thumb" />
    </button>
  )
}

const USERS = [
  { name: 'Admin User',     email: 'admin@school.edu.in',   role: 'Super Admin', status: 'active' },
  { name: 'Ramesh Kumar',   email: 'ramesh@school.edu.in',  role: 'Finance',     status: 'active' },
  { name: 'Sunitha Reddy',  email: 'sunitha@school.edu.in', role: 'Transport',   status: 'active' },
  { name: 'Ajay Verma',     email: 'ajay@school.edu.in',    role: 'Reception',   status: 'inactive' },
]

export default function Settings({ onNavigate }) {
  const [notifs, setNotifs] = useState({ feeAlerts: true, transportAlerts: true, ticketAlerts: true, weeklyReport: false, systemAlerts: true })

  return (
    <div className={styles.settingsGrid}>
      {/* Profile */}
      <div className="card">
        <div className="section-head">Profile</div>
        <div className={styles.profileBanner}>
          <div className={styles.profileAvatar}>AD</div>
          <div>
            <div className={styles.profileName}>Admin User</div>
            <div className={styles.profileRole}>Super Admin · Delhi Public School</div>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" defaultValue="Admin User" /></div>
          <div className="form-group"><label className="form-label">Work Email</label><input className="form-input" type="email" defaultValue="admin@school.edu.in" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue="+91 98000 00001" /></div>
          <div className="form-group"><label className="form-label">Department</label><input className="form-input" defaultValue="Administration" /></div>
        </div>
        <div className={styles.changeRow}>
          <button className="btn-secondary">🔑 Change Password</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      {/* Notification prefs */}
      <div className="card">
        <div className="section-head">Notification Preferences</div>
        {[
          ['feeAlerts',       'Fee payment alerts'],
          ['transportAlerts', 'Transport & route alerts'],
          ['ticketAlerts',    'New ticket / incident alerts'],
          ['weeklyReport',    'Weekly summary report'],
          ['systemAlerts',    'System & maintenance alerts'],
        ].map(([key, label]) => (
          <div key={key} className={styles.prefRow}>
            <span className={styles.prefLabel}>{label}</span>
            <Toggle on={notifs[key]} onToggle={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
          </div>
        ))}
      </div>

      {/* User management */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className={styles.userMgmtHead}>
          <div className="section-head" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>User Management</div>
          <button className="btn-primary">+ Invite User</button>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {USERS.map(u => (
                <tr key={u.email}>
                  <td><span style={{ fontWeight: 600 }}>{u.name}</span></td>
                  <td>{u.email}</td>
                  <td><span className="badge blue">{u.role}</span></td>
                  <td><span className={`badge ${u.status === 'active' ? 'green' : 'muted'}`}>{u.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost">Edit</button>
                      {u.role !== 'Super Admin' && <button style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: 'var(--red)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>Deactivate</button>}
                    </div>
                  </td>
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
