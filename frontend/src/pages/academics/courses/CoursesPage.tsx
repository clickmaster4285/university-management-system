// src/routes/app.courses.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courseAPI, Course } from "@/lib/api/courses";
import { departmentAPI } from "@/lib/api/departments";
import { 
  BookOpen, 
  Users, 
  Clock, 
  GraduationCap,
  RefreshCw, 
  UserPlus,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  Calendar,
  User,
  Building2,
  Target,
  DollarSign,
  FileText,
  Database,
  ChevronDown,
  ChevronRight,
  Layers,
  School,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";


// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// Constants
const programs = ['BSCS', 'BSSE', 'BSIT', 'BSEE', 'BBA'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const semesterTypes = ['Fall', 'Spring', 'Summer'];
const statusOptions = ['Active', 'Inactive', 'Completed', 'Cancelled', 'Draft'];
const feeTypes = ['Tuition', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Other'];

// Helper function to get default schedule
const getDefaultSchedule = (schedule?: Course['schedule']) => ({
  day: schedule?.day || '',
  startTime: schedule?.startTime || '',
  endTime: schedule?.endTime || '',
  room: schedule?.room || '',
  building: schedule?.building || ''
});

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");
  const [isAutoSeeding, setIsAutoSeeding] = useState(false);
  const [seedAttempted, setSeedAttempted] = useState(false);
  
  // State for program/semester expansion
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({
    'BSCS': true,
    'BSSE': true,
    'BSIT': true,
    'BSEE': true,
    'BBA': true
  });
  
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});
  
  // Advanced filters
  const [filters, setFilters] = useState({
    program: '',
    semester: '',
    semesterType: '',
    status: '',
    isActive: true,
    department: ''
  });

  // Form data with all fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: '',
    departmentName: '',
    program: 'BSCS',
    semester: 1,
    semesterType: 'Fall' as 'Fall' | 'Spring' | 'Summer',
    year: new Date().getFullYear(),
    credits: 3,
    instructor: '',
    capacity: 30,
    enrolledStudents: 0,
    status: 'Active' as 'Active' | 'Inactive' | 'Completed' | 'Cancelled' | 'Draft',
    description: '',
    feePerCredit: 5000,
    feeType: 'Tuition' as 'Tuition' | 'Lab' | 'Library' | 'Sports' | 'Transport' | 'Hostel' | 'Other',
    isFeeApplied: true,
    prerequisites: [] as string[],
    tags: [] as string[],
    learningOutcomes: [] as string[],
    textbooks: [] as { title: string; author: string; isbn: string; edition: string }[],
    schedule: {
      day: '',
      startTime: '',
      endTime: '',
      room: '',
      building: ''
    }
  });

  // Fetch courses and departments with auto-seed
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      // First check if courses are seeded
      const seededCheck = await courseAPI.isSeeded();
      
      if (!seededCheck.seeded && !seedAttempted) {
        setIsAutoSeeding(true);
        setSeedAttempted(true);
        
        try {
          const seedResult = await courseAPI.seedAllCourses(true);
          
          if (seedResult && seedResult.success) {
            toast.success(`✅ Loaded ${seedResult.count || 'all'} courses`);
          } else {
            console.warn('⚠️ Auto-seed failed or returned no data');
            toast.warning('Could not load courses automatically. Please refresh.');
          }
        } catch (seedError) {
          console.error('❌ Seed error:', seedError);
          toast.error('Failed to seed courses. Please try again.');
        }
        setIsAutoSeeding(false);
      }
      
      // Now fetch the courses with a larger limit
      const [coursesRes, deptsRes] = await Promise.all([
        courseAPI.getAll({ limit: 500 }),
        departmentAPI.getAll()
      ]);
      
      
      if (coursesRes && coursesRes.data) {
        const courseData = coursesRes.data;
        setCourses(courseData);
        setFilteredCourses(courseData);
        
        // Log program distribution
        const programCounts = courseData.reduce((acc: any, c: Course) => {
          acc[c.program] = (acc[c.program] || 0) + 1;
          return acc;
        }, {});
      } else {
        setCourses([]);
        setFilteredCourses([]);
      }
      
      if (deptsRes && deptsRes.data) {
        setDepartments(deptsRes.data.map((d: any) => d.name));
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      let errorMsg = 'Failed to load courses';
      if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
      setIsAutoSeeding(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...courses];
    
    if (filters.program) {
      filtered = filtered.filter(c => c.program === filters.program);
    }
    if (filters.semester) {
      filtered = filtered.filter(c => c.semester === parseInt(filters.semester));
    }
    if (filters.semesterType) {
      filtered = filtered.filter(c => c.semesterType === filters.semesterType);
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.department) {
      filtered = filtered.filter(c => c.department === filters.department);
    }
    if (filters.isActive !== undefined && filters.isActive !== null) {
      filtered = filtered.filter(c => c.isActive === filters.isActive);
    }
    
    setFilteredCourses(filtered);
  }, [filters, courses]);

  // Group courses by program and semester
  const getGroupedCourses = () => {
    const grouped: Record<string, Record<number, Course[]>> = {};
    
    // Initialize groups for each program
    programs.forEach(program => {
      grouped[program] = {};
      semesters.forEach(sem => {
        grouped[program][sem] = [];
      });
    });
    
    // Add courses to their groups
    filteredCourses.forEach(course => {
      if (course.program && grouped[course.program]) {
        const sem = course.semester || 1;
        if (grouped[course.program][sem]) {
          grouped[course.program][sem].push(course);
        }
      }
    });
    
    return grouped;
  };

  // Toggle program expansion
  const toggleProgram = (program: string) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [program]: !prev[program]
    }));
  };

  // Toggle semester expansion
  const toggleSemester = (key: string) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Prepare chart data
  const getDepartmentDistribution = () => {
    const deptMap = new Map();
    courses.forEach(course => {
      const dept = course.department || 'Other';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });
    return Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const getCreditDistribution = () => {
    const creditMap = new Map();
    courses.forEach(course => {
      const credits = course.credits || 0;
      creditMap.set(credits, (creditMap.get(credits) || 0) + 1);
    });
    return Array.from(creditMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([name, value]) => ({ name: `${name} CR`, value }));
  };

  const getProgramDistribution = () => {
    const programMap = new Map();
    courses.forEach(course => {
      const program = course.program || 'Other';
      programMap.set(program, (programMap.get(program) || 0) + 1);
    });
    return Array.from(programMap.entries()).map(([name, value]) => ({ name, value }));
  };

  // Calculate statistics
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'Active' && c.isActive).length;
  const totalCapacity = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);
  const avgCredits = totalCourses > 0 
    ? courses.reduce((sum, c) => sum + (c.credits || 0), 0) / totalCourses 
    : 0;
  const uniqueDepartments = new Set(courses.map(c => c.department)).size;
  const uniquePrograms = new Set(courses.map(c => c.program)).size;
  const enrollmentRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const totalFee = courses.reduce((sum, c) => sum + (c.totalFee || 0), 0);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCourses(courses);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    const filtered = courses.filter(course => {
      const idMatch = course.courseId?.toLowerCase().includes(searchLower) || false;
      const codeMatch = course.code?.toLowerCase().includes(searchLower) || false;
      const nameMatch = course.name?.toLowerCase().includes(searchLower) || false;
      const deptMatch = course.department?.toLowerCase().includes(searchLower) || false;
      const instructorMatch = course.instructor?.toLowerCase().includes(searchLower) || false;
      const programMatch = course.program?.toLowerCase().includes(searchLower) || false;
      return idMatch || codeMatch || nameMatch || deptMatch || instructorMatch || programMatch;
    });
    setFilteredCourses(filtered);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              name === 'credits' || name === 'capacity' || name === 'enrolledStudents' || name === 'year' || name === 'semester' || name === 'feePerCredit'
                ? parseFloat(value) || 0
                : value
    }));
  };

  // Open modal for adding new course
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      department: departments.length > 0 ? departments[0] : '',
      departmentName: '',
      program: 'BSCS',
      semester: 1,
      semesterType: 'Fall',
      year: new Date().getFullYear(),
      credits: 3,
      instructor: '',
      capacity: 30,
      enrolledStudents: 0,
      status: 'Active',
      description: '',
      feePerCredit: 5000,
      feeType: 'Tuition',
      isFeeApplied: true,
      prerequisites: [],
      tags: [],
      learningOutcomes: [],
      textbooks: [],
      schedule: {
        day: '',
        startTime: '',
        endTime: '',
        room: '',
        building: ''
      }
    });
    setIsModalOpen(true);
  };

  // Open modal for editing course
  const openEditModal = (course: Course) => {
    setIsEditMode(true);
    setEditingId(course.courseId || course._id || null);
    setFormData({
      code: course.code || '',
      name: course.name || '',
      department: course.department || '',
      departmentName: course.departmentName || '',
      program: course.program || 'BSCS',
      semester: course.semester || 1,
      semesterType: course.semesterType || 'Fall',
      year: course.year || new Date().getFullYear(),
      credits: course.credits || 3,
      instructor: course.instructor || '',
      capacity: course.capacity || 30,
      enrolledStudents: course.enrolledStudents || 0,
      status: course.status || 'Active',
      description: course.description || '',
      feePerCredit: course.feePerCredit || 5000,
      feeType: course.feeType || 'Tuition',
      isFeeApplied: course.isFeeApplied !== undefined ? course.isFeeApplied : true,
      prerequisites: course.prerequisites || [],
      tags: course.tags || [],
      learningOutcomes: course.learningOutcomes || [],
      textbooks: course.textbooks || [],
      schedule: getDefaultSchedule(course.schedule)
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.code || !formData.name || !formData.department || !formData.program) {
        toast.error('Code, Name, Department and Program are required');
        setIsSubmitting(false);
        return;
      }

      // Prepare data with all required fields
      const submitData = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        department: formData.department.trim(),
        departmentName: formData.department.trim(),
        program: formData.program.trim(),
        semester: Number(formData.semester) || 1,
        semesterType: formData.semesterType || 'Fall',
        year: Number(formData.year) || new Date().getFullYear(),
        credits: Number(formData.credits) || 3,
        instructor: formData.instructor || '',
        capacity: Number(formData.capacity) || 30,
        enrolledStudents: Number(formData.enrolledStudents) || 0,
        status: formData.status || 'Active',
        description: formData.description || '',
        feePerCredit: Number(formData.feePerCredit) || 0,
        feeType: formData.feeType || 'Tuition',
        isFeeApplied: formData.isFeeApplied !== undefined ? formData.isFeeApplied : true,
        prerequisites: formData.prerequisites || [],
        tags: formData.tags || [],
        learningOutcomes: formData.learningOutcomes || [],
        textbooks: formData.textbooks || [],
        ...(() => {
          if (!formData.schedule) return {};
          const scheduleKeys = Object.keys(formData.schedule) as Array<keyof typeof formData.schedule>;
          return scheduleKeys.some(key => Boolean(formData.schedule[key])) ? { schedule: formData.schedule } : {};
        })()
      };


      let response;
      if (isEditMode && editingId) {
        response = await courseAPI.update(editingId, submitData);
        toast.success(`Course ${formData.name} updated successfully!`);
      } else {
        response = await courseAPI.create(submitData);
        toast.success(`Course ${formData.name} created successfully!`);
      }
      
      
      closeModal();
      await fetchData();
      setSearchQuery('');
    } catch (error: any) {
      console.error('❌ Failed to save course:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMsg = isEditMode ? 'Failed to update course' : 'Failed to create course';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMsg = `Validation errors: ${error.response.data.errors.join(', ')}`;
      } else if (error.message?.includes('duplicate')) {
        errorMsg = 'Duplicate entry. Course code already exists.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await courseAPI.delete(id);
      toast.success(`Course ${name} deleted successfully`);
      await fetchData();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    }
  };

  // Format course ID
  const getCourseId = (course: Course) => {
    return course.courseId || course._id?.slice(-8).toUpperCase() || 'N/A';
  };

  // Define columns for DataTable
  const cols: Column<Course>[] = [
    {
      key: "code",
      header: "Code",
      cell: (r) => (
        <span className="font-mono font-medium">{r.code}</span>
      )
    },
    {
      key: "name",
      header: "Course Name",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.code}</span>
          </div>
        </div>
      )
    },
    { 
      key: "credits", 
      header: "CH", 
      cell: (r) => <Badge variant="secondary">{r.credits}</Badge> 
    },
    { 
      key: "fee", 
      header: "Fee/Credit", 
      cell: (r) => (
        <div className="text-sm">
          PKR {r.feePerCredit?.toLocaleString() || 0}
        </div>
      ) 
    },
    { 
      key: "totalFee", 
      header: "Total", 
      cell: (r) => (
        <div className="text-sm font-medium text-primary">
          PKR {r.totalFee?.toLocaleString() || 0}
        </div>
      ) 
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const status = r.status || 'Draft';
        const variants: Record<string, string> = {
          'Active': 'bg-green-500/15 text-green-600 border-0',
          'Inactive': 'bg-gray-500/15 text-gray-600 border-0',
          'Completed': 'bg-blue-500/15 text-blue-600 border-0',
          'Cancelled': 'bg-red-500/15 text-red-600 border-0',
          'Draft': 'bg-yellow-500/15 text-yellow-600 border-0'
        };
        return <Badge className={variants[status] || variants['Draft']}>{status}</Badge>;
      }
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
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r.courseId && handleDelete(r.courseId, r.name)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  // Grouped courses
  const groupedCourses = getGroupedCourses();

  // Show loading state while auto-seeding
  if (isAutoSeeding) {
    return (
      <AppShell title="Courses" subtitle="Loading courses...">
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading courses...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        title="Course Catalog"
        subtitle={`${totalCourses} courses · ${activeCourses} active · ${uniquePrograms} programs · ${uniqueDepartments} departments`}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add Course
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label="Total Courses" 
            value={totalCourses} 
            icon={BookOpen} 
            tone="brand" 
          />
          <KpiCard 
            label="Active Courses" 
            value={activeCourses} 
            icon={GraduationCap} 
            tone="success" 
          />
          <KpiCard 
            label="Total Fee" 
            value={`PKR ${(totalFee / 1000000).toFixed(1)}M`} 
            icon={DollarSign} 
            tone="info" 
          />
          <KpiCard 
            label="Programs" 
            value={uniquePrograms} 
            icon={Layers} 
            tone="warning" 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Department Distribution */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Department Distribution</CardTitle>
                  <CardDescription>Courses by department</CardDescription>
                </div>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={getDepartmentDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {getDepartmentDistribution().map((entry, index) => (
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
            </CardContent>
          </Card>

          {/* Program Distribution */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Program Distribution</CardTitle>
                  <CardDescription>Courses by program</CardDescription>
                </div>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getProgramDistribution()}>
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
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Rate */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
                  <CardDescription>Overall capacity utilization</CardDescription>
                </div>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[140px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="40%" 
                    outerRadius="80%" 
                    barSize={10} 
                    data={[{ name: 'Enrollment', value: enrollmentRate }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      fill="#3b82f6"
                      cornerRadius={10}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-2xl font-bold"
                      fill="currentColor"
                    >
                      {enrollmentRate}%
                    </text>
                    <Tooltip 
                      contentStyle={{ 
                        background: "var(--popover)", 
                        border: "1px solid var(--border)", 
                        borderRadius: 8,
                        fontSize: 10
                      }} 
                      formatter={(value) => [`${value}%`, 'Enrollment Rate']}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assign
            </TabsTrigger>
            <TabsTrigger value="fee" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Fee Structure
            </TabsTrigger>
          </TabsList>

          {/* Catalog Tab */}
          <TabsContent value="catalog">
            {/* Filters */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-6 gap-2">
              <div>
                <Label className="text-xs">Program</Label>
                <select
                  value={filters.program}
                  onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
                  className="w-full border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Semester</Label>
                <select
                  value={filters.semester}
                  onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                  className="w-full border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <select
                  value={filters.semesterType}
                  onChange={(e) => setFilters(prev => ({ ...prev, semesterType: e.target.value }))}
                  className="w-full border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  {semesterTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Active</Label>
                <select
                  value={filters.isActive ? 'true' : 'false'}
                  onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="w-full border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, Code, Name, Department, Instructor..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  Found {filteredCourses.length} of {courses.length} courses
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSearch('')}
                    className="h-7 px-2"
                  >
                    ✕ Clear
                  </Button>
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
                    onClick={fetchData}
                  >
                    <RefreshCw className="h-3 w-3 mr-2" /> Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && !isAutoSeeding && (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading courses from database...</p>
                </div>
              </div>
            )}

            {/* Grouped Course Display */}
            {!loading && !error && filteredCourses.length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedCourses).map(([program, semestersData]) => {
                  // Check if program has any courses
                  const hasCourses = Object.values(semestersData).some(courses => courses.length > 0);
                  if (!hasCourses) return null;
                  
                  // Count total courses in this program
                  const totalProgramCourses = Object.values(semestersData).reduce((sum, courses) => sum + courses.length, 0);
                  
                  return (
                    <Card key={program} className="overflow-hidden border shadow-sm">
                      <CardHeader 
                        className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                        onClick={() => toggleProgram(program)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-semibold">{program}</CardTitle>
                            <Badge variant="secondary" className="font-normal">
                              {totalProgramCourses} courses
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {Object.values(semestersData).filter(c => c.length > 0).length} semesters
                            </span>
                            {expandedPrograms[program] ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedPrograms[program] && (
                        <CardContent className="pt-0 space-y-4">
                          {Object.entries(semestersData).map(([semester, courseList]) => {
                            if (courseList.length === 0) return null;
                            
                            const semKey = `${program}-sem${semester}`;
                            const isExpanded = expandedSemesters[semKey] !== false;
                            
                            return (
                              <div key={semKey} className="border rounded-lg overflow-hidden">
                                <div 
                                  className="flex items-center justify-between bg-muted/30 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => toggleSemester(semKey)}
                                >
                                  <div className="flex items-center gap-2">
                                    <School className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Semester {semester}</span>
                                    <Badge variant="outline" className="font-normal">
                                      {courseList.length} courses
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-primary">
                                      Total: PKR {courseList.reduce((sum, c) => sum + (c.totalFee || 0), 0).toLocaleString()}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div className="p-2">
                                    <DataTable
                                      data={courseList}
                                      columns={cols}
                                      pageSize={10}
                                      searchKeys={["code", "name"] as (keyof Course)[]}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No courses found</p>
                <p className="text-sm text-muted-foreground mb-4">Click the button below to create your first course</p>
                <Button onClick={openAddModal}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Course
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Assign Tab */}
          <TabsContent value="assign">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Course Assignment</CardTitle>
                <CardDescription>
                  Assign courses to specific batches and semesters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Course Assignment Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This feature will allow you to assign courses to specific batches and semesters.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Structure Tab */}
          <TabsContent value="fee">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>
                  View and manage fee structures for all courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Fee Structure Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This feature will allow you to manage fee structures per program and semester.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>

      {/* Add/Edit Course Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Edit Course' : 'Add New Course'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <span className="h-2 w-2 bg-red-600 rounded-full"></span>
                    Required Fields
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="CS-101"
                    required
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Programming Fundamentals"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <select
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Credit Hours *</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Fields */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-yellow-600 flex items-center gap-2 mt-2">
                    <span className="h-2 w-2 bg-yellow-600 rounded-full"></span>
                    Optional Fields
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {semesters.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semesterType">Semester Type</Label>
                  <select
                    id="semesterType"
                    name="semesterType"
                    value={formData.semesterType}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {semesterTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrolledStudents">Current Enrolled</Label>
                  <Input
                    id="enrolledStudents"
                    name="enrolledStudents"
                    type="number"
                    min="0"
                    value={formData.enrolledStudents}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feePerCredit">Fee Per Credit (PKR)</Label>
                  <Input
                    id="feePerCredit"
                    name="feePerCredit"
                    type="number"
                    min="0"
                    value={formData.feePerCredit}
                    onChange={handleInputChange}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeType">Fee Type</Label>
                  <select
                    id="feeType"
                    name="feeType"
                    value={formData.feeType}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {feeTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isFeeApplied"
                    name="isFeeApplied"
                    checked={formData.isFeeApplied}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isFeeApplied" className="text-sm">Apply Fee to this Course</Label>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                    placeholder="Course description..."
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Course' : 'Create Course'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CoursesPage;
