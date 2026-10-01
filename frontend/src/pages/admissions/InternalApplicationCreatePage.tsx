import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  StudentDossierForm,
  emptyStudentDossierFormValue,
  formValueToApplicationPayload,
  getMissingDossierFields,
  type StudentDossierFormValue,
} from "@/components/student/StudentDossierForm";
import type { StagedDocumentMap } from "@/components/student/StudentDocumentSlots";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import { studentApplicationsAPI } from "@/features/studentApplications";
import { programAPI } from "@/features/programs";
import { campusAPI } from "@/features/campus";

/**
 * Staff-entered intake using the same dossier form as /apply.
 * After create, opens review so status can be set (Shortlisted / Accepted / …).
 */
export default function InternalApplicationCreatePage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StudentDossierFormValue>(emptyStudentDossierFormValue());
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocumentMap>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [programRes, campusRes] = await Promise.all([
          programAPI.getAll({ limit: 500 }),
          campusAPI.getAll(),
        ]);
        const programList = Array.isArray(programRes)
          ? programRes
          : (programRes as { data?: Array<{ _id?: string; name: string; code: string }> })?.data || [];
        setPrograms(
          programList
            .filter((p) => p._id)
            .map((p) => ({ value: p._id!, label: `${p.name} (${p.code})` }))
        );
        const campusData = campusRes?.data;
        const campusList = Array.isArray(campusData) ? campusData : [];
        setCampuses(campusList.map((c) => ({ value: c._id, label: c.name })));
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
    const missing = getMissingDossierFields(form, "apply");
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const created = await studentApplicationsAPI.createInternal(
        formValueToApplicationPayload(form)
      );
      const applicationId = created.applicationId;
      const cnic = form.cnic.trim();

      const entries = Object.entries(stagedDocuments) as Array<[StudentDocumentType, File]>;
      for (const [documentType, file] of entries) {
        if (!file || !applicationId) continue;
        await studentApplicationsAPI.uploadPublicApplicationDocument(applicationId, {
          file,
          documentType,
          documentName:
            file.name.replace(/\.[^.]+$/, "") || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
          cnic,
        });
      }

      toast.success("Internal application created");
      navigate(`/admissions/${applicationId}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create application";
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

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/admissions">
          <ArrowLeft className="h-4 w-4" /> Back to offline applicants
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New offline application</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Same form as the public apply page — for walk-in admission applications (not campus
          visitors). After saving, review and mark Shortlisted / Accepted as usual.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <StudentDossierForm
          mode="apply"
          value={form}
          onChange={setForm}
          programs={programs}
          campuses={campuses}
          showDocuments
          stagedDocuments={stagedDocuments}
          onStagedDocumentsChange={setStagedDocuments}
          documentsDescription="Same document slots as public apply. Files attach when you create the application."
        />
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create &amp; review
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admissions">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
