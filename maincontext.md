# UniversityMS — Master Project Context

> **Purpose of this file:** Single source of truth for anyone (or any AI session) working on this codebase. Read this first. It tracks vision, what is built, what is deferred, what to do, what not to do, and the roadmap.  
> **Last updated:** 2026-08-29  
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
        └── Faculty
              └── Department
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
| Assignments, Exams | Pick an **Offering** in forms (subject code stored on record) |
| Attendance | 📋 Not wired to offering yet |

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
| **6** | Wire Assignments / Exams / Attendance to `offeringId` | ⏸ **Paused** — not needed right now |
| **7** | BatchFeePolicy, FeeAdjustment (optional) | 📋 Future |
| **8** | Deprecate legacy `Course` | ✅ Done (Aug 2026) |

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
| Extend or recreate legacy `Course` | Removed — use Subject + Offering |
| Build features only on old `/courses` | Route removed |
| Overwrite fee history | Use `SubjectFeeHistory` versioning; close old rows |
| Skip curriculum check when creating offerings | Subject must be in program plan for that semester |
| Use legacy `/semesters` or `/fees` pages | Removed — use Sessions + Program Semester Fees + (F5) challans |
| Mix Employee and Teacher without a plan | Two models today — linking needs explicit design |
| Add Super Admin or custom auth bypass | Only Admin/Teacher/Student/Staff |
| Over-engineer permissions before teacher module is clean | Get Teacher CRUD right first, then roles |
| Delete legacy Course files yet | ✅ Done |
| Commit secrets (.env) | Use env vars for admin seed |

---

## 8. Roadmap summary

### Now (current sprint direction)

- **Fee Phase F5** — Challan integration (`SemesterRegistration` → `Fee` record, partial payment).
- **Teachers / professors module** — refactor UI, real department refs, profile, teaching assignments via offerings.

### Next (after fees F5 / teachers)

- HR ↔ Teacher alignment (single person record or explicit link).
- Teacher portal basics (my offerings, my students).
- `per_subject` and `mixed` registration modes on SemesterRegistration.

### Later (paused / deferred)

- Phase 6: Assignments, Exams, Attendance → `offeringId`
- Phase 7: BatchFeePolicy for continuing students
- ~~Phase 8: Remove `Course` model~~ ✅ Done

### Long term

- Full finance integration from enrollment fee snapshots → challans → payments.
- Attendance + gradebook per offering.
- Multi-campus reporting, accreditation exports.

---

## 9. Removed legacy (Aug 2026)

**Deleted:** `Course` model, `/api/courses`, `CoursesPage`, `features/courses.ts`, `seedCourses`.

**Still uses subject code as text** (not offering ID yet): Assignment and Exam forms pick an **Offering** in the UI but store `course` / `courseCode` strings on the record. Full `offeringId` link is optional future work.

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
/programs, /programs/:id/curriculum, /programs/:id/semester-fees
/offerings                          ← running classes
/semester-registrations             ← package-mode semester registration (F4)
/departments, /programs, /batches, /academic-sessions
/teachers, /students
```

---

## 12. Key reference files

| File | Contents |
|------|----------|
| `maincontext.md` | **This file** — vision, status, rules, roadmap |
| `fee-plan.md` | Sessions, batches, offerings setup order + full fee plan (both modes) |
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
| **Semester registration** | Student registered for a program semester (package fee snapshot) |
| **feeSnapshot** | Fee amounts frozen at registration |
| **Teacher** | Academic staff with User login; can instruct offerings |
| **Employee** | HR record (may or may not be a Teacher — not linked yet) |
