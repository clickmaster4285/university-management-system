import { Link } from "react-router-dom";
import {
  ChevronRight,
  FileText,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Student } from "@/features/students";

interface StudentModuleLinksProps {
  student: Student;
}

const getStudentRecordId = (student: Student) => student.studentId || student._id || "";

const modules = [
  {
    key: "admission",
    title: "Admission dossier",
    description: "Original admission record",
    to: (student: Student) => {
      const admission = student.admissionId;
      if (admission == null) return "/admissions";
      const id = typeof admission === "object" ? admission.admissionId || admission._id : admission;
      return id ? `/admissions/dossier/${id}` : "/admissions";
    },
    icon: GraduationCap,
    summary: (student: Student) => {
      const admission = student.admissionId;
      if (admission == null || typeof admission !== "object") return "View dossier";
      return admission.admissionId || "View dossier";
    },
  },
  {
    key: "documents",
    title: "Documents",
    description: "CNIC, transcripts, certificates",
    to: (student: Student) => `/students/${getStudentRecordId(student)}/documents`,
    icon: FileText,
    summary: () => "Upload & manage files",
  },
  {
    key: "registrations",
    title: "Semester registrations",
    description: "Academic enrollment per session",
    to: () => "/semester-registrations",
    icon: UserCheck,
    summary: (student: Student) => `Semester ${student.currentSemester || student.semester || 1}`,
  },
] as const;

export function StudentModuleLinks({ student }: StudentModuleLinksProps) {
  const id = getStudentRecordId(student);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Related modules</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((module) => (
          <Link key={module.key} to={module.to(student)}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <module.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{module.title}</p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                    <p className="text-sm mt-2 text-muted-foreground">{module.summary(student)}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground font-mono">Student ID: {id}</p>
    </div>
  );
}

export default StudentModuleLinks;
