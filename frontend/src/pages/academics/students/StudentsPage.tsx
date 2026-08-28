// src/routes/app.students.tsx
import { useState, useEffect } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { studentAPI, Student } from "@/features/students";
import { 
  GraduationCap, 
  UserCheck, 
  UserX, 
  Award, 
  QrCode, 
  Download, 
  RefreshCw, 
  UserPlus, 
  AlertCircle,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Smile,
  Star,
  Rocket,
  Target,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area, RadialBarChart, RadialBar } from "recharts";


// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state - ALL FIELDS EMPTY
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    cnic: '',
    email: '',
    phone: '',
    program: '',
    department: '',
    semester: 0,
    gpa: 0,
    cgpa: 0,
    attendance: 0,
    fee: '',
    city: '',
    campus: '',
    status: ''
  });

  // Validation errors state
  const [fieldErrors, setFieldErrors] = useState<{
    cnic?: string;
    email?: string;
    phone?: string;
  }>({});

  // Programs and departments for dropdowns
  const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS', 'BS Physics', 'BS Math', 'LLB'];
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
  const campuses = [
    'Main Campus - Islamabad',
    'North Campus - Lahore',
    'South Campus - Karachi',
    'East Campus - Peshawar'
  ];
  const feeOptions = ['Paid', 'Pending', 'Partial', 'Due', 'Overdue', 'Scholarship'];
  const statusOptions = ['Active', 'Inactive', 'Graduated', 'Suspended', 'Dropped'];

  // Fetch students from database
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await studentAPI.getAll();
      const studentList = Array.isArray(response) ? response : [];

      if (studentList.length > 0) {
        setStudents(studentList);
        setFilteredStudents(studentList);
      } else {
        setStudents([]);
        setFilteredStudents([]);
        setError('No data received from server');
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch students:', error);

      let errorMsg = 'Failed to load students from database';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running on http://localhost:4000';
      } else if (error.message?.includes('404')) {
        errorMsg = 'API endpoint not found. Check if /api/students exists.';
      } else if (error.message?.includes('CORS')) {
        errorMsg = 'CORS error. Check backend CORS configuration.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Prepare chart data
  const getStatusDistribution = () => {
    const statusMap = new Map();
    students.forEach(student => {
      const status = student.status || 'Active';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    return Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const getProgramDistribution = () => {
    const programMap = new Map();
    students.forEach(student => {
      const program = student.program || 'Other';
      programMap.set(program, (programMap.get(program) || 0) + 1);
    });
    return Array.from(programMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  };

  const getGPADistribution = () => {
    const ranges = [
      { name: '3.5-4.0', min: 3.5, max: 4.0 },
      { name: '3.0-3.49', min: 3.0, max: 3.49 },
      { name: '2.5-2.99', min: 2.5, max: 2.99 },
      { name: '2.0-2.49', min: 2.0, max: 2.49 },
      { name: 'Below 2.0', min: 0, max: 1.99 }
    ];
    
    return ranges.map(range => ({
      name: range.name,
      value: students.filter(s => {
        const gpa = s.gpa || 0;
        return gpa >= range.min && gpa <= range.max;
      }).length
    }));
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = students.filter(student => {
      const mongoId = student._id || '';
      const mongoIdMatch = mongoId.toLowerCase().includes(searchLower);
      const studentId = student.studentId || '';
      const studentIdMatch = studentId.toLowerCase().includes(searchLower);
      const shortId = mongoId.slice(-8) || '';
      const shortIdMatch = shortId.toLowerCase().includes(searchLower);
      const nameMatch = student.name?.toLowerCase().includes(searchLower) || false;
      const emailMatch = student.email?.toLowerCase().includes(searchLower) || false;
      const programMatch = student.program?.toLowerCase().includes(searchLower) || false;
      const departmentMatch = student.department?.toLowerCase().includes(searchLower) || false;
      const cityMatch = student.city?.toLowerCase().includes(searchLower) || false;
      const cnicMatch = student.cnic?.toLowerCase().includes(searchLower) || false;
      const statusMatch = student.status?.toLowerCase().includes(searchLower) || false;
      const campusMatch = student.campus?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = student.phone?.toLowerCase().includes(searchLower) || false;
      const feeMatch = student.fee?.toLowerCase().includes(searchLower) || false;
      
      return mongoIdMatch || studentIdMatch || shortIdMatch || nameMatch || emailMatch || 
             programMatch || departmentMatch || cityMatch || cnicMatch || statusMatch || 
             campusMatch || phoneMatch || feeMatch;
    });
    
    setFilteredStudents(filtered);
  };

  // Validate uniqueness of CNIC, Email, and Phone
  const validateUniqueness = (): boolean => {
    const errors: { cnic?: string; email?: string; phone?: string } = {};
    let isValid = true;

    if (!students || students.length === 0) {
      return true;
    }

    if (formData.cnic && formData.cnic.trim() !== '') {
      const cnicExists = students.some(student => {
        if (!student.cnic || student.cnic.trim() === '') return false;
        if (isEditMode && student._id === editingId) return false;
        return student.cnic.toLowerCase() === formData.cnic.toLowerCase();
      });
      if (cnicExists) {
        errors.cnic = 'This CNIC is already registered with another student';
        isValid = false;
      }
    }

    if (formData.email && formData.email.trim() !== '') {
      const emailExists = students.some(student => {
        if (!student.email || student.email.trim() === '') return false;
        if (isEditMode && student._id === editingId) return false;
        return student.email.toLowerCase() === formData.email.toLowerCase();
      });
      if (emailExists) {
        errors.email = 'This email is already registered with another student';
        isValid = false;
      }
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneExists = students.some(student => {
        if (!student.phone || student.phone.trim() === '') return false;
        if (isEditMode && student._id === editingId) return false;
        return student.phone === formData.phone;
      });
      if (phoneExists) {
        errors.phone = 'This phone number is already registered with another student';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Handle form input change with validation clearing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'gpa' || name === 'cgpa' || name === 'attendance' 
        ? parseFloat(value) || 0 
        : value
    }));

    if (name === 'cnic' || name === 'email' || name === 'phone') {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Open modal for adding new student
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFieldErrors({});
    setFormData({
      name: '',
      fatherName: '',
      motherName: '',
      cnic: '',
      email: '',
      phone: '',
      program: '',
      department: '',
      semester: 0,
      gpa: 0,
      cgpa: 0,
      attendance: 0,
      fee: '',
      city: '',
      campus: '',
      status: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing student
  const openEditModal = (student: Student) => {
    setIsEditMode(true);
    setEditingId(student._id || null);
    setFieldErrors({});
    setFormData({
      name: student.name || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      cnic: student.cnic || '',
      email: student.email || '',
      phone: student.phone || '',
      program: student.program || '',
      department: student.department || '',
      semester: student.semester || 0,
      gpa: student.gpa || 0,
      cgpa: student.cgpa || 0,
      attendance: student.attendance || 0,
      fee: student.fee || '',
      city: student.city || '',
      campus: student.campus || '',
      status: student.status || ''
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFieldErrors({});
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.name || !formData.program || !formData.department) {
        toast.error('Name, Program and Department are required');
        setIsSubmitting(false);
        return;
      }

      const isValid = validateUniqueness();
      if (!isValid) {
        const errorMessages = Object.values(fieldErrors).filter(Boolean);
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0]);
        } else {
          toast.error('Duplicate information found. Please check CNIC, Email, and Phone.');
        }
        setIsSubmitting(false);
        return;
      }
      
      const studentData = {
        ...formData,
        semester: Number(formData.semester) || 0,
        gpa: Number(formData.gpa) || 0,
        cgpa: Number(formData.cgpa) || 0,
        attendance: Number(formData.attendance) || 0
      };

      let response;
      if (isEditMode && editingId) {
        response = await studentAPI.update(editingId, studentData);
        toast.success(`Student ${formData.name} updated successfully!`);
      } else {
        response = await studentAPI.create(studentData);
        toast.success(`Student ${formData.name} created successfully!`);
      }
      
      setFormData({
        name: '',
        fatherName: '',
        motherName: '',
        cnic: '',
        email: '',
        phone: '',
        program: '',
        department: '',
        semester: 0,
        gpa: 0,
        cgpa: 0,
        attendance: 0,
        fee: '',
        city: '',
        campus: '',
        status: ''
      });
      setFieldErrors({});
      
      closeModal();
      await fetchStudents();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('❌ Failed to save student:', error);
      
      let errorMsg = isEditMode ? 'Failed to update student' : 'Failed to create student';
      
      if (error.message?.includes('duplicate') || error.message?.includes('E11000')) {
        if (error.message?.includes('cnic')) {
          errorMsg = 'CNIC already exists. Please use a unique CNIC.';
        } else if (error.message?.includes('email')) {
          errorMsg = 'Email already exists. Please use a unique email.';
        } else if (error.message?.includes('phone')) {
          errorMsg = 'Phone number already exists. Please use a unique phone number.';
        } else {
          errorMsg = 'Duplicate entry. CNIC, Email, or Phone already exists.';
        }
      } else if (error.message?.includes('validation')) {
        errorMsg = 'Validation error. Please check your inputs.';
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        errorMsg = 'Network error. Please check if backend server is running.';
      } else if (error.response?.status === 400) {
        errorMsg = error.response?.data?.message || 'Invalid data provided. Please check your inputs.';
      } else if (error.response?.status === 404) {
        errorMsg = 'Student not found. It may have been deleted.';
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      await studentAPI.delete(id);
      toast.success(`Student ${name} deleted successfully`);
      await fetchStudents();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast.error('Failed to delete student');
    }
  };

  // Format student ID
  const getStudentId = (student: Student) => {
    if (student.studentId) return student.studentId;
    if (student._id) return student._id.slice(-8).toUpperCase();
    return 'N/A';
  };

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const onLeaveStudents = students.filter(s => s.status === 'Inactive' || s.status === 'On Leave').length;
  const graduatedStudents = students.filter(s => s.status === 'Graduated').length;
  const totalGPA = students.reduce((sum, s) => sum + (s.gpa || 0), 0);
  const avgGPA = totalStudents > 0 ? (totalGPA / totalStudents) : 0;
  const passRate = totalStudents > 0 ? Math.round((students.filter(s => (s.gpa || 0) >= 2.0).length / totalStudents) * 100) : 0;

  // Define columns for DataTable
  const cols: Column<Student>[] = [
    {
      key: "name", 
      header: "Student",
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
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getStudentId(r)}</span> · {r.email || 'No email'}
            </div>
          </div>
        </div>
      ),
    },
    { 
      key: "program", 
      header: "Program", 
      cell: (r) => <Badge variant="secondary">{r.program}</Badge> 
    },
    { 
      key: "department", 
      header: "Department", 
      cell: (r) => <span className="text-sm">{r.department}</span> 
    },
    { 
      key: "semester", 
      header: "Sem", 
      cell: (r) => <span className="tabular-nums">{r.semester || 0}</span> 
    },
    { 
      key: "gpa", 
      header: "GPA", 
      cell: (r) => {
        const gpa = r.gpa || 0;
        return <span className="tabular-nums font-medium">{gpa.toFixed(2)}</span>;
      } 
    },
    { 
      key: "attendance", 
      header: "Attendance", 
      cell: (r) => {
        const attendance = r.attendance || 0;
        return (
          <span className={`tabular-nums font-medium ${
            attendance < 70 ? "text-destructive" : 
            attendance < 85 ? "text-warning" : 
            "text-success"
          }`}>
            {attendance}%
          </span>
        );
      } 
    },
    { 
      key: "fee", 
      header: "Fee",
      cell: (r) => (
        <Badge className={
          r.fee === "Paid" ? "bg-success/15 text-success border-0" :
          r.fee === "Partial" ? "bg-warning/15 text-warning border-0" :
          r.fee === "Pending" ? "bg-yellow-500/15 text-yellow-600 border-0" :
          "bg-destructive/15 text-destructive border-0"
        }>
          {r.fee || 'N/A'}
        </Badge>
      ) 
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
      key: "campus", 
      header: "Campus", 
      cell: (r) => {
        const campus = r.campus?.split(" - ")[1] || r.campus || 'Main';
        return <span className="text-xs text-muted-foreground">{campus}</span>;
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label="Total Students" 
            value={totalStudents} 
            icon={GraduationCap} 
            trend={totalStudents > 0 ? 4.2 : 0} 
            tone="brand" 
          />
          <KpiCard 
            label="Active" 
            value={activeStudents} 
            icon={UserCheck} 
            tone="success" 
          />
          <KpiCard 
            label="On Leave" 
            value={onLeaveStudents} 
            icon={UserX} 
            tone="warning" 
          />
          <KpiCard 
            label="Graduated" 
            value={graduatedStudents} 
            icon={Award} 
            tone="info" 
          />
        </div>

        {/* Engaging Graphics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Status Distribution - Pie Chart */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Student Status</CardTitle>
                  <CardDescription>Status distribution</CardDescription>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={getStatusDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {getStatusDistribution().map((entry, index) => (
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
                {getStatusDistribution().slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Program Distribution - Bar Chart */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Program Distribution</CardTitle>
                  <CardDescription>Top programs</CardDescription>
                </div>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getProgramDistribution()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={8} tickLine={false} axisLine={false} width={50} />
                    <Tooltip 
                      contentStyle={{ 
                        background: "var(--popover)", 
                        border: "1px solid var(--border)", 
                        borderRadius: 8,
                        fontSize: 10
                      }} 
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pass Rate - Radial Chart */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <CardDescription>Students with GPA ≥ 2.0</CardDescription>
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
                    data={[{ name: 'Pass Rate', value: passRate }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      fill="#10b981"
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
                      {passRate}%
                    </text>
                    <Tooltip 
                      contentStyle={{ 
                        background: "var(--popover)", 
                        border: "1px solid var(--border)", 
                        borderRadius: 8,
                        fontSize: 10
                      }} 
                      formatter={(value) => [`${value}%`, 'Pass Rate']}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Name, Email, Program..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredStudents.length} of {students.length} students
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
          {students.length > 0 && (
            <div className="text-xs text-muted-foreground ml-auto">
              💡 Try searching by ID (e.g., {getStudentId(students[0])})
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
                onClick={fetchStudents}
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
              <p className="mt-4 text-muted-foreground">Loading students from database...</p>
            </div>
          </div>
        )}

        {/* DataTable */}
        {!loading && !error && (
          <DataTable
            title="All students"
            description={`${filteredStudents.length} students found${searchQuery ? ` (filtered from ${students.length})` : ''}`}
            data={filteredStudents}
            columns={cols}
            searchKeys={["studentId", "_id", "name", "email", "program", "department", "city", "cnic", "status", "campus", "phone", "fee"] as (keyof Student)[]}
            pageSize={10}
            addLabel="Add student"
            onAdd={openAddModal}
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No students match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try searching by ID, name, email, or program</p>
                <Button 
                  variant="outline"
                  onClick={() => handleSearch('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No students found in database</p>
                <Button 
                  onClick={openAddModal}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Student
                </Button>
              </>
            )}
          </div>
        )}
      
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
                    Edit Student
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    Add New Student
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
                    placeholder=""
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input
                    id="cnic"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder=""
                    className={fieldErrors.cnic ? "border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.cnic && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.cnic}</p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Contact Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder=""
                    className={fieldErrors.email ? "border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder=""
                    className={fieldErrors.phone ? "border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Academic Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Academic Information</h3>
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
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    name="semester"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    name="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA</Label>
                  <Input
                    id="cgpa"
                    name="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={formData.cgpa}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendance">Attendance %</Label>
                  <Input
                    id="attendance"
                    name="attendance"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.attendance}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                {/* Additional Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Additional Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee">Fee Status</Label>
                  <select
                    id="fee"
                    name="fee"
                    value={formData.fee}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Fee Status</option>
                    {feeOptions.map(f => (
                      <option key={f} value={f}>{f}</option>
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
                    <option value="">Select Status</option>
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus">Campus</Label>
                  <select
                    id="campus"
                    name="campus"
                    value={formData.campus}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Campus</option>
                    {campuses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                      {isEditMode ? 'Update Student' : 'Create Student'}
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

export default StudentsPage;
