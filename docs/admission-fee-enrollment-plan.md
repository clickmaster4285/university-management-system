# Admission fee + enrollment — plan (improve current)

> **Updated:** 2026-10-01  
> **People ladder:** `docs/people-intake-flow.md`  
> **Rule:** Extend existing `Fee` / documents / dossiers — **no** second billing product.

---

## Fee policy (product truth)

| Fee | Role | Where set | When charged |
|-----|------|-----------|--------------|
| **Admission fee** | One-time seat confirmation | `Program.admissionFee` (program edit / seed) | Accept → Fee & Enrollment challan |
| **Semester fees** | Ongoing tuition packages | Program → Semester fees (S1–S8) | After student is enrolled |

**Do:** set a separate admission amount **per program** (can differ by program; `0` = no seat fee).  
**Don’t:** put the admission amount only inside Semester 1 as the sole gate — that mixes seat confirmation with tuition and blocks the enroll gate.

Public catalog / directory shows admission (one-time) + each semester + totals.

Seed demo amounts live in `backend/scripts/seedData/academicStructure.data.js` (`programMeta.*.admissionFee`). Re-running academic seed **syncs** those amounts onto existing programs.

---

## Latest people ladder

```
1. Visit              → info only (Campus Visits — not an application)
2. Online / Offline   → full applicant data (same form; two channels)
3. Fee & Enrollment   → admission fee check + finish dossier, then enroll
4. Student Directory  → official student only (no direct Add)
```

| Stage | Sidebar | Status |
|-------|---------|--------|
| Visit | Campus Visits | ✅ Built |
| Offline / Online applicants | Offline Applicants, Online Applicants | ✅ Exists |
| Fee & Enrollment | Fee & Enrollment (`/admissions/dossiers`) | ✅ Challan + proof + verify + gate |
| Student | Student Directory | ✅ Filters: campus / program / year / batch |

---

## Money + enroll flow

```
Online or Offline application (full data)
  → Staff review → Accept  → admission Fee challan (Program.admissionFee)
  → Promote → Fee & Enrollment dossier
       → Applicant pays + uploads fee_payment_proof (track page)
       → Staff verifies fee
       → Complete → Student Directory
            (semester tuition challans start after enrollment)
```

---

## Build sequence

| Step | Work | Status |
|------|------|--------|
| **0** | Clarify Visit vs Offline/Online vs Fee & Enrollment vs Student | ✅ |
| **A** | Student directory filters: campus + program + batch/year | ✅ |
| **B** | Public fee structure on `/catalog` + directory table/matrix | ✅ |
| **C** | Program `admissionFee` + challan on Accept/Promote (`Fee` source `admission`) | ✅ |
| **D** | Applicant uploads `fee_payment_proof`; staff verify on Fee & Enrollment | ✅ |
| **E** | Complete/enroll only after verified paid admission fee | ✅ |
| **F** | Campus Visits (info-only log) | ✅ |
| **G** | Seed + docs: separate admissionFee per program (not in Sem 1) | ✅ |

Reuse: `Fee`, `StudentDocument`, `ProgramSemesterFeeSchedule`, `StudentAdmission` dossier — **not** a second billing module.
