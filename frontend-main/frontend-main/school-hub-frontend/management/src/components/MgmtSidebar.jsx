import styles from './MgmtSidebar.module.css'

const NAV = [
  { id: 'dashboard', icon: '📈', label: 'Executive Dashboard' },
  { id: 'fee',       icon: '💰', label: 'Fee Analytics' },
  { id: 'transport', icon: '🚌', label: 'Transport Analytics' },
  { id: 'documents', icon: '📂', label: 'Documents & Reports' },
]

export default function MgmtSidebar({ currentPage, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>🏛️</div>
        <div>
          <div className={styles.logoName}>SchoolHub</div>
          <div className={styles.logoSub}>Management Portal</div>
        </div>
      </div>

      <div className={styles.readOnly}>
        <span className={styles.readOnlyDot} />
        Analytics & Oversight · Read-Only
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroup}>Analytics</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.bottom}>
        <button
          className={`${styles.navItem} ${currentPage === 'settings' ? styles.active : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <span className={styles.navIcon}>⚙️</span>
          <span>Settings</span>
        </button>
        <div className={styles.userPill}>
          <div className={styles.userAvatar}>MG</div>
          <div>
            <div className={styles.userName}>Manager</div>
            <div className={styles.userRole}>Super User</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
