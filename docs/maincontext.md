# UniversityMS — Master Project Context

> **Purpose of this file:** Single source of truth for anyone (or any AI session) working on this codebase. Read this first. It tracks vision, what is built, what is deferred, what to do, what not to do, and the roadmap.  
> **Last updated:** 2026-09-28 — Phase 6 offerings wired; academic-architecture-plan refreshed  
> **Detailed academic spec:** `academic-architecture-plan.md`  
> **Fees, sessions, batches & offerings flow:** `fee-plan.md`  
> **Implementation details:** `backend/backendcontext.md`, `frontend/frontendcontext.md`

---

## 1. What is this software?

**UniversityMS** (ScholarOS) is a full university management system:

| Domain | Examples |
|--------|----------|
| **Governance** | University profile, campuses, faculties, departments |
| **Academics** | Programs, subjects, curriculum, batches, sessions, offerings, enrollments |
| **People** | Students, teachers/professors, admissions |
| **Teaching** | Assignments, exams, attendance, online classes |
| **Operations** | Fees, finance, HR, payroll, reports, settings |
| **Campus** | Library, hostel, transport, events, QR |

**Stack:** React 19 + Vite + TypeScript (frontend) · Node/Express + MongoDB (backend) · JWT auth with roles.

---

## 2. The academic ladder (mental model)

```
University
  └── Campus
        ├── Faculty              ← can span multiple campuses via campusIds[]
        │     └── campusAssignments[]  ← per-campus head, email, phone, status
        └── Department           ← can span multiple campuses AND multiple faculties
              ├── campusIds[]           ← which campuses
              ├── campusAssignments[]   ← per-campus head, email, phone, location, status
              ├── facultyIds[]          ← which faculties (interdisciplinary)
              ├── Subject          ← catalog (what can be taught)
              ├── Program            ← degree (BSCS, BSSE, …)
              │     ├── ProgramCurriculum   ← which subjects, which semester
              │     └── ProgramSemesterFeeSchedule  ← semester fee package (F2)
              ├── SubjectFeeHistory         ← versioned fee rates
              ├── SemesterRegistration      ← student semester package (F4)
              └── CourseOffering            ← one running class
                    └── Enrollment          ← student registered + fee locked

Teacher  → assigned to CourseOffering (instructor)
Student  → belongs to Program + Batch → enrolls in offerings
StaffMember → primaryCampusId, primaryFacultyId for quick filtering
Campus   → campusAdminId (ref StaffMember) for campus administrator
```

**Plain language:**

- **Subject** = the course on paper (CSC101, 3 credits). Created once, reused everywhere.
- **Program curriculum** = the degree plan (“BSCS semester 3 includes CSC201”).
- **Subject fee history** = what it costs over time (default rate + optional program override).
- **Course offering** = the actual class running this session for a specific batch.
- **Enrollment** = a student in that class, with a **frozen fee snapshot** at registration.

Legacy **`Course`** model has been **removed** (2026-08-29). Use **Subject** + **Offering** + **Enrollment** only.

---

## 3. Course Offering — simple explanation

### Real-world analogy

Think of a **recipe book** vs **a class in session**:

| Concept | Like… | In the system |
|---------|--------|----------------|
| **Subject** | Recipe in the book (“Chocolate Cake — 3 steps”) | CSC101 exists in catalog, 3 credits |
| **Curriculum** | Which recipes are in the BSCS meal plan, semester 1 | BSCS sem 1 includes CSC101 |
| **Offering** | **Today** you are actually baking that cake for Batch 2024 in Room 204 | CSC101 running this term for that batch |
| **Enrollment** | Ali signed up for today’s baking class; bill locked at signup | Student in that class + fee frozen |

**Subject** = on paper, forever.  
**Offering** = happening **right now** (this batch, this session, this teacher).

### One concrete example

1. You create **Subject** `CSC101 — Programming` (once).
2. You add it to **BSCS curriculum**, semester 1.
3. You set **fee**: 5000/credit (in Subject Fee History).
4. **September 2025**: Admin creates an **Offering**:
   - Subject: CSC101  
   - Program: BSCS  
   - Batch: 2024  
   - Session: Fall 2025  
   - Teacher: Dr. Khan  
   - Seats: 30  
5. Student **Ali enrolls** → system saves fee snapshot (5000 × 3 credits = 15000). That amount never changes for Ali’s registration even if fees rise next year.

### What you do in the UI

**Academics → Offerings** → **New Offering** → pick program, semester, subject, batch, session → save.  
Click **Enrollments** on a row → add students.

### What it is NOT

- Not the subject catalog (that’s **Subjects**).
- Not the degree plan (that’s **Program Curriculum**).
- Not the fee table (that’s **Subject Fee History** on each subject).

---

## 3b. Course Offering — technical detail

> “CSC101 for BSCS Batch 2024, Fall 2025 session, semester 1, taught by Dr. Khan, room 204, max 30 seats.”

### Data on an offering

| Field | Meaning |
|-------|---------|
| `subjectId` | Which subject is being taught |
| `programId` | Which degree track |
| `batchId` | Which student cohort |
| `academicSessionId` | Which academic year/term (e.g. Fall 2025) |
| `semester` | Program semester number (1, 2, 3…) |
| `instructorId` | Teacher assigned (optional) |
| `schedule` | Day, time, room |
| `capacity` / `enrolledStudents` | Seat limit and current count |
| `status` | Draft · Active · Completed · Cancelled |

**No fee on the offering.** Fees are resolved when a student enrolls.  
**Full fee strategy (sessions, batches, both registration modes):** see **`fee-plan.md`**.

### Prerequisites before Offerings

You must have **Academic Sessions** and **Batches** first. See **`fee-plan.md` §3–4** for the step-by-step flow.

### Creating an offering (rules)

1. Subject must exist in **ProgramCurriculum** for that program + semester.
2. Batch must belong to the selected program.
3. Only **one offering per subject + batch + session** (no duplicates).
4. Admin creates via **Academics → Offerings** or `POST /api/offerings`.

### Enrollment and fee snapshot

When a student enrolls (`POST /api/offerings/:id/enroll`):

1. System checks: offering is **Active**, student is **Active**, seats available, not already enrolled.
2. System reads **SubjectFeeHistory** as of today:
   - Try program-specific rate first → fall back to default rate.
3. System builds **`feeSnapshot`** (immutable):

```js
{
  subjectFeeHistoryId,  // which rate row was used
  feePolicy: "current_rate",
  credits,
  feePerCredit,
  totalFee,             // feePerCredit × credits
  feeType,
  academicSessionId,
  lockedAt              // registration date
}
```

4. Enrollment is saved. `enrolledStudents` on the offering increments.

**Why snapshot?** If fees increase next year, this student’s Semester 1 bill does not change. Each new semester registration gets a **new** snapshot at that time.

### What offerings connect to today

| Connected | Status |
|-----------|--------|
| Subject, Program, Batch, Session, Teacher | ✅ Yes |
| Enrollment + fee snapshot | ✅ Yes |
| Assignments, Exams | ✅ Linked via `offeringId` (+ legacy course strings kept) |
| Attendance | ✅ Per-offering marks; roster from Enrollment |

### API quick reference

| Method | Path |
|--------|------|
| GET | `/api/offerings` |
| GET | `/api/offerings/stats` |
| POST | `/api/offerings` |
| PUT | `/api/offerings/:id` |
| DELETE | `/api/offerings/:id` |
| GET | `/api/offerings/:id/enrollments` |
| POST | `/api/offerings/:id/enroll` |
| DELETE | `/api/offerings/:id/enroll/:studentId` |

### UI

- **Route:** `/offerings`
- **Legacy:** `/courses` — old monolithic UI; do not use for new work.

---

## 4. Implementation status (academic rebuild)

| Phase | Work | Status |
|-------|------|--------|
| **1** | Subject catalog + `/subjects` UI | ✅ Done |
| **2** | ProgramCurriculum + curriculum UI | ✅ Done |
| **3** | SubjectFeeHistory + fee timeline UI | ✅ Done |
| **4** | Migrate legacy Course data | ⏭ Skipped — use `npm run seed:academic` |
| **5** | CourseOffering + Enrollment + feeSnapshot | ✅ Done |
| **5b** | ProgramSemesterFeeSchedule (F2) + Semester Fees UI (F3) + SemesterRegistration (F4) | ✅ Done |
| **6** | Wire Assignments / Exams / Attendance to `offeringId` | ✅ Done (staff modules, Sep 2026) |
| **7** | BatchFeePolicy, FeeAdjustment (optional) | 📋 Future |
| **8** | Deprecate legacy `Course` | ✅ Done (Aug 2026) |

### Interconnectivity & navigation (Sep 2026 — ✅)

- **`KpiCard`** is now clickable: accepts optional `onClick`, shows pointer cursor when active.
- **`/university`** overview KPI cards navigate to their list pages:
  - Campuses → `/campuses`
  - Faculties → `/faculties`
  - Departments → `/departments`
  - Programs → `/programs`
  - Students → `/students`
  - Teachers/Staff → `/staff`
  - Admins → `/access`
- **Detail page stat cards** navigate with pre-filters via `useLocation` state:
  - Campus detail → Faculties/Departments pre-filtered by campus
  - Faculty detail → Departments pre-filtered by faculty
  - Department detail → Programs/Subjects/Batches pre-filtered by department
- **List pages** (`FacultiesPage`, `DepartmentsPage`, `ProgramsPage`, `SubjectsPage`, `BatchesPage`) read `location.state` and auto-apply filters on navigation.

### Session detail page (Sep 2026 — ✅)

- **Route:** `/academic-sessions/detail/:id`
- **Page:** `SessionDetailPage` — shows session info + linked batches
- **Batch link:** batches filtered by `admissionSessionId`; "View all batches" navigates to `/batches` with session pre-filter
- **View button:** added to `AcademicSessionsPage` table rows

### Structural improvements — multi-campus/faculty (Sep 2026 — ✅)

**Issue 1: Faculty multi-campus**
- Faculty model: `campusIds[]` array, `campusAssignments[]` per-campus (headId, email, phone, establishedDate, status)
- Faculty is **global** (no scalar `campusId`). Global name+code uniqueness.
- Frontend `CampusesPage`: Faculty column shows campus names (multi-campus UI)
- Fixed `generateFacultyId` counter for global uniqueness + retry logic

**Issue 2: Department multi-faculty**
- Department model: `facultyIds[]` array (interdisciplinary departments)
- Controller validates refs; frontend has multi-select
- Department detail page shows faculties

**Issue 2b: Department multi-campus**
- Department model: `campusIds[]` + `campusAssignments[]` (per-campus head, email, phone, location, establishedDate, status)
- **Legacy scalar fields removed** from model, controller, and frontend types
- `syncCampusAssignments` auto-syncs when campusIds changes
- Department code globally unique; name uniqueness checked across overlapping campus sets

**Issue 3: Campus admin**
- Campus model: `campusAdminId` ref to StaffMember
- Controller populates `campusAdminId` in CRUD
- CampusForm has staff selector for campus administrator
- CampusDetailPage shows campus administrator card

**Issue 4: Staff primary campus/faculty**
- StaffMember model: `primaryCampusId`, `primaryFacultyId`
- Controller `populateStaff` populates both
- Frontend StaffMember interface updated with these fields

**Issue 5: Batch/session navigation (already done)**
- Session detail lists batches
- Batch list has session filter

### Seeding

```bash
cd backend
npm run seed:academic:dry   # preview
npm run seed:academic       # apply (idempotent)
```

Creates: University → Campus → Faculty → Department → Program → Subject → ProgramCurriculum → SubjectFeeHistory.

Startup seeds **admin only** (`seedDefaultAdmin`). Legacy `seedCourses` removed.

---

## 5. People, permissions & workforce — current state

### StaffMember (single source of truth)

One `StaffMember` record per employee. UI is **distributed** across modules:

| Module | Route | Purpose |
|--------|-------|---------|
| Staff Directory | `/staff`, `/staff/:id` | Profile, employment, link cards |
| Workforce | `/workforce`, `/workforce/:id` | Work schedules |
| Leave management | `/workforce/leaves` | Requests & approvals |
| Staff attendance | `/workforce/attendance` | Present/late/absent vs schedule |
| HR documents | `/staff/:id/documents` | CNIC, contracts, appointment letters |
| Payroll | `/payroll`, `/payroll/:id` | Compensation & payroll history |
| Portal access | `/access`, `/access/:id` | Login role + per-user module access |
| Role assignments | `/role-assignments` | Scoped duties (HOD, exam controller, etc.) |

Legacy `/hr` page and Employee-centric HR UI removed. **`Employee` and `Leave` models removed (Sep 2026)** — dashboard/reports use `StaffMember` / `StaffLeave`.

### Platform roles & module permissions (Phase A — ✅ verified 2026-09-25)

| Piece | Status |
|-------|--------|
| `PlatformRole` model + CRUD | ✅ |
| `/settings/roles` — create/edit/delete, restore defaults, **Apply to all users** | ✅ |
| `requireModule()` on all API routes via `apiRouteModules.js` | ✅ |
| Frontend `ModuleRoute` + sidebar filtered by `moduleAccess` | ✅ |
| Admin seed — `primaryRole: System Admin` + full module access | ✅ |
| Test users (`SEED_TEST_USERS=true`) | ✅ finance@, faculty@, hr@scholaros.test |
| **Manual verification** (role logins + apply templates) | ✅ `scripts/verifyPhaseA.js` |

**Module keys:** `dashboard`, `governance`, `academic_catalog`, `academic_ops`, `assessments`, `admissions`, `students`, `staff`, `library`, `hostel`, `transport`, `events`, `finance`, `hr`, `reports`, `settings`

**Re-verify:** `cd backend && node scripts/verifyPhaseA.js` (backend must be running).

### Workforce & HR documents (Phase B — ✅)

| Piece | Status |
|-------|--------|
| `StaffLeave` — requests, approve/reject | ✅ |
| `StaffAttendance` — mark attendance, late minutes vs `workSchedule` | ✅ |
| `StaffDocument` — upload/list/download/delete | ✅ |
| Organized uploads under `backend/uploads/` | ✅ |

**Upload path pattern:**

```
uploads/hr/{staffId}/{documentType}/{staffId}_{documentType}_{documentName}_{timestamp}.ext
```

Example: `uploads/hr/stf-0001/cnic/stf-0001_cnic_front_1730000000000.pdf`

Document types: `cnic`, `contract`, `appointment_letter`, `qualification`, `experience_letter`, `salary_slip`, `other`

Files are served at `/uploads/...` (static). Download API requires auth.

### User roles (auth layer)

`User.role`: **Admin** · **Teacher** · **Student** · **Staff** (legacy JWT field)

`User.primaryRole` + `User.moduleAccess` — from `PlatformRole` templates; drives sidebar and API `requireModule()`.

### Academic staff (instructors)

`CourseOffering.instructorId` refs **`StaffMember`** (academic flag / teaching panel). There is no separate `Teacher` model. Use **Staff Directory** for HR and **Role Assignments** for scoped academic duties (HOD, etc.).

### Student intake & enrollment (Aug 2026 — ✅)

Two-stage intake replaces the monolithic `Admission` model for new work:

| Stage | Model | Purpose |
|-------|--------|---------|
| **Application** | `StudentApplication` | Lightweight public or internal apply (`APP-26-0001`) |
| **Admission dossier** | `StudentAdmission` | Full profile + documents before enrollment (`ADM-26-0001`) |
| **Student** | `Student` | Official record — created only when dossier is completed |
| **Semester registration** | `SemesterRegistration` | Academic enrollment per session (existing F4) |

**Public (no login):** `/apply`, `/apply/status` — rate-limited API at `/api/public/*`.

**Staff:** `/admissions` pipeline → review → promote to dossier → upload docs → complete admission → student appears in `/students`.

**Program admission window (Oct 2026 Step 1):** `Program.admissionOpensAt` / `admissionClosesAt`. Public “Open” = Active + within dates; no dates = closed for apply. See `docs/public-admissions-catalog.md`.

Documents: `uploads/students/{admissionId|studentId}/{documentType}/...`

Legacy `Admission` model, `/api/admissions/legacy/*`, and old `AdmissionsPage.tsx` **removed (Sep 2026)**. Use StudentApplication pipeline only.

### Public website & staff portal (Aug 2026 — ✅)

| URL | Purpose |
|-----|---------|
| `/` | Public university site (Home, About, Contact) |
| `/apply`, `/apply/status` | Public admission apply + track (no login) |
| `/login` | Staff portal sign-in (secondary entry) |
| `/dashboard` | Authenticated staff dashboard (was `/`) |
| `/landing` | Redirects to `/` |

Public layout: `PublicSiteLayout` — nav links + footer; admission CTA prominent; **Staff portal** link de-emphasized.

### UI polish (Aug 2026 — ✅)

| Item | Status |
|------|--------|
| Global theme in `frontend/src/styles.css` | ✅ Warm stone neutrals + forest green primary + bronze accent (replaced blue/purple) |
| View (eye) buttons on list pages | ✅ Students, Staff, Campuses, Faculties, Workforce, Leave, Payroll, Access |
| View modals | ✅ Campuses, Faculties, Leave requests (Departments/Batches/Sessions already had view) |

### Gaps / future

| Priority | Work | Why |
|----------|------|-----|
| **In progress** | Public admissions catalog (browse → open/closed → stepped apply) | Plan: `docs/public-admissions-catalog.md` — Steps 1–2 ✅ |
| **Done** | ~~Student portal login (`Student.userId`)~~ | ✅ Sep 2026 — `/student` + `/api/student-portal/*` |
| **Done** | ~~Leave balance admin UI~~ | ✅ Sep 2026 — `WorkforceLeavePage` quotas + staff deep-link |
| **Done** | ~~Recruitment resume uploads~~ | ✅ Sep 2026 — `cvPath` + multer under `uploads/hr/recruitment/` |
| **Done** | ~~Wire Assignments / Exams / staff Attendance to `offeringId`~~ | ✅ Phase 6 staff modules (Sep 2026) |
| **Cleanup** | ~~Remove legacy `Admission` model + `AdmissionsPage.tsx` monolith~~ | ✅ Done Sep 2026 |
| **Cleanup** | ~~Deprecate `Employee` model~~ | ✅ Done Sep 2026 — removed with `Leave` |

### Completed (Phase C + Student module — Aug 2026)

| Item | Status |
|------|--------|
| C1 Recruitment API + UI | ✅ `/workforce/recruitment` |
| C2 Leave balance tracking | ✅ quotas + validation on create/approve |
| C3 Bulk staff attendance | ✅ `POST /workforce/attendance/bulk` |
| C4 StaffMember ↔ offerings (teaching) | ✅ `GET /staff/:id/offerings` + `StaffTeachingPanel` |
| C5 Permission audit log | ✅ `/settings/permission-audit` |
| Test users for all roles | ✅ `SEED_TEST_USERS=true` seeds all platform roles |
| Legacy HR cleanup | ✅ removed `hr.routes`, `employee.controller`, `leave.controller`, `HrPage` |
| **Student module** | ✅ public apply/track, admissions pipeline, dossier + docs, student directory |

**Phase 6 (staff):** Assignments / Exams / Attendance store `offeringId` and denormalized academic refs. Student portal grades/attendance remain a follow-up.

> **Update (2026-09):** Phase 6 staff wiring shipped. Student portal gradebook/attendance still deferred.

---

## 6. What to do (rules for every change)

### Always

- Read this file + `academic-architecture-plan.md` before large features.
- Follow established UI pattern: **KPI row → DataTable → filters → create/edit route or dialog**.
- Use **lean REST** on backend: validate early, clear error messages, indexed queries, soft delete.
- Group UI by **user mental model** (fees by program, curriculum by semester, offerings by session).
- Reuse existing conventions (naming, `asyncHandler`, `features/*.ts` API classes, lazy routes).
- Run `npm run seed:academic` on fresh DBs; never reintroduce `seedCourses`.
- Use **`/subjects`**, **`/programs/:id/curriculum`**, **`/offerings`** for all new academic work.

### Prefer

- Small focused PRs over giant refactors.
- Separate routes for create/edit (like Department) when forms are non-trivial.
- Stats endpoints for KPI cards.
- Idempotent seeds and migrations.

---

## 7. What NOT to do

| Don't | Why |
|-------|-----|
| Extend or recreate legacy `Course` | Removed — use Subject + Offering |
| Build features only on old `/courses` | Route removed |
| Overwrite fee history | Use `SubjectFeeHistory` versioning; close old rows |
| Skip curriculum check when creating offerings | Subject must be in program plan for that semester |
| Use legacy `/semesters` or `/fees` pages | Removed — use Sessions + Program Semester Fees + (F5) challans |
| Mix Employee and Teacher without a plan | Employee/Leave/Teacher models removed — use StaffMember |
| Add Super Admin or custom auth bypass | Only Admin/Teacher/Student/Staff |
| Over-engineer permissions before staff/portal access is clean | Get StaffMember + PlatformRole right first |
| Delete legacy Course files yet | ✅ Done |
| Commit secrets (.env) | Use env vars for admin seed |

---

## 8. Roadmap summary

### ✅ Done (Aug 2026)

| Area | What |
|------|------|
| **Academic** | Subjects, curriculum, fees, offerings, semester registration, challans |
| **People v1** | `StaffMember` distributed modules (staff, workforce, payroll, access) |
| **Permissions** | `PlatformRole`, module guards, audit log, test role users |
| **Workforce** | Leave + balances, attendance + bulk, documents, recruitment |
| **Students** | Public apply/track, application pipeline, admission dossier + docs, student directory |
| **Public site** | `/` = Home/About/Contact; `/apply` admission form; `/login` staff only |
| **UI** | View buttons on key list pages; global theme (forest green, not blue) |

### ⏳ Not done / remains

| Item | Status | Notes |
|------|--------|-------|
| Phase A manual verify | ✅ Done 2026-09-25 | `node backend/scripts/verifyPhaseA.js` — Finance/Faculty/HR + apply templates |
| Student portal login | ✅ Done 2026-09-26 | `completeAdmission` + `/api/student-portal` + `/student/*` |
| Leave quota admin UI | ✅ Done 2026-09-26 | `WorkforceLeavePage` + `updateLeaveBalance` + staff link |
| Recruitment resume uploads | ✅ Done 2026-09-26 | CV upload/download on applicants |
| Phase 6 — offerings → assignments/exams/attendance | ✅ Done (staff) | `offeringId` on records; attendance per class; backfill + index sync scripts |
| Phase 7 — BatchFeePolicy | 📋 Future | Continuing-student fee rules |
| Large page refactors | ✅ Done Sep 2026 | Assignments, Exams, Events, Library, Transport split |
| ~~Legacy Admission / Employee / Leave cleanup~~ | ✅ Done Sep 2026 | Dashboard/reports use StaffMember / StaffLeave / StudentApplication |

### Next build sprint (recommended order)

1. ~~**Phase A verify**~~ — ✅ Done 2026-09-25
2. ~~**Student portal login**~~ — ✅ Done 2026-09-26
3. ~~**Leave quota admin UI**~~ — ✅ Done 2026-09-26
4. ~~**Recruitment resume uploads**~~ — ✅ Done 2026-09-26
5. ~~**Legacy cleanup**~~ — ✅ Done Sep 2026
6. ~~**Phase 6**~~ — ✅ Staff modules: Assignment/Exam/Attendance linked to `offeringId`

### Later (paused / deferred)

- Student portal: assignments, grades, attendance views
- Phase 7: BatchFeePolicy for continuing students
- Full finance integration: enrollment snapshots → challans → payments reconciliation
- Gradebook polish per offering
- Multi-campus reporting, accreditation exports

### ~~Now — your action (Phase A verify, ~15 min)~~

✅ Done 2026-09-25 — see `backend/scripts/verifyPhaseA.js`.

---

## 9. Removed legacy (Aug–Sep 2026)

**Deleted (Aug 2026):** `Course` model, `/api/courses`, `CoursesPage`, `features/courses.ts`, `seedCourses`.

**Deleted (Sep 2026 cleanup):** `Admission` model + `/api/admissions/legacy/*` + `admission.controller.js`; `Employee` + `Leave` models; `Finance` + `FeeStructure` models; `Payroll.employee` ref; frontend `AdmissionsPage.tsx`, `features/admissions.ts`, `LandingPage.tsx`. Dashboard/reports now use `StudentApplication` / `StaffMember` / `StaffLeave`.

**Assignment / Exam / Attendance (Phase 6):** Staff create/mark flows store Mongo `offeringId` and denormalize subject/program/batch/session. Legacy `course` / `courseCode` strings remain for reports and old rows.

**Seed:** `npm run seed:all` now includes offerings → enrollments → sample assignments/exams/attendance (`scripts/seedOfferingsAssessments.js`). Standalone: `npm run seed:offerings`. One-time migrations: `npm run seed:backfill-offerings`, `npm run seed:sync-attendance-indexes`.

---

## 10. Design & engineering principles

All features must be **easy to use, easy to follow, and easy to understand**.

| Area | Guideline |
|------|-----------|
| **UX** | Clear labels, grouped information, one primary action per screen |
| **UI** | KPI + DataTable + consistent list → create/edit flows |
| **Frontend** | Lazy routes, minimal re-fetches, shared forms, toast on errors |
| **Backend** | Lean REST, indexed queries, `asyncHandler`, populate only what UI needs |
| **Efficiency** | Clarity first; no over-abstraction |

---

## 11. Frontend layout system

- **PublicSiteLayout** — public header nav (Home, About, Contact, Admissions), footer, `<Outlet />`
- **AppLayout** — auth gate, sidebar, topbar, `<Outlet />` (staff portal; dashboard at `/dashboard`)
- **Sidebar** (`layouts/sidebar.tsx`) — collapsible groups; auto-expand active route
- Pages are self-contained (no AppShell wrapper)
- Auth check only in AppLayout — individual pages do not redirect
- **Theme:** all colors in `frontend/src/styles.css` (`--primary`, `--brand`, `--brand-2`, `gradient-brand`, etc.)

### Public routes

```
/                     → HomePage (public)
/about                → AboutPage
/contact              → ContactPage
/apply                → ApplyPage (admission form)
/apply/status         → ApplicationTrackPage
/login                → LoginPage (staff)
/landing              → redirects to /
```

### Staff portal routes (authenticated)

```
/dashboard            → DashboardPage (staff home)
/university, /campuses, /faculties, /departments, /programs, /subjects
/offerings, /semester-registrations, /challans
/admissions, /admissions/:id, /admissions/dossier/:id
/students, /students/:id, /students/:id/documents
/staff, /staff/:id, /staff/:id/documents
/workforce, /workforce/leaves, /workforce/attendance, /workforce/recruitment, /workforce/:id
/payroll, /access, /settings/roles, /role-assignments
/academic-sessions, /batches, /attendance, /assignments, /exams
/library, /hostel, /transport, /events, /qr, /finance, /reports, /settings
```

---

## 12. Key reference files

| File | Contents |
|------|----------|
| `maincontext.md` | **This file** — vision, status, rules, roadmap |
| `fee-plan.md` | Sessions, batches, offerings setup order + full fee plan (both modes) |
| `people-and-permissions-plan.md` | Original design doc — largely implemented via StaffMember + PlatformRole |
| `academic-architecture-plan.md` | Deep spec: models, APIs, fee policies, phases |
| `backend/backendcontext.md` | Models list, API conventions, seed commands |
| `frontend/frontendcontext.md` | Tech stack, routes, feature modules, UI patterns |
| `backend/utils/seedAcademicStructure.js` | Academic seed logic |
| `backend/utils/resolveSubjectFee.js` | Fee resolution for enrollment snapshots |

---

## 13. Session handoff checklist

**Last session (Aug 2026):** Student module complete; public site at `/`; view buttons + theme refresh.

When starting a new task, confirm:

- [x] Phase A manual verify done? (role logins, apply templates) — ✅ 2026-09-25
- [ ] Is this public (`/`, `/apply`) or staff (`/dashboard`, `/admissions`, etc.)?
- [ ] Which phase does this belong to? (student portal, leave quotas, recruitment uploads, Phase 6, etc.)
- [ ] Is there an existing pattern (WorkforceLeavePage, DepartmentViewModal, ApplicationsPipelinePage) to copy?
- [ ] Does UI need KPI + DataTable + filters + **View** (eye) action?
- [ ] Does backend need stats endpoint + soft delete + indexes?
- [ ] Update this file + `backendcontext.md` / `frontendcontext.md` when done

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| **Subject** | Master catalog entry — what can be taught |
| **Program curriculum** | Subjects mapped to program + semester |
| **Subject fee history** | Versioned fee rates (default + program override) |
| **Course offering** | One running class (subject + batch + session + instructor) |
| **Enrollment** | Student in one offering |
| **Semester registration** | Student registered for a program semester (package fee snapshot) |
| **feeSnapshot** | Fee amounts frozen at registration |
| **Teacher** | Legacy JWT role bucket only — academic people are `StaffMember` |
| **StaffMember** | Unified HR + academic staff record — employment, schedule, payroll, portal access, offerings instructor |
| **PlatformRole** | Named role template with `moduleAccess` map |
| **moduleAccess** | Per-user boolean map of which sidebar modules/APIs are allowed |
