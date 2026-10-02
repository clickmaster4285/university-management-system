import { useState } from "react";
import { Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  staffMemberAPI,
  WEEKDAYS,
  defaultWorkSchedule,
  type StaffMember,
  type WorkScheduleDay,
} from "@/features/staffMembers";

interface StaffWorkSchedulePanelProps {
  staff: StaffMember;
  onUpdated: (staff: StaffMember) => void;
}

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

export function StaffWorkSchedulePanel({ staff, onUpdated }: StaffWorkSchedulePanelProps) {
  const [schedule, setSchedule] = useState<WorkScheduleDay[]>(
    staff.workSchedule?.length ? staff.workSchedule : defaultWorkSchedule()
  );
  const [saving, setSaving] = useState(false);

  const updateDay = (day: string, patch: Partial<WorkScheduleDay>) => {
    setSchedule((prev) =>
      prev.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await staffMemberAPI.update(getStaffRecordId(staff), {
        workSchedule: schedule,
      });
      toast.success("Work schedule saved");
      onUpdated(updated);
    } catch {
      toast.error("Failed to save work schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Working hours
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Set individual working days and timings for this staff member.
        </p>
      </div>

      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const entry = schedule.find((s) => s.day === day) || {
            day,
            isWorkingDay: false,
            startTime: "09:00",
            endTime: "17:00",
          };
          return (
            <div
              key={day}
              className="grid grid-cols-1 md:grid-cols-[140px_120px_1fr_1fr] gap-3 items-center border rounded-lg p-3"
            >
              <div className="font-medium">{day}</div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={entry.isWorkingDay}
                  onCheckedChange={(checked) => updateDay(day, { isWorkingDay: checked })}
                />
                <Label className="text-sm">{entry.isWorkingDay ? "Working" : "Off"}</Label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input
                  type="time"
                  value={entry.startTime}
                  disabled={!entry.isWorkingDay}
                  onChange={(e) => updateDay(day, { startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input
                  type="time"
                  value={entry.endTime}
                  disabled={!entry.isWorkingDay}
                  onChange={(e) => updateDay(day, { endTime: e.target.value })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save schedule
      </Button>
    </div>
  );
}

export default StaffWorkSchedulePanel;
