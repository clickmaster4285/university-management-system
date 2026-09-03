import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { getStaffDepartmentLabel } from "@/lib/staffUtils";

interface StaffContextHeaderProps {
  staff: StaffMember;
  backTo?: string;
  backLabel?: string;
  title?: string;
  description?: string;
}

export function StaffContextHeader({
  staff,
  backTo = "/staff",
  backLabel = "Back to staff directory",
  title,
  description,
}: StaffContextHeaderProps) {
  return (
    <div className="mb-6">
      <Button type="button" variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link to={backTo}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {backLabel}
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title || getStaffDisplayName(staff)}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {description || `${staff.staffId} · ${getStaffDepartmentLabel(staff)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{staff.status}</Badge>
          {staff.isAcademic ? <Badge>Academic</Badge> : <Badge variant="secondary">Non-academic</Badge>}
          {staff.userId ? (
            <Badge className="bg-green-500/15 text-green-700 border-0">Login enabled</Badge>
          ) : (
            <Badge variant="outline">No login</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffContextHeader;
