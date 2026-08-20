# Backend Models Structure

Models are organized into domain folders. Each folder groups models of the same category/belongs to the same module.

```
backend/models/
├── core/          University, Campus, User, Settings, Counter
├── academic/      Student, Teacher, Course, Department, Semester, AcademicSession,
│                  Batch, Admission, Assignment, Attendance, Exam
├── finance/       Fee, FeeStructure, Finance, Payroll
├── hr/            Employee, Leave, Recruitment
├── transport/     Bus, Driver, Route
├── library/       Book, Borrowing
├── communication/ Event, Notification
├── report/        Report
└── shared/        Reusable embedded sub-schemas (address, academicSettings)
```

## Shared Schemas (`shared/`)

Reusable embedded sub-schemas shared by multiple models:

| File              | Used by                       |
| ----------------- | ----------------------------- |
| `address.js`      | University, Campus            |
| `academicSettings.js` | University                 |

### Importing a model

```js
import University from "../models/core/University.js";
import address from "../models/shared/address.js";
```

## Convention

- A model file exports a single Mongoose model, default export.
- Shared sub-schemas live in `shared/` and are imported where needed.
- Sequential display IDs (e.g. `UNI-000001`) are generated atomically via the `Counter` model (`core/Counter.js`) in `backend/utils/`, not in the models themselves.