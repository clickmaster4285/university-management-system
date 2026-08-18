import { Router } from "express";
import academicSessionRoutes from "./academicSession.routes.js";
import admissionRoutes from "./admission.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import authRoutes from "./auth.routes.js";
import batchRoutes from "./batch.routes.js";
import bookRoutes from "./book.routes.js";
import campusRoutes from "./campus.routes.js";
import courseRoutes from "./course.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import departmentRoutes from "./department.routes.js";
import eventRoutes from "./event.routes.js";
import examRoutes from "./exam.routes.js";
import feeRoutes from "./fee.routes.js";
import feeStructureRoutes from "./feeStructure.routes.js";
import financeRoutes from "./finance.routes.js";
import hrRoutes from "./hr.routes.js";
import notificationRoutes from "./notification.routes.js";
import reportRoutes from "./report.routes.js";
import semesterRoutes from "./semester.routes.js";
import settingsRoutes from "./settings.routes.js";
import studentRoutes from "./student.routes.js";
import teacherRoutes from "./teacher.routes.js";
import transportRoutes from "./transport.routes.js";
import universityRoutes from "./university.routes.js";

const router = Router();

router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/departments", departmentRoutes);
router.use("/courses", courseRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/admissions", admissionRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/exams", examRoutes);
router.use("/books", bookRoutes);
router.use("/transport", transportRoutes);
router.use("/events", eventRoutes);
router.use("/fees", feeRoutes);
router.use("/fee-structures", feeStructureRoutes);
router.use("/finance", financeRoutes);
router.use("/hr", hrRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingsRoutes);
router.use("/auth", authRoutes);
router.use("/academic-sessions", academicSessionRoutes);
router.use("/semesters", semesterRoutes);
router.use("/batches", batchRoutes);
router.use("/universities", universityRoutes);
router.use("/campuses", campusRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Campus Compass API",
    version: "1.0.0",
    endpoints: {
      universities: "/api/universities",
      students: "/api/students",
      teachers: "/api/teachers",
      departments: "/api/departments",
      courses: "/api/courses",
      attendance: "/api/attendance",
      admissions: "/api/admissions",
      assignments: "/api/assignments",
      exams: "/api/exams",
      books: "/api/books",
      transport: "/api/transport",
      events: "/api/events",
      fees: "/api/fees",
      feeStructures: "/api/fee-structures",
      finance: "/api/finance",
      hr: "/api/hr",
      auth: "/api/auth",
      academicSessions: "/api/academic-sessions",
      semesters: "/api/semesters",
      batches: "/api/batches",
      settings: "/api/settings",
      reports: "/api/reports",
      dashboard: "/api/dashboard",
      notifications: "/api/notifications",
      campuses: "/api/campuses"
    }
  });
});

export default router;