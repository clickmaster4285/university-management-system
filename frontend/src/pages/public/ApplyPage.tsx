import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, GraduationCap, Loader2, Send } from "lucide-react";
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

export default function ApplyPage() {
  const [searchParams] = useSearchParams();
  const prefillCampusId = searchParams.get("campusId") || "";
  const prefillProgramId = searchParams.get("programId") || "";
  const lockSelection = Boolean(prefillCampusId && prefillProgramId);

  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ value: string; label: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentDossierFormValue>(emptyStudentDossierFormValue);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocumentMap>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [programList, campusList, sessionList] = await Promise.all([
          studentApplicationsAPI.getPublicPrograms(),
          studentApplicationsAPI.getPublicCampuses(),
          studentApplicationsAPI.getPublicSessions(),
        ]);
        setPrograms(
          programList.map((p) => ({ value: p._id, label: `${p.name} (${p.code})` }))
        );
        setCampuses(campusList.map((c) => ({ value: c._id, label: c.name })));
        setSessions(sessionList.map((s) => ({ value: s._id, label: s.name })));

        if (prefillCampusId || prefillProgramId) {
          const campusOk = !prefillCampusId || campusList.some((c) => c._id === prefillCampusId);
          const programOk =
            !prefillProgramId || programList.some((p) => p._id === prefillProgramId);
          if (campusOk && programOk) {
            setForm((prev) => ({
              ...prev,
              campusId: prefillCampusId || prev.campusId,
              programId: prefillProgramId || prev.programId,
            }));
          } else {
            toast.error("Selected program or campus is no longer available");
          }
        }
      } catch {
        toast.error("Failed to load application form options");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [prefillCampusId, prefillProgramId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const missing = getMissingDossierFields(form, "apply");
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await studentApplicationsAPI.submitPublicApplication(
        formValueToApplicationPayload(form)
      );
      const applicationId = result?.data?.applicationId as string;
      const cnic = form.cnic.trim();

      const entries = Object.entries(stagedDocuments) as Array<[StudentDocumentType, File]>;
      for (const [documentType, file] of entries) {
        if (!file || !applicationId) continue;
        await studentApplicationsAPI.uploadPublicApplicationDocument(applicationId, {
          file,
          documentType,
          documentName: file.name.replace(/\.[^.]+$/, "") || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
          cnic,
        });
      }

      setSubmittedId(applicationId);
      toast.success(result?.message || "Application submitted");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to submit application";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedProgram = programs.find((p) => p.value === form.programId);
  const selectedCampus = campuses.find((c) => c.value === form.campusId);

  return (
    <div className="max-w-[80vw] mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-brand mb-4">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Apply for admission</h1>
        <p className="text-muted-foreground mt-2">
          Same dossier details and document slots used by admissions staff. No login required.
        </p>
        {lockSelection && selectedProgram && selectedCampus && (
          <p className="mt-3 text-sm">
            Applying to <span className="font-medium text-foreground">{selectedProgram.label}</span>
            {" at "}
            <span className="font-medium text-foreground">{selectedCampus.label}</span>
            {" · "}
            <Link to="/programs" className="text-primary underline underline-offset-2">
              Change program
            </Link>
          </p>
        )}
        {!lockSelection && (
          <p className="mt-3 text-sm text-muted-foreground">
            Prefer to browse first?{" "}
            <Link to="/programs" className="text-primary underline underline-offset-2">
              View programs by campus
            </Link>
          </p>
        )}
      </div>

      {submittedId ? (
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-semibold">Application received</h2>
          <p className="text-muted-foreground">Save your application ID to track status:</p>
          <p className="text-2xl font-mono font-bold text-primary">{submittedId}</p>
          <Button asChild>
            <Link to={`/apply/status?applicationId=${submittedId}`}>Track status</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <StudentDossierForm
            mode="apply"
            value={form}
            onChange={setForm}
            programs={programs}
            campuses={campuses}
            sessions={sessions}
            showDocuments
            stagedDocuments={stagedDocuments}
            onStagedDocumentsChange={setStagedDocuments}
            lockProgramCampus={lockSelection}
          />
          <Button type="submit" className="w-full gradient-brand text-white border-0" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit application
          </Button>
        </form>
      )}
    </div>
  );
}
