import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, GraduationCap, Building2, BookOpen, CalendarCheck, Video,
  DollarSign, AlertCircle, ClipboardList, Library, Home, Bus,
  UserCheck, TrendingUp, Wallet, Receipt, UserPlus, Award,
  Download, Plus, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
} from "recharts";
import { KPIS, admissionsTrend, revenueSeries, attendanceWeek, departmentAnalytics, performanceDistribution } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ScholarOS" },
      { name: "description", content: "Live overview of admissions, attendance, fees, courses, and campus operations." },
      { property: "og:title", content: "Dashboard — ScholarOS" },
      { property: "og:description", content: "Realtime university metrics." },
    ],
  }),
  component: Dashboard,
});

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function Dashboard() {
  const adm = admissionsTrend();
  const rev = revenueSeries();
  const att = attendanceWeek();
  const dept = departmentAnalytics();
  const perf = performanceDistribution();

  return (
    <AppShell
      title="Welcome back, Dr. Ali"
      subtitle="Here's what's happening across your campuses today."
      actions={
        <>
          <Button variant="outline" onClick={() => toast.success("Report generated")}><Download className="h-4 w-4" /> Export</Button>
          <Button className="gradient-brand text-white border-0" onClick={() => toast.success("New admission started")}><Plus className="h-4 w-4" /> New admission</Button>
        </>
      }
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Students" value={KPIS.totalStudents.toLocaleString()} icon={GraduationCap} trend={4.2} tone="brand" />
        <KpiCard label="Total Teachers" value={KPIS.totalTeachers} icon={Users} trend={2.1} tone="info" />
        <KpiCard label="Departments" value={KPIS.departments} icon={Building2} tone="brand" />
        <KpiCard label="Courses" value={KPIS.courses} icon={BookOpen} trend={1.4} tone="info" />
        <KpiCard label="Attendance Today" value={`${KPIS.attendanceToday}%`} icon={CalendarCheck} trend={0.8} tone="success" />
        <KpiCard label="Classes Today" value={KPIS.classesToday} icon={Video} tone="brand" />
        <KpiCard label="Fees Collected" value={`PKR ${(KPIS.feesCollected / 1e6).toFixed(1)}M`} icon={DollarSign} trend={12.4} tone="success" />
        <KpiCard label="Pending Fees" value={`PKR ${(KPIS.pendingFees / 1e6).toFixed(1)}M`} icon={AlertCircle} trend={-3.1} tone="warning" />
        <KpiCard label="Assignments Pending" value={KPIS.assignmentsPending} icon={ClipboardList} tone="warning" />
        <KpiCard label="Online Classes" value={KPIS.onlineClasses} icon={Video} tone="info" />
        <KpiCard label="Library Books Issued" value={KPIS.libraryIssued.toLocaleString()} icon={Library} tone="brand" />
        <KpiCard label="Hostel Students" value={KPIS.hostelStudents.toLocaleString()} icon={Home} tone="info" />
        <KpiCard label="Transport Students" value={KPIS.transportStudents.toLocaleString()} icon={Bus} tone="brand" />
        <KpiCard label="Active Users" value={KPIS.activeUsers.toLocaleString()} icon={UserCheck} trend={8.9} tone="success" />
        <KpiCard label="Revenue" value={`PKR ${(KPIS.revenue / 1e6).toFixed(1)}M`} icon={TrendingUp} trend={15.2} tone="success" />
        <KpiCard label="Expenses" value={`PKR ${(KPIS.expenses / 1e6).toFixed(1)}M`} icon={Wallet} trend={4.7} tone="destructive" />
        <KpiCard label="Admissions this Month" value={KPIS.admissionsThisMonth} icon={UserPlus} trend={22.5} tone="brand" />
        <KpiCard label="Graduated Students" value={KPIS.graduated.toLocaleString()} icon={Award} tone="info" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Admissions trend</CardTitle>
                <CardDescription>Applications vs enrollments · last 12 months</CardDescription>
              </div>
              <Badge variant="outline" className="text-success border-success/30 bg-success/10">+22.5% MoM</Badge>
            </div>
          </CardHeader>
          <CardContent className="pl-0">
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
                  {perf.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={72} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="students" fill="var(--brand-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            {[
              { time: "09:00", title: "Data Structures & Algorithms", room: "CS-201", teacher: "Dr. Ahmed Malik", live: true },
              { time: "10:30", title: "Linear Algebra", room: "MATH-104", teacher: "Prof. Sara Iqbal", live: true },
              { time: "12:00", title: "Organic Chemistry Lab", room: "CHEM-Lab-3", teacher: "Dr. Bilal Khan" },
              { time: "14:00", title: "Marketing Strategy (MBA)", room: "BBA-301", teacher: "Dr. Zainab Shah" },
              { time: "15:30", title: "Machine Learning", room: "AI-Lab-1", teacher: "Dr. Omar Raza" },
            ].map((c) => (
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
                <Button size="sm" variant={c.live ? "default" : "outline"} className={c.live ? "gradient-brand text-white border-0" : ""} onClick={() => toast.success(c.live ? "Joining class…" : "Reminder set")}>
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
            {[
              { name: "Hamza Ali", program: "BSCS · Sem 4", risk: 82, reason: "Attendance 58%" },
              { name: "Fatima Sheikh", program: "BBA · Sem 2", risk: 74, reason: "GPA drop 0.8" },
              { name: "Usman Raza", program: "BEE · Sem 6", risk: 68, reason: "3 missed exams" },
              { name: "Iqra Baig", program: "BSSE · Sem 3", risk: 61, reason: "Fee overdue" },
            ].map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] gradient-brand text-white">{s.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.program} · {s.reason}</div>
                  </div>
                  <span className="text-xs font-semibold text-destructive">{s.risk}%</span>
                </div>
                <Progress value={s.risk} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
