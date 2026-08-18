import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { examAPI, Exam } from "@/lib/api/exam";
import { courseAPI, Course } from "@/lib/api/courses";
import { useAuth } from "@/lib/auth";
import { 
  ClipboardCheck, 
  Award, 
  TrendingUp, 
  Calendar,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  Clock,
  User,
  Building2,
  Database,
  X,
  Save,
  Loader2,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Smile,
  Star,
  Trophy,
  GraduationCap,
  BookOpen,
  Target,
  Rocket
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar } from "recharts";


// Constants
const examTypes = ['Midterm', 'Final', 'Quiz', 'Lab Assessment', 'Project Defense', 'Case Study', 'Written Exam', 'Practical', 'Viva', 'Other'];
const examStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];
const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'I', 'W'];
const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS', 'BS Physics', 'BS Math', 'LLB'];

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const STATUS_COLORS = {
  'Scheduled': '#3b82f6',
  'In Progress': '#f59e0b',
  'Completed': '#10b981',
  'Cancelled': '#ef4444',
  'Postponed': '#8b5cf6'
};

export function ExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Midterm',
    course: '',
    courseCode: '',
    department: '',
    program: '',
    semester: 1,
    academicYear: new Date().getFullYear().toString(),
    instructor: '',
    instructorEmail: '',
    totalMarks: 100,
    passingMarks: 40,
    weightage: 20,
    examDate: '',
    startTime: '',
    endTime: '',
    duration: 60,
    hall: '',
    building: '',
    invigilators: [{ name: '', email: '' }],
    status: 'Scheduled',
    instructions: ''
  });

  const isAuthenticated = !!user;

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await courseAPI.getAll({ status: 'Active' });
      if (response && response.success) {
        setCourses(response.data || []);
        console.log('✅ Loaded courses:', response.data?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch exams
  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examAPI.getAll({ limit: 100 });
      console.log('📥 Exam Response:', response);
      
      let data: Exam[] = [];
      if (response && response.success) {
        data = response.data || [];
      } else if (response && response.data) {
        data = response.data || [];
      }
      
      console.log('✅ Loaded exams:', data.length);
      setExams(data);
      setFilteredExams(data);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch exams:', error);
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('Failed to fetch') ||
          error.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Please check if server is running.');
      } else {
        setError(null);
      }
      setExams([]);
      setFilteredExams([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await examAPI.getStats();
      console.log('📊 Stats Response:', response);
      
      if (response && response.success) {
        setStats(response.data);
      } else if (response && response.data) {
        setStats(response.data);
      } else {
        setStats({
          total: 0,
          scheduled: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          avgGPA: 0,
          upcomingExams: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        avgGPA: 0,
        upcomingExams: []
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
      fetchExams();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Prepare chart data
  const getStatusChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Scheduled', value: stats.scheduled || 0 },
      { name: 'In Progress', value: stats.inProgress || 0 },
      { name: 'Completed', value: stats.completed || 0 },
      { name: 'Cancelled', value: stats.cancelled || 0 }
    ];
  };

  const getGPAChartData = () => {
    const gpaData = [
      { name: '4.0', value: Math.floor(Math.random() * 30) + 10 },
      { name: '3.5', value: Math.floor(Math.random() * 40) + 20 },
      { name: '3.0', value: Math.floor(Math.random() * 35) + 15 },
      { name: '2.5', value: Math.floor(Math.random() * 25) + 10 },
      { name: '2.0', value: Math.floor(Math.random() * 15) + 5 },
      { name: 'Below 2.0', value: Math.floor(Math.random() * 10) + 2 }
    ];
    return gpaData;
  };

  // Handle course selection
  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCourseId = e.target.value;
    const selectedCourse = courses.find(c => c._id === selectedCourseId);
    
    if (selectedCourse) {
      setFormData({
        ...formData,
        course: selectedCourse.name || '',
        courseCode: selectedCourse.code || '',
        department: selectedCourse.department || formData.department,
        program: formData.program,
        instructor: selectedCourse.instructor || formData.instructor,
      });
      toast.success(`Course selected: ${selectedCourse.code} - ${selectedCourse.name}`);
    } else {
      setFormData({
        ...formData,
        course: '',
        courseCode: ''
      });
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredExams(exams);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = exams.filter(e => {
      const titleMatch = e.title?.toLowerCase().includes(searchLower) || false;
      const courseMatch = e.course?.toLowerCase().includes(searchLower) || false;
      const instructorMatch = e.instructor?.toLowerCase().includes(searchLower) || false;
      const codeMatch = e.courseCode?.toLowerCase().includes(searchLower) || false;
      const idMatch = e.examId?.toLowerCase().includes(searchLower) || false;
      
      return titleMatch || courseMatch || instructorMatch || codeMatch || idMatch;
    });
    
    setFilteredExams(filtered);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'invigilators') {
      const invigilators = value.split(',').map(v => ({ name: v.trim(), email: '' }));
      setFormData(prev => ({
        ...prev,
        invigilators: invigilators.length > 0 ? invigilators : [{ name: '', email: '' }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'semester' || name === 'totalMarks' || name === 'passingMarks' || 
                name === 'weightage' || name === 'duration'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  // Open add modal
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: '',
      type: 'Midterm',
      course: '',
      courseCode: '',
      department: '',
      program: '',
      semester: 1,
      academicYear: new Date().getFullYear().toString(),
      instructor: user?.name || '',
      instructorEmail: user?.email || '',
      totalMarks: 100,
      passingMarks: 40,
      weightage: 20,
      examDate: '',
      startTime: '',
      endTime: '',
      duration: 60,
      hall: '',
      building: '',
      invigilators: [{ name: '', email: '' }],
      status: 'Scheduled',
      instructions: ''
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (exam: Exam) => {
    setIsEditMode(true);
    setEditingId(exam._id || null);
    setFormData({
      title: exam.title || '',
      type: exam.type || 'Midterm',
      course: exam.course || '',
      courseCode: exam.courseCode || '',
      department: exam.department || '',
      program: exam.program || '',
      semester: exam.semester || 1,
      academicYear: exam.academicYear || new Date().getFullYear().toString(),
      instructor: exam.instructor || '',
      instructorEmail: exam.instructorEmail || '',
      totalMarks: exam.totalMarks || 100,
      passingMarks: exam.passingMarks || 40,
      weightage: exam.weightage || 20,
      examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      duration: exam.duration || 60,
      hall: exam.hall || '',
      building: exam.building || '',
      invigilators: exam.invigilators || [{ name: '', email: '' }],
      status: exam.status || 'Scheduled',
      instructions: exam.instructions || ''
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const requiredFields = ['title', 'type', 'course', 'courseCode', 'department', 'program', 'semester', 'instructor', 'examDate', 'startTime', 'endTime', 'duration', 'hall', 'totalMarks', 'passingMarks'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      const examData = {
        title: formData.title.trim(),
        type: formData.type,
        course: formData.course.trim(),
        courseCode: formData.courseCode.trim(),
        department: formData.department.trim(),
        program: formData.program.trim(),
        semester: Number(formData.semester),
        academicYear: formData.academicYear || new Date().getFullYear().toString(),
        instructor: formData.instructor.trim(),
        instructorEmail: formData.instructorEmail || '',
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        weightage: Number(formData.weightage) || 0,
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: Number(formData.duration),
        hall: formData.hall.trim(),
        building: formData.building || '',
        invigilators: formData.invigilators.filter(i => i.name.trim() !== ''),
        status: formData.status || 'Scheduled',
        instructions: formData.instructions || ''
      };

      console.log('📤 Sending exam data:', examData);

      let response;
      if (isEditMode && editingId) {
        response = await examAPI.update(editingId, examData);
        if (response && response.success) {
          toast.success(`Exam updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update exam');
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await examAPI.create(examData);
        if (response && response.success) {
          toast.success(`Exam created successfully! ID: ${response.data?.examId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to create exam');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      setFormData({
        title: '',
        type: 'Midterm',
        course: '',
        courseCode: '',
        department: '',
        program: '',
        semester: 1,
        academicYear: new Date().getFullYear().toString(),
        instructor: '',
        instructorEmail: '',
        totalMarks: 100,
        passingMarks: 40,
        weightage: 20,
        examDate: '',
        startTime: '',
        endTime: '',
        duration: 60,
        hall: '',
        building: '',
        invigilators: [{ name: '', email: '' }],
        status: 'Scheduled',
        instructions: ''
      });
      setSearchQuery('');
      
      await fetchExams();
      await fetchStats();
      
    } catch (error: any) {
      console.error('❌ Failed to save exam:', error);
      
      let errorMsg = isEditMode ? 'Failed to update exam' : 'Failed to create exam';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        errorMsg = 'Network error. Please check if backend server is running.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      const response = await examAPI.delete(id);
      if (response && response.success) {
        toast.success(`Exam deleted successfully`);
        await fetchExams();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to delete exam');
      }
    } catch (error) {
      console.error('Failed to delete exam:', error);
      toast.error('Failed to delete exam');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Scheduled': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'Scheduled' },
      'In Progress': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'In Progress' },
      'Completed': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Completed' },
      'Cancelled': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Cancelled' },
      'Postponed': { className: 'bg-orange-500/15 text-orange-600 border-0', label: 'Postponed' }
    };
    
    const info = statusMap[status] || statusMap['Scheduled'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns
  const cols: Column<Exam>[] = [
    {
      key: "title",
      header: "Exam",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.examId || 'N/A'}</span>
              <span className="ml-2">{r.type}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.course}</div>
          <div className="text-xs text-muted-foreground">{r.courseCode}</div>
        </div>
      ),
    },
    {
      key: "instructor",
      header: "Instructor",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.instructor}</span>
        </div>
      ),
    },
    {
      key: "examDate",
      header: "Date & Time",
      cell: (r) => {
        const date = r.examDate ? new Date(r.examDate) : new Date();
        return (
          <div className="flex flex-col">
            <span className="text-sm">{date.toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">{r.startTime} - {r.endTime}</span>
          </div>
        );
      },
    },
    {
      key: "hall",
      header: "Hall",
      cell: (r) => (
        <div>
          <div className="text-sm">{r.hall}</div>
          <div className="text-xs text-muted-foreground">{r.building || ''}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openEditModal(r)}
            className="hover:bg-blue-50"
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r._id && handleDelete(r._id, r.title)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <AppShell title="Exams & Grades" subtitle="Please login to manage exams">
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Please login to view and manage exams.
          </p>
          <Button onClick={() => window.location.href = '/login'} className="gradient-brand text-white border-0">
            Go to Login
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Exams & Grades"
      subtitle={stats ? `${stats.total || 0} total · ${stats.scheduled || 0} scheduled · Avg GPA: ${stats.avgGPA || 0}` : 'Loading...'}
      actions={
        <>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> New Exam
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchExams();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Exams" 
          value={stats?.total || 0} 
          icon={Calendar} 
          tone="brand" 
        />
        <KpiCard 
          label="Scheduled" 
          value={stats?.scheduled || 0} 
          icon={Clock} 
          tone="info" 
        />
        <KpiCard 
          label="In Progress" 
          value={stats?.inProgress || 0} 
          icon={ClipboardCheck} 
          tone="warning" 
        />
        <KpiCard 
          label="Avg GPA" 
          value={stats?.avgGPA || 0} 
          icon={TrendingUp} 
          tone="success" 
        />
      </div>

      {/* Cute Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Exam Status - Donut Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Exam Status</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </div>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getStatusChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getStatusChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 10
                    }} 
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPA Distribution - Bar Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">GPA Distribution</CardTitle>
                <CardDescription>Student performance</CardDescription>
              </div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getGPAChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 10
                    }} 
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {getGPAChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary - Cute Stats */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
                <CardDescription>Quick exam stats</CardDescription>
              </div>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                <div className="text-[10px] text-muted-foreground">Total Exams</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
                <div className="text-[10px] text-muted-foreground">Completed</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</div>
                <div className="text-[10px] text-muted-foreground">In Progress</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.avgGPA || 0}</div>
                <div className="text-[10px] text-muted-foreground">Avg GPA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, course, instructor..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredExams.length} of {exams.length} exams
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={fetchExams}
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading exams...</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      {!loading && !error && exams.length > 0 && (
        <DataTable
          title="All Exams"
          description={`${filteredExams.length} exams found${searchQuery ? ` (filtered from ${exams.length})` : ''}`}
          data={filteredExams}
          columns={cols}
          searchKeys={["title", "course", "courseCode", "instructor", "examId"] as (keyof Exam)[]}
          pageSize={10}
          addLabel="Add Exam"
          onAdd={openAddModal}
        />
      )}

      {/* Empty State */}
      {!loading && !error && exams.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Exams Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no exams in the system yet. Click the "New Exam" button to create your first exam.
          </p>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Create First Exam
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Exam
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    New Exam
                  </>
                )}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Basic Information</h3>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Exam Type *</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {examTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {examStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Course Selection */}
                <div className="space-y-2">
                  <Label htmlFor="courseSelect">Select Course *</Label>
                  <select
                    id="courseSelect"
                    name="courseSelect"
                    onChange={handleCourseSelect}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.course ? courses.find(c => c.name === formData.course)?._id || '' : ''}
                    required
                  >
                    <option value="">Select a course</option>
                    {coursesLoading ? (
                      <option value="" disabled>Loading courses...</option>
                    ) : courses.length === 0 ? (
                      <option value="" disabled>No courses available</option>
                    ) : (
                      courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Input
                    id="courseCode"
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly={!!formData.course}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly={!!formData.course}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <select
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Input
                    id="semester"
                    name="semester"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Instructor Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Instructor Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor Name *</Label>
                  <Input
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly={!!formData.course}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorEmail">Instructor Email</Label>
                  <Input
                    id="instructorEmail"
                    name="instructorEmail"
                    type="email"
                    value={formData.instructorEmail}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Exam Details */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Exam Details</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks *</Label>
                  <Input
                    id="totalMarks"
                    name="totalMarks"
                    type="number"
                    min="0"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingMarks">Passing Marks *</Label>
                  <Input
                    id="passingMarks"
                    name="passingMarks"
                    type="number"
                    min="0"
                    value={formData.passingMarks}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightage">Weightage (%)</Label>
                  <Input
                    id="weightage"
                    name="weightage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weightage}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Schedule */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Schedule & Location</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examDate">Exam Date *</Label>
                  <Input
                    id="examDate"
                    name="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="15"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hall">Hall *</Label>
                  <Input
                    id="hall"
                    name="hall"
                    value={formData.hall}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Input
                    id="building"
                    name="building"
                    value={formData.building}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="invigilators">Invigilators (comma separated)</Label>
                  <Input
                    id="invigilators"
                    name="invigilators"
                    value={formData.invigilators.map(i => i.name).join(', ')}
                    onChange={handleInputChange}
                    placeholder="Dr. Ali, Dr. Sara, Dr. Bilal"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="gradient-brand text-white border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Exam' : 'Create Exam'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default ExamsPage;
