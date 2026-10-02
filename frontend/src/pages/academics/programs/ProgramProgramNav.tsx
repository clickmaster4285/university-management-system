import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ListTree, Receipt } from "lucide-react";

      
type ProgramProgramNavProps = {
  active: "curriculum" | "semester-fees";
  programCode?: string;
};

export function ProgramProgramNav({ active, programCode }: ProgramProgramNavProps) {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  const tabs = [
    { key: "curriculum" as const, label: "Curriculum", icon: ListTree, path: `/programs/${id}/curriculum` },
    { key: "semester-fees" as const, label: "Semester Fees", icon: Receipt, path: `/programs/${id}/semester-fees` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-3 mb-4">
      {programCode && (
        <span className="text-lg font-mono font-semibold text-muted-foreground mr-2">{programCode}</span>
      )}
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            to={tab.path}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
