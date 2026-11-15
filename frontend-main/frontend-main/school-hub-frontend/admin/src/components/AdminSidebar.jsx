import styles from './AdminSidebar.module.css'

const NAV = [
  { id: 'dashboard',     icon: '📊', label: 'Dashboard' },
  { id: 'students',      icon: '👥', label: 'Students' },
  { id: 'finance',       icon: '💰', label: 'Finance' },
  { id: 'transport',     icon: '🚌', label: 'Transport' },
  { id: 'communication', icon: '💬', label: 'Communication' },
]

export default function AdminSidebar({ currentPage, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>🎓</div>
        <div>
          <div className={styles.logoName}>SchoolHub</div>
          <div className={styles.logoSub}>Admin Portal</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroup}>Main</div>
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
        <div className={styles.adminPill}>
          <div className={styles.adminAvatar}>AD</div>
          <div>
            <div className={styles.adminName}>Admin User</div>
            <div className={styles.adminRole}>Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
