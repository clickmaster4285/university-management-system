// src/routes/app.attendance.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/layouts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { attendanceAPI, StudentAttendance, AttendanceSummary } from "@/features/attendance";
import { departmentAPI } from "@/features/departments";
import { 
  CalendarCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Users,
  UserPlus,
  X,
  Save,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle,
  UserMinus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Activity,
  Smile,
  Star,
  Rocket
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from "recharts";


// Colors for charts
const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
const STATUS_COLORS = {
  'Present': '#10b981',
  'Absent': '#ef4444',
  'Late': '#f59e0b',
  'Leave': '#3b82f6',
  'Not Marked': '#9ca3af'
};

export function AttendancePage() {
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  
  // ✅ Overall today stats for KPI cards (persists across refreshes)
  const [overallTodayStats, setOverallTodayStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    notMarked: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    program: '',
    semester: '',
    department: ''
  });

  // Programs list
  const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      if (response && response.data) {
        setDepartments(response.data.map((d: any) => d.name));
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // ✅ NEW: Fetch overall today's attendance stats from database
  const fetchOverallTodayStats = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const response = await attendanceAPI.getAll({
        date: todayStr
      });

      if (response && response.data) {
        const records = response.data;
        const present = records.filter((r: any) => r.status === 'Present').length;
        const absent = records.filter((r: any) => r.status === 'Absent').length;
        const late = records.filter((r: any) => r.status === 'Late').length;
        const leave = records.filter((r: any) => r.status === 'Leave').length;
        const total = records.length;
        const notMarked = 0;

        setOverallTodayStats({
          total,
          present,
          absent,
          late,
          leave,
          notMarked
        });
        
      }
    } catch (error) {
      console.error('Failed to fetch overall today stats:', error);
    }
  };

  // Calculate today's stats from the students list (for the specific filter)
  const calculateTodayStats = (studentsList: StudentAttendance[]) => {
    const total = studentsList.length;
    const present = studentsList.filter(s => s.attendanceStatus === 'Present').length;
    const absent = studentsList.filter(s => s.attendanceStatus === 'Absent').length;
    const late = studentsList.filter(s => s.attendanceStatus === 'Late').length;
    const leave = studentsList.filter(s => s.attendanceStatus === 'Leave').length;
    const notMarked = studentsList.filter(s => s.attendanceStatus === 'Not Marked').length;
    
    setSummary({
      total,
      present,
      absent,
      late,
      leave,
      notMarked,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Fetch weekly attendance stats from database
  const fetchWeeklyStats = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const response = await attendanceAPI.getStats({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });


      if (response && response.data) {
        setWeeklyStats(response.data);
        generateChartFromStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch weekly stats:', error);
      setChartData(getEmptyChartData());
    }
  };

  // Generate chart data from real stats
  const generateChartFromStats = (stats: any) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    const dateMap = new Map();
    if (stats.dailyStats) {
      stats.dailyStats.forEach((day: any) => {
        const statusCounts = {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0
        };
        
        day.statuses.forEach((status: any) => {
          if (status.status === 'Present') statusCounts.present = status.count;
          if (status.status === 'Absent') statusCounts.absent = status.count;
          if (status.status === 'Late') statusCounts.late = status.count;
          if (status.status === 'Leave') statusCounts.leave = status.count;
        });
        
        dateMap.set(day._id, statusCounts);
      });
    }

    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      
      const dayStats = dateMap.get(dateStr);
      if (dayStats) {
        chartData.push({
          day: dayName,
          present: dayStats.present || 0,
          absent: dayStats.absent || 0,
          date: dateStr,
          isToday: i === 0,
          late: dayStats.late || 0,
          leave: dayStats.leave || 0
        });
      } else {
        chartData.push({
          day: dayName,
          present: 0,
          absent: 0,
          date: dateStr,
          isToday: i === 0,
          late: 0,
          leave: 0
        });
      }
    }
    
    setChartData(chartData);
  };

  // Get empty chart data
  const getEmptyChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      chartData.push({
        day: days[date.getDay()],
        present: 0,
        absent: 0,
        isToday: i === 0,
        late: 0,
        leave: 0
      });
    }
    return chartData;
  };

  useEffect(() => {
    fetchDepartments();
    fetchOverallTodayStats(); // ✅ Fetch overall stats on load
    fetchWeeklyStats();
  }, []);

  // Refresh chart when attendance is marked
  const refreshData = async () => {
    await fetchOverallTodayStats(); // ✅ Refresh overall stats
    await fetchWeeklyStats();
    if (filters.program && filters.semester && filters.department) {
      await fetchStudents();
    }
  };

  // Fetch students for attendance
  const fetchStudents = async () => {
    if (!filters.program || !filters.semester || !filters.department) {
      toast.error('Please select Program, Semester and Department');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await attendanceAPI.getStudentsForAttendance({
        program: filters.program,
        semester: parseInt(filters.semester),
        department: filters.department
      });

      if (response && response.data) {
        setStudents(response.data.students || []);
        calculateTodayStats(response.data.students || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      setError('Failed to load students. Please try again.');
      toast.error('Failed to load students');
      setStudents([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle student status change
  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    setStudents(prev => prev.map(student => 
      student._id === studentId 
        ? { ...student, attendanceStatus: status }
        : student
    ));
  };

  // Handle mark all as present
  const markAllPresent = () => {
    setStudents(prev => prev.map(student => 
      student.attendanceStatus === 'Not Marked' 
        ? { ...student, attendanceStatus: 'Present' }
        : student
    ));
    toast.success('All unmarked students marked as Present');
  };

  // Handle mark all as absent
  const markAllAbsent = () => {
    setStudents(prev => prev.map(student => 
      student.attendanceStatus === 'Not Marked' 
        ? { ...student, attendanceStatus: 'Absent' }
        : student
    ));
    toast.success('All unmarked students marked as Absent');
  };

  // Handle submit attendance
  const handleSubmitAttendance = async () => {
    const markedStudents = students.filter(s => s.attendanceStatus !== 'Not Marked');
    
    if (markedStudents.length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    const attendanceData = markedStudents.map(student => ({
      studentId: student._id,
      status: student.attendanceStatus as 'Present' | 'Absent' | 'Late' | 'Leave'
    }));

    try {
      setIsSubmitting(true);
      const response = await attendanceAPI.markAttendance({
        attendance: attendanceData,
        program: filters.program,
        semester: parseInt(filters.semester),
        department: filters.department,
        markedBy: 'Admin'
      });

      const res: any = response;
      if (res && (res.success || res.data?.success || res.status === 200)) {
        toast.success(`Attendance marked: ${res.data?.summary?.successful || res.data?.data?.summary?.successful || 0} students`);
        await fetchStudents();
        await fetchOverallTodayStats(); // ✅ Refresh overall stats after marking
        await fetchWeeklyStats();
        setIsFormOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge className="bg-success/15 text-success border-0">Present</Badge>;
      case 'Absent':
        return <Badge className="bg-destructive/15 text-destructive border-0">Absent</Badge>;
      case 'Late':
        return <Badge className="bg-warning/15 text-warning border-0">Late</Badge>;
      case 'Leave':
        return <Badge className="bg-info/15 text-info border-0">Leave</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  // Filter students by search
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate attendance percentage
  const attendancePercentage = overallTodayStats.total > 0 
    ? Math.round((overallTodayStats.present / overallTodayStats.total) * 100) 
    : 0;

  // Calculate total present and absent from chart data
  const totalPresent = chartData.reduce((sum, day) => sum + (day.present || 0), 0);
  const totalAbsent = chartData.reduce((sum, day) => sum + (day.absent || 0), 0);
  const totalLate = chartData.reduce((sum, day) => sum + (day.late || 0), 0);
  const totalLeave = chartData.reduce((sum, day) => sum + (day.leave || 0), 0);
  const totalRecords = totalPresent + totalAbsent + totalLate + totalLeave;

  // Get status distribution for pie chart
  const getStatusDistribution = () => {
    return [
      { name: 'Present', value: overallTodayStats.present || 0 },
      { name: 'Absent', value: overallTodayStats.absent || 0 },
      { name: 'Late', value: overallTodayStats.late || 0 },
      { name: 'Leave', value: overallTodayStats.leave || 0 }
    ];
  };

  return (
    <AppShell
      title="Attendance"
      subtitle={`${overallTodayStats.total} total · ${overallTodayStats.present} present today`}
      actions={
        <>
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="gradient-brand text-white border-0 hover:opacity-90"
          >
            <UserPlus className="h-4 w-4 mr-2" /> 
            {isFormOpen ? 'Close Form' : 'Mark Attendance'}
          </Button>
          <Button 
            variant="outline" 
            onClick={refreshData}
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
          label="Present Today" 
          value={overallTodayStats.present} 
          icon={UserCheck} 
          tone="success" 
          trend={attendancePercentage > 70 ? 0.8 : -0.5}
        />
        <KpiCard 
          label="Absent" 
          value={overallTodayStats.absent} 
          icon={UserX} 
          tone="destructive" 
        />
        <KpiCard 
          label="Late" 
          value={overallTodayStats.late} 
          icon={Clock} 
          tone="warning" 
        />
        <KpiCard 
          label="Total Records" 
          value={overallTodayStats.total} 
          icon={CalendarCheck} 
          tone="info" 
        />
      </div>

      {/* Animated Graphics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Status Distribution - Pie Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                <CardDescription>Status distribution</CardDescription>
              </div>
              <Smile className="h-4 w-4 text-muted-foreground" />
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
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span className="text-[10px] text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                <span className="text-[10px] text-muted-foreground">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span className="text-[10px] text-muted-foreground">Late</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                <span className="text-[10px] text-muted-foreground">Leave</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend - Area Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Weekly Trend</CardTitle>
                <CardDescription>Attendance pattern</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 10
                    }} 
                  />
                  <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fillOpacity={1} fill="url(#colorAbsent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span className="text-[10px] text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                <span className="text-[10px] text-muted-foreground">Absent</span>
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
                <CardDescription>Attendance overview</CardDescription>
              </div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-green-600">{overallTodayStats.present}</div>
                <div className="text-[10px] text-muted-foreground">Present</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-red-600">{overallTodayStats.absent}</div>
                <div className="text-[10px] text-muted-foreground">Absent</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-yellow-600">{overallTodayStats.late}</div>
                <div className="text-[10px] text-muted-foreground">Late</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-blue-600">{overallTodayStats.leave}</div>
                <div className="text-[10px] text-muted-foreground">Leave</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Form */}
      {isFormOpen && (
        <Card className="mb-6 glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mark Attendance</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <select
                  id="program"
                  value={filters.program}
                  onChange={(e) => handleFilterChange('program', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Program</option>
                  {programs.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <select
                  id="semester"
                  value={filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <select
                  id="department"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button 
                onClick={fetchStudents}
                disabled={loading || !filters.program || !filters.semester || !filters.department}
                className="gradient-brand text-white border-0"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
                ) : (
                  <><Users className="h-4 w-4 mr-2" /> Fetch Students</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Only show when students are loaded */}
      {summary && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-success/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{summary.present}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{summary.absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{summary.late}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </CardContent>
          </Card>
          <Card className="border-info/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-info">{summary.notMarked}</p>
              <p className="text-sm text-muted-foreground">Not Marked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      {students.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllPresent}
              className="text-success border-success/30 hover:bg-success/10"
            >
              <CheckCircle className="h-4 w-4 mr-1" /> All Present
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAbsent}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <UserMinus className="h-4 w-4 mr-1" /> All Absent
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading students...</p>
          </div>
        </div>
      )}

      {/* Students List */}
      {!loading && students.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium">#</th>
                    <th className="text-left p-3 text-sm font-medium">Student</th>
                    <th className="text-left p-3 text-sm font-medium">Email</th>
                    <th className="text-left p-3 text-sm font-medium">Program</th>
                    <th className="text-left p-3 text-sm font-medium">Semester</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student._id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="p-3 text-sm font-medium">{student.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{student.email}</td>
                      <td className="p-3 text-sm">{student.program}</td>
                      <td className="p-3 text-sm">Semester {student.semester}</td>
                      <td className="p-3">
                        {getStatusBadge(student.attendanceStatus)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-xs ${student.attendanceStatus === 'Present' ? 'bg-success text-white hover:bg-success/90' : 'hover:bg-success/10'}`}
                            onClick={() => handleStatusChange(student._id, 'Present')}
                          >
                            P
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-xs ${student.attendanceStatus === 'Absent' ? 'bg-destructive text-white hover:bg-destructive/90' : 'hover:bg-destructive/10'}`}
                            onClick={() => handleStatusChange(student._id, 'Absent')}
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-xs ${student.attendanceStatus === 'Late' ? 'bg-warning text-white hover:bg-warning/90' : 'hover:bg-warning/10'}`}
                            onClick={() => handleStatusChange(student._id, 'Late')}
                          >
                            L
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-xs ${student.attendanceStatus === 'Leave' ? 'bg-info text-white hover:bg-info/90' : 'hover:bg-info/10'}`}
                            onClick={() => handleStatusChange(student._id, 'Leave')}
                          >
                            LV
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {students.length > 0 && (
        <div className="mt-6 flex justify-end gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsFormOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAttendance}
            disabled={isSubmitting}
            className="gradient-brand text-white border-0"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Attendance</>
            )}
          </Button>
        </div>
      )}

      {/* Weekly Overview Chart */}
      <Card className="glass mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Overview</CardTitle>
              <CardDescription>
                {totalRecords > 0 
                  ? `Real attendance data from database · ${totalPresent} present, ${totalAbsent} absent this week`
                  : 'No attendance data available for this week'}
              </CardDescription>
            </div>
            {totalRecords > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                  <span className="text-sm text-[#10b981]">Present</span>
                  <span className="text-sm font-medium">{totalPresent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                  <span className="text-sm text-[#ef4444]">Absent</span>
                  <span className="text-sm font-medium">{totalAbsent}</span>
                </div>
                {totalRecords > 0 && (
                  <Badge className={`${(totalPresent / totalRecords * 100) >= 70 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'} border-0`}>
                    {Math.round((totalPresent / totalRecords) * 100)}% Present
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pl-0">
          {totalRecords > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: "var(--popover)", 
                    border: "1px solid var(--border)", 
                    borderRadius: 8 
                  }}
                  formatter={(value, name) => {
                    if (name === 'present') return [value, 'Present'];
                    if (name === 'absent') return [value, 'Absent'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    const data = chartData.find(d => d.day === label);
                    return `${label} ${data?.isToday ? '(Today)' : ''}`;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    if (value === 'present') return 'Present';
                    if (value === 'absent') return 'Absent';
                    return value;
                  }}
                />
                <Bar 
                  dataKey="present" 
                  name="Present" 
                  fill="#10b981" 
                  radius={[6,6,0,0]} 
                />
                <Bar 
                  dataKey="absent" 
                  name="Absent" 
                  fill="#ef4444" 
                  radius={[6,6,0,0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mb-4 opacity-50" />
              <p>No attendance data available</p>
              <p className="text-sm">Start marking attendance to see the weekly overview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default AttendancePage;
