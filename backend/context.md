# Backend Context

## Models Structure

Models are organized into domain folders. Each folder groups models of the same category/belongs to the same module.

```
backend/models/
├── core/          University, Campus, User, Settings, Counter
├── academic/      Student, Teacher, Course, Department, Semester, AcademicSession,
│                  Batch, Admission, Assignment, Attendance, Exam
├── finance/       Fee, FeeStructure, Finance, Payroll
├── hr/            Employee, Leave, Recruitment
├── transport/     Bus, Driver, Route
├── library/       Book, Borrowing
├── communication/ Event, Notification
├── report/        Report
└── shared/        Reusable embedded sub-schemas (address, academicSettings)
```

## Shared Schemas (`shared/`)

Reusable embedded sub-schemas shared by multiple models:

| File                 | Used by            |
| -------------------- | ------------------ |
| `address.js`         | University, Campus |
| `academicSettings.js`| University         |

### Importing a model

```js
import University from "../models/core/University.js";
import address from "../models/shared/address.js";
```

## Convention

- A model file exports a single Mongoose model, default export.
- Shared sub-schemas live in `shared/` and are imported where needed.
- Sequential display IDs (e.g. `UNI-000001`, `CMP-001`) are generated atomically via the `Counter` model (`core/Counter.js`) in `backend/utils/` (`generateUniversityId.js`, `generateCampusId.js`), not in the models themselves.
- No Mongoose transactions/sessions: the database is a standalone MongoDB (not Atlas/replica set), so multi-document transactions are unavailable. Multi-step operations (e.g. create/delete university) run as sequential operations, not sessions.

## Single-University Architecture

- The system manages one university; everything else is campus-scoped.
- Only `User` and `Campus` carry a `universityId` reference. Other models (Department, Course, Fee, ...) are NOT university/campus-scoped.
- Deleting a university soft-deletes it and cascades a soft-delete to all `User` and `Campus` documents with that `universityId`.

## Soft Delete

- `University`, `Campus`, and `User` all have `isDeleted` (default false), `deletedAt`, and `deletedBy` (ref User).
- Deletes are soft: controllers set `isDeleted: true` + `deletedAt` + `deletedBy` (from `req.user`) instead of removing documents.
- All read queries, duplicate checks, and counts filter `isDeleted: { $ne: true }`, so deleted records are excluded from listings and availability checks.
- The auth middleware rejects deleted users (`isDeleted: { $ne: true }`).
- Note: unique fields (e.g. `universityCode`) still enforce uniqueness at the DB level even for deleted records, so a soft-deleted record's code/email is not immediately reusable.

## Roles & Authentication

- Roles: `Admin`, `Teacher`, `Student`, `Staff`. No Super Admin. Default role on user creation is `Student`.
- Admin is seeded at startup by `backend/scripts/seed.js` (`seedDefaultAdmin`) from env vars `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, with role `Admin` and no `universityId`.
- `createUniversity` does NOT create an admin user or JWT. It only creates the university and links existing role-`Admin` users without a `universityId` to it.
- Auth middleware (`backend/middleware/auth.js`) exposes:
  - `auth` — verifies JWT, attaches `req.user`.
  - `authorize(...roles)` — returns 403 if `req.user.role` is not in the allowed list.
- Route files apply permissions via `router.use(auth)` and `router.use(auth, authorize("Admin"))`, never inline in controllers.
  - Admin-only modules: university, campus, settings, finance, hr.
  - Admin/Staff: fee, feeStructure.
  - Authenticated only: student, teacher, course, attendance, admissions, assignments, exams, books, transport, events, reports, dashboard, notifications, semesters, batches, academic-sessions.
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
- Duplicate-key errors (`code 11000`) are returned as HTTP 409, handled centrally by the `handle` async wrapper in `university.controller.js` (pattern to reuse in other controllers).

## User Model

- Role enum: `['Admin', 'Teacher', 'Student', 'Staff']`.
- Has soft-delete fields (see Soft Delete section).