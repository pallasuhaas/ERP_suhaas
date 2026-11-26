import { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import styles from './Transport.module.css'
import { getStudents } from '../api/students'
import { splitCSVLine, splitCSVRows } from '../api/csv'
import {
  getVehicles, createVehicle, deleteVehicle, updateVehicle,
  getDrivers, createDriver, deleteDriver, updateDriver,
  getRoutes, createRoute, deleteRoute, updateRoute,
  getStopsByRoute, createStop, deleteStop,
  getAssignments, createAssignment, deleteAssignment,
} from '../api/transport'
import { getFeeStructures, createFeeStructure, createInvoice } from '../api/finance'

const VEHICLE_TYPES  = ['BUS', 'VAN', 'OTHER']
const EMP_STATUS     = ['ACTIVE', 'INACTIVE']
const VEHICLE_STATUS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE']

const statusColor = { ACTIVE: 'green', INACTIVE: 'red', MAINTENANCE: 'orange' }

export default function Transport() {
  const [tab, setTab] = useState('fleet')

  // ── shared data ──────────────────────────────────────────────────────────
  const [vehicles,    setVehicles]    = useState([])
  const [drivers,     setDrivers]     = useState([])
  const [routes,      setRoutes]      = useState([])
  const [assignments, setAssignments] = useState([])
  const [students,    setStudents]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const reload = useCallback(() => {
    setLoading(true)
    Promise.all([
      getVehicles().catch(() => []),
      getDrivers().catch(() => []),
      getRoutes().catch(() => []),
      getAssignments().catch(() => []),
      getStudents().catch(() => []),
    ]).then(([v, d, r, a, s]) => {
      setVehicles(v)
      setDrivers(d)
      setRoutes(r)
      setAssignments(a)
      setStudents(s)
      setError(null)
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const driverMap  = Object.fromEntries(drivers.map(d => [d.driverId, d]))
  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.vehicleId, v]))
  const routeMap   = Object.fromEntries(routes.map(r => [r.routeId, r]))
  const studentMap = Object.fromEntries(students.map(s => [s.studentId, s]))

  if (error) return (
    <div className="card" style={{ color: 'var(--red)', padding: 32 }}>
      ⚠ Could not load Transport data: {error}
      <button className="btn-secondary" style={{ marginLeft: 16 }} onClick={reload}>Retry</button>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transport</div>
          <div className="page-sub">
            {loading ? 'Loading…' : `${vehicles.length} vehicles · ${routes.length} routes · ${assignments.length} enrolled students`}
          </div>
        </div>
      </div>

      <div className="tab-bar">
        {[['fleet','🚌 Fleet'],['routes','🗺 Routes'],['enroll','👤 Student Enrollment']].map(([id,label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Fleet tab (overview cards + vehicles/drivers management) ── */}
      {tab === 'fleet' && (
        <FleetTab
          vehicles={vehicles} drivers={drivers}
          driverMap={driverMap} loading={loading}
          onReload={reload}
        />
      )}

      {/* ── Routes ── */}
      {tab === 'routes' && (
        <RoutesTab routes={routes} vehicles={vehicles} onReload={reload} />
      )}

      {/* ── Student Enrollment ── */}
      {tab === 'enroll' && (
        <EnrollTab
          assignments={assignments} students={students} vehicles={vehicles}
          routes={routes} studentMap={studentMap} vehicleMap={vehicleMap}
          routeMap={routeMap} onReload={reload}
        />
      )}
    </div>
  )
}

// ── Fleet tab (overview cards + vehicles & drivers management) ───────────────
function FleetTab({ vehicles, drivers, driverMap, loading, onReload }) {
  const [showVForm, setShowVForm] = useState(false)
  const [showDForm, setShowDForm] = useState(false)
  const [vForm, setVForm] = useState({ registrationNumber: '', vehicleType: 'BUS', capacity: '', status: 'ACTIVE', driverId: '' })
  const [dForm, setDForm] = useState({ fullName: '', licenseNumber: '', contactNumber: '', employmentStatus: 'ACTIVE' })
  const [vErr,    setVErr]    = useState(null)
  const [dErr,    setDErr]    = useState(null)
  const [vSaving, setVSaving] = useState(false)
  const [dSaving, setDSaving] = useState(false)

  const [editVehicleId,   setEditVehicleId]   = useState(null)
  const [editVehicleForm, setEditVehicleForm] = useState({})
  const [editVErr,        setEditVErr]        = useState(null)
  const [editVSaving,     setEditVSaving]     = useState(false)

  const [editDriverId,   setEditDriverId]   = useState(null)
  const [editDriverForm, setEditDriverForm] = useState({})
  const [editDErr,       setEditDErr]       = useState(null)
  const [editDSaving,    setEditDSaving]    = useState(false)

  async function handleAddVehicle(e) {
    e.preventDefault()
    setVErr(null)
    if (!vForm.registrationNumber.trim()) return setVErr('Registration number is required.')
    if (!(Number(vForm.capacity) >= 1)) return setVErr('Capacity must be at least 1.')
    setVSaving(true)
    try {
      await createVehicle(vForm.driverId || null, {
        registrationNumber: vForm.registrationNumber.trim(),
        vehicleType: vForm.vehicleType,
        capacity: Number(vForm.capacity),
        status: vForm.status,
      })
      setVForm({ registrationNumber: '', vehicleType: 'BUS', capacity: '', status: 'ACTIVE', driverId: '' })
      setShowVForm(false)
      onReload()
    } catch (err) {
      setVErr(err.message)
    } finally {
      setVSaving(false)
    }
  }

  async function handleDeleteVehicle(id) {
    if (!confirm('Delete this vehicle?')) return
    try { await deleteVehicle(id); onReload() }
    catch (err) { alert('Failed: ' + err.message) }
  }

  async function handleSaveVehicle(vehicleId) {
    setEditVErr(null); setEditVSaving(true)
    try {
      const driverPayload = editVehicleForm.driverId
        ? { driver: { driverId: Number(editVehicleForm.driverId) } }
        : { driver: null }
      await updateVehicle(vehicleId, {
        registrationNumber: editVehicleForm.registrationNumber,
        vehicleType: editVehicleForm.vehicleType,
        capacity: Number(editVehicleForm.capacity),
        status: editVehicleForm.status,
        ...driverPayload,
      })
      setEditVehicleId(null); setEditVehicleForm({})
      onReload()
    } catch (e) { setEditVErr(e.message) }
    finally { setEditVSaving(false) }
  }

  async function handleAddDriver(e) {
    e.preventDefault()
    setDErr(null)
    setDSaving(true)
    try {
      await createDriver({
        fullName: dForm.fullName,
        licenseNumber: dForm.licenseNumber,
        contactNumber: dForm.contactNumber,
        employmentStatus: dForm.employmentStatus,
      })
      setDForm({ fullName: '', licenseNumber: '', contactNumber: '', employmentStatus: 'ACTIVE' })
      setShowDForm(false)
      onReload()
    } catch (err) {
      setDErr(err.message)
    } finally {
      setDSaving(false)
    }
  }

  async function handleDeleteDriver(id) {
    if (!confirm('Delete this driver?')) return
    try { await deleteDriver(id); onReload() }
    catch (err) { alert('Failed: ' + err.message) }
  }

  async function handleSaveDriver(driverId) {
    setEditDErr(null); setEditDSaving(true)
    try {
      await updateDriver(driverId, {
        fullName: editDriverForm.fullName,
        licenseNumber: editDriverForm.licenseNumber,
        contactNumber: editDriverForm.contactNumber,
        employmentStatus: editDriverForm.employmentStatus,
      })
      setEditDriverId(null); setEditDriverForm({})
      onReload()
    } catch (e) { setEditDErr(e.message) }
    finally { setEditDSaving(false) }
  }

  return (
    <div>
      {/* Fleet overview cards */}
      {loading ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading fleet…</div>
      ) : vehicles.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚌</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>No vehicles registered</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 16 }}>Add a vehicle below to get started.</div>
        </div>
      ) : (
        <div className={styles.fleetGrid}>
          {vehicles.map(v => {
            const driver = v.driver || (v.driverId ? driverMap[v.driverId] : null)
            return (
              <div key={v.vehicleId} className={`card ${styles.vehicleCard}`}>
                <div className={styles.vcTop}>
                  <span className={styles.routeChip}>{v.vehicleType}</span>
                  <span className={`badge ${statusColor[v.status] || 'muted'}`}>{v.status}</span>
                </div>
                <div className={styles.vcReg}>{v.registrationNumber}</div>
                <div className={styles.vcDriver}>
                  {driver ? `👤 ${driver.fullName}` : '👤 No driver assigned'}
                </div>
                <div className={styles.vcMeta}>
                  <span>💺 Cap. {v.capacity}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

      {/* Vehicles & Drivers management */}
      <div className={styles.vdGrid}>
        {/* Vehicles section */}
        <div>
          <div className={styles.subHead}>
            <span>Vehicles</span>
            <button className="btn-primary" onClick={() => setShowVForm(v => !v)}>
              {showVForm ? '✕ Cancel' : '+ Add Vehicle'}
            </button>
          </div>

          {showVForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-head">New Vehicle</div>
              {vErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>⚠ {vErr}</div>}
              <form onSubmit={handleAddVehicle}>
                <div className={styles.formGrid2Compact}>
                  <div className="form-group"><label className="form-label">Registration No.</label>
                    <input className="form-input" required placeholder="KA-05-AB-1234"
                      value={vForm.registrationNumber} onChange={e => setVForm(f => ({ ...f, registrationNumber: e.target.value }))} />
                  </div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={vForm.vehicleType} onChange={e => setVForm(f => ({ ...f, vehicleType: e.target.value }))}>
                      {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Capacity</label>
                    <input className="form-input" type="number" min="1" required placeholder="40"
                      value={vForm.capacity} onChange={e => setVForm(f => ({ ...f, capacity: e.target.value }))} />
                  </div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={vForm.status} onChange={e => setVForm(f => ({ ...f, status: e.target.value }))}>
                      {VEHICLE_STATUS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Assign Driver (optional)</label>
                    <select className="form-select" value={vForm.driverId} onChange={e => setVForm(f => ({ ...f, driverId: e.target.value }))}>
                      <option value="">— None —</option>
                      {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.fullName}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={vSaving}>{vSaving ? 'Saving…' : 'Add Vehicle'}</button>
              </form>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead><tr><th>Reg No.</th><th>Type</th><th>Capacity</th><th>Driver</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 24 }}>No vehicles yet</td></tr>
                ) : vehicles.map(v => {
                  const driver = v.driver || (v.driverId ? driverMap[v.driverId] : null)
                  const isEditing = editVehicleId === v.vehicleId
                  return (
                    <Fragment key={v.vehicleId}>
                      <tr>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.registrationNumber}</span></td>
                        <td>{v.vehicleType}</td>
                        <td>{v.capacity}</td>
                        <td>{driver ? driver.fullName : <span style={{ color: 'var(--ink-muted)' }}>—</span>}</td>
                        <td><span className={`badge ${statusColor[v.status] || 'muted'}`}>{v.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                              onClick={() => {
                                setEditVehicleId(v.vehicleId)
                                setEditVehicleForm({
                                  registrationNumber: v.registrationNumber,
                                  vehicleType: v.vehicleType,
                                  capacity: v.capacity,
                                  status: v.status,
                                  driverId: driver?.driverId || '',
                                })
                                setEditVErr(null)
                              }}>Edit</button>
                            <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                              onClick={() => handleDeleteVehicle(v.vehicleId)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr style={{ background: 'var(--bg)' }}>
                          <td colSpan={6} style={{ padding: '12px 16px' }}>
                            {editVErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>⚠ {editVErr}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Reg No.</label>
                                <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editVehicleForm.registrationNumber}
                                  onChange={e => setEditVehicleForm(f => ({ ...f, registrationNumber: e.target.value }))} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Type</label>
                                <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editVehicleForm.vehicleType}
                                  onChange={e => setEditVehicleForm(f => ({ ...f, vehicleType: e.target.value }))}>
                                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Capacity</label>
                                <input className="form-input" type="number" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editVehicleForm.capacity}
                                  onChange={e => setEditVehicleForm(f => ({ ...f, capacity: e.target.value }))} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Status</label>
                                <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editVehicleForm.status}
                                  onChange={e => setEditVehicleForm(f => ({ ...f, status: e.target.value }))}>
                                  {VEHICLE_STATUS.map(s => <option key={s}>{s}</option>)}
                                </select>
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Driver</label>
                                <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editVehicleForm.driverId || ''}
                                  onChange={e => setEditVehicleForm(f => ({ ...f, driverId: e.target.value }))}>
                                  <option value="">— None —</option>
                                  {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.fullName}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => handleSaveVehicle(v.vehicleId)} disabled={editVSaving}>
                                {editVSaving ? 'Saving…' : 'Save'}
                              </button>
                              <button className="btn-ghost" style={{ fontSize: 12 }}
                                onClick={() => { setEditVehicleId(null); setEditVehicleForm({}) }}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drivers section */}
        <div>
          <div className={styles.subHead}>
            <span>Drivers</span>
            <button className="btn-primary" onClick={() => setShowDForm(v => !v)}>
              {showDForm ? '✕ Cancel' : '+ Add Driver'}
            </button>
          </div>

          {showDForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-head">New Driver</div>
              {dErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>⚠ {dErr}</div>}
              <form onSubmit={handleAddDriver}>
                <div className={styles.formGrid2Compact}>
                  <div className="form-group"><label className="form-label">Full Name</label>
                    <input className="form-input" required placeholder="Rajan Kumar"
                      value={dForm.fullName} onChange={e => setDForm(f => ({ ...f, fullName: e.target.value }))} />
                  </div>
                  <div className="form-group"><label className="form-label">License No.</label>
                    <input className="form-input" required placeholder="DL-KA-2019-0001"
                      value={dForm.licenseNumber} onChange={e => setDForm(f => ({ ...f, licenseNumber: e.target.value }))} />
                  </div>
                  <div className="form-group"><label className="form-label">Contact No.</label>
                    <input className="form-input" placeholder="9400111222"
                      value={dForm.contactNumber} onChange={e => setDForm(f => ({ ...f, contactNumber: e.target.value }))} />
                  </div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={dForm.employmentStatus} onChange={e => setDForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                      {EMP_STATUS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={dSaving}>{dSaving ? 'Saving…' : 'Add Driver'}</button>
              </form>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Contact</th><th>License</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 24 }}>No drivers yet</td></tr>
                ) : drivers.map(d => {
                  const isEditing = editDriverId === d.driverId
                  return (
                    <Fragment key={d.driverId}>
                      <tr>
                        <td><span style={{ fontWeight: 600 }}>{d.fullName}</span></td>
                        <td>{d.contactNumber || '—'}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.licenseNumber}</span></td>
                        <td><span className={`badge ${d.employmentStatus === 'ACTIVE' ? 'green' : 'muted'}`}>{d.employmentStatus}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                              onClick={() => {
                                setEditDriverId(d.driverId)
                                setEditDriverForm({
                                  fullName: d.fullName,
                                  licenseNumber: d.licenseNumber,
                                  contactNumber: d.contactNumber || '',
                                  employmentStatus: d.employmentStatus,
                                })
                                setEditDErr(null)
                              }}>Edit</button>
                            <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                              onClick={() => handleDeleteDriver(d.driverId)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr style={{ background: 'var(--bg)' }}>
                          <td colSpan={5} style={{ padding: '12px 16px' }}>
                            {editDErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>⚠ {editDErr}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Full Name</label>
                                <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editDriverForm.fullName}
                                  onChange={e => setEditDriverForm(f => ({ ...f, fullName: e.target.value }))} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>License No.</label>
                                <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editDriverForm.licenseNumber}
                                  onChange={e => setEditDriverForm(f => ({ ...f, licenseNumber: e.target.value }))} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Contact No.</label>
                                <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editDriverForm.contactNumber}
                                  onChange={e => setEditDriverForm(f => ({ ...f, contactNumber: e.target.value }))} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Status</label>
                                <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={editDriverForm.employmentStatus}
                                  onChange={e => setEditDriverForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                                  {EMP_STATUS.map(s => <option key={s}>{s}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => handleSaveDriver(d.driverId)} disabled={editDSaving}>
                                {editDSaving ? 'Saving…' : 'Save'}
                              </button>
                              <button className="btn-ghost" style={{ fontSize: 12 }}
                                onClick={() => { setEditDriverId(null); setEditDriverForm({}) }}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── StopManager sub-component ────────────────────────────────────────────────
function StopManager({ routeId }) {
  const [stops,    setStops]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [stopName, setStopName] = useState('')
  const [order,    setOrder]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState(null)

  const loadStops = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStopsByRoute(routeId)
      setStops(data || [])
    } catch {
      setStops([])
    } finally {
      setLoading(false)
    }
  }, [routeId])

  useEffect(() => { loadStops() }, [loadStops])

  const nextOrder = Math.max(...stops.map(s => s.sequenceOrder), 0) + 1
  const sorted = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
  const reverseSorted = [...sorted].reverse()

  async function handleAddStop(e) {
    e.preventDefault()
    if (!stopName.trim()) return
    setSaving(true)
    setErr(null)
    try {
      await createStop(routeId, {
        stopName: stopName.trim(),
        sequenceOrder: order ? Number(order) : nextOrder,
      })
      setStopName('')
      setOrder('')
      await loadStops()
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteStop(stopId) {
    try {
      await deleteStop(stopId)
      await loadStops()
    } catch (ex) {
      alert('Failed to delete stop: ' + ex.message)
    }
  }

  function renderStopPills(list) {
    if (list.length === 0) {
      return <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>No stops yet.</span>
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        {list.map((s, idx) => (
          <Fragment key={s.stopId}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--blue-light)', color: 'var(--blue)',
              border: '1px solid var(--blue)', borderRadius: 20,
              padding: '3px 10px', fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ color: 'var(--ink-muted)', fontSize: 10, marginRight: 2 }}>{s.sequenceOrder}.</span>
              {s.stopName}
              <button
                onClick={() => handleDeleteStop(s.stopId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 12, lineHeight: 1, padding: '0 0 0 4px', fontWeight: 700 }}
                title="Remove stop"
              >✕</button>
            </span>
            {idx < list.length - 1 && (
              <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>→</span>
            )}
          </Fragment>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0 4px' }}>
      {loading ? (
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Loading stops…</span>
      ) : (
        <>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 10, fontStyle: 'italic' }}>
            Stops shown in pickup order (morning A→B→C). Drop is reverse (evening C→B→A).
          </div>

          {/* Pickup section */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>🌅 Morning (Pickup)</div>
            {renderStopPills(sorted)}
          </div>

          {/* Drop section */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>🌇 Evening (Drop)</div>
            {renderStopPills(reverseSorted)}
          </div>

          {/* Inline add form */}
          {err && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 6 }}>⚠ {err}</div>}
          <form onSubmit={handleAddStop} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Stop Name</label>
              <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', minWidth: 160 }}
                placeholder="e.g. MG Nagar" value={stopName}
                onChange={e => setStopName(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Order</label>
              <input className="form-input" type="number" min="1" style={{ fontSize: 12, padding: '5px 8px', width: 70 }}
                placeholder={String(nextOrder)} value={order}
                onChange={e => setOrder(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} disabled={saving}>
              {saving ? '…' : '+ Add Stop'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ── Routes sub-component ──────────────────────────────────────────────────────
function RoutesTab({ routes, vehicles, onReload }) {
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState({ routeName: '', startPoint: '', endPoint: '', distanceKm: '', estimatedTimeMinutes: '', vehicleId: '' })
  const [err,         setErr]         = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())

  const [editRouteId,   setEditRouteId]   = useState(null)
  const [editRouteForm, setEditRouteForm] = useState({})
  const [editRErr,      setEditRErr]      = useState(null)
  const [editRSaving,   setEditRSaving]   = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      await createRoute({
        routeName: form.routeName,
        startPoint: form.startPoint,
        endPoint: form.endPoint,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
        estimatedTimeMinutes: form.estimatedTimeMinutes ? Number(form.estimatedTimeMinutes) : null,
      }, form.vehicleId || null)
      setForm({ routeName: '', startPoint: '', endPoint: '', distanceKm: '', estimatedTimeMinutes: '', vehicleId: '' })
      setShowForm(false)
      onReload()
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this route?')) return
    try { await deleteRoute(id); onReload() }
    catch (ex) { alert('Failed: ' + ex.message) }
  }

  async function handleSaveRoute(routeId) {
    setEditRErr(null); setEditRSaving(true)
    try {
      await updateRoute(routeId, {
        routeName: editRouteForm.routeName,
        startPoint: editRouteForm.startPoint,
        endPoint: editRouteForm.endPoint,
        distanceKm: editRouteForm.distanceKm ? Number(editRouteForm.distanceKm) : null,
        estimatedTimeMinutes: editRouteForm.estimatedTimeMinutes ? Number(editRouteForm.estimatedTimeMinutes) : null,
      }, editRouteForm.vehicleId || null)
      setEditRouteId(null); setEditRouteForm({})
      onReload()
    } catch (e) { setEditRErr(e.message) }
    finally { setEditRSaving(false) }
  }

  function toggleExpand(routeId) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(routeId) ? next.delete(routeId) : next.add(routeId)
      return next
    })
  }

  return (
    <div>
      <div className={styles.subHead}>
        <span>Transport Routes</span>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Add Route'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-head">New Route</div>
          {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>⚠ {err}</div>}
          <form onSubmit={handleAdd}>
            <div className={styles.formGrid3}>
              <div className="form-group"><label className="form-label">Route Name</label>
                <input className="form-input" required placeholder="Route 3A"
                  value={form.routeName} onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Start Point</label>
                <input className="form-input" placeholder="School Gate 1"
                  value={form.startPoint} onChange={e => setForm(f => ({ ...f, startPoint: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">End Point</label>
                <input className="form-input" placeholder="Koramangala"
                  value={form.endPoint} onChange={e => setForm(f => ({ ...f, endPoint: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Distance (km)</label>
                <input className="form-input" type="number" step="0.1" placeholder="12.5"
                  value={form.distanceKm} onChange={e => setForm(f => ({ ...f, distanceKm: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Est. Time (min)</label>
                <input className="form-input" type="number" placeholder="45"
                  value={form.estimatedTimeMinutes} onChange={e => setForm(f => ({ ...f, estimatedTimeMinutes: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Assigned Vehicle (optional)</label>
                <select className="form-select" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
                  <option value="">— None —</option>
                  {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber} (Cap. {v.capacity})</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Route'}</button>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Route Name</th><th>From</th><th>To</th><th>Distance</th><th>Est. Time</th><th>Vehicle</th><th>Stops</th><th></th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 24 }}>No routes yet</td></tr>
            ) : routes.map(r => {
              const isEditing = editRouteId === r.routeId
              return (
                <Fragment key={r.routeId}>
                  <tr>
                    <td><span style={{ fontWeight: 600 }}>{r.routeName}</span></td>
                    <td>{r.startPoint || '—'}</td>
                    <td>{r.endPoint || '—'}</td>
                    <td>{r.distanceKm ? `${r.distanceKm} km` : '—'}</td>
                    <td>{r.estimatedTimeMinutes ? `${r.estimatedTimeMinutes} min` : '—'}</td>
                    <td>
                      {r.vehicle?.registrationNumber
                        ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.vehicle.registrationNumber}</span>
                        : <span style={{ color: 'var(--ink-muted)' }}>—</span>
                      }
                    </td>
                    <td>
                      <button
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', padding: '3px 8px', color: 'var(--ink-muted)', fontWeight: 600 }}
                        onClick={() => toggleExpand(r.routeId)}
                      >
                        {expandedIds.has(r.routeId) ? '▼' : '▶'} Stops
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                          onClick={() => {
                            setEditRouteId(r.routeId)
                            setEditRouteForm({
                              routeName: r.routeName,
                              startPoint: r.startPoint || '',
                              endPoint: r.endPoint || '',
                              distanceKm: r.distanceKm != null ? String(r.distanceKm) : '',
                              estimatedTimeMinutes: r.estimatedTimeMinutes != null ? String(r.estimatedTimeMinutes) : '',
                              vehicleId: r.vehicle?.vehicleId || '',
                            })
                            setEditRErr(null)
                          }}>Edit</button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                          onClick={() => handleDelete(r.routeId)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr style={{ background: 'var(--bg)' }}>
                      <td colSpan={8} style={{ padding: '12px 16px' }}>
                        {editRErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>⚠ {editRErr}</div>}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Route Name</label>
                            <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                              value={editRouteForm.routeName}
                              onChange={e => setEditRouteForm(f => ({ ...f, routeName: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Start Point</label>
                            <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                              value={editRouteForm.startPoint}
                              onChange={e => setEditRouteForm(f => ({ ...f, startPoint: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>End Point</label>
                            <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                              value={editRouteForm.endPoint}
                              onChange={e => setEditRouteForm(f => ({ ...f, endPoint: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Distance (km)</label>
                            <input className="form-input" type="number" step="0.1" style={{ fontSize: 12, padding: '5px 8px' }}
                              value={editRouteForm.distanceKm}
                              onChange={e => setEditRouteForm(f => ({ ...f, distanceKm: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Est. Time (min)</label>
                            <input className="form-input" type="number" style={{ fontSize: 12, padding: '5px 8px' }}
                              value={editRouteForm.estimatedTimeMinutes}
                              onChange={e => setEditRouteForm(f => ({ ...f, estimatedTimeMinutes: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Assigned Vehicle</label>
                            <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                              value={editRouteForm.vehicleId || ''}
                              onChange={e => setEditRouteForm(f => ({ ...f, vehicleId: e.target.value }))}>
                              <option value="">— None —</option>
                              {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber} (Cap. {v.capacity})</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                            onClick={() => handleSaveRoute(r.routeId)} disabled={editRSaving}>
                            {editRSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12 }}
                            onClick={() => { setEditRouteId(null); setEditRouteForm({}) }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedIds.has(r.routeId) && (
                    <tr style={{ background: 'var(--bg)' }}>
                      <td colSpan={8} style={{ padding: '8px 16px 12px' }}>
                        <StopManager routeId={r.routeId} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Student Enrollment sub-component ─────────────────────────────────────────
function EnrollTab({ assignments, students, vehicles, routes, studentMap, vehicleMap, routeMap, onReload }) {
  const [enrollTab,    setEnrollTab]    = useState('individual') // individual | upload
  const [form,         setForm]         = useState({
    studentSearch: '', studentId: '',
    routeId: '', vehicleId: '',
    pickupPoint: '', dropPoint: '',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
  })
  const [err,          setErr]          = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState(null)
  const [selectedAids, setSelectedAids] = useState(new Set())

  // ── Route grouping collapse state (start all collapsed) ───────────────────
  const [collapsedRoutes, setCollapsedRoutes] = useState(() => {
    // Will be re-initialized when routes load — handled via useEffect below
    return new Set()
  })
  const initializedRouteCollapse = useRef(false)
  useEffect(() => {
    if (!initializedRouteCollapse.current && assignments.length > 0) {
      const routeIds = [...new Set(assignments.map(a => a.routeId || a.route?.routeId))]
      setCollapsedRoutes(new Set(routeIds.map(String)))
      initializedRouteCollapse.current = true
    }
  }, [assignments])

  function toggleRouteCollapse(routeId) {
    setCollapsedRoutes(prev => {
      const next = new Set(prev)
      const key = String(routeId)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleAid(id) {
    setSelectedAids(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAllAids() {
    setSelectedAids(prev => prev.size === assignments.length ? new Set() : new Set(assignments.map(a => a.assignmentId)))
  }

  async function handleBulkRemove() {
    if (!confirm(`Remove ${selectedAids.size} assignment(s)?`)) return
    try {
      await Promise.all([...selectedAids].map(id => deleteAssignment(id)))
      setSelectedAids(new Set()); onReload()
    } catch (e) { alert('Failed: ' + e.message) }
  }

  async function handleAssign(e) {
    e.preventDefault()
    setErr(null)
    if (!form.studentId) return setErr('Please select a student.')
    if (!form.routeId)   return setErr('Please select a route.')
    if (!form.vehicleId) return setErr('Please select a vehicle.')
    const route = routes.find(r => String(r.routeId) === String(form.routeId))
    const pickupPoint = form.pickupPoint.trim() || route?.startPoint || ''
    const dropPoint   = form.dropPoint.trim()   || route?.endPoint   || ''
    if (!pickupPoint || !dropPoint) return setErr('Enter pickup and drop stops (this route has no start/end point to use).')
    setSaving(true)
    try {
      await createAssignment(form.studentId, form.routeId, form.vehicleId, {
        pickupPoint,
        dropPoint,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
      })
      setMsg('Assignment saved.')
      setForm(f => ({ ...f, studentSearch: '', studentId: '', pickupPoint: '', dropPoint: '', effectiveTo: '' }))
      onReload()
      setTimeout(() => setMsg(null), 3000)
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  async function handleRemove(id) {
    if (!confirm('Remove this assignment?')) return
    try { await deleteAssignment(id); onReload() }
    catch (e) { alert('Failed: ' + e.message) }
  }

  return (
    <div>
      {/* sub-tab bar */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${enrollTab === 'individual' ? 'active' : ''}`} onClick={() => setEnrollTab('individual')}>👤 Individual</button>
        <button className={`tab-btn ${enrollTab === 'upload' ? 'active' : ''}`} onClick={() => setEnrollTab('upload')}>⬆ Upload CSV</button>
      </div>

      {enrollTab === 'individual' && (
        <div className={styles.enrollGrid}>
          {/* Assign form */}
          <div className="card">
            <div className="section-head">Assign Transport to Student</div>
            {msg && <div className="badge green" style={{ marginBottom: 12, display: 'block' }}>✓ {msg}</div>}
            {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>⚠ {err}</div>}
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Student</label>
                <input className="form-input" placeholder="Type name or admission no…"
                  value={form.studentSearch}
                  onChange={e => setForm(f => ({ ...f, studentSearch: e.target.value, studentId: '' }))} />
                {form.studentSearch.length >= 2 && !form.studentId && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', marginTop: 4, maxHeight: 160, overflowY: 'auto', zIndex: 10, position: 'relative' }}>
                    {students.filter(s => `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase().includes(form.studentSearch.toLowerCase())).slice(0, 8).map(s => (
                      <div key={s.studentId}
                        onClick={() => setForm(f => ({ ...f, studentId: s.studentId, studentSearch: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }))}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                      >
                        <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                        <span style={{ color: 'var(--ink-muted)', marginLeft: 8 }}>{s.admissionNumber} · Grade {s.gradeLevel}</span>
                      </div>
                    ))}
                    {students.filter(s => `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase().includes(form.studentSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '8px 12px', color: 'var(--ink-muted)', fontSize: 13 }}>No students found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group"><label className="form-label">Route</label>
                <select className="form-select" value={form.routeId} onChange={e => {
                  const routeId = e.target.value
                  const linked = routes.find(r => String(r.routeId) === String(routeId))?.vehicle?.vehicleId
                  setForm(f => ({ ...f, routeId, vehicleId: linked ? String(linked) : f.vehicleId }))
                }}>
                  <option value="">— Select Route —</option>
                  {routes.map(r => <option key={r.routeId} value={r.routeId}>{r.routeName}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Vehicle</label>
                <select className="form-select" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
                  <option value="">— Select Vehicle —</option>
                  {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber} (Cap. {v.capacity})</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Pickup Stop</label>
                <input className="form-input" placeholder="Default: route start" value={form.pickupPoint} onChange={e => setForm(f => ({ ...f, pickupPoint: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Drop Stop</label>
                <input className="form-input" placeholder="Default: route end" value={form.dropPoint} onChange={e => setForm(f => ({ ...f, dropPoint: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Effective From</label>
                <input className="form-input" type="date" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Effective To (optional)</label>
                <input className="form-input" type="date" value={form.effectiveTo} onChange={e => setForm(f => ({ ...f, effectiveTo: e.target.value }))} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Saving…' : 'Save Assignment'}
              </button>
            </form>
          </div>

          {/* Current assignments grouped by route */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-head" style={{ margin: 0 }}>Current Enrollments</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedAids.size > 0 && (
                  <button style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    onClick={handleBulkRemove}>
                    🗑 Remove {selectedAids.size} selected
                  </button>
                )}
                {assignments.length > 0 && (
                  <button className="btn-ghost" style={{ fontSize: 12 }}
                    onClick={() => {
                      const allRouteIds = [...new Set(assignments.map(a => String(a.routeId || a.route?.routeId)))]
                      const allCollapsed = allRouteIds.every(id => collapsedRoutes.has(id))
                      setCollapsedRoutes(allCollapsed ? new Set() : new Set(allRouteIds))
                    }}>
                    {[...new Set(assignments.map(a => String(a.routeId || a.route?.routeId)))].every(id => collapsedRoutes.has(id)) ? '▼ Expand All' : '▶ Collapse All'}
                  </button>
                )}
              </div>
            </div>
            {assignments.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '16px 0' }}>No transport assignments yet.</p>
            ) : (() => {
              // Group assignments by route
              const byRoute = {}
              assignments.forEach(a => {
                const rte = a.route || routeMap[a.routeId]
                const routeKey = String(rte?.routeId || a.routeId || 'unassigned')
                if (!byRoute[routeKey]) byRoute[routeKey] = { route: rte, assignments: [] }
                byRoute[routeKey].assignments.push(a)
              })
              const sortedRoutes = Object.entries(byRoute).sort(([,a],[,b]) => {
                const an = a.route?.routeName || 'z'
                const bn = b.route?.routeName || 'z'
                return an.localeCompare(bn)
              })

              return sortedRoutes.map(([routeKey, { route: rte, assignments: routeAssignments }]) => {
                const isCollapsed = collapsedRoutes.has(routeKey)
                const allRouteSelected = routeAssignments.every(a => selectedAids.has(a.assignmentId))

                return (
                  <div key={routeKey} style={{ marginBottom: 16 }}>
                    {/* Route header */}
                    <div
                      onClick={() => toggleRouteCollapse(routeKey)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border)', marginBottom: isCollapsed ? 0 : 8 }}>
                      <input type="checkbox"
                        checked={allRouteSelected && routeAssignments.length > 0}
                        onChange={() => {
                          setSelectedAids(prev => {
                            const next = new Set(prev)
                            const ids = routeAssignments.map(a => a.assignmentId)
                            const allIn = ids.every(id => next.has(id))
                            ids.forEach(id => allIn ? next.delete(id) : next.add(id))
                            return next
                          })
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{isCollapsed ? '▶' : '▼'}</span>
                      <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14 }}>
                        {rte ? rte.routeName : `Route ${routeKey}`}
                      </span>
                      {rte?.startPoint && rte?.endPoint && (
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          {rte.startPoint} → {rte.endPoint}
                        </span>
                      )}
                      <span className="badge muted" style={{ marginLeft: 'auto' }}>{routeAssignments.length} students</span>
                    </div>

                    {!isCollapsed && (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: 36 }}><input type="checkbox"
                                checked={routeAssignments.every(a => selectedAids.has(a.assignmentId))}
                                onChange={() => {
                                  setSelectedAids(prev => {
                                    const next = new Set(prev)
                                    const ids = routeAssignments.map(a => a.assignmentId)
                                    const allIn = ids.every(id => next.has(id))
                                    ids.forEach(id => allIn ? next.delete(id) : next.add(id))
                                    return next
                                  })
                                }} /></th>
                              <th>Student</th><th>Grade</th><th>Vehicle</th><th>Pickup</th><th>From</th><th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {routeAssignments.map(a => {
                              const stu = a.student || studentMap[a.studentId]
                              const veh = a.vehicle || vehicleMap[a.vehicleId]
                              return (
                                <tr key={a.assignmentId} style={{ background: selectedAids.has(a.assignmentId) ? 'var(--red-light)' : undefined }}>
                                  <td><input type="checkbox" checked={selectedAids.has(a.assignmentId)} onChange={() => toggleAid(a.assignmentId)} /></td>
                                  <td><span style={{ fontWeight: 600 }}>{stu ? `${stu.firstName} ${stu.lastName}` : `ID ${a.studentId}`}</span></td>
                                  <td><span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{stu ? `Grade ${stu.gradeLevel}${stu.section ? `-${stu.section}` : ''}` : '—'}</span></td>
                                  <td>{veh ? veh.registrationNumber : <span style={{ color: 'var(--ink-muted)' }}>—</span>}</td>
                                  <td>{a.pickupPoint || '—'}</td>
                                  <td style={{ fontSize: 12 }}>{a.effectiveFrom ? new Date(a.effectiveFrom).toLocaleDateString('en-IN') : '—'}</td>
                                  <td><button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }} onClick={() => handleRemove(a.assignmentId)}>Remove</button></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {enrollTab === 'upload' && (
        <TransportCSVUpload
          students={students} routes={routes} vehicles={vehicles}
          onDone={onReload}
        />
      )}
    </div>
  )
}

// ── Transport CSV Upload sub-component ───────────────────────────────────────
const TRANSPORT_CSV_HEADERS = ['admission_number', 'route_name', 'vehicle_registration', 'pickup_point', 'drop_point', 'effective_from', 'transport_fee']

function downloadTransportTemplate() {
  const rows = [
    TRANSPORT_CSV_HEADERS.join(','),
    'DPS2024001,Route 1,KA01AB1234,Koramangala Bus Stop,School Main Gate,2024-06-01,1200',
    'DPS2024002,Route 2,KA01AB5678,Indiranagar 100ft Road,School Side Gate,2024-06-01,1400',
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'transport_assignment_template.csv'; a.click()
  URL.revokeObjectURL(url)
}

function TransportCSVUpload({ students, routes, vehicles, onDone }) {
  const [rows,      setRows]      = useState([])
  const [step,      setStep]      = useState('upload') // upload | preview | done
  const [uploading, setUploading] = useState(false)
  const [result,    setResult]    = useState(null)
  const fileRef = useRef(null)

  const studentByAdm = Object.fromEntries(students.map(s => [(s.admissionNumber || '').toLowerCase(), s]))
  const routeByName  = Object.fromEntries(routes.map(r => [(r.routeName || '').toLowerCase(), r]))
  const vehicleByReg = Object.fromEntries(vehicles.map(v => [(v.registrationNumber || '').toLowerCase(), v]))

  function parseFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const lines = splitCSVRows(e.target.result)
      if (lines.length < 2) return alert('No data rows found.')
      const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
      const parsed = lines.slice(1).filter(l => l.trim()).map((line, idx) => {
        const vals = splitCSVLine(line)
        const raw = {}
        headers.forEach((h, i) => { raw[h] = vals[i] || '' })
        const admKey  = (raw['admission_number'] || '').toLowerCase()
        const rteKey  = (raw['route_name'] || '').toLowerCase()
        const student = studentByAdm[admKey]
        const route   = routeByName[rteKey]
        const vehReg  = raw['vehicle_registration'] || ''
        const vehicle = vehicleByReg[vehReg.toLowerCase()]
        const vehicleId = vehicle?.vehicleId ?? route?.vehicle?.vehicleId
        const errors  = []
        if (!raw['admission_number']) errors.push('admission_number required')
        else if (!student)            errors.push(`Student "${raw['admission_number']}" not found`)
        if (!raw['route_name'])       errors.push('route_name required')
        else if (!route)              errors.push(`Route "${raw['route_name']}" not found`)
        if (vehReg && !vehicle)       errors.push(`Vehicle "${vehReg}" not found`)
        else if (route && !vehicleId) errors.push('vehicle_registration required (route has no vehicle)')
        return {
          _row: idx + 2, _errors: errors, _valid: errors.length === 0,
          admissionNumber: raw['admission_number'],
          routeName: raw['route_name'],
          pickupPoint: raw['pickup_point'] !== undefined ? raw['pickup_point'] : '',
          dropPoint:   raw['drop_point']   !== undefined ? raw['drop_point']   : '',
          effectiveFrom: raw['effective_from'] || new Date().toISOString().slice(0, 10),
          transportFee: parseFloat(raw['transport_fee']) || 0,
          studentId: student?.studentId,
          routeId:   route?.routeId,
          vehicleId,
        }
      })
      setRows(parsed); setStep('preview')
    }
    reader.readAsText(file)
  }

  async function handleUpload() {
    const valid = rows.filter(r => r._valid)
    if (!valid.length) return alert('No valid rows.')
    setUploading(true)
    const saved = [], failed = []
    for (const r of valid) {
      try {
        await createAssignment(r.studentId, r.routeId, r.vehicleId, {
          pickupPoint: r.pickupPoint,
          dropPoint: r.dropPoint,
          effectiveFrom: r.effectiveFrom,
          effectiveTo: null,
        })
        saved.push(r.admissionNumber)
        if (r.transportFee > 0) {
          try {
            // Find or create a TRANSPORT fee structure matching the amount
            const structures = await getFeeStructures()
            let fs = structures.find(s => s.feeType === 'TRANSPORT' && Math.abs((s.amount || 0) - r.transportFee) < 0.01)
            if (!fs) {
              const student = students.find(s => s.studentId === r.studentId)
              fs = await createFeeStructure({
                feeType: 'TRANSPORT',
                gradeLevel: String(student?.gradeLevel || 'ALL'),
                academicYear: '2025-26',
                amount: r.transportFee,
                dueDate: r.effectiveFrom,
                recurring: true,
              })
            }
            await createInvoice(r.studentId, fs.feeStructureId, null, {
              invoiceDate: new Date().toISOString().slice(0, 10),
              dueDate: r.effectiveFrom,
              totalAmount: r.transportFee,
              status: 'UNPAID',
            })
          } catch (e) {
            console.warn('Fee invoice creation failed for', r.admissionNumber, e)
          }
        }
      } catch (e) { failed.push(r.admissionNumber) }
    }
    setResult({ saved, failed })
    setStep('done')
    onDone()
    setUploading(false)
  }

  const validCount   = rows.filter(r => r._valid).length
  const invalidCount = rows.filter(r => !r._valid).length

  return (
    <div className="card">
      <div className="section-head">Upload Transport Assignment CSV</div>

      {step === 'upload' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16 }}>
            Upload a CSV to bulk-assign students to routes. Rows are matched by admission number and route name.
          </div>
          <div className="upload-zone" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
            <div className="upload-icon">🚌</div>
            <div className="upload-title">Drop CSV or click to browse</div>
            <div className="upload-sub">Columns: admission_number, route_name, vehicle_registration, pickup_point, drop_point, effective_from, transport_fee</div>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => parseFile(e.target.files[0])} />
          </div>
          <div className={styles.templateRowSmall}>
            <span>Need the format?</span>
            <button className="btn-ghost" onClick={downloadTransportTemplate}>⬇ Download Template</button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {validCount > 0   && <span className="badge green">{validCount} valid</span>}
            {invalidCount > 0 && <span className="badge red">{invalidCount} invalid</span>}
            <button className="btn-ghost" onClick={() => { setRows([]); setStep('upload'); if (fileRef.current) fileRef.current.value = '' }}>← Back</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Row</th><th>Admission No.</th><th>Route</th><th>Pickup</th><th>Drop</th><th>Transport Fee</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._row} style={{ background: r._valid ? undefined : 'var(--red-light)' }}>
                    <td style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{r._row}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.admissionNumber}</td>
                    <td>{r.routeName}</td>
                    <td>{r.pickupPoint || '—'}</td>
                    <td>{r.dropPoint || '—'}</td>
                    <td>{r.transportFee > 0 ? `₹${r.transportFee.toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      {r._valid
                        ? <span className="badge green">✓ Ready</span>
                        : <span title={r._errors.join(', ')} className="badge red">⚠ {r._errors[0]}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {validCount > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading…' : `🚌 Assign ${validCount} Student${validCount > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </>
      )}

      {step === 'done' && result && (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {result.saved.length} Students Assigned!
          </div>
          {result.failed.length > 0 && (
            <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>
              {result.failed.length} failed: {result.failed.join(', ')}
            </div>
          )}
          <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => { setRows([]); setResult(null); setStep('upload'); if (fileRef.current) fileRef.current.value = '' }}>
            Upload Another
          </button>
        </div>
      )}
    </div>
  )
}
