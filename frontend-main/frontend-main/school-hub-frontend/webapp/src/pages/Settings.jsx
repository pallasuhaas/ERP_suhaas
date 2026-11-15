import { useState } from 'react'
import styles from './Settings.module.css'

function Toggle({ on, onToggle }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={onToggle}
      aria-checked={on}
      role="switch"
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

function SettingRow({ icon, label, desc, value, onClick }) {
  return (
    <div className={styles.row} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={styles.rowIcon}>{icon}</div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {desc && <div className={styles.rowDesc}>{desc}</div>}
      </div>
      {value && <span className={styles.rowValue}>{value}</span>}
      {onClick && <span className={styles.rowArrow}>›</span>}
    </div>
  )
}

export default function Settings({ onNavigate, parentData }) {
  const [notifs, setNotifs] = useState({
    feeReminders: true,
    busAlerts: true,
    dropPickup: true,
    announcements: false,
    paymentConfirm: true,
  })
  const [language, setLanguage] = useState('English')

  function toggle(key) {
    setNotifs(n => ({ ...n, [key]: !n[key] }))
  }

  const guardianName = parentData?.name || 'Parent'
  const guardianPhone = parentData?.phone
    ? `+91 ${parentData.phone.slice(0, 5)} ${parentData.phone.slice(5)}`
    : ''
  const initials = parentData?.initials || 'P'
  const children = parentData?.children || []

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div className="screen-nav" style={{ marginBottom: 0 }}>
          <button className="back-btn" onClick={() => onNavigate('home')}>←</button>
          <span className="screen-nav-title">Settings</span>
        </div>
      </div>

      {/* Profile banner */}
      <div className={styles.profileBanner}>
        <div className={styles.avatar}>{initials}</div>
        <div>
          <div className={styles.profileName}>{guardianName}</div>
          <div className={styles.profilePhone}>{guardianPhone}</div>
        </div>
        <button className={styles.editBtn}>Edit</button>
      </div>

      <div className={styles.body}>
        {/* Account */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Account</div>
          <div className={styles.card}>
            <SettingRow icon="👤" label="Profile & Contact Info" desc="Name, email, address" onClick={() => {}} />
            <SettingRow icon="🔐" label="Change Mobile / Password" desc="Login credentials" onClick={() => {}} />
          </div>
        </div>

        {/* Linked Children */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>My Children</div>
          <div className={styles.card}>
            {children.length === 0 ? (
              <div style={{ padding: '12px 0', color: '#888', fontSize: 14 }}>
                No children linked to this account.
              </div>
            ) : children.map(child => {
              const name = `${child.firstName || ''} ${child.lastName || ''}`.trim() || 'Child'
              const grade = child.grade ? `Grade ${child.grade}` : ''
              const section = child.section ? `· Sec ${child.section}` : ''
              const admission = child.admissionNumber ? `· ${child.admissionNumber}` : ''
              const letter = (child.firstName || 'C')[0].toUpperCase()
              return (
                <div key={child.studentId} className={styles.childRow}>
                  <div className={styles.childAvatar}>{letter}</div>
                  <div className={styles.childInfo}>
                    <div className={styles.childName}>{name}</div>
                    <div className={styles.childMeta}>{[grade, section, admission].filter(Boolean).join(' ')}</div>
                  </div>
                  <span className={styles.childActive}>Active</span>
                </div>
              )
            })}
            <button className={styles.addChildBtn}>+ Add Another Child</button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Saved Payments</div>
          <div className={styles.card}>
            <div className={styles.payRow}>
              <div className={styles.payIcon}>📱</div>
              <div>
                <div className={styles.payLabel}>UPI</div>
                <div className={styles.payMeta}>Primary method</div>
              </div>
              <span className={styles.payPrimary}>Primary</span>
            </div>
            <button className={styles.addPayBtn}>+ Add Payment Method</button>
          </div>
        </div>

        {/* Notification toggles */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Notifications</div>
          <div className={styles.card}>
            {[
              { key: 'feeReminders',   icon: '💰', label: 'Fee Reminders',         desc: 'Upcoming & overdue fees' },
              { key: 'busAlerts',      icon: '🚌', label: 'Bus Delay Alerts',      desc: 'Delay & route changes' },
              { key: 'dropPickup',     icon: '📍', label: 'Pickup & Drop-off',     desc: 'When child boards / alights' },
              { key: 'paymentConfirm', icon: '✅', label: 'Payment Confirmations', desc: 'After every payment' },
              { key: 'announcements',  icon: '📢', label: 'School Announcements',  desc: 'Events & circulars' },
            ].map(({ key, icon, label, desc }) => (
              <div key={key} className={styles.toggleRow}>
                <div className={styles.toggleIcon}>{icon}</div>
                <div className={styles.toggleText}>
                  <div className={styles.toggleLabel}>{label}</div>
                  <div className={styles.toggleDesc}>{desc}</div>
                </div>
                <Toggle on={notifs[key]} onToggle={() => toggle(key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Preferences</div>
          <div className={styles.card}>
            <div className={styles.langRow}>
              <div className={styles.langLeft}>
                <span className={styles.langIcon}>🌐</span>
                <div>
                  <div className={styles.langLabel}>Language</div>
                </div>
              </div>
              <select
                className={styles.langSelect}
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                {['English', 'हिंदी', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ', 'मराठी', 'বাংলা'].map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className={styles.section}>
          <button className={styles.logoutBtn} onClick={() => onNavigate('__logout__')}>
            🚪 Log Out
          </button>
          <div className={styles.versionTag}>SchoolHub Parent · v1.0.0</div>
        </div>
      </div>
    </div>
  )
}
