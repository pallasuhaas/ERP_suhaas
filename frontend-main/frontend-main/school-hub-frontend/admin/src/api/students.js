import { splitCSVLine, splitCSVRows } from './csv'
import { friendlyError, safeFetch } from './errors'

const BASE = '/api/students'

export async function getStudents() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export async function createStudent(student) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  })
  if (!res.ok) throw new Error('Failed to create student')
  return res.json()
}

export async function updateStudent(id, student) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  })
  if (!res.ok) throw new Error('Failed to update student')
  return res.json()
}

// BUG-010: an active student is archived; an archived one is removed for good only if no other
// service still references it (otherwise the server answers 409 with the reason, shown to the user).
export async function deleteStudent(id) {
  const res = await safeFetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(friendlyError(res.status, await res.text().catch(() => '')))
  return res.json().catch(() => null)
}

export async function bulkCreateStudents(students) {
  const res = await fetch(`${BASE}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(students),
  })
  if (!res.ok) throw new Error('Bulk upload failed')
  return res.json()
}

// CSV template column order
const TEMPLATE_HEADERS = [
  'first_name', 'last_name', 'date_of_birth', 'gender',
  'admission_number', 'admission_date', 'grade_level', 'section',
  'parent_name', 'parent_relationship', 'parent_phone',
]

export function downloadTemplate() {
  const rows = [
    TEMPLATE_HEADERS.join(','),
    'Arjun,Sharma,2010-03-15,Male,DPS2024001,2024-06-01,8,A,Priya Sharma,Mother,9845001122',
    'Ananya,Rao,2009-07-22,Female,DPS2024002,2024-06-01,10,A,Suresh Rao,Father,9900112233',
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'student_upload_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Parse a CSV text string into an array of validated row objects.
// Each row has the Student API fields plus _row, _errors, _valid.
export function parseCSV(text) {
  const lines = splitCSVRows(text)
  if (lines.length < 2) return []

  const rawHeaders = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))

  return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const values = splitCSVLine(line)
    const raw = {}
    rawHeaders.forEach((h, i) => { raw[h] = values[i] ?? '' })

    const student = {
      firstName:       raw['first_name']      || '',
      lastName:        raw['last_name']        || '',
      dateOfBirth:     raw['date_of_birth']    || '',
      gender:          raw['gender']           || '',
      admissionNumber: raw['admission_number'] || '',
      admissionDate:   raw['admission_date']   || '',
      gradeLevel:      raw['grade_level']      || '',
      section:         raw['section']          || '',
      status:          'ACTIVE',
    }

    const errors = []
    if (!student.firstName)       errors.push('first_name required')
    if (!student.lastName)        errors.push('last_name required')
    if (!student.admissionNumber) errors.push('admission_number required')
    if (!student.dateOfBirth)     errors.push('date_of_birth required')
    if (!student.admissionDate)   errors.push('admission_date required')
    if (!student.gradeLevel)      errors.push('grade_level required')
    if (!student.gender)          errors.push('gender required')
    if (!raw['parent_name'])      errors.push('parent_name required')
    if (!raw['parent_phone'])     errors.push('parent_phone required')

    return {
      ...student,
      _parentName: raw['parent_name']         || '',
      _parentRel:  raw['parent_relationship'] || 'Parent',
      _parentPhone:raw['parent_phone']        || '',
      _row: idx + 2, _errors: errors, _valid: errors.length === 0,
    }
  })
}

// ─── req helper (mirrors transport.js pattern) ────────────────────────────────
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

// ─── Student Status ───────────────────────────────────────────────────────────
export const updateStudentStatus = (id, status) =>
  req(`/api/students/${id}/status?status=${status}`, { method: 'PATCH' })

export const getArchivedStudents = () => req('/api/students/archived')

// ─── Student Documents ────────────────────────────────────────────────────────
export const getStudentDocuments = studentId =>
  fetch(`/api/student-documents/student/${studentId}`).then(r => r.ok ? r.json() : [])

export const uploadStudentDocument = (studentId, file, documentType) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('documentType', documentType)
  return fetch(`/api/student-documents/student/${studentId}`, { method: 'POST', body: fd })
    .then(r => { if (!r.ok) throw new Error('Upload failed'); return r.json() })
}

export const deleteStudentDocument = docId =>
  fetch(`/api/student-documents/${docId}`, { method: 'DELETE' })
