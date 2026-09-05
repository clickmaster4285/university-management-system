import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { campusAPI, type Campus } from "@/features/campus";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Users, BookOpen, Loader2, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

const getFacultyId = (faculty: Faculty) => faculty._id || faculty.facultyId || "";

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};


export default function FacultiesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [campusFilter, setCampusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, campRes, staffRes] = await Promise.all([
        facultyAPI.getAll(),
        campusAPI.getAll(),
        staffMemberAPI.listAcademic(),
      ]);
      setFaculties(facRes?.data || []);
      setCampuses(Array.isArray(campRes?.data) ? campRes.data : []);
      setStaffMembers(staffRes);
      const facStats = await facultyAPI.getStats();
      setStats(facStats?.data || { total: 0, active: 0, inactive: 0 });
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const state = location.state as { campusId?: string } | null;
    if (state?.campusId) {
      setCampusFilter(state.campusId);
    }
  }, [location.key]);

  useEffect(() => { fetchData(); }, []);

  const filteredFaculties = useMemo(() => {
    return faculties.filter((f) => {
      if (statusFilter !== "all" && (f.status || "Active") !== statusFilter) return false;
      if (campusFilter !== "all") {
        const campusId = resolveRefId(f.campusId as string | { _id: string } | null | undefined);
        if (campusId !== campusFilter) return false;
      }
      return true;
    });
  }, [faculties, campusFilter, statusFilter]);

  const clearFilters = () => {
    setCampusFilter("all");
    setStatusFilter("all");
  };

  const getCampusName = (campus: Faculty["campusId"]) => {
    if (!campus) return "—";
    if (typeof campus === "object") return campus.name;
    const found = campuses.find(c => c._id === campus);
    return found?.name || campus;
  };

  const getHeadName = (head: Faculty["headId"]) => {
    if (!head) return "—";
    if (typeof head === "object") {
      return getStaffDisplayName({
        firstName: (head as { firstName?: string }).firstName || "",
        lastName: (head as { lastName?: string }).lastName || "",
        fullName: (head as { name?: string }).name,
      });
    }
    const found = staffMembers.find((member) => member._id === head);
    return found ? getStaffDisplayName(found) : head;
  };

  const handleDelete = async (faculty: Faculty) => {
    const id = getFacultyId(faculty);
    if (!id) {
      toast.error("Cannot delete faculty: missing ID");
      return;
    }
    if (!confirm("Delete this faculty? Departments under it will be unaffected.")) return;
    try {
      await facultyAPI.delete(id);
      toast.success("Faculty deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const columns: Column<Faculty>[] = [
    { key: "code", header: "Code", cell: (f) => <span className="font-mono font-semibold">{f.code}</span> },
    { key: "name", header: "Name" },
    { key: "campusId", header: "Campus", cell: (f) => getCampusName(f.campusId) },
    { key: "headId", header: "Head", cell: (f) => getHeadName(f.headId) },
    { key: "email", header: "Email", cell: (f) => f.email || "—" },
    {
      key: "status", header: "Status",
      cell: (f) => <Badge variant={f.status === "Active" ? "default" : "secondary"}>{f.status || "Active"}</Badge>
    },
    {
      key: "_id", header: "Actions",
      cell: (f) => (
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/faculties/detail/${getFacultyId(f)}`)}
            title="View faculty"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); navigate(`/faculties/edit/${getFacultyId(f)}`); }}
            title="Edit faculty"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(f)} title="Delete faculty">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Faculties" value={stats.total} icon={Building2} />
        <KpiCard label="Active" value={stats.active} icon={BookOpen} />
        <KpiCard label="Inactive" value={stats.inactive} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          title="All Faculties"
          description={`${filteredFaculties.length} of ${faculties.length} facult${faculties.length === 1 ? "y" : "ies"} shown`}
          columns={columns}
          data={filteredFaculties}
          searchKeys={["name", "code"]}
          addLabel="Create Faculty"
          onAdd={() => navigate("/faculties/create")}
          filterPanel={(
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty-campus-filter">Campus</Label>
                <select
                  id="faculty-campus-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                >
                  <option value="all">All campuses</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-status-filter">Status</Label>
                <select
                  id="faculty-status-filter"
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
                  disabled={campusFilter === "all" && statusFilter === "all"}
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
