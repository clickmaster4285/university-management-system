import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { programAPI, type Program } from "@/features/programs";
import { departmentAPI, type Department } from "@/features/departments";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEGREE_LEVELS } from "./ProgramForm";
import { Layers, BookOpen, Users, Loader2, Pencil, Trash2, ListTree, Receipt, Eye, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const getProgramRecordId = (program: Program) => program._id || program.programId || "";

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

export default function ProgramsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [viewingProgramDetail, setViewingProgramDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, deptRes, statsRes] = await Promise.all([
        programAPI.getAll({ limit: 500 }),
        departmentAPI.getAll(),
        programAPI.getStats(),
      ]);
      setPrograms(progRes?.data || []);
      setDepartments(deptRes?.data || []);
      setStats(statsRes?.data || { total: 0, active: 0, inactive: 0 });
    } catch {
      toast.error("Failed to load programs");
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const state = location.state as { departmentId?: string } | null;
    if (state?.departmentId) {
      setDepartmentFilter(state.departmentId);
    }
  }, [location.key]);

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (statusFilter !== "all" && (p.status || "Active") !== statusFilter) return false;
      if (degreeFilter !== "all" && p.degreeLevel !== degreeFilter) return false;
      if (departmentFilter !== "all") {
        const deptId = resolveRefId(p.departmentId as string | { _id: string } | null | undefined);
        if (deptId !== departmentFilter) return false;
      }
      return true;
    });
  }, [programs, departmentFilter, degreeFilter, statusFilter]);

  const clearFilters = () => {
    setDepartmentFilter("all");
    setDegreeFilter("all");
    setStatusFilter("all");
  };

  const getDeptName = (dept: Program["departmentId"]) => {
    if (!dept) return "—";
    if (typeof dept === "object") return dept.name;
    const found = departments.find((d) => d._id === dept);
    return found?.name || dept;
  };

  const openViewProgram = async (p: Program) => {
    const id = getProgramRecordId(p);
    setViewingProgram(p);
    if (!id) {
      setViewingProgramDetail(p);
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await programAPI.getById(id);
      setViewingProgramDetail(res?.data || p);
    } catch {
      setViewingProgramDetail(p);
    } finally {
      setLoadingDetail(false);
    }
  };

  const goToEdit = (program: Program) => {
    const id = getProgramRecordId(program);
    if (!id) {
      toast.error("Cannot edit program: missing ID");
      return;
    }
    navigate(`/programs/edit/${id}`);
  };

  const goToCurriculum = (program: Program) => {
    const id = getProgramRecordId(program);
    if (!id) {
      toast.error("Cannot open curriculum: missing ID");
      return;
    }
    navigate(`/programs/${id}/curriculum`);
  };

  const goToSemesterFees = (program: Program) => {
    const pid = getProgramRecordId(program);
    if (!pid) {
      toast.error("Cannot open semester fees: missing ID");
      return;
    }
    navigate(`/programs/${pid}/semester-fees`);
  };

  const handleDelete = async (program: Program) => {
    const id = getProgramRecordId(program);
    if (!id) {
      toast.error("Cannot delete program: missing ID");
      return;
    }
    if (!confirm(`Delete "${program.name}"?`)) return;
    try {
      await programAPI.delete(id);
      toast.success("Program deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const columns: Column<Program>[] = [
    { key: "code", header: "Code", cell: (p) => <span className="font-mono font-semibold">{p.code}</span> },
    { key: "name", header: "Name" },
    { key: "departmentId", header: "Department", cell: (p) => getDeptName(p.departmentId) },
    { key: "degreeLevel", header: "Degree", cell: (p) => <Badge variant="outline">{p.degreeLevel}</Badge> },
    { key: "duration", header: "Duration", cell: (p) => `${p.duration} sem` },
    { key: "totalCredits", header: "Credits", cell: (p) => p.totalCredits || 0 },
    {
      key: "status",
      header: "Status",
      cell: (p) => (
        <Badge variant={p.status === "Active" ? "default" : "secondary"}>
          {p.status || "Active"}
        </Badge>
      ),
    },
    {
      key: "_id",
      header: "Actions",
      cell: (p) => (
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => openViewProgram(p)} title="View program">
            <Eye className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => goToCurriculum(p)} title="Manage curriculum">
            <ListTree className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => goToSemesterFees(p)} title="Semester fees">
            <Receipt className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => goToEdit(p)} title="Edit program">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(p)} title="Delete program">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Programs" value={stats.total} icon={Layers} />
        <KpiCard label="Active" value={stats.active} icon={BookOpen} />
        <KpiCard label="Inactive" value={stats.inactive} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="All Programs"
          description={`${filteredPrograms.length} of ${programs.length} program${programs.length === 1 ? "" : "s"} shown`}
          columns={columns}
          data={filteredPrograms}
          searchKeys={["name", "code"]}
          pageSize={10}
          addLabel="Add program"
          onAdd={() => navigate("/programs/create")}
          filterPanel={(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-dept-filter">Department</Label>
                <select
                  id="program-dept-filter"
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
                <Label htmlFor="program-degree-filter">Degree Level</Label>
                <select
                  id="program-degree-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={degreeFilter}
                  onChange={(e) => setDegreeFilter(e.target.value)}
                >
                  <option value="all">All degrees</option>
                  {DEGREE_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-status-filter">Status</Label>
                <select
                  id="program-status-filter"
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
                  disabled={departmentFilter === "all" && degreeFilter === "all" && statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        />
      )}

      {viewingProgram && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setViewingProgram(null); setViewingProgramDetail(null); } }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-xl font-bold">{viewingProgram.name}</h2>
                <p className="text-sm text-muted-foreground font-mono">{viewingProgram.code}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setViewingProgram(null); setViewingProgramDetail(null); }}>Close</Button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{getDeptName(viewingProgram.departmentId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Degree Level</p>
                  <Badge variant="outline">{viewingProgram.degreeLevel}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{viewingProgram.duration} semesters</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Credits</p>
                  <p className="font-medium">{viewingProgram.totalCredits || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={viewingProgram.status === "Active" ? "default" : "secondary"}>
                    {viewingProgram.status || "Active"}
                  </Badge>
                </div>
              </div>
              {viewingProgram.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="mt-1">{viewingProgram.description}</p>
                </div>
              )}
              {viewingProgramDetail?.stats && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1.5 mb-2">
                    <BarChart3 className="h-3.5 w-3.5" /> Statistics
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Batches", value: viewingProgramDetail.stats.totalBatches },
                      { label: "Offerings", value: viewingProgramDetail.stats.totalOfferings },
                      { label: "Enrolled Students", value: viewingProgramDetail.stats.totalEnrolledStudents },
                      { label: "Curriculum Entries", value: viewingProgramDetail.stats.totalCurriculumEntries },
                      { label: "Subjects", value: viewingProgramDetail.stats.totalSubjects },
                    ].map((item) => (
                      <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{item.value ?? 0}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setViewingProgram(null); setViewingProgramDetail(null); }}>Close</Button>
                <Button onClick={() => { goToEdit(viewingProgram); setViewingProgram(null); setViewingProgramDetail(null); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Program
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
