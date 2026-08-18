// src/routes/app.teachers.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/layouts";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teacherAPI, Teacher } from "@/features/teachers";
import { 
  Users, 
  Award, 
  BookOpen, 
  Star, 
  RefreshCw, 
  UserPlus,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
  Zap,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Target,
  Crown,
  Shield,
  Heart,
  Brain,
  Lightbulb,
  Trophy,
  Compass
} from "lucide-react";
import { toast } from "sonner";


export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    designation: 'Professor',
    specialization: '',
    experience: 0,
    rating: 0,
    salary: 0,
    status: 'Active',
    officeHours: ''
  });

  // Options for dropdowns
  const departments = [
    'Computer Science', 
    'Electrical Engineering', 
    'Mechanical Engineering', 
    'Civil Engineering', 
    'Business Administration', 
    'Economics', 
    'Mathematics', 
    'Physics', 
    'Chemistry', 
    'Biology', 
    'English Literature', 
    'Psychology', 
    'Law', 
    'Medicine', 
    'Pharmacy', 
    'Architecture', 
    'Design', 
    'Fine Arts', 
    'Media Studies', 
    'Data Science'
  ];
  
  const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor', 'Visiting Faculty'];
  const statusOptions = ['Active', 'On Leave', 'Retired', 'Resigned', 'On Probation'];

  // Fetch teachers from database
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);

      const teacherList = await teacherAPI.getAll();
      const teachersData = Array.isArray(teacherList) ? teacherList : [];

      if (teachersData.length > 0) {
        setTeachers(teachersData);
        setFilteredTeachers(teachersData);
      } else {
        setTeachers([]);
        setFilteredTeachers([]);
        setError('No data received from server');
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch teachers:', error);

      let errorMsg = 'Failed to load teachers from database';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running on http://localhost:4000';
      } else if (error.message?.includes('404')) {
        errorMsg = 'API endpoint not found. Check if /api/teachers exists.';
      } else if (error.message?.includes('CORS')) {
        errorMsg = 'CORS error. Check backend CORS configuration.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setTeachers([]);
      setFilteredTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredTeachers(teachers);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = teachers.filter(teacher => {
      const mongoId = teacher._id || '';
      const mongoIdMatch = mongoId.toLowerCase().includes(searchLower);
      const teacherId = teacher.teacherId || '';
      const teacherIdMatch = teacherId.toLowerCase().includes(searchLower);
      const shortId = mongoId.slice(-8) || '';
      const shortIdMatch = shortId.toLowerCase().includes(searchLower);
      const nameMatch = teacher.name?.toLowerCase().includes(searchLower) || false;
      const emailMatch = teacher.email?.toLowerCase().includes(searchLower) || false;
      const departmentMatch = teacher.department?.toLowerCase().includes(searchLower) || false;
      const designationMatch = teacher.designation?.toLowerCase().includes(searchLower) || false;
      const specializationMatch = teacher.specialization?.toLowerCase().includes(searchLower) || false;
      const statusMatch = teacher.status?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = teacher.phone?.toLowerCase().includes(searchLower) || false;
      
      return mongoIdMatch || teacherIdMatch || shortIdMatch || nameMatch || emailMatch || 
             departmentMatch || designationMatch || specializationMatch || statusMatch || phoneMatch;
    });
    
    setFilteredTeachers(filtered);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' || name === 'rating' || name === 'salary' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Computer Science',
      designation: 'Professor',
      specialization: '',
      experience: 0,
      rating: 0,
      salary: 0,
      status: 'Active',
      officeHours: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setIsEditMode(true);
    setEditingId(teacher._id || null);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      department: teacher.department || 'Computer Science',
      designation: teacher.designation || 'Professor',
      specialization: teacher.specialization || '',
      experience: teacher.experience || 0,
      rating: teacher.rating || 0,
      salary: teacher.salary || 0,
      status: teacher.status || 'Active',
      officeHours: teacher.officeHours || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.name || !formData.department || !formData.designation) {
        toast.error('Name, Department and Designation are required');
        setIsSubmitting(false);
        return;
      }
      
      const teacherData = {
        ...formData,
        experience: Number(formData.experience),
        rating: Number(formData.rating),
        salary: Number(formData.salary)
      };

      if (isEditMode && editingId) {
        await teacherAPI.update(editingId, teacherData);
        toast.success(`Teacher ${formData.name} updated successfully!`);
      } else {
        await teacherAPI.create(teacherData);
        toast.success(`Teacher ${formData.name} created successfully!`);
      }
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Computer Science',
        designation: 'Professor',
        specialization: '',
        experience: 0,
        rating: 0,
        salary: 0,
        status: 'Active',
        officeHours: ''
      });
      
      closeModal();
      await fetchTeachers();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('Failed to save teacher:', error);
      
      let errorMsg = isEditMode ? 'Failed to update teacher' : 'Failed to create teacher';
      if (error.message?.includes('duplicate')) {
        errorMsg = 'Duplicate entry. Email already exists.';
      } else if (error.message?.includes('validation')) {
        errorMsg = 'Validation error. Please check your inputs.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      await teacherAPI.delete(id);
      toast.success(`Teacher ${name} deleted successfully`);
      await fetchTeachers();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      toast.error('Failed to delete teacher');
    }
  };

  // Calculate statistics
  const totalTeachers = teachers.length;
  const professors = teachers.filter(t => t.designation === 'Professor').length;
  const totalRating = teachers.reduce((sum, t) => sum + (t.rating || 0), 0);
  const avgRating = totalTeachers > 0 ? (totalRating / totalTeachers) : 0;
  const totalCourses = teachers.reduce((sum, t) => {
    if (t.coursesTeaching && Array.isArray(t.coursesTeaching)) {
      return sum + t.coursesTeaching.length;
    }
    return sum;
  }, 0);
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const topPerformers = teachers.filter(t => (t.rating || 0) >= 4.5).length;

  // Department distribution for chart
  const deptCounts = teachers.reduce((acc, t) => {
    const dept = t.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepts = Object.entries(deptCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxDeptCount = topDepts.length > 0 ? Math.max(...topDepts.map(([, c]) => c)) : 1;

  const getTeacherId = (teacher: Teacher) => {
    if (teacher.teacherId) return teacher.teacherId;
    if (teacher._id) return teacher._id.slice(-8).toUpperCase();
    return 'N/A';
  };

  // Monthly data for chart (mock data based on teacher growth)
  const monthlyData = [
    { month: 'Jan', teachers: Math.max(0, totalTeachers * 0.3) },
    { month: 'Feb', teachers: Math.max(0, totalTeachers * 0.35) },
    { month: 'Mar', teachers: Math.max(0, totalTeachers * 0.4) },
    { month: 'Apr', teachers: Math.max(0, totalTeachers * 0.45) },
    { month: 'May', teachers: Math.max(0, totalTeachers * 0.5) },
    { month: 'Jun', teachers: Math.max(0, totalTeachers * 0.55) },
    { month: 'Jul', teachers: Math.max(0, totalTeachers * 0.6) },
    { month: 'Aug', teachers: Math.max(0, totalTeachers * 0.7) },
    { month: 'Sep', teachers: Math.max(0, totalTeachers * 0.8) },
    { month: 'Oct', teachers: Math.max(0, totalTeachers * 0.85) },
    { month: 'Nov', teachers: Math.max(0, totalTeachers * 0.9) },
    { month: 'Dec', teachers: totalTeachers },
  ];

  const maxMonthly = Math.max(...monthlyData.map(d => d.teachers), 1);

  const cols: Column<Teacher>[] = [
    {
      key: "name", 
      header: "Faculty", 
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs gradient-brand text-white">
              {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getTeacherId(r)}</span> · {r.email || 'No email'}
            </div>
          </div>
        </div>
      ) 
    },
    { 
      key: "designation", 
      header: "Designation", 
      cell: (r) => <Badge variant="secondary">{r.designation}</Badge> 
    },
    { 
      key: "department", 
      header: "Department",
      cell: (r) => <span className="text-sm">{r.department}</span>
    },
    { 
      key: "experience", 
      header: "Experience", 
      cell: (r) => <span className="tabular-nums">{r.experience || 0} yrs</span> 
    },
    { 
      key: "specialization", 
      header: "Specialization", 
      cell: (r) => <span className="text-xs text-muted-foreground">{r.specialization || 'N/A'}</span> 
    },
    { 
      key: "rating", 
      header: "Rating", 
      cell: (r) => {
        const rating = r.rating || 0;
        return (
          <span className="flex items-center gap-1 font-medium">
            <Star className={`h-3 w-3 ${rating >= 4.0 ? 'fill-warning text-warning' : 'text-muted-foreground'}`} /> 
            {rating.toFixed(1)}
          </span>
        );
      } 
    },
    { 
      key: "salary", 
      header: "Salary", 
      cell: (r) => {
        const salary = r.salary || 0;
        return <span className="tabular-nums">PKR {(salary/1000).toFixed(0)}K</span>;
      } 
    },
    { 
      key: "status", 
      header: "Status", 
      cell: (r) => {
        const status = r.status || 'Active';
        const variant = status === 'Active' ? 'default' : 'outline';
        return <Badge variant={variant}>{status}</Badge>;
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
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r._id && handleDelete(r._id, r.name)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AppShell 
        title="Teachers" 
        subtitle={totalTeachers > 0 ? `${totalTeachers} faculty · ${professors} professors · ⭐ ${avgRating.toFixed(1)} avg rating` : 'No teachers found'}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add Teacher
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchTeachers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      >
        {/* Analytics Dashboard - Modern Card Layout */}
        {teachers.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Faculty</p>
                    <p className="text-2xl font-bold mt-1">{totalTeachers}</p>
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="h-3 w-3" /> +12% this year
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active Faculty</p>
                    <p className="text-2xl font-bold mt-1">{activeTeachers}</p>
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                      <UserCheck className="h-3 w-3" /> {Math.round((activeTeachers/totalTeachers)*100)}% active
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold mt-1">{avgRating.toFixed(1)}</p>
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {topPerformers} top performers
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold mt-1">{totalCourses}</p>
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <BookOpen className="h-3 w-3" /> {teachers.length > 0 ? Math.round(totalCourses/teachers.length) : 0} per teacher
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row - Department Distribution & Monthly Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Department Distribution - Pie Chart Style */}
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Department Distribution</h4>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {topDepts.length} departments
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {topDepts.map(([dept, count], i) => {
                    const colors = [
                      'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 
                      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'
                    ];
                    const pct = (count / maxDeptCount) * 100;
                    return (
                      <div key={dept} className="group">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-medium truncate max-w-[120px]">{dept}</span>
                          <span className="text-muted-foreground">{count} ({Math.round((count/totalTeachers)*100)}%)</span>
                        </div>
                        <div className="w-full h-5 bg-muted/30 rounded-full overflow-hidden shadow-inner relative">
                          <div 
                            className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110`}
                            style={{ 
                              width: `${Math.max(pct, 3)}%`,
                              animation: `barGrow 0.8s ease-out ${i * 0.08}s both`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                          </div>
                          {pct > 15 && (
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white drop-shadow-sm">
                              {Math.round(pct)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t flex justify-between text-[10px] text-muted-foreground">
                  <span>Total: {totalTeachers} faculty</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {topDepts.length > 0 && `${topDepts[0][0]} (${topDepts[0][1]})`}
                  </span>
                </div>
              </div>

              {/* Monthly Growth - Line Chart Style */}
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Faculty Growth</h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-1" /> +{totalTeachers > 0 ? Math.round((totalTeachers/Math.max(1, monthlyData[0].teachers))*100)-100 : 0}%
                  </Badge>
                </div>
                <div className="relative h-32">
                  {/* Line Chart */}
                  <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={120 - (y / 100) * 100}
                        x2="400"
                        y2={120 - (y / 100) * 100}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                        strokeDasharray="4,4"
                        opacity="0.3"
                      />
                    ))}
                    
                    {/* Area under line */}
                    <polygon
                      points={`0,120 ${monthlyData.map((d, i) => `${(i / (monthlyData.length - 1)) * 400},${120 - ((d.teachers / maxMonthly) * 100)}`).join(' ')} 400,120`}
                      fill="url(#areaGradient)"
                      opacity="0.2"
                    />
                    
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Line */}
                    <polyline
                      points={monthlyData.map((d, i) => `${(i / (monthlyData.length - 1)) * 400},${120 - ((d.teachers / maxMonthly) * 100)}`).join(' ')}
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-drawLine"
                    />
                    
                    {/* Dots */}
                    {monthlyData.map((d, i) => {
                      const x = (i / (monthlyData.length - 1)) * 400;
                      const y = 120 - ((d.teachers / maxMonthly) * 100);
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#8B5CF6"
                          stroke="white"
                          strokeWidth="1.5"
                          className="animate-blink"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      );
                    })}
                    
                    {/* Labels */}
                    {monthlyData.filter((_, i) => i % 2 === 0).map((d, i) => {
                      const idx = i * 2;
                      const x = (idx / (monthlyData.length - 1)) * 400;
                      return (
                        <text
                          key={i}
                          x={x}
                          y={125}
                          fontSize="7"
                          fill="#6b7280"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {d.month}
                        </text>
                      );
                    })}
                  </svg>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Start: {Math.round(monthlyData[0].teachers)}</span>
                  <span>Current: {Math.round(monthlyData[monthlyData.length-1].teachers)}</span>
                  <span className="text-emerald-600">↑ {totalTeachers > 0 ? Math.round((totalTeachers/Math.max(1, monthlyData[0].teachers))*100)-100 : 0}%</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium">Professors</span>
                </div>
                <p className="text-lg font-bold mt-1">{professors}</p>
              </div>
              <div className="p-3 rounded-lg border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium">Avg Experience</span>
                </div>
                <p className="text-lg font-bold mt-1">
                  {teachers.length > 0 ? (teachers.reduce((s, t) => s + (t.experience || 0), 0) / teachers.length).toFixed(1) : 0} yrs
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium">Top Rated</span>
                </div>
                <p className="text-lg font-bold mt-1">{topPerformers}</p>
              </div>
              <div className="p-3 rounded-lg border bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-medium">Retention Rate</span>
                </div>
                <p className="text-lg font-bold mt-1">
                  {teachers.length > 0 ? Math.round((activeTeachers/totalTeachers)*100) : 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Name, Email, Department..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredTeachers.length} of {teachers.length} teachers
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
          {teachers.length > 0 && (
            <div className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>Try searching by ID (e.g., {getTeacherId(teachers[0])})</span>
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
                onClick={fetchTeachers}
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
              <p className="mt-4 text-muted-foreground">Loading teachers from database...</p>
            </div>
          </div>
        )}

        {/* DataTable */}
        {!loading && !error && (
          <DataTable 
            title="Faculty directory" 
            description={`${filteredTeachers.length} teachers found${searchQuery ? ` (filtered from ${teachers.length})` : ''}`}
            data={filteredTeachers} 
            columns={cols} 
            searchKeys={["teacherId", "_id", "name", "email", "department", "designation", "specialization", "status"] as (keyof Teacher)[]}
            pageSize={10} 
            addLabel="Add faculty"
            onAdd={openAddModal}
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredTeachers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No teachers match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try searching by ID, name, email, or department</p>
                <Button 
                  variant="outline"
                  onClick={() => handleSearch('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No teachers found in database</p>
                <Button 
                  onClick={openAddModal}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Teacher
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Teacher Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Teacher
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    Add New Teacher
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
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Personal Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Dr. Ahmed Hassan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="teacher@uni.edu.pk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Professional Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Professional Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <select
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {designations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Artificial Intelligence"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (PKR)</Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="officeHours">Office Hours</Label>
                  <Input
                    id="officeHours"
                    name="officeHours"
                    value={formData.officeHours}
                    onChange={handleInputChange}
                    placeholder="Monday-Wednesday 2-4 PM"
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
                      {isEditMode ? 'Update Teacher' : 'Create Teacher'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes barGrow {
          from { width: 0%; opacity: 0; }
          to { width: var(--final-width, 100%); opacity: 1; }
        }
        
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-drawLine {
          stroke-dasharray: 1000;
          animation: drawLine 1.5s ease-out forwards;
        }
        
        .animate-blink {
          animation: blink 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default TeachersPage;
