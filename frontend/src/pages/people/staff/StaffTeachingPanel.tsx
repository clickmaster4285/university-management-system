import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { staffMemberAPI, type StaffMember, type StaffOffering } from "@/features/staffMembers";
import { getStaffRecordId } from "@/lib/staffUtils";

interface StaffTeachingPanelProps {
  staff: StaffMember;
}

export function StaffTeachingPanel({ staff }: StaffTeachingPanelProps) {
  const [offerings, setOfferings] = useState<StaffOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!staff.isAcademic) {
        setLoading(false);
        return;
      }
      try {
        const data = await staffMemberAPI.getOfferings(getStaffRecordId(staff));
        setOfferings(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [staff]);

  if (!staff.isAcademic) {
    return (
      <p className="text-sm text-muted-foreground border rounded-lg p-4">
        This staff member is not marked as academic faculty. Enable &quot;Academic&quot; on their
        profile to track teaching assignments.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Teaching assignments</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Course offerings where this staff member is the instructor (StaffMember ↔ offerings link).
      </p>
      {offerings.length === 0 ? (
        <p className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
          No offerings assigned yet.
        </p>
      ) : (
        <div className="space-y-2">
          {offerings.map((offering) => (
            <div key={offering._id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">
                  {offering.subjectId?.code} — {offering.subjectId?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {offering.programId?.code} · {offering.batchId?.name || offering.batchId?.batchCode} ·
                  Semester {offering.semester}
                </p>
              </div>
              <Badge variant="outline">{offering.status}</Badge>
            </div>
          ))}
        </div>
      )}
      <Link to="/offerings" className="text-sm text-primary hover:underline">
        Manage offerings →
      </Link>
    </div>
  );
}

export default StaffTeachingPanel;
