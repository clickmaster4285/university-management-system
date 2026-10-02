import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock, Eye, FileText, Briefcase, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { formatScheduleSummary, getStaffRecordId } from "@/lib/staffUtils";

export default function WorkforcePage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await staffMemberAPI.getAll({ limit: 500, status: "Active" });
        setStaffMembers(res?.data || []);
      } catch {
        toast.error("Failed to load workforce");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const configured = staffMembers.filter((s) => s.workSchedule?.some((d) => d.isWorkingDay)).length;
    return {
      total: staffMembers.length,
      configured,
      pending: staffMembers.length - configured,
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
          <div className="text-xs text-muted-foreground font-mono">{row.staffId}</div>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule summary",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatScheduleSummary(row.workSchedule)}</span>
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
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/workforce/${getStaffRecordId(row)}`)}
            title="View schedule"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/workforce/${getStaffRecordId(row)}`)}
            title="Edit schedule"
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
        <h1 className="text-2xl font-bold">Workforce</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage when staff work — schedules, hours, and availability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Link to="/workforce/leaves">
          <Card className="h-full hover:border-primary/40 hover:bg-muted/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Leave management</p>
                <p className="text-sm text-muted-foreground">Requests & approvals</p>
              </div>
              <CalendarDays className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/workforce/attendance">
          <Card className="h-full hover:border-primary/40 hover:bg-muted/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Attendance</p>
                <p className="text-sm text-muted-foreground">Late/absent vs schedule</p>
              </div>
              <Clock className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/workforce/recruitment">
          <Card className="h-full hover:border-primary/40 hover:bg-muted/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Recruitment</p>
                <p className="text-sm text-muted-foreground">Postings & hire to staff</p>
              </div>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/staff">
          <Card className="h-full hover:border-primary/40 hover:bg-muted/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Staff documents</p>
                <p className="text-sm text-muted-foreground">CNIC, contracts, letters</p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <KpiCard label="Active staff" value={stats.total} icon={Clock} />
        <KpiCard label="Schedules set" value={stats.configured} icon={Clock} tone="success" />
        <KpiCard label="Needs setup" value={stats.pending} icon={Clock} tone="warning" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Work schedules"
          description="Select a staff member to configure their working hours"
          data={staffMembers}
          columns={columns}
          searchKeys={["firstName", "lastName", "staffId", "email"]}
          pageSize={10}
        />
      )}
    </>
  );
}
