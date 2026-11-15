import styles from './Receipt.module.css'

const ROWS = [
  { label: 'Student',        value: 'Arjun Sharma · Gr. 8A' },
  { label: 'Fee Category',   value: 'Q3 Tuition Fee' },
  { label: 'Academic Year',  value: '2025–26' },
  { label: 'Payment Mode',   value: 'UPI · HDFC Bank' },
  { label: 'Transaction ID', value: 'TXN20260307-0819', mono: true },
  { label: 'Date & Time',    value: 'Mar 7, 2026 · 7:30 AM' },
  { label: 'Status',         value: '✓ Paid & Verified', green: true },
]

export default function Receipt({ onNavigate }) {
  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div className="screen-nav" style={{ marginBottom: 0 }}>
          <button className="back-btn" onClick={() => onNavigate('fees')}>←</button>
          <span className="screen-nav-title">Receipt</span>
          <span className={styles.more}>⋮</span>
        </div>
      </div>

      <div className={styles.body}>
        {/* Receipt card */}
        <div className={styles.card}>
          <div className={styles.top}>
            <div className={styles.topIcon}>✅</div>
            <div className={styles.topStatus}>Payment Successful</div>
            <div className={styles.topAmount}>₹9,000</div>
          </div>
          <div className={styles.cardBody}>
            {ROWS.map(row => (
              <div key={row.label} className={styles.row}>
                <div className={styles.rowLabel}>{row.label}</div>
                <div className={`${styles.rowValue} ${row.green ? styles.green : ''} ${row.mono ? styles.mono : ''}`}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download */}
        <button className={styles.downloadBtn}>
          ⬇️ Download PDF Receipt
        </button>
      </div>
    </div>
  )
}
