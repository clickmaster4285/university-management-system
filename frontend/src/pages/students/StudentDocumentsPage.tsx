import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studentAPI, type Student } from "@/features/students";
import { StudentModuleLinks } from "@/components/student/StudentModuleLinks";
import { StudentDocumentsPanel } from "./StudentDocumentsPanel";

export default function StudentDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await studentAPI.getById(id);
        setStudent(data);
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">Student not found.</p>
        <Button variant="outline" onClick={() => navigate("/students")}>Back to directory</Button>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{student.fullName || student.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
          <Badge className="mt-2">{student.status || "Active"}</Badge>
        </div>
        <StudentModuleLinks student={student} />
        <StudentDocumentsPanel student={student} />
      </CardContent>
    </Card>
  );
}
