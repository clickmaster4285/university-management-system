import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { subjectAPI, type Subject } from "@/features/subjects";
import { departmentAPI, type Department } from "@/features/departments";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookOpen, Layers, Users, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const getSubjectRecordId = (subject: Subject) => subject._id || subject.subjectId || "";

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectRes, deptRes, statsRes] = await Promise.all([
        subjectAPI.getAll({ limit: 500 }),
        departmentAPI.getAll(),
        subjectAPI.getStats(),
      ]);
      setSubjects(subjectRes?.data || []);
      setDepartments(deptRes?.data || []);
      setStats(statsRes?.data || { total: 0, active: 0, inactive: 0 });
    } catch {
      toast.error("Failed to load subjects");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (statusFilter !== "all" && (s.status || "Active") !== statusFilter) return false;
      if (departmentFilter !== "all") {
        const deptId = resolveRefId(s.departmentId as string | { _id: string } | null | undefined);
        if (deptId !== departmentFilter) return false;
      }
      return true;
    });
  }, [subjects, departmentFilter, statusFilter]);

  const clearFilters = () => {
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  const getDeptName = (dept: Subject["departmentId"]) => {
    if (!dept) return "—";
    if (typeof dept === "object") return dept.name;
    const found = departments.find((d) => d._id === dept);
    return found?.name || dept;
  };

  const formatPrerequisites = (subject: Subject) => {
    const prereqs = subject.prerequisiteSubjectIds || [];
    if (prereqs.length === 0) return "—";
    return prereqs
      .map((p) => (typeof p === "object" ? p.code : p))
      .join(", ");
  };

  const goToEdit = (subject: Subject) => {
    const id = getSubjectRecordId(subject);
    if (!id) {
      toast.error("Cannot edit subject: missing ID");
      return;
    }
    navigate(`/subjects/edit/${id}`);
  };

  const handleDelete = async (subject: Subject) => {
    const id = getSubjectRecordId(subject);
    if (!id) {
      toast.error("Cannot delete subject: missing ID");
      return;
    }
    if (!confirm(`Delete "${subject.name}"?`)) return;
    try {
      await subjectAPI.delete(id);
      toast.success("Subject deleted");
      fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Delete failed");
    }
  };

  const columns: Column<Subject>[] = [
    { key: "code", header: "Code", cell: (s) => <span className="font-mono font-semibold">{s.code}</span> },
    { key: "name", header: "Name" },
    { key: "departmentId", header: "Department", cell: (s) => getDeptName(s.departmentId) },
    { key: "credits", header: "Credits" },
    {
      key: "prerequisiteSubjectIds",
      header: "Prerequisites",
      cell: (s) => <span className="text-sm text-muted-foreground">{formatPrerequisites(s)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => (
        <Badge variant={s.status === "Active" ? "default" : "secondary"}>
          {s.status || "Active"}
        </Badge>
      ),
    },
    {
      key: "_id",
      header: "Actions",
      cell: (s) => (
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => goToEdit(s)} title="Edit subject">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(s)} title="Delete subject">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Subjects" value={stats.total} icon={BookOpen} />
        <KpiCard label="Active" value={stats.active} icon={Layers} />
        <KpiCard label="Inactive" value={stats.inactive} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Subject Catalog"
          description={`${filteredSubjects.length} of ${subjects.length} subject${subjects.length === 1 ? "" : "s"} shown`}
          columns={columns}
          data={filteredSubjects}
          searchKeys={["name", "code"]}
          pageSize={10}
          addLabel="Add subject"
          onAdd={() => navigate("/subjects/create")}
          filterPanel={(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject-dept-filter">Department</Label>
                <select
                  id="subject-dept-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-status-filter">Status</Label>
                <select
                  id="subject-status-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={clearFilters}
                  disabled={departmentFilter === "all" && statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
