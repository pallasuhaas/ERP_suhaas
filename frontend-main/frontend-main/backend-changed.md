# Backend Change Log

> **Rule for all AI agents:** Before modifying any repository other than `school-hub-frontend/`, you **must** ask the developer for explicit permission first. Describe what you intend to change and why, then wait for approval before touching any file.
> Log every approved change in this file (`backend-changed.md`). See `AI-CONTEXT.md` for full platform context and `cursor-context.md` for session history.

---

## Session: Apr 9, 2026 — Initial Backend Integration

### `student-info-service`
**Path:** `student-info-service/student-info-service/`

| File | Type | Description |
|------|------|-------------|
| `src/main/resources/application.properties` | Modified | Added `server.port=8091`, DB datasource URL, JPA config, `ddl-auto=update`, `show-sql=true`, `MySQL8Dialect` |
| `src/main/java/com/studenthub/student_info_service/config/CorsConfig.java` | Created | `WebMvcConfigurer` bean allowing `GET POST PUT DELETE OPTIONS PATCH` from ports 5173, 5174, 5175 |
| `src/main/java/com/studenthub/student_info_service/dto/BulkUploadResponse.java` | Created | DTO for bulk upload response: `saved` (list), `skipped` (list), `duplicates` (list), counts |
| `src/main/java/com/studenthub/student_info_service/service/StudentService.java` | Modified | Added `bulkCreate(List<Student> students)` — iterates list, checks for duplicate `admissionNumber` in DB, saves non-duplicates |
| `src/main/java/com/studenthub/student_info_service/controllers/StudentController.java` | Modified | Added `POST /api/students/bulk` endpoint that calls `studentService.bulkCreate()` and returns `BulkUploadResponse` |

---

### `payment-service`
**Path:** `payment-service/payment-service/`

| File | Type | Description |
|------|------|-------------|
| `src/main/resources/application.properties` | Modified | Added `server.port=8092`, DB datasource URL, JPA config, `student.service.url=http://localhost:8091` |
| `src/main/java/com/studenthub/payment_service/config/CorsConfig.java` | Created | Same CORS config as above (ports 5173–5175) |
| `src/main/java/com/studenthub/payment_service/data/repository/FeeInvoiceRepository.java` | Modified | **Bug fix:** renamed `findByStudentStudentId` → `findByStudentId` and changed `findByStatus(String)` → `findByStatus(InvoiceStatus)` to match actual entity shape |
| `src/main/java/com/studenthub/payment_service/service/FeeInvoiceService.java` | Modified | Updated call to use the corrected `findByStudentId` method name |

---

### `transport-service`
**Path:** `transport-service/transport-service/`

| File | Type | Description |
|------|------|-------------|
| `src/main/resources/application.properties` | Modified | Added `server.port=8093`, DB datasource URL, JPA config, `student.service.url=http://localhost:8091` |
| `src/main/java/com/studenthub/transport_service/config/CorsConfig.java` | Created | Same CORS config as above (ports 5173–5175) |

---

### `notification-service`
**Path:** `notification-service/notification-service/notification-service/`

| File | Type | Description |
|------|------|-------------|
| `src/main/resources/application.properties` | Modified | Added `server.port=8094`, DB datasource URL, JPA config. **Important:** dialect set to `org.hibernate.dialect.MySQLDialect` (NOT `MySQL8Dialect` — that class was removed in Hibernate 7.x bundled with Spring Boot 4.0.3 which this service uses) |
| `src/main/java/com/studenthub/notification_service/config/CorsConfig.java` | Created | Same CORS config as above (ports 5173–5175) |

---

### Workspace root (no repo)

| File | Type | Description |
|------|------|-------------|
| `schema.sql` | Created | Full `CREATE TABLE` SQL derived from the official PDF schema (`TS-SQL Schema for School Hub Data Model`). Includes all tables with foreign keys and ENUM types. Not applied automatically — run manually against `school_hub` database if needed. |
| `demo_students.csv` | Created | 15-row sample CSV in the exact format expected by `POST /api/students/bulk`. Use to test bulk upload in admin portal. |

---

---

## Session: Apr 10, 2026 — Bug Fixes

### `payment-service`
**Path:** `payment-service/payment-service/`
**Approved by:** Developer (implicit — fix requested via screenshot)

| File | Type | Description |
|------|------|-------------|
| `src/main/java/com/studenthub/payment_service/config/WebClientConfig.java` | Modified | Changed hardcoded `baseUrl("http://student-info-service")` (Kubernetes DNS name) to `@Value("${student.service.url:http://localhost:8091}")` so it reads from `application.properties` in local dev instead of failing DNS resolution |
| `src/main/java/com/studenthub/payment_service/data/model/FeeStructure.java` | Modified | Added `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` — fixes Jackson serialization crash when `FeeInvoice` lazy-loads this entity and the response is serialised to JSON |
| `src/main/java/com/studenthub/payment_service/data/model/DiscountPolicy.java` | Modified | Same `@JsonIgnoreProperties` fix — `FeeInvoice` also has a lazy `@ManyToOne` to `DiscountPolicy` which would hit the same crash |

---

## Session: Apr 17, 2026 — Make vehicle optional in transport assignments

### `transport-service`
**Path:** `transport-service/transport-service/`
**Approved by:** Developer (explicit — "Okay do the change")

| File | Type | Description |
|------|------|-------------|
| `src/main/java/com/studenthub/transport_service/data/model/StudentTransportAssignment.java` | Modified | Changed `@JoinColumn(name = "vehicle_id", nullable = false)` → `nullable = true` so a transport assignment can be saved without a vehicle. Allows CSV bulk upload and individual enrollment without requiring a bus to be pre-assigned. |
| `src/main/java/com/studenthub/transport_service/controller/StudentTransportAssignmentController.java` | Modified | Changed `@RequestParam Long vehicleId` → `@RequestParam(required = false) Long vehicleId` on the `POST /api/transport-assignments` endpoint so the parameter is not required in the request URL. |
| `src/main/java/com/studenthub/transport_service/service/StudentTransportAssignmentService.java` | Modified | Wrapped vehicle lookup in a null check — if `vehicleId` is null, vehicle is left unset on the assignment instead of throwing an exception. Route is still mandatory. |

---

## Session: Apr 17, 2026 — Parent portal phone lookup endpoint

### `student-info-service`
**Path:** `student-info-service/student-info-service/`
**Approved by:** Developer (implicit — part of "connect parent portal end-to-end" request)

| File | Type | Description |
|------|------|-------------|
| `src/main/java/com/studenthub/student_info_service/data/model/Guardian.java` | Modified | Changed `FetchType.LAZY` → `FetchType.EAGER` on `student` field so the full student object is included when Guardian records are serialized (needed for phone lookup response to include child data) |
| `src/main/java/com/studenthub/student_info_service/data/repository/GuardianRepository.java` | Modified | Added `List<Guardian> findByPhone(String phone)` — Spring Data derived query that looks up all guardian records matching a phone number |
| `src/main/java/com/studenthub/student_info_service/service/GuardianService.java` | Modified | Added `getGuardiansByPhone(String phone)` method delegating to the new repository method |
| `src/main/java/com/studenthub/student_info_service/controllers/GuardianController.java` | Modified | Added `GET /api/guardians/phone/{phone}` endpoint returning `List<Guardian>` (each with embedded student) — used by parent portal login to verify phone and fetch children |

**Rationale:** Parent portal login flow requires looking up which children (students) belong to a given phone number. The guardian table links phones to students. This endpoint returns all guardian records for a phone so the frontend can extract the unique set of children and build the parent session.

---

## Session: Apr 18, 2026 — Fix vehicle serialization (lazy-load proxy crash)

### `transport-service`
**Path:** `transport-service/transport-service/`
**Approved by:** Developer (implicit — "vehicles do not show on the vehicles section even after adding them could you check")

| File | Type | Description |
|------|------|-------------|
| `src/main/java/com/studenthub/transport_service/data/model/Driver.java` | Modified | Added `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` — same fix applied to payment-service in Apr 10 session. Without this, serializing `Vehicle` (which has `@ManyToOne(LAZY)` to `Driver`) causes Jackson to hit the Hibernate proxy and throw, resulting in `GET /api/vehicles` returning empty/500. |
| `src/main/java/com/studenthub/transport_service/data/model/Vehicle.java` | Modified | Same `@JsonIgnoreProperties` fix — `StudentTransportAssignment` has a lazy `@ManyToOne` to `Vehicle`. |
| `src/main/java/com/studenthub/transport_service/data/model/TransportRoute.java` | Modified | Same fix — `StudentTransportAssignment` also lazy-loads `TransportRoute`. |

**Result:** `GET /api/vehicles` now returns all vehicles with their embedded `driver` object; Fleet tab correctly shows all 3 seeded vehicles.

---

## 2026-11-15 — Transport vehicle 500 fix + student bulk-upload endpoint

**Approved by:** developer (requested during end-to-end testing)

### transport-service
**Files:** `data/model/Driver.java`, `TransportRoute.java`, `Vehicle.java`, `TripSession.java`
**Change:** added `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` (same fix previously applied in payment-service).
**Reason:** `POST/GET /api/vehicles` returned HTTP 500. The vehicle was saved, but Jackson failed serialising the lazy `Vehicle.driver` Hibernate proxy (`No serializer found for class ...ByteBuddyInterceptor`). The same latent bug affected every entity returning these as lazy references.

### student-info-service
**Files:** new `dto/BulkUploadResponse.java`; `service/StudentService.java` (`bulkCreate()`); `controllers/StudentController.java` (`POST /api/students/bulk`).
**Reason:** Admin > Students > Bulk Upload > "Enroll N Students" returned 405 because the endpoint did not exist in the running service.
**Behaviour:** body = JSON array of students; each row saved independently; rows with an existing or repeated `admissionNumber` are skipped. Response: `{saved, skipped, students[], skippedAdmissionNumbers[]}`.

**Action needed:** restart transport-service and student-info-service to pick up the changes.

---

## 2026-11-21 → 2026-11-25 — Admin-role bug fixes (BUGS-BY-ROLE.md, section 1)

**Approved by:** developer (pallasuhaas) — each fix requested explicitly, bug by bug, from `BUGS-BY-ROLE.md`
**Branches / PRs:** BUG-003 (PR #2), BUG-004/005/013 (PR #3), the rest on `bug-5`

### payment-service
| Bug | Files | Change |
|-----|-------|--------|
| BUG-003 | `config/WebClientConfig.java` | `baseUrl` now read from `student.service.url` (default `http://localhost:8091`) instead of the hardcoded Kubernetes name `http://student-info-service`. The Apr 10 entry above described this fix, but the code in the repo still had the hardcoded URL. |
| BUG-005 | `data/model/FeeInvoice.java` | Added `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` (`PaymentTransaction.invoice` is a lazy proxy). Also re-applied to `FeeStructure.java` and `DiscountPolicy.java`. |
| BUG-013 | `data/model/FeeType.java` | Added `REGISTRATION, BOOKS, UNIFORM, FOOD, ANNUAL_DAY` (the Admin UI already offered them). |
| BUG-012 | `service/FeeInvoiceService.java` | `create()` now computes the discount. **Convention:** gross = `feeStructure.amount`, `discountApplied` = rupees taken off, `totalAmount` = net payable. The discount applies only when `invoiceDate` is within the policy's `validFrom..validTo` (inclusive). A missing `invoiceDate` defaults to today. |

### student-info-service
| Bug | Files | Change |
|-----|-------|--------|
| BUG-004 | `data/model/Student.java` | Added `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})`. |
| BUG-021 | `data/model/StudentStatus.java`, `data/repository/StudentRepository.java`, `service/StudentService.java`, `controllers/StudentController.java` | Added `ARCHIVED`; `PATCH /api/students/{id}/status?status=` and `GET /api/students/archived`. |

### transport-service
| Bug | Files | Change |
|-----|-------|--------|
| BUG-014 | `data/model/TransportRoute.java`, `controller/TransportRouteController.java`, `service/TransportRouteService.java` | Route has an optional lazy `vehicle` (`vehicle_id` FK). `POST`/`PUT /api/transport-routes` accept `?vehicleId=`; unknown id → error, omitted on PUT → vehicle kept. |

### notification-service
| Bug | Files | Change |
|-----|-------|--------|
| BUG-018a | `NotificationController.java`, `NotificationService.java`, `data/model/Notification.java`, `data/model/TriggerType.java`, new `dto/BroadcastRequest.java` | `POST /api/notifications/broadcast` `{studentIds, triggerType, title, message}` → one SENT notification per distinct student (recipient PARENT). Added nullable `title` column and trigger types `GENERAL, FEE_REMINDER, FEE_OVERDUE, PAYMENT_CONFIRMED`. 400 on empty list / blank or >500-char message. |
| BUG-018b | new `ChatThread`, `ChatMessage`, `ChatDepartment`, `ThreadStatus`, `SenderType`, repositories, `ChatService`, `ChatController`, `dto/NewThreadRequest`, `dto/NewMessageRequest` | `GET /api/chat`, `GET /api/chat/student/{id}`, `POST /api/chat` (admin create), `POST /api/chat/student/{id}` (parent get-or-create by department; body or query params), `GET`/`POST /api/chat/{threadId}/messages`, `PATCH /api/chat/{threadId}/read-admin` and `/read-parent`. Sending bumps `lastMessageAt` and the other side's unread count. |
| BUG-018c | new `SupportTicket`, `TicketReply`, `TicketStatus`, repositories, `SupportTicketService`, `SupportTicketController`, `dto/NewTicketRequest` | `GET /api/tickets`, `GET /api/tickets/{id}`, `GET /api/tickets/student/{id}`, `POST /api/tickets`, `POST /api/tickets/student/{id}` (parent), `GET`/`POST /api/tickets/{id}/replies`, `PATCH /api/tickets/{id}/status?status=`, `DELETE /api/tickets/{id}` (also deletes replies). First admin reply moves OPEN → IN_PROGRESS; reply on CLOSED → 409. Unknown ids → 404. |

### Database changes (applied automatically by `ddl-auto=update` on restart)
* `student.status` enum gains `ARCHIVED`; `fee_structure.fee_type` enum gains the 5 new types.
* `transport_route.vehicle_id` (nullable FK → `vehicle`).
* `notification.title` (varchar 200); `notification.trigger_type` enum gains 4 values.
* New tables: `chat_thread`, `chat_message`, `support_ticket`, `ticket_reply`.
* Environments that do **not** run with `ddl-auto=update` need these applied manually.

**Action needed:** restart all four services.

**Not done (deferred):** BUG-020b — `/api/academic-years` and terms API in payment-service.

---

## 2026-11-25 — Platform bugs (BUGS-BY-ROLE.md, section 4): 011, 006, 009, 007, 008b, 010

**Approved by:** developer (pallasuhaas) — "yes do it" to the proposed fixes, including the BUG-010 rule
(block deletes with 409, soft-delete students)

### All four services
| Bug | Files | Change |
|-----|-------|--------|
| BUG-011 | new `config/CorsConfig.java` | `/api/**` allows origins from `app.cors.allowed-origins` (default `http://localhost:5173,5174,5175`), methods GET/POST/PUT/PATCH/DELETE/OPTIONS. The CorsConfig files described in the Apr 9 entry were not in the repo. **Production:** set `app.cors.allowed-origins` to the real portal URLs. Write requests from any other origin get 403. |
| BUG-006 | new `exception/ResourceNotFoundException.java`, new `exception/GlobalExceptionHandler.java`, every `service/*Service.java` | "not found" throws `ResourceNotFoundException` → **404**. Handler returns `{timestamp, status, error, message, path}` for all errors. It also maps bad id/enum, missing `?param` and unreadable JSON → 400, and `ResponseStatusException` → its own status and reason. Deleting an unknown id → 404 (was a silent 200). |
| BUG-009 | handler + `StudentService`, `UserAccountService`, `VehicleService`, `DriverService` | DB unique violation → **409** "A record with 'X' already exists.". Explicit pre-checks with clearer messages for admission number, username, vehicle registration and driver licence (values trimmed; driver name/licence/contact trimmed on save). |
| BUG-007 | each `pom.xml` (+ `spring-boot-starter-validation`), entity request bodies, every controller (`@Valid @RequestBody`), handler | Bean Validation on client-supplied fields only (relations taken from the URL are not annotated). Missing/blank required field → **400** naming the field. A PUT missing required fields is rejected instead of nulling columns. Server-managed `Student.status` and `Notification.status/sentAt` are kept when omitted. NOT NULL / too-long DB errors → 400. |
| BUG-008b | same entities + `DiscountPolicyService`, `EnrollmentService`, `TripSessionService`, `StudentTransportAssignmentService`, `GuardianService` | Ranges: fee amount > 0, discount 0–100 %, capacity ≥ 1, distance/time ≥ 0, lat ±90 / lng ±180, snapshot scores 0–100, `@Email`, DOB in the past, admission date not in the future, stop order ≥ 1. Cross-field: validTo ≥ validFrom, endDate ≥ startDate, endTime > startTime, effectiveTo ≥ effectiveFrom. Guardian phone stored as digits only and must be 10 digits when given. |

### BUG-010 — deleting records that others depend on
| Service | Rule |
|---------|------|
| payment | Fee structure / discount used by invoices, invoice with payment transactions → **409** "X is still used by N …". |
| transport | Driver with vehicles; vehicle with routes/assignments/trips/tracking; route with assignments/trips; trip with student trip statuses → **409**. A route's **stops are deleted with the route** (they belong to it). |
| student-info | **Soft delete.** `DELETE /api/students/{id}` on an active student → status `ARCHIVED` (response `{"result":"ARCHIVED"}`). On an already-archived student → removed for good with its guardians, addresses, contact info, enrollments, snapshots and user account. This only happens when payment/transport/notification hold no records for it (new `client/CrossServiceRecords.java`). Otherwise **409** listing what remains. If a service can't be reached → **503**, nothing deleted. New properties `payment.service.url`, `transport.service.url`, `notification.service.url`. |

### payment-service extra
* `client/StudentClient.java`: student-info 404 → "Student not found" 404. student-info unreachable → **503** (was 500).

### Frontend (admin)
* Bulk-bar success messages (Students, Finance) moved outside the bar so they are visible after the selection clears.
* "🗑 Delete All" → "🗄 Archive All" (active students only, restorable). The Archived tab's "Delete Permanently" shows the server's reason when refused.

**Action needed:** restart all four services. Hibernate may add unique constraints on existing columns at startup. If existing data has duplicate driver licences, clean them first.

---

## 2026-11-26 — Parent-role bugs (BUGS-BY-ROLE.md, section 2): 017, 015, 018d

**Approved by:** developer (pallasuhaas) — requested explicitly ("do these bug fixes and test it end to end")
**Branch:** `bug6-parent`

### student-info-service — BUG-017 (parent login by phone)
| File | Change |
|------|--------|
| `data/repository/GuardianRepository.java` | Added `List<Guardian> findByPhone(String phone)`. |
| `service/GuardianService.java` | Added `getGuardiansByPhone(phone)`. The input is normalised the same way phones are stored (digits only, a leading `91` dropped from 12-digit input), so "98450 01122", "98450-01122" and "+91 9845001122" all match. Empty or non-numeric input → `[]`. |
| `controllers/GuardianController.java` | Added `GET /api/guardians/phone/{phone}` → list of guardians, each with the nested `student`. Empty list = no account. |
| `data/model/Guardian.java` | `student` changed from `FetchType.LAZY` to `EAGER` so the child's details are always serialised. |

Note: guardian phones saved **before** BUG-008b with spaces or `+91` won't match until they are re-saved (saving now stores plain digits).

### notification-service — BUG-018d (read flag)
| File | Change |
|------|--------|
| `data/model/Notification.java` | Added `Boolean isRead` (column `is_read`, `@Builder.Default false`). Kept as `Boolean` so the JSON field is `isRead`. Existing rows are NULL, which the parent UI treats as unread. |
| `service/NotificationService.java` | `create()` sets `isRead=false`; added `markRead(id)` and `markAllRead(studentId)`. |
| `controller/NotificationController.java` | Added `PATCH /api/notifications/{id}/read` (404 for unknown id) and `PATCH /api/notifications/student/{studentId}/read-all`. |

### Frontend (parent portal)
* BUG-017: `api/parent.js` keeps the HTTP status on errors. `LoginPage.jsx` now shows "Something went wrong on our side…" for a server error and "Unable to reach server…" only when there's no connection.
* BUG-015: `getRouteStops` uses `/api/route-stops/route/{routeId}`.

**Database:** `notification.is_read` (bit, nullable) is added by `ddl-auto=update` on restart.
**Action needed:** restart student-info-service and notification-service.

---

## Future Change Requests

All future changes to any backend repo must be logged here with:
- Date
- Repo name
- Files changed
- Reason for change
- Who approved it
