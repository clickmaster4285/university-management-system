import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Check, Eye, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { workforceAPI, type LeaveType, type StaffLeave, type StaffLeaveBalance } from "@/features/workforce";
import { getStaffRecordId } from "@/lib/staffUtils";

const LEAVE_TYPES: LeaveType[] = [
  "Annual",
  "Sick",
  "Casual",
  "Maternity",
  "Paternity",
  "Unpaid",
  "Other",
];

const QUOTA_FIELDS = [
  { key: "annualQuota", label: "Annual", type: "Annual" },
  { key: "sickQuota", label: "Sick", type: "Sick" },
  { key: "casualQuota", label: "Casual", type: "Casual" },
  { key: "maternityQuota", label: "Maternity", type: "Maternity" },
  { key: "paternityQuota", label: "Paternity", type: "Paternity" },
] as const;

type QuotaForm = {
  annualQuota: number;
  sickQuota: number;
  casualQuota: number;
  maternityQuota: number;
  paternityQuota: number;
};

const emptyQuotaForm = (): QuotaForm => ({
  annualQuota: 20,
  sickQuota: 10,
  casualQuota: 5,
  maternityQuota: 90,
  paternityQuota: 10,
});

export default function WorkforceLeavePage() {
  const [searchParams] = useSearchParams();
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, onLeaveToday: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    staffMemberId: "",
    type: "Annual" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [leaveBalance, setLeaveBalance] = useState<StaffLeaveBalance | null>(null);
  const [viewingLeave, setViewingLeave] = useState<StaffLeave | null>(null);

  const [quotaStaffId, setQuotaStaffId] = useState("");
  const [quotaYear, setQuotaYear] = useState(new Date().getFullYear());
  const [quotaBalance, setQuotaBalance] = useState<StaffLeaveBalance | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [showQuotaEdit, setShowQuotaEdit] = useState(false);
  const [quotaForm, setQuotaForm] = useState<QuotaForm>(emptyQuotaForm());
  const [savingQuota, setSavingQuota] = useState(false);

  const loadBalance = useCallback(async (staffMemberId: string) => {
    if (!staffMemberId) {
      setLeaveBalance(null);
      return;
    }
    try {
      const balance = await workforceAPI.getLeaveBalance(staffMemberId);
      setLeaveBalance(balance);
    } catch {
      setLeaveBalance(null);
    }
  }, []);

  const loadQuotaBalance = useCallback(async (staffMemberId: string, year: number) => {
    if (!staffMemberId) {
      setQuotaBalance(null);
      return;
    }
    setQuotaLoading(true);
    try {
      const balance = await workforceAPI.getLeaveBalance(staffMemberId, year);
      setQuotaBalance(balance);
      setQuotaForm({
        annualQuota: balance.balances?.find((b) => b.type === "Annual")?.quota ?? 20,
        sickQuota: balance.balances?.find((b) => b.type === "Sick")?.quota ?? 10,
        casualQuota: balance.balances?.find((b) => b.type === "Casual")?.quota ?? 5,
        maternityQuota: balance.balances?.find((b) => b.type === "Maternity")?.quota ?? 90,
        paternityQuota: balance.balances?.find((b) => b.type === "Paternity")?.quota ?? 10,
      });
    } catch {
      setQuotaBalance(null);
      toast.error("Failed to load leave quotas");
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveList, staffRes, leaveStats] = await Promise.all([
        workforceAPI.listLeaves(),
        staffMemberAPI.getAll({ limit: 500 }),
        workforceAPI.getLeaveStats(),
      ]);
      setLeaves(leaveList);
      setStaffMembers(staffRes?.data || []);
      setStats(leaveStats);
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const fromQuery = searchParams.get("staffId");
    if (fromQuery) {
      setQuotaStaffId(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (quotaStaffId) {
      loadQuotaBalance(quotaStaffId, quotaYear);
    } else {
      setQuotaBalance(null);
    }
  }, [quotaStaffId, quotaYear, loadQuotaBalance]);

  const quotaStaffLabel = useMemo(() => {
    const staff = staffMembers.find((s) => getStaffRecordId(s) === quotaStaffId);
    if (!staff) return "";
    return `${staff.firstName} ${staff.lastName} (${staff.staffId})`;
  }, [staffMembers, quotaStaffId]);

  const handleCreate = async () => {
    if (!form.staffMemberId || !form.startDate || !form.endDate) {
      toast.error("Staff, start date, and end date are required");
      return;
    }
    setSaving(true);
    try {
      await workforceAPI.createLeave(form);
      toast.success("Leave request created");
      setShowForm(false);
      setForm({ staffMemberId: "", type: "Annual", startDate: "", endDate: "", reason: "" });
      await loadData();
      if (quotaStaffId === form.staffMemberId) {
        await loadQuotaBalance(quotaStaffId, quotaYear);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create leave";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (leave: StaffLeave, status: "Approved" | "Rejected") => {
    if (!leave._id) return;
    try {
      await workforceAPI.updateLeaveStatus(leave._id, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      await loadData();
      if (quotaStaffId) await loadQuotaBalance(quotaStaffId, quotaYear);
    } catch {
      toast.error("Failed to update leave status");
    }
  };

  const handleSaveQuotas = async () => {
    if (!quotaStaffId) return;
    setSavingQuota(true);
    try {
      const updated = await workforceAPI.updateLeaveBalance(quotaStaffId, {
        year: quotaYear,
        ...quotaForm,
      });
      setQuotaBalance(updated);
      setShowQuotaEdit(false);
      toast.success("Leave quotas updated");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update quotas";
      toast.error(message);
    } finally {
      setSavingQuota(false);
    }
  };

  const columns: Column<StaffLeave>[] = [
    {
      key: "staff",
      header: "Staff",
      cell: (row) => <span className="font-medium">{row.staffName}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => <Badge variant="outline">{row.type}</Badge>,
    },
    {
      key: "dates",
      header: "Dates",
      cell: (row) => (
        <span className="text-sm">
          {row.startDate?.slice(0, 10)} → {row.endDate?.slice(0, 10)} ({row.days}d)
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewingLeave(row)} title="View">
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === "Pending" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleStatus(row, "Approved")} title="Approve">
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleStatus(row, "Rejected")} title="Reject">
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Leave management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Requests, approvals, quotas, and leave linked to workforce schedules.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/workforce">Back to workforce</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <KpiCard label="Pending" value={stats.pending} icon={CalendarDays} tone="warning" />
        <KpiCard label="Approved" value={stats.approved} icon={CalendarDays} tone="success" />
        <KpiCard label="On leave today" value={stats.onLeaveToday} icon={CalendarDays} />
      </div>

      <div className="mb-6 border rounded-lg p-4 space-y-4 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Leave quotas</h2>
            <p className="text-xs text-muted-foreground">
              View and edit annual entitlements per staff member
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!quotaStaffId || !quotaBalance}
            onClick={() => setShowQuotaEdit(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit quotas
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Staff member</Label>
            <select
              value={quotaStaffId}
              onChange={(e) => setQuotaStaffId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select staff to manage quotas</option>
              {staffMembers.map((staff) => (
                <option key={getStaffRecordId(staff)} value={getStaffRecordId(staff)}>
                  {staff.firstName} {staff.lastName} ({staff.staffId})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input
              type="number"
              value={quotaYear}
              onChange={(e) => setQuotaYear(Number(e.target.value) || new Date().getFullYear())}
              min={2020}
              max={2100}
            />
          </div>
        </div>
        {quotaLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : quotaBalance ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Quota</th>
                  <th className="py-2 pr-4 font-medium">Used</th>
                  <th className="py-2 font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {quotaBalance.balances?.map((b) => (
                  <tr key={b.type} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{b.type}</td>
                    <td className="py-2 pr-4">{b.quota}</td>
                    <td className="py-2 pr-4">{b.used}</td>
                    <td className="py-2">
                      <Badge variant="outline">{b.remaining}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a staff member to view quotas.</p>
        )}
      </div>

      {showForm && (
        <div className="mb-6 border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Staff member</Label>
              <select
                value={form.staffMemberId}
                onChange={(e) => {
                  const staffMemberId = e.target.value;
                  setForm((p) => ({ ...p, staffMemberId }));
                  loadBalance(staffMemberId);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select staff</option>
                {staffMembers.map((staff) => (
                  <option key={getStaffRecordId(staff)} value={getStaffRecordId(staff)}>
                    {staff.firstName} {staff.lastName} ({staff.staffId})
                  </option>
                ))}
              </select>
            </div>
            {leaveBalance && (
              <div className="md:col-span-2 flex flex-wrap gap-2 items-end">
                {leaveBalance.balances
                  ?.filter((b) => ["Annual", "Sick", "Casual"].includes(b.type))
                  .map((b) => (
                    <Badge key={b.type} variant="outline">
                      {b.type}: {b.remaining}/{b.quota} left
                    </Badge>
                  ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Leave type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as LeaveType }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Reason</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit request
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
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
          title="Leave requests"
          description="Approve or reject pending requests"
          data={leaves}
          columns={columns}
          searchKeys={["staffName", "type", "status", "reason"]}
          pageSize={10}
          addLabel="New leave request"
          onAdd={() => setShowForm(true)}
        />
      )}

      {viewingLeave && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingLeave(null);
          }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Leave request</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewingLeave(null)}>
                Close
              </Button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Staff</p>
                <p className="font-medium">{viewingLeave.staffName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge variant="outline" className="mt-1">
                    {viewingLeave.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="mt-1">{viewingLeave.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Start</p>
                  <p className="font-medium">{viewingLeave.startDate?.slice(0, 10)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End</p>
                  <p className="font-medium">{viewingLeave.endDate?.slice(0, 10)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Days</p>
                  <p className="font-medium">{viewingLeave.days}</p>
                </div>
              </div>
              {viewingLeave.reason && (
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="mt-1">{viewingLeave.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuotaEdit && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuotaEdit(false);
          }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold">Edit leave quotas</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {quotaStaffLabel || "Staff"} · {quotaYear}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowQuotaEdit(false)}>
                Close
              </Button>
            </div>
            <div className="p-5 space-y-4">
              {QUOTA_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label} quota (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={quotaForm[field.key]}
                    onChange={(e) =>
                      setQuotaForm((p) => ({
                        ...p,
                        [field.key]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                  {quotaBalance && (
                    <p className="text-xs text-muted-foreground">
                      Used: {quotaBalance.balances?.find((b) => b.type === field.type)?.used ?? 0} ·
                      Remaining will recalculate after save
                    </p>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveQuotas} disabled={savingQuota}>
                  {savingQuota ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save quotas
                </Button>
                <Button variant="outline" onClick={() => setShowQuotaEdit(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
