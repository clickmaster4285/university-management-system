import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Eye, Loader2, Pencil, Receipt } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/features/axios";
import { staffMemberAPI, type StaffMember, type StaffPayroll } from "@/features/staffMembers";
import { formatCurrency, getStaffRecordId } from "@/lib/staffUtils";

export default function PayrollPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [recentPayrolls, setRecentPayrolls] = useState<StaffPayroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [staffRes, payrollRes] = await Promise.all([
          staffMemberAPI.getAll({ limit: 500 }),
          api.get("/payroll", { params: { limit: 50 } }),
        ]);
        setStaffMembers(staffRes?.data || []);
        setRecentPayrolls(payrollRes.data?.data || []);
      } catch {
        toast.error("Failed to load payroll data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const withSalary = staffMembers.filter((s) => (s.compensation?.basicSalary || 0) > 0).length;
    const pending = recentPayrolls.filter((p) => p.status !== "Paid").length;
    const paid = recentPayrolls.filter((p) => p.status === "Paid").length;
    return { total: staffMembers.length, withSalary, pending, paid };
  }, [staffMembers, recentPayrolls]);

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
      key: "salary",
      header: "Basic salary",
      cell: (row) => (
        <span className="text-sm">
          {formatCurrency(row.compensation?.basicSalary, row.compensation?.currency)}
        </span>
      ),
    },
    {
      key: "frequency",
      header: "Pay frequency",
      cell: (row) => <span className="text-sm">{row.compensation?.payFrequency || "Monthly"}</span>,
    },
    {
      key: "status",
      header: "Employment",
      cell: (row) => <Badge variant="outline">{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/payroll/${getStaffRecordId(row)}`)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/payroll/${getStaffRecordId(row)}`)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Staff compensation, salary runs, and payment tracking.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KpiCard label="Staff on payroll" value={stats.withSalary} icon={DollarSign} />
        <KpiCard label="Total staff" value={stats.total} icon={Receipt} />
        <KpiCard label="Pending payments" value={stats.pending} icon={Receipt} tone="warning" />
        <KpiCard label="Paid records" value={stats.paid} icon={Receipt} tone="success" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Staff compensation"
          description="Open a staff member to manage salary and payroll history"
          data={staffMembers}
          columns={columns}
          searchKeys={["firstName", "lastName", "staffId", "email"]}
          pageSize={10}
        />
      )}
    </>
  );
}
