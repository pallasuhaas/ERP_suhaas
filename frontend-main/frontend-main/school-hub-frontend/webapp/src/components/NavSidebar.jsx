import styles from './NavSidebar.module.css'

const NAV_ITEMS = [
  { id: 'home',   icon: '🏠', label: 'Home' },
  { id: 'fees',   icon: '💰', label: 'Finance' },
  { id: 'bus',    icon: '🚌', label: 'Transport' },
  { id: 'alerts', icon: '🔔', label: 'Notifications' },
  { id: 'chat',   icon: '💬', label: 'Messages' },
]

export default function NavSidebar({ currentPage, onNavigate, parentData, activeChildId, onChildChange }) {
  const activePage = NAV_ITEMS.some(n => n.id === currentPage) ? currentPage : 'home'

  const children = parentData?.children || []
  const activeChild = children.find(c => c.studentId === activeChildId) || children[0] || null
  const childName = activeChild
    ? `${activeChild.firstName || ''} ${activeChild.lastName || ''}`.trim() || 'Student'
    : '—'
  const childMeta = activeChild
    ? [activeChild.gradeLevel ? `Grade ${activeChild.gradeLevel}` : '', activeChild.section ? `Sec ${activeChild.section}` : ''].filter(Boolean).join(' · ')
    : ''

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>🎓</div>
        <div>
          <div className={styles.logoName}>SchoolHub</div>
          <div className={styles.logoSub}>Parent Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom — child switcher + settings */}
      <div className={styles.bottom}>
        <button
          className={styles.settingsRow}
          onClick={() => onNavigate('settings')}
        >
          <span className={styles.settingsIcon}>⚙️</span>
          <span className={styles.settingsLabel}>Settings</span>
        </button>

        {/* Active child pill */}
        <div className={styles.childPill}>
          <div className={styles.pillLabel}>Viewing</div>
          <div className={styles.pillName}>{childName}</div>
          {childMeta && <div className={styles.pillMeta}>{childMeta}</div>}
        </div>

        {/* Child switcher — only shown when parent has multiple children */}
        {children.length > 1 && (
          <div className={styles.switcherList}>
            {children.map(c => {
              const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Student'
              const isActive = c.studentId === (activeChild?.studentId)
              const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
              return (
                <button
                  key={c.studentId}
                  className={`${styles.switcherBtn} ${isActive ? styles.switcherActive : ''}`}
                  onClick={() => onChildChange(c.studentId)}
                  title={name}
                >
                  <span className={styles.switcherAvatar}>{initials}</span>
                  <span className={styles.switcherName}>{c.firstName || name}</span>
                  {isActive && <span className={styles.switcherCheck}>✓</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
