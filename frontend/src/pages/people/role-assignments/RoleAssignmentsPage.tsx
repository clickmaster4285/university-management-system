import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleAssignmentAPI, type RoleAssignment } from "@/features/roleAssignments";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { StaffContextHeader } from "@/components/staff/StaffContextHeader";
import { StaffRoleAssignments } from "@/pages/people/staff/StaffRoleAssignments";
import { getStaffRecordId } from "@/lib/staffUtils";

const resolveStaffName = (value: RoleAssignment["staffMemberId"]) => {
  if (!value) return "—";
  if (typeof value === "object") {
    return getStaffDisplayName({
      firstName: value.firstName || "",
      lastName: value.lastName || "",
      fullName: undefined,
    });
  }
  return value;
};

export default function RoleAssignmentsPage() {
  const { staffId } = useParams<{ staffId?: string }>();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (staffId) {
          const [assignmentList, staffData] = await Promise.all([
            roleAssignmentAPI.list({ staffMemberId: staffId }),
            staffMemberAPI.getById(staffId),
          ]);
          setAssignments(assignmentList);
          setStaff(staffData);
        } else {
          const assignmentList = await roleAssignmentAPI.list();
          setAssignments(assignmentList);
        }
      } catch {
        toast.error("Failed to load role assignments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [staffId]);

  if (staffId) {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!staff) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="mb-4">Staff member not found.</p>
          <Button variant="outline" onClick={() => navigate("/role-assignments")}>
            Back to role assignments
          </Button>
        </div>
      );
    }

    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <StaffContextHeader
            staff={staff}
            backTo="/role-assignments"
            backLabel="Back to role assignments"
            title="Role assignments"
          />
          <StaffRoleAssignments staffMemberId={getStaffRecordId(staff)} />
        </CardContent>
      </Card>
    );
  }

  const columns: Column<RoleAssignment>[] = [
    {
      key: "staff",
      header: "Staff member",
      cell: (row) => <span className="text-sm font-medium">{resolveStaffName(row.staffMemberId)}</span>,
    },
    {
      key: "roleType",
      header: "Role",
      cell: (row) => <Badge>{row.roleType}</Badge>,
    },
    {
      key: "scope",
      header: "Scope",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.scopeType}
          {row.scopeId ? ` · ${row.scopeId}` : ""}
        </span>
      ),
    },
    {
      key: "session",
      header: "Session",
      cell: (row) => {
        const session = row.academicSessionId;
        if (!session) return "—";
        if (typeof session === "object") return session.name || session.code || "—";
        return session;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => {
        const id =
          typeof row.staffMemberId === "object"
            ? row.staffMemberId._id
            : row.staffMemberId;
        if (!id) return null;
        return (
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/role-assignments/staff/${id}`}>Open</Link>
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          Role assignments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scoped duties such as HOD, exam controller, and department responsibilities.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="All role assignments"
          description="Academic and operational duties assigned to staff"
          data={assignments}
          columns={columns}
          searchKeys={["roleType", "scopeType", "notes"]}
          pageSize={10}
        />
      )}
    </>
  );
}
