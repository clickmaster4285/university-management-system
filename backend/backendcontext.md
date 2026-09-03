# Backend Context

> **Last updated:** 2026-08-31 — model registry, `User.platformRole` single ref, student intake, workforce complete

## API & data principles

Features must be **easy to use, easy to follow, and easy to understand** — backend supports that with predictable APIs and efficient data access.

- **Lean routes** — one resource, clear verbs; nested routes only when scoped (`/subjects/:id/fees`, `/programs/:id/curriculum`)
- **Validate early** — return clear `message` strings the frontend can show in toasts
- **Indexed queries** — compound indexes on filter/sort fields; partial unique indexes where soft-delete applies
- **No redundant round-trips** — populate only fields the UI needs; stats endpoints for KPI rows
- **Versioned / immutable data** — fee history closes old rows instead of overwriting (audit-safe)
- **Efficiency** — `asyncHandler`, parallel `Promise.all` for independent reads, avoid N+1 in list endpoints

## Models Structure

All model files live in `backend/models/` with a `.model.js` suffix. Shared embedded sub-schemas (`address.js`, `academicSettings.js`) also live in `models/`.

**Authoritative export list:** `backend/models/index.js` (49 models). Anything on disk but **not** in `index.js` is orphaned.

```
backend/models/
├── AcademicSession.model.js
├── Admission.model.js              ← legacy intake
├── Assignment.model.js
├── Attendance.model.js
├── Batch.model.js
├── Book.model.js
├── Borrowing.model.js
├── Bus.model.js
├── Campus.model.js
├── Counter.model.js                ← infrastructure (ID sequences)
├── CourseOffering.model.js         ← replaces removed Course model
├── Department.model.js
├── Driver.model.js
├── Employee.model.js               ← legacy HR; prefer StaffMember
├── Enrollment.model.js
├── Event.model.js
├── Exam.model.js
├── Faculty.model.js                ← org unit (not “teacher” person)
├── Fee.model.js                    ← challans / fee records (F5)
├── FeeStructure.model.js           ← legacy; no API
├── Finance.model.js                ← orphan (not used by controllers)
├── Leave.model.js                  ← legacy employee leave
├── Notification.model.js
├── Payroll.model.js                ← staff payroll (dual Employee/StaffMember ref)
├── PermissionAuditLog.model.js     ← NEW Aug 2026
├── PlatformRole.model.js           ← NEW Aug 2026
├── Program.model.js
├── ProgramCurriculum.model.js
├── ProgramSemesterFeeSchedule.model.js
├── Recruitment.model.js
├── Report.model.js
├── RoleAssignment.model.js
├── Route.model.js
├── SemesterRegistration.model.js
├── Settings.model.js
├── StaffAttendance.model.js        ← NEW Aug 2026
├── StaffDocument.model.js          ← NEW Aug 2026
├── StaffLeave.model.js             ← NEW Aug 2026
├── StaffLeaveBalance.model.js      ← NEW Aug 2026
├── StaffMember.model.js            ← NEW Aug 2026 (replaces Employee flow)
├── Student.model.js
├── StudentAdmission.model.js       ← NEW Aug 2026
├── StudentApplication.model.js     ← NEW Aug 2026
├── StudentDocument.model.js        ← NEW Aug 2026
├── Subject.model.js
├── SubjectFeeHistory.model.js
├── University.model.js
├── User.model.js
├── address.js                      ← shared sub-schema
├── academicSettings.js             ← shared sub-schema
└── index.js
```

### Removed models (do not re-add)

| Model | Removed | Replaced by |
|-------|---------|-------------|
| `Course` | Aug 2026 | `Subject` + `ProgramCurriculum` + `CourseOffering` + `Enrollment` |
| `Semester` | Aug 2026 | Program semester number (1–8) on curriculum/offerings |
| `Teacher` | Aug 2026 | `StaffMember` + `CourseOffering.instructorId` |

---

## Model registry (master tracker)

Status legend:

| Status | Meaning |
|--------|---------|
| **Active** | Mounted API routes and/or core runtime path — use for new features |
| **Legacy** | Kept for old DB rows or `/legacy` shim routes — do not use for new features |
| **Orphan** | Exported in `index.js` but no real controller usage, OR file exists without export |
| **Infrastructure** | Internal utility (counters, sub-schemas) |

### Governance & auth

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `University` | Active | `GET/POST/PUT/DELETE /api/universities` | Single-university system |
| `Campus` | Active | `/api/campuses` | Scoped under university |
| `Faculty` | Active | `/api/faculties` | Academic org unit (not a person) |
| `Department` | Active | `/api/departments` | `campusId`, optional `facultyId` |
| `User` | Active | `/api/auth/*` | `role` = legacy JWT bucket; **`platformRole`** = single ref to `PlatformRole` |
| `PlatformRole` | Active **NEW** | `/api/platform-roles` | Role templates + `moduleAccess` |
| `PermissionAuditLog` | Active **NEW** | `/api/platform-roles/audit-logs` | Role/access change audit |
| `Settings` | Active | `/api/settings` | App configuration |
| `Counter` | Infrastructure | ID generators in `utils/generate*.js` | Atomic sequential IDs |

### Academic catalog & operations

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `Program` | Active | `/api/programs` | |
| `Subject` | Active | `/api/subjects` | Replaces `Course` catalog slice |
| `ProgramCurriculum` | Active | `/api/programs/:id/curriculum` | Subject ↔ program ↔ semester |
| `SubjectFeeHistory` | Active | `/api/subjects/:id/fees` | Versioned fee rates |
| `AcademicSession` | Active | `/api/academic-sessions` | Intake / academic year |
| `Batch` | Active | `/api/batches` | Cohort per program/session |
| `CourseOffering` | Active | `/api/offerings` | Running class instance |
| `Enrollment` | Active | `/api/offerings/:id/enroll` | Locks `feeSnapshot` |
| `ProgramSemesterFeeSchedule` | Active | `/api/program-semester-fees` | Semester fee packages (F2/F3) |
| `SemesterRegistration` | Active | `/api/semester-registrations` | Student semester enroll + fee package (F4) |
| `RoleAssignment` | Active | `/api/role-assignments` | Dept/program/campus scoped staff roles (HOD, etc.) |

### Students & admissions

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `StudentApplication` | Active **NEW** | `/api/public/applications`, `/api/admissions/applications` | Public apply + internal pipeline |
| `StudentAdmission` | Active **NEW** | `/api/admissions/dossiers` | Full dossier after promote |
| `StudentDocument` | Active **NEW** | dossier + student document upload routes | |
| `Student` | Active | `/api/students` | Created only via `completeAdmission` |
| `Admission` | **Legacy** | `/api/admissions/legacy/*` only | Old monolith intake — do not extend |

### HR & workforce

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `StaffMember` | Active **NEW** | `/api/staff`, workforce | **Primary** employee record |
| `StaffLeave` | Active **NEW** | `/api/workforce/leaves` | Replaces `Leave` |
| `StaffLeaveBalance` | Active **NEW** | `/api/workforce/leaves/balance/:id` | Quotas per year |
| `StaffAttendance` | Active **NEW** | `/api/workforce/attendance` | |
| `StaffDocument` | Active **NEW** | `/api/staff/:id/documents` | |
| `Payroll` | Active | `/api/staff/:id/payroll`, `GET /api/payroll` | Still has legacy `employee` ref field — new rows use `staffMember` |
| `Recruitment` | Active **NEW** | `/api/workforce/recruitment` | Hire → creates `StaffMember` |
| `Employee` | **Legacy** | `dashboard.controller`, `report.controller` only | Replaced by `StaffMember` |
| `Leave` | **Legacy** | `dashboard.controller`, `report.controller` only | Replaced by `StaffLeave` |

### Finance

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `Fee` | Active | `/api/challans`, finance summary reads | F5 challans; links `semesterRegistrationId` |
| `FeeStructure` | **Orphan** | None (only `Fee.feeStructure` ref) | Old fee UI removed — model kept for existing rows |
| `Finance` | **Orphan** | **None** | Exported in index; `finance.controller` aggregates from `Fee` only |

### Assessments & campus services

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `Assignment` | Active | `/api/assignments` | Still uses `courseCode` strings — Phase 6: add `offeringId` |
| `Exam` | Active | `/api/exams` | Still uses `courseCode` strings — Phase 6 |
| `Attendance` | Active | `/api/attendance` | **Student** attendance (not staff) |
| `Book` / `Borrowing` | Active | `/api/books` | Library |
| `Bus` / `Driver` / `Route` | Active | `/api/transport` | |
| `Event` | Active | `/api/events` | |

### Other

| Model | Status | API / usage | Notes |
|-------|--------|-------------|-------|
| `Notification` | Active | `/api/notifications` | |
| `Report` | Active | `/api/reports` | Some report types still read legacy `Employee`/`Admission` |

### Shared sub-schemas (not collections)

| File | Status | Used by |
|------|--------|---------|
| `address.js` | Active | `University`, `Campus`, etc. |
| `academicSettings.js` | Active | Embedded settings blocks |

---

## Orphan files (not mounted — safe to delete later)

These exist on disk but are **not** registered in `routes/index.js`:

| File | Was for | Replaced by |
|------|---------|-------------|
| `routes/teacher.routes.js` | Teacher CRUD | `StaffMember` + offerings |
| `routes/hr.routes.js` | Employee + Leave CRUD | `/api/staff`, `/api/workforce/*` |
| `controllers/teacher.controller.js` | Teacher model | `staffMember.controller.js` |
| `controllers/employee.controller.js` | Employee model | `staffMember.controller.js` |
| `controllers/leave.controller.js` | Leave model | `staffLeave.controller.js` |

> `Teacher.model.js` may still exist on some machines but is **not** in `models/index.js` and has no mounted API.

---

## Route → model map (mounted APIs)

| Route prefix | Module key | Primary models |
|--------------|------------|----------------|
| `/api/public` | — (public) | `StudentApplication`, catalog reads |
| `/api/admissions` | `admissions` | `StudentApplication`, `StudentAdmission`, `StudentDocument`, legacy `Admission` |
| `/api/students` | `students` | `Student`, `StudentDocument` |
| `/api/staff` | `staff` | `StaffMember`, `Payroll`, `StaffDocument`, `User` |
| `/api/workforce` | `hr` | `StaffLeave`, `StaffAttendance`, `StaffLeaveBalance`, `Recruitment` |
| `/api/platform-roles` | `settings` | `PlatformRole`, `PermissionAuditLog`, `User` |
| `/api/offerings` | `academic_ops` | `CourseOffering`, `Enrollment` |
| `/api/semester-registrations` | `academic_ops` | `SemesterRegistration`, `Fee` |
| `/api/challans` | `finance` | `Fee` |
| `/api/finance` | `finance` | reads `Fee` (not `Finance` model) |
| `/api/payroll` | `finance` | `Payroll` |
| `/api/programs` | `academic_catalog` | `Program`, `ProgramCurriculum` |
| `/api/subjects` | `academic_catalog` | `Subject`, `SubjectFeeHistory` |
| `/api/program-semester-fees` | `academic_catalog` | `ProgramSemesterFeeSchedule` |
| `/api/role-assignments` | `academic_ops` | `RoleAssignment` |
| `/api/assignments` | `assessments` | `Assignment` |
| `/api/exams` | `assessments` | `Exam` |
| `/api/attendance` | `assessments` | `Attendance` (students) |
| `/api/books` | `library` | `Book`, `Borrowing` |
| `/api/transport` | `transport` | `Bus`, `Driver`, `Route` |
| `/api/events` | `events` | `Event` |
| `/api/reports` | `reports` | `Report` (+ reads legacy models) |
| `/api/dashboard` | `dashboard` | aggregates many models |
| `/api/universities` | `governance` | `University` |
| `/api/campuses` | `governance` | `Campus` |
| `/api/faculties` | `governance` | `Faculty` |
| `/api/departments` | `governance` | `Department` |
| `/api/batches` | `academic_ops` | `Batch` |
| `/api/academic-sessions` | `academic_ops` | `AcademicSession` |
| `/api/settings` | `settings` | `Settings` |
| `/api/notifications` | `dashboard` | `Notification` |
| `/api/auth` | — | `User`, `PlatformRole` |

Full module guard map: `backend/utils/apiRouteModules.js`

## Importing models

All models are imported from the central index:

```js
import { Student, Teacher, Course } from "../models/index.js";
```

Shared sub-schemas are imported directly by the models that use them:

```js
import address from "./address.js";
```

## Convention

- A model file exports a single Mongoose model as default export.
- Model files use the `.model.js` suffix (e.g. `Student.model.js`).
- `models/index.js` re-exports all models — controllers import from the index.
- Shared sub-schemas live in `models/` (no suffix) and are imported directly where needed.
- Sequential display IDs (e.g. `UNI-000001`, `CMP-001`) are generated atomically via the `Counter` model in `backend/utils/` (`generateUniversityId.js`, `generateCampusId.js`), not in the models themselves.
- No Mongoose transactions/sessions: the database is a standalone MongoDB (not Atlas/replica set), so multi-document transactions are unavailable. Multi-step operations (e.g. create/delete university) run as sequential operations, not sessions.

## Single-University Architecture

- The system manages one university; everything else is campus-scoped.
- Only `User` and `Campus` carry a `universityId` reference. Other models (Course, Fee, ...) are NOT university/campus-scoped.
- `Department` is campus-scoped via `campusId` (ref Campus).
- Deleting a university soft-deletes it and cascades a soft-delete to all `User` and `Campus` documents with that `universityId`.

## Soft Delete

- All models have `isDeleted` (default false), `deletedAt`, and `deletedBy` (ref User).
- Deletes are soft: controllers set `isDeleted: true` + `deletedAt` + `deletedBy` (from `req.user`) instead of removing documents.
- All read queries, duplicate checks, and counts filter `isDeleted: { $ne: true }`, so deleted records are excluded from listings and availability checks.
- The auth middleware rejects deleted users (`isDeleted: { $ne: true }`).
- Note: unique fields (e.g. `universityCode`) still enforce uniqueness at the DB level even for deleted records, so a soft-deleted record's code/email is not immediately reusable.

## Roles & Authentication

- **Legacy JWT role** (`User.role`): `Admin` | `Teacher` | `Student` | `Staff` — used by `authorize()` on routes.
- **Platform role** (`User.platformRole`): single `ObjectId` ref → `PlatformRole` — source of truth for permissions.
- **Module access** (`User.moduleAccess`): copied from role template; per-user overrides on staff portal access.
- API responses include computed `primaryRole` (role name string) for UI — **not stored** on the user document.
- Admin seeded at startup (`seedAdmin.js`) after `seedPlatformRoles.js`; links to `System Admin` platform role.
- Auth middleware (`middleware/auth.js`): `auth` populates `platformRole`; `authorize(...roles)` checks legacy `User.role`.
- Platform routes also use `requireModule(moduleKey)` — see `utils/apiRouteModules.js`.
- Public: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/public/*`.

## University API (single-university)

Only four endpoints — no `:id` params because there is exactly one university:

| Method | Route | Controller | Access |
|---|---|---|---|
| POST | `/api/universities` | `createUniversity` | public |
| GET | `/api/universities` | `getUniversity` | Admin |
| PUT | `/api/universities` | `updateUniversity` (handles ALL updates) | Admin |
| DELETE | `/api/universities` | `deleteUniversity` (soft delete + cascade) | Admin |

- `getUniversity` returns the single active university including `campusCount`, `userCount`, and a `stats` object (students/teachers/staff/admins/campuses).
- `createUniversity` rejects creation if one already exists.

## Response & Error Conventions

- Success responses use `{ success: true, data, message?, count? }`.
- Errors use `{ success: false, message, error?, stack? }` (`stack` only in development).
- The shared `handle` wrapper (`backend/utils/asyncHandler.js`) is used by all controllers to centralize error handling:
  - `ValidationError` / `CastError` → HTTP 400
  - Duplicate key (`code 11000`) → HTTP 409
  - Everything else → HTTP 500

## User Model

- `role` — legacy enum `['Admin', 'Teacher', 'Student', 'Staff']` for JWT + `authorize()`.
- `platformRole` — **single** `ObjectId` ref → `PlatformRole` (replaces old `primaryRole` + `platformRoleId` fields).
- `moduleAccess` — `Map<string, boolean>` copied from platform role template.
- Legacy users auto-migrated on startup via `migrateUsersToPlatformRoleRef()` in `utils/userPlatformRole.js`.
- Soft-delete fields: `isDeleted`, `deletedAt`, `deletedBy`.
- Staff link: `staffMemberId` ref → `StaffMember`.

## Shared Utilities

- `backend/utils/asyncHandler.js` — wraps all controller functions for centralized error handling
- `backend/utils/generateUniversityId.js` — atomic sequential ID generation (`UNI-000001`)
- `backend/utils/generateCampusId.js` — atomic sequential ID generation (`CMP-001`)
- `backend/utils/generateDepartmentId.js` — atomic sequential ID generation (`DEPT-0001`)
- `backend/utils/generateTeacherId.js` — atomic sequential ID generation (`FAC-0001`)
- `backend/utils/generateCourseId.js` — atomic sequential ID generation (`CRS-0001`)
- `backend/utils/generateProgramId.js` — atomic sequential ID generation (`PRG-0001`)
- `backend/config/constants.js` — JWT secret and expiry, fails fast if `JWT_SECRET_Key` env var is missing

## Foundational Model Relationships

```
University
  └── Campus (universityId ref)
        └── Faculty (campusId ref)
              └── Department (campusId ref, facultyId ref)
                    ├── Subject (departmentId ref)
                    ├── Program (departmentId ref)
                    │     └── ProgramCurriculum → Subject
                    │     └── ProgramSemesterFeeSchedule
                    └── Batch (programId, academicSessionId)

CourseOffering (subjectId, programId, batchId, academicSessionId, instructorId → StaffMember)
  └── Enrollment (studentId, feeSnapshot)

StaffMember (employments → Department/Campus)
  └── User (platformRole ref, moduleAccess, staffMemberId)
        └── PlatformRole (name, moduleAccess template)

StudentApplication → StudentAdmission (dossier) → Student (+ StudentDocument)
SemesterRegistration → Fee (challan)
```

- **Faculty** = org unit under campus (not a person). **StaffMember** = employee person record.
- **CourseOffering.instructorId** → `StaffMember` (replaces old Teacher model).
- **Student** created only via `POST /admissions/dossiers/:id/complete`.

## Course API (removed)

`Course` model and `/api/courses` routes were **removed** Aug 2026. Use **Subject** + **CourseOffering** + **Enrollment** instead. See model registry above.

## Subject API (Phase 1 — implemented)

- List: `GET /api/subjects?departmentId&status&search&page&limit`
- Stats: `GET /api/subjects/stats` — `{ total, active, inactive }`
- CRUD: standard lean routes; Admin only
- `code` globally unique; soft delete; delete blocked if prerequisite for other subjects or legacy `Course` with same code exists

## ProgramCurriculum API (Phase 2 — implemented)

- `GET /api/programs/:id/curriculum` — semester grid with subjects, credits summary
- `PUT /api/programs/:id/curriculum` — replace curriculum `{ entries: [{ subjectId, semester, type, order, status }] }`
- Any active catalog subject can be added to a program; unique subject per program; soft-delete on replace
- Program delete blocked if curriculum entries exist; Subject delete blocked if in curriculum

## SubjectFeeHistory API (Phase 3 — implemented)

- `GET /api/subjects/:id/fees` — fee timeline; optional `?programId=` or `?programId=default`
- `GET /api/subjects/:id/fees/current` — resolve rate at date (`?programId=`, `?date=`); program override falls back to default
- `POST /api/subjects/:id/fees` — add rate (Admin); closes previous active row for same subject+program scope
- Fields: `feePerCredit`, `feeType`, `effectiveFrom`, optional `programId`, `reason`
- Unique active row per `{ subjectId, programId }` where `effectiveTo` is null

## CourseOffering & Enrollment API (Phase 5 — implemented)

- `GET /api/offerings` — list with filters (`programId`, `batchId`, `academicSessionId`, `status`, `search`)
- `GET /api/offerings/stats` — KPI counts + total active enrollments
- `POST /api/offerings` — create (Admin); validates curriculum + unique subject/batch/session
- `PUT /api/offerings/:id` — update instructor, schedule, capacity, status (Admin)
- `DELETE /api/offerings/:id` — soft delete (Admin); blocked if active enrollments
- `GET /api/offerings/:id/enrollments` — list with student + fee snapshot
- `POST /api/offerings/:id/enroll` — enroll student; builds immutable `feeSnapshot` via `resolveSubjectFee.js`
- `DELETE /api/offerings/:id/enroll/:studentId` — drop student
- Fee resolution: program-specific `SubjectFeeHistory` → default rate at enrollment date

## Program semester fees (F2/F3)

- Model: `ProgramSemesterFeeSchedule` (`PFS-0001` IDs)
- Routes: `/api/program-semester-fees`, nested under `/api/programs/:id/semester-fees`
- Generate from curriculum + `buildSemesterFeeSchedule.js`; activate archives prior active for same scope
- `PATCH /:id/refresh-rates` — update draft/active subject lines from current `SubjectFeeHistory`

## Semester registration (F4)

- Model: `SemesterRegistration` (`SRG-0001` IDs)
- Routes: `/api/semester-registrations`
- `POST /preview` — validate scope, resolve active package, list enrollment warnings (no writes)
- `POST /` — create registration with immutable `semesterFeeSnapshot`; auto-enroll or link existing offerings
- `GET /api/students/:id/semester-registrations` — student history
- `feeId` reserved for F5 challan; status: Registered / Paid / Partial / Dropped

## Fee challans (F5)

- Extended `Fee` model: `semesterRegistrationId`, `source: semester_package`, `challanSnapshot`
- `POST /api/semester-registrations/:id/generate-challan`
- `GET /api/challans`, `GET /api/challans/stats`, `GET /api/challans/:id`
- `POST /api/challans/:id/payments` — partial/full payment; updates registration status

## Removed legacy (Aug 2026)

- **`Semester` model + `/api/semesters`** — calendar sub-periods inside a session; unused by offerings, batches, or fee packages. Use **program semester** (1–8) on curriculum/offerings instead.
- **`/api/fees` + `/api/fee-structures` + legacy Fees UI** — replaced by Subject fee history + Program semester fee packages. `Fee` and `FeeStructure` **models kept** for F5 challan integration; finance/reports may read existing records.

## Academic structure seed

Script: `npm run seed:academic` (or `npm run seed:academic:dry`)

Creates idempotently:

`University → Campus → Faculty → Department → Program → Subject → ProgramCurriculum → SubjectFeeHistory`

- Structure config: `backend/scripts/seedData/academicStructure.data.js`
- Subject catalog: `backend/scripts/seedData/academicCatalog.data.js` (5 programs, 200 subjects)
- Logic: `backend/utils/seedAcademicStructure.js`
- Runner: `backend/scripts/runSeedAcademic.js`

**Removed:** legacy `seedCourses` (startup + `npm run seed:courses`) and Course → Subject migration scripts. Old `Course` API/model still exists until Phase 8 deprecation.

## Program API (updated)

- List: `GET /api/programs?departmentId&degreeLevel&status&search&page&limit` (auth only)
- Stats: `GET /api/programs/stats` (auth only)
- Mutations: `POST/PUT/DELETE` require Admin
- Soft delete with delete guards for linked courses and batches

## Student intake API (Aug 2026)

### Public routes (no auth) — `/api/public`

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/public/catalog/programs` | Active programs for apply form |
| GET | `/public/catalog/campuses` | Campus list |
| GET | `/public/catalog/sessions` | Open intake sessions |
| POST | `/public/applications` | Submit application (rate-limited) |
| GET | `/public/applications/track` | Track by `applicationId` + `cnic` |

Rate limiting: `middleware/rateLimit.js` on public POST/track endpoints.

### Admission completion rules

- `POST /dossiers/:id/complete` creates `Student` with `STU-XXXX` ID
- `REQUIRED_DOCUMENT_TYPES` is currently **empty** — documents optional for completion; dossier fields still validated
- Auto-save dossier before complete from frontend

### Internal routes — `/api/admissions` (module: `admissions`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/applications` | List / create internal applications |
| GET | `/applications/stats` | Pipeline KPIs |
| GET/PATCH | `/applications/:id`, `/applications/:id/status` | Review + status updates |
| POST | `/applications/:id/promote` | Create admission dossier |
| GET/PUT | `/dossiers/:id` | View / edit full dossier |
| POST | `/dossiers/:id/complete` | Validate + create `Student` |
| GET/POST | `/dossiers/:id/documents` | List / upload admission documents |

### Student routes — `/api/students` (module: `students`)

- Directory list with `programId`, `departmentId`, `campusId`, `batchId` refs
- `POST /students` disabled — students created via `completeAdmission` only
- `GET/POST/DELETE /students/:id/documents` — post-enrollment documents

### Upload paths

Student documents: `uploads/students/{admissionId|studentId}/{documentType}/{id}_{type}_{name}_{timestamp}.ext`

ID generators: `generateStudentId.js` (`STU-0001`, `APP-26-0001`, `ADM-26-0001`)

Legacy `Admission.model.js` kept for old data only. **No migration scripts** in repo — only seed scripts (`seed:academic`, `seedAdmin`, optional `seedTestRoleUsers`).

## Seeds & scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Admin seed | startup (`seedAdmin.js`) | Default admin from `.env` |
| Academic structure | `npm run seed:academic` | University → subjects + curriculum |
| Test role users | `SEED_TEST_USERS=true` | One user per platform role |

**Removed:** `migrateTeachersToStaff`, `migrateLegacyAdmissions`, `seedCourses`.

## Attendance / Batch / Student

- **Attendance**: has `departmentId` ref (nullable) + `department` string denormalized from Student.
- **Batch**: has `departmentId` ref + `department`/`program` strings denormalized.
- **Student**: refs to `programId`, `departmentId`, `campusId`, `batchId`, `admissionId`; legacy string fields kept as denormalized snapshots. Created via admission dossier completion, not direct POST.

## Department API (updated)

- List: `GET /api/departments?campusId&facultyId&status&search&page&limit`
- Stats: `GET /api/departments/stats` — returns `{ total, active, inactive, departments[] }` using `status`
- Create/update validate `facultyId` belongs to same campus as department
- Soft delete with `deletedBy`; duplicate check includes soft-deleted records (409 with clear message)
- All routes: `auth + authorize("Admin")`

## Platform roles & module access (Aug 2026)

- Model: `PlatformRole` — `name`, `description`, `moduleAccess`, `isSystem`
- Routes: `/api/platform-roles` — CRUD, reseed defaults, `POST /:id/apply-to-users`, audit logs
- `User.platformRole` — single ref to `PlatformRole`; `User.moduleAccess` copied from template
- Helpers: `utils/userPlatformRole.js`, `utils/platformRoleAccess.js`, `utils/moduleAccessDefaults.js`
- Middleware: `requireModule(moduleKey)` — `System Admin` bypass; checks `moduleAccess` map
- Route map: `backend/utils/apiRouteModules.js` — prefix → module key; applied in `routes/index.js`
- Seeds: `seedPlatformRoles.js` (startup + `npm run seed:roles`), `seedTestRoleUsers.js` (optional)

## StaffMember & distributed HR modules (Aug 2026)

- Model: `StaffMember` — single source of truth for employees (replaces legacy HR page flow)
- Related models: `StaffLeave`, `StaffAttendance`, `StaffDocument`, `StaffPayroll` (on staff routes)
- Staff routes: `/api/staff` — CRUD, login enable/disable, payroll nested routes, documents
- Workforce routes: `/api/workforce/leaves`, `/api/workforce/attendance` — module key `hr`
- Leave: create/list/stats, Admin approves via `PUT /leaves/:id/status`
- Attendance: `markStaffAttendance` compares check-in to `workSchedule` via `workScheduleUtils.js` (late minutes, off-day)
- Documents: multer upload, max 10 MB, PDF/JPG/PNG/WEBP/DOC/DOCX

### File uploads

- Root: `backend/uploads/` (gitignored except `.gitkeep`)
- Static serve: `app.use('/uploads', express.static(UPLOAD_ROOT))` in `server.js`
- Path builder: `backend/utils/uploadPaths.js`

```
uploads/hr/{staffId}/{documentType}/{staffId}_{documentType}_{documentName}_{timestamp}.ext
```

- Upload flow: `resolveStaffForUpload` middleware → multer (`middleware/upload.js`) → `staffDocument.controller.js`
- Download: `GET /api/staff/:id/documents/:documentId/download` (auth required; uses stored `relativePath`)

### Recruitment API (Phase C)

- Routes under `/api/workforce/recruitment` — module key `hr`
- CRUD postings, add applicants, update status, **hire** → creates `StaffMember` with `hiredFromRecruitmentId`

### Leave balances (Phase C)

- Model: `StaffLeaveBalance` — per staff per year (annual/sick/casual/maternity/paternity quotas + used)
- `GET/PUT /api/workforce/leaves/balance/:staffMemberId`
- Validated on leave create; deducted/restored on approve/reject

### Bulk attendance (Phase C)

- `POST /api/workforce/attendance/bulk` — `{ date, records?, markAbsentForUnmarked? }`

### Teaching link (Phase C)

- `GET /api/staff/:id/offerings` — offerings where `instructorId` = staff member
- CourseOffering already refs `StaffMember` (no separate Teacher model)

### Permission audit (Phase C)

- Model: `PermissionAuditLog`
- `GET /api/platform-roles/audit-logs` — role changes + portal access updates
- Logged from `platformRole.controller` and staff login access endpoints

### Test users seed

- `SEED_TEST_USERS=true` — creates one user per `PLATFORM_ROLES` entry (except System Admin, Student)
- Email: `{role-slug}@scholaros.test` · Password: `{RoleName}@123` (e.g. `university-admin@scholaros.test` / `UniversityAdmin@123`)

## Implementation status summary

### ✅ Done (backend)

| Area | Status |
|------|--------|
| Academic ladder (subjects → offerings → enrollment) | ✅ |
| Program semester fees + semester registration + challans | ✅ |
| StaffMember + workforce (leave, attendance, documents, recruitment) | ✅ |
| Platform roles + `requireModule()` on all API routes | ✅ |
| Student intake (public apply/track + admissions pipeline + dossier) | ✅ |
| Student/staff document uploads under `uploads/` | ✅ |
| Leave balances + bulk attendance | ✅ |
| Permission audit log | ✅ |

### ⏳ Not done / cleanup candidates (backend)

| Item | Priority | Notes |
|------|----------|-------|
| Student portal auth (`Student.userId`) | High | No student login API yet |
| Phase 6 — `offeringId` on Assignment/Exam/Attendance | Paused | Still use course code strings |
| Delete orphan files | Low | `teacher.routes.js`, `hr.routes.js`, related controllers |
| Remove legacy `Admission` model + `/legacy` routes | Low | After confirming no production data |
| Remove `Employee` + `Leave` models | Low | Dashboard/reports still read them |
| Remove `Finance` model (unused) | Low | `finance.controller` uses `Fee` only |
| Remove `FeeStructure` model | Low | Only referenced by old `Fee` rows |
| Payroll `employee` ref cleanup | Low | New payroll rows should use `staffMember` only |
| Leave balance admin bulk UI | Medium | API exists; no admin bulk endpoint |
| Recruitment resume upload | Medium | Applicants in DB only; no CV file path |
| Phase 7 — `BatchFeePolicy` | Future | Continuing-student fees |

### Next backend tasks (recommended)

1. `Student.userId` link + student-scoped routes (grades, fees, profile)
2. Recruitment applicant document upload (`uploads/hr/recruitment/`)
3. Optional: admin endpoint to bulk-set leave quotas per department
4. Phase 6 when resumed: add `offeringId` ref to Assignment, Exam, Attendance models