
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

## Frontend Layout System

- **AppLayout** (`layouts/AppLayout.tsx`) — handles auth check, renders SidebarProvider + AppSidebar + Topbar + `<Outlet />`
- Pages are self-contained — no wrapper component needed. Each page renders its own content with a header div.
- **AppShell** was removed — all 30 pages updated to remove the wrapper.
- **Sidebar** (`layouts/sidebar.tsx`) — collapsible groups with chevron arrows. Groups auto-expand when a child route is active.
- Individual pages no longer check authentication — AppLayout redirects to `/login` if not authenticated.
