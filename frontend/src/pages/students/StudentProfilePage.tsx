import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentAPI, type Student } from "@/features/students";
import { StudentModuleLinks } from "@/components/student/StudentModuleLinks";
import { toast } from "sonner";

const resolveRefLabel = (value: Student["programId"]) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || value.code || "—";
  return value;
};

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!id || !student) return;
    setSaving(true);
    try {
      const res = await studentAPI.update(id, student);
      setStudent(res.data?.data || res.data);
      toast.success("Student updated");
    } catch {
      toast.error("Failed to update student");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{student.fullName || student.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
          </div>
          <Badge>{student.status || "Active"}</Badge>
        </div>

        <StudentModuleLinks student={student} />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 border rounded-lg p-4">
            <h3 className="font-semibold">Contact</h3>
            <div><Label>Email</Label><Input value={student.email || ""} onChange={(e) => setStudent({ ...student, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={student.phone || ""} onChange={(e) => setStudent({ ...student, phone: e.target.value })} /></div>
            <div><Label>CNIC</Label><Input value={student.cnic || ""} onChange={(e) => setStudent({ ...student, cnic: e.target.value })} /></div>
          </div>
          <div className="space-y-3 border rounded-lg p-4">
            <h3 className="font-semibold">Academic</h3>
            <p className="text-sm">Program: {resolveRefLabel(student.programId) || student.program}</p>
            <p className="text-sm">Department: {resolveRefLabel(student.departmentId) || student.department}</p>
            <p className="text-sm">Campus: {resolveRefLabel(student.campusId) || student.campus}</p>
            <div>
              <Label>Current semester</Label>
              <Input
                type="number"
                min={1}
                value={student.currentSemester || student.semester || 1}
                onChange={(e) => setStudent({ ...student, currentSemester: Number(e.target.value), semester: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={student.status || "Active"}
                onChange={(e) => setStudent({ ...student, status: e.target.value })}
              >
                {["Active", "Inactive", "On Leave", "Graduated", "Suspended", "Dropped"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}
