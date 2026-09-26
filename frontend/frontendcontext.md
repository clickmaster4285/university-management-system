# Frontend Context

> **Last updated:** 2026-09-26 — page refactors (assignments/exams/events/library/transport)

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
├── styles.css           ← Global theme (CSS variables: --primary, --brand, gradient-brand)
├── components/          ← Shared UI (data-table, kpi-card, ui/*, student/*, staff/*)
├── features/            ← API service classes (one file per domain)
├── layouts/             ← PublicSiteLayout, AppLayout, sidebar.tsx
├── lib/                 ← auth.tsx, routeModules.ts, utils
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

**List page action pattern (Aug 2026):** KPI row → DataTable → filters → **View** (eye) + Edit (pencil) + Delete. View opens detail modal or navigates to profile page. Examples: `StudentsPage`, `StaffPage`, `FacultiesPage`, `CampusesPage`, `WorkforceLeavePage`.

**Interconnected navigation (Sep 2026):** University overview KPI cards navigate to list pages. Detail page stat cards navigate to related list pages with pre-applied filters using `useLocation().state`. List pages read location state on mount and set filters accordingly.

**Multi-campus/multi-faculty UI (Sep 2026):**
- **DepartmentForm** uses tabbed per-campus assignment UI (head, email, phone, location, status, establishedDate per campus)
- **DepartmentsPage** shows campus names and faculty names from arrays (no legacy scalar columns)
- **DepartmentDetailPage** shows per-campus assignment cards and faculty list
- **DepartmentViewModal** shows per-campus assignment cards
- **CampusForm** has staff selector for campus administrator (campusAdminId)
- **CampusDetailPage** shows campus administrator card
- **StaffMember interface** includes `primaryCampusId`, `primaryFacultyId`

**Refactored examples:**
- `DepartmentsPage.tsx` — list with `DepartmentViewModal`
- `CampusesPage.tsx` — card grid + view modal + `CampusForm` on create/edit routes
- `StudentsPage.tsx` — slim directory; profile at `/students/:id`
- `ApplicationsPipelinePage.tsx` — `/admissions` pipeline (monolith AdmissionsPage removed Sep 2026)

**Still pending refactor** (if any): none of the former 1000+ line campus/academic list pages — Transport, Assignments, Library, Exams, Events, Batches are split (Sep 2026).

## Routing

All routes in `App.tsx`. Pages are **lazy-loaded** with `React.lazy()`.

### Public site (`PublicSiteLayout`)

```
/                     → HomePage
/about                → AboutPage
/contact              → ContactPage
/apply                → ApplyPage
/apply/status         → ApplicationTrackPage
/landing              → Navigate to /
/login                → LoginPage (staff)
/forgot-password, /otp
```

### Staff portal (`AppLayout` — auth required)

Dashboard moved from `/` to `/dashboard`. Post-login redirect: `/dashboard`.

```
/dashboard            → DashboardPage
/university, /campuses, /campuses/create, /campuses/edit/:id
/faculties, /departments, /departments/create, /departments/edit/:id
/programs, /programs/:id/curriculum, /programs/:id/semester-fees
/subjects, /subjects/create, /subjects/edit/:id
/offerings, /semester-registrations, /challans
/academic-sessions, /academic-sessions/create, /academic-sessions/edit/:id, /academic-sessions/detail/:id
/batches, /batches/create, /batches/edit/:id
/admissions, /admissions/:id, /admissions/dossier/:id
/students, /students/:id, /students/:id/documents
/staff, /staff/create, /staff/:id, /staff/:id/documents
/workforce, /workforce/:id, /workforce/leaves, /workforce/attendance, /workforce/recruitment
/payroll, /payroll/:id, /access, /access/:id
/role-assignments, /attendance, /assignments, /exams, /online-classes
/library, /hostel, /transport, /events, /qr
/finance, /reports, /settings, /settings/roles, /settings/permission-audit
/ai, /notifications
```

**Removed routes:** `/courses` (legacy), `/hr` (legacy), `/` as dashboard (now public home).

## Theme & styling

All brand colors live in **`frontend/src/styles.css`** — not scattered per component.

| Token | Purpose |
|-------|---------|
| `--primary` | Buttons, links, active nav |
| `--brand`, `--brand-2` | `gradient-brand` utility (buttons, logos) |
| `--background`, `--foreground` | Page base |
| `--sidebar-*` | Sidebar colors |

**Current palette (Aug 2026):** warm stone neutrals + forest green primary + bronze/gold accent. Replaced earlier blue/purple theme.

Utilities: `gradient-brand`, `gradient-brand-text`, `gradient-mesh`, `glass`.

To change colors app-wide, edit `:root` and `.dark` in `styles.css` only.

## Navigation / Sidebar

`src/layouts/sidebar.tsx` contains the `AppSidebar` component with `sidebarNav` config array. Seven groups: Overview, Academic Structure, People, Academics, Assessments, Campus Facilities, Finance & Admin.

Groups are collapsible — each group label has a chevron arrow that toggles open/closed. Groups auto-expand when a child route is active. Adding a nav link means adding to the relevant `items` array in `sidebarNav`.

## API Services (`features/`)

Each file exports an interface for the entity and an API class/object. All use a shared Axios instance from `features/axios.ts` (base URL `/api`).

Key barrel export: `features/index.ts` re-exports everything.

### Updated Files (reflecting backend ref changes)

- **`features/departments.ts`** — `Department` interface: `campusIds[]`, `facultyIds[]`, `campusAssignments[]` (per-campus head, email, phone, location, establishedDate, status). Removed legacy scalar fields. `getAll` accepts `{ campusId?, facultyId?, status?, search?, page?, limit? }`.
- **`features/attendance.ts`** — `AttendanceRecord` has `departmentId` alongside legacy `department`. API methods use `departmentId` in query params and payloads.
- **`features/batches.ts`** — `getAll` accepts `departmentId` instead of `department`.
- **`features/subjects.ts`** — `Subject` interface + CRUD + stats + fee history API (Phase 1–3)
- **`features/offerings.ts`** — `CourseOffering`, `Enrollment`, `FeeSnapshot` + CRUD/enroll API (Phase 5)
- **`features/programSemesterFee.ts`** — `ProgramSemesterFeeSchedule` + generate/activate/refresh API (F2/F3)
- **`features/semesterRegistration.ts`** — `SemesterRegistration` + preview/create/drop/generateChallan API (F4/F5)
- **`features/feeChallan.ts`** — challan list, stats, record payment (F5)
- **`SubjectEditPage`** — tabs: Details (`SubjectForm`) + Fee History (`SubjectFeePanel`, grouped by program scope)
- **`features/programs.ts`** — Program CRUD + stats + `getCurriculum` / `updateCurriculum`
- **`features/faculties.ts`** — `Faculty` interface + `FacultyAPI` class with `getAll`, `getById`, `getStats`, `create`, `update`, `delete`.
- **`features/campus.ts`** — `Campus` interface includes `campusAdminId` (ref StaffMember).
- **`features/university.ts`** — Single-university pattern: `getUniversity()`, `createUniversity(data)`, `updateUniversity(data)`, `deleteUniversity()`.
- **`features/staffMembers.ts`** — includes `primaryCampusId`, `primaryFacultyId`
- **`features/studentApplications.ts`**, **`features/studentAdmissions.ts`** — admissions pipeline

### Removed (Sep 2026)

- `features/admissions.ts`, `features/courses.ts`, `pages/academics/admissions/AdmissionsPage.tsx`, `pages/landing/LandingPage.tsx`

### Still using legacy patterns

- Some large campus modules (Transport, Library, Events) — 1000+ line pages, not yet split
- Assignment/Exam forms store subject code strings, not `offeringId` (Phase 6 paused)

## Students & admissions (Aug 2026 — ✅)

| Route | Page | Module |
|-------|------|--------|
| `/apply` | ApplyPage | public |
| `/apply/status` | ApplicationTrackPage | public |
| `/admissions` | ApplicationsPipelinePage | `admissions` |
| `/admissions/:id` | ApplicationReviewPage | `admissions` |
| `/admissions/dossier/:id` | AdmissionDossierPage + AdmissionDocumentsPanel | `admissions` |
| `/students` | StudentsPage (directory) | `students` |
| `/students/:id` | StudentProfilePage + StudentModuleLinks | `students` |
| `/students/:id/documents` | StudentDocumentsPage | `students` |

API: `features/students.ts`, `features/studentApplications.ts`, `features/studentAdmissions.ts`

Components:
- `components/student/StudentModuleLinks.tsx` — profile quick links
- `components/student/StudentDocumentSlots.tsx` — per-type upload slots

Documents optional for dossier completion (matches backend `REQUIRED_DOCUMENT_TYPES = []`).

## Auth

`src/lib/auth.tsx` provides `AuthProvider` and `useAuth()` hook. JWT in `localStorage` (`token`, `user`, `universityId`).

**Auth is handled by AppLayout** — redirects to `/login` if not authenticated. Public routes use `PublicSiteLayout` (no auth).

Post-login redirect: `/dashboard` (not `/`).

## Staff, workforce & permissions (Aug 2026 — ✅)

| Route | Page | Module key |
|-------|------|------------|
| `/staff` | StaffPage | `staff` |
| `/staff/:id` | StaffEditPage | `staff` |
| `/staff/:id/documents` | StaffDocumentsPage | `staff` |
| `/workforce` | WorkforcePage (hub) | `hr` |
| `/workforce/:id` | WorkforceSchedulePage | `hr` |
| `/workforce/leaves` | WorkforceLeavePage | `hr` |
| `/workforce/attendance` | WorkforceAttendancePage | `hr` |
| `/workforce/recruitment` | WorkforceRecruitmentPage | `hr` |
| `/payroll`, `/payroll/:id` | PayrollPage, StaffPayrollPage | `finance` |
| `/access`, `/access/:id` | AccessPage, StaffAccessPage | `staff` |
| `/settings/permission-audit` | PermissionAuditPage | `settings` |

Legacy `/hr` removed. Staff profile shows `StaffModuleLinks` cards to related modules.

Sidebar groups: Overview · Governance · Academic Catalog · HR & Staff · Students · Academic Operations · Assessments · Campus Services · Finance · Settings.

Route guards: `lib/routeModules.ts` + `components/ModuleRoute.tsx` + sidebar `hasModuleAccess`.

API: `features/staffMembers.ts` (StaffMember includes `primaryCampusId`, `primaryFacultyId`), `features/workforce.ts`, `features/platformRoles.ts`

Staff documents: `StaffDocumentsPanel` — uploads to `uploads/hr/{staffId}/{documentType}/`

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
| `Department.campusIds[]` / `facultyIds[]` / `campusAssignments[]` | same | Multi-campus / multi-faculty |
| `Campus.campusAdminId` (ref StaffMember) | `Campus.campusAdminId` | Campus administrator |
| `StaffMember.primaryCampusId` / `primaryFacultyId` | same | Quick filters |
| `CourseOffering.instructorId` (ref StaffMember) | `CourseOffering.instructorId` | Academic instructor |
| `Attendance.departmentId` (ref Department) | `AttendanceRecord.departmentId` | Alongside legacy `department` string |
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
- `Faculty` model: `campusIds[]` + `campusAssignments[]` (global; spans campuses), soft-delete
- Controller validates campuses, soft-deletes
- All routes require `auth + authorize("Admin")`

Frontend:
- `features/faculties.ts` — `FacultyAPI` class
- `FacultiesPage.tsx` — KPI cards + DataTable (search, campus/status filters) + create/edit modal (portal)

## Department System

Backend (updated):
- `Department` model: `campusIds[]`, `facultyIds[]`, `campusAssignments[]`, soft-delete
- Controller: soft delete, blocks delete if programs/subjects/batches linked
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

## List pages with View button (Aug 2026)

| Page | View action |
|------|-------------|
| StudentsPage | Navigate to `/students/:id` |
| StaffPage | Navigate to `/staff/:id` |
| CampusesPage | View modal on card |
| FacultiesPage | View modal |
| WorkforcePage | Navigate to `/workforce/:id` |
| WorkforceLeavePage | View modal |
| PayrollPage | Navigate to `/payroll/:id` |
| AccessPage | Navigate to `/access/:id` |
| DepartmentsPage, BatchesPage, AcademicSessionsPage | View modals (existing) |

## Implementation status summary

### ✅ Done (frontend)

| Area | Status |
|------|--------|
| Public website (`/`, About, Contact, Apply) | ✅ |
| Staff portal at `/dashboard` + all module routes | ✅ |
| Student intake UI (apply, pipeline, dossier, directory) | ✅ |
| Staff distributed modules (staff, workforce, payroll, access) | ✅ |
| Permissions UI (roles, module guards, sidebar filter) | ✅ |
| View buttons on key list pages | ✅ |
| Global theme refresh (forest green, not blue) | ✅ |
| Document upload slots (student + admission) | ✅ |
| Interconnected KPI navigation (Sep 2026) | ✅ |
| Session detail page with linked batches (Sep 2026) | ✅ |
| Batch list session filter + pre-filter from session detail | ✅ |

### ⏳ Not done / remains (frontend)

| Item | Priority | Notes |
|------|----------|-------|
| Student portal (logged-in student) | ✅ Done | `StudentPortalLayout` + `/student/*` + `studentPortalAPI` |
| Leave quota admin UI | ✅ Done | `WorkforceLeavePage` quotas + staff deep-link `?staffId=` |
| Recruitment resume upload UI | ✅ Done | CV upload/download on `WorkforceRecruitmentPage` |
| Phase A manual verification | ✅ Done | `backend/scripts/verifyPhaseA.js` |
| Large page refactors | ✅ Done | Transport, Assignments, Library, Exams, Events split Sep 2026 |
| Phase 6 — offeringId in Assignment/Exam forms | Paused | |

**Removed Sep 2026:** `AdmissionsPage.tsx`, `features/admissions.ts`, `LandingPage.tsx`, `features/courses.ts`.

### Next frontend tasks (recommended)

1. Phase 6 when resumed: offering picker stores `offeringId` on records
2. Optional: grades/attendance in student portal after Phase 6

### Student portal (Sep 2026)

- Login: `role === 'Student'` → `/student`; `AppLayout` redirects Students away
- Pages: home, registrations, fees, profile under `/student`
- Staff: dossier complete shows temp password; student profile “Enable portal login”

## UI Components

- `components/data-table.tsx` — `DataTable<T>` with `Column<T>[]`, search, filters, add button
- `components/dashboard/kpi-card.tsx` — `KpiCard` for stats (`label`, `icon`, optional `tone`)
- `components/ui/*` — shadcn/ui primitives
- `layouts/PublicSiteLayout.tsx` — public site shell
- `layouts/AppLayout.tsx` — staff portal shell (auth + sidebar + topbar)
