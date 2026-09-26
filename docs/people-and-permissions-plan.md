# People, Staff & Permissions Plan

> **Status:** Decisions captured — design approved in principle, **not implemented yet**  
> **Last updated:** 2026-08-31  
> **See also:** `maincontext.md`, `fee-plan.md`, `academic-architecture-plan.md`  
> **Build order:** Academic setup (sessions/batches/fees/offerings) → **F5 challans** → then this plan

---

## 1. Agreed decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | One `StaffMember` for everyone on payroll? | **Yes** — single base record for all non-student personnel |
| 2 | Multiple employments per person? | **Yes** — e.g. part-time in two departments, or teaching + admin duty |
| 3 | Permission model v1 | **Module-wise** flags (not granular `resource.action` yet) |
| 4 | Who creates logins? | **Admin only** initially (no self-service invite) |
| 5 | Teacher portfolio v1 | **Generous** — qualifications, experience, publications, research, awards, etc. |
| 6 | Student separate from staff? | **Yes** — `Student` stays its own lifecycle; not merged into `StaffMember` |
| 7 | Default roles at go-live | **Not enough** with Admin / Academic / Finance / HR / Student alone — expanded set below |

---

## 2. Target architecture (four layers)

```
Student                    ← separate domain (admission → enrollment → graduation)
  └── optional User        ← student portal login

StaffMember                ← one human on payroll / academic roster
  ├── Employment[]         ← 1..n jobs (department, designation, dates, type)
  ├── TeacherProfile?      ← 1:1 if academic teaching staff (generous portfolio)
  ├── RoleAssignment[]   ← HOD, Exam Controller, Librarian duty, etc. (scoped)
  └── User?                ← optional login (admin-created only in v1)
```

**Rules:**

- Every person on payroll → `StaffMember` (including non-teaching staff).
- **Login is optional** — `StaffMember.userId` null = HR record only, no portal access.
- **Teacher** is not a separate “type of user” — it is `StaffMember` + `TeacherProfile` + module access.
- **Student** is never a `StaffMember` (different admission, fees, progression, portal).

---

## 3. Core models (planned)

### StaffMember

| Field | Notes |
|-------|--------|
| `staffId` | `STF-0001` |
| `userId` | Optional ref `User` — null if no login |
| `firstName`, `lastName` | |
| `email`, `phone`, `cnic` | Work contact; may differ from User email |
| `dateOfBirth`, `gender` | HR |
| `photo` | Profile image URL |
| `address`, `emergencyContact` | HR |
| `status` | Active, On Leave, Resigned, Terminated, Retired |
| `hasLogin` | Derived or stored — whether `userId` is set |

### Employment (embedded or sub-collection)

| Field | Notes |
|-------|--------|
| `departmentId` | Ref Department |
| `campusId` | Optional ref Campus |
| `designation` | Professor, Accounts Officer, Lab Attendant, … |
| `employmentType` | Full-time, Part-time, Contract, Visiting, Intern |
| `isPrimary` | Which job is main for reporting |
| `startDate`, `endDate` | Supports multiple concurrent or sequential jobs |
| `salaryBand` / `payrollCode` | Link to payroll later — not full salary on profile |

### TeacherProfile (1:1 with StaffMember when academic)

**v1 — generous scope:**

| Section | Fields |
|---------|--------|
| Bio | `summary`, `specialization`, `researchInterests[]` |
| Qualifications | `degree`, `institution`, `country`, `year`, `grade`, `field` |
| Experience | `organization`, `role`, `startDate`, `endDate`, `description` |
| Publications | `title`, `type` (journal/conference/book), `venue`, `year`, `url`, `doi` |
| Certifications | `name`, `issuer`, `year`, `expiry` |
| Conferences | `name`, `role` (speaker/attendee), `year`, `location` |
| Awards | `title`, `issuer`, `year` |
| Teaching | `officeHours`, `officeLocation`, `preferredContact` |
| Academic links | `orcid`, `googleScholar`, `researchGate`, `linkedin` |
| Languages | `language`, `proficiency` |
| Supervision | optional later — PhD/Masters students |

Teaching **load** (current offerings) comes from `CourseOffering.instructorId` — not duplicated here.

### RoleAssignment (duties — not the same as login role)

| Field | Notes |
|-------|--------|
| `staffMemberId` | |
| `roleType` | HOD, Program Coordinator, Exam Controller, Lab Incharge, Dean, … |
| `scopeType` | University, Campus, Faculty, Department, Program |
| `scopeId` | ObjectId of scoped entity |
| `academicSessionId` | Optional — duty for this session only |
| `startDate`, `endDate` | |

Example: Same person = `TeacherProfile` + `RoleAssignment(HOD, Department CS)` + `RoleAssignment(Exam Controller, Faculty Engineering)`.

### User (login — unchanged concept, extended)

| Field | Notes |
|-------|--------|
| `email`, `password` | Login credentials |
| `primaryRole` | One of **platform roles** below (for JWT + defaults) |
| `moduleAccess` | Module flags — see §5 |
| `staffMemberId` | Optional link back to staff record |
| `studentId` | Optional link for student portal (separate path) |

---

## 4. Platform roles at go-live (expanded)

These are **login roles** (`User.primaryRole`). They define default module access; admin can override per user in v1.

| Role | Who | Default modules (summary) |
|------|-----|-------------------------|
| **System Admin** | IT / super user | All modules + settings |
| **University Admin** | Registrar / VC office | Governance, academics, people, reports — not necessarily payroll detail |
| **Academic Admin** | Dean / academic office | Academic structure, programs, curriculum, sessions, batches, offerings |
| **Department Head** | HOD | Department-scoped academics + staff view (their dept) |
| **Faculty** | Teachers, lecturers | My offerings, attendance, assignments, exams (own classes), teacher profile |
| **Examination** | Exam controller office | Exams, results, exam schedules, academic read |
| **Admissions** | Admissions office | Admissions, student create, limited student edit |
| **Finance** | Accounts / bursar | Fees, finance, fee reports (F5 challans) |
| **HR** | HR office | Staff CRUD, employments, leave, payroll (when built) |
| **Student Affairs** | Discipline / welfare | Students, events, notifications (partial) |
| **Librarian** | Library staff | Library module |
| **Transport** | Transport office | Transport module |
| **Hostel** | Warden | Hostel module |
| **Campus Ops** | Generic operations staff | Events, QR, facilities (configurable) |
| **Student** | Enrolled students | Student portal only (separate app area later) |

**Note:** `Department Head` permissions are **scoped** — v1 may implement as role + `RoleAssignment` scope; v2 adds row-level filters (only their department’s offerings).

---

## 5. Module-wise permissions (v1)

Sidebar and API guards use **module keys**. Each user has `moduleAccess: { [key]: boolean }`.

### Module keys (map to sidebar groups)

| Module key | Sidebar / area |
|------------|----------------|
| `dashboard` | Overview — Dashboard, Notifications |
| `governance` | University, Campuses, Faculties, Departments |
| `academic_catalog` | Subjects, Programs (incl. curriculum & semester fees) |
| `academic_ops` | Sessions, Batches, Offerings, Semester Registrations |
| `assessments` | Attendance, Assignments, Exams, Online Classes |
| `admissions` | Admissions |
| `students` | Students list / records |
| `staff` | Staff / Teachers directory & HR records |
| `library` | Library |
| `hostel` | Hostel |
| `transport` | Transport |
| `events` | Events, Smart QR |
| `finance` | Finance, Fees/challans (F5) |
| `hr` | HR, Payroll, Leave |
| `reports` | Reports |
| `settings` | Settings |

### Default matrix (starter — admin can override)

| Role | Modules enabled |
|------|-----------------|
| System Admin | all `true` |
| University Admin | all except `settings` partial |
| Academic Admin | `dashboard`, `governance`, `academic_catalog`, `academic_ops`, `assessments`, `students`, `staff` (read), `reports` |
| Department Head | `dashboard`, `academic_ops`, `assessments`, `students` (dept), `staff` (dept read) |
| Faculty | `dashboard`, `academic_ops` (my), `assessments` (my), `staff` (own profile) |
| Examination | `dashboard`, `assessments`, `academic_ops` (read), `students` (read) |
| Admissions | `dashboard`, `admissions`, `students` |
| Finance | `dashboard`, `finance`, `reports` |
| HR | `dashboard`, `staff`, `hr` |
| Student Affairs | `dashboard`, `students`, `events` |
| Librarian | `dashboard`, `library` |
| Transport | `dashboard`, `transport` |
| Hostel | `dashboard`, `hostel` |
| Campus Ops | `dashboard`, `events` |
| Student | `dashboard` (student home only — separate routes later) |

### Implementation notes (when we build)

- **Backend:** `requireModule('finance')` middleware; JWT includes `moduleAccess` or fetch on login.
- **Frontend:** Filter `sidebarNav` items by `user.moduleAccess`; hide routes user cannot access.
- **Routes:** Still protect APIs — sidebar hiding is not security.
- **v2 later:** Granular `resource.action` inside modules (e.g. `offerings.write` vs `offerings.read`).

---

## 6. Login creation flow (v1 — admin only)

1. Admin creates `StaffMember` (+ `Employment`, optional `TeacherProfile`).
2. Admin toggles **“Enable login”** on staff record.
3. System creates `User` with email, temp password, `primaryRole`, default `moduleAccess` for that role.
4. Admin shares credentials offline (no email invite in v1).
5. Staff member can change password in profile/settings later.

**No login:** Steps 2–4 skipped — person exists for HR, offerings assignment (by admin), payroll only.

**Student login:** Separate flow from `Student` record — not via `StaffMember`.

---

## 7. Migration from current models

| Today | Target |
|-------|--------|
| `Teacher` + forced `User` | `StaffMember` + `TeacherProfile` + optional `User` |
| `Employee` (HR) | `StaffMember` + `Employment` (no TeacherProfile) |
| `User.role` enum (4 values) | `User.primaryRole` (expanded) + `moduleAccess` |
| Frontend `ROLES` in auth.tsx (10+ strings) | Align with backend platform roles |
| `CourseOffering.instructorId` → `Teacher` | → `StaffMember` (or keep ref name `instructorId`) |

**Migration strategy:** Script or one-time import; keep old collections until cutover; map `Teacher.userId` → `StaffMember.userId`.

---

## 8. What we are NOT doing in v1

- Self-service invite / email onboarding
- Granular per-action permissions (`offerings.delete` vs `offerings.create`)
- Full payroll runs (leave model exists; deep payroll later)
- Student ↔ Staff merge
- Automatic permission inheritance from `RoleAssignment` (manual module flags first; auto rules in v2)
- Public teacher portfolio website

---

## 9. UI plan (after F5)

| Screen | Pattern |
|--------|---------|
| Staff list | KPI + DataTable (like Departments) |
| Staff create/edit | Full page `/staff/create`, `/staff/edit/:id` |
| Staff profile | Tabs: Overview, Employments, Teacher portfolio (if academic), Login & access, Documents (later) |
| Teachers | Filter/view on staff where `TeacherProfile` exists — or same list with type filter |
| User access | Admin panel on staff: role dropdown + module checkboxes |
| Sidebar | Driven by `moduleAccess` from login response |

---

## 10. Recommended build phases

### Now (before people module)
- [ ] Clean setup: sessions, batches, published fee packages, offerings
- [ ] Sessions full-page create/edit (like batches)
- [ ] **F5** — challans from semester registration

### People v1
- [ ] `StaffMember`, `Employment`, `TeacherProfile` models
- [ ] Expanded `User.primaryRole` + `moduleAccess`
- [ ] Staff CRUD API + admin UI
- [ ] Optional login creation (admin only)
- [ ] Sidebar filter by module
- [ ] Migrate `Teacher` → new model; deprecate `Employee` duplicate

### People v2
- [ ] `RoleAssignment` + scoped HOD / coordinator
- [ ] Row-level scope (dept-only data for HOD)
- [ ] Granular permissions inside modules
- [ ] Student portal + `Student.userId` link

---

## 11. Open questions (minor — decide during build)

1. **Staff ID vs Teacher ID** — one `STF-0001` for everyone, or keep display `TCH-` prefix for academic staff?
2. **Salary on profile** — store on `Employment` or only in payroll module?
3. **Department Head** — separate platform role vs `Faculty` + `RoleAssignment` only?
4. **Finance vs Accounts** — one role or split (bursar vs clerk)?

---

## 12. Glossary

| Term | Meaning |
|------|---------|
| **StaffMember** | Any university employee on HR roster |
| **Employment** | One job contract (department, designation, dates) |
| **TeacherProfile** | Academic portfolio for teaching staff |
| **RoleAssignment** | Formal duty (HOD, exam controller) with scope |
| **Platform role** | Login bucket with default module access |
| **Module access** | Which sidebar areas user can see (v1 permissions) |
