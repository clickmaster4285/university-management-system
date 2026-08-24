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

## Routing

All routes are defined in `App.tsx` using React Router DOM `<Routes>`. Pages are **lazy-loaded** with `React.lazy()`.

Routes sit under `<AppLayout />` (which renders sidebar + `<Outlet />`):

```
/                   → DashboardPage
/university         → UniversityProfilePage
/campuses           → CampusesPage
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

- **`features/teachers.ts`** — `Teacher` interface: `userId` (ref User), `departmentId` (ref Department). Removed `coursesTeaching`. `getAll` accepts `{ departmentId?, designation?, status?, search?, page?, limit? }`. No `bulkCreate` —教师 creation auto-creates User on backend.
- **`features/departments.ts`** — `Department` interface: `campusId` (ref Campus), `headId` (ref Teacher). `getAll` accepts optional `campusId` param.
- **`features/courses.ts`** — `Course` interface: `departmentId` (ref Department), `programId` (ref Program), `instructorId` (ref Teacher). All filter methods use `departmentId`. `CourseFilters` uses `departmentId`/`programId`.
- **`features/attendance.ts`** — `AttendanceRecord` has `departmentId` alongside legacy `department`. API methods use `departmentId` in query params and payloads.
- **`features/batches.ts`** — `getAll` accepts `departmentId` instead of `department`.
- **`features/programs.ts`** — NEW file. `Program` interface + `ProgramAPI` class with `getAll`, `getById`, `getStats`, `create`, `update`, `delete`.

### Still using legacy `department` string (not yet updated)

- `features/students.ts`, `features/admissions.ts`, `features/assignment.ts`, `features/exam.ts`, `features/book.ts`, `features/fee.ts`, `features/feeStructure.ts`, `features/finance.ts`, `features/hr.ts`, `features/auth.ts` — these still reference a `department: string` field. Students model itself is left for later per user request.

## Auth

`src/lib/auth.tsx` provides `AuthProvider` and `useAuth()` hook. Stores JWT in `localStorage` under `token`. User object stored in `localStorage` under `user`. Also stores `universityId` separately.

Roles defined in frontend: `'Super Admin' | 'Admin' | 'Teacher' | 'Student' | 'Student Affairs' | 'Finance' | 'Transport' | 'Library' | 'HR'` — but backend only has `Admin`, `Teacher`, `Student`, `Staff`.

## UI Components

- `components/data-table.tsx` — `DataTable<T>` generic table with `Column<T>[]` config
- `components/dashboard/kpi-card.tsx` — `KpiCard` for stats display
- `components/ui/*` — shadcn/ui primitives (Badge, Button, Input, Label, Dialog, etc.)
- `layouts/AppLayout.tsx` — wraps sidebar + main content area

## Page Conventions

- Each page is a default-exported component
- Pages manage their own state (no shared store)
- CRUD pages follow: fetch data → display in DataTable → modal form for create/edit → toast for feedback
- Department dropdowns: fetch departments list, render as `<select>` in form modals
- Teacher/program dropdowns: same pattern — fetch list, render select

## Key Backend→Frontend Field Mapping

| Backend Model Field | Frontend `features/*.ts` Field | Notes |
|---|---|---|
| `Teacher.userId` (ref User) | `Teacher.userId` | Populated on read |
| `Teacher.departmentId` (ref Department) | `Teacher.departmentId` | Was `department` string |
| `Department.campusId` (ref Campus) | `Department.campusId` | New — required on create |
| `Department.headId` (ref Teacher) | `Department.headId` | New — optional |
| `Course.departmentId` (ref Department) | `Course.departmentId` | Was `department` string |
| `Course.programId` (ref Program) | `Course.programId` | New |
| `Course.instructorId` (ref Teacher) | `Course.instructorId` | Was ref User |
| `Attendance.departmentId` (ref Department) | `AttendanceRecord.departmentId` | New — alongside legacy `department` |
| `Program` (new model) | `Program` | Full CRUD API service exists |
| `University` (single) | `University` | Only 4 endpoints: GET/POST/PUT/DELETE `/universities` (no :id) |

## University API (single-university pattern)

Only 4 endpoints — no `:id` params because there is exactly one university:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET /api/universities` | Auth | Returns the single university + stats (campusCount, userCount, role counts) |
| `POST /api/universities` | Admin | Create university + link seeded Admins. **No user/token created.** |
| `PUT /api/universities` | Admin | Update university fields |
| `DELETE /api/universities` | Admin | Soft-delete university + cascade to Users + Campuses |

Frontend API (`features/university.ts`): `getUniversity()`, `createUniversity(data)`, `updateUniversity(data)`, `deleteUniversity()`. Legacy compat wrappers (`getUniversities`, `getUniversityById`, `updateUniversityById`) redirect to the single-university versions.

`UniversityProfilePage.tsx` only handles creation (no admin account fields — admin is pre-seeded).

## What's NOT Done Yet (frontend)

- **DepartmentsPage** — campusId/headId form fields added, but view modal may still reference `dept.head`
- **TeachersPage** — needs departmentId dropdown, remove bulk create UI
- **CoursesPage** — needs departmentId/programId dropdowns, remove hardcoded program list
- **AttendancePage** — needs department filter changed to departmentId dropdown
- **BatchesPage** — needs department filter changed to departmentId dropdown
- **Student pages** — left for later (student model not refactored yet)
- **Compilation verification** — not yet run `npx tsc --noEmit` after all changes
