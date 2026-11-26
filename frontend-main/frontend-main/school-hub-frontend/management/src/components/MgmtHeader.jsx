import styles from './MgmtHeader.module.css'

export default function MgmtHeader({ title, onNavigate }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.breadcrumb}>SchoolHub ERP · AY 2025–26</div>
      </div>
      <div className={styles.right}>
        {/* BUG-024: the portal makes no API calls yet, so don't claim live data */}
        <div className={styles.dataTag} title="The management dashboards are not wired to the backend yet">🔌 Data not connected yet</div>
        <button className={styles.notifBtn}>🔔<span className={styles.dot} /></button>
        <button className={styles.avatar} onClick={() => onNavigate('settings')}>MG</button>
      </div>
    </header>
  )
}
