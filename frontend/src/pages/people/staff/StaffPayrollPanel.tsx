import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { staffMemberAPI, type StaffMember, type StaffPayroll } from "@/features/staffMembers";

interface StaffPayrollPanelProps {
  staff: StaffMember;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

export function StaffPayrollPanel({ staff }: StaffPayrollPanelProps) {
  const [payrolls, setPayrolls] = useState<StaffPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    baseSalary: staff.compensation?.basicSalary || 0,
    allowances: staff.compensation?.allowances || 0,
    bonuses: 0,
    tax: 0,
    insurance: 0,
    other: 0,
    status: "Draft" as StaffPayroll["status"],
  });

  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffMemberAPI.getPayrolls(getStaffRecordId(staff));
      setPayrolls(data);
    } catch {
      toast.error("Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  }, [staff]);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await staffMemberAPI.createPayroll(getStaffRecordId(staff), {
        month: form.month,
        year: form.year,
        baseSalary: form.baseSalary,
        allowances: form.allowances,
        bonuses: form.bonuses,
        deductions: {
          tax: form.tax,
          insurance: form.insurance,
          other: form.other,
        },
        status: form.status,
      });
      toast.success("Payroll record created");
      setShowForm(false);
      await loadPayrolls();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create payroll";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (record: StaffPayroll) => {
    if (!record._id) return;
    try {
      await staffMemberAPI.updatePayroll(getStaffRecordId(staff), record._id, {
        status: "Paid",
        paymentDate: new Date().toISOString(),
      });
      toast.success("Marked as paid");
      await loadPayrolls();
    } catch {
      toast.error("Failed to update payroll");
    }
  };

  const handleDelete = async (record: StaffPayroll) => {
    if (!record._id) return;
    try {
      await staffMemberAPI.deletePayroll(getStaffRecordId(staff), record._id);
      toast.success("Payroll record deleted");
      await loadPayrolls();
    } catch {
      toast.error("Failed to delete payroll");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Payroll history
          </h3>
          <p className="text-sm text-muted-foreground">Track monthly salary payments.</p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" />
          Add payroll
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <select
                value={form.month}
                onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Base salary</Label>
              <Input
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm((p) => ({ ...p, baseSalary: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Allowances</Label>
              <Input
                type="number"
                value={form.allowances}
                onChange={(e) => setForm((p) => ({ ...p, allowances: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bonuses</Label>
              <Input
                type="number"
                value={form.bonuses}
                onChange={(e) => setForm((p) => ({ ...p, bonuses: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax deduction</Label>
              <Input
                type="number"
                value={form.tax}
                onChange={(e) => setForm((p) => ({ ...p, tax: Number(e.target.value) }))}
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create record
          </Button>
        </div>
      )}

      {payrolls.length === 0 ? (
        <p className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
          No payroll records yet.
        </p>
      ) : (
        <div className="space-y-2">
          {payrolls.map((record) => (
            <div
              key={record._id}
              className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
            >
              <div>
                <p className="font-medium">
                  {record.month} {record.year}
                </p>
                <p className="text-sm text-muted-foreground">
                  Net: {record.netPay?.toLocaleString()} · Base: {record.baseSalary?.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={record.status === "Paid" ? "default" : "secondary"}>
                  {record.status}
                </Badge>
                {record.status !== "Paid" && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkPaid(record)}>
                    Mark paid
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(record)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffPayrollPanel;
