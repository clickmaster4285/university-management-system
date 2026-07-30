import { Router } from "express";
import studentRoutes from "./student.routes.js";
import teacherRoutes from "./teacher.routes.js";

const router = Router();

router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);

// Welcome route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ScholarOS API",
    version: "1.0.0",
    endpoints: {
      students: {
        base: "/api/students",
        endpoints: [
          "GET / - Get all students",
          "GET /:id - Get student by ID",
          "POST / - Create student",
          "POST /bulk - Bulk create students",
          "GET /stats - Get student statistics",
          "PUT /:id - Update student",
          "DELETE /:id - Delete student"
        ]
      },
      teachers: {
        base: "/api/teachers",
        endpoints: [
          "GET / - Get all teachers",
          "GET /:id - Get teacher by ID",
          "POST / - Create teacher",
          "POST /bulk - Bulk create teachers",
          "GET /stats - Get teacher statistics",
          "PUT /:id - Update teacher",
          "DELETE /:id - Delete teacher"
        ]
      }
    }
  });
});

export default router;