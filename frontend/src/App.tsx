import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/appRoutes";

// Public & Layout Imports
const PublicSiteLayout = lazy(() => import("./layouts/PublicSiteLayout"));
const HomePage = lazy(() => import("./pages/public/HomePage"));
const AboutPage = lazy(() => import("./pages/public/AboutPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const ProgramsCatalogPage = lazy(() => import("./pages/public/ProgramsCatalogPage"));
const ProgramsDirectoryPage = lazy(() => import("./pages/public/ProgramsDirectoryPage"));
const ApplyPage = lazy(() => import("./pages/public/ApplyPage"));
const ApplicationTrackPage = lazy(() => import("./pages/public/ApplicationTrackPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const OtpPage = lazy(() => import("./pages/auth/OtpPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AppLayout = lazy(() => import("./layouts/AppLayout"));
const StudentPortalLayout = lazy(() => import("./layouts/StudentPortalLayout"));
const StudentPortalHomePage = lazy(() => import("./pages/student-portal/StudentPortalHomePage"));
const StudentPortalRegistrationsPage = lazy(() => import("./pages/student-portal/StudentPortalRegistrationsPage"));
const StudentPortalFeesPage = lazy(() => import("./pages/student-portal/StudentPortalFeesPage"));
const StudentPortalProfilePage = lazy(() => import("./pages/student-portal/StudentPortalProfilePage"));

// Dashboard & Overview
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const AiAssistantPage = lazy(() => import("./pages/ai/AiAssistantPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));

// University Governance
const UniversityViewPage = lazy(() => import("./pages/university/UniversityViewPage"));
const UniversityCreatePage = lazy(() => import("./pages/university/UniversityCreatePage"));
const UniversityEditPage = lazy(() => import("./pages/university/UniversityEditPage"));
const CampusesPage = lazy(() => import("./pages/university/campuses/CampusesPage"));
const CampusCreatePage = lazy(() => import("./pages/university/campuses/CampusCreatePage"));
const CampusEditPage = lazy(() => import("./pages/university/campuses/CampusEditPage"));
const CampusDetailPage = lazy(() => import("./pages/university/campuses/CampusDetailPage"));

// Academics Modular Pages
const AdmissionsPage = lazy(() => import("./pages/admissions/OfflineApplicantsPage"));
const OnlineApplicantsPage = lazy(() => import("./pages/admissions/OnlineApplicantsPage"));
const AdmissionDossiersPage = lazy(() => import("./pages/admissions/AdmissionDossiersPage"));
const CampusVisitsPage = lazy(() => import("./pages/admissions/CampusVisitsPage"));
const ApplicationReviewPage = lazy(() => import("./pages/admissions/ApplicationReviewPage"));
const AdmissionDossierPage = lazy(() => import("./pages/admissions/AdmissionDossierPage"));
const InternalApplicationCreatePage = lazy(() => import("./pages/admissions/InternalApplicationCreatePage"));
const DepartmentsPage = lazy(() => import("./pages/academics/departments/DepartmentsPage"));
const DepartmentCreatePage = lazy(() => import("./pages/academics/departments/DepartmentCreatePage"));
const DepartmentEditPage = lazy(() => import("./pages/academics/departments/DepartmentEditPage"));
const DepartmentDetailPage = lazy(() => import("./pages/academics/departments/DepartmentDetailPage"));
const ProgramsPage = lazy(() => import("./pages/academics/programs/ProgramsPage"));
const ProgramCreatePage = lazy(() => import("./pages/academics/programs/ProgramCreatePage"));
const ProgramEditPage = lazy(() => import("./pages/academics/programs/ProgramEditPage"));
const ProgramCurriculumPage = lazy(() => import("./pages/academics/programs/ProgramCurriculumPage"));
const ProgramSemesterFeesPage = lazy(() => import("./pages/academics/programs/ProgramSemesterFeesPage"));
const SubjectsPage = lazy(() => import("./pages/academics/subjects/SubjectsPage"));
const SubjectCreatePage = lazy(() => import("./pages/academics/subjects/SubjectCreatePage"));
const SubjectEditPage = lazy(() => import("./pages/academics/subjects/SubjectEditPage"));
const FacultiesPage = lazy(() => import("./pages/academics/faculties/FacultiesPage"));
const FacultyCreatePage = lazy(() => import("./pages/academics/faculties/FacultyCreatePage"));
const FacultyEditPage = lazy(() => import("./pages/academics/faculties/FacultyEditPage"));
const FacultyDetailPage = lazy(() => import("./pages/academics/faculties/FacultyDetailPage"));
const OfferingsPage = lazy(() => import("./pages/academics/offerings/OfferingsPage"));
const AcademicSessionsPage = lazy(() => import("./pages/academics/sessions/AcademicSessionsPage"));
const SessionCreatePage = lazy(() => import("./pages/academics/sessions/SessionCreatePage"));
const SessionEditPage = lazy(() => import("./pages/academics/sessions/SessionEditPage"));
const SessionDetailPage = lazy(() => import("./pages/academics/sessions/SessionDetailPage"));
const BatchesPage = lazy(() => import("./pages/academics/batches/BatchesPage"));
const BatchCreatePage = lazy(() => import("./pages/academics/batches/BatchCreatePage"));
const BatchEditPage = lazy(() => import("./pages/academics/batches/BatchEditPage"));
const SemesterRegistrationsPage = lazy(() => import("./pages/academics/registrations/SemesterRegistrationsPage"));
const StudentsPage = lazy(() => import("./pages/academics/students/StudentsPage"));
const StudentCreatePage = lazy(() => import("./pages/academics/students/StudentCreatePage"));
const StudentProfilePage = lazy(() => import("./pages/students/StudentProfilePage"));
const StudentDocumentsPage = lazy(() => import("./pages/students/StudentDocumentsPage"));
const StaffPage = lazy(() => import("./pages/people/staff/StaffPage"));
const StaffCreatePage = lazy(() => import("./pages/people/staff/StaffCreatePage"));
const StaffEditPage = lazy(() => import("./pages/people/staff/StaffEditPage"));
const WorkforcePage = lazy(() => import("./pages/workforce/WorkforcePage"));
const WorkforceSchedulePage = lazy(() => import("./pages/workforce/WorkforceSchedulePage"));
const WorkforceLeavePage = lazy(() => import("./pages/workforce/WorkforceLeavePage"));
const WorkforceAttendancePage = lazy(() => import("./pages/workforce/WorkforceAttendancePage"));
const WorkforceRecruitmentPage = lazy(() => import("./pages/workforce/WorkforceRecruitmentPage"));
const StaffDocumentsPage = lazy(() => import("./pages/people/staff/StaffDocumentsPage"));
const PayrollPage = lazy(() => import("./pages/payroll/PayrollPage"));
const StaffPayrollPage = lazy(() => import("./pages/payroll/StaffPayrollPage"));
const AccessPage = lazy(() => import("./pages/access/AccessPage"));
const StaffAccessPage = lazy(() => import("./pages/access/StaffAccessPage"));
const RoleAssignmentsPage = lazy(() => import("./pages/people/role-assignments/RoleAssignmentsPage"));
const AttendancePage = lazy(() => import("./pages/academics/attendance/AttendancePage"));
const AssignmentsPage = lazy(() => import("./pages/academics/assignments/AssignmentsPage"));
const AssignmentCreatePage = lazy(() => import("./pages/academics/assignments/AssignmentCreatePage"));
const AssignmentEditPage = lazy(() => import("./pages/academics/assignments/AssignmentEditPage"));
const ExamsPage = lazy(() => import("./pages/academics/exams/ExamsPage"));
const ExamCreatePage = lazy(() => import("./pages/academics/exams/ExamCreatePage"));
const ExamEditPage = lazy(() => import("./pages/academics/exams/ExamEditPage"));
const OnlineClassesPage = lazy(() => import("./pages/academics/online-classes/OnlineClassesPage"));

// Campus Services Modular Pages
const LibraryPage = lazy(() => import("./pages/campus/library/LibraryPage"));
const BookCreatePage = lazy(() => import("./pages/campus/library/BookCreatePage"));
const BookEditPage = lazy(() => import("./pages/campus/library/BookEditPage"));
const HostelPage = lazy(() => import("./pages/campus/hostel/HostelPage"));
const TransportPage = lazy(() => import("./pages/campus/transport/TransportPage"));
const BusCreatePage = lazy(() => import("./pages/campus/transport/BusCreatePage"));
const BusEditPage = lazy(() => import("./pages/campus/transport/BusEditPage"));
const DriverCreatePage = lazy(() => import("./pages/campus/transport/DriverCreatePage"));
const DriverEditPage = lazy(() => import("./pages/campus/transport/DriverEditPage"));
const RouteCreatePage = lazy(() => import("./pages/campus/transport/RouteCreatePage"));
const RouteEditPage = lazy(() => import("./pages/campus/transport/RouteEditPage"));
const EventsPage = lazy(() => import("./pages/campus/events/EventsPage"));
const EventCreatePage = lazy(() => import("./pages/campus/events/EventCreatePage"));
const EventEditPage = lazy(() => import("./pages/campus/events/EventEditPage"));
const SmartQrPage = lazy(() => import("./pages/campus/qr/SmartQrPage"));

// Operations & Administration
const FinancePage = lazy(() => import("./pages/operations/finance/FinancePage"));
const ChallansPage = lazy(() => import("./pages/operations/challans/ChallansPage"));
const ReportsPage = lazy(() => import("./pages/operations/reports/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/operations/settings/SettingsPage"));
const SettingsProfilePage = lazy(() => import("./pages/operations/settings/SettingsProfilePage"));
const RolesPermissionsPage = lazy(() => import("./pages/operations/settings/RolesPermissionsPage"));
const PermissionAuditPage = lazy(() => import("./pages/operations/settings/PermissionAuditPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center gradient-mesh">
    <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  </div>
);

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public website */}
              <Route path="/" element={<PublicSiteLayout />}>
                <Route index element={<HomePage />} />
                <Route path="catalog" element={<ProgramsCatalogPage />} />
                <Route path="catalog/directory" element={<ProgramsDirectoryPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="apply" element={<ApplyPage />} />
                <Route path="apply/status" element={<ApplicationTrackPage />} />
              </Route>
              <Route path="/landing" element={<Navigate to="/" replace />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/otp" element={<OtpPage />} />

              {/* Student portal (authenticated, Student role only) */}
              <Route path="/student" element={<StudentPortalLayout />}>
                <Route index element={<StudentPortalHomePage />} />
                <Route path="registrations" element={<StudentPortalRegistrationsPage />} />
                <Route path="fees" element={<StudentPortalFeesPage />} />
                <Route path="profile" element={<StudentPortalProfilePage />} />
              </Route>

              {/* Staff portal (authenticated) */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/university" element={<UniversityViewPage />} />
                <Route path="/university/create" element={<UniversityCreatePage />} />
                <Route path="/university/edit" element={<UniversityEditPage />} />
                <Route path="/campuses" element={<CampusesPage />} />
                <Route path="/campuses/create" element={<CampusCreatePage />} />
                <Route path="/campuses/edit/:id" element={<CampusEditPage />} />
                <Route path="/campuses/detail/:id" element={<CampusDetailPage />} />
                <Route path="/ai" element={<AiAssistantPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Academics */}
                <Route path="/campus-visits" element={<CampusVisitsPage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/admissions/online" element={<OnlineApplicantsPage />} />
                <Route path="/admissions/dossiers" element={<AdmissionDossiersPage />} />
                <Route path="/admissions/internal/create" element={<InternalApplicationCreatePage />} />
                <Route path="/admissions/dossier/:id" element={<AdmissionDossierPage />} />
                <Route path="/admissions/:id" element={<ApplicationReviewPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/departments/create" element={<DepartmentCreatePage />} />
                <Route path="/departments/edit/:id" element={<DepartmentEditPage />} />
                <Route path="/departments/detail/:id" element={<DepartmentDetailPage />} />
                <Route path="/programs" element={<ProgramsPage />} />
                <Route path="/programs/create" element={<ProgramCreatePage />} />
                <Route path="/programs/edit/:id" element={<ProgramEditPage />} />
                <Route path="/programs/:id/curriculum" element={<ProgramCurriculumPage />} />
                <Route path="/programs/:id/semester-fees" element={<ProgramSemesterFeesPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/subjects/create" element={<SubjectCreatePage />} />
                <Route path="/subjects/edit/:id" element={<SubjectEditPage />} />
                <Route path="/faculties" element={<FacultiesPage />} />
                <Route path="/faculties/create" element={<FacultyCreatePage />} />
                <Route path="/faculties/edit/:id" element={<FacultyEditPage />} />
                <Route path="/faculties/detail/:id" element={<FacultyDetailPage />} />
                <Route path="/offerings" element={<OfferingsPage />} />
                <Route path="/academic-sessions" element={<AcademicSessionsPage />} />
                <Route path="/academic-sessions/create" element={<SessionCreatePage />} />
                <Route path="/academic-sessions/edit/:id" element={<SessionEditPage />} />
                <Route path="/academic-sessions/detail/:id" element={<SessionDetailPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/batches/create" element={<BatchCreatePage />} />
                <Route path="/batches/edit/:id" element={<BatchEditPage />} />
                <Route path="/semester-registrations" element={<SemesterRegistrationsPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/create" element={<StudentCreatePage />} />
                <Route path="/students/:id/documents" element={<StudentDocumentsPage />} />
                <Route path="/students/:id" element={<StudentProfilePage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/staff/create" element={<StaffCreatePage />} />
                <Route path="/staff/:id/documents" element={<StaffDocumentsPage />} />
                <Route path="/staff/:id" element={<StaffEditPage />} />
                <Route path="/workforce" element={<WorkforcePage />} />
                <Route path="/workforce/leaves" element={<WorkforceLeavePage />} />
                <Route path="/workforce/attendance" element={<WorkforceAttendancePage />} />
                <Route path="/workforce/recruitment" element={<WorkforceRecruitmentPage />} />
                <Route path="/workforce/:id" element={<WorkforceSchedulePage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/payroll/:id" element={<StaffPayrollPage />} />
                <Route path="/access" element={<AccessPage />} />
                <Route path={APP_ROUTES.legacy.accessRoles} element={<Navigate to={APP_ROUTES.settings.roles} replace />} />
                <Route path="/access/:id" element={<StaffAccessPage />} />
                <Route path="/role-assignments" element={<RoleAssignmentsPage />} />
                <Route path="/role-assignments/staff/:staffId" element={<RoleAssignmentsPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/assignments/create" element={<AssignmentCreatePage />} />
                <Route path="/assignments/edit/:id" element={<AssignmentEditPage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/exams/create" element={<ExamCreatePage />} />
                <Route path="/exams/edit/:id" element={<ExamEditPage />} />
                <Route path="/online-classes" element={<OnlineClassesPage />} />

                {/* Campus Services */}
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/library/create" element={<BookCreatePage />} />
                <Route path="/library/edit/:id" element={<BookEditPage />} />
                <Route path="/hostel" element={<HostelPage />} />
                <Route path="/transport" element={<TransportPage />} />
                <Route path="/transport/buses/create" element={<BusCreatePage />} />
                <Route path="/transport/buses/edit/:id" element={<BusEditPage />} />
                <Route path="/transport/drivers/create" element={<DriverCreatePage />} />
                <Route path="/transport/drivers/edit/:id" element={<DriverEditPage />} />
                <Route path="/transport/routes/create" element={<RouteCreatePage />} />
                <Route path="/transport/routes/edit/:id" element={<RouteEditPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/create" element={<EventCreatePage />} />
                <Route path="/events/edit/:id" element={<EventEditPage />} />
                <Route path="/qr" element={<SmartQrPage />} />

                {/* Operations */}
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/challans" element={<ChallansPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path={APP_ROUTES.settings.index} element={<SettingsPage />} />
                <Route path={APP_ROUTES.settings.profile} element={<SettingsProfilePage />} />
                <Route path={APP_ROUTES.settings.roles} element={<RolesPermissionsPage />} />
                <Route path={APP_ROUTES.settings.permissionAudit} element={<PermissionAuditPage />} />
              </Route>

              {/* 404 Fallback Route */}
              <Route path="*" element={<NotFoundPage />} />
              
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
