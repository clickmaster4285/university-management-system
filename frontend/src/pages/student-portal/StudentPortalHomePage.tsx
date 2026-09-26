import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { studentPortalAPI } from "@/features/studentPortal";
import type { Student } from "@/features/students";
import { toast } from "sonner";

const label = (value: Student["programId"] | string | undefined, fallback?: string) => {
  if (!value) return fallback || "—";
  if (typeof value === "object") return value.name || value.code || fallback || "—";
  return String(value);
};

export default function StudentPortalHomePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setStudent(await studentPortalAPI.getMe());
      } catch {
        toast.error("Could not load your profile");
        setStudent(null);
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
    return <p className="text-muted-foreground">Unable to load student profile.</p>;
  }

  const name = student.fullName || student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">{student.studentId}</p>
        </div>
        <Badge>{student.status || "Active"}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1 border-b pb-3">
          <p className="text-muted-foreground">Program</p>
          <p className="font-medium">{label(student.programId, student.program)}</p>
        </div>
        <div className="space-y-1 border-b pb-3">
          <p className="text-muted-foreground">Campus</p>
          <p className="font-medium">{label(student.campusId, student.campus)}</p>
        </div>
        <div className="space-y-1 border-b pb-3">
          <p className="text-muted-foreground">Current semester</p>
          <p className="font-medium">{student.currentSemester || student.semester || "—"}</p>
        </div>
        <div className="space-y-1 border-b pb-3">
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium">{student.email || "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/student/registrations">My registrations</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/student/fees">My fees</Link>
        </Button>
        <Button asChild>
          <Link to="/student/profile">View profile</Link>
        </Button>
      </div>
    </div>
  );
}
