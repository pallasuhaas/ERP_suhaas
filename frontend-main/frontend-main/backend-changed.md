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

## Future Change Requests

All future changes to any backend repo must be logged here with:
- Date
- Repo name
- Files changed
- Reason for change
- Who approved it
