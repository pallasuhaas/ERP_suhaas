import styles from './MgmtHeader.module.css'

export default function MgmtHeader({ title, onNavigate }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.breadcrumb}>SchoolHub ERP · AY 2025–26</div>
      </div>
      <div className={styles.right}>
        <div className={styles.dataTag}>⚡ Live data from API</div>
        <button className={styles.notifBtn}>🔔<span className={styles.dot} /></button>
        <button className={styles.avatar} onClick={() => onNavigate('settings')}>MG</button>
      </div>
    </header>
  )
}
