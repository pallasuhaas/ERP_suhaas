const BASE = '/api'

async function req(url) {
  const res = await fetch(url)
  // BUG-017: keep the status so callers can tell "server answered with an error" from "server unreachable"
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
  return res.json()
}

/** Look up all guardian records by phone number.
 *  Returns List<Guardian>, each containing a nested .student object.
 *  Empty list = no account found for this phone.
 */
export async function lookupByPhone(phone) {
  return req(`${BASE}/guardians/phone/${phone}`)
}

/** Get all fee invoices for a given studentId (payment-service). */
export async function getStudentInvoices(studentId) {
  return req(`${BASE}/fee-invoices/student/${studentId}`)
}

/** Get transport assignments for a given studentId (transport-service). */
export async function getStudentTransport(studentId) {
  return req(`${BASE}/transport-assignments/student/${studentId}`)
}

/** Get route stops for a routeId, ordered by sequenceOrder. */
export async function getRouteStops(routeId) {
  return req(`${BASE}/route-stops?routeId=${routeId}`)
}
