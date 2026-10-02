import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  studentPortalAPI,
  type StudentPortalRegistration,
} from "@/features/studentPortal";
import { toast } from "sonner";

const refName = (value: StudentPortalRegistration["programId"]) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || value.code || "—";
  return String(value);
};

export default function StudentPortalRegistrationsPage() {
  const [rows, setRows] = useState<StudentPortalRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setRows(await studentPortalAPI.getRegistrations());
      } catch {
        toast.error("Could not load registrations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Semester registrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Your enrollment records for each semester.</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No registrations yet.</p>
      ) : (
        <ul className="divide-y border rounded-lg">
          {rows.map((row) => (
            <li key={row._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {row.registrationId || "Registration"}
                  {row.programSemester != null ? ` · Semester ${row.programSemester}` : ""}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {refName(row.programId)} · {refName(row.academicSessionId)}
                </p>
              </div>
              <Badge variant="secondary">{row.status || "—"}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
