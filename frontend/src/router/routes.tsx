import { createRootRouteWithContext, createRoute } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { RootLayout, NotFoundComponent, ErrorComponent } from "@/layouts/RootLayout";
import { AppLayout } from "@/layouts/AppLayout";

// Landing & Auth Pages
import { LandingPage } from "@/pages/landing/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { OtpPage } from "@/pages/auth/OtpPage";

// Dashboard Page
import { DashboardPage } from "@/pages/dashboard/DashboardPage";

// University Governance Pages
import { UniversityProfilePage } from "@/pages/university/UniversityProfilePage";
import { CampusesPage } from "@/pages/university/CampusesPage";

// Academics Pages
import { AdmissionsPage } from "@/pages/academics/admissions/AdmissionsPage";
import { DepartmentsPage } from "@/pages/academics/departments/DepartmentsPage";
import { CoursesPage } from "@/pages/academics/courses/CoursesPage";
import { AcademicSessionsPage } from "@/pages/academics/sessions/AcademicSessionsPage";
import { SemestersPage } from "@/pages/academics/semesters/SemestersPage";
import { BatchesPage } from "@/pages/academics/batches/BatchesPage";
import { StudentsPage } from "@/pages/academics/students/StudentsPage";
import { TeachersPage } from "@/pages/academics/teachers/TeachersPage";
import { AttendancePage } from "@/pages/academics/attendance/AttendancePage";
import { AssignmentsPage } from "@/pages/academics/assignments/AssignmentsPage";
import { ExamsPage } from "@/pages/academics/exams/ExamsPage";
import { OnlineClassesPage } from "@/pages/academics/online-classes/OnlineClassesPage";

// Campus Services Pages
import { LibraryPage } from "@/pages/campus/library/LibraryPage";
import { HostelPage } from "@/pages/campus/hostel/HostelPage";
import { TransportPage } from "@/pages/campus/transport/TransportPage";
import { EventsPage } from "@/pages/campus/events/EventsPage";
import { SmartQrPage } from "@/pages/campus/qr/SmartQrPage";

// Operations Pages
import { FeesPage } from "@/pages/operations/fees/FeesPage";
import { FinancePage } from "@/pages/operations/finance/FinancePage";
import { HrPage } from "@/pages/operations/hr/HrPage";
import { ReportsPage } from "@/pages/operations/reports/ReportsPage";
import { SettingsPage } from "@/pages/operations/settings/SettingsPage";

// AI & Notifications Pages
import { AiAssistantPage } from "@/pages/ai/AiAssistantPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";

// 1. Root Route
export const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// 2. Public / Auth Routes
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

export const otpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/otp",
  component: OtpPage,
});

// 3. Authenticated App Layout Route (/app)
export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppLayout,
});

// 4. Authenticated Child Routes
export const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: DashboardPage,
});

export const universityRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/university",
  component: UniversityProfilePage,
});

export const campusesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/campuses",
  component: CampusesPage,
});

export const admissionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admissions",
  component: AdmissionsPage,
});

export const departmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/departments",
  component: DepartmentsPage,
});

export const coursesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/courses",
  component: CoursesPage,
});

export const academicSessionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/academic-sessions",
  component: AcademicSessionsPage,
});

export const semestersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/semesters",
  component: SemestersPage,
});

export const batchesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/batches",
  component: BatchesPage,
});

export const studentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/students",
  component: StudentsPage,
});

export const teachersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/teachers",
  component: TeachersPage,
});

export const attendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/attendance",
  component: AttendancePage,
});

export const assignmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/assignments",
  component: AssignmentsPage,
});

export const examsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/exams",
  component: ExamsPage,
});

export const onlineClassesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/online-classes",
  component: OnlineClassesPage,
});

export const libraryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/library",
  component: LibraryPage,
});

export const hostelRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/hostel",
  component: HostelPage,
});

export const transportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/transport",
  component: TransportPage,
});

export const eventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/events",
  component: EventsPage,
});

export const qrRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/qr",
  component: SmartQrPage,
});

export const feesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/fees",
  component: FeesPage,
});

export const financeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/finance",
  component: FinancePage,
});

export const hrRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/hr",
  component: HrPage,
});

export const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reports",
  component: ReportsPage,
});

export const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
});

export const aiRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/ai",
  component: AiAssistantPage,
});

export const notificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/notifications",
  component: NotificationsPage,
});

// Construct the complete manual route tree
export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  forgotPasswordRoute,
  otpRoute,
  appRoute.addChildren([
    dashboardRoute,
    universityRoute,
    campusesRoute,
    admissionsRoute,
    departmentsRoute,
    coursesRoute,
    academicSessionsRoute,
    semestersRoute,
    batchesRoute,
    studentsRoute,
    teachersRoute,
    attendanceRoute,
    assignmentsRoute,
    examsRoute,
    onlineClassesRoute,
    libraryRoute,
    hostelRoute,
    transportRoute,
    eventsRoute,
    qrRoute,
    feesRoute,
    financeRoute,
    hrRoute,
    reportsRoute,
    settingsRoute,
    aiRoute,
    notificationsRoute,
  ]),
]);
