import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { batchAPI, type Batch } from "@/features/batches";
import { departmentAPI, type Department } from "@/features/departments";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle,
  Clock,
  Eye,
  GraduationCap,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const statusOptions = ["Active", "Upcoming", "Completed", "Inactive"];

export default function BatchesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total?: number; active?: number; upcoming?: number; completed?: number } | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await batchAPI.getAll({
        departmentId: departmentFilter !== "all" ? departmentFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        admissionSessionId: sessionFilter !== "all" ? sessionFilter : undefined,
      });
      setBatches(response?.data || []);
    } catch {
      const errorMsg = "Failed to load batches";
      setError(errorMsg);
      toast.error(errorMsg);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await batchAPI.getStats();
      if (response?.data) setStats(response.data);
    } catch {
      console.error("Failed to fetch batch stats");
    }
  };

  useEffect(() => {
    const state = location.state as { departmentId?: string; admissionSessionId?: string } | null;
    if (state?.departmentId) {
      setDepartmentFilter(state.departmentId);
    }
    if (state?.admissionSessionId) {
      setSessionFilter(state.admissionSessionId);
    }
  }, [location.key]);

  useEffect(() => {
    fetchBatches();
    fetchStats();
    departmentAPI.getAll().then((res) => setDepartments(res?.data || [])).catch(() => {});
    academicSessionAPI.getAll().then((res) => setSessions(res?.data || [])).catch(() => {});
  }, []);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== "all" && (b.status || "Upcoming") !== statusFilter) return false;
      if (departmentFilter !== "all" && b.departmentId !== departmentFilter) return false;
      if (sessionFilter !== "all") {
        const sessionId = typeof b.admissionSessionId === "object" ? b.admissionSessionId?._id : b.admissionSessionId;
        if (sessionId !== sessionFilter) return false;
      }
      return true;
    });
  }, [batches, departmentFilter, sessionFilter, statusFilter]);

  const clearFilters = () => {
    setDepartmentFilter("all");
    setSessionFilter("all");
    setStatusFilter("all");
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete batch "${code}"?`)) return;
    try {
      await batchAPI.delete(id);
      toast.success(`Batch "${code}" deleted`);
      await fetchBatches();
      await fetchStats();
    } catch {
      toast.error("Failed to delete batch");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
      Active: {
        className: "bg-green-500/15 text-green-600 border-0",
        label: "Active",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Upcoming: {
        className: "bg-blue-500/15 text-blue-600 border-0",
        label: "Upcoming",
        icon: <Clock className="h-3 w-3" />,
      },
      Completed: {
        className: "bg-gray-500/15 text-gray-600 border-0",
        label: "Completed",
        icon: <Check className="h-3 w-3" />,
      },
      Inactive: {
        className: "bg-red-500/15 text-red-600 border-0",
        label: "Inactive",
        icon: <XCircle className="h-3 w-3" />,
      },
    };
    const info = statusMap[status] || statusMap.Upcoming;
    return (
      <Badge className={`${info.className} flex items-center gap-1`}>
        {info.icon}
        {info.label}
      </Badge>
    );
  };

  const getBatchId = (batch: Batch) =>
    batch.batchId || batch._id?.slice(-8).toUpperCase() || "N/A";

  const cols: Column<Batch>[] = [
    {
      key: "code",
      header: "Batch",
      cell: (r) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {r.code}
            <Badge variant="outline" className="text-[10px]">
              {r.year}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getBatchId(r)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.department}</span>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.program}</span>
        </div>
      ),
    },
    {
      key: "admissionSession",
      header: "Admission",
      cell: (r) => (
        <div>
          <div className="text-sm">{r.admissionSession}</div>
          <div className="text-xs text-muted-foreground">{r.admissionSemester}</div>
        </div>
      ),
    },
    {
      key: "expectedGraduation",
      header: "Expected Graduation",
      cell: (r) => <span>{r.expectedGraduation}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status || "Upcoming"),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setViewingBatch(r)}
            title="View batch"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/batches/edit/${r._id || r.batchId}`)}
            title="Edit batch"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(r._id || r.batchId || "", r.code)}
            title="Delete batch"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === "Active").length;
  const upcomingBatches = batches.filter((b) => b.status === "Upcoming").length;
  const completedBatches = batches.filter((b) => b.status === "Completed").length;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total Batches" value={stats?.total ?? totalBatches} icon={Users} />
        <KpiCard label="Active" value={stats?.active ?? activeBatches} icon={CheckCircle} tone="success" />
        <KpiCard label="Upcoming" value={stats?.upcoming ?? upcomingBatches} icon={Clock} tone="info" />
        <KpiCard label="Completed" value={stats?.completed ?? completedBatches} icon={Check} tone="warning" />
      </div>

      {sessions.length === 0 && !loading && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-amber-900">Create a session first</p>
            <p className="text-sm text-amber-800">
              Batches need an admission session. Set up academic sessions before batches.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 bg-white" asChild>
            <Link to="/academic-sessions">Go to Sessions</Link>
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                fetchBatches();
                fetchStats();
              }}
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="All Batches"
          description={`${filteredBatches.length} of ${batches.length} batch${batches.length === 1 ? "" : "es"} shown`}
          data={filteredBatches}
          columns={cols}
          searchKeys={["code", "department", "program", "admissionSession"]}
          pageSize={10}
          addLabel="Add batch"
          onAdd={() => navigate("/batches/create")}
          filterPanel={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-dept-filter">Department</Label>
                <select
                  id="batch-dept-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-session-filter">Admission Session</Label>
                <select
                  id="batch-session-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                >
                  <option value="all">All sessions</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-status-filter">Status</Label>
                <select
                  id="batch-status-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setDepartmentFilter("all");
                    setSessionFilter("all");
                    setStatusFilter("all");
                  }}
                  disabled={departmentFilter === "all" && sessionFilter === "all" && statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          }
        />
      )}

      {viewingBatch && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingBatch(null);
          }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Batch Details
                </h2>
                <p className="text-sm text-muted-foreground">{viewingBatch.code}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingBatch(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Batch Code</Label>
                  <p className="font-medium">{viewingBatch.code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Intake Year</Label>
                  <p className="font-medium">{viewingBatch.year}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{viewingBatch.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Program</Label>
                  <p className="font-medium">{viewingBatch.program}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <UserPlus className="h-4 w-4" />
                  Admission
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Session</Label>
                    <p className="font-medium">{viewingBatch.admissionSession}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Term</Label>
                    <p className="font-medium">{viewingBatch.admissionSemester}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expected graduation</Label>
                    <p className="font-medium">{viewingBatch.expectedGraduation}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(viewingBatch.status || "Upcoming")}</div>
                  </div>
                </div>
              </div>
              {viewingBatch.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{viewingBatch.description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingBatch(null);
                    navigate(`/batches/edit/${viewingBatch._id || viewingBatch.batchId}`);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => setViewingBatch(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
