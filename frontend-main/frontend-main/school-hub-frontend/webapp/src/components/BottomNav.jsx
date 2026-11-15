import styles from './BottomNav.module.css'

const NAV_CONFIG = {
  home:   { icon: '🏠', label: 'Home' },
  fees:   { icon: '💰', label: 'Fees' },
  bus:    { icon: '🚌', label: 'Bus' },
  alerts: { icon: '🔔', label: 'Alerts' },
  chat:   { icon: '💬', label: 'Chat' },
}

export default function BottomNav({ currentPage, onNavigate, navPages }) {
  const activePage = navPages.includes(currentPage) ? currentPage : navPages[0]

  return (
    <nav className={styles.nav}>
      {navPages.map(page => {
        const { icon, label } = NAV_CONFIG[page]
        const active = activePage === page
        return (
          <button
            key={page}
            className={`${styles.item} ${active ? styles.active : ''}`}
            onClick={() => onNavigate(page)}
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
