# UniversityMS — Academic Time, Offerings & Fee Plan

> **Purpose:** Single document for **Batches**, **Sessions**, **Offerings**, and the **full fee strategy** — including both registration modes universities need.  
> **Read after:** `maincontext.md` (project overview)  
> **Technical spec:** `academic-architecture-plan.md` (models & APIs)  
> **Last updated:** 2026-08-29

---

## Table of contents

1. [Why offerings feel confusing](#1-why-offerings-feel-confusing)
2. [Time concepts — Sessions, Batches, Program semesters](#2-time-concepts--sessions-batches-program-semesters)
3. [New-user setup flow (do this order)](#3-new-user-setup-flow-do-this-order)
4. [Live walkthrough — Sessions → Batches → Offering](#4-live-walkthrough--sessions--batches--offering)
5. [What is a Course Offering?](#5-what-is-a-course-offering)
6. [Fee system today (what exists)](#6-fee-system-today-what-exists)
7. [Fee system target (what we are building)](#7-fee-system-target-what-we-are-building)
8. [Two registration modes (both required)](#8-two-registration-modes-both-required)
9. [Fee increase across semesters](#9-fee-increase-across-semesters)
10. [Where each fee type is managed](#10-where-each-fee-type-is-managed)
11. [Planned models & APIs](#11-planned-models--apis)
12. [Implementation phases](#12-implementation-phases)
13. [UI flows (target)](#13-ui-flows-target)
14. [Glossary](#14-glossary)
15. [Decisions log](#15-decisions-log)

---

## 1. Why offerings feel confusing

Offerings sit **on top of** things many users have not set up yet:

| You need first | Why |
|----------------|-----|
| **Subject** | What is being taught (CSC101) |
| **Program + Curriculum** | Which subjects belong to which program semester |
| **Academic Session** | *When* the university is operating (e.g. 2025–2026) |
| **Batch** | *Which group of students* (e.g. BSCS admitted Fall 2024) |
| **Subject fees** | How much each subject costs per credit |

**Offering** = Subject + Program + **Batch** + **Session** + teacher + seats.

If Sessions and Batches are empty, Offerings cannot make sense. **Always set up Sessions and Batches before Offerings.**

---

## 2. Time concepts — Sessions, Batches, Program semesters

Universities use **three different “time” ideas**. Do not mix them up.

### A. Academic Session (calendar year / annual cycle)

**What:** The university’s official academic year or annual period.

**Examples:**
- `2025–2026` (Sep 2025 → Aug 2026)
- `Fall 2025` (if you use term-based sessions)

**In the system:**
- Model: `AcademicSession`
- UI: **Academics → Sessions**
- Fields: `name`, `code`, `startDate`, `endDate`, `status`, `isCurrent`
- One session can be marked **current** (`isCurrent: true`)

**Think:** *“What year is the university calendar on?”*

---

### B. Batch (student cohort / intake group)

**What:** Students who **started the same program together** (same admission intake).

**Examples:**
- `BSCS-2024` — BSCS students admitted Fall 2024
- `BSSE-2023` — BSSE students admitted 2023

**In the system:**
- Model: `Batch`
- UI: **Academics → Batches**
- Links: `program`, `department`, **`admissionSessionId`** (when they joined)
- Fields: `year`, `code`, `admissionSemester` (Fall/Spring), `expectedGraduation`, `status`

**Think:** *“Which group of students am I teaching?”*

**Important:** A batch is tied to **when students were admitted**, not necessarily the session you are teaching in today.

| Batch field | Meaning |
|-------------|---------|
| `admissionSessionId` | Session when this cohort **entered** the university |
| `program` / `programId` | Degree they are pursuing (BSCS, BSSE, …) |
| `year` | Intake year (2024) |

---

### C. Program semester number (1, 2, 3 … 8)

**What:** Where the student is in the **degree plan** — not the calendar month.

**Examples:**
- Ali in **Semester 1** takes CSC101, MTH101 (first semester subjects from curriculum)
- Same Ali next year in **Semester 2** takes CSC201, etc.

**In the system:**
- Defined in **ProgramCurriculum** (`semester: 1, 2, 3…`)
- Used on **CourseOffering** (`semester` field)
- Optional: `Semester` model (term within a session — Fall/Spring under one session)

**Think:** *“Which semester of the degree plan is this class for?”*

---

### How they work together (diagram)

```
Academic Session 2025–2026          ← calendar / operations year
        │
        ├── Offering: CSC101 for Batch BSCS-2024, Semester 1  ← class running NOW
        ├── Offering: MTH101 for Batch BSCS-2024, Semester 1
        │
Batch BSCS-2024                     ← students who joined in Fall 2024
        │
        ├── Student Ali (now in program semester 1 or 2 depending on progress)
        └── Student Sara (same batch, same cohort)

Program BSCS → Curriculum
        ├── Semester 1: CSC101, MTH101, …
        ├── Semester 2: CSC201, …
        └── …
```

**Session** = when the university runs.  
**Batch** = who the students are.  
**Program semester** = which subjects from the degree plan.

---

## 3. New-user setup flow (do this order)

Use this checklist before touching Offerings or advanced fees.

### Phase A — Structure (one-time)

| Step | UI route | What you create |
|------|----------|-----------------|
| 1 | University / Campuses / Faculties / Departments | Org hierarchy |
| 2 | **Programs** | BSCS, BSSE, … |
| 3 | **Subjects** | CSC101, MTH101, … |
| 4 | **Programs → Curriculum** | Which subjects in Sem 1, 2, 3… |
| 5 | **Subjects → Fees** | Rate per credit (default + program override) |

Or run: `npm run seed:academic` for demo data.

### Phase B — Time & people (each intake year)

| Step | UI route | What you create |
|------|----------|-----------------|
| 6 | **Academics → Sessions** | e.g. `2025–2026`, set one as **current** |
| 7 | **Academics → Batches** | e.g. `BSCS-2024` linked to BSCS + admission session |
| 8 | **Students** | Assign students to program (and batch when linked) |
| 9 | **Teachers** | Academic staff |

### Phase C — Delivery (each term)

| Step | UI route | What you create |
|------|----------|-----------------|
| 10 | **Academics → Offerings** | Running classes: subject + batch + session + sem # |
| 11 | **Offerings → Enroll** | Per-subject enrollment + fee snapshot |

### Phase D — Billing (target — partially built)

| Step | UI route | What you create |
|------|----------|-----------------|
| 12 | **Program → Semester Fees** *(planned)* | Full semester package (subjects + extras) |
| 13 | **Operations → Fees** | Challan / payment against package or enrollments |

---

## 4. Live walkthrough — Sessions → Batches → Offering

### Step 1 — Create an Academic Session

**Go to:** Academics → **Sessions** → Add

| Field | Example |
|-------|---------|
| Name | `Academic Year 2025–2026` |
| Code | `AY2526` |
| Start date | `2025-09-01` |
| End date | `2026-08-31` |
| Is current | ✅ Yes (only one current at a time) |
| Status | Active (auto from dates) |

**Result:** `SESS-0001` — the calendar the university operates in.

---

### Step 2 — Create a Batch

**Go to:** Academics → **Batches** → Add

| Field | Example |
|-------|---------|
| Code | `BSCS-2024` |
| Year | `2024` |
| Program | BSCS |
| Department | Computer Science |
| Admission session | `Academic Year 2024–2025` *(session when they joined)* |
| Admission semester | Fall |
| Expected graduation | `2028` |
| Status | Active |

**Result:** `BATCH-0001` — the student cohort.

**Note:** Admission session (when batch **started**) can differ from the session you teach in (2025–2026). That is normal: Batch 2024 students in their 2nd program semester may still be taught in Session 2025–2026.

---

### Step 3 — Create an Offering

**Go to:** Academics → **Offerings** → New Offering

| Field | Example | Meaning |
|-------|---------|---------|
| Program | BSCS | Degree track |
| Semester | `1` | **Program** semester (from curriculum) |
| Subject | CSC101 | From curriculum for BSCS Sem 1 |
| Batch | BSCS-2024 | **Who** attends |
| Academic session | `2025–2026` | **When** it runs |
| Instructor | Dr. Khan | Optional |
| Capacity | 30 | Seats |

**Result:** `OFF-0001` — CSC101 running for BSCS-2024 in session 2025–2026, degree semester 1.

---

### Step 4 — Enroll a student

**Go to:** Offerings → Enrollments icon on `OFF-0001` → select student → Enroll.

System locks **fee snapshot** for that one subject enrollment (see [Section 8](#8-two-registration-modes-both-required)).

---

## 5. What is a Course Offering?

| | Subject | Offering |
|---|---------|----------|
| **Analogy** | Recipe in cookbook | Class happening today in Room 204 |
| **Created** | Once | Each batch + session you teach it |
| **Contains** | Code, credits, department | Batch, session, teacher, seats, schedule |
| **Fees** | Rate in SubjectFeeHistory | Fee resolved at **enrollment** |

**One line:** An offering is **a subject being taught to a specific batch during a specific academic session.**

---

## 6. Fee system today (what exists)

Three layers — **not fully connected**:

```
┌─────────────────────────────────────────────────────────────┐
│  A. SubjectFeeHistory                                       │
│     Per subject, per credit, versioned over time            │
│     UI: Subjects → Edit → Fees tab                          │
│     Scope: default OR program-specific override             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (used at enroll time)
┌─────────────────────────────────────────────────────────────┐
│  B. Enrollment.feeSnapshot                                  │
│     Locked when student enrolls in ONE offering            │
│     UI: Offerings → Enrollments                           │
│     Mode: PER-SUBJECT registration ✅ implemented           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  C. FeeStructure (legacy builder)                         │
│     Program + semester + manual subject list + extras     │
│     UI: Operations → Fees                                   │
│     NOT auto-linked to curriculum or enrollments          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  D. Fee (payment records)                                   │
│     Challans / payments                                     │
│     UI: Operations → Fees                                   │
│     NOT auto-linked to enrollment snapshots yet             │
└─────────────────────────────────────────────────────────────┘
```

### Gap (what users feel)

- Fees are visible **per subject**, not as **“BSCS Semester 2 total bill”**
- No auto-build from curriculum + fee history + extras
- Additional fees (lab, library, transport) live in Fee Structure but do not flow into enrollment/challan
- **Semester package mode** not implemented yet

---

## 7. Fee system target (what we are building)

### Target: layered fee architecture

```
SubjectFeeHistory          ← master rates (per credit, per subject)
        │
        ▼
ProgramSemesterFeeSchedule ← generated view: all subjects in Sem N + extras + total
        │
        ├── Mode 1: Semester package (one challan)
        │
        └── Mode 2: Per-offering enroll (snapshots sum to same total if full load)
        │
        ▼
SemesterRegistration       ← student’s registration for program semester + session
        │
        ├── semesterFeeSnapshot (package total + line items)
        └── enrollments[] → per-subject feeSnapshots (audit)
        │
        ▼
Fee (challan / payment)    ← money collected
```

### ProgramSemesterFeeSchedule (planned)

**Purpose:** Admin defines or **generates** the full fee picture for one program semester.

| Field | Type | Notes |
|-------|------|-------|
| `scheduleId` | String | e.g. `PFS-0001` |
| `programId` | ObjectId | BSCS |
| `semester` | Number | 1–8 (program semester) |
| `academicSessionId` | ObjectId | Which session this schedule applies to |
| `studentCategory` | Enum | Regular, Self-Finance, Scholarship, International |
| `status` | Enum | Draft, Active, Archived |
| `effectiveFrom` / `effectiveTo` | Date | Versioning |

**subjectLines[]** (auto from ProgramCurriculum + SubjectFeeHistory):

| Field | Notes |
|-------|-------|
| `subjectId` | From curriculum |
| `code`, `name` | Denormalized |
| `credits` | From subject |
| `feePerCredit` | Resolved from SubjectFeeHistory at generation date |
| `feeType` | Tuition, Lab, … |
| `lineTotal` | credits × feePerCredit |
| `isCore` | From curriculum type |

**additionalFees[]** (non-credit charges):

| Field | Notes |
|-------|-------|
| `name` | Registration, Exam, Library, Sports, Transport, Hostel, … |
| `type` | Fixed or % of tuition |
| `amount` / `percentage` | |
| `isOptional` | e.g. transport — only if student opts in |
| `appliesTo` | All students / category / batch |

**Totals (computed):**

| Field | Formula |
|-------|---------|
| `totalSubjectFee` | Sum of subject line totals |
| `totalAdditionalFee` | Sum of fixed + % components |
| `grossTotal` | subject + additional |
| `discount` | Optional scholarship rules |
| `netPayable` | What student owes |

---

## 8. Two registration modes (both required)

Universities need **both**. We will support both.

### Mode 1 — Per-subject enrollment (audit + flexibility)

**Status:** ✅ Implemented (Offerings → Enroll)

**Flow:**
1. Admin creates offerings per subject.
2. Student enrolls in each offering (or bulk enroll per semester — future).
3. Each enrollment gets its own **`feeSnapshot`**.
4. Semester tuition subtotal = **sum of enrollment snapshots** for that student in that session.

**Best for:**
- Electives / optional subjects
- Late add/drop of one course
- Precise audit: *exactly which rate applied to which subject on which date*

**Example:**

| Enrollment | Subject | Snapshot |
|------------|---------|----------|
| ENR-001 | CSC101 | 15,000 |
| ENR-002 | MTH101 | 12,000 |
| **Semester subtotal** | | **27,000** |

---

### Mode 2 — Semester package (billing + student experience)

**Status:** 📋 Planned

**Flow:**
1. Admin creates or **generates** `ProgramSemesterFeeSchedule` for BSCS Semester 2, Session 2025–2026.
2. Package includes **all core subjects** from curriculum + **additional fees** (lab, exam, library, …).
3. Student **registers for the semester** → one **`semesterFeeSnapshot`** on `SemesterRegistration`.
4. System issues **one challan** (`Fee` record) for `netPayable`.
5. Per-subject enrollments still created (for attendance/grades) but fees roll up to the package.

**Best for:**
- Student portal: *“Your Semester 2 bill: PKR 85,000”*
- Finance: one payment per semester
- Registrar: standard full-load fee for all students in batch

**Example — BSCS Semester 2 package:**

| Line | Amount |
|------|--------|
| CSC201 (3 cr × 5000) | 15,000 |
| MTH201 (3 cr × 4000) | 12,000 |
| … (4 more subjects) | … |
| **Subject subtotal** | **60,000** |
| Lab fee | 5,000 |
| Library | 2,000 |
| Exam fee | 3,000 |
| Sports | 1,500 |
| **Gross** | **71,500** |
| Scholarship (10%) | -7,150 |
| **Net payable** | **64,350** |

---

### How both work together

| Layer | Role |
|-------|------|
| **Semester package** | Planning, challan, student-facing total |
| **Per-enrollment snapshot** | Audit trail, add/drop adjustments, subject-level reporting |

**Reconciliation rule:** For a full standard load, sum of enrollment snapshots should equal package subject subtotal (same rates, same date). If student drops one subject → adjustment on package or partial refund via `FeeAdjustment`.

---

## 9. Fee increase across semesters

### Default policy: `current_rate`

| Event | What happens |
|-------|----------------|
| Student enrolls Sem 1 (2024) @ 4000/credit | Snapshot locked @ 4000 forever for that enrollment |
| University raises to 5000/credit (2025) | Old enrollments unchanged |
| Same student enrolls Sem 2 (2025) | **New** snapshot @ 5000/credit |

**Past semesters frozen. New semesters use current rates.**

### Optional policy: `intake_locked` (BatchFeePolicy — planned)

Batch 2024 pays **2024 rates for all 8 semesters** even if university raises fees later.

| Policy | Sem 2 after hike |
|--------|------------------|
| `current_rate` | New rate |
| `intake_locked` | Intake year rate |

**Resolution order at registration:**
1. Student-specific override (scholarship)
2. BatchFeePolicy for student’s batch
3. SubjectFeeHistory at registration date (+ program override)

Store `feePolicyApplied` on enrollment and semester registration for audit.

### Mid-semester increase (rare)

| Approach | When |
|----------|------|
| Do not change existing snapshots | Default |
| `FeeAdjustment` supplemental charge | Board approves mid-term hike |

---

## 10. Where each fee type is managed

| Fee type | Manage in | Status |
|----------|-----------|--------|
| Tuition (per credit, per subject) | `SubjectFeeHistory` → Subjects → Fees | ✅ |
| Program-specific tuition override | `SubjectFeeHistory.programId` | ✅ |
| Degree plan (which subjects per sem) | `ProgramCurriculum` | ✅ |
| Lab fee on specific subject | `SubjectFeeHistory.feeType: Lab` OR package line | Partial |
| Semester fixed (registration, exam) | `ProgramSemesterFeeSchedule.additionalFees` | 📋 Planned |
| Library, sports, transport, hostel | Package `additionalFees` | 📋 Planned |
| Admission (one-time) | Admissions module / first-semester package | 📋 |
| Scholarship / waiver | `FeeAdjustment` | 📋 Planned |
| Payment / challan | `Fee` model → Operations → Fees | ⚠️ Exists, needs link |
| Per-subject audit snapshot | `Enrollment.feeSnapshot` | ✅ |
| Semester bill snapshot | `SemesterRegistration.semesterFeeSnapshot` | 📋 Planned |

---

## 11. Planned models & APIs

### New models

| Model | Purpose |
|-------|---------|
| `ProgramSemesterFeeSchedule` | Semester fee package (subjects + extras + totals) |
| `SemesterRegistration` | Student registered for program semester in a session |
| `BatchFeePolicy` | Grandfathering / intake-locked rates |
| `FeeAdjustment` | Scholarships, supplements, corrections |

### SemesterRegistration (planned)

| Field | Notes |
|-------|-------|
| `studentId` | |
| `programId` | |
| `batchId` | |
| `academicSessionId` | |
| `programSemester` | 1–8 |
| `registrationMode` | `package` \| `per_subject` \| `mixed` |
| `semesterFeeSnapshot` | Full package snapshot (immutable) |
| `enrollmentIds[]` | Links to per-subject enrollments |
| `feeId` | Link to payment challan |
| `status` | Registered, Paid, Partial, Dropped |

### APIs (planned)

| Method | Path |
|--------|------|
| GET | `/api/programs/:id/semester-fees?semester=&sessionId=` |
| POST | `/api/programs/:id/semester-fees/generate` |
| PUT | `/api/programs/:id/semester-fees/:scheduleId` |
| POST | `/api/semester-registrations` |
| GET | `/api/students/:id/semester-registrations` |
| POST | `/api/semester-registrations/:id/generate-challan` |

---

## 12. Implementation phases

### Fee Phase F0 — Documentation & UX clarity ✅ (this file)

- Document Sessions, Batches, Offerings order
- Document both registration modes
- Cross-link from `maincontext.md`

### Fee Phase F1 — Sessions & Batches UX polish

- Onboarding hints on Sessions / Batches pages
- “Current session” banner
- Batch wizard: pick program → admission session → auto-suggest code
- Empty state on Offerings: *“Create a Session and Batch first”* with links

### Fee Phase F2 — ProgramSemesterFeeSchedule (backend)

- Model + generate from curriculum + SubjectFeeHistory
- API: generate, edit additional fees, activate schedule
- No payment link yet

### Fee Phase F3 — Semester Fees UI

- **Programs → BSCS → Semester Fees** tab
- Grid: Sem 1 … Sem 8
- Each row: subjects count, subject total, extras, grand total
- **Generate from curriculum** button
- Edit additional fees inline

### Fee Phase F4 — SemesterRegistration + package mode

- Register student for semester (batch + session + program semester)
- Build `semesterFeeSnapshot` from active schedule
- Auto-create offerings enrollments OR link existing
- Reconcile with per-subject snapshots

### Fee Phase F5 — Challan integration

- Link `SemesterRegistration` → `Fee` challan
- Partial payment, installments (FeeStructure already has installment schema)
- Student fee portal view

### Fee Phase F6 — Policies & adjustments

- `BatchFeePolicy` (intake_locked)
- `FeeAdjustment` (scholarship, supplemental)
- Reports: expected vs collected per program/semester

---

## 13. UI flows (target)

### Admin — first time setup

```
Sessions (create 2025–2026, mark current)
    ↓
Batches (create BSCS-2024, link admission session)
    ↓
Subjects + Curriculum + Subject fees  [or seed:academic]
    ↓
Program → Semester Fees → Generate Sem 1–8  [F3]
    ↓
Offerings (per subject, per batch, per session)
    ↓
Semester Registration OR per-offering enroll
    ↓
Fees → Challan → Payment  [F5]
```

### Student — semester registration (target)

```
Login → My Program → Register for Semester 2
    ↓
See package breakdown (subjects + extras)
    ↓
Confirm → Challan generated
    ↓
Pay → Status: Paid
```

### Finance — view

```
Operations → Fees
    ├── By student
    ├── By program / semester
    ├── By batch
    └── Outstanding vs collected
```

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| **Academic Session** | University calendar period (e.g. 2025–2026) |
| **Batch** | Student cohort / intake group (e.g. BSCS-2024) |
| **Program semester** | Position in degree plan (1–8), not calendar month |
| **Subject** | Catalog entry (CSC101, 3 credits) |
| **Program curriculum** | Subjects mapped to program + semester |
| **Subject fee history** | Versioned per-credit rate for a subject |
| **Course offering** | Subject running for a batch in a session |
| **Enrollment** | Student in one offering; has `feeSnapshot` |
| **Fee snapshot** | Immutable fee amounts at registration time |
| **Semester fee schedule** | Full fee package for program semester |
| **Semester registration** | Student’s semester-level registration + package snapshot |
| **Challan** | Bill / invoice (`Fee` record) |
| **Additional fee** | Non-credit charge (lab, exam, library, …) |

---

## 15. Decisions log

| Date | Decision |
|------|----------|
| 2026-08-29 | Support **both** per-subject enrollment and semester package |
| 2026-08-29 | Default fee policy: **`current_rate`** (new semester = new rates) |
| 2026-08-29 | Subject fees stay in **SubjectFeeHistory**; package is a **generated view** + extras |
| 2026-08-29 | Setup order: **Sessions → Batches → Offerings** (documented in Section 3–4) |
| 2026-08-29 | Legacy `Course` model removed; use Subject + Offering |
| TBD | When to build F1 vs Teachers module — product priority |

---

## Related files

| File | Contents |
|------|----------|
| `maincontext.md` | Project master context & roadmap |
| `academic-architecture-plan.md` | Academic models, offering, enrollment, fee policies |
| `fee-plan.md` | **This file** — time concepts, fees, both modes |
| `backend/backendcontext.md` | API implementation details |
| `frontend/frontendcontext.md` | UI patterns & routes |
