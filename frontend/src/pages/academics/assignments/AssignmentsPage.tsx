import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { assignmentAPI, Assignment } from "@/features/assignment";
import { offeringAPI, type CourseOffering } from "@/features/offerings";
import { type Subject } from "@/features/subjects";
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
  BarChart3,
  Award,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [offeringFilter, setOfferingFilter] = useState("");
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchAssignments = async (offeringId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await assignmentAPI.getAll({
        limit: 100,
        ...(offeringId ? { offeringId } : {}),
      });

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
    fetchAssignments(offeringFilter || undefined);
    fetchStats();
    offeringAPI.getAll({ status: 'Active', limit: 500 }).then((res) => {
      if (res?.success) setOfferings(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAssignments(offeringFilter || undefined);
  }, [offeringFilter]);

  const getOfferingLabel = (offering: CourseOffering) => {
    const subject = typeof offering.subjectId === 'object' ? (offering.subjectId as Subject) : null;
    return `${offering.offeringId || ''} — ${subject?.code || ''} ${subject?.name || ''}`.trim();
  };

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
            onClick={() => r._id && navigate(`/assignments/edit/${r._id}`)}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            Found {filteredAssignments.length} of {assignments.length} assignments
          </div>
        )}
      </div>

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
              onClick={() => fetchAssignments(offeringFilter || undefined)}
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading assignments...</p>
          </div>
        </div>
      )}

      {!loading && !error && assignments.length > 0 && (
        <DataTable
          title="All Assignments"
          description={`${filteredAssignments.length} assignments found${searchQuery ? ` (filtered from ${assignments.length})` : ''}`}
          data={filteredAssignments}
          columns={cols}
          searchKeys={["title", "course", "courseCode", "instructor", "assignmentId"] as (keyof Assignment)[]}
          pageSize={10}
          addLabel="Add Assignment"
          onAdd={() => navigate("/assignments/create")}
        />
      )}

      {!loading && !error && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no assignments in the system yet. Click the "New Assignment" button to create your first assignment.
          </p>
          <Button onClick={() => navigate("/assignments/create")} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Create First Assignment
          </Button>
        </div>
      )}
    </>
  );
}

export default AssignmentsPage;
