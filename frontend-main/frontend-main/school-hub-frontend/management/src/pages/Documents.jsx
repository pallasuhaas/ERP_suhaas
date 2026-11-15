import { useState } from 'react'
import styles from './Documents.module.css'

const DOC_CATEGORIES = ['All', 'Policies & Circulars', 'Fee Structure', 'Transport', 'Academic', 'HR & Staff']

const DOC_COLS = ['Document Name', 'Category', 'Uploaded By', 'Upload Date', 'Size', 'Actions']

export default function Documents() {
  const [category, setCategory] = useState('All')
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Documents & Reports</div>
          <div className="page-sub">Institutional documents · Policies · Circulars · Downloadable reports</div>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(s => !s)}>
          ⬆ Upload Document
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className={`card ${styles.uploadCard}`}>
          <div className={styles.uploadHead}>
            <span className={styles.cardTitle}>Upload New Document</span>
            <button className="btn-ghost" onClick={() => setShowUpload(false)}>✕ Cancel</button>
          </div>
          <div className={styles.uploadGrid}>
            <div className="form-group">
              <label className="form-label">Document Name</label>
              <input className="form-input" placeholder="e.g. Fee Structure 2025–26" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select">
                {DOC_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="upload-zone" style={{ marginBottom: 14 }}>
            <div className="upload-icon">📄</div>
            <div className="upload-title">Drop file here or click to browse</div>
            <div className="upload-sub">Supported: PDF, XLSX, DOCX · Max 20MB</div>
          </div>
          <div className={styles.uploadActions}>
            <button className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
            <button className="btn-primary">Upload & Publish</button>
          </div>
        </div>
      )}

      {/* Category filter pills */}
      <div className={styles.categoryPills}>
        {DOC_CATEGORIES.map(c => (
          <button
            key={c}
            className={`${styles.pill} ${category === c ? styles.pillActive : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <input className="search-input" placeholder="Search documents…" />
        <select className="filter-select">
          <option>All Formats</option>
          <option>PDF</option>
          <option>Excel (XLSX)</option>
          <option>Word (DOCX)</option>
        </select>
        <button className="btn-secondary">⬇ Download All</button>
      </div>

      {/* Document table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>
            {category === 'All' ? 'All Documents' : category}
          </span>
          <span className={styles.tableSub}>Documents will load from backend API</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{DOC_COLS.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={DOC_COLS.length}>
                  <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <div className="empty-title">No documents uploaded yet</div>
                    <div className="empty-sub">Documents will appear here once uploaded or fetched from the backend document store.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Downloadable reports section */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className={styles.cardTitle}>Auto-Generated Reports</div>
        <div className={styles.cardSub}>Reports generated on demand from live data. Click to generate and download.</div>
        <div className={styles.reportGrid}>
          {[
            { label: 'Fee Collection Summary',      icon: '💰', api: '/api/reports/fee-summary',      format: 'PDF / Excel' },
            { label: 'Annual Fee Report',            icon: '📋', api: '/api/reports/fee-annual',       format: 'PDF / Excel' },
            { label: 'Transport OpEx Report',        icon: '🚌', api: '/api/reports/transport-opex',   format: 'Excel' },
            { label: 'Route Performance Report',     icon: '🗺️', api: '/api/reports/route-performance',format: 'PDF / Excel' },
            { label: 'Discount & Concession Report', icon: '🏷️', api: '/api/reports/discounts',        format: 'Excel' },
            { label: 'Incident Summary Report',      icon: '⚠️', api: '/api/reports/incidents',        format: 'PDF' },
          ].map(r => (
            <div key={r.label} className={styles.reportCard}>
              <div className={styles.reportIcon}>{r.icon}</div>
              <div className={styles.reportLabel}>{r.label}</div>
              <div className={styles.reportFormat}>{r.format}</div>
              <div className={styles.reportApi}><code>{r.api}</code></div>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 10, fontSize: 12 }}>
                ⬇ Generate & Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
