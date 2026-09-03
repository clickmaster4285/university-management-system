import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const statusOptions = ["Active", "Upcoming", "Completed", "Inactive"];

export default function AcademicSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState<{
    total?: number;
    active?: number;
    upcoming?: number;
    completed?: number;
    currentSession?: AcademicSession | null;
  } | null>(null);
  const [viewingSession, setViewingSession] = useState<AcademicSession | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await academicSessionAPI.getAll();
      setSessions(response?.data || []);
    } catch {
      const errorMsg = "Failed to load academic sessions";
      setError(errorMsg);
      toast.error(errorMsg);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await academicSessionAPI.getStats();
      if (response?.data) setStats(response.data);
    } catch {
      console.error("Failed to fetch session stats");
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== "all" && (s.status || "Upcoming") !== statusFilter) return false;
      return true;
    });
  }, [sessions, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await academicSessionAPI.delete(id);
      toast.success(`Session "${name}" deleted`);
      await fetchSessions();
      await fetchStats();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const handleSetCurrent = async (id: string, name: string) => {
    try {
      const response = await academicSessionAPI.setCurrent(id);
      if (response?.success !== false) {
        toast.success(`"${name}" is now the current session`);
        await fetchSessions();
        await fetchStats();
      } else {
        toast.error(response?.message || "Failed to set current session");
      }
    } catch {
      toast.error("Failed to set current session");
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
      <Badge className={`${info.className} flex items-center gap-1 w-fit`}>
        {info.icon}
        {info.label}
      </Badge>
    );
  };

  const getSessionId = (session: AcademicSession) =>
    session.sessionId || session._id?.slice(-8).toUpperCase() || "N/A";

  const cols: Column<AcademicSession>[] = [
    {
      key: "name",
      header: "Session",
      cell: (r) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {r.name}
            {r.isCurrent && (
              <Badge className="bg-blue-500/15 text-blue-600 border-0 text-[10px]">Current</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getSessionId(r)}</span> ·{" "}
            {r.code}
          </div>
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Start",
      cell: (r) => <span>{new Date(r.startDate).toLocaleDateString()}</span>,
    },
    {
      key: "endDate",
      header: "End",
      cell: (r) => <span>{new Date(r.endDate).toLocaleDateString()}</span>,
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
          <Button type="button" size="sm" variant="ghost" onClick={() => setViewingSession(r)} title="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/academic-sessions/edit/${r._id || r.sessionId}`)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {!r.isCurrent && r.status === "Active" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleSetCurrent(r._id || "", r.name)}
              title="Set as current"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(r._id || r.sessionId || "", r.name)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "Active").length;
  const upcomingSessions = sessions.filter((s) => s.status === "Upcoming").length;
  const completedSessions = sessions.filter((s) => s.status === "Completed").length;
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total Sessions" value={stats?.total ?? totalSessions} icon={Calendar} />
        <KpiCard label="Active" value={stats?.active ?? activeSessions} icon={CheckCircle} tone="success" />
        <KpiCard label="Upcoming" value={stats?.upcoming ?? upcomingSessions} icon={Clock} tone="info" />
        <KpiCard label="Completed" value={stats?.completed ?? completedSessions} icon={Check} tone="warning" />
      </div>

      {!currentSession && !loading && sessions.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-amber-900">No current session set</p>
            <p className="text-sm text-amber-800">
              Offerings and batch forms default to the current session. Mark one session as current.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { fetchSessions(); fetchStats(); }}>
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
          title="Academic Sessions"
          description={`${filteredSessions.length} of ${sessions.length} session${sessions.length === 1 ? "" : "s"} shown`}
          data={filteredSessions}
          columns={cols}
          searchKeys={["name", "code"]}
          pageSize={10}
          addLabel="Add session"
          onAdd={() => navigate("/academic-sessions/create")}
          filterPanel={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-status-filter">Status</Label>
                <select
                  id="session-status-filter"
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
                  onClick={() => setStatusFilter("all")}
                  disabled={statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          }
        />
      )}

      {viewingSession && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingSession(null);
          }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {viewingSession.name}
                </h2>
                <p className="text-sm text-muted-foreground">{viewingSession.code}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingSession(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start</p>
                  <p className="font-medium">{new Date(viewingSession.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End</p>
                  <p className="font-medium">{new Date(viewingSession.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingSession.status || "Upcoming")}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Current</p>
                  <p className="font-medium">{viewingSession.isCurrent ? "Yes" : "No"}</p>
                </div>
              </div>
              {viewingSession.description && (
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="text-sm mt-1">{viewingSession.description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingSession(null);
                    navigate(`/academic-sessions/edit/${viewingSession._id || viewingSession.sessionId}`);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => setViewingSession(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p className="mb-3">No academic sessions yet. Create the first session, then add batches.</p>
          <Button asChild>
            <Link to="/academic-sessions/create">Create session</Link>
          </Button>
        </div>
      )}
    </>
  );
}
