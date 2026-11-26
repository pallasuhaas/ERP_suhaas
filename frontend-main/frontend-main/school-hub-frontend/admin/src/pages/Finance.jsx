import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react'
import styles from './Finance.module.css'
import { getStudents } from '../api/students'
import {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getAcademicYears, createAcademicYear, deleteAcademicYear,
  getFeeTerms, createFeeTerm, deleteFeeTerm,
} from '../api/finance'

// Fee types that belong to the academic fee structure (NOT transport — that's done via transport module)
const ACADEMIC_FEE_TYPES = ['TUITION', 'LAB', 'REGISTRATION', 'BOOKS', 'UNIFORM', 'FOOD', 'ANNUAL_DAY', 'OTHER']
const ALL_FEE_TYPES = ['TUITION', 'TRANSPORT', 'LAB', 'REGISTRATION', 'BOOKS', 'UNIFORM', 'FOOD', 'ANNUAL_DAY', 'OTHER']
const GRADE_LEVELS = ['1','2','3','4','5','6','7','8','9','10','11','12']
const STATUS_BADGE = { PAID: 'green', UNPAID: 'red', PARTIAL: 'orange', OVERDUE: 'red' }

const FEE_TYPE_META = {
  TUITION:      { label: 'Academic / Tuition',  icon: '📚' },
  TRANSPORT:    { label: 'Transport',           icon: '🚌' },
  LAB:          { label: 'Lab & Activities',    icon: '🔬' },
  REGISTRATION: { label: 'Registration',        icon: '📋' },
  BOOKS:        { label: 'Books & Stationery',  icon: '📖' },
  UNIFORM:      { label: 'Uniform',             icon: '👕' },
  FOOD:         { label: 'Food & Meals',        icon: '🍱' },
  ANNUAL_DAY:   { label: 'Annual Day',          icon: '🎭' },
  OTHER:        { label: 'Other',               icon: '💰' },
}

function formatINR(n) {
  return '₹' + (n || 0).toLocaleString('en-IN')
}

export default function Finance() {
  const [tab, setTab] = useState('lookup')

  // ── shared data ───────────────────────────────────────────────────────────
  const [students,   setStudents]   = useState([])
  const [structures, setStructures] = useState([])
  const [invoices,   setInvoices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // Collapsed grade sections in Fee Lookup (start all collapsed)
  const [collapsedFeeGrades, setCollapsedFeeGrades] = useState(new Set())
  const initializedFeeCollapse = useRef(false)

  function toggleFeeGrade(grade) {
    setCollapsedFeeGrades(prev => {
      const next = new Set(prev)
      next.has(grade) ? next.delete(grade) : next.add(grade)
      return next
    })
  }

  const reload = useCallback(() => {
    setLoading(true)
    Promise.all([getStudents(), getFeeStructures(), getInvoices()])
      .then(([s, fs, inv]) => {
        setStudents(s); setStructures(fs); setInvoices(inv); setError(null)
        // Collapse all grade sections on first load
        if (!initializedFeeCollapse.current && s.length > 0) {
          const grades = [...new Set(s.filter(st => st.status !== 'ARCHIVED').map(st => String(st.gradeLevel)))]
          setCollapsedFeeGrades(new Set(grades))
          initializedFeeCollapse.current = true
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  // ── derived summary ───────────────────────────────────────────────────────
  const totalCollected   = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0)

  // ── student lookup ────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [filterStatus,   setFilterStatus]   = useState('All')
  const [selectedStuId,  setSelectedStuId]  = useState(null)   // store ID only — student derived reactively
  const [selectedIds,    setSelectedIds]    = useState(new Set())
  const [bulkGrade,    setBulkGrade]    = useState('')
  const [bulkSaving,   setBulkSaving]   = useState(false)
  const [bulkMsg,      setBulkMsg]      = useState(null)
  const [bulkErr,      setBulkErr]      = useState(null)

  // custom invoice for a student
  const [addInvOpen,    setAddInvOpen]    = useState(false)
  const [addInvType,    setAddInvType]    = useState('TUITION')
  const [addInvAmount,  setAddInvAmount]  = useState('')
  const [addInvDueDate, setAddInvDueDate] = useState('')
  const [addInvSaving,  setAddInvSaving]  = useState(false)
  const [addInvErr,     setAddInvErr]     = useState(null)

  // inline edits for the fee breakdown table — { invoiceId: { amount, dueDate } }
  const [invEdits,  setInvEdits]  = useState({})
  const [invSaving, setInvSaving] = useState({})

  const studentInvoiceMap = useMemo(() => invoices.reduce((acc, inv) => {
    const k = inv.studentId
    if (!acc[k]) acc[k] = []
    acc[k].push(inv)
    return acc
  }, {}), [invoices])

  const enrichedStudents = useMemo(() => students.map(s => {
    const invs = studentInvoiceMap[s.studentId] || []
    const total = invs.reduce((a, i) => a + (i.totalAmount || 0), 0)
    const paid  = invs.filter(i => i.status === 'PAID').reduce((a, i) => a + (i.totalAmount || 0), 0)
    const due   = total - paid
    const hasOverdue = invs.some(i => i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < new Date())
    const statusList = [...new Set(invs.map(i => i.status))]
    const feeStatus = invs.length === 0 ? 'NONE'
      : statusList.includes('PAID') && statusList.length === 1 ? 'PAID'
      : statusList.includes('PAID') ? 'PARTIAL' : 'UNPAID'
    return { ...s, total, paid, due, hasOverdue, feeStatus, invs }
  }), [students, studentInvoiceMap])

  // Derive selectedStu reactively from enrichedStudents — auto-updates when invoices change
  const selectedStu = useMemo(() =>
    selectedStuId ? enrichedStudents.find(s => s.studentId === selectedStuId) || null : null,
    [enrichedStudents, selectedStuId]
  )

  // Initialise inline-edit drafts whenever the student changes or invoices reload
  useEffect(() => {
    if (!selectedStu) return
    setInvEdits(prev => {
      const next = {}
      ;(selectedStu.invs || []).forEach(inv => {
        // Keep a draft if already present and being saved; otherwise reset from server value
        next[inv.invoiceId] = prev[inv.invoiceId] ?? {
          amount:  String(inv.totalAmount ?? ''),
          dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '',
        }
      })
      return next
    })
  }, [selectedStuId, invoices]) // re-sync after every reload too

  const filteredStudents = useMemo(() => enrichedStudents.filter(s => {
    const q = search.toLowerCase()
    const matchName   = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q)
    const matchId     = (s.admissionNumber || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || s.feeStatus === filterStatus
    return (matchName || matchId) && matchStatus
  }), [enrichedStudents, search, filterStatus])

  const grouped = useMemo(() => {
    const g = {}
    filteredStudents.forEach(s => {
      const grade = String(s.gradeLevel || 'Unknown')
      const sec   = s.section || '—'
      if (!g[grade]) g[grade] = {}
      if (!g[grade][sec]) g[grade][sec] = []
      g[grade][sec].push(s)
    })
    return g
  }, [filteredStudents])

  const gradeSortedKeys = useMemo(() =>
    Object.keys(grouped).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
    [grouped])

  function toggleId(id) {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleGrade(gradeStudents) {
    const ids = gradeStudents.map(s => s.studentId)
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allIn = ids.every(id => next.has(id))
      ids.forEach(id => allIn ? next.delete(id) : next.add(id))
      return next
    })
  }
  function toggleSection(sectionStudents) {
    const ids = sectionStudents.map(s => s.studentId)
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allIn = ids.every(id => next.has(id))
      ids.forEach(id => allIn ? next.delete(id) : next.add(id))
      return next
    })
  }
  function clearSelection() { setSelectedIds(new Set()) }

  async function handleBulkAssignFee() {
    if (!bulkGrade) return setBulkErr('Select a grade level first.')
    // Find all non-transport academic fee structures for the selected grade
    const gradeStructures = structures.filter(fs =>
      fs.feeType !== 'TRANSPORT' &&
      (fs.gradeLevel === bulkGrade || fs.gradeLevel === 'ALL')
    )
    if (gradeStructures.length === 0) {
      return setBulkErr(`No academic fee structures found for Grade ${bulkGrade}. Create them in the Fee Structures tab first.`)
    }
    setBulkErr(null); setBulkSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    try {
      // Step 1: delete existing academic (non-transport) invoices for each selected student
      const deleteOps = [...selectedIds].flatMap(sid => {
        const existingInvs = studentInvoiceMap[sid] || []
        return existingInvs
          .filter(inv => inv.feeStructure?.feeType !== 'TRANSPORT')
          .map(inv => deleteInvoice(inv.invoiceId))
      })
      await Promise.all(deleteOps)

      // Step 2: create new invoices for each grade structure
      await Promise.all([...selectedIds].flatMap(sid =>
        gradeStructures.map(fs => createInvoice(sid, fs.feeStructureId, null, {
          invoiceDate: today,
          dueDate: fs.dueDate || null,
          totalAmount: fs.amount,
          status: 'UNPAID',
        }))
      ))
      const feeTotal = gradeStructures.reduce((sum, fs) => sum + (fs.amount || 0), 0)
      setBulkMsg(`Grade ${bulkGrade} fees (${gradeStructures.length} items, ${formatINR(feeTotal)}) assigned to ${selectedIds.size} student${selectedIds.size > 1 ? 's' : ''}.`)
      clearSelection(); setBulkGrade(''); reload()
      setTimeout(() => setBulkMsg(null), 4000)
    } catch (e) { setBulkErr(e.message) }
    finally { setBulkSaving(false) }
  }

  async function handleBulkMarkPaid() {
    setBulkErr(null); setBulkSaving(true)
    try {
      const updates = []
      ;[...selectedIds].forEach(sid => {
        const invs = studentInvoiceMap[sid] || []
        invs.filter(i => i.status !== 'PAID').forEach(inv => updates.push(updateInvoice(inv.invoiceId, { ...inv, status: 'PAID' })))
      })
      await Promise.all(updates)
      setBulkMsg(`Marked paid for ${selectedIds.size} students.`)
      clearSelection(); reload()
      setTimeout(() => setBulkMsg(null), 3000)
    } catch (e) { setBulkErr(e.message) }
    finally { setBulkSaving(false) }
  }

  async function handleCreateCustomInvoice() {
    if (!addInvAmount || !addInvDueDate) { setAddInvErr('Amount and due date are required.'); return }
    setAddInvSaving(true); setAddInvErr(null)
    try {
      const fs = await createFeeStructure({
        feeType: addInvType,
        gradeLevel: String(selectedStu.gradeLevel || 'ALL'),
        academicYear: '2025-26',
        amount: Number(addInvAmount),
        dueDate: addInvDueDate,
        recurring: false,
      })
      await createInvoice(selectedStu.studentId, fs.feeStructureId, null, {
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: addInvDueDate,
        totalAmount: Number(addInvAmount),
        status: 'UNPAID',
      })
      setAddInvOpen(false); setAddInvAmount(''); setAddInvDueDate(''); setAddInvType('TUITION')
      reload()
    } catch (e) { setAddInvErr(e.message || 'Failed to create invoice.') }
    finally { setAddInvSaving(false) }
  }

  async function handleMarkPaid(invoice) {
    try { await updateInvoice(invoice.invoiceId, { ...invoice, status: 'PAID' }); reload() }
    catch (err) { alert('Failed to update: ' + err.message) }
  }

  async function handleDeleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return
    try { await deleteInvoice(id); reload() }
    catch (err) { alert('Failed to delete: ' + err.message) }
  }

  async function handleInvFieldSave(inv) {
    const draft = invEdits[inv.invoiceId]
    if (!draft) return
    const origAmount  = String(inv.totalAmount ?? '')
    const origDueDate = inv.dueDate ? inv.dueDate.slice(0, 10) : ''
    if (draft.amount === origAmount && draft.dueDate === origDueDate) return // nothing changed
    if (!draft.amount) return // don't save empty amount
    setInvSaving(s => ({ ...s, [inv.invoiceId]: true }))
    try {
      await updateInvoice(inv.invoiceId, {
        ...inv,
        totalAmount: Number(draft.amount),
        dueDate:     draft.dueDate || inv.dueDate,
      })
      reload()
    } catch (e) {
      alert('Failed to save: ' + e.message)
      // Revert draft to last known good value
      setInvEdits(prev => ({
        ...prev,
        [inv.invoiceId]: { amount: origAmount, dueDate: origDueDate },
      }))
    } finally {
      setInvSaving(s => ({ ...s, [inv.invoiceId]: false }))
    }
  }

  // ── fee structure form ────────────────────────────────────────────────────
  const [fsForm, setFsForm] = useState({
    feeType: 'TUITION', feeName: '', gradeLevel: '1', academicYear: '2025-26',
    amount: '', dueDate: '', recurring: false,
  })
  const [fsError,  setFsError]  = useState(null)
  const [fsSaving, setFsSaving] = useState(false)
  const [fsMsg,    setFsMsg]    = useState(null)

  // inline edit fee structure
  const [editFsId,   setEditFsId]   = useState(null)
  const [editFsForm, setEditFsForm] = useState({})
  const [editFsErr,  setEditFsErr]  = useState(null)
  const [editFsSaving, setEditFsSaving] = useState(false)

  async function handleCreateFeeStructure(e) {
    e.preventDefault(); setFsError(null); setFsSaving(true)
    try {
      await createFeeStructure({
        feeType: fsForm.feeType, feeName: fsForm.feeName || null,
        gradeLevel: fsForm.gradeLevel,
        academicYear: fsForm.academicYear, amount: Number(fsForm.amount),
        dueDate: fsForm.dueDate, recurring: fsForm.recurring,
      })
      setFsMsg('Fee structure created.')
      setFsForm(f => ({ ...f, feeName: '', amount: '', dueDate: '', recurring: false }))
      reload(); setTimeout(() => setFsMsg(null), 3000)
    } catch (err) { setFsError(err.message) }
    finally { setFsSaving(false) }
  }

  async function handleSaveFsEdit(fsId) {
    setEditFsErr(null); setEditFsSaving(true)
    try {
      await updateFeeStructure(fsId, {
        feeType: editFsForm.feeType, feeName: editFsForm.feeName || null,
        gradeLevel: editFsForm.gradeLevel,
        academicYear: editFsForm.academicYear, amount: Number(editFsForm.amount),
        dueDate: editFsForm.dueDate, recurring: editFsForm.recurring,
      })
      setEditFsId(null); setEditFsForm({}); reload()
    } catch (e) { setEditFsErr(e.message) }
    finally { setEditFsSaving(false) }
  }

  async function handleDeleteStructure(id) {
    if (!confirm('Delete this fee structure? Any invoices linked to it will lose their reference.')) return
    try { await deleteFeeStructure(id); reload() }
    catch (err) { alert('Failed to delete: ' + err.message) }
  }

  // ── Academic Years state ──────────────────────────────────────────────────
  const [years, setYears]               = useState([])
  const [yearsLoading, setYearsLoading] = useState(false)
  const [expandedYear, setExpandedYear] = useState(null) // yearId

  // Add year form
  const [addYearOpen,    setAddYearOpen]    = useState(false)
  const [addYearLabel,   setAddYearLabel]   = useState('')
  const [addYearStart,   setAddYearStart]   = useState('')
  const [addYearEnd,     setAddYearEnd]     = useState('')
  const [addYearCurrent, setAddYearCurrent] = useState(false)
  const [addYearErr,     setAddYearErr]     = useState(null)
  const [addYearSaving,  setAddYearSaving]  = useState(false)

  // Terms state per expanded year
  const [terms,         setTerms]         = useState([])
  const [addTermOpen,   setAddTermOpen]   = useState(false)
  const [addTermName,   setAddTermName]   = useState('')
  const [addTermStart,  setAddTermStart]  = useState('')
  const [addTermEnd,    setAddTermEnd]    = useState('')
  const [addTermPct,    setAddTermPct]    = useState('')
  const [addTermErr,    setAddTermErr]    = useState(null)
  const [addTermSaving, setAddTermSaving] = useState(false)

  // Load years when tab changes to 'years'
  useEffect(() => {
    if (tab !== 'years') return
    setYearsLoading(true)
    getAcademicYears().then(d => setYears(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setYearsLoading(false))
  }, [tab])

  // Load terms when a year is expanded
  useEffect(() => {
    if (!expandedYear) { setTerms([]); return }
    getFeeTerms(expandedYear).then(d => setTerms(Array.isArray(d) ? d : [])).catch(() => setTerms([]))
  }, [expandedYear])

  async function handleCreateYear() {
    if (!addYearLabel || !addYearStart || !addYearEnd) return setAddYearErr('Year label, start date and end date are required.')
    if (addYearEnd <= addYearStart) return setAddYearErr('End date must be after the start date.')
    setAddYearErr(null); setAddYearSaving(true)
    try {
      await createAcademicYear({ yearLabel: addYearLabel, startDate: addYearStart, endDate: addYearEnd, isCurrent: addYearCurrent })
      setAddYearOpen(false); setAddYearLabel(''); setAddYearStart(''); setAddYearEnd(''); setAddYearCurrent(false)
      setYearsLoading(true)
      const fresh = await getAcademicYears()
      setYears(Array.isArray(fresh) ? fresh : [])
    } catch (e) { setAddYearErr(e.message) }
    finally { setAddYearSaving(false); setYearsLoading(false) }
  }

  async function handleDeleteYear(id) {
    if (!confirm('Delete this academic year and all its terms?')) return
    try {
      await deleteAcademicYear(id)
      setYears(ys => ys.filter(y => y.academicYearId !== id))
      if (expandedYear === id) { setExpandedYear(null); setTerms([]) }
    } catch (e) { alert('Failed: ' + e.message) }
  }

  async function handleCreateTerm() {
    if (!addTermName || !addTermStart || !addTermEnd) return setAddTermErr('Term name, start and end dates required.')
    setAddTermErr(null); setAddTermSaving(true)
    try {
      const t = await createFeeTerm(expandedYear, {
        termName: addTermName, startDate: addTermStart, endDate: addTermEnd,
        feePercentage: addTermPct ? Number(addTermPct) : null,
      })
      if (t) setTerms(ts => [...ts, t])
      setAddTermOpen(false); setAddTermName(''); setAddTermStart(''); setAddTermEnd(''); setAddTermPct('')
    } catch (e) { setAddTermErr(e.message) }
    finally { setAddTermSaving(false) }
  }

  async function handleDeleteTerm(termId) {
    if (!confirm('Delete this term?')) return
    try {
      await deleteFeeTerm(termId)
      setTerms(ts => ts.filter(t => t.termId !== termId))
    } catch (e) { alert('Failed: ' + e.message) }
  }

  if (error) return (
    <div className="card" style={{ color: 'var(--red)', padding: 32 }}>
      ⚠ Could not load Finance data: {error}
      <button className="btn-secondary" style={{ marginLeft: 16 }} onClick={reload}>Retry</button>
    </div>
  )

  // ── group fee structures by grade then by type ────────────────────────────
  const structuresByGrade = useMemo(() => {
    const g = {}
    structures
      .filter(fs => fs.feeType !== 'TRANSPORT')  // transport fees are student-specific, not grade-level
      .forEach(fs => {
        const grade = fs.gradeLevel || 'ALL'
        if (!g[grade]) g[grade] = {}
        if (!g[grade][fs.feeType]) g[grade][fs.feeType] = []
        g[grade][fs.feeType].push(fs)
      })
    return g
  }, [structures])

  const gradeFsKeys = useMemo(() =>
    Object.keys(structuresByGrade).sort((a, b) => {
      if (a === 'ALL') return 1; if (b === 'ALL') return -1
      return Number(a) - Number(b) || a.localeCompare(b)
    }),
    [structuresByGrade])

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Finance</div>
          <div className="page-sub">
            {loading
              ? 'Loading…'
              : `Fee collected: ${formatINR(totalCollected)} · Outstanding: ${formatINR(totalOutstanding)} · AY 2025–26`
            }
          </div>
        </div>
      </div>

      <div className="tab-bar">
        {[['lookup','Fee Lookup'],['structures','Fee Structures'],['years','Academic Years']].map(([id,label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Fee Lookup ── */}
      {tab === 'lookup' && (
        <>
          {/* Success message lives outside the bar: a successful bulk action clears the selection, which hides the bar */}
          {bulkMsg && (
            <div role="status" style={{ background: 'var(--green-light, #e8f5ec)', color: 'var(--green)', border: '1px solid var(--green)',
              borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✓ {bulkMsg}</div>
          )}

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected</span>

                {/* Grade-level fee assignment */}
                <select className="filter-select" value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} style={{ minWidth: 160 }}>
                  <option value="">— Assign grade fees —</option>
                  {[...new Set(structures.filter(fs => fs.feeType !== 'TRANSPORT').map(fs => fs.gradeLevel))]
                    .sort((a, b) => { if (a === 'ALL') return 1; if (b === 'ALL') return -1; return Number(a) - Number(b) })
                    .map(g => {
                      const gradeFs = structures.filter(fs => fs.feeType !== 'TRANSPORT' && (fs.gradeLevel === g || fs.gradeLevel === 'ALL'))
                      const total = gradeFs.reduce((s, fs) => s + (fs.amount || 0), 0)
                      return (
                        <option key={g} value={g}>
                          {g === 'ALL' ? 'All Grades' : `Grade ${g}`} · {formatINR(total)} ({gradeFs.length} items)
                        </option>
                      )
                    })
                  }
                </select>
                <button className="btn-primary" onClick={handleBulkAssignFee} disabled={bulkSaving || !bulkGrade}>
                  {bulkSaving ? 'Assigning…' : '💰 Assign Grade Fees'}
                </button>

                <button className="btn-secondary" onClick={handleBulkMarkPaid} disabled={bulkSaving}>✓ Mark All Paid</button>
                <button className="btn-ghost" onClick={clearSelection}>✕ Clear</button>
              </div>

              {/* Grade fee preview — show what will be created */}
              {bulkGrade && (() => {
                const preview = structures.filter(fs =>
                  fs.feeType !== 'TRANSPORT' &&
                  (fs.gradeLevel === bulkGrade || fs.gradeLevel === 'ALL')
                )
                if (preview.length === 0) return null
                return (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--blue)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', alignSelf: 'center' }}>Will create:</span>
                    {preview.map(fs => (
                      <span key={fs.feeStructureId} style={{ fontSize: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', display: 'inline-flex', gap: 4 }}>
                        {FEE_TYPE_META[fs.feeType]?.icon} {FEE_TYPE_META[fs.feeType]?.label} {formatINR(fs.amount)}
                      </span>
                    ))}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', alignSelf: 'center', marginLeft: 4 }}>
                      = {formatINR(preview.reduce((s, fs) => s + (fs.amount || 0), 0))} total
                    </span>
                  </div>
                )
              })()}

              {bulkErr && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>⚠ {bulkErr}</div>}
            </div>
          )}

          <div className="search-bar">
            <input className="search-input" placeholder="Search by name or admission no…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); clearSelection() }}>
              {['All','PAID','PARTIAL','UNPAID','NONE'].map(s => <option key={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)', marginLeft: 4 }}>
              {filteredStudents.length} students
            </span>
          </div>

          {selectedStu ? (
            <div className="card">
              <div className={styles.detailHead}>
                <button className="btn-secondary" onClick={() => { setSelectedStuId(null); setAddInvOpen(false) }}>← Back</button>
                <span className={styles.detailName}>
                  {selectedStu.firstName} {selectedStu.lastName} · Grade {selectedStu.gradeLevel}
                  {selectedStu.section ? `-${selectedStu.section}` : ''}
                </span>
              </div>
              <div className={styles.feeDetailGrid}>
                {[
                  ['Total Invoiced', formatINR(selectedStu.total), 'gold'],
                  ['Paid', formatINR(selectedStu.paid), 'green'],
                  ['Outstanding', formatINR(selectedStu.due), 'red'],
                ].map(([l,v,c]) => (
                  <div key={l} className={`stat-card ${styles.feeStat}`}>
                    <div className="stat-label">{l}</div>
                    <div className={`stat-value ${styles[`fv_${c}`]}`}>{v}</div>
                  </div>
                ))}
              </div>

              {/* ── Fee Breakdown Table ── */}
              <div className="section-head" style={{ marginTop: 16 }}>Fee Breakdown</div>
              {selectedStu.invs?.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>No invoices yet.</p>
              ) : (() => {
                // Group invoices by fee category key (feeName preferred, else feeType)
                const categoryMap = {}
                ;(selectedStu.invs || []).forEach(inv => {
                  const ft = inv.feeStructure?.feeType || 'OTHER'
                  const fn = inv.feeStructure?.feeName
                  const key = fn ? `CUSTOM_${fn}` : ft
                  if (!categoryMap[key]) categoryMap[key] = { feeType: ft, feeName: fn, invoices: [] }
                  categoryMap[key].invoices.push(inv)
                })
                // Sort categories in a sensible order
                const ORDER = ['REGISTRATION','TUITION','TRANSPORT','LAB','BOOKS','UNIFORM','FOOD','ANNUAL_DAY','OTHER']
                const sortedCats = Object.entries(categoryMap).sort(([a], [b]) => {
                  const ai = ORDER.indexOf(a.startsWith('CUSTOM_') ? 'OTHER' : a)
                  const bi = ORDER.indexOf(b.startsWith('CUSTOM_') ? 'OTHER' : b)
                  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
                })
                const grandStd = (selectedStu.invs || []).reduce((s, i) => s + (i.feeStructure?.amount || i.totalAmount || 0), 0)
                const grandOffered = (selectedStu.invs || []).reduce((s, i) => s + (i.totalAmount || 0), 0)
                const grandPaid = (selectedStu.invs || []).filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0)

                return (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr style={{ background: 'var(--bg)' }}>
                          <th style={{ width: '22%' }}>Category</th>
                          <th style={{ textAlign: 'right' }}>Standard</th>
                          <th style={{ textAlign: 'right' }}>Offered ✎</th>
                          <th style={{ textAlign: 'right' }}>Paid</th>
                          <th>Status</th>
                          <th>Due Date ✎ · Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCats.map(([key, cat]) => {
                          const meta = FEE_TYPE_META[cat.feeType] || FEE_TYPE_META.OTHER
                          const label = cat.feeName || meta.label
                          const catInvoices = cat.invoices.slice().sort((a, b) =>
                            new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
                          )
                          const catStd     = catInvoices.reduce((s, i) => s + (i.feeStructure?.amount || i.totalAmount || 0), 0)
                          const catOffered = catInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0)
                          const catPaid    = catInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0)
                          const catStatus  = catInvoices.every(i => i.status === 'PAID') ? 'PAID'
                            : catInvoices.some(i => i.status === 'PAID') ? 'PARTIAL' : 'UNPAID'

                          return (
                            <Fragment key={key}>
                              {/* Category header row */}
                              <tr style={{ background: 'var(--bg)', borderTop: '2px solid var(--border)' }}>
                                <td style={{ fontWeight: 700, padding: '8px 12px' }}>
                                  <span style={{ marginRight: 6 }}>{meta.icon}</span>{label}
                                  {catInvoices.length > 1 && (
                                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 400, marginLeft: 6 }}>
                                      ({catInvoices.length} terms)
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, padding: '8px 12px' }}>{formatINR(catStd)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, padding: '8px 12px' }}>{formatINR(catOffered)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: catPaid > 0 ? 'var(--green)' : 'var(--ink-muted)', padding: '8px 12px' }}>{catPaid > 0 ? formatINR(catPaid) : '—'}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span className={`badge ${STATUS_BADGE[catStatus] || 'muted'}`}>{catStatus}</span>
                                </td>
                                <td style={{ padding: '8px 12px' }}></td>
                              </tr>
                              {/* Sub-rows — one per invoice (term), directly editable */}
                              {catInvoices.map((inv, termIdx) => {
                                const termLabel = catInvoices.length > 1 ? `Term ${termIdx + 1}` : 'Annual'
                                const draft = invEdits[inv.invoiceId] ?? { amount: String(inv.totalAmount ?? ''), dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '' }
                                const isSaving = !!invSaving[inv.invoiceId]
                                return (
                                  <tr key={inv.invoiceId}>
                                    <td style={{ paddingLeft: 32, fontSize: 13, color: 'var(--ink-muted)' }}>
                                      {termLabel}
                                    </td>
                                    {/* Standard (read-only — from fee structure) */}
                                    <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-muted)' }}>
                                      {formatINR(inv.feeStructure?.amount || inv.totalAmount)}
                                    </td>
                                    {/* Offered — inline editable */}
                                    <td style={{ textAlign: 'right' }}>
                                      <input
                                        type="number" min="0"
                                        value={draft.amount}
                                        disabled={isSaving}
                                        onChange={e => setInvEdits(prev => ({ ...prev, [inv.invoiceId]: { ...draft, amount: e.target.value } }))}
                                        onBlur={() => handleInvFieldSave(inv)}
                                        style={{ width: 90, textAlign: 'right', fontSize: 13, padding: '3px 6px', border: '1.5px solid var(--border)', borderRadius: 6, background: isSaving ? 'var(--bg)' : 'white', outline: 'none', fontFamily: 'inherit' }}
                                        onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                                      />
                                    </td>
                                    {/* Paid */}
                                    <td style={{ textAlign: 'right', fontSize: 13, color: inv.status === 'PAID' ? 'var(--green)' : 'var(--ink-muted)' }}>
                                      {inv.status === 'PAID' ? formatINR(inv.totalAmount) : '—'}
                                    </td>
                                    <td>
                                      <span className={`badge ${STATUS_BADGE[inv.status] || 'muted'}`} style={{ fontSize: 11 }}>{inv.status}</span>
                                    </td>
                                    {/* Due date — inline editable + actions */}
                                    <td>
                                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                          type="date"
                                          value={draft.dueDate}
                                          disabled={isSaving}
                                          onChange={e => setInvEdits(prev => ({ ...prev, [inv.invoiceId]: { ...draft, dueDate: e.target.value } }))}
                                          onBlur={() => handleInvFieldSave(inv)}
                                          style={{ fontSize: 11, padding: '3px 6px', border: '1.5px solid var(--border)', borderRadius: 6, background: isSaving ? 'var(--bg)' : 'white', outline: 'none', fontFamily: 'inherit' }}
                                        />
                                        {isSaving && <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Saving…</span>}
                                        {inv.status !== 'PAID' && !isSaving && (
                                          <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}
                                            onClick={() => handleMarkPaid(inv)}>Pay</button>
                                        )}
                                        <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '2px 4px' }}
                                          onClick={() => handleDeleteInvoice(inv.invoiceId)}>Del</button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </Fragment>
                          )
                        })}
                        {/* Totals row */}
                        <tr style={{ background: 'var(--bg)', borderTop: '2px solid var(--accent)', fontWeight: 700 }}>
                          <td style={{ padding: '10px 12px' }}>Total</td>
                          <td style={{ textAlign: 'right', padding: '10px 12px' }}>{formatINR(grandStd)}</td>
                          <td style={{ textAlign: 'right', padding: '10px 12px' }}>{formatINR(grandOffered)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--green)', padding: '10px 12px' }}>{formatINR(grandPaid)}</td>
                          <td colSpan={2} style={{ padding: '10px 12px', color: 'var(--red)', fontSize: 13 }}>
                            Due: {formatINR(grandOffered - grandPaid)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}

              {/* ── Add custom invoice ── */}
              <div style={{ marginTop: 20 }}>
                <button className="btn-secondary" style={{ fontSize: 13 }}
                  onClick={() => { setAddInvOpen(o => !o); setAddInvErr(null) }}>
                  {addInvOpen ? '✕ Cancel' : '＋ Add Invoice'}
                </button>
                {addInvOpen && (
                  <div style={{ marginTop: 12, padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>New Invoice for {selectedStu.firstName}</div>
                    {addInvErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>⚠ {addInvErr}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Fee Category</label>
                        <select className="form-select" value={addInvType} onChange={e => setAddInvType(e.target.value)}>
                          {ACADEMIC_FEE_TYPES.map(ft => (
                            <option key={ft} value={ft}>{FEE_TYPE_META[ft]?.icon} {FEE_TYPE_META[ft]?.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Amount (₹)</label>
                        <input className="form-input" type="number" min="0" placeholder="e.g. 12000"
                          value={addInvAmount} onChange={e => setAddInvAmount(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Due Date</label>
                        <input className="form-input" type="date"
                          value={addInvDueDate} onChange={e => setAddInvDueDate(e.target.value)} />
                      </div>
                    </div>
                    <button className="btn-primary" onClick={handleCreateCustomInvoice} disabled={addInvSaving}>
                      {addInvSaving ? 'Creating…' : '✓ Create Invoice'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading…</div>
          ) : students.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No students enrolled yet</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Add students first, then assign fees here.</div>
            </div>
          ) : gradeSortedKeys.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-muted)' }}>No students match the current filter.</div>
          ) : (
            gradeSortedKeys.map(grade => {
              const sections = grouped[grade]
              const gradeStudents = Object.values(sections).flat()
              const allGradeSelected = gradeStudents.every(s => selectedIds.has(s.studentId))
              const isCollapsed = collapsedFeeGrades.has(grade)
              return (
                <div key={grade} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 6px', borderBottom: '2px solid var(--accent)', marginBottom: isCollapsed ? 0 : 10, cursor: 'pointer' }}
                    onClick={e => { if (e.target.type !== 'checkbox') toggleFeeGrade(grade) }}>
                    <input type="checkbox" checked={allGradeSelected}
                      onChange={() => toggleGrade(gradeStudents)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 15, height: 15, cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{isCollapsed ? '▶' : '▼'}</span>
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15 }}>Grade {grade}</span>
                    <span className="badge muted">{gradeStudents.length} students</span>
                  </div>
                  {!isCollapsed && Object.keys(sections).sort().map(sec => {
                    const secStudents = sections[sec]
                    const allSecSelected = secStudents.every(s => selectedIds.has(s.studentId))
                    return (
                      <div key={sec} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0 6px 24px' }}>
                          <input type="checkbox" checked={allSecSelected}
                            onChange={() => toggleSection(secStudents)}
                            style={{ width: 13, height: 13, cursor: 'pointer' }} />
                          Section {sec} · {secStudents.length} students
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: 36 }}></th>
                                <th>Adm. No.</th><th>Name</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sections[sec].map(s => (
                                <tr key={s.studentId} style={{ background: selectedIds.has(s.studentId) ? 'var(--blue-light)' : undefined }}>
                                  <td>
                                    <input type="checkbox" checked={selectedIds.has(s.studentId)}
                                      onChange={() => toggleId(s.studentId)}
                                      style={{ width: 14, height: 14, cursor: 'pointer' }} />
                                  </td>
                                  <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-muted)' }}>{s.admissionNumber}</span></td>
                                  <td>
                                    <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                                    {s.hasOverdue && <span className="badge red" style={{ marginLeft: 6 }}>Overdue</span>}
                                  </td>
                                  <td>{s.total > 0 ? formatINR(s.total) : <span style={{ color: 'var(--ink-muted)' }}>—</span>}</td>
                                  <td style={{ color: 'var(--green)' }}>{s.paid > 0 ? formatINR(s.paid) : '—'}</td>
                                  <td style={{ color: s.due > 0 ? 'var(--red)' : 'var(--ink-muted)', fontWeight: s.due > 0 ? 700 : 400 }}>
                                    {s.due > 0 ? formatINR(s.due) : '—'}
                                  </td>
                                  <td>
                                    {s.feeStatus === 'NONE'
                                      ? <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>No fees</span>
                                      : <span className={`badge ${STATUS_BADGE[s.feeStatus]}`}>{s.feeStatus}</span>
                                    }
                                  </td>
                                  <td>
                                    <button className="btn-ghost" onClick={() => setSelectedStuId(s.studentId)}>View</button>
                                  </td>
                                </tr>
                              ))}
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
        </>
      )}

      {/* ── Fee Structures ── */}
      {tab === 'structures' && (
        <div className={styles.remindersGrid}>
          {/* Create form */}
          <div className="card">
            <div className="section-head">Create Fee Structure</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 14 }}>
              Define academic fees per grade (tuition, lab, other). Transport fees are managed in the Transport module.
            </div>
            {fsMsg   && <div className="badge green" style={{ marginBottom: 12, display: 'block' }}>✓ {fsMsg}</div>}
            {fsError && <div style={{ color: 'var(--red)', marginBottom: 12, fontSize: 13 }}>⚠ {fsError}</div>}
            <form onSubmit={handleCreateFeeStructure}>
              <div className="form-group">
                <label className="form-label">Fee Type</label>
                <select className="form-select" value={fsForm.feeType} onChange={e => setFsForm(f => ({ ...f, feeType: e.target.value }))}>
                  {ACADEMIC_FEE_TYPES.map(ft => (
                    <option key={ft} value={ft}>{FEE_TYPE_META[ft]?.icon} {FEE_TYPE_META[ft]?.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Custom Display Name <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. Term 1 Tuition, Annual Sports Fee…"
                  value={fsForm.feeName} onChange={e => setFsForm(f => ({ ...f, feeName: e.target.value }))} />
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                  Overrides the fee type label in the student's fee breakdown table.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Grade Level</label>
                <select className="form-select" value={fsForm.gradeLevel} onChange={e => setFsForm(f => ({ ...f, gradeLevel: e.target.value }))}>
                  <option value="ALL">All Grades</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input className="form-input" value={fsForm.academicYear} onChange={e => setFsForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-26" />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" min="0" required placeholder="e.g. 35000"
                  value={fsForm.amount} onChange={e => setFsForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input className="form-input" type="date" required value={fsForm.dueDate} onChange={e => setFsForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input type="checkbox" id="recurring" checked={fsForm.recurring}
                  onChange={e => setFsForm(f => ({ ...f, recurring: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="recurring" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Recurring (charged every term)
                </label>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={fsSaving}>
                {fsSaving ? 'Saving…' : '+ Create Fee Structure'}
              </button>
            </form>
          </div>

          {/* List — grouped by grade, then by fee type within grade */}
          <div className="card">
            <div className="section-head">Fee Structures by Grade</div>
            {loading ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</p>
            ) : structures.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>No fee structures yet. Create one on the left.</p>
            ) : (
              <>
                {editFsErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>⚠ {editFsErr}</div>}
                {gradeFsKeys.map(grade => {
                  const byType = structuresByGrade[grade]
                  // compute total for this grade (exclude transport)
                  const gradeTotal = Object.entries(byType)
                    .filter(([type]) => type !== 'TRANSPORT')
                    .flatMap(([, arr]) => arr)
                    .reduce((sum, fs) => sum + (fs.amount || 0), 0)
                  return (
                    <div key={grade} style={{ marginBottom: 22 }}>
                      {/* Grade header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 8px', borderBottom: '2px solid var(--accent)', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14 }}>
                          {grade === 'ALL' ? 'All Grades' : `Grade ${grade}`}
                        </span>
                        {gradeTotal > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600 }}>
                            Total: {formatINR(gradeTotal)}
                          </span>
                        )}
                      </div>
                      {ALL_FEE_TYPES.map(feeType => {
                        const group = byType[feeType]
                        if (!group || group.length === 0) return null
                        const meta = FEE_TYPE_META[feeType]
                        return (
                          <div key={feeType} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {meta.icon} {meta.label}
                            </div>
                            <div className="table-wrap">
                              <table>
                                <thead>
                                  <tr><th>Year</th><th>Name</th><th>Amount</th><th>Due Date</th><th>Recurring</th><th></th></tr>
                                </thead>
                                <tbody>
                                  {group.map(fs => {
                                    const isEditingFs = editFsId === fs.feeStructureId
                                    return (
                                      <Fragment key={fs.feeStructureId}>
                                        <tr>
                                          <td>{fs.academicYear}</td>
                                          <td style={{ fontSize: 12, color: fs.feeName ? 'var(--ink)' : 'var(--ink-muted)', fontStyle: fs.feeName ? 'normal' : 'italic' }}>
                                            {fs.feeName || 'default'}
                                          </td>
                                          <td style={{ fontWeight: 600 }}>{formatINR(fs.amount)}</td>
                                          <td style={{ fontSize: 12 }}>{fs.dueDate ? new Date(fs.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                                          <td>{fs.recurring ? <span className="badge green">Yes</span> : <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>No</span>}</td>
                                          <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                              <button style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '3px 6px' }}
                                                onClick={() => {
                                                  setEditFsId(fs.feeStructureId)
                                                  setEditFsForm({
                                                    feeType: fs.feeType, feeName: fs.feeName || '',
                                                    gradeLevel: fs.gradeLevel,
                                                    academicYear: fs.academicYear, amount: String(fs.amount || ''),
                                                    dueDate: fs.dueDate ? fs.dueDate.slice(0, 10) : '',
                                                    recurring: fs.recurring,
                                                  })
                                                  setEditFsErr(null)
                                                }}>Edit</button>
                                              <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '3px 6px' }}
                                                onClick={() => handleDeleteStructure(fs.feeStructureId)}>Delete</button>
                                            </div>
                                          </td>
                                        </tr>
                                        {isEditingFs && (
                                          <tr style={{ background: 'var(--bg)' }}>
                                            <td colSpan={6} style={{ padding: '10px 12px' }}>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                  <label className="form-label" style={{ fontSize: 11 }}>Fee Type</label>
                                                  <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                                                    value={editFsForm.feeType}
                                                    onChange={e => setEditFsForm(f => ({ ...f, feeType: e.target.value }))}>
                                                    {ALL_FEE_TYPES.map(ft => (
                                                      <option key={ft} value={ft}>{FEE_TYPE_META[ft]?.icon} {FEE_TYPE_META[ft]?.label}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                  <label className="form-label" style={{ fontSize: 11 }}>Custom Name</label>
                                                  <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                                                    placeholder="Optional override"
                                                    value={editFsForm.feeName || ''}
                                                    onChange={e => setEditFsForm(f => ({ ...f, feeName: e.target.value }))} />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                  <label className="form-label" style={{ fontSize: 11 }}>Grade</label>
                                                  <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }}
                                                    value={editFsForm.gradeLevel}
                                                    onChange={e => setEditFsForm(f => ({ ...f, gradeLevel: e.target.value }))}>
                                                    <option value="ALL">All</option>
                                                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                                                  </select>
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                  <label className="form-label" style={{ fontSize: 11 }}>Amount (₹)</label>
                                                  <input className="form-input" type="number" min="0" style={{ fontSize: 12, padding: '5px 8px' }}
                                                    value={editFsForm.amount}
                                                    onChange={e => setEditFsForm(f => ({ ...f, amount: e.target.value }))} />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                  <label className="form-label" style={{ fontSize: 11 }}>Due Date</label>
                                                  <input className="form-input" type="date" style={{ fontSize: 12, padding: '5px 8px' }}
                                                    value={editFsForm.dueDate}
                                                    onChange={e => setEditFsForm(f => ({ ...f, dueDate: e.target.value }))} />
                                                </div>
                                                <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 4 }}>
                                                  <input type="checkbox" checked={editFsForm.recurring}
                                                    onChange={e => setEditFsForm(f => ({ ...f, recurring: e.target.checked }))}
                                                    style={{ width: 14, height: 14 }} />
                                                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Recurring</label>
                                                </div>
                                              </div>
                                              <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                                                  onClick={() => handleSaveFsEdit(fs.feeStructureId)} disabled={editFsSaving}>
                                                  {editFsSaving ? 'Saving…' : 'Save'}
                                                </button>
                                                <button className="btn-ghost" style={{ fontSize: 12 }}
                                                  onClick={() => { setEditFsId(null); setEditFsForm({}) }}>Cancel</button>
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
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Academic Years ── */}
      {tab === 'years' && (
        <div>
          {/* Add Academic Year button / form */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addYearOpen ? 16 : 0 }}>
              <div className="section-head" style={{ margin: 0 }}>Academic Years</div>
              <button className="btn-primary" onClick={() => { setAddYearOpen(o => !o); setAddYearErr(null) }}>
                {addYearOpen ? '✕ Cancel' : '+ Add Academic Year'}
              </button>
            </div>

            {addYearOpen && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>New Academic Year</div>
                {addYearErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>⚠ {addYearErr}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Year Label</label>
                    <input className="form-input" placeholder="e.g. 2025-26"
                      value={addYearLabel} onChange={e => setAddYearLabel(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date"
                      value={addYearStart} onChange={e => setAddYearStart(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date"
                      value={addYearEnd} onChange={e => setAddYearEnd(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 4 }}>
                    <input type="checkbox" id="addYearCurrentChk" checked={addYearCurrent}
                      onChange={e => setAddYearCurrent(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <label htmlFor="addYearCurrentChk" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                      Mark as Current Year
                    </label>
                  </div>
                </div>
                <button className="btn-primary" onClick={handleCreateYear} disabled={addYearSaving}>
                  {addYearSaving ? 'Saving…' : '✓ Create Academic Year'}
                </button>
              </div>
            )}
          </div>

          {/* Years list */}
          {yearsLoading ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading…</div>
          ) : years.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No academic years yet</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Add an academic year above to get started.</div>
            </div>
          ) : (
            years.map(yr => {
              const isExpanded = expandedYear === yr.academicYearId
              return (
                <div key={yr.academicYearId} className="card" style={{ marginBottom: 12 }}>
                  {/* Year header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16 }}>{yr.yearLabel}</span>
                        {yr.isCurrent && <span className="badge green">Current</span>}
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          {yr.startDate ? new Date(yr.startDate).toLocaleDateString('en-IN') : '—'}
                          {' – '}
                          {yr.endDate ? new Date(yr.endDate).toLocaleDateString('en-IN') : '—'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn-ghost" style={{ fontSize: 12 }}
                        onClick={() => {
                          setExpandedYear(isExpanded ? null : yr.academicYearId)
                          if (isExpanded) { setAddTermOpen(false); setAddTermErr(null) }
                        }}>
                        {isExpanded ? '▲ Hide Terms' : '▼ Show Terms'}
                      </button>
                      <button className="btn-danger" style={{ fontSize: 12 }}
                        onClick={() => handleDeleteYear(yr.academicYearId)}>Delete</button>
                    </div>
                  </div>

                  {/* Expanded: terms table + add term */}
                  {isExpanded && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 10, fontStyle: 'italic' }}>
                        Schools typically split the year into 3 fee terms (e.g., April–July, Aug–Nov, Dec–Mar)
                      </div>

                      {terms.length === 0 ? (
                        <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>No terms yet. Add one below.</p>
                      ) : (
                        <div className="table-wrap" style={{ marginBottom: 14 }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Term Name</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Fee %</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {terms.map(t => (
                                <tr key={t.termId}>
                                  <td style={{ fontWeight: 600 }}>{t.termName}</td>
                                  <td style={{ fontSize: 12 }}>{t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN') : '—'}</td>
                                  <td style={{ fontSize: 12 }}>{t.endDate ? new Date(t.endDate).toLocaleDateString('en-IN') : '—'}</td>
                                  <td>
                                    {t.feePercentage != null
                                      ? <span className="badge muted">{t.feePercentage}%</span>
                                      : <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>—</span>
                                    }
                                  </td>
                                  <td>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '3px 6px' }}
                                      onClick={() => handleDeleteTerm(t.termId)}>Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Add Term button / form */}
                      <div>
                        <button className="btn-ghost" style={{ fontSize: 13 }}
                          onClick={() => { setAddTermOpen(o => !o); setAddTermErr(null) }}>
                          {addTermOpen ? '✕ Cancel' : '+ Add Term'}
                        </button>
                        {addTermOpen && (
                          <div style={{ marginTop: 12, padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>New Fee Term</div>
                            {addTermErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>⚠ {addTermErr}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Term Name</label>
                                <select className="form-select"
                                  value={['Term 1','Term 2','Term 3'].includes(addTermName) ? addTermName : (addTermName ? 'Custom' : '')}
                                  onChange={e => {
                                    if (e.target.value === 'Custom') setAddTermName('')
                                    else setAddTermName(e.target.value)
                                  }}>
                                  <option value="">— Select —</option>
                                  <option value="Term 1">Term 1</option>
                                  <option value="Term 2">Term 2</option>
                                  <option value="Term 3">Term 3</option>
                                  <option value="Custom">Custom…</option>
                                </select>
                                {(!['Term 1','Term 2','Term 3',''].includes(addTermName) || (addTermName === '' && ['Custom'].includes(addTermName))) && (
                                  <input className="form-input" style={{ marginTop: 6 }} placeholder="Custom term name"
                                    value={addTermName} onChange={e => setAddTermName(e.target.value)} />
                                )}
                                {/* Show custom input when "Custom" is selected (addTermName cleared) */}
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Start Date</label>
                                <input className="form-input" type="date"
                                  value={addTermStart} onChange={e => setAddTermStart(e.target.value)} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">End Date</label>
                                <input className="form-input" type="date"
                                  value={addTermEnd} onChange={e => setAddTermEnd(e.target.value)} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Fee % (optional)</label>
                                <input className="form-input" type="number" min="0" max="100" placeholder="e.g. 33"
                                  value={addTermPct} onChange={e => setAddTermPct(e.target.value)} />
                              </div>
                            </div>
                            <button className="btn-primary" style={{ fontSize: 13, padding: '6px 16px' }}
                              onClick={handleCreateTerm} disabled={addTermSaving}>
                              {addTermSaving ? 'Saving…' : '✓ Add Term'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
