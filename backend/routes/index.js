import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireModule } from "../middleware/requireModule.js";
import { API_ROUTE_MODULES } from "../utils/apiRouteModules.js";
import academicSessionRoutes from "./academicSession.routes.js";
import admissionRoutes from "./admission.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import authRoutes from "./auth.routes.js";
import batchRoutes from "./batch.routes.js";
import bookRoutes from "./book.routes.js";
import campusRoutes from "./campus.routes.js";
import courseOfferingRoutes from "./courseOffering.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import departmentRoutes from "./department.routes.js";
import eventRoutes from "./event.routes.js";
import examRoutes from "./exam.routes.js";
import facultyRoutes from "./faculty.routes.js";
import feeChallanRoutes from "./feeChallan.routes.js";
import financeRoutes from "./finance.routes.js";
import notificationRoutes from "./notification.routes.js";
import programSemesterFeeScheduleRoutes from "./programSemesterFeeSchedule.routes.js";
import semesterRegistrationRoutes from "./semesterRegistration.routes.js";
import programRoutes from "./program.routes.js";
import platformRoleRoutes from "./platformRole.routes.js";
import payrollRoutes from "./payroll.routes.js";
import publicRoutes from "./public.routes.js";
import subjectRoutes from "./subject.routes.js";
import reportRoutes from "./report.routes.js";
import roleAssignmentRoutes from "./roleAssignment.routes.js";
import settingsRoutes from "./settings.routes.js";
import staffMemberRoutes from "./staffMember.routes.js";
import studentRoutes from "./student.routes.js";
import transportRoutes from "./transport.routes.js";
import universityRoutes from "./university.routes.js";
import workforceRoutes from "./workforce.routes.js";

const router = Router();

/** Mount a route with auth + module guard (routes still keep their own auth/authorize for backward compat) */
const mount = (path, routeHandler) => {
  const moduleKey = API_ROUTE_MODULES[path];
  if (moduleKey) {
    router.use(path, auth, requireModule(moduleKey), routeHandler);
  } else {
    router.use(path, routeHandler);
  }
};

router.use("/public", publicRoutes);
mount("/students", studentRoutes);
mount("/departments", departmentRoutes);
mount("/offerings", courseOfferingRoutes);
mount("/program-semester-fees", programSemesterFeeScheduleRoutes);
mount("/semester-registrations", semesterRegistrationRoutes);
mount("/programs", programRoutes);
mount("/platform-roles", platformRoleRoutes);
mount("/subjects", subjectRoutes);
mount("/attendance", attendanceRoutes);
mount("/admissions", admissionRoutes);
mount("/assignments", assignmentRoutes);
mount("/exams", examRoutes);
mount("/faculties", facultyRoutes);
mount("/books", bookRoutes);
mount("/transport", transportRoutes);
mount("/events", eventRoutes);
mount("/challans", feeChallanRoutes);
mount("/finance", financeRoutes);
mount("/payroll", payrollRoutes);
mount("/reports", reportRoutes);
mount("/dashboard", dashboardRoutes);
mount("/notifications", notificationRoutes);
mount("/settings", settingsRoutes);
mount("/staff", staffMemberRoutes);
mount("/workforce", workforceRoutes);
mount("/role-assignments", roleAssignmentRoutes);
router.use("/auth", authRoutes);
mount("/academic-sessions", academicSessionRoutes);
mount("/batches", batchRoutes);
mount("/universities", universityRoutes);
mount("/campuses", campusRoutes);

export default router;
