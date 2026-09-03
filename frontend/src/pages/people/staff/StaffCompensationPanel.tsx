import { useState } from "react";
import { DollarSign, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  staffMemberAPI,
  type StaffCompensation,
  type StaffMember,
} from "@/features/staffMembers";

interface StaffCompensationPanelProps {
  staff: StaffMember;
  onUpdated: (staff: StaffMember) => void;
}

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

const emptyCompensation = (): StaffCompensation => ({
  basicSalary: 0,
  allowances: 0,
  currency: "PKR",
  payFrequency: "Monthly",
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  effectiveFrom: "",
});

export function StaffCompensationPanel({ staff, onUpdated }: StaffCompensationPanelProps) {
  const [compensation, setCompensation] = useState<StaffCompensation>({
    ...emptyCompensation(),
    ...staff.compensation,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof StaffCompensation, value: string | number) => {
    setCompensation((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await staffMemberAPI.update(getStaffRecordId(staff), { compensation });
      toast.success("Compensation details saved");
      onUpdated(updated);
    } catch {
      toast.error("Failed to save compensation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Salary & bank details
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Base compensation used for payroll calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Basic salary</Label>
          <Input
            type="number"
            min={0}
            value={compensation.basicSalary ?? 0}
            onChange={(e) => handleChange("basicSalary", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Allowances</Label>
          <Input
            type="number"
            min={0}
            value={compensation.allowances ?? 0}
            onChange={(e) => handleChange("allowances", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input
            value={compensation.currency || "PKR"}
            onChange={(e) => handleChange("currency", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Pay frequency</Label>
          <select
            value={compensation.payFrequency || "Monthly"}
            onChange={(e) => handleChange("payFrequency", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="Monthly">Monthly</option>
            <option value="Bi-weekly">Bi-weekly</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Effective from</Label>
          <Input
            type="date"
            value={compensation.effectiveFrom?.slice(0, 10) || ""}
            onChange={(e) => handleChange("effectiveFrom", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bank name</Label>
          <Input
            value={compensation.bankName || ""}
            onChange={(e) => handleChange("bankName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Account title</Label>
          <Input
            value={compensation.accountTitle || ""}
            onChange={(e) => handleChange("accountTitle", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Account number</Label>
          <Input
            value={compensation.accountNumber || ""}
            onChange={(e) => handleChange("accountNumber", e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>IBAN</Label>
          <Input
            value={compensation.iban || ""}
            onChange={(e) => handleChange("iban", e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save compensation
      </Button>
    </div>
  );
}

export default StaffCompensationPanel;
