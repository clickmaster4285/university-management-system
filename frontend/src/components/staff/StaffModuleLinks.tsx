import { Link } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Shield,
  UserCog,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getStaffRecordId, formatScheduleSummary, formatCurrency } from "@/lib/staffUtils";
import type { StaffMember } from "@/features/staffMembers";

interface StaffModuleLinksProps {
  staff: StaffMember;
}

const modules = [
  {
    key: "workforce",
    title: "Workforce",
    description: "Working days and hours",
    to: (id: string) => `/workforce/${id}`,
    icon: Clock,
    summary: (staff: StaffMember) => formatScheduleSummary(staff.workSchedule),
  },
  {
    key: "payroll",
    title: "Payroll",
    description: "Salary and payment history",
    to: (id: string) => `/payroll/${id}`,
    icon: DollarSign,
    summary: (staff: StaffMember) =>
      formatCurrency(staff.compensation?.basicSalary, staff.compensation?.currency || "PKR"),
  },
  {
    key: "access",
    title: "Portal access",
    description: "Login role and module permissions",
    to: (id: string) => `/access/${id}`,
    icon: Shield,
    summary: (staff: StaffMember) => {
      const user = typeof staff.userId === "object" ? staff.userId : null;
      return user?.primaryRole || "No login";
    },
  },
  {
    key: "documents",
    title: "HR documents",
    description: "CNIC, contracts, appointment letters",
    to: (id: string) => `/staff/${id}/documents`,
    icon: FileText,
    summary: () => "Upload & manage files",
  },
  {
    key: "duties",
    title: "Role assignments",
    description: "HOD, exam controller, and scoped duties",
    to: (id: string) => `/role-assignments/staff/${id}`,
    icon: UserCog,
    summary: () => "Manage academic duties",
  },
] as const;

export function StaffModuleLinks({ staff }: StaffModuleLinksProps) {
  const id = getStaffRecordId(staff);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Related modules</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((module) => (
          <Link key={module.key} to={module.to(id)}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <module.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{module.title}</p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                    <p className="text-sm mt-2 text-muted-foreground">{module.summary(staff)}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default StaffModuleLinks;
