# Campus Compass — Backend (standalone)

A small, standalone Node.js + Express backend added in its own `backend/` folder.
It does **not** touch or depend on the existing frontend code — it's a separate app
you run alongside it. Data is stored in simple JSON files (`src/data/*.json`) so
there's no database setup required; good enough for local development / Postman
testing.

CRUD is implemented for two entities that match the frontend's data models
(`src/lib/mock-data.ts`): **Students** and **Teachers**. More entities (courses,
departments, fees, etc.) can be added the same way — see "Adding another entity"
below.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev     # auto-restarts on file changes (Node's --watch)
# or
npm start
```

Server runs at **http://localhost:5000** by default (change `PORT` in `.env`).

## 2. Test with Postman

A ready-made collection is included: `backend/postman_collection.json`

In Postman: **Import** → select that file → you'll get a "Campus Compass Backend"
collection with Health Check, Students, and Teachers folders, each with
Get All / Get By Id / Create / Update / Delete requests already set up.

Or just hit the endpoints directly (also works with `curl`):

### Health check
```
GET /
```

### Students
| Method | URL                     | Body (JSON)                                                   |
|--------|-------------------------|-----------------------------------------------------------------|
| GET    | `/api/students`         | —                                                                |
| GET    | `/api/students/:id`     | —                                                                |
| POST   | `/api/students`         | `{ "name", "program", "department", ... }` (name/program/department required) |
| PUT    | `/api/students/:id`     | any subset of student fields to update                          |
| DELETE | `/api/students/:id`     | —                                                                |

### Teachers
| Method | URL                     | Body (JSON)                                                   |
|--------|-------------------------|-----------------------------------------------------------------|
| GET    | `/api/teachers`         | —                                                                |
| GET    | `/api/teachers/:id`     | —                                                                |
| POST   | `/api/teachers`         | `{ "name", "department", "designation", ... }` (name/department/designation required) |
| PUT    | `/api/teachers/:id`     | any subset of teacher fields to update                          |
| DELETE | `/api/teachers/:id`     | —                                                                |

All responses look like:
```json
{ "success": true, "data": { ... } }
```
or on error:
```json
{ "success": false, "message": "..." }
```

## 3. Folder structure (what was added)

```
backend/
├── package.json
├── .env.example
├── .gitignore
├── postman_collection.json      # import into Postman to test instantly
├── README.md
└── src/
    ├── server.js                # entry point, starts the HTTP server
    ├── app.js                   # express app, middleware, route mounting
    ├── routes/
    │   ├── student.routes.js
    │   └── teacher.routes.js
    ├── controllers/
    │   ├── student.controller.js   # CRUD logic for students
    │   └── teacher.controller.js   # CRUD logic for teachers
    ├── middleware/
    │   └── errorHandler.js      # 404 + generic error handler
    ├── utils/
    │   └── jsonStore.js         # tiny helper to read/write a JSON file as a "table"
    └── data/
        ├── students.json        # seed data / persisted student records
        └── teachers.json        # seed data / persisted teacher records
```

## 4. Adding another entity (e.g. Courses)

1. `src/data/courses.json` — seed array, e.g. `[]`
2. `src/controllers/course.controller.js` — copy `teacher.controller.js`, rename fields
3. `src/routes/course.routes.js` — copy `teacher.routes.js`
4. In `src/app.js`, add:
   ```js
   import courseRoutes from "./routes/course.routes.js";
   app.use("/api/courses", courseRoutes);
   ```

## 5. Connecting the frontend later (optional)

The frontend currently uses generated mock data (`src/lib/mock-data.ts`) and was
**not modified**. Whenever you're ready to wire it up to this backend, you'd fetch
from `http://localhost:5000/api/students` / `/api/teachers` instead of calling
`generateStudents()` / `generateTeachers()` — no rush, that's a separate step.
