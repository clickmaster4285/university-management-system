# UniversityMS — Structural / Data Model Issues

> **Created:** 2026-09-07 — multi-campus faculty, cross-faculty department, campus admin, staff campus/faculty assignment gaps

---

## Issue 1 — Faculty cannot belong to multiple campuses

**Area:** Faculty model / Faculty form

**Current behavior:**
- `Faculty.campusId` is a single `ObjectId` ref to `Campus`.
- Faculty name/code unique index is scoped to one campus: `{ campusId: 1, name: 1 }`.
- Frontend faculty form has a single **Campus** dropdown.

**Problem:**
In multi-campus universities, the same faculty often exists across campuses. Example: “Faculty of Computing” may have departments on both Main Campus and Satellite Campus. Today you must create duplicate faculty records per campus.

**Impact:** Data duplication, confusing faculty listings, hard to aggregate across campuses.

---

## Issue 2 — Department cannot belong to multiple faculties

**Area:** Department model / Department form

**Current behavior:**
- `Department.facultyId` is a single `ObjectId` ref to `Faculty`.
- Backend `validateFacultyForCampus` enforces faculty must belong to the same campus as the department.
- Frontend department form has a single **Faculty / School** dropdown, filtered by selected campus.

**Problem:**
Some departments are interdisciplinary and sit under more than one faculty. Example: “Department of Data Science” may be jointly under Faculty of Computing AND Faculty of Business.

**Impact:** Forces artificial faculty assignment, limits organizational accuracy.

---

## Issue 3 — Campus has no admin / linked staff field

**Area:** Campus model / Campus form / Campus detail

**Current behavior:**
- `Campus` model has no `campusAdminId`, `adminId`, or similar field.
- Campus form has no staff selector for campus administrator.
- Campus detail shows stats but no linked campus admin.

**Problem:**
There is no way to designate which staff member is the campus administrator. All access control is through global `PlatformRole`, not campus-scoped admin assignment.

**Impact:** Cannot model “Campus Admin” as a distinct operational role tied to a specific campus.

---

## Issue 4 — StaffMember has no explicit campus/faculty assignment at top level

**Area:** StaffMember model / Staff form

**Current behavior:**
- `StaffMember.employments[]` has `campusId` and `departmentId`, so a staff member CAN be linked to a campus through employment records.
- However, there is no top-level `campusId` or `facultyId` on `StaffMember` itself.
- Staff forms/detail pages do not surface campus or faculty selectors outside the employment section.

**Problem:**
Quick staff-to-campus or staff-to-faculty association is not visible in the UI. If a staff member has multiple employments, it is not obvious which is their primary campus/faculty context.

**Impact:** Harder to filter staff by campus/faculty, assign campus-specific roles, or display “campus staff” in campus detail.

---

## Issue 5 — Batch / Session linkage is one-directional and weak

**Area:** Batch model / Session detail

**Current behavior:**
- `Batch.admissionSessionId` links a batch to the session when students were admitted.
- There is no reverse navigation from `AcademicSession` to its batches except via manual filter on `/batches`.
- Session detail page now shows linked batches, but batch list does not have a strong “session view” beyond a dropdown filter.

**Problem:**
Users may want to see all batches for a given session from both directions. The relationship is clear in data but not surfaced symmetrically in the UI.

**Impact:** Extra clicks to move between session and its batches.

---

## Issue 6 — No campus-scoped role assignment mechanism

**Area:** RoleAssignment model / Permissions

**Current behavior:**
- `RoleAssignment` supports scoped duties (`scopeType`: University/Campus/Faculty/Department/Program) with `scopeId`.
- `PlatformRole.moduleAccess` is global, not campus-scoped.
- There is no UI to create a “Campus Admin” role that is automatically limited to one campus.

**Problem:**
Operational roles like “Campus Admin” or “Faculty Coordinator” cannot be modeled purely through the existing permission system without manual per-user module access overrides.

**Impact:** Admin must manually configure module access per user instead of assigning a campus-scoped role template.

---

## Recommended fix approach

| Issue | Suggested direction |
|-------|---------------------|
| Faculty multi-campus | Add `campusIds[]` array on Faculty; deprecate single `campusId`; update unique index to `{ name: 1 }` globally or per-university. |
| Department multi-faculty | Add `facultyIds[]` array on Department; relax `validateFacultyForCampus` cross-campus check or make it optional. |
| Campus admin | Add `campusAdminId` ref to `StaffMember` on `Campus`; expose in campus form + detail page. |
| Staff campus/faculty | Add optional top-level `campusId` / `facultyId` on `StaffMember`, derived from primary employment if blank; surface in staff form/list. |
| Batch/session navigation | Add dedicated session-filtered batch view or section in session detail; keep existing batch filters. |
| Campus-scoped roles | Extend `PlatformRole` templates with optional `scopeType`/`scopeId` or add a `CampusRoleAssignment` sub-document. |

---

## Notes

- These are **data model / feature gap** issues, not runtime bugs.
- Fixes require coordinated backend model changes + frontend form/UI updates.
- Consider whether multi-campus faculty and multi-faculty department are truly required, or if the simpler fix is “allow duplicate faculty/department names across campuses.”
