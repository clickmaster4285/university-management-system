
The Complete Academic Ladder

* **University** **: The global institution that holds the legal authority to grant degrees.**
* **Campuses** **: The physical sites or regional branches where the university operates.**
* **Faculties** **: The massive academic branches grouping related fields (e.g., Faculty of Computing).**
* **Departments** **: The specific focus areas within a faculty (e.g., Department of Software Engineering).**
* **Programs** **: The specific degrees you enroll in (e.g., BS in Software Engineering, MS in Computer Science).**
* **Subjects** **: The individual classes or courses you take each semester to earn that degree (e.g., Programming Fundamentals, Calculus).**
* **Professors** **: The academic staff assigned by the department to teach the subjects and conduct research.**
* **Students** **: The individuals enrolled in the programs, attending the subjects, and learning from the professors.**

University (The entire institution)
  └── Campuses (The physical locations)
        └── Faculties / Colleges (The broad fields of study)
              └── Departments (The specific subject divisions)
                    ├── Research Labs / Centers (Where research happens)
                    └── Programs (The specific degree pathways)
                          └── Academic Terms (Semesters, quarters, or trimesters)
                                └── Subjects / Courses (Individual classes)
                                      └── Credit Hours / Units (Weight of the subject)
                                            ├── Professors & TAs (Teaching staff)
                                            ├── Admin Staff (Advisors, registrars, coordinators)
                                            └── Students (The learners)

## Academic architecture (target)

See **`academic-architecture-plan.md`** for the approved direction: **Subject** catalog → **ProgramCurriculum** → **SubjectFeeHistory** → **CourseOffering** + **Enrollment** with per-registration `feeSnapshot` and optional **BatchFeePolicy** for continuing students.

The legacy `Course` model and `/courses` UI remain for now but are **not seeded** — use **`npm run seed:academic`** for the new model. Phase 5+ will replace offerings/enrollment.

## Seeding (new model)

```bash
cd backend
npm run seed:academic:dry   # preview
npm run seed:academic       # apply
```

Creates: University → Campus → Faculty → Department → Program → Subject → ProgramCurriculum → SubjectFeeHistory.

Startup seeds **admin only** (`seedDefaultAdmin` in `server.js`). Legacy `seedCourses` removed.

## Design & engineering principles

All features — UI and API — should be **easy to use, easy to follow, and easy to understand**.

| Area | Guideline |
|------|-----------|
| **UX** | Clear labels, grouped information (e.g. fees by program), one primary action per screen, consistent list → create/edit → detail flows |
| **UI** | Match established patterns (KPI row, DataTable, tabs, forms). Avoid mixed or flat lists when hierarchy helps (program → rates → dates) |
| **Frontend** | Lean components, lazy routes, minimal re-fetches, shared form components, readable state — optimize for clarity first, then bundle size |
| **Backend** | Lean REST, indexed queries, `asyncHandler`, validate early, no redundant endpoints — optimize for correct data and fast reads/writes |
| **Efficiency** | Do not over-engineer; prefer small focused changes that reuse existing conventions |

Context files: `frontend/frontendcontext.md`, `backend/backendcontext.md`, `academic-architecture-plan.md`.

## Frontend Layout System

- **AppLayout** (`layouts/AppLayout.tsx`) — handles auth check, renders SidebarProvider + AppSidebar + Topbar + `<Outlet />`
- Pages are self-contained — no wrapper component needed. Each page renders its own content with a header div.
- **AppShell** was removed — all pages updated to remove the wrapper.
- **Sidebar** (`layouts/sidebar.tsx`) — collapsible groups with chevron arrows. Groups auto-expand when a child route is active.
- Individual pages no longer check authentication — AppLayout redirects to `/login` if not authenticated.

## Academic CRUD UI Pattern (established)

List pages for structural entities (Faculty, Department) follow:

1. **KPI row** — Total / Active / Inactive from stats API
2. **DataTable** — search inside table, Filter panel, Add button in header
3. **Create/Edit** — separate routes with one shared form component (Campus and Department)

```
/campuses          → list (card grid)
/campuses/create   → CampusForm mode="create"
/campuses/edit/:id → CampusForm mode="edit"

/faculties         → list (DataTable + modal form — programs next may use routes instead)

/departments       → list (DataTable + view modal)
/departments/create → DepartmentForm mode="create"
/departments/edit/:id → DepartmentForm mode="edit"

/programs          → list (pending: align with department pattern)
```
