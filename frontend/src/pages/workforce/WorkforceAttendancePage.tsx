import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { workforceAPI, type StaffAttendanceRecord } from "@/features/workforce";
import { getStaffRecordId } from "@/lib/staffUtils";

const statusTone = (status: string) => {
  switch (status) {
    case "Present":
      return "default";
    case "Late":
      return "secondary";
    case "Leave":
      return "outline";
    case "Absent":
      return "destructive";
    default:
      return "outline";
  }
};

export default function WorkforceAttendancePage() {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    offDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({
    staffMemberId: "",
    checkInTime: "09:00",
    checkOutTime: "17:00",
    remarks: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attendanceList, staffRes, attendanceStats] = await Promise.all([
        workforceAPI.listAttendance({ date }),
        staffMemberAPI.getAll({ limit: 500, status: "Active" }),
        workforceAPI.getAttendanceStats(date),
      ]);
      setRecords(attendanceList);
      setStaffMembers(staffRes?.data || []);
      setStats(attendanceStats);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMark = async () => {
    if (!form.staffMemberId) {
      toast.error("Select a staff member");
      return;
    }
    setSaving(true);
    try {
      await workforceAPI.markAttendance({
        staffMemberId: form.staffMemberId,
        date,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        remarks: form.remarks,
      });
      toast.success("Attendance recorded");
      setForm((p) => ({ ...p, staffMemberId: "", remarks: "" }));
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to mark attendance";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkMark = async () => {
    setBulkSaving(true);
    try {
      await workforceAPI.bulkMarkAttendance({
        date,
        markAbsentForUnmarked: true,
      });
      toast.success("Bulk attendance saved — unmarked staff marked absent/off-day/leave");
      await loadData();
    } catch {
      toast.error("Failed to bulk mark attendance");
    } finally {
      setBulkSaving(false);
    }
  };

  const columns: Column<StaffAttendanceRecord>[] = [
    { key: "staff", header: "Staff", cell: (row) => row.staffName },
    {
      key: "schedule",
      header: "Scheduled",
      cell: (row) =>
        row.scheduledStart ? `${row.scheduledStart}–${row.scheduledEnd}` : "—",
    },
    {
      key: "checkin",
      header: "Check-in",
      cell: (row) => row.checkInTime || "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusTone(row.status) as "default" | "secondary" | "outline" | "destructive"}>
          {row.status}
          {row.isLate && row.lateMinutes ? ` (+${row.lateMinutes}m)` : ""}
        </Badge>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.remarks || "—"}</span>,
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Staff attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare check-in times against each staff member&apos;s work schedule.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/workforce">Back to workforce</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <KpiCard label="Present" value={stats.present} icon={Clock} tone="success" />
        <KpiCard label="Late" value={stats.late} icon={Clock} tone="warning" />
        <KpiCard label="Absent" value={stats.absent} icon={Clock} tone="destructive" />
        <KpiCard label="On leave" value={stats.leave} icon={Clock} />
        <KpiCard label="Off-day" value={stats.offDay} icon={Clock} />
      </div>

      <div className="mb-6 border rounded-lg p-4 bg-muted/20 space-y-4">
        <h3 className="font-semibold">Mark attendance</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Staff member</Label>
            <select
              value={form.staffMemberId}
              onChange={(e) => setForm((p) => ({ ...p, staffMemberId: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select staff</option>
              {staffMembers.map((staff) => (
                <option key={getStaffRecordId(staff)} value={getStaffRecordId(staff)}>
                  {staff.firstName} {staff.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Check-in</Label>
            <Input
              type="time"
              value={form.checkInTime}
              onChange={(e) => setForm((p) => ({ ...p, checkInTime: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Check-out</Label>
            <Input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => setForm((p) => ({ ...p, checkOutTime: e.target.value }))}
            />
          </div>
        </div>
        <Button onClick={handleMark} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save attendance
        </Button>
        <Button variant="outline" onClick={handleBulkMark} disabled={bulkSaving}>
          {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Mark all unmarked (absent / off-day / leave)
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title={`Attendance for ${date}`}
          description="Late/absent flags are calculated from work schedules and approved leave"
          data={records}
          columns={columns}
          searchKeys={["staffName", "status", "remarks"]}
          pageSize={10}
        />
      )}
    </>
  );
}
