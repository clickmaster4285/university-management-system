# Real-life UX scenarios & navigation fixes

> **Purpose:** Walk the admin path like a real university, list friction, and what we fixed.  
> **Last updated:** 2026-09-29  
> **Related:** `academic-progression-models.md`, Setup Guide at `/setup`

---

## Correct real-life order (the ladder)

```
1  University Profile
2  Campuses
3  Faculties
4  Departments
5  Programs
6  Subjects
7  Program Curriculum     ← under a Program (not its own sidebar item)
8  Subject / Semester Fees ← Subject fees + Program → Semester Fees
9  Academic Sessions
10 Batches
11 Course Offerings
12 Enrollments            ← on an Offering row (not its own sidebar item)
   then: Students / Semester Registrations / Teaching
```

Skipping ahead (e.g. Offerings before Sessions) is the #1 source of “empty dropdown” bugs.

---

## Scenario walkthrough (find issues)

### S1 — Brand-new university (day 0)

| Step | Action | Expected | Issue found | Fix |
|------|--------|----------|-------------|-----|
| 1 | Open app after login | Know where to start | Sidebar jumped to HR before academics | Reordered: Institution → Catalog → Term → Students → Teaching → HR |
| 2 | University | Clear name | Labeled only “University” | Renamed **University Profile**; Setup guide button |
| 3 | `/setup` | See 1–12 ladder | Did not exist | Added **Setup Guide** page + sidebar link |
| 4 | Programs → Curriculum | Find curriculum | Not in sidebar | Documented as nested under Program; ladder hints |
| 5 | Sessions before Batches | Batches warn if no session | OK (amber banner) | Kept; clearer copy |
| 6 | Offerings | Understand vs Registration | Confused with semester registration | Page banner + cross-link |

### S2 — Open a term for BSCS-2024

| Step | Action | Expected | Issue found | Fix |
|------|--------|----------|-------------|-----|
| 1 | Session Fall 2025 current | One current session | Easy to miss | Banner on Sessions page |
| 2 | Offerings for batch + sem | Classes exist | Empty if curriculum/fees missing | Setup guide explains prerequisites |
| 3 | Put 200 students in Sem 1 | Bulk | Only one-by-one registration | Documented; bulk/promote is next build (Model A) |

### S3 — Attendance for one class

| Step | Action | Expected | Issue found | Fix |
|------|--------|----------|-------------|-----|
| 1 | Teaching → Class Attendance | Pick offering | Was labeled only “Attendance” (confused with staff) | Renamed **Class Attendance** |
| 2 | Mark Present/Absent | Roster = enrollments | OK after Phase 6 | Offering-first UI |

### S4 — Naming confusion map

| Confusing name (old) | Clearer name (now) |
|----------------------|--------------------|
| University | University Profile |
| Governance | Institution |
| Sessions | Academic Sessions |
| Offerings | Course Offerings |
| Registrations | Semester Registrations |
| Visitor | Visitor Applicants |
| Attendance (teaching) | Class Attendance |
| Exam Grades | Exams & Grades |
| Settings & Configuration | Settings |

---

## Navigation structure (after fix)

```
Overview          Dashboard · Setup Guide · …
Institution       University Profile · Campuses · Faculties · Departments
Academic Catalog  Programs · Subjects
Term & Classes    Academic Sessions · Batches · Course Offerings · Semester Registrations
Students          Visitor Applicants · Online Applicants · Student Directory
Teaching          Class Attendance · Assignments · Exams & Grades · Online Classes
HR & Staff        …
Finance           Challans first (money path), then Payroll / Finance / Reports
Campus Services   …
Settings          …
```

---

## Still open (do next)

1. **Bulk register + promote batch** (Model A) — required for real student volume  
2. Programs / Subjects list pages: add same `SetupContextBanner` (step 5–6)  
3. Empty-state CTAs on Offerings when zero sessions/batches (stronger than toast)  
4. Dashboard widget: “Setup progress 7/12” linking to `/setup`  
5. Color: keep forest-green primary; avoid purple redesign — polish empty states and density only  

---

## How to re-test

1. Log in as admin  
2. Open **Setup Guide** from sidebar  
3. Click ladder 1 → 12 and confirm each page explains *what it is* and *what’s next*  
4. Create offering only after session + batch exist  
5. Enroll via offering; confirm attendance roster matches  

When S2 bulk path is built, re-run S2 with a full batch and update this file.
