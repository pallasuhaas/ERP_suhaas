# SchoolHub ERP — Cursor Session Context

> This file is the Cursor AI session log for the SchoolHub project.
> It records every session: what was built, what files were changed, what bugs were fixed, and what remains to verify.
> **Another agent picking up this project should read `AI-CONTEXT.md` first, then this file.**

---

## How to Use This File

- Read this before starting any new session to avoid duplicate work and understand current state.
- After completing work, append a new session block at the bottom with date, changes made, and any open issues.
- Cross-reference with `backend-changed.md` for full details on backend modifications.

---

## Session 1 — Apr 9, 2026: Workspace Setup + Backend Foundation

### What Was Done
1. Cloned all 6 GitHub repos (`school-hub-erp-infra`, `school-hub`, `notification-service`, `payment-service`, `transport-service`, `student-info-service`) into the workspace
2. Configured `application.properties` for all 4 Spring Boot services (DB URL, port, JPA dialect, `ddl-auto=update`)
3. Added `CorsConfig.java` to all 4 services (allows `localhost:5173`, `5174`, `5175`)
4. Fixed `FeeInvoiceRepository` method name mismatch in `payment-service`
5. Fixed Hibernate dialect in `notification-service` (`MySQL8Dialect` → `MySQLDialect` — removed in Hibernate 7 bundled with Spring Boot 4.0.3)
6. Fixed `mvnw` permissions (`chmod +x`) on all services
7. Created `schema.sql` at workspace root (full `CREATE TABLE` DDL from the official PDF schema)
8. Created `data/demo_students.csv` (15-row sample for bulk upload testing)
9. Created `data/demo_transport_assignments.csv` (5-row sample for transport CSV upload)

### Backend Files Changed
See `backend-changed.md` → Session: Apr 9, 2026

---

## Session 2 — Apr 9–10, 2026: Admin Portal End-to-End Integration

### What Was Done

#### API Client Layer (`school-hub-frontend/admin/src/api/`)
- Created `students.js` — `getStudents`, `createStudent`, `updateStudent`, `deleteStudent`, `bulkCreateStudents`, `parseCSV`, `downloadTemplate`
- Created `finance.js` — `getFeeStructures`, `createFeeStructure`, `deleteFeeStructure`, `getInvoices`, `createInvoice`, `markInvoicePaid`, `deleteInvoice`, `getTransactions`, `getDiscounts`
- Created `transport.js` — `getVehicles`, `createVehicle`, `deleteVehicle`, `getDrivers`, `createDriver`, `deleteDriver`, `getRoutes`, `createRoute`, `deleteRoute`, `getStopsByRoute`, `getAssignments`, `createAssignment`, `deleteAssignment`

#### Vite Proxy (`vite.config.js` in all 3 portals)
All API paths proxied to correct backend services. Transport endpoints expanded to include `trip-sessions`, `vehicle-tracking`, `student-trip-status`.

#### Dashboard (`Dashboard.jsx`)
Rewritten to fetch live data: student count, fee collected, outstanding fees, active routes, vehicle count. Recent students list.

#### Students (`Students.jsx`) — initial integration
- Full CRUD list wired to `student-info-service`
- Add individual student (inline form)
- Bulk CSV upload: parse → preview → validate → confirm → results (with duplicate skip behavior)

#### Finance (`Finance.jsx`)
- **Fee Structures tab:** Create/delete fee structure templates. Fixed required fields: `dueDate` (NOT NULL), `recurring` (Boolean NOT NULL), correct `FeeType` enum values (`TUITION`, `TRANSPORT`, `LAB`, `OTHER`).
- **Fee Lookup tab:** Students grouped by grade → section. Click student to see invoices inline. Mark paid / delete invoice. Checkboxes + floating bulk action bar: bulk assign fee, bulk mark paid.
- **Assign Fees tab:** Assign to individual student (autocomplete) or bulk by grade.

#### Transport (`Transport.jsx`)
- Fleet overview, Vehicles CRUD, Drivers CRUD, Routes CRUD
- Student Enrollment: individual assignment form + CSV upload sub-tab (client-side validation, admission number → studentId mapping, route name → routeId, vehicle registration → vehicleId)
- Current enrollments table: per-row remove + checkbox bulk select + "Remove selected" button

### Backend Bug Fixes (Session 2)
See `backend-changed.md` → Session: Apr 10, 2026

---

## Session 3 — Apr 9, 2026: Students Page Refactor

### What Was Changed

**`school-hub-frontend/admin/src/pages/Students.jsx`** — major refactor:

#### Removed
- Per-row "💰 Fee" and "🚌 Route" quick-action buttons
- `QuickActionPanel` component (inline fee/transport assignment per row)
- `quickAction` state

#### Added — Grouped View
- Students now rendered as **Grade groups** (sorted numerically) → **Section sub-groups** (sorted alphabetically)
- Grade header: checkbox to select/deselect entire grade, student count badge
- Section sub-header: student count
- Columns per section table: Checkbox, Adm No., Name, Gender, DOB, Status, Actions (Remove only)
- Grade filter dropdown still works — collapses view to one grade

#### Added — Bulk Action Bar
Appears when any student checkbox is checked:
- `{N} students selected` + `✕ Clear` + `🗑 Remove Selected`
- **💰 Assign Fee section:** fee structure dropdown → `Assign` button → creates `FeeInvoice` for all selected students via `POST /api/fee-invoices`
- **🚌 Assign Route section:** route dropdown + vehicle dropdown → `Assign` button → creates `StudentTransportAssignment` for all selected students via `POST /api/transport-assignments`
- Inline success/error messages; selection auto-clears on success

#### Also Fixed in This Session
- JSX rendering bug: conditional `<tr>` returned alongside another `<tr>` inside `.map()` without a `React.Fragment` wrapper was causing babel parse error. Fixed by moving the panel outside the map.

---

## Current State — What Works End-to-End

| Feature | Status | Notes |
|---------|--------|-------|
| View all students (grouped by grade/section) | ✅ | Live from `student-info-service` |
| Add individual student | ✅ | |
| Bulk CSV student upload | ✅ | Duplicates (by admissionNumber) are skipped, not replaced |
| Bulk assign fee to selected students | ✅ | Creates FeeInvoice records |
| Bulk assign transport to selected students | ✅ | Creates TransportAssignment records |
| Remove individual student | ✅ | |
| Remove multiple students | ✅ | |
| View fee structures | ✅ | |
| Create / delete fee structure | ✅ | |
| Fee Lookup by grade/section | ✅ | Grouped, with inline invoices |
| Bulk assign fee (Finance page) | ✅ | |
| Bulk mark invoices paid | ✅ | |
| View vehicles / drivers / routes | ✅ | |
| CRUD vehicles / drivers / routes | ✅ | |
| Assign student to transport (individual) | ✅ | |
| Bulk transport CSV upload | ✅ | Client-side ID mapping |
| Bulk remove transport assignments | ✅ | |
| Dashboard live stats | ✅ | |
| Communication tab | ❌ | Mock data only — no backend |
| Settings tab | ❌ | Mock data only — no auth service |
| Parent portal backend integration | ❌ | All mock data |
| Management portal backend integration | ❌ | All zero-state (intentional) |
| Authentication (any portal) | ❌ | Not started |

---

## What Needs Verification

A new agent should verify the following:

### Frontend (no backend changes needed)
1. **Students grouped view** — open admin portal → Students tab → confirm students appear under Grade/Section headers, not in a flat list
2. **Bulk fee assign from Students page** — select students → pick fee structure → Assign → verify invoices created in Finance → Fee Lookup
3. **Bulk transport assign from Students page** — select students → pick route + vehicle → Assign → verify assignments appear in Transport → Student Enrollment
4. **Finance Fee Lookup** — confirm grouped by grade/section; checkboxes work; bulk assign fee works; bulk mark paid works
5. **Transport CSV upload** — upload `data/demo_transport_assignments.csv` → verify assignments created (requires that students with those admission numbers and routes/vehicles exist)
6. **Duplicate bulk upload** — upload `data/demo_students.csv` twice → second upload should skip all, not replace
7. **Dashboard stats** — confirm all 5 cards show real numbers, not zero or NaN

### Backend (needs all 4 services running)
1. `POST /api/students/bulk` — test duplicate handling (return `skipped` list for existing admission numbers)
2. `POST /api/fee-invoices` — requires `feeStructureId`, `studentId`, `invoiceDate`, `dueDate`, `totalAmount`, `status` (enum: `UNPAID`)
3. `POST /api/transport-assignments` — requires `studentId`, `routeId`, `vehicleId`, `effectiveFrom`
4. `GET /api/fee-structures` — verify `recurring` and `dueDate` fields are returned
5. `GET /api/transport-assignments` — verify existing assignments are returned

---

## Known Issues / Watch Out For

| Issue | Details |
|-------|---------|
| `payment-service` inter-service call | `WebClientConfig` was hardcoded to `http://student-info-service` (K8s DNS). Fixed to read from `application.properties` (`student.service.url=http://localhost:8091`). If payment-service restarts and the config was not saved, re-apply. |
| `notification-service` dialect | Must use `MySQLDialect`, NOT `MySQL8Dialect`. Spring Boot 4.0.3 / Hibernate 7 removed `MySQL8Dialect`. If service fails to start, check `application.properties`. |
| FeeStructure `recurring` field | Backend entity has `recurring Boolean NOT NULL`. If this field is missing in the POST body, you'll get a 500. Frontend always sends `recurring: false` by default. |
| FeeInvoice status enum | Backend expects `InvoiceStatus` enum value `UNPAID`, not the string `"unpaid"`. Frontend sends `"UNPAID"`. |
| Transport CSV upload | Requires students, routes, and vehicles to already exist in the DB. The CSV maps by admission number, route name, and vehicle registration — if any don't match, those rows are skipped with an error. |

---

## File Reference

| File | Purpose |
|------|---------|
| `AI-CONTEXT.md` | Master platform context — architecture, services, design system, roadmap |
| `cursor-context.md` | This file — Cursor session log, what was built, verification checklist |
| `backend-changed.md` | Log of every backend file modified, with dates and approvals |
| `schema.sql` | Full DDL from the official schema PDF |
| `data/demo_students.csv` | Test CSV for bulk student upload |
| `data/demo_transport_assignments.csv` | Test CSV for bulk transport assignment upload |

---

## Next Suggested Work

In priority order:

1. **Auth layer (Phase 2)** — Spring Security + JWT in `student-info-service` or a new `auth-service`; wire OTP via `notification-service`
2. **Parent portal backend integration (Phase 6)** — wire real student/fee/bus data into `webapp/`
3. **Communication tab** — needs a chat/messaging backend (not yet built)
4. **Management portal KPIs (Phase 7)** — aggregation endpoints for the analytics portal
5. **GPS integration** — `VehicleTracking` entity exists in `transport-service` but has no live data feed
