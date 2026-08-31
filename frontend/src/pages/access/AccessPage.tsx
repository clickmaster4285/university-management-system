import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Pencil, Shield, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { getStaffRecordId } from "@/lib/staffUtils";

export default function AccessPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await staffMemberAPI.getAll({ limit: 500 });
        setStaffMembers(res?.data || []);
      } catch {
        toast.error("Failed to load portal access data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const withLogin = staffMembers.filter((s) => s.userId).length;
    return {
      total: staffMembers.length,
      withLogin,
      withoutLogin: staffMembers.length - withLogin,
    };
  }, [staffMembers]);

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff member",
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      key: "login",
      header: "Login",
      cell: (row) =>
        row.userId ? (
          <Badge className="bg-green-500/15 text-green-700 border-0">Enabled</Badge>
        ) : (
          <Badge variant="outline">Disabled</Badge>
        ),
    },
    {
      key: "role",
      header: "Platform role",
      cell: (row) => {
        const user = typeof row.userId === "object" ? row.userId : null;
        return <span className="text-sm">{user?.primaryRole || "—"}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/access/${getStaffRecordId(row)}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Portal access</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable logins and assign roles to individual staff members.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <KpiCard label="Total staff" value={stats.total} icon={Shield} />
        <KpiCard label="With login" value={stats.withLogin} icon={UserCheck} tone="success" />
        <KpiCard label="No login" value={stats.withoutLogin} icon={Shield} tone="warning" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Staff portal access"
          description="Configure login and permissions per staff member"
          data={staffMembers}
          columns={columns}
          searchKeys={["firstName", "lastName", "email", "staffId"]}
          pageSize={10}
        />
      )}
    </>
  );
}
