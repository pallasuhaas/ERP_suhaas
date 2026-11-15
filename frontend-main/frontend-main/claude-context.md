# SchoolHub ERP — Claude Code Session Context

> **Written by:** Claude Code (claude-sonnet-4-6) — Session: Apr 15, 2026
> **Read before starting any new Claude Code session on this project.**
> Always read `AI-CONTEXT.md` first, then `cursor-context.md`, then this file.
> This file is maintained in addition to (not instead of) those files.

---

## What Is This File?

This is the Claude Code session log. It records what Claude Code has done, verified, and observed in this workspace — with gotchas, file maps, and flags specific to working in this codebase from the command line.

---

## Project Snapshot (as of Apr 15, 2026)

SchoolHub ERP is a full-stack school management platform for Indian schools. It has:
- **3 React frontends** (Parent portal, Admin portal, Management portal)
- **4 Spring Boot microservices** sharing one MySQL database (`school_hub` on port 3306)
- **Organisation on GitHub:** `vidya-verse`

### What Is Actually Working End-to-End

| Feature | Status |
|---------|--------|
| Admin portal — Dashboard live stats (5 cards) | ✅ |
| Admin portal — Students (grouped by grade/section, CRUD, bulk CSV upload) | ✅ |
| Admin portal — Students bulk fee assign from Students page | ✅ |
| Admin portal — Students bulk transport assign from Students page | ✅ |
| Admin portal — Finance: Fee Structures CRUD | ✅ |
| Admin portal — Finance: Fee Lookup (grouped, checkboxes, inline invoices) | ✅ |
| Admin portal — Finance: Bulk assign fee + bulk mark paid | ✅ |
| Admin portal — Transport: Fleet, Vehicles, Drivers, Routes CRUD | ✅ |
| Admin portal — Transport: Student Enrollment (individual + CSV bulk) | ✅ |
| Admin portal — Transport: Bulk remove assignments | ✅ |
| Admin portal — Communication tab | ❌ Mock data only |
| Admin portal — Settings tab | ❌ Mock data only |
| Parent portal (webapp) — All screens | ❌ Mock data — not wired to backend |
| Management portal — All screens | ❌ Zero-state (intentional, API-ready) |
| Authentication (any portal) | ❌ Not started |
| GPS live feed | ❌ Entity exists, no data source |
| SMS/email provider for OTP | ❌ Not integrated |
| Payment gateway | ❌ Not integrated |

---

## Directory Map (verified Apr 15, 2026)

```
schoolhub/
├── AI-CONTEXT.md                    ← Master context — read first every session
├── cursor-context.md                ← Cursor AI session log
├── backend-changed.md               ← Approved backend change log
├── claude-context.md                ← THIS FILE — Claude Code session log
├── schema.sql                       ← Full DDL (13KB, derived from PDF)
├── TS-SQL Schema for School Hub Data Model-090426-185739.pdf  ← Original schema PDF
│
├── data/
│   ├── demo_students.csv            ← 15-row test CSV for bulk student upload
│   └── demo_transport_assignments.csv ← 5-row test CSV for transport bulk upload
│
├── school-hub-frontend/
│   ├── webapp/          → Parent Portal   (port 5173)
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── components/  BottomNav, LoginPage, NavSidebar
│   │       └── pages/       Chat, Dashboard, Finance, Help, Notifications,
│   │                        Receipt, Settings, Transport
│   │
│   ├── admin/           → Admin Portal    (port 5174)
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── api/         finance.js, students.js, transport.js
│   │       ├── components/  AdminHeader, AdminLogin, AdminSidebar
│   │       └── pages/       Communication, Dashboard, Finance, Settings,
│   │                        Students, Transport
│   │
│   └── management/      → Management Portal (port 5175)
│       └── src/
│           ├── App.jsx
│           ├── components/  MgmtHeader, MgmtLogin, MgmtSidebar
│           └── pages/       Documents, ExecDashboard, FeeAnalytics,
│                            Settings, TransportAnalytics
│
├── student-info-service/student-info-service/   ← pom.xml here (port 8091)
│   └── src/main/java/com/studenthub/student_info_service/
│       ├── config/           CorsConfig.java
│       ├── controllers/      Student, Guardian, Enrollment, Address,
│       │                     ContactInfo, StudentProfileSnapshot, UserAccount
│       ├── data/model/       Student, Guardian, Enrollment, Address,
│       │                     ContactInfo, StudentProfileSnapshot, UserAccount,
│       │                     + enums: AddressType, StudentStatus, UserRole
│       ├── data/repository/  (one per entity)
│       ├── dto/              BulkUploadResponse.java
│       └── service/          (one per entity, StudentService has bulkCreate)
│
├── payment-service/payment-service/             ← pom.xml here (port 8092)
│   └── src/main/java/com/studenthub/payment_service/
│       ├── config/           CorsConfig.java, WebClientConfig.java
│       ├── controller/       DiscountPolicy, FeeInvoice, FeeStructure,
│       │                     PaymentTransaction
│       ├── data/model/       DiscountPolicy, DiscountCriteria, FeeInvoice,
│       │                     FeeStructure, PaymentTransaction
│       │                     + enums: FeeType, InvoiceStatus, PaymentMode,
│       │                              PaymentStatus
│       ├── data/repository/  (one per entity)
│       ├── client/           StudentClient.java, StudentDto.java
│       └── service/          (one per entity)
│
├── transport-service/transport-service/         ← pom.xml here (port 8093)
│   └── src/main/java/com/studenthub/transport_service/
│       ├── config/           CorsConfig.java
│       ├── controller/       Driver, RouteStop, StudentTransportAssignment,
│       │                     StudentTripStatus, TransportRoute, TripSession,
│       │                     Vehicle, VehicleTracking
│       ├── data/model/       Driver, RouteStop, StudentTransportAssignment,
│       │                     StudentTripStatus, TransportRoute, TripSession,
│       │                     Vehicle, VehicleTracking
│       │                     + enums: DropoffStatus, EmploymentStatus,
│       │                              PickupStatus, TrackingStatus, TripStatus,
│       │                              TripType, VehicleStatus, VehicleType
│       ├── data/repository/  (one per entity)
│       └── service/          (one per entity)
│
└── notification-service/notification-service/notification-service/  ← pom.xml here (port 8094)
    └── src/main/java/com/studenthub/notification_service/
        ├── config/           CorsConfig.java
        ├── controller/       NotificationController.java
        ├── data/model/       Notification.java
        │                     + enums: NotificationStatus, RecipientType, TriggerType
        ├── data/repository/  NotificationRepository.java
        └── service/          NotificationService.java
```

---

## Backend — Critical Gotchas

These will burn you if you don't know them. All verified from change logs.

| Gotcha | Detail |
|--------|--------|
| `notification-service` is triple-nested | Path is `notification-service/notification-service/notification-service/` — you need to `cd` three levels deep to find `pom.xml` |
| `notification-service` uses Spring Boot **4.0.3** | Hibernate 7 is bundled — `MySQL8Dialect` was **removed**. `application.properties` must use `org.hibernate.dialect.MySQLDialect` |
| `FeeStructure.recurring` is NOT NULL | Always send `recurring: true/false` in POST body — omitting it causes a 500 |
| `FeeStructure.dueDate` is NOT NULL | Same — must be present in POST body |
| `FeeType` enum values are uppercase | Must be exactly `TUITION`, `TRANSPORT`, `LAB`, `OTHER` — lowercase will be rejected |
| `InvoiceStatus` enum | Backend expects `UNPAID` (uppercase) — frontend sends `"UNPAID"`, this is correct |
| `payment-service` WebClient | Was hardcoded to Kubernetes DNS `http://student-info-service`. Fixed to read `student.service.url` from `application.properties`. If it breaks again, check `WebClientConfig.java` |
| `FeeStructure` / `DiscountPolicy` lazy load | Added `@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})` to both entity classes to prevent Jackson crash on serialization. Do not remove. |
| Transport CSV upload dependencies | CSV upload requires students, routes, and vehicles to already exist in DB. Maps by admission number, route name, and vehicle registration. Missing matches are skipped, not errored. |
| Bulk student upload | `POST /api/students/bulk` skips (does not replace) duplicates by `admissionNumber`. Second upload of same CSV returns everything in `skipped` list — this is expected behavior. |

---

## Frontend — Critical Gotchas

| Gotcha | Detail |
|--------|--------|
| No React Router | Navigation is pure React state (`currentPage` string in `App.jsx`). Do NOT add `react-router-dom` without a product decision. |
| CSS Modules only | No UI component library. All styling via `*.module.css` files co-located with components. |
| JWT in `localStorage` | Auth not yet implemented. When it is built, JWT will be stored in `localStorage`. |
| Admin portal vite proxy | `vite.config.js` in `admin/` proxies all `/api/*` paths to the correct backend port. If you add a new API path in the admin, add the proxy entry too. |
| Emoji icons only | No icon library. All icons are inline emoji characters. Don't add lucide, heroicons, etc. |
| `FeeType` in frontend `finance.js` | Hardcoded enum values: `['TUITION', 'TRANSPORT', 'LAB', 'OTHER']` — must match backend exactly |
| Students page bulk action bar | Appears only when `selectedStudents.length > 0`. It renders outside the table map (avoids React JSX Fragment issue from Session 3). Don't move it back inside the map. |
| Management portal has zero mock data | **By design.** Every KPI shows `—` and every table is empty. Do not add mock data to any management portal screen. |
| Parent portal is all mock data | **Intentionally not wired.** Wiring is Phase 6 work. |

---

## API Contract Quick Reference

### student-info-service (port 8091)
```
GET    /api/students                     → list all students
POST   /api/students                     → create student
PUT    /api/students/{id}               → update student
DELETE /api/students/{id}               → delete student
POST   /api/students/bulk               → bulk create (skips duplicates by admissionNumber)
                                          Returns: { saved: [], skipped: [], duplicates: [], savedCount, skippedCount }
GET    /api/enrollments                  → list enrollments
GET    /api/guardians                    → list guardians
```

### payment-service (port 8092)
```
GET    /api/fee-structures               → list all fee structures
POST   /api/fee-structures               → create (required: feeType, gradeLevel, amount, dueDate, recurring)
DELETE /api/fee-structures/{id}          → delete
GET    /api/fee-invoices                 → list all invoices
POST   /api/fee-invoices                 → create (required: feeStructureId, studentId, invoiceDate, dueDate, totalAmount, status="UNPAID")
PUT    /api/fee-invoices/{id}            → update (used for mark-paid: status="PAID")
DELETE /api/fee-invoices/{id}            → delete
GET    /api/payment-transactions         → list transactions
GET    /api/discount-policies            → list discount policies
```

### transport-service (port 8093)
```
GET/POST/DELETE /api/vehicles
GET/POST/DELETE /api/drivers
GET/POST/DELETE /api/transport-routes
GET/POST/DELETE /api/route-stops
GET    /api/transport-assignments        → list all assignments
POST   /api/transport-assignments        → create (required: studentId, routeId, vehicleId, effectiveFrom)
DELETE /api/transport-assignments/{id}   → delete
GET    /api/trip-sessions
GET    /api/vehicle-tracking
GET    /api/student-trip-status
```

### notification-service (port 8094)
```
GET/POST /api/notifications
```

---

## Integration Status by Portal

### Admin Portal (`admin/` — port 5174) — FULLY WIRED
All 3 API clients exist: `src/api/students.js`, `src/api/finance.js`, `src/api/transport.js`
Vite proxy in `admin/vite.config.js` covers all backend paths.

### Parent Portal (`webapp/` — port 5173) — MOCK DATA ONLY
All screens use hardcoded data. No `src/api/` folder exists yet. Vite proxy in `webapp/vite.config.js` does exist (same proxy config as admin).

### Management Portal (`management/` — port 5175) — ZERO STATE
All screens intentionally show `—` and empty states. No `src/api/` folder. Vite proxy exists. This is the API-ready state — every KPI card has a comment noting the REST endpoint it will eventually call.

---

## Dev Commands (quick copy-paste)

```bash
# Frontend — run from schoolhub/school-hub-frontend/
cd school-hub-frontend/webapp      && npm run dev   # http://localhost:5173
cd school-hub-frontend/admin       && npm run dev   # http://localhost:5174
cd school-hub-frontend/management  && npm run dev   # http://localhost:5175

# Backend — run from schoolhub/ root
cd student-info-service/student-info-service && ./mvnw spring-boot:run          # :8091
cd payment-service/payment-service && ./mvnw spring-boot:run                    # :8092
cd transport-service/transport-service && ./mvnw spring-boot:run                # :8093
cd notification-service/notification-service/notification-service && ./mvnw spring-boot:run  # :8094
```

---

## Rules for This Codebase (for Claude Code)

1. **Frontend is free to edit** — `school-hub-frontend/` can be modified without asking.
2. **Backend requires permission** — any file outside `school-hub-frontend/` needs explicit developer approval before touching. Describe the change, wait for yes, then log it in `backend-changed.md`.
3. **No React Router** — navigation stays as pure state until formally decided otherwise.
4. **CSS Modules only** — no UI libraries, no Tailwind, no styled-components.
5. **No emoji unless asked** — keep communication and code terse and clean.
6. **Management portal stays zero-mock** — no fake data, ever.
7. **After backend changes** — update `backend-changed.md` and `AI-CONTEXT.md`.
8. **After frontend changes** — update `AI-CONTEXT.md` (Section 4 and Section 6) if a new screen, endpoint, or architectural decision was made.

---

## Next Priority Work (from cursor-context.md + my read)

| Priority | Task | Phase |
|----------|------|-------|
| 1 | Auth layer — Spring Security + JWT in `student-info-service` or new `auth-service`; OTP via `notification-service` | Phase 2 |
| 2 | Parent portal backend wiring — real student/fee/bus data in `webapp/` | Phase 6 |
| 3 | Communication tab — needs a chat/messaging backend (not built) | — |
| 4 | Management portal KPI aggregation endpoints | Phase 7 |
| 5 | GPS live feed — `VehicleTracking` entity exists, no data source yet | — |
| 6 | Payment gateway integration (Razorpay / PayU TBD) | — |
| 7 | SMS/email provider for OTP (MSG91 / Twilio TBD) | — |

---

## Open Architectural Questions

| # | Question |
|---|----------|
| 1 | Which service owns auth — extend `student-info-service` or create a dedicated `auth-service`? |
| 2 | SMS provider: MSG91, Twilio, or Kaleyra? |
| 3 | Payment gateway: Razorpay, PayU, or CCAvenue? |
| 4 | GPS data source for `VehicleTracking`? |
| 5 | Eventually migrate to React Router? (currently no decision) |
| 6 | Deployment: subdomain vs path-based? (AWS API Gateway → ALB pattern documented in infra repo) |

---

## Session Log

### Session 1 — Apr 15, 2026 (Claude Code)
- Read all three context files (`AI-CONTEXT.md`, `cursor-context.md`, `backend-changed.md`)
- Ran full directory exploration to verify actual files on disk match what context files describe
- Confirmed all 4 backend service directories exist with correct nested paths
- Confirmed all 3 frontend portals exist with correct structure
- Confirmed `src/api/` exists only in `admin/` (as expected — webapp and management have no API clients yet)
- Confirmed `data/demo_students.csv` and `data/demo_transport_assignments.csv` exist
- Confirmed `schema.sql` and the original PDF schema exist at workspace root
- Wrote this `claude-context.md` as the Claude Code session log

---

*Last updated: Apr 15, 2026 by Claude Code (claude-sonnet-4-6). No code changes made this session — read-only project orientation.*
