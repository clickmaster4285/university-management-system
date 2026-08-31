# UniversityMS — Master Project Context

> **Purpose of this file:** Single source of truth for anyone (or any AI session) working on this codebase. Read this first. It tracks vision, what is built, what is deferred, what to do, what not to do, and the roadmap.  
> **Last updated:** 2026-08-31  
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

Legacy `/hr` page and `Employee`-centric HR UI removed. `Employee` model may still exist for old data but new work uses `StaffMember`.

### Platform roles & module permissions (Phase A — built, verify manually)

| Piece | Status |
|-------|--------|
| `PlatformRole` model + CRUD | ✅ |
| `/settings/roles` — create/edit/delete, restore defaults, **Apply to all users** | ✅ |
| `requireModule()` on all API routes via `apiRouteModules.js` | ✅ |
| Frontend `ModuleRoute` + sidebar filtered by `moduleAccess` | ✅ |
| Admin seed — `primaryRole: System Admin` + full module access | ✅ |
| Test users (`SEED_TEST_USERS=true`) | ✅ finance@, faculty@, hr@scholaros.test |
| **Manual verification** (role logins + apply templates) | ⏳ You do this once |

**Module keys:** `dashboard`, `governance`, `academic_catalog`, `academic_ops`, `assessments`, `admissions`, `students`, `staff`, `library`, `hostel`, `transport`, `events`, `finance`, `hr`, `reports`, `settings`

**Phase A checklist (manual):**
1. Restart backend (picks up route guards + admin seed)
2. Log in as Finance / Faculty / HR — confirm sidebar + API 403 blocks
3. Settings → Roles & Permissions → **Apply to all users** for each role template

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

### Teacher (academic staff) — parallel path

`Teacher` model still exists for academic offerings (`instructorId`). Long-term: link or merge with `StaffMember` where a professor is also on payroll. For now, use **Staff Directory** for HR and **Role Assignments** for scoped academic duties.

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

Documents: `uploads/students/{admissionId|studentId}/{documentType}/...`

Legacy `Admission.model.js` and old `AdmissionsPage.tsx` remain in repo but are **not** used by new routes.

### Gaps / future

| Priority | Work | Why |
|----------|------|-----|
| **Next** | Student portal login (`Student.userId`) | Grades, fees, attendance self-service |
| **Next** | Leave balance admin UI | Edit quotas per staff from HR screen |
| **Next** | Recruitment resume uploads | Store applicant CVs in `uploads/hr/recruitment/` |
| **Paused** | Wire Assignments / Exams / student Attendance to `offeringId` | Phase 6 |

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

**Paused (Phase 6):** Wire Assignments / Exams / **student** Attendance to `offeringId`.

> **Decision (2026-08-29):** Phase 6 (offerings → assignments/exams/attendance) remains paused. People, permissions, and workforce are the active focus.

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

### Now — your action (Phase A verify, ~15 min)

1. Restart backend if not already running (`cd backend && npm run dev`)
2. Optional: set `SEED_TEST_USERS=true` in `.env`, restart
3. Log in as **Finance**, **Faculty**, **HR** — confirm sidebar hides blocked modules
4. Try a blocked API (e.g. Finance user → `GET /api/university`) — expect 403
5. **Settings → Roles & Permissions** → click **Apply to all users** on each role template
6. Smoke-test workforce: create leave → approve; mark attendance; upload a document

### Next build sprint

1. Student portal login (`Student.userId`)
2. Leave quota admin UI
3. Recruitment resume file uploads

### Done (Aug 2026)

| Phase | What |
|-------|------|
| **Academic** | Subjects, curriculum, fees, offerings, semester registration, challans |
| **People v1** | `StaffMember` distributed modules |
| **Permissions** | `PlatformRole`, module guards, audit log |
| **Workforce** | Leave + balances, attendance + bulk, documents, recruitment |
| **Students** | Public apply/track, application pipeline, admission dossier, student directory |

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
/challans                           ← fee challans from registrations (F5)
/apply, /apply/status               ← public admission apply + track (no auth)
/admissions                         ← application pipeline (staff)
/admissions/:id                     ← application review
/admissions/dossier/:id             ← full admission dossier + documents
/students                           ← enrolled student directory
/students/:id                       ← student profile
/students/:id/documents             ← post-enrollment documents
/departments, /programs, /batches, /academic-sessions
/academic-sessions/create, /academic-sessions/edit/:id
/staff, /staff/:id, /staff/:id/documents
/workforce, /workforce/leaves, /workforce/attendance, /workforce/:id
/payroll, /access, /settings/roles, /role-assignments
/teachers, /students
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

**Last session (Aug 2026):** Phase A + B built — permissions, workforce leave/attendance/documents.

When starting a new task, confirm:

- [ ] Phase A manual verify done? (role logins, apply templates)
- [ ] Which phase does this belong to? (C1 recruitment, C2 leave balances, etc.)
- [ ] Is there an existing pattern (WorkforceLeavePage, StaffDocumentsPanel) to copy?
- [ ] Does UI need KPI + DataTable + filters?
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
| **Teacher** | Academic staff with User login; can instruct offerings |
| **StaffMember** | Unified HR record — employment, schedule, payroll, portal access |
| **PlatformRole** | Named role template with `moduleAccess` map |
| **moduleAccess** | Per-user boolean map of which sidebar modules/APIs are allowed |
| **Employee** | Legacy HR model — prefer StaffMember for new work |
