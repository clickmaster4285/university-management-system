import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  StudentDossierForm,
  emptyStudentDossierFormValue,
  formValueToStudentCreatePayload,
  getMissingDossierFields,
  type StudentDossierFormValue,
} from "@/components/student/StudentDossierForm";
import type { StagedDocumentMap } from "@/components/student/StudentDocumentSlots";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  studentAdmissionsAPI,
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import { studentAPI, type PortalLoginCredentials } from "@/features/students";
import { programAPI } from "@/features/programs";
import { campusAPI } from "@/features/campus";
import { batchAPI } from "@/features/batches";

export default function StudentCreatePage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ value: string; label: string }>>([]);
  const [batches, setBatches] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalCreds, setPortalCreds] = useState<PortalLoginCredentials | null>(null);
  const [createdPath, setCreatedPath] = useState<string | null>(null);
  const [form, setForm] = useState<StudentDossierFormValue>(emptyStudentDossierFormValue);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocumentMap>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [programList, campusRes, batchList] = await Promise.all([
          programAPI.getAll({ limit: 500 }),
          campusAPI.getAll(),
          batchAPI.getAll(),
        ]);
        const programsArr = Array.isArray(programList)
          ? programList
          : (programList as { data?: Array<{ _id?: string; name: string; code: string }> })?.data || [];
        setPrograms(
          programsArr
            .filter((p) => p._id)
            .map((p) => ({ value: p._id!, label: `${p.name} (${p.code})` }))
        );
        const campusData = campusRes?.data;
        const campusArr = Array.isArray(campusData) ? campusData : [];
        setCampuses(campusArr.map((c) => ({ value: c._id, label: c.name })));
        const batchArr = (Array.isArray(batchList)
          ? batchList
          : (batchList as { data?: unknown[] })?.data || []) as Array<{
          _id?: string;
          code?: string;
          batchId?: string;
          program?: string;
          year?: number;
        }>;
        setBatches(
          batchArr
            .filter((b) => b._id)
            .map((b) => ({
              value: b._id!,
              label: `${b.code || b.batchId} — ${b.program || ""} (${b.year || ""})`.trim(),
            }))
        );
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = getMissingDossierFields(form, "create");
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const result = await studentAPI.create(formValueToStudentCreatePayload(form));
      const student = result.data;
      const studentKey = student.studentId || student._id || "";

      const entries = Object.entries(stagedDocuments) as Array<[StudentDocumentType, File]>;
      for (const [documentType, file] of entries) {
        if (!file || !studentKey) continue;
        await studentAdmissionsAPI.uploadStudentDocument(studentKey, {
          file,
          documentType,
          documentName: file.name.replace(/\.[^.]+$/, "") || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
        });
      }

      toast.success(result.message || "Student created");
      const path = `/students/${studentKey}`;
      if (result.portalLogin?.temporaryPassword) {
        setPortalCreds(result.portalLogin);
        setCreatedPath(path);
      } else {
        navigate(path);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create student";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (portalCreds) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Student created</h1>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2 text-sm">
          <p className="font-semibold">Portal credentials (shown once)</p>
          <p>
            Email: <span className="font-mono">{portalCreds.email}</span>
          </p>
          <p>
            Password: <span className="font-mono">{portalCreds.temporaryPassword}</span>
          </p>
        </div>
        <Button onClick={() => createdPath && navigate(createdPath)}>Open student profile</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/students">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Add student</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Same dossier form and document slots as online apply and admissions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <StudentDossierForm
          mode="create"
          value={form}
          onChange={setForm}
          programs={programs}
          campuses={campuses}
          batches={batches}
          showDocuments
          stagedDocuments={stagedDocuments}
          onStagedDocumentsChange={setStagedDocuments}
        />
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create student
        </Button>
      </form>
    </div>
  );
}
