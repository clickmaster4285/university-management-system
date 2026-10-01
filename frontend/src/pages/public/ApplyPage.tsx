import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  StudentDossierForm,
  emptyStudentDossierFormValue,
  formValueToApplicationPayload,
  getMissingDossierFields,
  getMissingDossierFieldsForSections,
  type DossierFormSection,
  type StudentDossierFormValue,
} from "@/components/student/StudentDossierForm";
import type { StagedDocumentMap } from "@/components/student/StudentDocumentSlots";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import {
  studentApplicationsAPI,
  type PublicCatalogProgram,
} from "@/features/studentApplications";

const STEPS: Array<{
  id: string;
  title: string;
  sections: DossierFormSection[];
}> = [
  { id: "program", title: "Program", sections: ["assignment"] },
  { id: "personal", title: "Personal", sections: ["personal"] },
  {
    id: "background",
    title: "Background",
    sections: ["guardian", "address", "education"],
  },
  { id: "documents", title: "Documents", sections: ["documents"] },
  { id: "review", title: "Review", sections: [] },
];

export default function ApplyPage() {
  const [searchParams] = useSearchParams();
  const prefillCampusId = searchParams.get("campusId") || "";
  const prefillProgramId = searchParams.get("programId") || "";
  const lockSelection = Boolean(prefillCampusId && prefillProgramId);

  const [programMeta, setProgramMeta] = useState<PublicCatalogProgram[]>([]);
  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ value: string; label: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<StudentDossierFormValue>(emptyStudentDossierFormValue());
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocumentMap>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [programList, campusList, sessionList] = await Promise.all([
          studentApplicationsAPI.getPublicPrograms(),
          studentApplicationsAPI.getPublicCampuses(),
          studentApplicationsAPI.getPublicSessions(),
        ]);
        setProgramMeta(programList);

        const openPrograms = programList.filter((p) => p.admissionOpen);
        const optionsSource =
          lockSelection && prefillProgramId
            ? programList.filter(
                (p) => p._id === prefillProgramId || p.admissionOpen
              )
            : openPrograms;

        setPrograms(
          optionsSource.map((p) => ({
            value: p._id,
            label: `${p.name} (${p.code})${p.admissionOpen ? "" : " — closed"}`,
          }))
        );
        setCampuses(campusList.map((c) => ({ value: c._id, label: c.name })));
        setSessions(sessionList.map((s) => ({ value: s._id, label: s.name })));

        if (prefillCampusId || prefillProgramId) {
          const campusOk =
            !prefillCampusId || campusList.some((c) => c._id === prefillCampusId);
          const program = programList.find((p) => p._id === prefillProgramId);
          const programOk = !prefillProgramId || !!program;
          if (campusOk && programOk) {
            if (program && !program.admissionOpen) {
              toast.error(
                program.admissionLabel
                  ? `This program is not open (${program.admissionLabel}). Pick an open program.`
                  : "This program is not open for admission."
              );
            } else {
              setForm((prev) => ({
                ...prev,
                campusId: prefillCampusId || prev.campusId,
                programId: prefillProgramId || prev.programId,
              }));
            }
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
  }, [prefillCampusId, prefillProgramId, lockSelection]);

  const selectedProgramMeta = useMemo(
    () => programMeta.find((p) => p._id === form.programId),
    [programMeta, form.programId]
  );
  const selectedProgram = programs.find((p) => p.value === form.programId);
  const selectedCampus = campuses.find((c) => c.value === form.campusId);
  const selectedSession = sessions.find((s) => s.value === form.academicSessionId);
  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const programIsOpen = !!selectedProgramMeta?.admissionOpen;

  const validateStep = (index: number) => {
    const step = STEPS[index];
    if (step.id === "review") {
      const missing = getMissingDossierFields(form, "apply");
      if (missing.length) {
        toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
        return false;
      }
      if (!programIsOpen) {
        toast.error(
          selectedProgramMeta?.admissionLabel
            ? `Admissions closed (${selectedProgramMeta.admissionLabel}). Choose an open program.`
            : "Selected program is not open for admission."
        );
        return false;
      }
      return true;
    }
    if (step.id === "documents") return true;
    const missing = getMissingDossierFieldsForSections(form, "apply", step.sections);
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return false;
    }
    if (step.id === "program" && form.programId && !programIsOpen) {
      toast.error("Selected program is not open for admission. Choose another or browse the catalog.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(stepIndex)) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(STEPS.length - 1)) return;
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
          documentName:
            file.name.replace(/\.[^.]+$/, "") || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-brand mb-4">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Apply for admission</h1>
        <p className="text-muted-foreground mt-2">
          Complete each step. Only programs with open admissions can be submitted.
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
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <ol className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (index < stepIndex) setStepIndex(index);
                      else if (index > stepIndex) {
                        for (let i = stepIndex; i < index; i += 1) {
                          if (!validateStep(i)) return;
                        }
                        setStepIndex(index);
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-background/80 flex items-center justify-center text-[11px]">
                      {done ? "✓" : index + 1}
                    </span>
                    {step.title}
                  </button>
                </li>
              );
            })}
          </ol>

          {currentStep.id !== "review" ? (
            <StudentDossierForm
              mode="apply"
              value={form}
              onChange={setForm}
              programs={programs}
              campuses={campuses}
              sessions={sessions}
              showDocuments={currentStep.sections.includes("documents")}
              stagedDocuments={stagedDocuments}
              onStagedDocumentsChange={setStagedDocuments}
              lockProgramCampus={lockSelection}
              programLabel={selectedProgram?.label}
              campusLabel={selectedCampus?.label}
              sections={currentStep.sections}
              documentsDescription="Optional for now — you can upload CNIC, photo, and academic documents here or later if admissions requests them."
            />
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review your application</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Program</p>
                  <p className="font-medium">{selectedProgram?.label || "—"}</p>
                  <p>{selectedCampus?.label || "—"}</p>
                  <p className="text-muted-foreground">
                    {selectedSession?.label || "Any open session"}
                  </p>
                  <p className={programIsOpen ? "text-emerald-700" : "text-destructive"}>
                    {selectedProgramMeta?.admissionLabel ||
                      (programIsOpen ? "Open" : "Not open")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Applicant</p>
                  <p className="font-medium">
                    {form.firstName} {form.lastName}
                  </p>
                  <p>{form.email}</p>
                  <p>{form.phone}</p>
                  <p className="font-mono">{form.cnic}</p>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Guardian</p>
                  <p>{form.guardian.fatherName || "—"}</p>
                  <p className="text-muted-foreground">{form.guardian.guardianPhone || ""}</p>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Address</p>
                  <p>{form.address.city || "—"}</p>
                  <p className="text-muted-foreground">
                    {[form.address.street, form.address.state, form.address.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-1 sm:col-span-2">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Documents</p>
                  <p>
                    {Object.keys(stagedDocuments).length
                      ? `${Object.keys(stagedDocuments).length} file(s) ready to upload`
                      : "No documents attached (optional)"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={stepIndex === 0 || submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                className="gradient-brand text-white border-0"
                disabled={submitting || !programIsOpen}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit application
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
