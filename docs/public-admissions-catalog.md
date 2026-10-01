# Public Admissions Catalog — Plan

> **Created:** 2026-10-01  
> **Goal:** Public visitors see the university → campuses → programs by category, with clear Open / Closed admission windows, then enter a stepped apply form. Improve current Program + public site before any new Intake module.

---

## Target public experience

1. **University** — real name/branding from University profile (not hardcoded marketing copy only).
2. **Campuses** — Active campuses listed.
3. **Programs per campus** — derived via Department → `campusIds` (no new Program↔Campus table yet).
4. **Categories** — group by existing `degreeLevel` (e.g. BS/BBA/LLB → Undergraduate; MS/MBA → Masters; PhD → Doctoral).
5. **Open / Closed** — each program shows admission open until a date, or closed. Not a single flat dropdown of every program.
6. **Stepped apply** — browse first; Apply only when Open; form steps with campus + program already chosen.

---

## What already exists

| Piece | Status |
|--------|--------|
| `Program` + `degreeLevel` | ✅ |
| `Campus` + Active status | ✅ |
| Department `campusIds` (program ↔ campus path) | ✅ |
| Public `/apply` + flat catalogs | ✅ (to be replaced by browse → stepped form) |
| University profile (staff) | ✅ (public home still partly hardcoded) |
| Admission open/close dates on Program | ✅ Step 1 |
| Public catalog tree API | ✅ Step 2 |
| Public browse UI | ✅ Step 3 |
| Stepped apply shell | ⬜ Step 4 |

---

## Admission window rules (Program)

Fields on **existing** `Program` (not a new module):

| Field | Meaning |
|--------|---------|
| `admissionOpensAt` | Optional. Applications accepted from this date (inclusive). |
| `admissionClosesAt` | Optional. Applications accepted through this date (inclusive end of day in UI terms). |

**Public “Open” when all are true:**

- `status === Active`
- `isDeleted` is false
- `now >= admissionOpensAt` (if set)
- `now <= admissionClosesAt` (if set)

**Otherwise Closed** for public apply (including Active programs with **no dates set** — staff must set a window before the public can apply). Catalog browse (Step 3) may still list Active programs as Closed until dates are set.

Validation: if both dates are set, `admissionOpensAt` must be ≤ `admissionClosesAt`.

---

## Build sequence

| Step | Work | Status |
|------|------|--------|
| **1** | Program model + staff create/edit/list for admission dates | ✅ Done |
| **2** | Extend `/api/public/catalog` → university + campuses → categories → programs + open/closed | ✅ Done |
| **3** | Public browse UI (home / programs page) | ✅ Done |
| **4** | Stepped apply form; prefill campus/program; reject closed on submit | ⬜ |
| **5** | Staff data hygiene (campus–department links, degree levels, dates) | ⬜ |

**Not yet:** full `AdmissionIntake` module, seats/waitlists, auto-batch on apply, per-campus date overrides (add later only if Main vs Branch windows differ).

---

## Category mapping (for Step 2+)

| Category | `degreeLevel` values |
|----------|----------------------|
| Undergraduate | `BS`, `BBA`, `LLB` |
| Masters / Graduate | `MS`, `MBA` |
| Doctoral | `PhD` |
| Other | `Other` |

---

## Related files

- Model: `backend/models/Program.model.js`
- Admission helpers: `backend/utils/programAdmission.js`
- Public API: `backend/controllers/publicCatalog.controller.js`, `backend/routes/public.routes.js`
  - `GET /api/public/catalog` — tree (university → campuses → categories → programs)
  - `GET /api/public/catalog/programs|campuses|sessions` — flat lists (apply form)
- Staff UI: `frontend/src/pages/academics/programs/ProgramForm.tsx`, `ProgramsPage.tsx`
- Types / client: `frontend/src/features/programs.ts`, `frontend/src/features/studentApplications.ts`
- Public browse: `frontend/src/pages/public/ProgramsCatalogPage.tsx`, `HomePage.tsx`, `hooks/usePublicCatalog.ts`
- Pipeline doc: `docs/student-registration-admissions.md`
