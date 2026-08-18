import { Router } from "express";
import studentRoutes from "./student.routes.js";
import teacherRoutes from "./teacher.routes.js";
import universityRoutes from "./university.routes.js";
// Import other route files as needed
// import authRoutes from "./auth.routes.js";
// import courseRoutes from "./course.routes.js";
// import departmentRoutes from "./department.routes.js";
// import attendanceRoutes from "./attendance.routes.js";
// import examRoutes from "./exam.routes.js";
// import feeRoutes from "./fee.routes.js";
// etc...

const router = Router();

// Register all routes
router.use("/universities", universityRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
// router.use("/auth", authRoutes);
// router.use("/courses", courseRoutes);
// router.use("/departments", departmentRoutes);
// router.use("/attendance", attendanceRoutes);
// router.use("/exams", examRoutes);
// router.use("/fees", feeRoutes);
// router.use("/library", libraryRoutes);
// router.use("/transport", transportRoutes);
// router.use("/hr", hrRoutes);
// router.use("/reports", reportRoutes);
// router.use("/settings", settingsRoutes);
// router.use("/batches", batchRoutes);
// router.use("/semesters", semesterRoutes);
// router.use("/admissions", admissionRoutes);
// router.use("/assignments", assignmentRoutes);
// router.use("/events", eventRoutes);

// Welcome route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ScholarOS API",
    version: "1.0.0",
    endpoints: {
      universities: {
        base: "/api/universities",
        endpoints: [
          "POST / - Create university",
          "GET / - Get all universities",
          "GET /:id - Get university by ID",
          "GET /code/:code - Get university by code",
          "GET /:id/stats - Get university statistics",
          "PUT /:id - Update university",
          "DELETE /:id - Delete university",
          "GET /check-code/:code - Check if code exists"
        ]
      },
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
      },
      // Add more endpoint documentation as you add more routes
      // auth: {
      //   base: "/api/auth",
      //   endpoints: [
      //     "POST /login - Login user",
      //     "POST /register - Register user",
      //     "POST /logout - Logout user",
      //     "POST /refresh-token - Refresh token",
      //     "POST /forgot-password - Forgot password",
      //     "POST /reset-password - Reset password",
      //   ]
      // },
    }
  });
});

export default router;