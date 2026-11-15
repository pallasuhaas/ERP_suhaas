# SchoolHub ERP — Platform AI Context

> **Every AI agent working on any part of this platform MUST read this file first.**
> This is the single source of truth for the entire SchoolHub ERP system.
> Update this file whenever you make a meaningful architectural decision, add a new service, add a new screen, or change integration contracts.

> ⚠️ **AGENT RULE — NON-FRONTEND CHANGES REQUIRE PERMISSION:**
> Before modifying any file in any repo other than `school-hub-frontend/`, you MUST ask the developer for explicit approval first. Describe the intended change and wait for a yes before touching any backend file. Log all approved backend changes in `backend-changed.md`.

---

## 1. What Is SchoolHub?

SchoolHub is a full-stack school ERP platform built for Indian schools. It covers:
- Student master data management
- Fee collection, assignment, and analytics
- Transport / bus fleet tracking and enrollment
- Parent–school communication and ticketing
- Management-level analytics and reporting

**Organisation on GitHub:** `vidya-verse`

---

## 2. Workspace Layout

All repos live under one central workspace folder:

```
schoolhub/                          ← open THIS folder in your IDE
├── AI-CONTEXT.md                   ← YOU ARE HERE — read this first every session
├── cursor-context.md               ← Cursor session log — what was built, for verification
├── backend-changed.md              ← Log of every backend file touched (with approval notes)
├── schema.sql                      ← Full CREATE TABLE SQL from the official PDF schema
├── data/
│   ├── demo_students.csv           ← 15-row sample for bulk student upload
│   └── demo_transport_assignments.csv ← 5-row sample for bulk transport CSV upload
│
├── school-hub-frontend/            ← React frontends (3 portals)
│   ├── webapp/                     ← Parent Portal  (port 5173)
│   ├── admin/                      ← Admin Portal   (port 5174)
│   └── management/                 ← Management Portal (port 5175)
│
├── student-info-service/           ← Git repo root
│   └── student-info-service/       ← Actual Spring Boot project (pom.xml here)
├── school-hub/                     ← Git repo root — master setup docs only (README.md)
├── school-hub-erp-infra/           ← Git repo root — AWS deployment architecture docs
│   └── docs/README.md
├── notification-service/           ← Git repo root
│   └── notification-service/
│       └── notification-service/   ← Actual Spring Boot project (pom.xml here)
├── payment-service/                ← Git repo root
│   └── payment-service/            ← Actual Spring Boot project (pom.xml here)
└── transport-service/              ← Git repo root
    └── transport-service/          ← Actual Spring Boot project (pom.xml here)
```

> **Note on nested paths:** Several repos have a nested directory structure. The actual
> Spring Boot project (where `pom.xml` and `mvnw` live) is one or two levels inside the
> cloned repo root. Always `cd` to the innermost folder containing `pom.xml` before running
> `./mvnw spring-boot:run`.

> **All repos are cloned and services are running.** The workspace is fully set up.

---

## 3. Technology Stack

### Frontend (`school-hub-frontend/`)
| Item | Choice |
|------|--------|
| Framework | React 18 |
| Bundler | Vite 6 |
| Styling | CSS Modules (no UI library) |
| Routing | Pure React state (`currentPage` string) — no React Router yet |
| Fonts | Fraunces (headings) + DM Sans (body) via Google Fonts |
| Icons | Inline emoji (no icon library) |
| Data | Admin portal fully wired to backend. Parent + management portals still use mock data. |
| Auth (frontend) | JWT stored in `localStorage`; not yet wired to any auth service |

### Backend (all Spring Boot services)
| Item | Choice |
|------|--------|
| Language | Java 17 |
| Framework | Spring Boot 3.5 (except notification-service which uses 4.0.3) |
| ORM | Spring Data JPA |
| Database | MySQL `school_hub` on port 3306 — all 4 services share one DB |
| Utilities | Lombok |
| Auth plan | Spring Security + JWT + OTP (not yet implemented) |
| Inter-service | REST (sync); future: event bus / Kafka |

---

## 4. Frontend Portals — Full Detail

### 4.1 Parent Portal (`webapp/` — port 5173)

**Users:** Parents / guardians
**Device:** Mobile-first (max-width 480px), responsive up to desktop
**Accent colour:** Orange `#e8521a`
**Auth:** Indian mobile number (+91) → 6-digit OTP

#### Navigation
```
NAV_PAGES = ['home', 'fees', 'bus', 'alerts', 'chat']
Sub-pages (no bottom nav): receipt, help, settings, history
Special route: '__logout__' → clears session
```

#### Screens Built
| Screen | File | Notes |
|--------|------|-------|
| Login | `LoginPage.jsx` | Step 1: +91 mobile. Step 2: 6-box OTP (auto-advance, 30s resend) |
| Dashboard | `Dashboard.jsx` | Greeting, fee-due card, bus status, 2×2 quick links, Help card |
| Finance | `Finance.jsx` | Tab 1: Fee Details. Tab 2: History & Receipts. `initialTab` prop for deep-link |
| Transport | `Transport.jsx` | Live map mock, ETA, stop timeline, driver card |
| Notifications | `Notifications.jsx` | Grouped Today/Yesterday, unread orange border |
| Chat | `Chat.jsx` | Contacts list → thread view per contact (5 staff types) |
| Receipt | `Receipt.jsx` | Sub-page from Finance History; PDF download button |
| Help | `Help.jsx` | Raise Ticket / My Tickets / FAQs tabs; call bar |
| Settings | `Settings.jsx` | Profile, children, payments, notifications, language, logout |

#### Responsive Layout
- **Mobile (<768px):** Fixed bottom nav (5 tabs), max-width 480px
- **Desktop (≥768px):** Fixed left sidebar (240px, dark ink), max-width 860px, bottom nav hidden

---

### 4.2 Admin Portal (`admin/` — port 5174)

**Users:** School admin staff (day-to-day operations)
**Device:** Desktop-first
**Accent colour:** Orange `#e8521a`
**Auth:** Work email + password → 6-digit OTP (MFA) — not yet wired to backend

#### Navigation (sidebar)
`dashboard` · `students` · `finance` · `transport` · `communication` · `settings`

#### API Clients (`src/api/`)
| File | Covers |
|------|--------|
| `students.js` | `GET/POST/PUT/DELETE /api/students`, `POST /api/students/bulk`, CSV parse, template download |
| `finance.js` | `fee-structures`, `fee-invoices`, `payment-transactions`, `discount-policies` |
| `transport.js` | `vehicles`, `drivers`, `transport-routes`, `route-stops`, `transport-assignments` |

#### Vite Proxy (`vite.config.js`) — current state
```
/api/students          → http://localhost:8091
/api/guardians         → http://localhost:8091
/api/enrollments       → http://localhost:8091
/api/fee-structures    → http://localhost:8092
/api/fee-invoices      → http://localhost:8092
/api/payment-transactions → http://localhost:8092
/api/discount-policies → http://localhost:8092
/api/vehicles          → http://localhost:8093
/api/drivers           → http://localhost:8093
/api/transport-routes  → http://localhost:8093
/api/route-stops       → http://localhost:8093
/api/transport-assignments → http://localhost:8093
/api/trip-sessions     → http://localhost:8093
/api/vehicle-tracking  → http://localhost:8093
/api/student-trip-status → http://localhost:8093
/api/notifications     → http://localhost:8094
```

#### Screens — Current State (fully integrated)

**Dashboard (`Dashboard.jsx`)**
- 5 stat cards wired to real data: total students, fee collected, outstanding fees, active routes, total vehicles
- Recent students list fetched live
- Fleet snapshot (vehicles + routes count)

**Students (`Students.jsx`)**
- Student list **grouped by Grade → Section** (sorted numerically by grade, then alphabetically by section)
- Grade header row: checkbox to select all students in that grade, student count badge
- Section sub-header: student count
- Per-row actions: individual Remove only
- **Bulk action bar** (appears when ≥1 student is checked):
  - Selected count + Clear + Remove Selected
  - 💰 Assign Fee: pick fee structure → creates `FeeInvoice` records for all selected students
  - 🚌 Assign Route: pick route + vehicle → creates `TransportAssignment` records for all selected students
  - Success/error feedback, auto-clears selection on success
- Add individual student: inline form (expandable)
- Bulk CSV upload tab: parse → preview → confirm → results (skips duplicate admission numbers)

**Finance (`Finance.jsx`)**
Three tabs: **Fee Lookup** · **Fee Structures** · **Assign / Modify Fees**

- *Fee Structures tab:* Create fee structure templates (feeType, gradeLevel, amount, academicYear, dueDate, recurring checkbox). List with delete.
- *Fee Lookup tab:* Students grouped by Grade → Section. Per-student row shows checkboxes. Floating bulk action bar when students selected: bulk assign fee structure, bulk mark invoices paid. Click a student to expand their invoices inline (mark paid, delete).
- *Assign / Modify Fees tab:* Assign fee to individual student (autocomplete) or bulk assign to entire grade.

**Transport (`Transport.jsx`)**
Four sub-tabs: **Fleet** · **Vehicles & Drivers** · **Routes** · **Student Enrollment**

- *Fleet:* Vehicle card overview
- *Vehicles & Drivers:* CRUD tables for vehicles and drivers
- *Routes:* CRUD for transport routes
- *Student Enrollment:* Two sub-tabs:
  - **Individual** — assign a student to a route + vehicle
  - **CSV Upload** — upload CSV (`admission_number,route_name,vehicle_registration,pickup_point,drop_point,effective_from`), client-side validation with ID mapping, bulk create assignments, results display
  - Current enrollments table with per-row remove + **bulk checkbox selection** + "Remove selected" button

**Communication** — still mock data (no backend chat/messaging service)
**Settings** — still mock data (no auth service)

---

### 4.3 Management Portal (`management/` — port 5175)

**Users:** Principal / super-user (read-only analytics & oversight)
**Device:** Desktop-first
**Accent colour:** Purple `#6c47e8`
**Auth:** SSO institutional email → 6-digit MFA OTP

#### Design principle: Zero mock data
Every KPI shows `—`, every table shows an empty state with the future REST endpoint it will call. This makes backend wiring unambiguous.

#### Screens Built
| Screen | Key Features |
|--------|-------------|
| Executive Dashboard | 5 KPI cards, bar chart skeleton (monthly trend), donut (% collected), quick nav |
| Fee Analytics | 4 sub-tabs: Forecasting / Payment Behaviour (AI defaulters) / Discounts / Tickets Report |
| Transport Analytics | 4 sub-tabs: Route Performance / Fuel & Expense / Incident Review / Live GPS (view-only) |
| Documents & Reports | Category pills, upload form, doc table, 6 auto-report cards with API endpoints |
| Settings | Profile, notification toggles, access & permissions table, sign out |

---

## 5. Backend Services

### Port Assignments
| Service | Port |
|---------|------|
| student-info-service | **8091** |
| payment-service | **8092** |
| transport-service | **8093** |
| notification-service | **8094** |

**Database:** Single MySQL database `school_hub` on port 3306. All services share one DB.

**application.properties — current state (all 4 services configured):**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/school_hub
spring.datasource.username=root
spring.datasource.password=<configured per machine>
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
# student-info-service, payment-service, transport-service:
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
# notification-service ONLY (Spring Boot 4.0.3 / Hibernate 7 — MySQL8Dialect was removed):
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

> All 4 services have been started and verified. CORS is configured. Schema is managed via `ddl-auto=update`.

---

### 5.1 `student-info-service`
- **Purpose:** Core student master data
- **Port:** 8091
- **Spring Boot project path:** `student-info-service/student-info-service/`
- **Entities:** Student, Guardian, ContactInfo, Address, Enrollment, StudentProfileSnapshot, UserAccount
- **Key endpoints:**
  - `GET/POST/PUT/DELETE /api/students`
  - `POST /api/students/bulk` ← added; skips duplicates by `admissionNumber`
  - CRUD on `/api/guardians/**`, `/api/enrollments/**`, `/api/addresses/**`, `/api/contact-info/**`, `/api/user-accounts/**`
- **Status:** ✅ Running. CORS configured. Bulk upload endpoint added.
- **Added files:** `CorsConfig.java`, `BulkUploadResponse.java` DTO
- **Modified files:** `StudentService.java` (added `bulkCreate()`), `StudentController.java` (added bulk endpoint)
- **Missing:** Spring Security, JWT, OTP

### 5.2 `payment-service`
- **Purpose:** Fee payment processing
- **Port:** 8092
- **Spring Boot project path:** `payment-service/payment-service/`
- **Entities:** FeeStructure, FeeInvoice, PaymentTransaction, DiscountPolicy
- **Enums:** FeeType (`TUITION`, `TRANSPORT`, `LAB`, `OTHER`), PaymentStatus, PaymentMode, InvoiceStatus
- **Key endpoints:** CRUD on `/api/fee-structures`, `/api/fee-invoices`, `/api/payment-transactions`, `/api/discount-policies`
- **Status:** ✅ Running. CORS configured. Two bugs fixed (see below).
- **Bug fixes applied:**
  1. `FeeInvoiceRepository`: `findByStudentStudentId` → `findByStudentId`; `findByStatus(String)` → `findByStatus(InvoiceStatus)`
  2. `WebClientConfig`: hardcoded `http://student-info-service` (K8s DNS) → `@Value("${student.service.url:http://localhost:8091}")`
  3. `FeeStructure.java` + `DiscountPolicy.java`: added `@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})` to fix Hibernate proxy Jackson serialization crash
- **FeeStructure required fields:** `feeType` (enum), `gradeLevel`, `amount`, `dueDate` (NOT NULL), `recurring` (Boolean NOT NULL)
- **Missing:** Payment gateway integration (Razorpay/PayU TBD)

### 5.3 `transport-service`
- **Purpose:** Bus fleet, routes, GPS tracking, student transport enrollment
- **Port:** 8093
- **Spring Boot project path:** `transport-service/transport-service/`
- **Entities:** Vehicle, Driver, TransportRoute, RouteStop, StudentTransportAssignment, TripSession, StudentTripStatus, VehicleTracking
- **Key endpoints:** CRUD on `/api/vehicles`, `/api/drivers`, `/api/transport-routes`, `/api/route-stops`, `/api/transport-assignments`, `/api/trip-sessions`, `/api/vehicle-tracking`, `/api/student-trip-status`
- **Status:** ✅ Running. CORS configured.
- **Missing:** GPS data source integration

### 5.4 `notification-service`
- **Purpose:** Notification delivery (push/SMS/email)
- **Port:** 8094
- **Spring Boot project path:** `notification-service/notification-service/notification-service/` (triple-nested)
- **Entities:** Notification, NotificationStatus (enum), TriggerType (enum), RecipientType (enum)
- **Status:** ✅ Running. CORS configured.
- **Important:** Uses Spring Boot **4.0.3** / Hibernate 7 — dialect must be `MySQLDialect`, NOT `MySQL8Dialect` (that class was removed in Hibernate 7)
- **Missing:** SMS/email provider integration (Twilio, MSG91, etc.)

### 5.5 `school-hub`
- README.md only — local dev setup guide + port assignments. Not an API gateway.

### 5.6 `school-hub-erp-infra`
- `docs/README.md` only — AWS deployment architecture doc (ECS Fargate, API Gateway, Cognito, VPC, RDS, Secrets Manager). No Terraform/K8s/Docker files yet.

---

## 6. Integration Roadmap

### Phase 1 — Backend Foundation ✅ COMPLETE
- [x] Configure `application.properties` in each service (DB URL, port, JPA)
- [x] Add `CorsConfig.java` to each service (allow origins 5173, 5174, 5175 in dev)
- [x] Verify all 4 services start and connect to MySQL
- [x] Fix `FeeInvoiceRepository` method name mismatch in payment-service
- [x] Fix Hibernate dialect in notification-service (Spring Boot 4 / Hibernate 7)

### Phase 2 — Authentication Layer (not started)
- [ ] Spring Security + JWT in `student-info-service` (or dedicated auth service)
- [ ] Parent login: mobile number → OTP via `notification-service` → JWT
- [ ] Admin/Management login: email + password → OTP → JWT
- [ ] JWT filter middleware securing all `/api/**` except `/api/auth/**`

### Phase 3 — Explore & Document Services ✅ COMPLETE
- [x] Read all 4 services, map entities + endpoints, update this file

### Phase 4 — API Service Layer in Admin Frontend ✅ COMPLETE
- [x] Vite proxy configured in all 3 `vite.config.js` files
- [x] `src/api/students.js` — CRUD + bulk upload + CSV parse + template download
- [x] `src/api/finance.js` — fee-structures, fee-invoices, transactions, discounts
- [x] `src/api/transport.js` — vehicles, drivers, routes, stops, assignments

### Phase 5 — Admin Portal End-to-End Integration ✅ COMPLETE
- [x] **Dashboard** — 5 live stat cards, recent students list, fleet snapshot
- [x] **Students** — Grouped view (grade → section); add individual; bulk CSV upload (skips duplicates); bulk action bar (assign fee + assign transport for selected students); individual remove per row
- [x] **Finance** — Fee Lookup (students by grade/section, checkboxes, bulk assign fee, bulk mark paid, per-student invoice detail); Fee Structures CRUD; Assign Fees (individual + bulk by grade)
- [x] **Transport** — Fleet overview; Vehicles CRUD; Drivers CRUD; Routes CRUD; Student Enrollment (individual + CSV bulk upload with client-side ID mapping); bulk remove assignments
- [ ] **Communication** — still mock data (no chat/messaging backend)
- [ ] **Settings** — still mock data (no auth service)

### Phase 6 — Parent Portal Integration (pending)
- [ ] Real OTP auth, student/fee/bus data wired

### Phase 7 — Management Portal Integration (pending)
- [ ] KPI cards, fee analytics, transport analytics wired to real aggregation endpoints

---

## 7. Design System Tokens (shared across all portals)

```css
/* Typography */
--font-heading: 'Fraunces', serif      /* display, card values */
--font-body:    'DM Sans', sans-serif  /* all UI text */

/* Core colours */
--ink:          #0f1117   /* near-black text */
--ink-soft:     #3a3d4a
--ink-muted:    #7a7f91
--surface:      #f5f4f0   /* warm off-white background */
--white:        #ffffff

/* Accent — per portal */
--accent-parent-admin: #e8521a   /* orange */
--accent-management:   #6c47e8   /* purple */

/* Semantic */
--green:  #1a8a4a   --green-light:  #e6f7ee
--red:    #d63838   --red-light:    #fdeaea
--orange: #d97706   --orange-light: #fef3e2
--blue:   #1a4ee8   --blue-light:   #eaefff
--teal:   #1a8a7a   --teal-light:   #e3f5f2
--gold:   #c9a84c   --gold-light:   #fdf6e3
--border: rgba(15,17,23,0.1)
```

---

## 8. Key Decisions & Conventions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | No React Router — pure state navigation | Simpler now; easy to add later |
| 2 | CSS Modules everywhere | No class name collisions across portals |
| 3 | No external UI component library | Full design control, custom brand |
| 4 | Emoji icons only | Zero icon library dependency |
| 5 | Indian locale throughout | ₹ currency, +91 mobile, Indian language options |
| 6 | Management portal has zero mock data | Forces clean API-first integration |
| 7 | Each portal is a separate Vite app | Independent deployment, clear ownership |
| 8 | Students tab is separate from Finance/Transport in admin | Per product decision |
| 9 | Tickets live in Communication module | Per product decision |
| 10 | JWT in localStorage (frontend) | Simple for now; revisit for production security |
| 11 | Students page groups by grade → section | Better UX for school admin navigating large lists |
| 12 | Fee Lookup groups by grade → section with checkboxes | Enables efficient bulk fee assignment per class |
| 13 | Per-row quick-assign buttons removed from Students page | Avoid duplicating Finance/Transport functionality; bulk bar is better UX |
| 14 | `FeeType` enum values: `TUITION`, `TRANSPORT`, `LAB`, `OTHER` | Must match backend enum exactly |
| 15 | `FeeStructure.recurring` and `dueDate` are NOT NULL in DB | Frontend must always send these fields |

---

## 9. Dev Server Quick Reference

```bash
# Frontend portals
cd school-hub-frontend/webapp      && npm run dev   # http://localhost:5173
cd school-hub-frontend/admin       && npm run dev   # http://localhost:5174
cd school-hub-frontend/management  && npm run dev   # http://localhost:5175

# Backend services
cd student-info-service/student-info-service                           && ./mvnw spring-boot:run   # http://localhost:8091
cd payment-service/payment-service                                     && ./mvnw spring-boot:run   # http://localhost:8092
cd transport-service/transport-service                                 && ./mvnw spring-boot:run   # http://localhost:8093
cd notification-service/notification-service/notification-service      && ./mvnw spring-boot:run   # http://localhost:8094
```

---

## 10. For AI Agents — How to Work Together

This file is the shared memory for all AI agents (Cursor, Copilot, Claude, GPT, etc.) working on this platform. Follow these rules:

### Before starting any task
1. **Read this file** (`AI-CONTEXT.md`) completely
2. **Check `cursor-context.md`** for the detailed Cursor session log — what was built, what was changed, open issues
3. **Check `backend-changed.md`** for the log of every backend file modified, with dates and approval notes
4. **Check the Integration Roadmap** (Section 6) to understand what is done and what is pending

### ⚠️ CRITICAL — Permission required for backend changes
- **`school-hub-frontend/`** — you may edit freely
- **Any other repo** — you MUST ask the developer for permission first, describe the change, and wait for approval before editing anything. Log every approved change in `backend-changed.md`.

### While working
4. **Do not break existing contracts** — if you change an API path or response shape, update this file
5. **Do not introduce mock data in the management portal** — it is intentionally API-ready with empty states
6. **Match the design system** — use the CSS variables from Section 7, do not invent new colours
7. **Keep navigation pure-state** — no `react-router-dom` until that decision is formally revisited

### After making changes
8. **Update this file** with new endpoints, new decisions, new screens, new service findings
9. **Update `backend-changed.md`** for any backend file touched (date, repo, file, reason, approver)
10. **Update `cursor-context.md`** with a summary of what you did this session

---

## 11. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Which service owns authentication — `student-info-service` or a dedicated `auth-service`? | Open |
| 2 | What SMS provider for OTP? (MSG91, Twilio, Kaleyra?) | Open |
| 3 | What payment gateway? (Razorpay, PayU, CCAvenue?) | Open |
| 4 | Is `school-hub` an API gateway? | **Resolved: No** — documentation only |
| 5 | What is the GPS data source for transport? `VehicleTracking` entity exists but no live feed | Open |
| 6 | Subdomain vs path-based deployment? AWS infra doc uses API Gateway → ALB pattern | Open |
| 7 | Should frontend use React Router eventually? | Open |
| 8 | `payment-service` has a `client/` package — calls `student-info-service` at `localhost:8091` via `WebClient` | Resolved — WebClientConfig now reads URL from `application.properties` |

---

## 12. Shared Opportunities

| # | Opportunity | Impact |
|---|-------------|--------|
| 1 | Shared `api/client.js` utility (fetch + JWT header + error handling) as an npm workspace package | Eliminates duplication across 3 portals |
| 2 | Design tokens extracted to a shared CSS file or npm package | Single source of truth |
| 3 | OTP input component (6-box, auto-advance, backspace nav) duplicated across all 3 login pages — extract | DRY |
| 4 | Badge / status chip component hand-coded in each portal — extract | DRY |

---

*Last updated: Apr 9, 2026. All 4 backend services running (8091–8094). Admin portal fully wired — Dashboard, Students (grouped by grade/section, bulk assign fee + transport), Finance (Fee Lookup by grade/section, bulk actions), Transport (fleet CRUD, CSV enrollment, bulk remove). Communication + Settings still mock data. Next: Phase 2 (auth) or Phase 6 (parent portal).*
