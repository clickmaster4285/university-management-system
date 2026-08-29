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

## UX & performance principles

Features must be **easy to use, easy to follow, and easy to understand**.

- **Group by context** — e.g. fee history per program (header + table), not one flat mixed list
- **One clear flow** — list → create/edit route → shared form; tabs only when two concerns belong together (Subject details + fees)
- **Labels that explain scope** — "Default rate", "Program override", "Active / Closed", effective date ranges
- **KPIs match what the user is viewing** — default rate KPIs on fee tab, not ambiguous "current" across all programs
- **Loading & errors** — spinner while fetching, toast on failure, empty states with next step ("Add the first rate")
- **Efficiency** — lazy-loaded pages, fetch only what the view needs, `useMemo` for grouped/sorted lists, avoid duplicate API calls on mount

When adding a page, match **Academic CRUD UI Pattern** below before inventing new layouts.

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
├── DepartmentsPage.tsx              ← List: KPIs + DataTable + filters + view modal
├── DepartmentCreatePage.tsx         ← Thin wrapper → DepartmentForm mode="create"
├── DepartmentEditPage.tsx           ← Loads by id → DepartmentForm mode="edit"
├── DepartmentForm.tsx             ← Shared create/edit form (single source of truth)
└── DepartmentViewModal.tsx        ← Read-only detail view
```

**Rules:**
- Main list page owns table state, filters, and navigation to create/edit routes
- Create/edit use **separate routes** + **one shared form component** (see Campus and Department patterns)
- Sub-components receive props (data + callbacks) — they are stateless or manage only UI-local state
- Types and constants live in the form component file that uses them
- Sub-components are exported as named exports, re-imported by the main page

**Refactored examples:**
- `DepartmentsPage.tsx` — list aligned with Faculties (KPI cards, DataTable search/filters, icon actions)
- `CampusesPage.tsx` — card grid + `CampusForm.tsx` on `/campuses/create` and `/campuses/edit/:id`

**Still pending refactor** (500+ lines): FeesPage (2530), AdmissionsPage (1520), TransportPage (1513), AssignmentsPage (1466), CoursesPage (1331), HrPage (1287), LibraryPage (1198), ExamsPage (1198), EventsPage (1185), StudentsPage (1183), TeachersPage (1046), BatchesPage (1043).

## Routing

All routes are defined in `App.tsx` using React Router DOM `<Routes>`. Pages are **lazy-loaded** with `React.lazy()`.

Routes sit under `<AppLayout />` (which handles auth + sidebar + topbar + renders `<Outlet />`):

```
/                   → DashboardPage
/login              → LoginPage
/otp                → OtpPage
/university         → UniversityProfilePage
/campuses           → CampusesPage
/campuses/create    → CampusCreatePage
/campuses/edit/:id  → CampusEditPage
/faculties          → FacultiesPage
/ai                 → AiAssistantPage
/notifications      → NotificationsPage
/admissions         → AdmissionsPage
/departments        → DepartmentsPage
/departments/create → DepartmentCreatePage
/departments/edit/:id → DepartmentEditPage
/programs           → ProgramsPage
/programs/create    → ProgramCreatePage
/programs/edit/:id  → ProgramEditPage
/programs/:id/curriculum → ProgramCurriculumPage (semester subject plan)
/subjects           → SubjectsPage
/subjects/create    → SubjectCreatePage
/subjects/edit/:id  → SubjectEditPage
/offerings          → OfferingsPage (Phase 5 — course offerings + enrollments)
/courses            → CoursesPage (legacy — remove in Phase 8)
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

`src/layouts/sidebar.tsx` contains the `AppSidebar` component with `sidebarNav` config array. Seven groups: Overview, Academic Structure, People, Academics, Assessments, Campus Facilities, Finance & Admin.

Groups are collapsible — each group label has a chevron arrow that toggles open/closed. Groups auto-expand when a child route is active. Adding a nav link means adding to the relevant `items` array in `sidebarNav`.

## API Services (`features/`)

Each file exports an interface for the entity and an API class/object. All use a shared Axios instance from `features/axios.ts` (base URL `/api`).

Key barrel export: `features/index.ts` re-exports everything.

### Updated Files (reflecting backend ref changes)

- **`features/teachers.ts`** — `Teacher` interface: `userId` (ref User), `departmentId` (ref Department). Removed `coursesTeaching`. `getAll` accepts `{ departmentId?, designation?, status?, search?, page?, limit? }`. No `bulkCreate` — teacher creation auto-creates User on backend.
- **`features/departments.ts`** — `Department` interface: `campusId`, `headId`, `facultyId` refs. `getAll` accepts `{ campusId?, facultyId?, status?, search?, page?, limit? }`. Stats use `status` (not `isActive`).
- **`features/courses.ts`** — `Course` interface: `departmentId` (ref Department), `programId` (ref Program), `instructorId` (ref Teacher). All filter methods use `departmentId`. `CourseFilters` uses `departmentId`/`programId`.
- **`features/attendance.ts`** — `AttendanceRecord` has `departmentId` alongside legacy `department`. API methods use `departmentId` in query params and payloads.
- **`features/batches.ts`** — `getAll` accepts `departmentId` instead of `department`.
- **`features/subjects.ts`** — `Subject` interface + CRUD + stats + fee history API (Phase 1–3)
- **`features/offerings.ts`** — `CourseOffering`, `Enrollment`, `FeeSnapshot` + CRUD/enroll API (Phase 5)
- **`SubjectEditPage`** — tabs: Details (`SubjectForm`) + Fee History (`SubjectFeePanel`, grouped by program scope)
- **`features/programs.ts`** — Program CRUD + stats + `getCurriculum` / `updateCurriculum`
- **`features/faculties.ts`** — `Faculty` interface + `FacultyAPI` class with `getAll`, `getById`, `getStats`, `create`, `update`, `delete`.
- **`features/campus.ts`** — `campusAPI.getAll()` (no params needed), `.getById(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`. No separate `setMain` — uses `update(id, { isMainCampus: true })`.
- **`features/university.ts`** — Single-university pattern: `getUniversity()`, `createUniversity(data)`, `updateUniversity(data)`, `deleteUniversity()`.

### Still using legacy `department` string (not yet updated)

- `features/students.ts`, `features/admissions.ts`, `features/assignment.ts`, `features/exam.ts`, `features/book.ts`, `features/fee.ts`, `features/feeStructure.ts`, `features/finance.ts`, `features/hr.ts`, `features/auth.ts` — these still reference a `department: string` field. Students model itself is left for later per user request.

## Auth

`src/lib/auth.tsx` provides `AuthProvider` and `useAuth()` hook. Stores JWT in `localStorage` under `token`. User object stored in `localStorage` under `user`. Also stores `universityId` separately.

Roles defined in frontend: `'Super Admin' | 'Admin' | 'Teacher' | 'Student' | 'Student Affairs' | 'Finance' | 'Transport' | 'Library' | 'HR'` — but backend only has `Admin`, `Teacher`, `Student`, `Staff`.

**Auth is handled by AppLayout** — pages do NOT need to check authentication. AppLayout redirects to `/login` if user is not authenticated. Pages that need the `user` object (e.g., for form defaults) can call `useAuth()` directly — but no auth guard logic is needed.

## UI Components

- `components/data-table.tsx` — `DataTable<T>` generic table with `Column<T>[]` config (uses `cell` not `render`). Supports `searchKeys`, `filterPanel`, `hideSearch`, `addLabel`/`onAdd`. Filter button only shows when `filterPanel` is passed. Create button shows when `title`/`description`/`addLabel`/`actions` provided.
- `components/dashboard/kpi-card.tsx` — `KpiCard` for stats display (uses `label` not `title`, `icon: LucideIcon`)
- `components/ui/*` — shadcn/ui primitives (Badge, Button, Input, Label, Dialog, etc.)
- `layouts/AppLayout.tsx` — auth check + SidebarProvider + AppSidebar + Topbar + `<Outlet />`. Pages render directly without wrappers.

## Page Conventions

- Each page is a default-exported component
- Pages manage their own state (no shared store)
- **List pages** (Faculty, Department): KPI cards → DataTable with built-in search + filter panel → icon actions
- **CRUD with forms**: use separate routes + shared form component (Campus, Department pattern) — not modals
- Large pages (>500 lines) split into sub-folder or separate form/page files
- Department/teacher/faculty dropdowns: fetch list on mount, render as `<select>` in forms; filter faculties by campus when relevant
- Pages do NOT wrap content in any layout component — AppLayout handles the shell

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
- Controller validates campus/teacher, blocks duplicate name/code per campus, soft-deletes
- All routes require `auth + authorize("Admin")`

Frontend:
- `features/faculties.ts` — `FacultyAPI` class
- `FacultiesPage.tsx` — KPI cards + DataTable (search, campus/status filters) + create/edit modal (portal)

## Department System

Backend (updated):
- `Department` model: `campusId`, `facultyId`, `headId`, `status` Active/Inactive, soft-delete
- Controller: validates faculty same campus, soft delete, blocks delete if programs/courses/teachers/batches linked
- List API: `campusId`, `facultyId`, `status`, `search`, pagination
- All routes require `auth + authorize("Admin")`

Frontend:
- `features/departments.ts` — aligned with backend (`status` filter, stats)
- `DepartmentsPage.tsx` — matches Faculties layout (KPI, DataTable search/filters, icon actions, view modal)
- `/departments/create`, `/departments/edit/:id` — shared `DepartmentForm.tsx`

## Program System

Backend:
- `Program` model: `departmentId`, `code` (globally unique), `degreeLevel`, `duration`, `totalCredits`, `status`, soft-delete
- Controller: soft delete, explicit field updates, delete guards (courses/batches), stats API, duplicate code 409

Frontend:
- `features/programs.ts` — full CRUD API + stats
- `/programs` — list with KPI cards, DataTable search/filters (department, degree level, status), icon actions
- `/programs/create`, `/programs/edit/:id` — shared `ProgramForm.tsx`

## What's NOT Done Yet (frontend)

- **Student pages** — left for later (student model not refactored yet)
- **Legacy `department` string** in some features — students, admissions, assignment, exam, book, fee, feeStructure, finance, hr, auth
- **Large page refactoring** — FeesPage, AdmissionsPage, TransportPage, AssignmentsPage, CoursesPage, HrPage, LibraryPage, ExamsPage, EventsPage, StudentsPage, TeachersPage, BatchesPage all still 1000+ lines
