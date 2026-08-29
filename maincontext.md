# UniversityMS — Master Project Context

> **Purpose of this file:** Single source of truth for anyone (or any AI session) working on this codebase. Read this first. It tracks vision, what is built, what is deferred, what to do, what not to do, and the roadmap.  
> **Last updated:** 2026-08-29  
> **Detailed academic spec:** `academic-architecture-plan.md`  
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
        └── Faculty
              └── Department
                    ├── Subject          ← catalog (what can be taught)
                    ├── Program            ← degree (BSCS, BSSE, …)
                    │     └── ProgramCurriculum   ← which subjects, which semester
                    ├── SubjectFeeHistory         ← versioned fee rates
                    └── CourseOffering            ← one running class
                          └── Enrollment          ← student registered + fee locked

Teacher  → assigned to CourseOffering (instructor)
Student  → belongs to Program + Batch → enrolls in offerings
```

**Plain language:**

- **Subject** = the course on paper (CSC101, 3 credits). Created once, reused everywhere.
- **Program curriculum** = the degree plan (“BSCS semester 3 includes CSC201”).
- **Subject fee history** = what it costs over time (default rate + optional program override).
- **Course offering** = the actual class running this session for a specific batch.
- **Enrollment** = a student in that class, with a **frozen fee snapshot** at registration.

Legacy **`Course`** mixed all of the above in one document. We are replacing it layer by layer. Do **not** extend the legacy model.

---

## 3. How Course Offering works (end-to-end)

### What it is

A **Course Offering** is *not* the subject catalog. It is a **running instance**:

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
| Assignments, Exams, Attendance | ❌ **Deferred** — still use legacy `Course` for now |

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
| **6** | Wire Assignments / Exams / Attendance to `offeringId` | ⏸ **Paused** — not needed right now |
| **7** | BatchFeePolicy, FeeAdjustment (optional) | 📋 Future |
| **8** | Deprecate legacy `Course` model + `/courses` UI | 📋 After Phase 6 |

### Seeding

```bash
cd backend
npm run seed:academic:dry   # preview
npm run seed:academic       # apply (idempotent)
```

Creates: University → Campus → Faculty → Department → Program → Subject → ProgramCurriculum → SubjectFeeHistory.

Startup seeds **admin only** (`seedDefaultAdmin`). Legacy `seedCourses` removed.

---

## 5. People & roles — current state and next focus

### User roles (auth layer)

`User.role`: **Admin** · **Teacher** · **Student** · **Staff**

- JWT carries `role`; routes use `auth` + `authorize("Admin")` for mutations.
- Default role on user creation: `Student`.
- Admin seeded at startup from env (`ADMIN_EMAIL`, etc.).

### Teacher (academic staff) — today

| Piece | Status |
|-------|--------|
| `Teacher` model | ✅ Exists — department, designation, qualifications, status |
| `Teacher.userId` → `User` | ✅ Auto-created on teacher create (role: Teacher) |
| `TeachersPage` | ⚠️ Exists but **bloated** (~1000 lines), hardcoded department strings |
| Head of Faculty / Department | ✅ `headId` refs Teacher |
| CourseOffering `instructorId` | ✅ Teacher can be assigned to an offering |
| Teaching load / duties | ❌ Not modeled |
| TA / co-instructor | ❌ Not modeled |
| Department roles (HOD, coordinator) | ❌ Only `headId` on department |
| Permission granularity | ❌ Only 4 coarse roles — no per-module permissions |

### HR / Employee — today (separate from Teacher)

| Piece | Status |
|-------|--------|
| `Employee` model + `HrPage` | ✅ General HR (payroll-ish, designations as strings) |
| Link Employee ↔ Teacher | ❌ **Not linked** — two parallel systems |
| Leave, payroll models | ✅ Exist in backend, partial UI |

### Gaps to address (recommended next work)

**Short term — Teachers / Professors module**

1. **Refactor Teachers UI** — match Department/Program pattern (list + create/edit routes, real `departmentId` dropdown, no hardcoded strings).
2. **Teacher profile page** — qualifications, office hours, assigned offerings, workload summary.
3. **Teaching assignment** — view offerings where `instructorId = teacher`; optional workload limits.
4. **Designation ladder** — Professor → Associate → Assistant → Lecturer (already on model; enforce in UI).

**Medium term — Roles & duties**

1. **Academic roles** — HOD, Program Coordinator, Exam Controller, Lab Incharge (either fields on Teacher or a `StaffAssignment` model scoped to department/program).
2. **Duty / responsibility records** — what they are responsible for this session (teaching, advising, exam duty).
3. **Clarify Teacher vs Employee vs Staff** — document when to use which; optional link `Employee.teacherId` or merge paths for professors who are also on payroll.

**Long term — Fine-grained access**

1. Module permissions (e.g. Teacher can mark attendance for *their* offerings only).
2. Role-based UI (teacher portal vs admin portal).

> **Decision (2026-08-29):** Phase 6 (offerings → assignments/exams/attendance) is **not** the next priority. Focus on **people: teachers, duties, roles, HR alignment** first.

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
| Extend legacy `Course` model | Being replaced — see academic plan |
| Build features only on `/courses` UI | ~1300-line legacy page; use `/offerings` |
| Overwrite fee history | Use `SubjectFeeHistory` versioning; close old rows |
| Skip curriculum check when creating offerings | Subject must be in program plan for that semester |
| Mix Employee and Teacher without a plan | Two models today — linking needs explicit design |
| Add Super Admin or custom auth bypass | Only Admin/Teacher/Student/Staff |
| Over-engineer permissions before teacher module is clean | Get Teacher CRUD right first, then roles |
| Delete legacy Course files yet | Exams, Assignments, Fees still reference them |
| Commit secrets (.env) | Use env vars for admin seed |

---

## 8. Roadmap summary

### Now (current sprint direction)

- **Teachers / professors module** — refactor UI, real department refs, profile, teaching assignments via offerings.
- **Roles & duties planning** — define HOD, coordinator, exam duty model before coding.

### Next (after teachers)

- HR ↔ Teacher alignment (single person record or explicit link).
- Teacher portal basics (my offerings, my students).
- Student enrollment flows polish (bulk enroll, waitlist — if needed).

### Later (paused / deferred)

- Phase 6: Assignments, Exams, Attendance → `offeringId`
- Phase 7: BatchFeePolicy for continuing students
- Phase 8: Remove `Course` model, `/courses` UI, `features/courses.ts`

### Long term

- Full finance integration from enrollment fee snapshots → challans → payments.
- Attendance + gradebook per offering.
- Multi-campus reporting, accreditation exports.

---

## 9. Legacy inventory (do not delete yet)

| File / area | Still used by |
|-------------|---------------|
| `backend/models/Course.model.js` | Legacy API, exams, assignments |
| `backend/controllers/course.controller.js` | `/api/courses` |
| `frontend/.../CoursesPage.tsx` | Sidebar “Courses (Legacy)” |
| `frontend/src/features/courses.ts` | ExamsPage, AssignmentsPage, FeesPage |
| `Student.coursesEnrolled[]` | Legacy enrollment on student doc |

**Already removed:** `seedCourses`, migration scripts, `npm run seed:courses`.

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

- **AppLayout** — auth gate, sidebar, topbar, `<Outlet />`
- **Sidebar** (`layouts/sidebar.tsx`) — collapsible groups; auto-expand active route
- Pages are self-contained (no AppShell wrapper)
- Auth check only in AppLayout — individual pages do not redirect

### Established academic routes

```
/subjects, /subjects/create, /subjects/edit/:id
/programs, /programs/:id/curriculum
/offerings                          ← new delivery layer
/courses                            ← legacy only
/departments, /programs, /batches, /academic-sessions
/teachers, /students
```

---

## 12. Key reference files

| File | Contents |
|------|----------|
| `maincontext.md` | **This file** — vision, status, rules, roadmap |
| `academic-architecture-plan.md` | Deep spec: models, APIs, fee policies, phases |
| `backend/backendcontext.md` | Models list, API conventions, seed commands |
| `frontend/frontendcontext.md` | Tech stack, routes, feature modules, UI patterns |
| `backend/utils/seedAcademicStructure.js` | Academic seed logic |
| `backend/utils/resolveSubjectFee.js` | Fee resolution for enrollment snapshots |

---

## 13. Session handoff checklist

When starting a new task, confirm:

- [ ] Which phase does this belong to? Does it conflict with “do not extend Course”?
- [ ] Is there an existing pattern (Department, Subject, Offering) to copy?
- [ ] Does UI need KPI + DataTable + filters?
- [ ] Does backend need stats endpoint + soft delete + indexes?
- [ ] Should `maincontext.md` or `academic-architecture-plan.md` be updated when done?

When finishing a task:

- [ ] Update phase status in this file if milestone completed
- [ ] Update `backendcontext.md` / `frontendcontext.md` if APIs or routes changed
- [ ] Note any new “do not” rules discovered

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| **Subject** | Master catalog entry — what can be taught |
| **Program curriculum** | Subjects mapped to program + semester |
| **Subject fee history** | Versioned fee rates (default + program override) |
| **Course offering** | One running class (subject + batch + session + instructor) |
| **Enrollment** | Student in one offering |
| **feeSnapshot** | Fee amounts frozen at registration |
| **Teacher** | Academic staff with User login; can instruct offerings |
| **Employee** | HR record (may or may not be a Teacher — not linked yet) |
