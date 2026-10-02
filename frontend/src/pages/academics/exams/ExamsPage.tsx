import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { examAPI, Exam } from "@/features/exam";
import { offeringAPI, type CourseOffering } from "@/features/offerings";
import { type Subject } from "@/features/subjects";
import {
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  Clock,
  User,
  Database,
  FileText,
  AlertCircle,
  Smile,
  Star,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [offeringFilter, setOfferingFilter] = useState("");
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchExams = async (offeringId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await examAPI.getAll({
        limit: 100,
        ...(offeringId ? { offeringId } : {}),
      });

      let data: Exam[] = [];
      if (response && response.success) {
        data = response.data || [];
      } else if (response && response.data) {
        data = response.data || [];
      }

      setExams(data);
      setFilteredExams(data);
    } catch (error: any) {
      console.error("❌ Failed to fetch exams:", error);
      if (
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch") ||
        error.code === "ERR_NETWORK"
      ) {
        setError("Cannot connect to backend. Please check if server is running.");
      } else {
        setError(null);
      }
      setExams([]);
      setFilteredExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await examAPI.getStats();

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
          upcomingExams: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        avgGPA: 0,
        upcomingExams: [],
      });
    }
  };

  useEffect(() => {
    fetchExams(offeringFilter || undefined);
    fetchStats();
    offeringAPI
      .getAll({ status: "Active", limit: 500 })
      .then((res) => {
        if (res?.success) setOfferings(res.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchExams(offeringFilter || undefined);
  }, [offeringFilter]);

  const getOfferingLabel = (offering: CourseOffering) => {
    const subject =
      typeof offering.subjectId === "object" ? (offering.subjectId as Subject) : null;
    return `${offering.offeringId || ""} — ${subject?.code || ""} ${subject?.name || ""}`.trim();
  };

  const getStatusChartData = () => {
    if (!stats) return [];
    return [
      { name: "Scheduled", value: stats.scheduled || 0 },
      { name: "In Progress", value: stats.inProgress || 0 },
      { name: "Completed", value: stats.completed || 0 },
      { name: "Cancelled", value: stats.cancelled || 0 },
    ];
  };

  const getGPAChartData = () => {
    return [
      { name: "4.0", value: Math.floor(Math.random() * 30) + 10 },
      { name: "3.5", value: Math.floor(Math.random() * 40) + 20 },
      { name: "3.0", value: Math.floor(Math.random() * 35) + 15 },
      { name: "2.5", value: Math.floor(Math.random() * 25) + 10 },
      { name: "2.0", value: Math.floor(Math.random() * 15) + 5 },
      { name: "Below 2.0", value: Math.floor(Math.random() * 10) + 2 },
    ];
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredExams(exams);
      return;
    }

    const searchLower = query.toLowerCase().trim();
    const filtered = exams.filter((e) => {
      const titleMatch = e.title?.toLowerCase().includes(searchLower) || false;
      const courseMatch = e.course?.toLowerCase().includes(searchLower) || false;
      const instructorMatch = e.instructor?.toLowerCase().includes(searchLower) || false;
      const codeMatch = e.courseCode?.toLowerCase().includes(searchLower) || false;
      const idMatch = e.examId?.toLowerCase().includes(searchLower) || false;

      return titleMatch || courseMatch || instructorMatch || codeMatch || idMatch;
    });

    setFilteredExams(filtered);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`))
      return;

    try {
      const response = await examAPI.delete(id);
      if (response && response.success) {
        toast.success("Exam deleted successfully");
        await fetchExams();
        await fetchStats();
      } else {
        toast.error(response?.message || "Failed to delete exam");
      }
    } catch (error) {
      console.error("Failed to delete exam:", error);
      toast.error("Failed to delete exam");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Scheduled: { className: "bg-blue-500/15 text-blue-600 border-0", label: "Scheduled" },
      "In Progress": { className: "bg-yellow-500/15 text-yellow-600 border-0", label: "In Progress" },
      Completed: { className: "bg-green-500/15 text-green-600 border-0", label: "Completed" },
      Cancelled: { className: "bg-red-500/15 text-red-600 border-0", label: "Cancelled" },
      Postponed: { className: "bg-orange-500/15 text-orange-600 border-0", label: "Postponed" },
    };

    const info = statusMap[status] || statusMap["Scheduled"];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

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
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.examId || "N/A"}</span>
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
            <span className="text-xs text-muted-foreground">
              {r.startTime} - {r.endTime}
            </span>
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
          <div className="text-xs text-muted-foreground">{r.building || ""}</div>
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
            onClick={() => r._id && navigate(`/exams/edit/${r._id}`)}
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

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Exams" value={stats?.total || 0} icon={Calendar} tone="brand" />
        <KpiCard label="Scheduled" value={stats?.scheduled || 0} icon={Clock} tone="info" />
        <KpiCard label="In Progress" value={stats?.inProgress || 0} icon={ClipboardCheck} tone="warning" />
        <KpiCard label="Avg GPA" value={stats?.avgGPA || 0} icon={TrendingUp} tone="success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      fontSize: 10,
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
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 10,
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
        <select
          value={offeringFilter}
          onChange={(e) => setOfferingFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white min-w-[220px]"
        >
          <option value="">All offerings</option>
          {offerings.map((o) => (
            <option key={o._id} value={o._id}>
              {getOfferingLabel(o)}
            </option>
          ))}
        </select>
        {(searchQuery || offeringFilter) && (
          <div className="text-sm text-muted-foreground">
            Found {filteredExams.length} of {exams.length} exams
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchExams(offeringFilter || undefined)}>
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading exams...</p>
          </div>
        </div>
      )}

      {!loading && !error && exams.length > 0 && (
        <DataTable
          title="All Exams"
          description={`${filteredExams.length} exams found${searchQuery ? ` (filtered from ${exams.length})` : ""}`}
          data={filteredExams}
          columns={cols}
          searchKeys={["title", "course", "courseCode", "instructor", "examId"] as (keyof Exam)[]}
          pageSize={10}
          addLabel="Add Exam"
          onAdd={() => navigate("/exams/create")}
        />
      )}

      {!loading && !error && exams.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Exams Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no exams in the system yet. Click the "New Exam" button to create your first
            exam.
          </p>
          <Button
            onClick={() => navigate("/exams/create")}
            className="gradient-brand text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Create First Exam
          </Button>
        </div>
      )}
    </>
  );
}

export default ExamsPage;
