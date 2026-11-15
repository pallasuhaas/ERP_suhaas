const BASE = '/api'

async function req(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || res.statusText)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : null
}

// ─── Fee Structures ─────────────────────────────────────────────────────────
export const getFeeStructures = () => req(`${BASE}/fee-structures`)
export const getFeeStructure  = id => req(`${BASE}/fee-structures/${id}`)
export const createFeeStructure = data => req(`${BASE}/fee-structures`, { method: 'POST', body: JSON.stringify(data) })
export const updateFeeStructure = (id, data) => req(`${BASE}/fee-structures/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFeeStructure = id => req(`${BASE}/fee-structures/${id}`, { method: 'DELETE' })

// ─── Fee Invoices ────────────────────────────────────────────────────────────
export const getInvoices          = () => req(`${BASE}/fee-invoices`)
export const getInvoice           = id => req(`${BASE}/fee-invoices/${id}`)
export const getInvoicesByStudent = studentId => req(`${BASE}/fee-invoices/student/${studentId}`)
export const createInvoice        = (studentId, feeStructureId, discountId, data) => {
  const params = new URLSearchParams({ studentId, feeStructureId })
  if (discountId) params.append('discountId', discountId)
  return req(`${BASE}/fee-invoices?${params}`, { method: 'POST', body: JSON.stringify(data) })
}
export const updateInvoice        = (id, data) => req(`${BASE}/fee-invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteInvoice        = id => req(`${BASE}/fee-invoices/${id}`, { method: 'DELETE' })

// ─── Payment Transactions ────────────────────────────────────────────────────
export const getTransactions            = () => req(`${BASE}/payment-transactions`)
export const getTransactionsByInvoice   = invoiceId => req(`${BASE}/payment-transactions/invoice/${invoiceId}`)
export const createTransaction          = data => req(`${BASE}/payment-transactions`, { method: 'POST', body: JSON.stringify(data) })

// ─── Discount Policies ───────────────────────────────────────────────────────
export const getDiscounts  = () => req(`${BASE}/discount-policies`)
export const createDiscount= data => req(`${BASE}/discount-policies`, { method: 'POST', body: JSON.stringify(data) })
export const deleteDiscount= id => req(`${BASE}/discount-policies/${id}`, { method: 'DELETE' })

// ─── Academic Years ──────────────────────────────────────────────────────────
export const getAcademicYears   = () => req(`${BASE}/academic-years`)
export const createAcademicYear = data => req(`${BASE}/academic-years`, { method: 'POST', body: JSON.stringify(data) })
export const updateAcademicYear = (id, data) => req(`${BASE}/academic-years/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAcademicYear = id => req(`${BASE}/academic-years/${id}`, { method: 'DELETE' })

// ─── Fee Terms ───────────────────────────────────────────────────────────────
export const getFeeTerms    = yearId => req(`${BASE}/academic-years/${yearId}/terms`)
export const createFeeTerm  = (yearId, data) => req(`${BASE}/academic-years/${yearId}/terms`, { method: 'POST', body: JSON.stringify(data) })
export const updateFeeTerm  = (termId, data) => req(`${BASE}/academic-years/terms/${termId}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFeeTerm  = termId => req(`${BASE}/academic-years/terms/${termId}`, { method: 'DELETE' })
