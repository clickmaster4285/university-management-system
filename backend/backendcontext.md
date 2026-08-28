# Backend Context

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
├── Recruitment.model.js
├── Report.model.js
├── Route.model.js
├── Semester.model.js
├── Settings.model.js
├── Student.model.js
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