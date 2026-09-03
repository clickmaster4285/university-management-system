import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  studentApplicationsAPI,
  type ApplicationStatus,
  type StudentApplication,
} from "@/features/studentApplications";
import { programAPI } from "@/features/programs";
import { campusAPI } from "@/features/campus";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Submitted",
  "Under Review",
  "Shortlisted",
  "Accepted",
  "Rejected",
  "Promoted",
];

const resolveRefLabel = (value: StudentApplication["programId"]) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || value.code || "—";
  return value;
};

export default function ApplicationsPipelinePage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
    promoted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [programs, setPrograms] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ _id: string; name: string }>>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    programId: "",
    campusId: "",
    previousDegree: "",
    previousMarks: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 500 };
      if (search) params.search = search;
      const [listRes, statsRes, programRes, campusRes] = await Promise.all([
        studentApplicationsAPI.list(params),
        studentApplicationsAPI.getStats(),
        programAPI.getAll(),
        campusAPI.getAll(),
      ]);
      setApplications(listRes.data || []);
      setStats(statsRes);
      setPrograms(programRes?.data || programRes || []);
      setCampuses(Array.isArray(campusRes?.data) ? campusRes.data : []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return applications.filter((app) => statusFilter === "all" || app.status === statusFilter);
  }, [applications, statusFilter]);

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.cnic || !form.programId || !form.campusId) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await studentApplicationsAPI.createInternal(form);
      toast.success("Internal application created");
      setShowForm(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        cnic: "",
        programId: "",
        campusId: "",
        previousDegree: "",
        previousMarks: "",
      });
      await loadData();
    } catch {
      toast.error("Failed to create application");
    }
  };

  const columns: Column<StudentApplication>[] = [
    {
      key: "applicationId",
      header: "Application",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.firstName} {row.lastName}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.applicationId}</div>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program",
      cell: (row) => resolveRefLabel(row.programId),
    },
    {
      key: "source",
      header: "Source",
      cell: (row) => <Badge variant="outline">{row.source}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/admissions/${row.applicationId}`)}>
          <Eye className="h-4 w-4" /> Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Applications pipeline
          </h1>
          <p className="text-sm text-muted-foreground">Review public and internal intake applications</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Internal application
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total" value={stats.total} icon={UserPlus} />
        <KpiCard label="Submitted" value={stats.submitted} icon={UserPlus} />
        <KpiCard label="Under review" value={stats.underReview} icon={UserPlus} />
        <KpiCard label="Promoted" value={stats.promoted} icon={UserPlus} />
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <h3 className="font-medium">Quick internal application</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            <div><Label>CNIC</Label><Input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <Label>Program</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                <option value="">Select</option>
                {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Campus</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })}>
                <option value="">Select</option>
                {campuses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={handleCreate}>Create application</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search name, email, CNIC, application ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <select className="h-10 rounded-md border px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

    </div>
  );
}
