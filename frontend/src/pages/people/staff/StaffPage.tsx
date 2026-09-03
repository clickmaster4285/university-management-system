import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { departmentAPI, type Department } from "@/features/departments";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { Briefcase, Eye, GraduationCap, Loader2, Pencil, Trash2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

const resolveRefId = (value: string | { _id: string; name?: string; code?: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const resolveRefLabel = (
  value: string | { _id: string; name?: string; code?: string } | null | undefined
) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || value.code || "—";
  return value;
};

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

export default function StaffPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, academic: 0, withLogin: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, deptRes, statsRes] = await Promise.all([
        staffMemberAPI.getAll({ limit: 500 }),
        departmentAPI.getAll(),
        staffMemberAPI.getStats(),
      ]);
      setStaffMembers(staffRes?.data || []);
      setDepartments(deptRes?.data || []);
      setStats(statsRes || { total: 0, active: 0, academic: 0, withLogin: 0 });
    } catch {
      toast.error("Failed to load staff");
      setStaffMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffMembers.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      if (typeFilter === "academic" && !member.isAcademic) return false;
      if (typeFilter === "non-academic" && member.isAcademic) return false;
      if (departmentFilter !== "all") {
        const hasDept = member.employments?.some(
          (employment) => resolveRefId(employment.departmentId) === departmentFilter
        );
        if (!hasDept) return false;
      }
      return true;
    });
  }, [staffMembers, statusFilter, typeFilter, departmentFilter]);

  const handleDelete = async (staff: StaffMember) => {
    const id = getStaffRecordId(staff);
    const name = `${staff.firstName} ${staff.lastName}`;
    if (!id || !confirm(`Delete staff record for ${name}?`)) return;
    try {
      await staffMemberAPI.delete(id);
      toast.success(`${name} deleted`);
      fetchData();
    } catch {
      toast.error("Failed to delete staff member");
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff member",
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{row.staffId}</div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "department",
      header: "Department",
      cell: (row) => {
        const primary =
          row.employments?.find((e) => e.isPrimary) || row.employments?.[0];
        return (
          <div>
            <div>{resolveRefLabel(primary?.departmentId)}</div>
            <div className="text-xs text-muted-foreground">{primary?.designation}</div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant={row.isAcademic ? "default" : "secondary"}>
          {row.isAcademic ? "Academic" : "Non-academic"}
        </Badge>
      ),
    },
    {
      key: "login",
      header: "Login",
      cell: (row) =>
        row.userId ? (
          <Badge className="bg-green-500/15 text-green-700 border-0">Enabled</Badge>
        ) : (
          <Badge variant="outline">No login</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant="outline">{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/staff/${getStaffRecordId(row)}`)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/staff/${getStaffRecordId(row)}`)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total staff" value={stats.total} icon={Users} />
        <KpiCard label="Active" value={stats.active} icon={UserCheck} tone="success" />
        <KpiCard label="Academic" value={stats.academic} icon={GraduationCap} tone="info" />
        <KpiCard label="With login" value={stats.withLogin} icon={Briefcase} tone="warning" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Staff directory"
          description="Who works here — open a profile to manage employment and personal details"
          data={filteredStaff}
          columns={columns}
          searchKeys={["firstName", "lastName", "email", "staffId"]}
          pageSize={10}
          addLabel="Add staff"
          onAdd={() => navigate("/staff/create")}
          filterPanel={
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="academic">Academic</option>
                  <option value="non-academic">Non-academic</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.departmentId} value={dept._id || dept.departmentId}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        />
      )}
    </>
  );
}
