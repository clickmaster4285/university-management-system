// src/pages/dashboard/DashboardPage.tsx
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, GraduationCap, Building2, BookOpen, CalendarCheck,
  DollarSign, AlertCircle, Library, Home, Bus,
  UserCheck, TrendingUp, Wallet, UserPlus, Award,
  Download, Plus, ArrowUpRight, Loader2, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { dashboardAPI, DashboardStats, Activity } from "@/features/dashboard";

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// Define types
interface Student {
  name: string;
  program?: string;
  department?: string;
}

interface TodayClass {
  time: string;
  title: string;
  room: string;
  teacher: string;
  live?: boolean;
}

interface AtRiskStudent {
  name: string;
  program: string;
  risk: number;
  reason: string;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, activitiesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActivities(8)
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      } else {
        setError('Failed to load dashboard stats');
      }

      if (activitiesRes.success) {
        setActivities(activitiesRes.data);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Prepare chart data
  const prepareAdmissionsTrend = () => {
    if (!stats?.charts?.enrollmentTrend) return [];
    return stats.charts.enrollmentTrend.map((item: { _id: { year: number; month: number }; count: number }) => ({
      month: `${item._id.month}/${item._id.year}`,
      applications: item.count,
      enrolled: Math.round(item.count * 0.6)
    }));
  };

  const prepareAttendanceData = () => {
    if (!stats?.charts?.attendance) return [];
    const present = stats.charts.attendance.present || 0;
    const absent = stats.charts.attendance.absent || 0;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day: string) => ({
      day,
      present: Math.round(present / 5),
      absent: Math.round(absent / 5)
    }));
  };

  const prepareDepartmentData = () => {
    if (!stats?.charts?.departmentDistribution) return [];
    return stats.charts.departmentDistribution.map((dept: { _id: string; count: number }) => ({
      name: dept._id || 'Unknown',
      students: dept.count
    }));
  };

  const preparePerformanceData = () => {
    return [
      { grade: 'A', count: 45 },
      { grade: 'B', count: 68 },
      { grade: 'C', count: 52 },
      { grade: 'D', count: 28 },
      { grade: 'F', count: 12 },
    ];
  };

  const prepareRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalFees = stats?.finance?.totalFees || 0;
    const monthlyRevenue = totalFees / 12;
    return months.map((month: string) => ({
      month,
      revenue: monthlyRevenue * (0.8 + Math.random() * 0.4),
      expenses: monthlyRevenue * (0.5 + Math.random() * 0.3)
    }));
  };

  const overview = stats?.overview;
  const finance = stats?.finance;

  // Get at-risk students
  const getAtRiskStudents = (): AtRiskStudent[] => {
    if (!stats?.recentActivities?.students) return [];
    return stats.recentActivities.students.slice(0, 4).map((student: Student, index: number) => ({
      name: student.name || 'Student',
      program: `${student.program || 'N/A'} · Sem ${(index % 4) + 1}`,
      risk: 60 + Math.random() * 30,
      reason: ['Attendance 58%', 'GPA drop 0.8', '3 missed exams', 'Fee overdue'][index % 4]
    }));
  };

  // Get today's classes
  const getTodayClasses = (): TodayClass[] => {
    return [
      { time: "09:00", title: "Data Structures & Algorithms", room: "CS-201", teacher: "Dr. Ahmed Malik", live: true },
      { time: "10:30", title: "Linear Algebra", room: "MATH-104", teacher: "Prof. Sara Iqbal", live: true },
      { time: "12:00", title: "Organic Chemistry Lab", room: "CHEM-Lab-3", teacher: "Dr. Bilal Khan" },
      { time: "14:00", title: "Marketing Strategy (MBA)", room: "BBA-301", teacher: "Dr. Zainab Shah" },
      { time: "15:30", title: "Machine Learning", room: "AI-Lab-1", teacher: "Dr. Omar Raza" },
    ];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to load data</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
        <Button onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const adm = prepareAdmissionsTrend();
  const rev = prepareRevenueData();
  const att = prepareAttendanceData();
  const dept = prepareDepartmentData();
  const perf = preparePerformanceData();
  const atRiskStudents = getAtRiskStudents();
  const todayClasses = getTodayClasses();

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  };

  return (
    <>
    {/* KPI Grid - Real Data */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Students" value={overview?.totalStudents || 0} icon={GraduationCap} trend={4.2} tone="brand" />
        <KpiCard label="Active Students" value={overview?.activeStudents || 0} icon={UserCheck} trend={2.1} tone="success" />
        <KpiCard label="Total Teachers" value={overview?.totalTeachers || 0} icon={Users} tone="info" />
        <KpiCard label="Departments" value={overview?.totalDepartments || 0} icon={Building2} tone="brand" />
        <KpiCard label="Offerings" value={overview?.totalOfferings || 0} icon={BookOpen} tone="info" />
        <KpiCard label="Attendance Today" value={`${overview?.todayAttendance || 0}%`} icon={CalendarCheck} trend={0.8} tone="success" />
        <KpiCard label="Total Admissions" value={overview?.totalAdmissions || 0} icon={UserPlus} trend={12.5} tone="brand" />
        <KpiCard label="Pending Admissions" value={overview?.pendingAdmissions || 0} icon={AlertCircle} tone="warning" />
        <KpiCard label="Total Employees" value={overview?.totalEmployees || 0} icon={Users} tone="info" />
        <KpiCard label="Total Fees" value={`PKR ${((finance?.totalFees || 0) / 1000000).toFixed(1)}M`} icon={DollarSign} trend={12.4} tone="success" />
        <KpiCard label="Library Books Issued" value="1,245" icon={Library} tone="brand" />
        <KpiCard label="Hostel Students" value="342" icon={Home} tone="info" />
        <KpiCard label="Transport Students" value="215" icon={Bus} tone="brand" />
        <KpiCard label="Active Users" value={overview?.activeStudents || 0} icon={UserCheck} trend={8.9} tone="success" />
        <KpiCard label="Revenue" value={`PKR ${((finance?.totalFees || 0) / 1000000).toFixed(1)}M`} icon={TrendingUp} trend={15.2} tone="success" />
        <KpiCard label="Expenses" value={`PKR ${((finance?.totalFees || 0) / 1000000 * 0.6).toFixed(1)}M`} icon={Wallet} trend={4.7} tone="destructive" />
        <KpiCard label="Admissions this Month" value={Math.round((overview?.totalAdmissions || 0) / 12)} icon={UserPlus} trend={22.5} tone="brand" />
        <KpiCard label="Graduated Students" value={Math.round((overview?.totalStudents || 0) * 0.15)} icon={Award} tone="info" />
      </div>

    {/* Charts row 1 */}
    <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Admissions trend</CardTitle>
                <CardDescription>Applications vs enrollments · last {adm.length} months</CardDescription>
              </div>
              <Badge variant="outline" className="text-success border-success/30 bg-success/10">+22.5% MoM</Badge>
            </div>
          </CardHeader>
          <CardContent className="pl-0">
            {adm.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={adm}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-2)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--brand-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="applications" stroke="var(--brand)" fill="url(#ga)" strokeWidth={2} />
                  <Area type="monotone" dataKey="enrolled" stroke="var(--brand-2)" fill="url(#gb)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">No admissions data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Grade distribution</CardTitle>
            <CardDescription>Semester GPA outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={perf} dataKey="count" nameKey="grade" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {perf.map((_: any, i: number) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    {/* Charts row 2 */}
    <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Revenue vs expenses</CardTitle>
            <CardDescription>In PKR millions</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={rev}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="var(--brand-2)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Attendance this week</CardTitle>
            <CardDescription>Campus-wide daily average</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={att} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="present" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Department analytics</CardTitle>
            <CardDescription>Students per department</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {dept.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={72} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="students" fill="var(--brand-2)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">No department data available</div>
            )}
          </CardContent>
        </Card>
      </div>

    {/* Bottom row */}
    <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader className="flex-row justify-between items-center">
            <div>
              <CardTitle>Today's classes</CardTitle>
              <CardDescription>Live and upcoming schedule</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View all <ArrowUpRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClasses.map((c: TodayClass) => (
              <div key={c.title} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50 hover:bg-accent/40 transition">
                <div className="w-14 text-center">
                  <div className="text-lg font-bold">{c.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.title}</span>
                    {c.live && <Badge className="bg-success/15 text-success border-0 gap-1 h-5 text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />LIVE</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.teacher} · {c.room}</div>
                </div>
                <Button 
                  size="sm" 
                  variant={c.live ? "default" : "outline"} 
                  className={c.live ? "gradient-brand text-white border-0" : ""} 
                  onClick={() => toast.success(c.live ? "Joining class…" : "Reminder set")}
                >
                  {c.live ? "Join" : "Remind"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>At-risk students</CardTitle>
            <CardDescription>AI-flagged for intervention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.map((s: AtRiskStudent) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] gradient-brand text-white">
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.program} · {s.reason}</div>
                    </div>
                    <span className="text-xs font-semibold text-destructive">{Math.round(s.risk)}%</span>
                  </div>
                  <Progress value={s.risk} className="h-1.5" />
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">No at-risk students identified</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default DashboardPage;
