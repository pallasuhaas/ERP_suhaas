import { useState, useEffect } from 'react'
import { getStudentTransport, getRouteStops } from '../api/parent'
import styles from './Transport.module.css'

export default function Transport({ onNavigate, parentData, activeChildId, onChildChange }) {
  const [assignments, setAssignments] = useState([]) // [{child, assignment, stops}]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentData?.children?.length) { setLoading(false); return }
    setLoading(true)
    Promise.all(
      parentData.children.map(async child => {
        const list = await getStudentTransport(child.studentId).catch(() => [])
        // Pick the assignment without an end date (active), fallback to first
        const active = list.find(a => !a.effectiveTo) || list[0]
        if (!active) return null
        const stops = active.route?.routeId
          ? await getRouteStops(active.route.routeId).catch(() => [])
          : []
        return { child, assignment: active, stops }
      })
    ).then(results => {
      setAssignments(results.filter(Boolean))
    }).finally(() => setLoading(false))
  }, [parentData])

  // Sync with global activeChildId; fall back to first assignment
  const current = assignments.find(a => a.child.studentId === activeChildId) || assignments[0] || null
  const a = current?.assignment
  const child = current?.child
  const stops = current?.stops || []
  const route = a?.route
  const vehicle = a?.vehicle

  const childFullName = child
    ? `${child.firstName || ''} ${child.lastName || ''}`.trim()
    : ''

  return (
    <div>
      {/* Dark header */}
      <div className={styles.header}>
        <div className="screen-nav" style={{ marginBottom: 0 }}>
          <button
            className={`back-btn ${styles.backDark}`}
            onClick={() => onNavigate('home')}
          >←</button>
          <span className={styles.headerTitle}>Transport</span>
          <div className={styles.liveBadge}>INFO</div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className={styles.mapBox}>
        <div className={styles.mapGrid} />
        <div className={`${styles.road} ${styles.roadH1}`} />
        <div className={`${styles.road} ${styles.roadH2}`} />
        <div className={`${styles.road} ${styles.roadV1}`} />
        <div className={`${styles.road} ${styles.roadV2}`} />
        <div className={styles.routePath} />
        <div className={styles.busPin}><span>🚌</span></div>
        <div className={styles.destPin} />
      </div>

      {/* Pull-up info panel */}
      <div className={styles.infoPanel}>
        <div className={styles.dragHandle} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>
            Loading transport info…
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>
            No transport assignment found. Contact the school to enroll.
          </div>
        ) : (
          <>
            {/* Child selector — only when multiple children have transport */}
            {assignments.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
                {assignments.map(r => {
                  const isActive = r.child.studentId === current?.child?.studentId
                  const n = r.child.firstName?.trim() || 'Child'
                  return (
                    <button
                      key={r.child.studentId}
                      onClick={() => onChildChange?.(r.child.studentId)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: isActive ? '#6c63ff' : '#f0f0f0',
                        color: isActive ? '#fff' : '#333',
                        fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap'
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Route summary */}
            <div className={styles.etaBig}>
              <div>
                <div className={styles.etaLabel}>
                  {childFullName ? `${childFullName}'s Route` : 'Route'}
                </div>
                <div className={styles.etaValue} style={{ fontSize: 22 }}>
                  {route?.routeName || '—'}
                </div>
              </div>
              {route?.estimatedTimeMinutes && (
                <div className={styles.delayBadge}>
                  🕐 ~{route.estimatedTimeMinutes} min
                </div>
              )}
            </div>

            {/* Pickup / drop info */}
            <div style={{
              background: '#f8f8ff', borderRadius: 12, padding: '12px 16px',
              marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 2 }}>PICKUP</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.pickupPoint || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 2 }}>DROP</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.dropPoint || '—'}</div>
              </div>
              {route?.startPoint && (
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 2 }}>ROUTE START</div>
                  <div style={{ fontSize: 12, color: '#555' }}>{route.startPoint}</div>
                </div>
              )}
              {route?.endPoint && (
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 2 }}>ROUTE END</div>
                  <div style={{ fontSize: 12, color: '#555' }}>{route.endPoint}</div>
                </div>
              )}
            </div>

            {/* Stop list */}
            {stops.length > 0 && (
              <div className={styles.stopList}>
                {[...stops]
                  .sort((x, y) => (x.sequenceOrder || 0) - (y.sequenceOrder || 0))
                  .map((stop, i, arr) => {
                    const isPickup = a.pickupPoint &&
                      stop.stopName?.toLowerCase().includes(
                        a.pickupPoint.split(' ')[0].toLowerCase()
                      )
                    return (
                      <div key={stop.stopId ?? i} className={styles.stopRow}>
                        <div className={styles.dotCol}>
                          <div className={`${styles.dot} ${i === 0 ? styles.done : isPickup ? styles.current : styles.upcoming}`} />
                          {i < arr.length - 1 && (
                            <div className={`${styles.connector} ${i === 0 ? styles.connDone : ''}`} />
                          )}
                        </div>
                        <div className={styles.stopInfo}>
                          <div className={`${styles.stopName} ${isPickup ? styles.stopCurrent : i > 0 ? styles.stopUpcoming : ''}`}>
                            {stop.stopName}{isPickup ? ' ← Pickup' : ''}
                          </div>
                          <div className={styles.stopTime}>Stop {stop.sequenceOrder}</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Vehicle card */}
            {vehicle ? (
              <div className={styles.driverCard}>
                <div className={styles.driverAvatar}>🚌</div>
                <div className={styles.driverInfo}>
                  <div className={styles.driverName}>{vehicle.registrationNumber}</div>
                  <div className={styles.driverSub}>
                    {vehicle.vehicleType} · Capacity {vehicle.capacity}
                  </div>
                </div>
                <button className={styles.callBtn}>📞</button>
              </div>
            ) : (
              <div className={styles.driverCard} style={{ opacity: 0.55 }}>
                <div className={styles.driverAvatar}>🚌</div>
                <div className={styles.driverInfo}>
                  <div className={styles.driverName}>Vehicle not yet assigned</div>
                  <div className={styles.driverSub}>Contact school for updates</div>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 12 }}>
              Active from {a.effectiveFrom
                ? new Date(a.effectiveFrom).toLocaleDateString('en-IN')
                : '—'}
              {a.effectiveTo
                ? ` · Until ${new Date(a.effectiveTo).toLocaleDateString('en-IN')}`
                : ''}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
