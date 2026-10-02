# TypeScript Compilation Bugs

> **Created:** 2026-09-03 — 4 pre-existing TS errors found during `npx tsc --noEmit`

---

## Bug 1 — Duplicate `StudentCategory` export

**File:** `src/features/index.ts:22`

**Error:**
```
TS2308: Module './programSemesterFee' has already exported a member named 'StudentCategory'.
Consider explicitly re-exporting to resolve the ambiguity.
```

**Root Cause:**
Both `features/programSemesterFee.ts` (line 4) and `features/semesterRegistration.ts` (line 5) export the identical type:
```ts
export type StudentCategory = 'Regular' | 'Self-Finance' | 'Scholarship' | 'International';
```
When `index.ts` does `export * from './programSemesterFee'` and `export * from './semesterRegistration'`, TypeScript sees two conflicting exports of the same name.

**Fix:**
Remove the duplicate from `semesterRegistration.ts` and import it from `programSemesterFee.ts`.

**Files to modify:**
- `src/features/semesterRegistration.ts` — remove `export type StudentCategory`, add `import { type StudentCategory } from './programSemesterFee'`

**Status:** ✅ Fixed

---

## Bug 2 — `StudentsPage` search type mismatch

**File:** `src/pages/academics/students/StudentsPage.tsx:31`

**Error:**
```
TS2322: Type 'string | undefined' is not assignable to type 'string | number'.
Type 'undefined' is not assignable to type 'string | number'.
```

**Root Cause:**
`studentAPI.getAll()` is typed as `getAll(params?: Record<string, string | number>)`. The call:
```ts
studentAPI.getAll({ limit: 500, search: search || undefined })
```
produces `search: string | undefined`, but `undefined` is not a valid value for `Record<string, string | number>`.

**Fix:**
Build the params object conditionally — only add `search` when it's truthy:
```ts
const params: Record<string, string | number> = { limit: 500 };
if (search) params.search = search;
const list = await studentAPI.getAll(params);
```

**Files to modify:**
- `src/pages/academics/students/StudentsPage.tsx`

**Status:** ✅ Fixed

---

## Bug 3 — `ApplicationsPipelinePage` search type mismatch

**File:** `src/pages/admissions/ApplicationsPipelinePage.tsx:68`

**Error:**
```
TS2322: Type 'string | undefined' is not assignable to type 'string | number'.
Type 'undefined' is not assignable to type 'string | number'.
```

**Root Cause:**
Identical to Bug 2. `studentApplicationsAPI.list()` is typed as `list(params?: Record<string, string | number>)`. The call:
```ts
studentApplicationsAPI.list({ limit: 500, search: search || undefined })
```
produces `search: string | undefined`.

**Fix:**
Same approach — build params conditionally:
```ts
const params: Record<string, string | number> = { limit: 500 };
if (search) params.search = search;
const listRes = await studentApplicationsAPI.list(params);
```

**Files to modify:**
- `src/pages/admissions/ApplicationsPipelinePage.tsx`

**Status:** ✅ Fixed

---

## Bug 4 — `StaffRoleAssignments` scopeId type too narrow

**File:** `src/pages/people/staff/StaffRoleAssignments.tsx:110`

**Error:**
```
TS2339: Property '_id' does not exist on type 'never'.
```

**Root Cause:**
`RoleAssignment.scopeId` is typed as `string | null` in `features/roleAssignments.ts:8`. The code:
```ts
const scopeId =
  typeof assignment.scopeId === "object"
    ? assignment.scopeId?._id    // ← scopeId is null here (narrowed from string | null)
    : assignment.scopeId || "";
```
TypeScript narrows `typeof null === "object"` to `null`, so `._id` access becomes `null._id` which is `never`. The backend can return `scopeId` as a populated object `{ _id: string }` but the type doesn't reflect that.

**Fix:**
Update `RoleAssignment.scopeId` type to include the populated object form:
```ts
scopeId?: string | { _id: string } | null;
```

**Files to modify:**
- `src/features/roleAssignments.ts`

**Status:** ✅ Fixed

---

## Verification

After all fixes, run:
```bash
npx tsc --noEmit
```

Expected: 0 errors (all 4 bugs resolved, no regressions).

**Result:** ✅ 0 errors — `npx tsc --noEmit` passes clean.
