# People intake flow — who is who

> **Updated:** 2026-10-01  
> **Purpose:** One clear ladder from inquiry to enrolled student.

---

## The ladder (in order)

```
1. Visit          → came only to get information (no full application)
2. Online / Offline applicant
                  → full applicant / student-detail data (same form either channel)
3. Fee & enrollment (admission dossier)
                  → check admission fee submission (+ batch / docs), then enroll
4. Student        → official record in Student Directory
```

Do **not** mix these. A visit is not an application. An applicant is not a student until fee/enrollment is completed.

---

## Detail by stage

| Stage | What staff does | App location |
|-------|-----------------|--------------|
| **1. Visit** | Log someone who asked for info / tour — light notes only | **Campus Visits** (`/campus-visits`) |
| **2a. Offline applicant** | Staff enters **full** application (same fields as public apply) | **Offline Applicants** |
| **2b. Online applicant** | Person submitted full apply on the website | **Online Applicants** |
| **3. Fee & enrollment** | After accept/promote: verify **admission fee** proof, finish dossier, then enroll | **Fee & Enrollment** (`/admissions/dossiers`) |
| **4. Student** | Official enrolled student only | **Student Directory** (no direct Add student) |

Online and offline differ only by **channel**. Both carry the same full applicant data and share review → promote → fee check → student.

---

## Pipeline diagram

```
Visit (info only)     ← ends here unless they decide to apply
  Campus Visits

Online apply  ──┐
                ├──► Application (full data) → review / Accept (challan)
Offline apply ──┘              │
                               ▼
                    Fee & enrollment (dossier)
                    · admission fee challan / proof / verify
                    · batch, docs, complete
                               ▼
                    Student Directory
```

---

## Sidebar (Students section)

1. Campus Visits  
2. Offline Applicants  
3. Online Applicants  
4. Fee & Enrollment *(admission fee check + enroll)*  
5. Student Directory  

---

## Related

See `docs/admission-fee-enrollment-plan.md` for fee challan / proof / enroll gate.

**Fee rule:** admission fee is **one-time per program** (`Program.admissionFee`). Semester fee schedules are **tuition only** — do not use Semester 1 as the admission fee.
