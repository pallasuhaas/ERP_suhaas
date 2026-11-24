import { friendlyError, safeFetch } from './errors'

const BASE = '/api'

async function req(url, opts = {}) {
  const res = await safeFetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(friendlyError(res.status, text))
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : null
}

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const getVehicles  = () => req(`${BASE}/vehicles`)
export const getVehicle   = id => req(`${BASE}/vehicles/${id}`)
export const createVehicle= (driverId, data) => {
  const params = driverId ? `?driverId=${driverId}` : ''
  return req(`${BASE}/vehicles${params}`, { method: 'POST', body: JSON.stringify(data) })
}
export const updateVehicle= (id, data) => req(`${BASE}/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteVehicle= id => req(`${BASE}/vehicles/${id}`, { method: 'DELETE' })

// ─── Drivers ─────────────────────────────────────────────────────────────────
export const getDrivers  = () => req(`${BASE}/drivers`)
export const getDriver   = id => req(`${BASE}/drivers/${id}`)
export const createDriver= data => req(`${BASE}/drivers`, { method: 'POST', body: JSON.stringify(data) })
export const updateDriver= (id, data) => req(`${BASE}/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteDriver= id => req(`${BASE}/drivers/${id}`, { method: 'DELETE' })

// ─── Routes ───────────────────────────────────────────────────────────────────
export const getRoutes  = () => req(`${BASE}/transport-routes`)
export const getRoute   = id => req(`${BASE}/transport-routes/${id}`)
export const createRoute= (data, vehicleId) => {
  const params = vehicleId ? `?vehicleId=${vehicleId}` : ''
  return req(`${BASE}/transport-routes${params}`, { method: 'POST', body: JSON.stringify(data) })
}
export const updateRoute= (id, data, vehicleId) => {
  const params = vehicleId != null ? `?vehicleId=${vehicleId}` : ''
  return req(`${BASE}/transport-routes/${id}${params}`, { method: 'PUT', body: JSON.stringify(data) })
}
export const deleteRoute= id => req(`${BASE}/transport-routes/${id}`, { method: 'DELETE' })

// ─── Route Stops ─────────────────────────────────────────────────────────────
export const getStopsByRoute  = routeId => req(`${BASE}/route-stops/route/${routeId}`)
export const createStop       = (routeId, data) => req(`${BASE}/route-stops/route/${routeId}`, { method: 'POST', body: JSON.stringify(data) })
export const deleteStop       = id => req(`${BASE}/route-stops/${id}`, { method: 'DELETE' })

// ─── Transport Assignments ────────────────────────────────────────────────────
export const getAssignments         = () => req(`${BASE}/transport-assignments`)
export const getAssignmentsByStudent= studentId => req(`${BASE}/transport-assignments/student/${studentId}`)
export const createAssignment       = (studentId, routeId, vehicleId, data) => {
  const params = new URLSearchParams({ studentId, routeId })
  if (vehicleId) params.append('vehicleId', vehicleId)
  return req(`${BASE}/transport-assignments?${params}`, { method: 'POST', body: JSON.stringify(data) })
}
export const updateAssignment       = (id, data) => req(`${BASE}/transport-assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAssignment       = id => req(`${BASE}/transport-assignments/${id}`, { method: 'DELETE' })
