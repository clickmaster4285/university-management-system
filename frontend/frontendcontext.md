# Frontend Context

## Tech Stack

- **React 19** + **TypeScript** + **Vite 8**
- **React Router DOM 7** for routing (not TanStack Router despite it being in deps)
- **TanStack React Query 5** for server-state management
- **shadcn/ui** (Radix primitives) + **Tailwind CSS 4** for UI
- **Axios** for HTTP
- **Lucide React** for icons
- **Sonner** for toasts
- **Recharts** for charts
- **Zod** + **React Hook Form** for validation

## Project Structure

```
frontend/src/
├── App.tsx              ← Route definitions + lazy imports
├── main.tsx             ← Entry point
├── styles.css           ← Global styles + Tailwind
├── components/          ← Shared UI (data-table, kpi-card, ui/*, sidebar)
├── features/            ← API service classes (one file per domain)
├── hooks/               ← Custom hooks
├── layouts/             ← AppLayout, sidebar.tsx (AppSidebar)
├── lib/                 ← auth.tsx (AuthProvider + AuthContext), utils
└── pages/               ← Page components organized by domain
```

## Page Refactoring Convention

Pages over ~500 lines are split into sub-components under a `components/` folder within the page directory. The pattern:

```
pages/academics/departments/
├── DepartmentsPage.tsx              ← Thin orchestrator (state, data fetching, layout)
└── components/
    ├── Charts.tsx                   ← Reusable chart components (AnimatedTrendChart, AnimatedGauge)
    ├── DepartmentFormModal.tsx      ← Create/edit modal form
    └── DepartmentViewModal.tsx      ← Read-only detail view modal
```

**Rules:**
- Main page owns all state, data fetching, and event handlers
- Sub-components receive props (data + callbacks) — they are stateless or manage only UI-local state
- Types and constants (form data, empty defaults, options) live in the component file that uses them
- Sub-components are exported as named exports, re-imported by the main page

**Refactored example:** `DepartmentsPage.tsx` — 1313 → 370 lines (72% reduction) across 4 files.

**Still pending refactor** (500+ lines): FeesPage (2530), AdmissionsPage (1520), TransportPage (1513), AssignmentsPage (1466), CoursesPage (1331), HrPage (1287), LibraryPage (1198), ExamsPage (1198), EventsPage (1185), StudentsPage (1183), TeachersPage (1046), BatchesPage (1043).

## Routing

All routes are defined in `App.tsx` using React Router DOM `<Routes>`. Pages are **lazy-loaded** with `React.lazy()`.

Routes sit under `<AppLayout />` (which renders sidebar + `<Outlet />`):

```
/                   → DashboardPage
/university         → UniversityProfilePage
/campuses           → CampusesPage
/campuses/create    → CampusCreatePage
/campuses/edit/:id  → CampusEditPage
/faculties          → FacultiesPage
/ai                 → AiAssistantPage
/notifications      → NotificationsPage
/admissions         → AdmissionsPage
/departments        → DepartmentsPage
/programs           → ProgramsPage
/courses            → CoursesPage
/academic-sessions  → AcademicSessionsPage
/semesters          → SemestersPage
/batches            → BatchesPage
/students           → StudentsPage
/teachers           → TeachersPage
/attendance         → AttendancePage
/assignments        → AssignmentsPage
/exams              → ExamsPage
/online-classes     → OnlineClassesPage
/library            → LibraryPage
/hostel             → HostelPage
/transport          → TransportPage
/events             → EventsPage
/qr                 → SmartQrPage
/fees               → FeesPage
/finance            → FinancePage
/hr                 → HrPage
/reports            → ReportsPage
/settings           → SettingsPage
```

## Navigation / Sidebar

`src/layouts/sidebar.tsx` contains the `AppSidebar` component with `sidebarNav` config array. Four groups: Overview, Academics, Campus, Operations. Adding a nav link means adding to the relevant `items` array in `sidebarNav`.

## API Services (`features/`)

Each file exports an interface for the entity and an API class/object. All use a shared Axios instance from `features/axios.ts` (base URL `/api`).

Key barrel export: `features/index.ts` re-exports everything.

### Updated Files (reflecting backend ref changes)

- **`features/teachers.ts`** — `Teacher` interface: `userId` (ref User), `departmentId` (ref Department). Removed `coursesTeaching`. `getAll` accepts `{ departmentId?, designation?, status?, search?, page?, limit? }`. No `bulkCreate` — teacher creation auto-creates User on backend.
- **`features/departments.ts`** — `Department` interface: `campusId` (ref Campus), `headId` (ref Teacher), `facultyId` (ref Faculty). `getAll` accepts optional `campusId` param.
- **`features/courses.ts`** — `Course` interface: `departmentId` (ref Department), `programId` (ref Program), `instructorId` (ref Teacher). All filter methods use `departmentId`. `CourseFilters` uses `departmentId`/`programId`.
- **`features/attendance.ts`** — `AttendanceRecord` has `departmentId` alongside legacy `department`. API methods use `departmentId` in query params and payloads.
- **`features/batches.ts`** — `getAll` accepts `departmentId` instead of `department`.
- **`features/programs.ts`** — `Program` interface + `ProgramAPI` class with `getAll`, `getById`, `getStats`, `create`, `update`, `delete`.
- **`features/faculties.ts`** — `Faculty` interface + `FacultyAPI` class with `getAll`, `getById`, `getStats`, `create`, `update`, `delete`.
- **`features/campus.ts`** — `campusAPI.getAll()` (no params needed), `.getById(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`. No separate `setMain` — uses `update(id, { isMainCampus: true })`.
- **`features/university.ts`** — Single-university pattern: `getUniversity()`, `createUniversity(data)`, `updateUniversity(data)`, `deleteUniversity()`.

### Still using legacy `department` string (not yet updated)

- `features/students.ts`, `features/admissions.ts`, `features/assignment.ts`, `features/exam.ts`, `features/book.ts`, `features/fee.ts`, `features/feeStructure.ts`, `features/finance.ts`, `features/hr.ts`, `features/auth.ts` — these still reference a `department: string` field. Students model itself is left for later per user request.

## Auth

`src/lib/auth.tsx` provides `AuthProvider` and `useAuth()` hook. Stores JWT in `localStorage` under `token`. User object stored in `localStorage` under `user`. Also stores `universityId` separately.

Roles defined in frontend: `'Super Admin' | 'Admin' | 'Teacher' | 'Student' | 'Student Affairs' | 'Finance' | 'Transport' | 'Library' | 'HR'` — but backend only has `Admin`, `Teacher`, `Student`, `Staff`.

## UI Components

- `components/data-table.tsx` — `DataTable<T>` generic table with `Column<T>[]` config (uses `cell` not `render`)
- `components/dashboard/kpi-card.tsx` — `KpiCard` for stats display (uses `label` not `title`, `icon: LucideIcon`)
- `components/ui/*` — shadcn/ui primitives (Badge, Button, Input, Label, Dialog, etc.)
- `layouts/AppLayout.tsx` — wraps sidebar + main content area

## Page Conventions

- Each page is a default-exported component
- Pages manage their own state (no shared store)
- CRUD pages follow: fetch data → display in DataTable → modal form for create/edit → toast for feedback
- Large pages (>500 lines) split into `components/` sub-folder (see Page Refactoring Convention)
- Department/teacher/faculty dropdowns: fetch list on mount, render as `<select>` in form modals

## Key Backend→Frontend Field Mapping

| Backend Model Field | Frontend `features/*.ts` Field | Notes |
|---|---|---|
| `Teacher.userId` (ref User) | `Teacher.userId` | Populated on read |
| `Teacher.departmentId` (ref Department) | `Teacher.departmentId` | Was `department` string |
| `Department.campusId` (ref Campus) | `Department.campusId` | Required on create |
| `Department.headId` (ref Teacher) | `Department.headId` | Optional |
| `Department.facultyId` (ref Faculty) | `Department.facultyId` | Was `faculty` string |
| `Course.departmentId` (ref Department) | `Course.departmentId` | Was `department` string |
| `Course.programId` (ref Program) | `Course.programId` | New |
| `Course.instructorId` (ref Teacher) | `Course.instructorId` | Was ref User |
| `Attendance.departmentId` (ref Department) | `AttendanceRecord.departmentId` | New — alongside legacy `department` |
| `Program` (model) | `Program` | Full CRUD API service exists |
| `Faculty` (model) | `Faculty` | Full CRUD API service exists |
| `University` (single) | `University` | Only 4 endpoints: GET/POST/PUT/DELETE `/universities` (no :id) |

## University API (single-university pattern)

Only 4 endpoints — no `:id` params because there is exactly one university:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET /api/universities` | Auth | Returns the single university + stats |
| `POST /api/universities` | Admin | Create university + link seeded Admins |
| `PUT /api/universities` | Admin | Update university fields |
| `DELETE /api/universities` | Admin | Soft-delete university + cascade to Users + Campuses |

## Campus System

Backend behavior:
- Controller auto-resolves `universityId` from the single university
- Accepts flat address fields (`street`, `city`, `province`, `country`, `postalCode`) and maps them into nested `address`
- First created campus automatically becomes main (`isMainCampus`)
- Only one campus can be main — `updateCampus` blocks `isMainCampus: true` if another is already main (returns 400)
- Delete cascades soft-delete to Departments scoped to that campus
- Main campus cannot be deleted while other campuses exist

Frontend pages (separate pages, NOT modals):
- `/campuses` → `CampusesPage.tsx` — card grid list, search, dropdown actions
- `/campuses/create` → `CampusCreatePage.tsx`
- `/campuses/edit/:id` → `CampusEditPage.tsx`
- Shared form: `CampusForm.tsx` (mode: "create" | "edit") — disables main switch if another is already main

## Faculty System

Backend:
- `Faculty` model: `campusId` (ref Campus), `headId` (ref Teacher), soft-delete
- `Department` model: `facultyId` (ref Faculty) — was `faculty` string
- Controller validates campus/teacher, blocks duplicate name/code per campus, blocks delete if departments exist
- All routes require `auth + authorize("Admin")`

Frontend:
- `features/faculties.ts` — `FacultyAPI` class
- `FacultiesPage.tsx` — DataTable + KpiCards + modal form
- `DepartmentsPage.tsx` — faculty dropdown fetches real faculties from API

## What's NOT Done Yet (frontend)

- **Student pages** — left for later (student model not refactored yet)
- **Legacy `department` string** in some features — students, admissions, assignment, exam, book, fee, feeStructure, finance, hr, auth
- **Large page refactoring** — FeesPage, AdmissionsPage, TransportPage, AssignmentsPage, CoursesPage, HrPage, LibraryPage, ExamsPage, EventsPage, StudentsPage, TeachersPage, BatchesPage all still 1000+ lines
