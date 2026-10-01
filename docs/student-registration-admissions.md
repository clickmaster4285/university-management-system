# Student Registration & Admissions — What We Built

> **Date:** 2026-09-26  
> **Scope:** Public apply → staff review → corrections → dossier → student directory  
> **Purpose:** Record *what* we did, *why* we did it, and *how* it improves student registration end-to-end.

---

## 1. Goal

Build one clear path from **applicant** to **enrolled student**, without duplicate forms, lost documents, or unclear feedback when something is wrong.

Before this work, apply / visitor intake / student create / dossier each drifted separately. Documents often could not be seen or downloaded on review. Applicants had no way to fix mistakes without starting over.

---

## 2. Shared dossier form (single source of truth)

### What we did

- Created shared `StudentDossierForm` used by:
  - Public **Apply** (`/apply`)
  - Visitor / internal create
  - Staff **admission dossier**
  - Direct **Add student** (`/students/create`)
  - Applicant **Track & update** (`/apply/status`)
- Same fields: personal, program, guardian, address, previous education
- Same validation rules by mode (`apply` / `dossier` / `create`)
- Same document slots component (`StudentDocumentSlots`)

### Why

- One registration shape means staff and applicants see the same data.
- Fixes and UI improvements (layout, required asterisks, CNIC format) land once, everywhere.
- Prevents “filled on apply but missing on create” drift.

### How it improves registration

| Before | After |
|--------|--------|
| Multiple similar forms, different fields | One form language for all intake paths |
| Hard to keep UX consistent | Dense left/right grids, red required `*`, CNIC auto-format |
| Easy to forget a field on one path | Shared required checks (`getMissingDossierFields`) |

---

## 3. Application sources & navigation

### What we did

- Split pipeline by **source**:
  - **Visitor applications** — staff-assisted / walk-in (`internal`)
  - **Online applicants** — public `/apply` (`public`)
- Sidebar links and list filters for each
- Internal create page reuses the same dossier + documents as public apply

### Why

- Online and walk-in need different queues but the same data model.
- Staff should not mix visitor paperwork with website applicants.

### How it improves registration

- Clearer workload (“who applied online vs who walked in”).
- Same documents and fields either way → promote / enroll stays consistent.

---

## 4. Documents: upload, view, download, review

### What we did

- Document slots: CNIC, photo, matric, intermediate, bachelor, domicile, character, migration, other
- Public upload on submit (apply / visitor create)
- Staff can list / view / download / approve / reject on application review
- In-browser **View** (images & PDFs) plus **Download**
- Rejection requires a **reason** shown to the applicant
- Fixed 404 on view/download: multer sometimes saved files under `other/` while DB path used the real type — download now recovers by filename and heals the stored path; new uploads send `documentType` before the file

### Why

- Admissions must see what the applicant attached without guessing paths.
- Rejecting without a reason forces phone/email back-and-forth.
- Broken downloads blocked the whole review loop.

### How it improves registration

| Before | After |
|--------|--------|
| Docs not shown on `/admissions/APP-…` | **Applicant documents** panel on review |
| Download failed (404) | View + download work; paths auto-heal |
| No approve/reject | Per-slot **Approved / Rejected** + reason |
| Applicant blind to problems | Reasons appear on track page |

---

## 5. Two-way correction loop (no new application)

### What we did

**Staff → applicant**

- Status: **Action Required**
- Field: `applicantMessage` (visible to applicant)
- Review UI: **Send to applicant** + copy track link + email draft
- Rejected documents keep their reasons

**Applicant → staff** (`/apply/status?applicationId=…`)

- Open with Application ID + CNIC
- See staff message
- Same **full apply form** (all fields, including ones left empty earlier)
- Same **full document slots** (upload missing / replace rejected)
- Optional note to admissions (`applicantReply`)
- **Send updates to admissions** → saves fields, uploads staged files, sets status **Under Review**

### Why

- Wrong phone, city, photo, or missing mother name should not force a brand-new apply.
- Staff need one button that “sends” the request; applicants need one button that “sends” the fix.
- Empty fields on first submit must still be editable later on the same form.

### How it improves registration

| Before | After |
|--------|--------|
| “Please apply again” | Correct in place on track page |
| Internal remarks only (staff-only) | Applicant-visible message + reply |
| Docs-only fixes | Fields **and** documents |
| Unclear when fixes arrive | Status returns to Under Review; reply shown on review |

**Applicant never re-submits a second application ID** for the same CNIC/email correction cycle.

---

## 6. Direct student create (directory)

### What we did

- `/students/create` uses the same dossier form + document slots
- Creates student record and can show portal credentials once
- Wider layout (`max-w-5xl`) aligned with apply

### Why

- Some students skip the public pipeline (transfer, special intake).
- Staff still need the same dossier quality and attachments.

### How it improves registration

- Directory create matches admissions quality instead of a thin “name + email” form.
- Documents can be attached at create time.

---

## 7. Promote → admission dossier → enroll

### What we did

- Promote accepted/shortlisted applications to an admission dossier
- Application documents re-linked onto the dossier (`studentAdmission`)
- Dossier completion still creates the official student (+ portal login where enabled)

### Why

- Pipeline stays: apply → review → dossier → student.
- Documents must survive promote, not disappear.

### How it improves registration

- Continuous paper trail from first upload to enrollment.
- Less re-scanning / re-uploading after acceptance.

---

## 8. UX improvements along the way

| Change | Why |
|--------|-----|
| Denser grids (2–4 columns) | Less wasted vertical space on apply/create |
| Red required asterisks | Clear what must be filled |
| CNIC auto-format `12345-1234567-1` | Fewer invalid IDs |
| Review page cards + decision section | Faster staff scanning |
| Track page mirrors `/apply` form | Applicant familiarity; complete empty fields |
| Replace removed on staff review (view/approve/reject) | Staff review ≠ re-upload; applicant re-uploads on track |

---

## 9. End-to-end flows (how registration works now)

### A. Online applicant (happy path)

1. Applicant fills `/apply` (full form + documents) → gets `APP-26-XXXX`
2. Staff opens Online applicants → review
3. View/download docs → approve → mark Shortlisted/Accepted → promote
4. Complete dossier → student record (+ portal login if issued)

### B. Fix photo / wrong phone (correction path)

1. Staff rejects photo (reason) and/or writes message (“fix phone and photo”)
2. Staff clicks **Send to applicant** (Action Required)
3. Applicant opens `/apply/status?applicationId=…` + CNIC
4. Sees message; edits full form; replaces photo; **Send updates**
5. Staff sees Under Review + reply + new files → continue decision

### C. Walk-in / visitor

1. Staff uses visitor create (same form/docs)
2. Same review / Action Required / promote path as online

### D. Direct directory create

1. Academics → Add student (same form/docs)
2. Student appears in directory with optional portal credentials

---

## 10. Key files (reference)

| Area | Files |
|------|--------|
| Shared form | `frontend/src/components/student/StudentDossierForm.tsx` |
| Document slots | `frontend/src/components/student/StudentDocumentSlots.tsx` |
| Public apply | `frontend/src/pages/public/ApplyPage.tsx` |
| Track / corrections | `frontend/src/pages/public/ApplicationTrackPage.tsx` |
| Staff review | `frontend/src/pages/admissions/ApplicationReviewPage.tsx` |
| Application docs panel | `frontend/src/pages/admissions/ApplicationDocumentsPanel.tsx` |
| Student create | `frontend/src/pages/academics/students/StudentCreatePage.tsx` |
| Public API | `backend/controllers/publicCatalog.controller.js`, `backend/routes/public.routes.js` |
| Documents API | `backend/controllers/studentDocument.controller.js` |
| Application model | `backend/models/StudentApplication.model.js` (`applicantMessage`, `applicantReply`, `Action Required`) |
| Upload paths | `backend/utils/uploadPaths.js`, `backend/middleware/upload.js` |

---

## 11. Why this improves student registration overall

1. **One form** — less training, fewer missing fields, consistent data into MongoDB.  
2. **Documents are first-class** — visible, previewable, downloadable, approvable.  
3. **Corrections without re-apply** — faster turnaround, fewer duplicate applications.  
4. **Clear send buttons both ways** — staff request ↔ applicant response is explicit.  
5. **Same path for online, visitor, and directory** — registration quality does not depend on channel.  
6. **Promote keeps attachments** — enrollment does not restart the paperwork.  
7. **Applicant-visible feedback** — rejection reasons and messages reduce phone/email noise.

---

## 12. Suggested follow-ups (not done here)

- Auto-email when staff clicks **Send to applicant** (SMTP is currently failing credentials)
- Notification badge on Online applicants when status returns to Under Review after a correction
- Lock approved document slots on track so applicants only replace Rejected/Pending
- Audit log of field diffs when applicant sends updates

---

## 13. Public catalog roadmap (Oct 2026)

Public visitors should see **university → campuses → programs by category**, with **Open / Closed** admission windows, then a **stepped** apply form — not a single flat program dropdown.

Full plan and rules: [`docs/public-admissions-catalog.md`](./public-admissions-catalog.md).

**Step 1 (done):** `Program.admissionOpensAt` / `admissionClosesAt` on the model, create/update API, Programs staff form + list “Admissions” column. Active with no dates = not open for public apply.

**Step 2 (done):** `GET /api/public/catalog` returns university + Active campuses → programs (via department `campusIds`) grouped by category, each with `admissionOpen` / `admissionLabel`. Flat `/catalog/programs|campuses` still available for the current apply form.

**Step 3 (done):** Public `/programs` browse (campus sidebar → categories → Open/Closed). Home + nav use live university name. Open programs link to `/apply?campusId=&programId=` (locked selection).

---

*Document written to capture the student registration / admissions work completed around 2026-09-26.*
