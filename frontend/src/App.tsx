import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

// Public & Layout Imports
const LandingPage = lazy(() => import("./pages/landing/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const OtpPage = lazy(() => import("./pages/auth/OtpPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AppLayout = lazy(() => import("./layouts/AppLayout"));

// Dashboard & Overview
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const AiAssistantPage = lazy(() => import("./pages/ai/AiAssistantPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));

// University Governance
const UniversityProfilePage = lazy(() => import("./pages/university/UniversityProfilePage"));
const CampusesPage = lazy(() => import("./pages/university/campuses/CampusesPage"));
const CampusCreatePage = lazy(() => import("./pages/university/campuses/CampusCreatePage"));
const CampusEditPage = lazy(() => import("./pages/university/campuses/CampusEditPage"));

// Academics Modular Pages
const AdmissionsPage = lazy(() => import("./pages/academics/admissions/AdmissionsPage"));
const DepartmentsPage = lazy(() => import("./pages/academics/departments/DepartmentsPage"));
const DepartmentCreatePage = lazy(() => import("./pages/academics/departments/DepartmentCreatePage"));
const DepartmentEditPage = lazy(() => import("./pages/academics/departments/DepartmentEditPage"));
const ProgramsPage = lazy(() => import("./pages/academics/programs/ProgramsPage"));
const ProgramCreatePage = lazy(() => import("./pages/academics/programs/ProgramCreatePage"));
const ProgramEditPage = lazy(() => import("./pages/academics/programs/ProgramEditPage"));
const ProgramCurriculumPage = lazy(() => import("./pages/academics/programs/ProgramCurriculumPage"));
const SubjectsPage = lazy(() => import("./pages/academics/subjects/SubjectsPage"));
const SubjectCreatePage = lazy(() => import("./pages/academics/subjects/SubjectCreatePage"));
const SubjectEditPage = lazy(() => import("./pages/academics/subjects/SubjectEditPage"));
const FacultiesPage = lazy(() => import("./pages/academics/faculties/FacultiesPage"));
const CoursesPage = lazy(() => import("./pages/academics/courses/CoursesPage"));
const OfferingsPage = lazy(() => import("./pages/academics/offerings/OfferingsPage"));
const AcademicSessionsPage = lazy(() => import("./pages/academics/sessions/AcademicSessionsPage"));
const SemestersPage = lazy(() => import("./pages/academics/semesters/SemestersPage"));
const BatchesPage = lazy(() => import("./pages/academics/batches/BatchesPage"));
const StudentsPage = lazy(() => import("./pages/academics/students/StudentsPage"));
const TeachersPage = lazy(() => import("./pages/academics/teachers/TeachersPage"));
const AttendancePage = lazy(() => import("./pages/academics/attendance/AttendancePage"));
const AssignmentsPage = lazy(() => import("./pages/academics/assignments/AssignmentsPage"));
const ExamsPage = lazy(() => import("./pages/academics/exams/ExamsPage"));
const OnlineClassesPage = lazy(() => import("./pages/academics/online-classes/OnlineClassesPage"));

// Campus Services Modular Pages
const LibraryPage = lazy(() => import("./pages/campus/library/LibraryPage"));
const HostelPage = lazy(() => import("./pages/campus/hostel/HostelPage"));
const TransportPage = lazy(() => import("./pages/campus/transport/TransportPage"));
const EventsPage = lazy(() => import("./pages/campus/events/EventsPage"));
const SmartQrPage = lazy(() => import("./pages/campus/qr/SmartQrPage"));

// Operations & Administration
const FeesPage = lazy(() => import("./pages/operations/fees/FeesPage"));
const FinancePage = lazy(() => import("./pages/operations/finance/FinancePage"));
const HrPage = lazy(() => import("./pages/operations/hr/HrPage"));
const ReportsPage = lazy(() => import("./pages/operations/reports/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/operations/settings/SettingsPage"));

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
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/otp" element={<OtpPage />} />

              {/* Authenticated / Protected App Routes */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="university" element={<UniversityProfilePage />} />
                <Route path="campuses" element={<CampusesPage />} />
                <Route path="campuses/create" element={<CampusCreatePage />} />
                <Route path="campuses/edit/:id" element={<CampusEditPage />} />
                <Route path="ai" element={<AiAssistantPage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Academics */}
                <Route path="admissions" element={<AdmissionsPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="departments/create" element={<DepartmentCreatePage />} />
                <Route path="departments/edit/:id" element={<DepartmentEditPage />} />
                <Route path="programs" element={<ProgramsPage />} />
                <Route path="programs/create" element={<ProgramCreatePage />} />
                <Route path="programs/edit/:id" element={<ProgramEditPage />} />
                <Route path="programs/:id/curriculum" element={<ProgramCurriculumPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="subjects/create" element={<SubjectCreatePage />} />
                <Route path="subjects/edit/:id" element={<SubjectEditPage />} />
                <Route path="faculties" element={<FacultiesPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="offerings" element={<OfferingsPage />} />
                <Route path="academic-sessions" element={<AcademicSessionsPage />} />
                <Route path="semesters" element={<SemestersPage />} />
                <Route path="batches" element={<BatchesPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="exams" element={<ExamsPage />} />
                <Route path="online-classes" element={<OnlineClassesPage />} />

                {/* Campus Services */}
                <Route path="library" element={<LibraryPage />} />
                <Route path="hostel" element={<HostelPage />} />
                <Route path="transport" element={<TransportPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="qr" element={<SmartQrPage />} />

                {/* Operations */}
                <Route path="fees" element={<FeesPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="hr" element={<HrPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
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
