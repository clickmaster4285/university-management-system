import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { departmentAPI, type Department } from "@/features/departments";
import { campusAPI, type Campus } from "@/features/campus";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { DepartmentViewModal } from "./DepartmentViewModal";
import {
  Building2, Users, BookOpen, Loader2,
  Eye, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";

const getDepartmentRecordId = (dept: Department) => dept._id || dept.departmentId || "";

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [campusFilter, setCampusFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, campusRes, facRes, statsRes] = await Promise.all([
        departmentAPI.getAll(),
        campusAPI.getAll(),
        facultyAPI.getAll(),
        departmentAPI.getStats(),
      ]);
      setDepartments(deptRes?.data || []);
      setCampuses(Array.isArray(campusRes?.data) ? campusRes.data : []);
      setFaculties(Array.isArray(facRes?.data) ? facRes.data : []);
      setStats(statsRes?.data || { total: 0, active: 0, inactive: 0 });
    } catch {
      toast.error("Failed to load departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (statusFilter !== "all" && (d.status || "Active") !== statusFilter) return false;
      if (campusFilter !== "all") {
        const campusId = resolveRefId(d.campusId as string | { _id: string } | null | undefined);
        if (campusId !== campusFilter) return false;
      }
      if (facultyFilter !== "all") {
        const facultyId = resolveRefId(d.facultyId as string | { _id: string } | null | undefined);
        if (facultyId !== facultyFilter) return false;
      }
      return true;
    });
  }, [departments, campusFilter, facultyFilter, statusFilter]);

  const campusFaculties = useMemo(() => {
    if (campusFilter === "all") return faculties;
    return faculties.filter(
      (f) => resolveRefId(f.campusId as string | { _id: string } | null | undefined) === campusFilter
    );
  }, [faculties, campusFilter]);

  const clearFilters = () => {
    setCampusFilter("all");
    setFacultyFilter("all");
    setStatusFilter("all");
  };

  const getCampusName = (campus: Department["campusId"]) => {
    if (!campus) return "—";
    if (typeof campus === "object") return campus.name;
    const found = campuses.find((c) => c._id === campus);
    return found?.name || campus;
  };

  const getFacultyName = (faculty: Department["facultyId"]) => {
    if (!faculty) return "—";
    if (typeof faculty === "object") return faculty.name;
    const found = faculties.find((f) => f._id === faculty);
    return found?.name || faculty;
  };

  const openViewModal = (dept: Department) => {
    setViewingDepartment(dept);
    setIsViewModalOpen(true);
  };

  const goToEdit = (dept: Department) => {
    const id = getDepartmentRecordId(dept);
    if (!id) {
      toast.error("Cannot edit department: missing ID");
      return;
    }
    navigate(`/departments/edit/${id}`);
  };

  const handleDelete = async (dept: Department) => {
    const id = getDepartmentRecordId(dept);
    if (!id) {
      toast.error("Cannot delete department: missing ID");
      return;
    }
    if (!confirm(`Delete "${dept.name}"?`)) return;
    try {
      await departmentAPI.delete(id);
      toast.success("Department deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const columns: Column<Department>[] = [
    { key: "code", header: "Code", cell: (d) => <span className="font-mono font-semibold">{d.code}</span> },
    { key: "name", header: "Name" },
    { key: "campusId", header: "Campus", cell: (d) => getCampusName(d.campusId) },
    { key: "facultyId", header: "Faculty", cell: (d) => getFacultyName(d.facultyId) },
    {
      key: "headId",
      header: "Head",
      cell: (d) => (
        <span>{typeof d.headId === "object" && d.headId ? d.headId.name : "—"}</span>
      ),
    },
    { key: "email", header: "Email", cell: (d) => d.email || "—" },
    {
      key: "status",
      header: "Status",
      cell: (d) => (
        <Badge variant={d.status === "Active" ? "default" : "secondary"}>
          {d.status || "Active"}
        </Badge>
      ),
    },
    {
      key: "_id",
      header: "Actions",
      cell: (d) => (
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => openViewModal(d)} title="View department">
            <Eye className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => goToEdit(d)} title="Edit department">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(d)} title="Delete department">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Departments" value={stats.total} icon={Building2} />
        <KpiCard label="Active" value={stats.active} icon={BookOpen} />
        <KpiCard label="Inactive" value={stats.inactive} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="All Departments"
          description={`${filteredDepartments.length} of ${departments.length} department${departments.length === 1 ? "" : "s"} shown`}
          columns={columns}
          data={filteredDepartments}
          searchKeys={["name", "code"]}
          pageSize={10}
          addLabel="Add department"
          onAdd={() => navigate("/departments/create")}
          filterPanel={(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept-campus-filter">Campus</Label>
                <select
                  id="dept-campus-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={campusFilter}
                  onChange={(e) => {
                    setCampusFilter(e.target.value);
                    setFacultyFilter("all");
                  }}
                >
                  <option value="all">All campuses</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-faculty-filter">Faculty</Label>
                <select
                  id="dept-faculty-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  disabled={campusFilter !== "all" && campusFaculties.length === 0}
                >
                  <option value="all">All faculties</option>
                  {campusFaculties.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-status-filter">Status</Label>
                <select
                  id="dept-status-filter"
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
                  disabled={campusFilter === "all" && facultyFilter === "all" && statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        />
      )}

      <DepartmentViewModal
        isOpen={isViewModalOpen}
        department={viewingDepartment}
        onClose={() => setIsViewModalOpen(false)}
        onEdit={goToEdit}
      />
    </>
  );
}
