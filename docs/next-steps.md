# Next Steps — Execution Checklist

> **Created:** 2026-09-25
> **Purpose:** Working queue of everything left to do, in recommended order. Work through it top to bottom. Update `Status` and check boxes as you complete items. When an item is done, update `maincontext.md` / `backendcontext.md` / `frontendcontext.md` too.
>
> **Status legend:** ⬜ Not started · 🔄 In progress · ✅ Done · ⏸ Paused · 🗑 Cleanup

---

## 0. Quick win — do first (~15 min)

### ✅ Phase A manual verification

**Why:** Permissions system (platform roles, module guards, sidebar filtering) was built but never manually tested end-to-end.

**Steps:**

- [x] Backend already running (restart attempted; port in use — existing process has route guards)
- [x] Log in as Finance (`finance@scholaros.test`) — moduleAccess = dashboard/finance/reports; deny staff/HR/governance/settings with 403; challans/reports/payroll OK
- [x] Log in as Faculty — moduleAccess correct; deny finance/governance/settings; offerings/assignments/exams/batches OK
- [x] Log in as HR — moduleAccess correct; staff + workforce OK; deny finance/governance/settings
- [x] Settings → Roles: **Apply to all users** for all 15 role templates (via API)
- [x] Admin (`System Admin`) still has settings + full module access after apply

**Done when:** All three role logins show correct sidebar modules + blocked APIs, templates applied, no regressions.

**Verified:** 2026-09-25 via `backend/scripts/verifyPhaseA.js` (ALL PASSED). Re-run: `node scripts/verifyPhaseA.js` with backend up and `SEED_TEST_USERS=true`.

**Known gaps (not blockers for Phase A):**

- `/api/finance` is `authorize("Admin")` + module — Finance role (JWT `Staff`) gets 403 despite `finance` module; use `/challans` / `/payroll` instead
- `/api/staff` is `authorize("Admin","Staff")` — Faculty role (JWT `Teacher`) gets 403 despite `staff` module
- `POST /platform-roles/:id/apply-to-users` resolves `:id` by **role name**, not Mongo `_id`

---



## 1. Priority features (in order)

### 🔄 0. Public admissions catalog (browse → apply)

**Why:** Public should see university → campuses → categorized programs with Open/Closed dates, then a stepped form — not one flat dropdown.

**Plan:** `docs/public-admissions-catalog.md`

- [x] **Step 1** — `Program.admissionOpensAt` / `admissionClosesAt` + staff Programs UI
- [ ] **Step 2** — Public catalog tree API
- [ ] **Step 3** — Public browse UI
- [ ] **Step 4** — Stepped apply + reject closed on submit

---

### ✅ 1. Student portal login (`Student.userId`)

**Why:** Biggest missing feature — students currently have no self-service. Enables grades, fees, attendance views.

**Completed:** 2026-09-26

**What shipped:**

1. **Account creation** — `completeAdmission` creates/links User (`role: Student`, platform role Student, dashboard moduleAccess) and sets `Student.userId`. Temp password returned once as `portalLogin`.
2. **Enable for existing** — `POST /api/students/:id/portal-login` (staff) + UI on student profile.
3. **Login** — Same `/login`; Student role → `/student`. Staff `AppLayout` redirects Students away.
4. **Layout** — `StudentPortalLayout` + `/student`, `/student/registrations`, `/student/fees`, `/student/profile`.
5. **APIs** — `GET /api/student-portal/me|registrations|challans` via `requireStudentPortal` (scoped to linked Student). Grades/attendance on the student portal remain a follow-up (staff Phase 6 is done).

**Related (Sep 2026):** Full online apply form + shared `StudentDossierForm` reused by `/apply`, admission dossier, and directory **Add student**. Applications still reviewed (Shortlisted / Accepted / …) then promoted → dossier → complete.

**Done when:** A student can log in after admission and see their own profile, semester registrations, and challans — and cannot access staff routes.

---



### ✅ 2. Leave quota admin UI

**Why:** Backend `StaffLeaveBalance` API exists (`GET/PUT /api/workforce/leaves/balance/:staffMemberId`) — no UI to edit quotas.

**Backend (verify only):**

- [x] PUT endpoint accepts quota updates (annual/sick/casual/maternity/paternity) + optional `year`
- [x] No bulk-by-department endpoint (not needed)

**Frontend:**

- [x] Leave quotas section on `WorkforceLeavePage` — staff select + year + used/remaining table
- [x] Edit quotas dialog → `workforceAPI.updateLeaveBalance` → toast
- [x] Deep-link from staff profile (`StaffModuleLinks` → `/workforce/leaves?staffId=...`)

**Done when:** Admin can view and edit leave quotas per staff member from the UI.

**Completed:** 2026-09-26

---



### ✅ 3. Recruitment resume upload

**Why:** Recruitment works but applicants are DB-only — no CV file stored.

**Backend:**

- [x] Multer `recruitmentCvUpload` — PDF/DOC/DOCX, 10 MB
- [x] Path: `uploads/hr/recruitment/{recruitmentId}/...` via `getRecruitmentCvDirectory`
- [x] Applicant subdoc: `cvPath`, `cvOriginalName` (keep `resume` string for URL/notes)
- [x] `POST/GET .../applicants/:applicantId/cv` (+ `/download`) with auth

**Frontend:**

- [x] CV file input when adding applicant; Upload/Replace/Download on applicant row
- [x] `workforceAPI.uploadApplicantCv` / `downloadApplicantCv` (blob download)

**Done when:** Admin can attach a CV when adding an applicant and download it later.

**Completed:** 2026-09-26

---



### ✅ 4. Phase 6 — wire Assignment / Exam / Attendance to `offeringId`

**Why:** Records still store `courseCode` strings; offerings are the connective tissue of the system. This turns the system from "catalog + billing" into a real academic record system.

**Backend:**

- [x] Add `offeringId` ref (nullable, for backward compat) to `Assignment`, `Exam`, `Attendance` models
- [x] Accept `offeringId` in create/update; denormalize `subjectId`, `programId`, `batchId`, `academicSessionId` from offering
- [x] Migrate/backfill existing rows where possible (`npm run seed:backfill-offerings`)
- [x] Attendance unique index is per `{ studentId, date, offeringId }` (`npm run seed:sync-attendance-indexes`)
- [x] Attendance roster from Active enrollments for the selected offering
- [x] Seed data: `npm run seed:offerings` (wired into `seed:all`) creates Active offerings, enrollments, sample assignments/exams/attendance

**Frontend:**

- [x] Assignment/Exam forms submit Mongo `offeringId`; edit rehydrates by offering
- [x] List filters by offering on Assignments / Exams pages
- [x] AttendancePage is offering-first (load enrolled roster → mark Present/Absent/Late/Leave)

**Done when:** New assignment/exam/attendance records carry `offeringId`, lists can filter by offering. ✅ Staff modules done (Sep 2026). Student portal grades/attendance still follow-up.

---



## 2. Cleanup (batch together, low risk)



### ✅ Backend orphan files

- [x] Delete `routes/teacher.routes.js`, `routes/hr.routes.js` — already absent before this batch
- [x] Delete `controllers/teacher.controller.js`, `controllers/employee.controller.js`, `controllers/leave.controller.js` — already absent
- [x] Verify nothing imports them (`grep` before delete) and backend boots



### ✅ Legacy admission remnants

- [x] Remove `pages/academics/admissions/AdmissionsPage.tsx`
- [x] Remove `features/admissions.ts`
- [x] Remove legacy `Admission.model.js` + `/api/admissions/legacy/*` routes + `admission.controller.js`
- [x] Delete `LandingPage.tsx` (`/landing` already redirects to `/`)



### ✅ Deprecated frontend service

- [x] Remove `features/courses.ts` from barrel `features/index.ts` and delete file — already absent; barrel export of `admissions` removed



### ✅ Unused backend models

- [x] Remove `Finance` model
- [x] Remove `FeeStructure` model + `feeStructureId`/`feeStructureName` from `Fee`
- [x] Remove `Employee` + `Leave` models after dashboard/report switched to `StaffMember` / `StaffLeave` / `StudentApplication`
- [x] Payroll: dropped `employee` ref — `staffMember` only
- [x] Models index matches disk (no orphaned exports)



### ✅ Docs drift fix

- [x] `frontend/frontendcontext.md` — stale Teacher/Course mapping + legacy page mentions cleaned
- [x] `backend/backendcontext.md` — import example + registry updated
- [x] `maincontext.md` — Teacher/StaffMember + Admission/Employee cleanup notes updated

**Done when:** `grep` finds no references to deleted files, backend boots, `npx tsc --noEmit` clean, all three context files are consistent.

---



## 3. Quality improvements



### ⏭ Test suite — skipped (per product decision)

Left for a later decision. Not blocking current work.

### ⏭ CI pipeline — skipped (per product decision)

Left for a later decision.

### ✅ Large page refactors

**Why:** 1000+ line pages are hard to maintain. Pattern: Departments (list / create / edit / shared form).

- [x] TransportPage → hub + Bus/Driver/Route forms + create/edit routes
- [x] AssignmentsPage → list + AssignmentForm + create/edit
- [x] LibraryPage → list + BookForm + create/edit
- [x] ExamsPage → list + ExamForm + create/edit
- [x] EventsPage → list + EventForm + create/edit
- [x] BatchesPage — already split before this batch

**Done when:** Each is split under the page-refactoring convention from `frontendcontext.md`, no page > ~500 lines. (Transport hub ~704 still large but forms extracted.)

### ✅ Money-path safety

**Why:** Standalone MongoDB = no transactions. Registration → challan → payment can be half-written.

- [x] Decision: **idempotency + compensating rollback** (no replica-set requirement)
- [x] Unique partial index on `Fee.semesterRegistrationId` for semester_package challans
- [x] Generate-challan: lookup by registration id; compensate soft-delete Fee if link fails; unique-conflict → attach existing
- [x] Payments: require `transactionId` / `idempotencyKey`; duplicate returns existing; retry registration status sync
- [x] Registration create: compensate enrollments + capacity if `SemesterRegistration.create` fails
- [x] Challans UI sends `transactionId` on payment



### ✅ Legacy scalar alias migration

**Why:** Stale queries still used removed `Department.campusId` / `facultyId` / `Faculty.campusId`.

- [x] Audit — schemas already array-only
- [x] Fix campus/faculty/recruitment controllers to use `campusIds` / `facultyIds`
- [x] Drop leftover `campusId`/`facultyId` payload keys from DepartmentForm
- [x] Docs updated

---



## 4. Later / decisions needed


| Item                                           | Status      | Note                                                      |
| ---------------------------------------------- | ----------- | --------------------------------------------------------- |
| Teacher ↔ StaffMember merge                    | 📋 Future   | Two parallel paths; needs explicit design first           |
| Phase 7 — `BatchFeePolicy`                     | 📋 Future   | Continuing-student fee rules                              |
| Campus-scoped roles (Issue 6)                  | 📋 Deferred | "Campus Admin" role template limited to one campus        |
| Full finance integration                       | 📋 Future   | Enrollment snapshots → challans → payments reconciliation |
| Student portal grades / attendance             | 📋 Future   | Staff Phase 6 done; portal views not built yet            |
| Attendance + gradebook polish per offering     | 📋 Future   | Gradebook ObjectId cleanup still open                     |
| Multi-campus reporting / accreditation exports | 📋 Future   |                                                           |


---



## Session checklist (before starting work)

- [ ] Pick the **first ⬜ item** above — don't start out of order without reason
- [ ] Read `maincontext.md` rules (§6 Always / §7 What NOT to do)
- [ ] Follow existing patterns (KPI → DataTable → filters → view/edit; `asyncHandler`; `features/*.ts` API classes)
- [ ] After finishing: check the box here **and** update the relevant context file