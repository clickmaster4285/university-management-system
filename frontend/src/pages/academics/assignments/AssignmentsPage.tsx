import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { assignmentAPI, Assignment } from "@/lib/api/assignment";
import { courseAPI, Course } from "@/lib/api/courses";
import { useAuth } from "@/lib/auth";
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  FileText,
  User,
  Database,
  X,
  Save,
  Loader2,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Rocket,
  Sparkles,
  BookOpen,
  GraduationCap,
  Smile
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area, RadialBarChart, RadialBar } from "recharts";


// Constants
const assignmentTypes = ['Homework', 'Quiz', 'Project', 'Lab Report', 'Research Paper', 'Presentation', 'Case Study', 'Other'];
const submissionTypes = ['File Upload', 'Text Entry', 'Link', 'Multiple'];
const statusOptions = ['Draft', 'Published', 'Open', 'Closed', 'Grading', 'Graded', 'Archived'];
const fileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'jpg', 'png', 'txt', 'md'];
const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS', 'BS Physics', 'BS Math', 'LLB'];

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
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
    description: '',
    course: '',
    courseCode: '',
    department: '',
    program: '',
    semester: 1,
    academicYear: new Date().getFullYear().toString(),
    instructor: '',
    instructorEmail: '',
    type: 'Homework',
    maxScore: 100,
    passingScore: 60,
    weightage: 10,
    dueDate: '',
    submissionDeadline: '',
    lateSubmissionDeadline: '',
    allowLateSubmissions: false,
    lateSubmissionPenalty: 10,
    maxAttempts: 1,
    submissionType: 'File Upload',
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10485760,
    status: 'Draft',
    instructions: '',
    gradingCriteria: '',
    rubric: [{ criterion: '', description: '', maxPoints: 0 }]
  });

  const isAuthenticated = !!user;

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await courseAPI.getAll({ status: 'Active' });
      if (response && response.success) {
        setCourses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await assignmentAPI.getAll({ limit: 100 });
      
      let data: Assignment[] = [];
      
      if (response?.success !== false) {
        const payload = response?.data ?? response;
        
        if (Array.isArray(payload)) {
          data = payload as Assignment[];
        } else if (payload && typeof payload === 'object') {
          if (Array.isArray((payload as any).data)) {
            data = (payload as any).data as Assignment[];
          } else if (Array.isArray((payload as any).assignments)) {
            data = (payload as any).assignments as Assignment[];
          } else if (payload && typeof (payload as any).data === 'object' && Array.isArray((payload as any).data?.assignments)) {
            data = (payload as any).data.assignments as Assignment[];
          } else {
            const foundArray = Object.values(payload).find((value) => Array.isArray(value));
            if (foundArray) {
              data = foundArray as Assignment[];
            }
          }
        }
      }
      
      if (data.length > 0) {
      }
      
      setAssignments(data);
      setFilteredAssignments(data);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch assignments:', error);
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('Failed to fetch') ||
          error.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Please check if server is running.');
      } else {
        setError(null);
      }
      setAssignments([]);
      setFilteredAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await assignmentAPI.getStats();
      
      let statsData = {
        total: 0,
        open: 0,
        grading: 0,
        graded: 0,
        draft: 0,
        closed: 0
      };
      
      if (response && response.data) {
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          statsData = {
            total: response.data.total || 0,
            open: response.data.open || 0,
            grading: response.data.grading || 0,
            graded: response.data.graded || 0,
            draft: response.data.draft || 0,
            closed: response.data.closed || 0
          };
        } else if (response.data.data) {
          statsData = {
            total: response.data.data.total || 0,
            open: response.data.data.open || 0,
            grading: response.data.data.grading || 0,
            graded: response.data.data.graded || 0,
            draft: response.data.data.draft || 0,
            closed: response.data.data.closed || 0
          };
        }
      }
      
      setStats(statsData);
      
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        open: 0,
        grading: 0,
        graded: 0,
        draft: 0,
        closed: 0
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
      fetchAssignments();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Prepare chart data
  const getStatusChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Open', value: stats.open || 0 },
      { name: 'Grading', value: stats.grading || 0 },
      { name: 'Graded', value: stats.graded || 0 },
      { name: 'Draft', value: stats.draft || 0 },
      { name: 'Closed', value: stats.closed || 0 }
    ];
  };

  const getSubmissionTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      data.push({
        month: months[monthIndex],
        submitted: Math.floor(Math.random() * 80) + 20,
        graded: Math.floor(Math.random() * 60) + 10
      });
    }
    return data;
  };

  // Handle course selection - AUTO-FILL course data
  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCourseId = e.target.value;
    const selectedCourse = courses.find(c => c._id === selectedCourseId);
    
    if (selectedCourse) {
      let semesterNumber = 1;
      if ((selectedCourse.semester as any) === 'Fall' || selectedCourse.semester === 1) semesterNumber = 1;
      else if ((selectedCourse.semester as any) === 'Spring' || selectedCourse.semester === 2) semesterNumber = 2;
      else if ((selectedCourse.semester as any) === 'Summer' || selectedCourse.semester === 3) semesterNumber = 3;
      
      setFormData({
        ...formData,
        course: selectedCourse.name || '',
        courseCode: selectedCourse.code || '',
        department: selectedCourse.department || formData.department,
        program: formData.program,
        semester: semesterNumber,
        instructor: selectedCourse.instructor || formData.instructor,
        instructorEmail: formData.instructorEmail
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
      setFilteredAssignments(assignments);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = assignments.filter(a => {
      const titleMatch = a.title?.toLowerCase().includes(searchLower) || false;
      const courseMatch = a.course?.toLowerCase().includes(searchLower) || false;
      const instructorMatch = a.instructor?.toLowerCase().includes(searchLower) || false;
      const codeMatch = a.courseCode?.toLowerCase().includes(searchLower) || false;
      const idMatch = a.assignmentId?.toLowerCase().includes(searchLower) || false;
      
      return titleMatch || courseMatch || instructorMatch || codeMatch || idMatch;
    });
    
    setFilteredAssignments(filtered);
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
    } else if (name === 'allowedFileTypes') {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selected
      }));
    } else if (name.includes('rubric.')) {
      const index = parseInt(name.split('.')[1]);
      const field = name.split('.')[2];
      setFormData(prev => {
        const newRubric = [...prev.rubric];
        newRubric[index] = {
          ...newRubric[index],
          [field]: field === 'maxPoints' ? parseFloat(value) || 0 : value
        };
        return { ...prev, rubric: newRubric };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'semester' || name === 'maxScore' || name === 'passingScore' || 
                name === 'weightage' || name === 'lateSubmissionPenalty' || 
                name === 'maxAttempts' || name === 'maxFileSize'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  // Add rubric row
  const addRubricRow = () => {
    setFormData(prev => ({
      ...prev,
      rubric: [...prev.rubric, { criterion: '', description: '', maxPoints: 0 }]
    }));
  };

  // Remove rubric row
  const removeRubricRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rubric: prev.rubric.filter((_, i) => i !== index)
    }));
  };

  // Open add modal
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      course: '',
      courseCode: '',
      department: '',
      program: '',
      semester: 1,
      academicYear: new Date().getFullYear().toString(),
      instructor: user?.name || '',
      instructorEmail: user?.email || '',
      type: 'Homework',
      maxScore: 100,
      passingScore: 60,
      weightage: 10,
      dueDate: '',
      submissionDeadline: '',
      lateSubmissionDeadline: '',
      allowLateSubmissions: false,
      lateSubmissionPenalty: 10,
      maxAttempts: 1,
      submissionType: 'File Upload',
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      status: 'Draft',
      instructions: '',
      gradingCriteria: '',
      rubric: [{ criterion: '', description: '', maxPoints: 0 }]
    });
    setIsModalOpen(true);
  };

  // Open edit modal - FIXED date handling
  const openEditModal = (assignment: Assignment) => {
    setIsEditMode(true);
    setEditingId(assignment._id || null);
    setFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      course: assignment.course || '',
      courseCode: assignment.courseCode || '',
      department: assignment.department || '',
      program: assignment.program || '',
      semester: assignment.semester || 1,
      academicYear: assignment.academicYear || new Date().getFullYear().toString(),
      instructor: assignment.instructor || '',
      instructorEmail: assignment.instructorEmail || '',
      type: assignment.type || 'Homework',
      maxScore: assignment.maxScore || 100,
      passingScore: assignment.passingScore || 60,
      weightage: assignment.weightage || 10,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      submissionDeadline: assignment.submissionDeadline ? new Date(assignment.submissionDeadline).toISOString().split('T')[0] : '',
      lateSubmissionDeadline: assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline).toISOString().split('T')[0] : '',
      allowLateSubmissions: assignment.allowLateSubmissions || false,
      lateSubmissionPenalty: assignment.lateSubmissionPenalty || 10,
      maxAttempts: assignment.maxAttempts || 1,
      submissionType: assignment.submissionType || 'File Upload',
      allowedFileTypes: assignment.allowedFileTypes || ['pdf', 'doc', 'docx'],
      maxFileSize: assignment.maxFileSize || 10485760,
      status: assignment.status || 'Draft',
      instructions: assignment.instructions || '',
      gradingCriteria: assignment.gradingCriteria || '',
      rubric: assignment.rubric || [{ criterion: '', description: '', maxPoints: 0 }]
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle submit - FIXED for update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const requiredFields = ['title', 'description', 'course', 'courseCode', 'department', 'program', 'instructor', 'dueDate', 'submissionDeadline'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Prepare data for API - ensure dates are properly formatted
      const sanitizedRubric = formData.rubric
        .filter((r) => (r.criterion?.trim() || r.description?.trim() || Number(r.maxPoints) > 0))
        .map((r) => ({
          criterion: r.criterion?.trim() || '',
          description: r.description?.trim() || '',
          maxPoints: Number(r.maxPoints) || 0
        }));

      const assignmentData = {
        title: formData.title,
        description: formData.description,
        course: formData.course,
        courseCode: formData.courseCode,
        department: formData.department,
        program: formData.program,
        semester: Number(formData.semester),
        academicYear: formData.academicYear,
        instructor: formData.instructor,
        instructorEmail: formData.instructorEmail?.trim() || undefined,
        type: formData.type,
        maxScore: Number(formData.maxScore),
        passingScore: Number(formData.passingScore),
        weightage: Number(formData.weightage),
        dueDate: formData.dueDate || undefined,
        submissionDeadline: formData.submissionDeadline || undefined,
        lateSubmissionDeadline: formData.lateSubmissionDeadline || undefined,
        allowLateSubmissions: formData.allowLateSubmissions,
        lateSubmissionPenalty: Number(formData.lateSubmissionPenalty),
        maxAttempts: Number(formData.maxAttempts),
        submissionType: formData.submissionType,
        allowedFileTypes: formData.allowedFileTypes,
        maxFileSize: Number(formData.maxFileSize),
        status: formData.status,
        instructions: formData.instructions?.trim() || undefined,
        gradingCriteria: formData.gradingCriteria?.trim() || undefined,
        rubric: sanitizedRubric
      };


      let response;
      if (isEditMode && editingId) {
        response = await assignmentAPI.update(editingId, assignmentData);
        if (response && response.success) {
          toast.success(`Assignment updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update assignment');
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await assignmentAPI.create(assignmentData);
        if (response && response.success) {
          toast.success(`Assignment created successfully! ID: ${response.data?.assignmentId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to create assignment');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      // Reset form
      setFormData({
        title: '',
        description: '',
        course: '',
        courseCode: '',
        department: '',
        program: '',
        semester: 1,
        academicYear: new Date().getFullYear().toString(),
        instructor: '',
        instructorEmail: '',
        type: 'Homework',
        maxScore: 100,
        passingScore: 60,
        weightage: 10,
        dueDate: '',
        submissionDeadline: '',
        lateSubmissionDeadline: '',
        allowLateSubmissions: false,
        lateSubmissionPenalty: 10,
        maxAttempts: 1,
        submissionType: 'File Upload',
        allowedFileTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 10485760,
        status: 'Draft',
        instructions: '',
        gradingCriteria: '',
        rubric: [{ criterion: '', description: '', maxPoints: 0 }]
      });
      setSearchQuery('');
      
      // Refresh the list
      await fetchAssignments();
      await fetchStats();
      
    } catch (error: any) {
      console.error('❌ Failed to save assignment:', error);
      
      let errorMsg = isEditMode ? 'Failed to update assignment' : 'Failed to create assignment';
      
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
      const response = await assignmentAPI.delete(id);
      if (response && response.success) {
        toast.success(`Assignment deleted successfully`);
        await fetchAssignments();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Draft': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Draft' },
      'Published': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'Published' },
      'Open': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Open' },
      'Closed': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Closed' },
      'Grading': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'Grading' },
      'Graded': { className: 'bg-purple-500/15 text-purple-600 border-0', label: 'Graded' },
      'Archived': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Archived' }
    };
    
    const info = statusMap[status] || statusMap['Draft'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns
  const cols: Column<Assignment>[] = [
    {
      key: "title",
      header: "Assignment",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.assignmentId || 'N/A'}</span>
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
      key: "dueDate",
      header: "Due Date",
      cell: (r) => {
        const date = r.dueDate ? new Date(r.dueDate) : new Date();
        const now = new Date();
        const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysLeft < 0;
        
        return (
          <div className="flex flex-col">
            <span className="text-sm">{date.toLocaleDateString()}</span>
            <span className={`text-xs ${isOverdue ? 'text-red-500' : daysLeft <= 3 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {isOverdue ? 'Overdue' : `${daysLeft} days left`}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status),
    },
    {
      key: "submissions",
      header: "Submissions",
      cell: (r) => (
        <div className="text-sm">
          {r.totalSubmissions || 0} submitted
          {r.gradedSubmissions !== undefined && (
            <span className="text-xs text-muted-foreground block">
              {r.gradedSubmissions} graded
            </span>
          )}
        </div>
      ),
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
      <AppShell title="Assignments" subtitle="Please login to manage assignments">
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Please login to view and manage assignments.
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
      title="Assignments"
      subtitle={stats ? `${stats.total || 0} total · ${stats.open || 0} open · ${stats.grading || 0} grading` : 'Loading...'}
      actions={
        <>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> New Assignment
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchAssignments();
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
          label="Total Assignments" 
          value={stats?.total || 0} 
          icon={ClipboardList} 
          tone="brand" 
        />
        <KpiCard 
          label="Open" 
          value={stats?.open || 0} 
          icon={CheckCircle2} 
          tone="success" 
        />
        <KpiCard 
          label="Grading" 
          value={stats?.grading || 0} 
          icon={Clock} 
          tone="warning" 
        />
        <KpiCard 
          label="Overdue" 
          value={stats?.closed || 0} 
          icon={AlertCircle} 
          tone="destructive" 
        />
      </div>

      {/* Engaging Graphics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Assignment Status - Pie Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Assignment Status</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </div>
              <Award className="h-4 w-4 text-muted-foreground" />
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
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Open</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] text-muted-foreground">Grading</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-[10px] text-muted-foreground">Graded</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Trends - Area Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Submission Trends</CardTitle>
                <CardDescription>Monthly submissions</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getSubmissionTrendData()}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorGraded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 10
                    }} 
                  />
                  <Area type="monotone" dataKey="submitted" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSubmitted)" />
                  <Area type="monotone" dataKey="graded" stroke="#10b981" fillOpacity={1} fill="url(#colorGraded)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">Submitted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Graded</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Cute Cards */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                <CardDescription>Assignment overview</CardDescription>
              </div>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.open || 0}</div>
                <div className="text-[10px] text-muted-foreground">Open</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats?.grading || 0}</div>
                <div className="text-[10px] text-muted-foreground">Grading</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.graded || 0}</div>
                <div className="text-[10px] text-muted-foreground">Graded</div>
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
            Found {filteredAssignments.length} of {assignments.length} assignments
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
              onClick={fetchAssignments}
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
            <p className="mt-4 text-muted-foreground">Loading assignments...</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      {!loading && !error && assignments.length > 0 && (
        <DataTable
          title="All Assignments"
          description={`${filteredAssignments.length} assignments found${searchQuery ? ` (filtered from ${assignments.length})` : ''}`}
          data={filteredAssignments}
          columns={cols}
          searchKeys={["title", "course", "courseCode", "instructor", "assignmentId"] as (keyof Assignment)[]}
          pageSize={10}
          addLabel="Add Assignment"
          onAdd={openAddModal}
        />
      )}

      {/* Empty State */}
      {!loading && !error && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no assignments in the system yet. Click the "New Assignment" button to create your first assignment.
          </p>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Create First Assignment
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
                    Edit Assignment
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    New Assignment
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    required
                  />
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
                  {!coursesLoading && courses.length === 0 && (
                    <p className="text-xs text-yellow-600">No courses found. Please add courses first.</p>
                  )}
                </div>

                {/* Course Name - AUTO-FILLED */}
                <div className="space-y-2">
                  <Label htmlFor="course">Course Name *</Label>
                  <Input
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly={!!formData.course}
                  />
                </div>

                {/* Course Code - AUTO-FILLED */}
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

                {/* Department - AUTO-FILLED */}
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

                {/* Program */}
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

                {/* Semester - AUTO-FILLED */}
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Input
                    id="semester"
                    name="semester"
                    type="number"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly={!!formData.course}
                  />
                </div>

                {/* Academic Year */}
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

                {/* Instructor - AUTO-FILLED */}
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

                {/* Instructor Email */}
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

                {/* Assignment Details */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Assignment Details</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {assignmentTypes.map(t => (
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
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxScore">Max Score *</Label>
                  <Input
                    id="maxScore"
                    name="maxScore"
                    type="number"
                    min="0"
                    value={formData.maxScore}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min="0"
                    value={formData.passingScore}
                    onChange={handleInputChange}
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

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    name="maxAttempts"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.maxAttempts}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Dates */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Dates</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                  <Input
                    id="submissionDeadline"
                    name="submissionDeadline"
                    type="date"
                    value={formData.submissionDeadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lateSubmissionDeadline">Late Submission Deadline</Label>
                  <Input
                    id="lateSubmissionDeadline"
                    name="lateSubmissionDeadline"
                    type="date"
                    value={formData.lateSubmissionDeadline}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="allowLateSubmissions"
                    name="allowLateSubmissions"
                    type="checkbox"
                    checked={formData.allowLateSubmissions}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="allowLateSubmissions">Allow Late Submissions</Label>
                </div>

                {formData.allowLateSubmissions && (
                  <div className="space-y-2">
                    <Label htmlFor="lateSubmissionPenalty">Late Submission Penalty (%)</Label>
                    <Input
                      id="lateSubmissionPenalty"
                      name="lateSubmissionPenalty"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.lateSubmissionPenalty}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                {/* Submission Settings */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Submission Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submissionType">Submission Type</Label>
                  <select
                    id="submissionType"
                    name="submissionType"
                    value={formData.submissionType}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {submissionTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (bytes)</Label>
                  <Input
                    id="maxFileSize"
                    name="maxFileSize"
                    type="number"
                    value={formData.maxFileSize}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                  <select
                    id="allowedFileTypes"
                    name="allowedFileTypes"
                    multiple
                    value={formData.allowedFileTypes}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary h-24"
                  >
                    {fileTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                </div>

                {/* Rubric */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mt-4 mb-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Rubric</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addRubricRow}>
                      <Plus className="h-3 w-3 mr-1" /> Add Criterion
                    </Button>
                  </div>
                  
                  {formData.rubric.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end border-b pb-2">
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Criterion</Label>
                        <Input
                          name={`rubric.${index}.criterion`}
                          value={item.criterion}
                          onChange={handleInputChange}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          name={`rubric.${index}.description`}
                          value={item.description}
                          onChange={handleInputChange}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">Points</Label>
                        <Input
                          name={`rubric.${index}.maxPoints`}
                          type="number"
                          value={item.maxPoints}
                          onChange={handleInputChange}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRubricRow(index)}
                          className="h-8 w-8 p-0"
                          disabled={formData.rubric.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructions */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Instructions</h3>
                </div>

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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="gradingCriteria">Grading Criteria</Label>
                  <textarea
                    id="gradingCriteria"
                    name="gradingCriteria"
                    value={formData.gradingCriteria}
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
                      {isEditMode ? 'Update Assignment' : 'Create Assignment'}
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

export default AssignmentsPage;
