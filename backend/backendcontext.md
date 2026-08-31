# Backend Context

## API & data principles

Features must be **easy to use, easy to follow, and easy to understand** — backend supports that with predictable APIs and efficient data access.

- **Lean routes** — one resource, clear verbs; nested routes only when scoped (`/subjects/:id/fees`, `/programs/:id/curriculum`)
- **Validate early** — return clear `message` strings the frontend can show in toasts
- **Indexed queries** — compound indexes on filter/sort fields; partial unique indexes where soft-delete applies
- **No redundant round-trips** — populate only fields the UI needs; stats endpoints for KPI rows
- **Versioned / immutable data** — fee history closes old rows instead of overwriting (audit-safe)
- **Efficiency** — `asyncHandler`, parallel `Promise.all` for independent reads, avoid N+1 in list endpoints

## Models Structure

All model files live directly in `backend/models/` with a `.model.js` suffix. Shared embedded sub-schemas (`address.js`, `academicSettings.js`) also live in `models/`.

```
backend/models/
├── AcademicSession.model.js
├── Admission.model.js
├── Assignment.model.js
├── Attendance.model.js
├── Batch.model.js
├── Book.model.js
├── Borrowing.model.js
├── Bus.model.js
├── Campus.model.js
├── Counter.model.js
├── Course.model.js
├── CourseOffering.model.js
├── Enrollment.model.js
├── Department.model.js
├── Faculty.model.js
├── Driver.model.js
├── Employee.model.js
├── Event.model.js
├── Exam.model.js
├── Fee.model.js
├── FeeStructure.model.js
├── Finance.model.js
├── Leave.model.js
├── Notification.model.js
├── Payroll.model.js
├── Program.model.js
├── ProgramCurriculum.model.js
├── ProgramSemesterFeeSchedule.model.js
├── SemesterRegistration.model.js
├── Recruitment.model.js
├── Report.model.js
├── Route.model.js
├── Settings.model.js
├── Student.model.js
├── Subject.model.js
├── Teacher.model.js
├── University.model.js
├── User.model.js
├── address.js              ← shared sub-schema
├── academicSettings.js     ← shared sub-schema
└── index.js                ← re-exports all models
```

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

- Roles: `Admin`, `Teacher`, `Student`, `Staff`. No Super Admin. Default role on user creation is `Student`.
- Admin is seeded at startup by `backend/scripts/seedAdmin.js` (`seedDefaultAdmin`) from env vars `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, with role `Admin` and no `universityId`.
- `createTeacher` auto-creates a User account (role: 'Teacher') and a Teacher profile. The User and Teacher are linked via `Teacher.userId`.
- `createUniversity` does NOT create an admin user or JWT. It only creates the university and links existing role-`Admin` users without a `universityId` to it.
- Auth middleware (`backend/middleware/auth.js`) exposes:
  - `auth` — verifies JWT, attaches `req.user`.
  - `authorize(...roles)` — returns 403 if `req.user.role` is not in the allowed list.
- Route files apply permissions via `router.use(auth)` and `router.use(auth, authorize("Admin"))`, never inline in controllers.
  - Admin-only modules: university, campus, faculty, department, settings, finance, hr, programs (writes).
  - Admin/Staff: fee, feeStructure.
  - Authenticated only: student, teacher, course, attendance, admissions, assignments, exams, books, transport, events, reports, dashboard, notifications, semesters, batches, academic-sessions. Program GET routes are auth-only; program mutations require Admin.
  - Public: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/universities`.

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

- Role enum: `['Admin', 'Teacher', 'Student', 'Staff']`.
- Has soft-delete fields (see Soft Delete section).
- No `campusId`, `department`, or `designation` fields — Teacher/Student carry their own refs.

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
                    ├── Subject (departmentId ref) — Phase 1 catalog
                    ├── Program (departmentId ref)
                    │     └── Course (programId ref + program string denormalized)
                    └── Course (departmentId ref)
                          └── instructorId → Teacher (nullable)
Teacher (userId ref → User, departmentId ref → Department)
User (role: Admin | Teacher | Student | Staff)
```

- **Faculty**: belongs to Campus (`campusId`). Head is Teacher (`headId`, nullable). Name+code unique per campus. Soft-delete.
- **Department**: belongs to Campus (`campusId`) and optionally Faculty (`facultyId`). Head is Teacher (`headId`, nullable). Name+code unique per campus. Soft-delete. Delete blocked if programs, courses, teachers, or batches are linked.
- **Program**: belongs to Department (`departmentId`). Has `code` (globally unique), `degreeLevel`, `duration`, `totalCredits`, `status`. Soft-delete fields on model; controller delete still hard-deletes (needs fix). Course link uses both `programId` ref and denormalized `program` code string.
- **Teacher ↔ User**: creating a Teacher auto-creates a User (role: 'Teacher'). Teacher has `userId` ref. Soft-deleting a Teacher also soft-deletes the linked User.
- **Course** (legacy): monolithic model being replaced — see `academic-architecture-plan.md`. Target: **Subject**, **ProgramCurriculum**, **SubjectFeeHistory**, **CourseOffering**, **Enrollment**.
- **CourseOffering** + **Enrollment** (Phase 5): running class per subject/batch/session; enrollment locks `feeSnapshot` via `utils/resolveSubjectFee.js`.

## Course API (lean — legacy `Course` model; see academic-architecture-plan.md)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/courses` | List + filters (`departmentId`, `programId`, `program`, `instructorId`, `code`, `status`, `semester`, `feeApplied`, `search`, pagination) |
| GET | `/api/courses/stats` | KPIs + breakdowns + enrollment summary (replaces separate enrollment-stats / fee-summary list endpoints) |
| GET | `/api/courses/:id` | Single course (includes schedule, fees, instructor — no sub-routes) |
| POST | `/api/courses` | Create |
| PUT | `/api/courses/:id` | Update any field (fee, capacity, schedule, instructor, status, prerequisites, etc.) |
| DELETE | `/api/courses/:id` | Soft delete |
| POST/PATCH/DELETE | `/api/courses/bulk` | Bulk create / status update / delete |
| POST/DELETE | `/api/courses/:id/enroll` | Student enroll / drop (workflow endpoint) |

**Removed redundant routes** — use query params or `PUT /:id` instead:
- `GET /active` → `GET /?status=Active`
- `GET /department/:id` → `GET /?departmentId=`
- `GET /program/:code` → `GET /?program=` or `programId=`
- `PUT /:id/fee`, `/capacity`, `/schedule`, `assign-instructor` → `PUT /:id` with body fields
- `PATCH /:id/toggle` → `PUT /:id` with `{ status }`

Mutations require `auth + authorize("Admin")`.

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

## Attendance / Batch / Student (legacy notes)

- **Attendance**: has `departmentId` ref (nullable) + `department` string denormalized from Student.
- **Batch**: has `departmentId` ref + `department`/`program` strings denormalized.
- **Student**: left for later — still uses hardcoded `department` and `campus` strings, no User link.

## Department API (updated)

- List: `GET /api/departments?campusId&facultyId&status&search&page&limit`
- Stats: `GET /api/departments/stats` — returns `{ total, active, inactive, departments[] }` using `status`
- Create/update validate `facultyId` belongs to same campus as department
- Soft delete with `deletedBy`; duplicate check includes soft-deleted records (409 with clear message)
- All routes: `auth + authorize("Admin")`

## Platform roles & module access (Aug 2026)

- Model: `PlatformRole` — `name`, `description`, `moduleAccess` (Record<string, boolean>), `isSystem`
- Routes: `/api/platform-roles` — CRUD, reseed defaults, `POST /:id/apply-to-users`
- `User.primaryRole` + `User.moduleAccess` — copied from role template; per-user overrides on `/access/:id`
- Middleware: `requireModule(moduleKey)` — checks `req.user.moduleAccess[moduleKey] === true`; Admin bypass
- Route map: `backend/utils/apiRouteModules.js` — prefix → module key; applied in `routes/index.js`
- Seeds: `seedPlatformRoles.js` (startup), `seedTestRoleUsers.js` (optional, `SEED_TEST_USERS=true`)

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

## What's next (backend)

| Item | Notes |
|------|-------|
| Recruitment API | Model exists (`Recruitment.model.js`); needs controller, routes, `requireModule('hr')` |
| Leave balances | Extend `StaffLeave` or add `LeaveBalance` per staff/year |
| Bulk attendance | `POST /api/workforce/attendance/bulk` with array of records |
| Teacher link | Optional `teacherId` on `StaffMember` or `staffMemberId` on `Teacher` |
| Cleanup | Legacy `Employee` model — migrate or deprecate |