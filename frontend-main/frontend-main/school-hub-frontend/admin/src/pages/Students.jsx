import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import styles from './Students.module.css'
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  bulkCreateStudents, downloadTemplate, parseCSV,
  updateStudentStatus, getArchivedStudents,
  getStudentDocuments, uploadStudentDocument, deleteStudentDocument,
} from '../api/students'
import { getFeeStructures, createInvoice, deleteInvoice, getInvoicesByStudent } from '../api/finance'
import { getRoutes, getVehicles, createAssignment, getAssignments } from '../api/transport'

const GENDERS = ['Male', 'Female', 'Other']
const TODAY = new Date().toISOString().split('T')[0]

// ── Guardian API helpers ─────────────────────────────────────────────────────
async function getGuardiansByStudent(studentId) {
  const res = await fetch(`/api/guardians/student/${studentId}`)
  if (!res.ok) return []
  return res.json()
}

async function createGuardian(studentId, data) {
  const res = await fetch(`/api/guardians/student/${studentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create guardian')
  return res.json()
}

async function updateGuardian(guardianId, data) {
  const res = await fetch(`/api/guardians/${guardianId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update guardian')
  return res.json()
}

function blankForm() {
  return { firstName: '', lastName: '', dateOfBirth: '', gender: 'Male',
           admissionNumber: '', admissionDate: TODAY, gradeLevel: '', section: '' }
}

function blankGuardian() {
  return { fullName: '', relationship: 'Parent', phone: '', alternatePhone: '', isPrimary: false, guardianId: null }
}

const RELATIONSHIPS = ['Parent', 'Father', 'Mother', 'Guardian', 'Grand Parent', 'Other']
const DOC_TYPES = ['Birth Certificate', 'Aadhaar Card', 'Transfer Certificate', 'Medical Report', 'Photo ID', 'Other']

export default function Students() {
  const [tab, setTab]               = useState('list')
  const [students, setStudents]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState(null)
  const [search, setSearch]         = useState('')

  // ── Multi-select grade/section filter ────────────────────────────────────────
  const [filterGrades,   setFilterGrades]   = useState([])
  const [filterSections, setFilterSections] = useState([])
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const filterDropdownRef = useRef(null)

  const [selected, setSelected]     = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData]     = useState(blankForm())
  const [addParentPhone, setAddParentPhone]    = useState('')
  const [addParentName, setAddParentName]      = useState('')
  const [addParentRel,  setAddParentRel]       = useState('Parent')
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState(null)

  // Inline edit state — keyed by studentId
  const [editStudentId, setEditStudentId] = useState(null)
  const [editForm,      setEditForm]      = useState({})
  // Legacy single guardian kept for backward compat in handleSaveEdit
  const [editGuardian,  setEditGuardian]  = useState(null)
  // Multi-guardian support
  const [editGuardians, setEditGuardians] = useState([])
  const [editSaving,    setEditSaving]    = useState(false)
  const [editError,     setEditError]     = useState(null)

  // Document state
  const [editDocs,     setEditDocs]     = useState([])
  const [docUploading, setDocUploading] = useState(false)
  const [docType,      setDocType]      = useState('Other')

  // Bulk action state
  const [feeStructures,  setFeeStructures]  = useState([])
  const [routes,         setRoutes]         = useState([])
  const [vehicles,       setVehicles]       = useState([])
  const [bulkGrade,      setBulkGrade]      = useState('')
  const [bulkRouteId,    setBulkRouteId]    = useState('')
  const [bulkVehicleId,  setBulkVehicleId]  = useState('')
  const [bulkNewGrade,   setBulkNewGrade]   = useState('')
  const [bulkNewSection, setBulkNewSection] = useState('')
  const [bulkSaving,     setBulkSaving]     = useState(false)
  const [bulkMsg,        setBulkMsg]        = useState(null)
  const [bulkErr,        setBulkErr]        = useState(null)

  // Transport assignments
  const [assignments, setAssignments] = useState([])

  // Collapsed grade sections
  const [collapsedGrades, setCollapsedGrades] = useState(new Set())

  // Archived students tab
  const [archivedStudents, setArchivedStudents] = useState([])
  const [archivedLoading,  setArchivedLoading]  = useState(false)

  // Bulk upload state
  const [uploadStep,    setUploadStep]    = useState('upload')
  const [parsedRows,    setParsedRows]    = useState([])
  const [isDragOver,    setIsDragOver]    = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [uploadResult,  setUploadResult]  = useState(null)
  const fileInputRef = useRef(null)

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadStudents()
    getFeeStructures().then(setFeeStructures).catch(() => {})
    getRoutes().then(setRoutes).catch(() => {})
    getVehicles().then(setVehicles).catch(() => {})
    getAssignments().then(setAssignments).catch(() => {})
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initializedCollapse = useRef(false)

  async function loadStudents() {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getStudents()
      setStudents(data)
      // On first load, collapse all grade sections by default
      if (!initializedCollapse.current && data.length > 0) {
        setCollapsedGrades(new Set(data.map(s => String(s.gradeLevel))))
        initializedCollapse.current = true
      }
    } catch {
      setLoadError('Could not load students. Is student-info-service running?')
    } finally {
      setLoading(false)
    }
  }

  async function loadArchived() {
    setArchivedLoading(true)
    try {
      const data = await getArchivedStudents()
      setArchivedStudents(data || [])
    } catch {
      setArchivedStudents([])
    } finally {
      setArchivedLoading(false)
    }
  }

  // ── Derived lists ────────────────────────────────────────────────────────────
  const availableGrades = [...new Set(students.map(s => String(s.gradeLevel)))].sort((a, b) => Number(a) - Number(b))
  const availableSections = [...new Set(students.map(s => s.section).filter(Boolean))].sort()

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.admissionNumber?.toLowerCase().includes(q)
    const matchGrade   = filterGrades.length === 0   || filterGrades.includes(String(s.gradeLevel))
    const matchSection = filterSections.length === 0 || filterSections.includes(s.section)
    const matchStatus  = s.status !== 'ARCHIVED'
    return matchSearch && matchGrade && matchSection && matchStatus
  })

  const grouped = {}
  filtered.forEach(s => {
    const grade = String(s.gradeLevel || 'Unknown')
    const sec   = s.section || '—'
    if (!grouped[grade]) grouped[grade] = {}
    if (!grouped[grade][sec]) grouped[grade][sec] = []
    grouped[grade][sec].push(s)
  })
  const gradeSortedKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))

  // ── Assignment map ────────────────────────────────────────────────────────────
  const assignmentByStudent = useMemo(() => {
    const m = {}
    assignments.forEach(a => {
      if (!m[a.studentId]) m[a.studentId] = a
    })
    return m
  }, [assignments])

  // ── Selection ────────────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id])
  }
  function toggleGrade(gradeStudents) {
    const ids = gradeStudents.map(s => s.studentId)
    const allIn = ids.every(id => selected.includes(id))
    setSelected(sel => allIn ? sel.filter(id => !ids.includes(id)) : [...new Set([...sel, ...ids])])
  }
  function toggleSection(sectionStudents) {
    const ids = sectionStudents.map(s => s.studentId)
    const allIn = ids.every(id => selected.includes(id))
    setSelected(sel => allIn ? sel.filter(id => !ids.includes(id)) : [...new Set([...sel, ...ids])])
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────────
  async function handleBulkAssignFee() {
    if (!bulkGrade) return setBulkErr('Select a grade level first.')
    setBulkErr(null); setBulkSaving(true)

    const gradeStructures = feeStructures.filter(
      fs => fs.feeType !== 'TRANSPORT' && (fs.gradeLevel === bulkGrade || fs.gradeLevel === 'ALL')
    )
    if (gradeStructures.length === 0) {
      setBulkSaving(false)
      return setBulkErr(`No fee structures found for Grade ${bulkGrade}.`)
    }

    try {
      const existingInvoiceLists = await Promise.all(
        selected.map(sid => getInvoicesByStudent(sid).catch(() => []))
      )
      const deleteOps = existingInvoiceLists.flatMap(invList =>
        invList
          .filter(inv => inv.feeStructure?.feeType !== 'TRANSPORT')
          .map(inv => deleteInvoice(inv.invoiceId))
      )
      await Promise.all(deleteOps)

      const today = new Date().toISOString().slice(0, 10)
      await Promise.all(
        selected.flatMap(sid =>
          gradeStructures.map(fs =>
            createInvoice(sid, fs.feeStructureId, null, {
              invoiceDate: today,
              dueDate: fs.dueDate || null,
              totalAmount: fs.amount,
              status: 'UNPAID',
            })
          )
        )
      )

      const total = gradeStructures.reduce((s, fs) => s + (fs.amount || 0), 0)
      setBulkMsg(`Grade ${bulkGrade} fees assigned to ${selected.length} students (${gradeStructures.length} structures · ₹${total.toLocaleString('en-IN')} total).`)
      setBulkGrade(''); setSelected([])
      setTimeout(() => setBulkMsg(null), 4000)
    } catch (e) {
      setBulkErr(e.message)
    } finally {
      setBulkSaving(false)
    }
  }

  async function handleBulkAssignRoute() {
    if (!bulkRouteId || !bulkVehicleId) return setBulkErr('Select both a route and vehicle.')
    setBulkErr(null); setBulkSaving(true)
    try {
      await Promise.all(selected.map(sid => createAssignment(sid, bulkRouteId, bulkVehicleId, {
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: null,
      })))
      setBulkMsg(`Transport assigned to ${selected.length} students.`)
      setBulkRouteId(''); setBulkVehicleId(''); setSelected([])
      setTimeout(() => setBulkMsg(null), 3000)
    } catch (e) { setBulkErr(e.message) }
    finally { setBulkSaving(false) }
  }

  async function handleBulkSetGradeSection() {
    if (!bulkNewGrade && !bulkNewSection) return setBulkErr('Enter a grade or section to apply.')
    setBulkErr(null); setBulkSaving(true)
    try {
      await Promise.all(selected.map(sid => {
        const stu = students.find(s => s.studentId === sid)
        if (!stu) return Promise.resolve()
        return updateStudent(sid, {
          ...stu,
          gradeLevel: bulkNewGrade || stu.gradeLevel,
          section: bulkNewSection || stu.section,
        })
      }))
      setBulkMsg(`Grade/section updated for ${selected.length} students.`)
      setBulkNewGrade(''); setBulkNewSection(''); setSelected([])
      await loadStudents()
      setTimeout(() => setBulkMsg(null), 3000)
    } catch (e) { setBulkErr(e.message) }
    finally { setBulkSaving(false) }
  }

  // ── Add student ───────────────────────────────────────────────────────────────
  async function handleSaveStudent() {
    if (!formData.firstName || !formData.lastName || !formData.admissionNumber) {
      setFormError('First name, last name and admission number are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const newStudent = await createStudent({ ...formData, status: 'ACTIVE' })
      if ((addParentPhone || addParentName) && newStudent?.studentId) {
        try {
          await createGuardian(newStudent.studentId, {
            fullName: addParentName || 'Parent/Guardian',
            relationship: addParentRel || 'Parent',
            phone: addParentPhone || '',
          })
        } catch {
          // guardian save failed silently — student was saved
        }
      }
      setShowAddForm(false)
      setFormData(blankForm())
      setAddParentPhone('')
      setAddParentName('')
      setAddParentRel('Parent')
      await loadStudents()
    } catch {
      setFormError('Save failed — admission number may already exist.')
    } finally {
      setSaving(false)
    }
  }

  // ── Inline edit ───────────────────────────────────────────────────────────────
  async function openEditStudent(s) {
    setEditStudentId(s.studentId)
    setEditForm({ ...s, parentPhone: '', parentName: '', parentRelationship: 'Parent' })
    setEditGuardian(null)
    setEditGuardians([])
    setEditDocs([])
    setEditError(null)
    try {
      const guardians = await getGuardiansByStudent(s.studentId)
      if (guardians && guardians.length > 0) {
        const g = guardians[0]
        setEditGuardian(g)
        setEditForm(f => ({
          ...f,
          parentPhone: g.phone || '',
          parentName: g.fullName || '',
          parentRelationship: g.relationship || 'Parent',
        }))
        // Load all guardians for multi-guardian support
        const mapped = guardians.map(gu => ({
          guardianId:     gu.guardianId || null,
          fullName:       gu.fullName || '',
          relationship:   gu.relationship || 'Parent',
          phone:          gu.phone || '',
          alternatePhone: gu.alternatePhone || '',
          isPrimary:      gu.isPrimary || false,
        }))
        // Ensure we always show at least 2 rows
        while (mapped.length < 2) mapped.push(blankGuardian())
        setEditGuardians(mapped)
      } else {
        setEditGuardians([blankGuardian(), blankGuardian()])
      }
    } catch {
      setEditGuardians([blankGuardian(), blankGuardian()])
    }
    // Load documents
    try {
      const docs = await getStudentDocuments(s.studentId)
      setEditDocs(docs || [])
    } catch {
      setEditDocs([])
    }
  }

  async function handleSaveEdit() {
    setEditError(null)
    setEditSaving(true)
    try {
      const {
        parentPhone, parentName, parentRelationship,
        aaparNumber, medicalNotes, specialNotes,
        ...studentData
      } = editForm
      await updateStudent(editStudentId, {
        ...studentData,
        aaparNumber:  aaparNumber  || null,
        medicalNotes: medicalNotes || null,
        specialNotes: specialNotes || null,
      })

      // Save guardians (up to 2)
      const filledGuardians = editGuardians.filter((g, i) => i === 0 || g.fullName.trim())
      for (const g of filledGuardians) {
        const payload = {
          fullName:       g.fullName || 'Parent/Guardian',
          relationship:   g.relationship || 'Parent',
          phone:          g.phone || '',
          alternatePhone: g.alternatePhone || '',
          isPrimary:      g.isPrimary,
        }
        if (g.guardianId) {
          await updateGuardian(g.guardianId, payload)
        } else if (g.fullName.trim()) {
          await createGuardian(editStudentId, payload)
        }
      }

      setEditStudentId(null)
      setEditForm({})
      setEditGuardian(null)
      setEditGuardians([])
      await loadStudents()
    } catch (e) {
      setEditError(e.message || 'Save failed.')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Document handlers ────────────────────────────────────────────────────────
  async function handleUploadDoc(file) {
    if (!file || !editStudentId) return
    setDocUploading(true)
    try {
      const meta = await uploadStudentDocument(editStudentId, file, docType)
      setEditDocs(d => [...d, meta])
    } catch { alert('Upload failed.') }
    finally { setDocUploading(false) }
  }

  async function handleDeleteDoc(docId) {
    try {
      await deleteStudentDocument(docId)
      setEditDocs(d => d.filter(doc => doc.documentId !== docId))
    } catch { alert('Delete failed.') }
  }

  // ── Delete / Archive ──────────────────────────────────────────────────────────
  async function handleDeleteSelected() {
    if (!window.confirm(`Archive ${selected.length} student(s)? They will be moved to the Archived tab.`)) return
    try {
      await Promise.all(selected.map(id => updateStudentStatus(id, 'ARCHIVED')))
      setSelected([])
      await loadStudents()
    } catch {
      alert('Archive failed for one or more students.')
    }
  }

  async function handleDeleteOne(id) {
    if (!window.confirm('Archive this student? They will be moved to the Archived tab and can be restored later.')) return
    try {
      await updateStudentStatus(id, 'ARCHIVED')
      if (editStudentId === id) { setEditStudentId(null); setEditForm({}) }
      await loadStudents()
    } catch {
      alert('Archive failed.')
    }
  }

  // ── CSV parsing ───────────────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return
    if (!file.name.match(/\.(csv|txt)$/i)) { alert('Please upload a .csv file.'); return }
    const reader = new FileReader()
    reader.onload = e => {
      const rows = parseCSV(e.target.result)
      if (rows.length === 0) { alert('No data rows found. Check your CSV file.'); return }
      setParsedRows(rows)
      setUploadStep('preview')
    }
    reader.readAsText(file)
  }

  // ── Bulk upload ───────────────────────────────────────────────────────────────
  async function handleConfirmUpload() {
    const validRows = parsedRows.filter(r => r._valid)
    if (validRows.length === 0) { alert('No valid rows to upload.'); return }
    setUploading(true)
    try {
      const payload = validRows.map(({ _row, _errors, _valid, _parentName, _parentRel, _parentPhone, ...student }) => student)
      const result = await bulkCreateStudents(payload)

      const savedStudents = result.students || []
      await Promise.allSettled(
        savedStudents.map(savedStu => {
          const matchedRow = validRows.find(r => r.admissionNumber === savedStu.admissionNumber)
          if (!matchedRow || (!matchedRow._parentName && !matchedRow._parentPhone)) return Promise.resolve()
          return createGuardian(savedStu.studentId, {
            fullName: matchedRow._parentName || 'Parent/Guardian',
            relationship: matchedRow._parentRel || 'Parent',
            phone: matchedRow._parentPhone || '',
          })
        })
      )

      setUploadResult(result)
      setUploadStep('done')
      await loadStudents()
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function resetUpload() {
    setParsedRows([])
    setUploadResult(null)
    setUploadStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const validCount   = parsedRows.filter(r => r._valid).length
  const invalidCount = parsedRows.filter(r => !r._valid).length

  // active students only for count
  const activeStudents = students.filter(s => s.status !== 'ARCHIVED')

  // Inline edit form rendered inside the table
  function renderInlineEdit() {
    return (
      <tr style={{ background: 'var(--blue-light)' }}>
        <td colSpan={8} style={{ padding: '14px 16px' }}>
          {editError && (
            <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
              ⚠ {editError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
            {[
              ['First Name',     'firstName',       'text'],
              ['Last Name',      'lastName',        'text'],
              ['Admission No.',  'admissionNumber', 'text'],
              ['Date of Birth',  'dateOfBirth',     'date'],
              ['Admission Date', 'admissionDate',   'date'],
              ['Grade Level',    'gradeLevel',      'text'],
              ['Section',        'section',         'text'],
              ['AAPAR Number',   'aaparNumber',     'text'],
            ].map(([label, key, type]) => (
              <div key={key} className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 11 }}>{label}</label>
                <input className="form-input" type={type} style={{ fontSize: 12, padding: '5px 8px' }}
                  value={editForm[key] || ''}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Gender</label>
              <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                value={editForm.gender || 'Male'}
                onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                {GENDERS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Guardian section — up to 2 guardians */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            Parent / Guardian
          </div>
          {editGuardians.slice(0, 2).map((g, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>
                Guardian {idx + 1}
                {idx === 0 && <span style={{ marginLeft: 6, color: 'var(--blue)', fontWeight: 700 }}>Primary</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Name</label>
                  <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }} placeholder="e.g. Priya Sharma"
                    value={g.fullName}
                    onChange={e => setEditGuardians(gs => gs.map((gg, i) => i === idx ? { ...gg, fullName: e.target.value } : gg))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Relationship</label>
                  <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                    value={g.relationship}
                    onChange={e => setEditGuardians(gs => gs.map((gg, i) => i === idx ? { ...gg, relationship: e.target.value } : gg))}>
                    {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Phone</label>
                  <input className="form-input" type="tel" style={{ fontSize: 12, padding: '5px 8px' }} placeholder="e.g. 9400111222"
                    value={g.phone}
                    onChange={e => setEditGuardians(gs => gs.map((gg, i) => i === idx ? { ...gg, phone: e.target.value } : gg))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Alternate Phone</label>
                  <input className="form-input" type="tel" style={{ fontSize: 12, padding: '5px 8px' }}
                    value={g.alternatePhone}
                    onChange={e => setEditGuardians(gs => gs.map((gg, i) => i === idx ? { ...gg, alternatePhone: e.target.value } : gg))} />
                </div>
                {idx > 0 && (
                  <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer' }}>
                      <input type="checkbox" checked={g.isPrimary}
                        onChange={e => setEditGuardians(gs => gs.map((gg, i) => i === idx ? { ...gg, isPrimary: e.target.checked } : gg))} />
                      Primary contact for portal
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Medical & Notes */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 8 }}>
            Medical & Notes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Medical Conditions / Allergies</label>
              <textarea className="form-input" rows={3} style={{ fontSize: 12, resize: 'vertical' }}
                value={editForm.medicalNotes || ''}
                onChange={e => setEditForm(f => ({ ...f, medicalNotes: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Special Notes</label>
              <textarea className="form-input" rows={3} style={{ fontSize: 12, resize: 'vertical' }}
                value={editForm.specialNotes || ''}
                onChange={e => setEditForm(f => ({ ...f, specialNotes: e.target.value }))} />
            </div>
          </div>

          {/* Documents */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            Documents
          </div>
          {editDocs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {editDocs.map(doc => (
                <span key={doc.documentId} style={{ fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  📄 {doc.documentName}
                  <button onClick={() => handleDeleteDoc(doc.documentId)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="filter-select" style={{ fontSize: 12, width: 160 }}>
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label className="btn-secondary" style={{ fontSize: 12, cursor: 'pointer' }}>
              📎 Upload Document
              <input type="file" style={{ display: 'none' }} onChange={e => handleUploadDoc(e.target.files[0])} />
            </label>
            {docUploading && <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Uploading…</span>}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }}
              onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12 }}
              onClick={() => { setEditStudentId(null); setEditForm({}); setEditGuardians([]); setEditError(null) }}>
              Cancel
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Student Management</div>
          <div className="page-sub">
            {loading ? 'Loading…' : `${activeStudents.length} students · AY 2025–26`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {students.length > 0 && (
            <button className="btn-danger" onClick={async () => {
              if (!window.confirm(`Delete all ${students.length} students? This cannot be undone.`)) return
              try {
                await Promise.all(students.map(s => deleteStudent(s.studentId)))
                await loadStudents()
              } catch { alert('Some deletions failed.') }
            }}>
              🗑 Delete All
            </button>
          )}
          <button className="btn-secondary" onClick={() => { setTab('bulk'); resetUpload() }}>
            ⬆ Bulk Upload
          </button>
          <button className="btn-primary" onClick={() => { setTab('list'); setShowAddForm(true) }}>
            + Add Student
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {[['list', 'Student List'], ['bulk', 'Bulk Upload'], ['archived', '🗄 Archived']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`}
            onClick={() => {
              setTab(id)
              setShowAddForm(false)
              if (id === 'archived') loadArchived()
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Student List ─────────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <>
          {/* Add Student Form */}
          {showAddForm && (
            <div className={`card ${styles.addForm}`}>
              <div className={styles.addFormHead}>
                <span className={styles.addFormTitle}>Add New Student</span>
                <button className="btn-ghost" onClick={() => { setShowAddForm(false); setFormError(null); setAddParentPhone(''); setAddParentName(''); setAddParentRel('Parent') }}>
                  ✕ Cancel
                </button>
              </div>
              {formError && (
                <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px',
                  borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                  {formError}
                </div>
              )}
              <div className={styles.formGrid}>
                {[
                  ['First Name',      'firstName',       'text', 'e.g. Arjun'],
                  ['Last Name',       'lastName',        'text', 'e.g. Sharma'],
                  ['Admission No.',   'admissionNumber', 'text', 'e.g. DPS2024009'],
                  ['Date of Birth',   'dateOfBirth',     'date', ''],
                  ['Admission Date',  'admissionDate',   'date', ''],
                  ['Grade Level',     'gradeLevel',      'text', 'e.g. 8'],
                  ['Section',         'section',         'text', 'e.g. A'],
                ].map(([label, key, type, ph]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type} placeholder={ph}
                      value={formData[key]}
                      onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={formData.gender}
                    onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))}>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', marginBottom: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    Parent / Guardian
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Name</label>
                  <input className="form-input" type="text" placeholder="e.g. Priya Sharma"
                    value={addParentName}
                    onChange={e => setAddParentName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <select className="form-input" value={addParentRel} onChange={e => setAddParentRel(e.target.value)}>
                    {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-input" type="tel" placeholder="e.g. 9400111222"
                    value={addParentPhone}
                    onChange={e => setAddParentPhone(e.target.value)} />
                </div>
              </div>
              <div className={styles.addFormActions}>
                <button className="btn-secondary" onClick={() => {
                  setShowAddForm(false); setFormError(null)
                  setAddParentPhone(''); setAddParentName(''); setAddParentRel('Parent')
                }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveStudent} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Student'}
                </button>
              </div>
            </div>
          )}

          {/* Bulk action bar */}
          {selected.length > 0 && (
            <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{selected.length} student{selected.length > 1 ? 's' : ''} selected</span>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelected([])}>✕ Clear</button>
                <button className="btn-danger" style={{ marginLeft: 'auto' }} onClick={handleDeleteSelected}>🗄 Archive Selected</button>
              </div>
              {bulkMsg && <div style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✓ {bulkMsg}</div>}
              {bulkErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>⚠ {bulkErr}</div>}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>💰 Assign Fee:</span>
                  <select className="filter-select" value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} style={{ minWidth: 150 }}>
                    <option value="">— Grade Level —</option>
                    {[...new Set(feeStructures.filter(fs => fs.feeType !== 'TRANSPORT').map(fs => fs.gradeLevel))]
                      .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
                      .map(g => <option key={g} value={g}>Grade {g}</option>)
                    }
                  </select>
                  {bulkGrade && (() => {
                    const preview = feeStructures.filter(
                      fs => fs.feeType !== 'TRANSPORT' && (fs.gradeLevel === bulkGrade || fs.gradeLevel === 'ALL')
                    )
                    if (!preview.length) return null
                    const total = preview.reduce((s, fs) => s + (fs.amount || 0), 0)
                    return (
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 9px', maxWidth: 400 }}>
                        {preview.map(fs => `${fs.feeType} ₹${(fs.amount || 0).toLocaleString('en-IN')}`).join(' · ')}
                        {' '}= <strong>₹{total.toLocaleString('en-IN')}</strong>
                      </span>
                    )
                  })()}
                  <button className="btn-primary" onClick={handleBulkAssignFee} disabled={bulkSaving || !bulkGrade}>
                    {bulkSaving ? '…' : 'Assign'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>🚌 Assign Route:</span>
                  <select className="filter-select" value={bulkRouteId} onChange={e => setBulkRouteId(e.target.value)} style={{ minWidth: 150 }}>
                    <option value="">— Route —</option>
                    {routes.map(r => <option key={r.routeId} value={r.routeId}>{r.routeName}</option>)}
                  </select>
                  <select className="filter-select" value={bulkVehicleId} onChange={e => setBulkVehicleId(e.target.value)} style={{ minWidth: 160 }}>
                    <option value="">— Vehicle —</option>
                    {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber}</option>)}
                  </select>
                  <button className="btn-primary" onClick={handleBulkAssignRoute} disabled={bulkSaving || !bulkRouteId || !bulkVehicleId}>
                    {bulkSaving ? '…' : 'Assign'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>✏ Set Grade/Section:</span>
                  <input className="filter-select" placeholder="Grade" value={bulkNewGrade}
                    onChange={e => setBulkNewGrade(e.target.value)} style={{ width: 70 }} />
                  <input className="filter-select" placeholder="Section" value={bulkNewSection}
                    onChange={e => setBulkNewSection(e.target.value)} style={{ width: 80 }} />
                  <button className="btn-primary" onClick={handleBulkSetGradeSection}
                    disabled={bulkSaving || (!bulkNewGrade && !bulkNewSection)}>
                    {bulkSaving ? '…' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search / filter bar */}
          <div className="search-bar">
            <input className="search-input" placeholder="Search by name or admission no…"
              value={search} onChange={e => setSearch(e.target.value)} />

            {/* Multi-select grade/section filter dropdown */}
            <div ref={filterDropdownRef} style={{ position: 'relative' }}>
              <button
                className="filter-select"
                onClick={() => setFilterDropdownOpen(o => !o)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Filters
                {(filterGrades.length > 0 || filterSections.length > 0) && (
                  <span style={{ background: 'var(--blue)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>
                    {filterGrades.length + filterSections.length}
                  </span>
                )}
                {filterDropdownOpen ? ' ▲' : ' ▼'}
              </button>
              {filterDropdownOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 200, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 18px rgba(0,0,0,.12)', padding: 14, minWidth: 220 }}>
                  {availableGrades.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Grade</div>
                      {availableGrades.map(g => (
                        <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, padding: '3px 0', cursor: 'pointer' }}>
                          <input type="checkbox"
                            checked={filterGrades.includes(g)}
                            onChange={() => setFilterGrades(prev =>
                              prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                            )} />
                          Grade {g}
                        </label>
                      ))}
                    </>
                  )}
                  {availableSections.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 10, marginBottom: 6 }}>Section</div>
                      {availableSections.map(sec => (
                        <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, padding: '3px 0', cursor: 'pointer' }}>
                          <input type="checkbox"
                            checked={filterSections.includes(sec)}
                            onChange={() => setFilterSections(prev =>
                              prev.includes(sec) ? prev.filter(x => x !== sec) : [...prev, sec]
                            )} />
                          Section {sec}
                        </label>
                      ))}
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn-ghost" style={{ fontSize: 11, flex: 1 }} onClick={() => { setFilterGrades([]); setFilterSections([]) }}>
                      Clear filters
                    </button>
                    <button className="btn-secondary" style={{ fontSize: 11, flex: 1 }} onClick={() => setFilterDropdownOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span style={{ fontSize: 13, color: 'var(--ink-muted)', marginLeft: 4 }}>
              {filtered.length} students
            </span>
          </div>

          {loadError ? (
            <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: 16, borderRadius: 10, fontSize: 14 }}>
              {loadError}
            </div>
          ) : loading ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading students…</div>
          ) : activeStudents.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No students yet</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Add one above or use Bulk Upload.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-muted)' }}>
              No students match your search.
            </div>
          ) : (
            gradeSortedKeys.map(grade => {
              const sections = grouped[grade]
              const gradeStudents = Object.values(sections).flat()
              const allGradeSelected = gradeStudents.every(s => selected.includes(s.studentId))
              const isCollapsed = collapsedGrades.has(grade)
              return (
                <div key={grade} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 6px', borderBottom: '2px solid var(--accent)', marginBottom: 10 }}>
                    <button
                      onClick={() => setCollapsedGrades(prev => {
                        const next = new Set(prev)
                        next.has(grade) ? next.delete(grade) : next.add(grade)
                        return next
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-muted)', padding: '2px 4px' }}
                    >
                      {isCollapsed ? '▶' : '▼'}
                    </button>
                    <input type="checkbox" checked={allGradeSelected}
                      onChange={() => toggleGrade(gradeStudents)}
                      style={{ width: 15, height: 15, cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15 }}>Grade {grade}</span>
                    <span className="badge muted">{gradeStudents.length} students</span>
                  </div>

                  {!isCollapsed && Object.keys(sections).sort().map(sec => {
                    const secStudents = sections[sec]
                    const allSecSelected = secStudents.every(s => selected.includes(s.studentId))
                    return (
                      <div key={sec} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0 6px 28px' }}>
                          <input type="checkbox" checked={allSecSelected} onChange={() => toggleSection(secStudents)} style={{ width: 13, height: 13, cursor: 'pointer' }} />
                          Section {sec} · {secStudents.length} students
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: 36 }}></th>
                                <th>Adm No.</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>DOB</th>
                                <th>Route</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {secStudents.map(s => {
                                const isEditing = editStudentId === s.studentId
                                return (
                                  <Fragment key={s.studentId}>
                                    <tr style={{ background: isEditing ? 'var(--blue-light)' : selected.includes(s.studentId) ? 'var(--blue-light)' : undefined }}>
                                      <td>
                                        <input type="checkbox" checked={selected.includes(s.studentId)}
                                          onChange={() => toggleSelect(s.studentId)}
                                          style={{ width: 14, height: 14, cursor: 'pointer' }} />
                                      </td>
                                      <td><span className={styles.admNo}>{s.admissionNumber}</span></td>
                                      <td><span className={styles.studentName}>{s.firstName} {s.lastName}</span></td>
                                      <td>{s.gender}</td>
                                      <td>{s.dateOfBirth}</td>
                                      <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                                        {assignmentByStudent[s.studentId]?.route?.routeName || '—'}
                                      </td>
                                      <td>
                                        <span className={`badge ${s.status === 'ACTIVE' ? 'green' : 'muted'}`}>{s.status}</span>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                          <button
                                            style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: isEditing ? 'var(--ink-muted)' : 'var(--blue)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
                                            onClick={() => isEditing ? (setEditStudentId(null), setEditError(null)) : openEditStudent(s)}
                                          >{isEditing ? 'Close' : 'Edit'}</button>
                                          <button className={styles.removeBtn} onClick={() => handleDeleteOne(s.studentId)}>
                                            Archive
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                    {isEditing && renderInlineEdit()}
                                  </Fragment>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
          <div className={styles.tableFooter}>
            {selected.length > 0 ? `${selected.length} of ` : ''}{filtered.length} students shown · {activeStudents.length} total
          </div>
        </>
      )}

      {/* ── Archived Students ─────────────────────────────────────────────────── */}
      {tab === 'archived' && (
        <div>
          {archivedLoading ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading archived students…</div>
          ) : archivedStudents.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗄</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No archived students</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Students you archive will appear here.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Adm No.</th>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedStudents.map(s => (
                    <tr key={s.studentId}>
                      <td><span className={styles.admNo}>{s.admissionNumber}</span></td>
                      <td><span className={styles.studentName}>{s.firstName} {s.lastName}</span></td>
                      <td>{s.gradeLevel} {s.section ? `- ${s.section}` : ''}</td>
                      <td><span className="badge muted">{s.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            onClick={async () => {
                              try {
                                await updateStudentStatus(s.studentId, 'ACTIVE')
                                await Promise.all([loadStudents(), loadArchived()])
                              } catch { alert('Restore failed.') }
                            }}
                          >
                            Restore
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            onClick={async () => {
                              if (!window.confirm('Permanently delete this student? This cannot be undone.')) return
                              try {
                                await deleteStudent(s.studentId)
                                setArchivedStudents(prev => prev.filter(a => a.studentId !== s.studentId))
                              } catch { alert('Delete failed.') }
                            }}
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk Upload ───────────────────────────────────────────────────────── */}
      {tab === 'bulk' && (
        <div className="card">
          {uploadStep === 'upload' && (
            <>
              <div className={styles.uploadHead}>Bulk Student Upload</div>
              <p className={styles.uploadDesc}>
                Upload a CSV to enroll multiple students at once. Each row = one student + parent/guardian.
                Parent name and phone are required for each student.
              </p>
              <div
                className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
                <div className="upload-icon">📂</div>
                <div className="upload-title">Drop your CSV here or click to browse</div>
                <div className="upload-sub">Columns: first_name, last_name, dob, gender, admission_number, admission_date, grade_level, section, parent_name, parent_relationship, parent_phone</div>
              </div>
              <div className={styles.templateRow}>
                <span>Need the format?</span>
                <button className="btn-ghost" onClick={downloadTemplate}>⬇ Download Template</button>
              </div>
            </>
          )}

          {uploadStep === 'preview' && (
            <>
              <div className={styles.uploadHead}>Validate & Confirm Upload</div>
              <div className={styles.validationBar}>
                <span className="badge green">✓ {validCount} valid rows</span>
                {invalidCount > 0 && <span className="badge red">✕ {invalidCount} rows with errors</span>}
                <span style={{ fontSize: 13, color: 'var(--ink-muted)', marginLeft: 'auto' }}>{parsedRows.length} rows parsed</span>
              </div>
              <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Row</th><th>Name</th><th>Adm No.</th><th>Grade</th><th>Parent</th><th>Phone</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map(r => (
                      <tr key={r._row}>
                        <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{r._row}</td>
                        <td>{r.firstName} {r.lastName}</td>
                        <td><span className={styles.admNo}>{r.admissionNumber || '—'}</span></td>
                        <td>{r.gradeLevel} {r.section}</td>
                        <td style={{ fontSize: 12 }}>{r._parentName || <span style={{ color: 'var(--red)' }}>Missing</span>}</td>
                        <td style={{ fontSize: 12 }}>{r._parentPhone || <span style={{ color: 'var(--red)' }}>Missing</span>}</td>
                        <td>
                          {r._valid
                            ? <span className="badge green">Valid</span>
                            : <span className="badge red" title={r._errors.join(', ')}>Error</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalidCount > 0 && (
                <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                  {invalidCount} row(s) have errors and will be skipped. Fix the CSV and re-upload.
                </div>
              )}
              <div className={styles.addFormActions}>
                <button className="btn-secondary" onClick={resetUpload}>← Re-upload</button>
                <button className="btn-primary" onClick={handleConfirmUpload} disabled={uploading || validCount === 0}>
                  {uploading ? 'Uploading…' : `✓ Enroll ${validCount} Students`}
                </button>
              </div>
            </>
          )}

          {uploadStep === 'done' && uploadResult && (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✅</div>
              <div className={styles.successTitle}>
                {uploadResult.saved} Student{uploadResult.saved !== 1 ? 's' : ''} Enrolled!
              </div>
              <div className={styles.successSub}>
                {uploadResult.skipped > 0 && (
                  <>{uploadResult.skipped} duplicate admission number{uploadResult.skipped !== 1 ? 's' : ''} were skipped.</>
                )}
                {uploadResult.skipped === 0 && 'All rows were saved successfully.'}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                <button className="btn-secondary" onClick={resetUpload}>Upload Another File</button>
                <button className="btn-primary" onClick={() => { setTab('list'); resetUpload() }}>View Student List</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
