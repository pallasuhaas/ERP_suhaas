# Vidyaverse — bugs by role (one branch per bug)

Source: test run of 2026-11-15 (`Vidyaverse_Test_Results.xlsx`, sheet **Bug Log**; filter the `Bug ID` column on any test sheet to get every failing test for a bug).

## Before you start

```bash
cd D:\projects\vidyaverse          # ONE git repo: frontend + 4 services live inside it
git checkout main && git pull      # local main is behind origin/main (PR #1 already merged there)
git checkout -b fix/BUG-003-payment-student-client-url   # example: one branch per bug, from main
```

* BUG-001 (bulk upload endpoint) and BUG-002 (vehicle JSON error) are already fixed and merged to `origin/main` via PR #1 — just re-test them after pulling.
* After changing a Spring Boot service, restart it. After changing the frontend, Vite hot-reloads.
* Project rule (AI-CONTEXT.md): log every backend change in `frontend-main/frontend-main/backend-changed.md`.
* Paths below are relative to the repo root. Abbreviations:
  * `FE-ADMIN` = `frontend-main/frontend-main/school-hub-frontend/admin/src`
  * `FE-PARENT` = `frontend-main/frontend-main/school-hub-frontend/webapp/src`
  * `FE-MGMT`  = `frontend-main/frontend-main/school-hub-frontend/management/src`
  * `SIS` = `student-info-service-main/student-info-service-main/student-info-service/src/main/java/com/studenthub/student_info_service`
  * `PAY` = `payment-service-main/payment-service-main/payment-service/src/main/java/com/studenthub/payment_service`
  * `TRN` = `transport-service-main/transport-service-main/transport-service/src/main/java/com/studenthub/transport_service`
  * `NTF` = `notification-service-main/notification-service-main/notification-service/notification-service/src/main/java/com/studenthub/notification_service`
* "Confirmed" = I saw the actual error in a log or network trace. "Likely" = inferred from code, check the log first.

## Suggested order (unblocks the most tests first)

1. BUG-003 payment hostname → 2. BUG-004 + BUG-005 lazy-proxy JSON → 3. BUG-017 parent phone lookup → 4. BUG-006/007/009/010 global error handling → 5. the rest by role.

---

# 1. ADMIN role (Admin portal, port 5174)

## BUG-003 — No invoice can be created  ·  Critical
* **Branch:** `fix/BUG-003-payment-student-client-url`
* **Repo area:** payment-service
* **Files:** `PAY/config/WebClientConfig.java`
* **Symptom:** Admin > Students > bulk "Assign Fee", Finance > custom invoice, every `POST /api/fee-invoices` → HTTP 500. Dashboard "Fee Collected/Outstanding" can never move. Blocks parent fee screens and all payment E2E flows.
* **Root cause (confirmed, log):** `WebClientRequestException … DnsErrorCauseException: Query failed with NXDOMAIN`. `WebClientConfig` hardcodes `.baseUrl("http://student-info-service")` (a Kubernetes DNS name). `application.properties` already has `student.service.url=http://localhost:8091` but nothing reads it. (AI-CONTEXT.md claims this was fixed; the code in the repo is not.)
* **Fix:** inject the property:
  ```java
  @Bean
  public WebClient studentServiceWebClient(@Value("${student.service.url:http://localhost:8091}") String url) {
      return WebClient.builder().baseUrl(url).build();
  }
  ```
* **Also consider:** `StudentClient.getStudentById` should turn a 404 from student-info into a clean 404/400 for the caller (see BUG-006).
* **Verify:** `API-X-001`, `API-X-002`, `UI-ADM-055`, `UI-ADM-074`…`082`, `UI-PAR-013`, `E2E-001`, `E2E-009`.

## BUG-004 — Guardian / enrollment / address / contact / snapshot / user-account reads return 500  ·  High
* **Branch:** `fix/BUG-004-student-info-lazy-proxy-json`
* **Repo area:** student-info-service
* **Files:** `SIS/data/model/Student.java`
* **Symptom:** `GET /api/guardians/student/{id}` (and `/api/guardians/{id}`, enrollments, addresses, contact-info, snapshots, user-accounts) → 500. In the Admin edit form the guardian fields stay blank (`UI-ADM-040`) because the guardians cannot be loaded. POST works, GET fails.
* **Root cause (confirmed, log):** `No serializer found for class org.hibernate.proxy.pojo.bytebuddy.ByteBuddyInterceptor` — the child entities reference `Student` with `FetchType.LAZY`, Jackson cannot serialise the Hibernate proxy. Same bug as BUG-002 (already fixed in transport).
* **Fix:** add `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` on `Student` (the proxied class). A more robust option is a response DTO instead of returning entities.
* **Verify:** `API-GRD-*`, `API-ENR-*`, `API-ADR-*`, `API-CNT-*`, `API-SNP-*`, `API-USR-*` (all the "Get by id (exists)", "Update (valid)", "List by student" cases), `UI-ADM-038..040`.

## BUG-005 — Payment transaction create/read returns 500 (row IS saved)  ·  High
* **Branch:** `fix/BUG-005-payment-lazy-proxy-json`
* **Repo area:** payment-service
* **Files:** `PAY/data/model/FeeInvoice.java` (and `PaymentTransaction.java` if it is returned with lazy refs)
* **Symptom:** `POST /api/payment-transactions?invoiceId=…` → 500 although the transaction is stored; `GET` of payment-transactions/invoices that have transactions → 500. Admin "Mark paid" and every receipt flow depend on this.
* **Root cause (confirmed, log):** same `ByteBuddyInterceptor` error. Only `FeeStructure` and `DiscountPolicy` got the annotation in the earlier payment fix; `FeeInvoice` (the lazy target of `PaymentTransaction.invoice`) did not.
* **Fix:** add `@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})` to `FeeInvoice`.
* **Verify:** `API-PTX-*`, `API-X-006`, `API-X-007`, `API-INV-*` list/get cases, `E2E-009`.
* **Do after BUG-003** (you cannot test it without invoices).

## BUG-012 — Discount percentage is not applied to invoices  ·  Medium
* **Branch:** `fix/BUG-012-invoice-discount-calculation`
* **Files:** `PAY/service/FeeInvoiceService.java` (+ `FeeInvoice.java`)
* **Symptom:** invoice with a 10% discount policy: `discountApplied` stays 0 (value is stored as sent). Expected 2500 on a 25000 fee.
* **Root cause (likely):** the service loads the discount policy but never computes the amount. Read `createInvoice` first.
* **Decision needed from you:** is `totalAmount` the gross or the net amount? Document it, then compute `discountApplied = amount × pct/100` (round to 2 dp) and set `totalAmount` accordingly.
* **Verify:** `API-X-005`, `API-INV-*` "discountId optional".

## BUG-013 — Admin UI offers fee types the backend rejects  ·  High
* **Branch:** `fix/BUG-013-fee-type-enum-mismatch`
* **Files:** `PAY/data/model/FeeType.java` (+ the Admin list in `FE-ADMIN/pages/Finance.jsx` lines ~18-26)
* **Symptom:** Finance > Fee Structures > Create with Registration / Books / Uniform / Food / Annual Day → HTTP 400 (`UI-ADM-090`).
* **Root cause (confirmed):** backend enum has only TUITION, TRANSPORT, LAB, OTHER; UI offers 9 types.
* **Fix:** add REGISTRATION, BOOKS, UNIFORM, FOOD, ANNUAL_DAY to `FeeType` (column is stored as string, `ddl-auto=update` is enough). Alternatively trim the UI list — your call.
* **Verify:** `API-FST-*` "feeType" rule case, `UI-ADM-090`.

## BUG-018a — Broadcast notification does not work  ·  High
* **Branch:** `feat/BUG-018a-notification-broadcast`
* **Files:** `NTF/controller/NotificationController.java`, `NTF/service/NotificationService.java`, call to student-info for the recipient list
* **Symptom:** Admin > Communication > Send Notification → `POST /api/notifications/broadcast` → 405 (`UI-ADM-132`).
* **Contract the UI expects:** read `FE-ADMIN/api/communications.js` (`broadcastNotification(data)`) and the form in `pages/Communication.jsx` (`handleBroadcast`): audience = all / grade / student. The service must fan out to the matching students (call student-info) and create one `Notification` per recipient.
* **Verify:** `UI-ADM-132`, `E2E-004`, and the parent Alerts screen shows the message (`UI-PAR-033`).

## BUG-018b — Admin Messages (chat) has no backend  ·  High
* **Branch:** `feat/BUG-018b-chat-threads-messages`
* **Files:** new entities `ChatThread`, `ChatMessage` + repository/service/controller in `NTF/`
* **Symptom:** Admin > Communication > Messages and Parent > Chat → `GET /api/chat…` → 404 (`UI-ADM-139`, `UI-PAR-039`).
* **Endpoints the frontends call (see `FE-ADMIN/api/communications.js` and `FE-PARENT/api/comms.js`):**
  `GET /api/chat` · `GET /api/chat/student/{studentId}` · `POST /api/chat/student/{studentId}?department=&subject=` (get-or-create thread) · `GET /api/chat/{threadId}/messages` · `POST /api/chat/{threadId}/messages` · `PATCH /api/chat/{threadId}/read-admin` · `PATCH /api/chat/{threadId}/read-parent`.
* **Verify:** `UI-ADM-139`, `UI-PAR-038..044`, `E2E-006`.

## BUG-018c — Support tickets have no backend  ·  High
* **Branch:** `feat/BUG-018c-support-tickets`
* **Files:** new entities `Ticket`, `TicketReply` + repository/service/controller in `NTF/`
* **Symptom:** Admin > Support Tickets and Parent > Help → `GET /api/tickets…` → 404 (`UI-ADM-143`, `UI-PAR-045..049`).
* **Endpoints:** `GET /api/tickets` · `GET /api/tickets/student/{id}` · `POST /api/tickets/student/{id}` · `GET /api/tickets/{id}/replies` · `POST /api/tickets/{id}/replies` · `PATCH /api/tickets/{id}/status?status=OPEN|IN_PROGRESS|RESOLVED|CLOSED` · `DELETE /api/tickets/{id}`. The UI statuses are in `FE-ADMIN/pages/Communication.jsx` (STATUS map).
* **Also fixes:** Admin dashboard "Open Tickets" card (currently hard-coded "—").
* **Verify:** `UI-ADM-143`, `UI-PAR-045..049`, `E2E-005`.

## BUG-019 — Transport CSV upload fails for every row  ·  High
* **Branch:** `fix/BUG-019-transport-csv-vehicle-id`
* **Files:** `FE-ADMIN/pages/Transport.jsx` (`handleUpload`, ~line 1241), `FE-ADMIN/api/transport.js`; backend `TRN/controller/StudentTransportAssignmentController.java`
* **Symptom:** Transport > Student Enrollment > Upload CSV > "Assign 1 Student" → "0 Students Assigned! 1 failed" (`UI-ADM-127`).
* **Root cause (confirmed, network trace):** request is `POST /api/transport-assignments?studentId=48&routeId=1` — no `vehicleId`. The controller requires it and the DB column `vehicle_id` is `nullable = false`. The CSV has a `vehicle_registration` column that is validated in the preview but never mapped to an id.
* **Fix:** map `vehicle_registration` → `vehicleId` in the upload code (same way route_name is mapped) and add it to the query string. The Individual form labels Vehicle "(optional)" — also make it required (or make the DB column nullable); otherwise the Individual form has the same 400 when left blank.
* **Verify:** `UI-ADM-127`, `UI-ADM-122` (still passes), `E2E-002`.

## BUG-022 — Bulk "Assign Route" from Students fails with 500 for every student  ·  High
* **Branch:** `fix/BUG-022-bulk-assign-route-pickup-drop`
* **Files:** `FE-ADMIN/pages/Students.jsx` → `handleBulkAssignRoute` (line ~272)
* **Symptom:** select students → Assign Route → red raw JSON error, no assignment created (`UI-ADM-058`).
* **Root cause (confirmed request / likely exception):** the body sent is only `{effectiveFrom, effectiveTo:null}`. `StudentTransportAssignment.pickupPoint` and `dropPoint` are `nullable=false`, so the insert fails. Individual assignment works because it sends both points.
* **Fix:** let the admin pick a stop (or default to the route's first/last stop names) and send `pickupPoint` / `dropPoint`. Also validate in the backend and return 400 (BUG-007).
* **Verify:** `UI-ADM-058`, `UI-ADM-122`.

## BUG-020 — Academic Years tab crashes the whole Admin app  ·  High
* **Branch (two parts, keep separate):** `fix/BUG-020-finance-years-crash` (frontend) and `feat/BUG-020b-academic-years-api` (payment-service)
* **Files:** `FE-ADMIN/pages/Finance.jsx` (~line 384 `getAcademicYears().then(setYears)`; the years/terms tab render), `FE-ADMIN/api/finance.js`; backend: new `AcademicYear` + `FeeTerm` entities/controller in `PAY/`
* **Symptom:** click Finance > Academic Years → blank white page; console: `Cannot read properties of null (reading 'length')` in `Finance.jsx` (`UI-ADM-095`, screenshot `test-evidence/finance-academic-years-crash.png`).
* **Root cause (confirmed):** `/api/academic-years` returns 404; the request helper returns `null` for it and the component calls `.length` on null.
* **Fix part 1 (frontend, do first):** default `years` to `[]` when the response is not an array; add an error boundary so one tab can never blank the app.
* **Fix part 2 (backend):** implement `GET/POST/PUT/DELETE /api/academic-years` and `/api/academic-years/{id}/terms`, `/api/academic-years/terms/{termId}` (see `FE-ADMIN/api/finance.js` lines 46-55 for the exact contract).
* **Verify:** `UI-ADM-095..100` (Academic Years & Terms).

## BUG-021 — Archive / restore students does not work  ·  High
* **Branch:** `feat/BUG-021-student-archive-restore`
* **Files:** `SIS/data/model/StudentStatus.java`, `SIS/controllers/StudentController.java`, `SIS/service/StudentService.java`, `SIS/data/repository/StudentRepository.java`
* **Symptom:** Archive / Archive Selected → nothing happens (`PATCH /api/students/{id}/status` → 404); Archived tab shows `GET /api/students/archived` → 400 (`UI-ADM-048/050/054`).
* **Root cause (confirmed):** endpoints missing; `StudentStatus` has no `ARCHIVED` (only ACTIVE, INACTIVE, TRANSFERRED); `archived` is parsed as the `{id}` path variable → 400.
* **Fix:** add `ARCHIVED`; add `PATCH /api/students/{id}/status?status=`; add `GET /api/students/archived` (declare it so it is not captured by `/{id}`); decide whether `GET /api/students` should hide archived students (the dashboard count excludes them).
* **Verify:** `UI-ADM-048..051`, `UI-ADM-054`, `E2E-007`, and the Dashboard student count.

## BUG-008 (admin-facing part) — Forms accept invalid data  ·  Medium
* **Branch:** `fix/BUG-008a-admin-form-validation` (frontend) — backend part is under "Platform" below
* **Files:** `FE-ADMIN/pages/Students.jsx` (add form `handleSaveStudent` ~309, edit form `handleSaveEdit` ~388)
* **Symptoms (all confirmed):** DOB 2099-01-01 saved (`UI-ADM-026`); parent phone `12345` saved (`UI-ADM-027`); editing a student and blanking the first name **saves an empty first name** (`UI-ADM-047`).
* **Fix:** require non-blank first/last name on edit; DOB not in the future; 10-digit phone (+ optional 6-9 start).

## BUG-016 — Raw server JSON shown to users  ·  Low
* **Branch:** `fix/BUG-016-friendly-error-messages`
* **Files:** error handling in `FE-ADMIN/api/*.js` (`req()` helpers) and the pages that display `e.message` (Transport vehicle form, Students bulk bars)
* **Symptom:** banner shows `⚠ {"timestamp":"2026-11-15T…","status":500,"error":"Internal Server Error",…}` (`UI-ADM-103`, `UI-ADM-055/058`).
* **Fix:** parse the response, show `message` or a friendly text by status code.

## BUG-023 — CSV parser breaks quoted commas  ·  Low
* **Branch:** `fix/BUG-023-csv-quoted-fields`
* **Files:** `FE-ADMIN/api/students.js` → `parseCSV` (line ~68). It does `line.split(',')`, then strips quotes.
* **Symptom:** `"Rao, Suresh"` becomes `"Rao` and `Suresh"` and the columns shift (`UI-ADM-069`).
* **Fix:** use a real CSV parser (e.g. `papaparse`) or write a small state machine that honours quotes; handle BOM and CRLF.

## BUG-014 — Route form vehicle is silently ignored  ·  Low
* **Branch:** `fix/BUG-014-route-vehicle-link`
* **Files:** `FE-ADMIN/api/transport.js` (`createRoute(data, vehicleId)` appends `?vehicleId=`), `TRN/controller/TransportRouteController.java`
* **Symptom:** the vehicle chosen in the route form is not stored (`API-RTE-*` note case).
* **Fix:** decide the model — either store `vehicle` on the route, or remove the field from the form (a route↔vehicle link already exists through assignments/trips).

---

# 2. PARENT role (Parent portal, port 5173)

## BUG-017 — No parent can log in  ·  Critical
* **Branch:** `fix/BUG-017-guardian-phone-lookup`
* **Repo area:** student-info-service + small frontend change
* **Files:** `SIS/controllers/GuardianController.java`, `SIS/service/GuardianService.java`, `SIS/data/repository/GuardianRepository.java`; frontend `FE-PARENT/components/LoginPage.jsx`
* **Symptom:** enter a registered number (e.g. 9845001122, Priya Sharma) → "Unable to reach server. Check your connection and try again." Same message for an unregistered number (`UI-PAR-001`, `UI-PAR-002`).
* **Root cause (confirmed):** the portal calls `GET /api/guardians/phone/{phone}` (`FE-PARENT/api/parent.js`) → 404 — the endpoint does not exist.
* **Fix backend:** add `GET /api/guardians/phone/{phone}` returning the list of guardians with their nested `student` (this call is the only thing that identifies the parent's children). Add `findByPhone` to the repository. **This depends on BUG-004** (the nested lazy `student` must serialise).
* **Fix frontend:** distinguish an empty list ("No account found for this number") from a network error ("Unable to reach server"); today every failure shows the network message.
* **Security note (separate ticket later):** OTP is a UI shell and any 6 digits log in; the lookup is unauthenticated. Real OTP + JWT are Phase 2 in AI-CONTEXT.md.
* **Verify:** `UI-PAR-001..011` run for real (no stub), `E2E-001`, `E2E-008`.

## BUG-015 — Bus tab never shows the stops  ·  High
* **Branch:** `fix/BUG-015-parent-route-stops-url`
* **Files:** `FE-PARENT/api/parent.js` → `getRouteStops` (calls `/api/route-stops?routeId=`); alternatively `TRN/controller/RouteStopController.java`
* **Symptom:** child with an assigned route sees the route but no stop timeline (`UI-PAR-028`, `test-evidence/parent-transport-stops.png`).
* **Root cause (confirmed):** backend only has `GET /api/route-stops/route/{routeId}` (returns stops ordered by sequence); the portal uses a query-string URL that returns 404.
* **Fix:** change the frontend call to `/api/route-stops/route/${routeId}` (simplest), or add the query-param alias in the controller.
* **Verify:** `UI-PAR-028`, `E2E-002`.

## BUG-018d — Parent Alerts "mark read", Chat and Help
* **Branch:** `feat/BUG-018d-notification-read-status`
* **Files:** `NTF/data/model/Notification.java` (add a read flag/timestamp), `NotificationController.java`, `NotificationService.java`
* **Symptom:** Alerts > tap item / Mark all read → `PATCH /api/notifications/{id}/read` and `/student/{id}/read-all` → 404 (`UI-PAR-035`).
* **Fix:** add `readAt` (or `isRead`), the two PATCH endpoints, and return the flag so the unread orange border can work.
* **Chat and Help for parents** are solved by BUG-018b / BUG-018c — nothing extra to do in the Parent portal, only re-test `UI-PAR-038..050`.

## Depends on Admin-section bugs
* BUG-003 / BUG-005 → parent Fees, History & Receipts, Dashboard fee card (`UI-PAR-013`, `020..027`).
* BUG-004 → the guardian lookup response in BUG-017.

---

# 3. MANAGEMENT role (Management portal, port 5175)

## BUG-024 — Portal says "Live data from API" but makes no API calls  ·  Low
* **Branch:** `fix/BUG-024-management-live-data-label`
* **Files:** `FE-MGMT/components/MgmtHeader.jsx` (the "⚡ Live data from API" badge), `FE-MGMT/pages/*.jsx`
* **Symptom:** every KPI shows `—`; Network tab shows zero `/api/` requests (`UI-MGT-004`).
* **Fix (small):** change the badge to "Data not connected yet" until the pages are wired.
* **Follow-up (feature, not a bug):** wire the dashboard KPIs to the existing endpoints (students, fee invoices, vehicles/routes); each analytics tab names its future endpoint in its empty state.

*No other Management defects were found: login validation, all sub-tabs and navigation passed (`UI-MGT-001..017`). The 7 "Not Run" cases there are mostly chart/report details.*

---

# 4. PLATFORM / ALL ROLES (backend quality, affects every portal)

Do these as small, independent PRs per service, or as one shared pattern copied to each service.

## BUG-006 — Not found returns 500 instead of 404  ·  Medium
* **Branch:** `fix/BUG-006-global-exception-handler`
* **Files (each of the 4 services):** new `config/GlobalExceptionHandler.java` (`@RestControllerAdvice`) + a `ResourceNotFoundException`; replace `throw new RuntimeException("… not found …")` in every `*Service.java`
* **Symptom:** `GET /api/students/999999`, PUT and mark-as-sent on missing ids → 500 (about 50 test cases fail on this).
* **Fix:** map not-found → 404, `HttpMessageNotReadableException` → 400, `MethodArgumentTypeMismatchException` → 400, `DataIntegrityViolationException` → 409; return `{timestamp,status,error,message}` with a human message. This one handler also resolves BUG-009 and part of BUG-007/BUG-010 and makes BUG-016 (friendly errors) possible.
* **Verify:** every `*: Get by id (not found)`, `Update (not found)`, `Mark as SENT (not found)` test.

## BUG-007 — Missing or invalid input returns 500 instead of 400  ·  Medium
* **Branch:** `fix/BUG-007-bean-validation`
* **Files:** each `pom.xml` (add `spring-boot-starter-validation`), each entity/DTO (`@NotBlank`, `@NotNull`), each controller (`@Valid @RequestBody`)
* **Symptom:** posting a body without a required field (first name, admission number, amount…), an empty body, or a partial `PUT` → 500 (about 76 test cases). Notification `PUT` without `status` also fails.
* **Fix:** annotate required fields; use separate request DTOs for create/update so a partial update cannot null columns.

## BUG-008 (backend part) — Invalid values are accepted  ·  Medium
* **Branch:** `fix/BUG-008b-backend-range-validation`
* **Symptoms (confirmed by API tests):** negative/zero fee amount, discount % > 100 or < 0, `validTo` before `validFrom`, enrollment end before start, trip end before start, assignment end before start, vehicle capacity ≤ 0, negative route distance/time, invalid email, latitude/longitude out of range, snapshot scores out of range.
* **Fix:** `@Positive`, `@DecimalMin/@DecimalMax`, `@Email`, and small cross-field checks in the service layer.

## BUG-009 — Duplicate unique values return 500  ·  Medium
* **Branch:** `fix/BUG-009-duplicate-conflict-409`
* **Symptom:** duplicate admission number, username, vehicle registration, licence number → 500 (the Admin UI hides it behind "Save failed — admission number may already exist").
* **Fix:** handled by BUG-006's `DataIntegrityViolationException → 409`, plus an explicit pre-check for a clearer message. Add a unique constraint on driver `licenseNumber` (currently not unique; also `trim()` input — the stored driver name/licence from your own data had leading whitespace).

## BUG-010 — Deleting a record that has dependants  ·  Medium
* **Branch:** `fix/BUG-010-delete-dependants`
* **Symptom:** deleting a student with guardians/enrollments, a driver with a vehicle, a vehicle with trips, a route with stops, a fee structure/discount with invoices, an invoice with payments → raw 500 (FK). Deleting a student leaves orphan notifications (and previously assignments/invoices) in other services.
* **Fix:** within a service use `CascadeType`/`orphanRemoval` or return 409 with a message; across services decide the rule (block, soft-delete via the new ARCHIVED status from BUG-021, or call the other services to clean up).

## BUG-011 — CORS preflight returns 403 on every service  ·  Medium
* **Branch:** `fix/BUG-011-cors-config`
* **Files:** new `config/CorsConfig.java` in each service (AI-CONTEXT.md says these exist but none are in the repo)
* **Symptom:** `OPTIONS` from `http://localhost:5173/5174/5175` → 403 on all four services. Today the portals only work because Vite proxies `/api`.
* **Fix:** allow origins 5173/5174/5175 (and make them configurable), methods GET/POST/PUT/PATCH/DELETE/OPTIONS, header `Content-Type`.
* **Verify:** `API-X-010`, `NFR-009`.

---

## Quick map: bug → role → branch

| Bug | Role | Branch |
|---|---|---|
| BUG-003 | Admin (blocks Parent) | `fix/BUG-003-payment-student-client-url` |
| BUG-004 | Admin (blocks Parent login) | `fix/BUG-004-student-info-lazy-proxy-json` |
| BUG-005 | Admin / Parent | `fix/BUG-005-payment-lazy-proxy-json` |
| BUG-012 | Admin | `fix/BUG-012-invoice-discount-calculation` |
| BUG-013 | Admin | `fix/BUG-013-fee-type-enum-mismatch` |
| BUG-018a/b/c | Admin + Parent | `feat/BUG-018a-notification-broadcast`, `feat/BUG-018b-chat-threads-messages`, `feat/BUG-018c-support-tickets` |
| BUG-019 | Admin | `fix/BUG-019-transport-csv-vehicle-id` |
| BUG-022 | Admin | `fix/BUG-022-bulk-assign-route-pickup-drop` |
| BUG-020 | Admin | `fix/BUG-020-finance-years-crash` + `feat/BUG-020b-academic-years-api` |
| BUG-021 | Admin | `feat/BUG-021-student-archive-restore` |
| BUG-008 | Admin + Platform | `fix/BUG-008a-admin-form-validation`, `fix/BUG-008b-backend-range-validation` |
| BUG-016 | Admin | `fix/BUG-016-friendly-error-messages` |
| BUG-023 | Admin | `fix/BUG-023-csv-quoted-fields` |
| BUG-014 | Admin | `fix/BUG-014-route-vehicle-link` |
| BUG-017 | Parent | `fix/BUG-017-guardian-phone-lookup` |
| BUG-015 | Parent | `fix/BUG-015-parent-route-stops-url` |
| BUG-018d | Parent | `feat/BUG-018d-notification-read-status` |
| BUG-024 | Management | `fix/BUG-024-management-live-data-label` |
| BUG-006 | Platform | `fix/BUG-006-global-exception-handler` |
| BUG-007 | Platform | `fix/BUG-007-bean-validation` |
| BUG-009 | Platform | `fix/BUG-009-duplicate-conflict-409` |
| BUG-010 | Platform | `fix/BUG-010-delete-dependants` |
| BUG-011 | Platform | `fix/BUG-011-cors-config` |

## Retest checklist after each fix
1. Restart the changed service.
2. Re-run the test IDs listed under the bug (filter the Bug ID column in `Vidyaverse_Test_Results.xlsx`).
3. Re-run all `Smoke = Y` cases.
4. Update the bug's status in the Bug Log and add a line to `backend-changed.md`.
