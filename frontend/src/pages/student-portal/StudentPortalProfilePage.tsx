import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { studentPortalAPI } from "@/features/studentPortal";
import type { Student } from "@/features/students";
import { toast } from "sonner";

const label = (value: Student["programId"] | string | undefined, fallback?: string) => {
  if (!value) return fallback || "—";
  if (typeof value === "object") return value.name || value.code || fallback || "—";
  return String(value);
};

export default function StudentPortalProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setStudent(await studentPortalAPI.getMe());
      } catch {
        toast.error("Could not load profile");
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

  if (!student) {
    return <p className="text-muted-foreground">Profile unavailable.</p>;
  }

  const name = student.fullName || student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{student.studentId}</p>
        </div>
        <Badge>{student.status || "Active"}</Badge>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Full name</dt>
          <dd className="font-medium mt-0.5">{name || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium mt-0.5">{student.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="font-medium mt-0.5">{student.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">CNIC</dt>
          <dd className="font-medium mt-0.5">{student.cnic || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Program</dt>
          <dd className="font-medium mt-0.5">{label(student.programId, student.program)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Department</dt>
          <dd className="font-medium mt-0.5">{label(student.departmentId, student.department)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Campus</dt>
          <dd className="font-medium mt-0.5">{label(student.campusId, student.campus)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Batch</dt>
          <dd className="font-medium mt-0.5">{label(student.batchId)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Current semester</dt>
          <dd className="font-medium mt-0.5">{student.currentSemester || student.semester || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Enrollment date</dt>
          <dd className="font-medium mt-0.5">
            {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
