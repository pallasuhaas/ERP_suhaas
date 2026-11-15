import styles from './AdminHeader.module.css'

export default function AdminHeader({ title, onNavigate }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
        <div className={styles.search}>
          <span>🔍</span>
          <input type="text" placeholder="Search students, fees…" className={styles.searchInput} />
        </div>
        <button className={styles.notifBtn} aria-label="Notifications">
          🔔
          <span className={styles.notifDot} />
        </button>
        <button className={styles.avatar} onClick={() => onNavigate('settings')}>
          AD
        </button>
      </div>
    </header>
  )
}
