import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  StudentDossierForm,
  dossierToFormValue,
  emptyStudentDossierFormValue,
  formValueToDossierPayload,
  getMissingDossierFields,
  type StudentDossierFormValue,
} from "@/components/student/StudentDossierForm";
import {
  getAdmissionApiError,
  STUDENT_DOCUMENT_TYPE_LABELS,
  studentAdmissionsAPI,
  type StudentAdmissionDossier,
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import { batchAPI } from "@/features/batches";
import AdmissionDocumentsPanel from "./AdmissionDocumentsPanel";
import AdmissionFeePanel from "./AdmissionFeePanel";

export default function AdmissionDossierPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<StudentAdmissionDossier | null>(null);
  const [form, setForm] = useState<StudentDossierFormValue>(emptyStudentDossierFormValue);
  const [batches, setBatches] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [feeSatisfied, setFeeSatisfied] = useState(false);
  const [portalCreds, setPortalCreds] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [createdStudentPath, setCreatedStudentPath] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [data, batchRes] = await Promise.all([
          studentAdmissionsAPI.getDossier(id),
          batchAPI.getAll(),
        ]);
        setDossier(data);
        setForm(dossierToFormValue(data as unknown as Record<string, unknown>));
        const list = (batchRes?.data || batchRes || []) as Array<{
          _id: string;
          code: string;
          year: number;
          program?: string;
        }>;
        setBatches(
          list.map((b) => ({
            value: b._id,
            label: `${b.code} (${b.year})${b.program ? ` — ${b.program}` : ""}`,
          }))
        );
      } catch {
        toast.error("Admission dossier not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const missingFields = useMemo(() => getMissingDossierFields(form, "dossier"), [form]);
  const canComplete =
    dossier?.status !== "Enrolled" && missingFields.length === 0 && feeSatisfied;
  const enrolled = dossier?.status === "Enrolled";

  const programLabel =
    typeof dossier?.programId === "object" ? dossier.programId.name || "" : "";
  const campusLabel =
    typeof dossier?.campusId === "object" ? dossier.campusId.name || "" : "";

  const handleSave = async () => {
    if (!id || !dossier) return;
    setSaving(true);
    try {
      const updated = await studentAdmissionsAPI.updateDossier(id, {
        ...dossier,
        ...formValueToDossierPayload(form),
      } as Partial<StudentAdmissionDossier>);
      setDossier(updated);
      setForm(dossierToFormValue(updated as unknown as Record<string, unknown>));
      toast.success("Dossier saved");
    } catch {
      toast.error("Failed to save dossier");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!id || !dossier) return;
    if (!confirm("Create official student record from this dossier?")) return;
    setCompleting(true);
    try {
      const saved = await studentAdmissionsAPI.updateDossier(id, {
        ...dossier,
        ...formValueToDossierPayload(form),
      } as Partial<StudentAdmissionDossier>);
      setDossier(saved);
      const result = await studentAdmissionsAPI.completeAdmission(id);
      toast.success(result?.message || "Student created");
      const student = result?.data;
      const studentPath = `/students/${student?.studentId || student?._id}`;
      const login = result?.portalLogin;
      if (login?.email && login?.temporaryPassword) {
        setPortalCreds({ email: login.email, temporaryPassword: login.temporaryPassword });
        setCreatedStudentPath(studentPath);
        toast.message("Save portal password — shown once on this page");
        return;
      }
      navigate(studentPath);
    } catch (err: unknown) {
      const data = getAdmissionApiError(err);
      const parts = [data?.message];
      if (data?.missingFields?.length) parts.push(`Missing fields: ${data.missingFields.join(", ")}`);
      if (data?.missingDocuments?.length) {
        parts.push(
          `Missing documents: ${data.missingDocuments
            .map((type) => STUDENT_DOCUMENT_TYPE_LABELS[type as StudentDocumentType] || type)
            .join(", ")}`
        );
      }
      toast.error(parts.filter(Boolean).join(" — "));
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">Admission dossier not found.</p>
        <Button asChild variant="outline">
          <Link to="/admissions/dossiers">Back to fee &amp; enrollment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/admissions/dossiers">
          <ArrowLeft className="h-4 w-4" /> Back to fee &amp; enrollment
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {form.firstName} {form.lastName}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{dossier.admissionId}</p>
        </div>
        <Badge>{dossier.status}</Badge>
      </div>

      {portalCreds ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h3 className="font-semibold">Student portal credentials (shown once)</h3>
          <p className="text-sm">
            Email: <span className="font-mono">{portalCreds.email}</span>
          </p>
          <p className="text-sm">
            Temporary password: <span className="font-mono">{portalCreds.temporaryPassword}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Share securely. Student signs in at /login and lands on /student.
          </p>
          {createdStudentPath ? (
            <Button type="button" onClick={() => navigate(createdStudentPath)}>
              Open student profile
            </Button>
          ) : null}
        </div>
      ) : null}

      <StudentDossierForm
        mode="dossier"
        value={form}
        onChange={setForm}
        batches={batches}
        lockProgramCampus
        programLabel={programLabel}
        campusLabel={campusLabel}
        disabled={enrolled}
      />

      <AdmissionFeePanel
        mode="dossier"
        recordId={id!}
        disabled={enrolled}
        onSatisfiedChange={setFeeSatisfied}
      />

      <AdmissionDocumentsPanel dossierId={id!} ownerLabel={dossier.admissionId} />

      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <h3 className="font-semibold">Completion checklist</h3>
        <p className="text-sm text-muted-foreground">
          Same fields as the public apply form, plus batch. Admission fee must be verified before
          enroll.
        </p>
        <ul className="space-y-1 text-sm">
          {[
            { key: "firstName", label: "First name" },
            { key: "lastName", label: "Last name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "cnic", label: "CNIC" },
            { key: "dateOfBirth", label: "Date of birth" },
            { key: "gender", label: "Gender" },
            { key: "batchId", label: "Batch" },
            { key: "fatherName", label: "Father name" },
            { key: "city", label: "City" },
            { key: "fee", label: "Admission fee verified" },
          ].map((item) => {
            const done =
              item.key === "fee"
                ? feeSatisfied
                : !missingFields.some((f) => f.key === item.key || f.label === item.label);
            return (
              <li key={item.key} className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={done ? "" : "text-amber-700 dark:text-amber-400"}>{item.label}</span>
              </li>
            );
          })}
        </ul>
        {!canComplete && !enrolled && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {[
              missingFields.length
                ? `Missing fields: ${missingFields.map((f) => f.label).join(", ")}`
                : null,
              !feeSatisfied ? "Admission fee not verified yet" : null,
            ]
              .filter(Boolean)
              .join(" — ")}
            .
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button onClick={handleSave} disabled={saving || enrolled}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save dossier
        </Button>
        {!enrolled && (
          <Button variant="default" onClick={handleComplete} disabled={completing || !canComplete}>
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Complete admission → create student
          </Button>
        )}
        {typeof dossier.studentId === "object" && dossier.studentId?.studentId && (
          <Button asChild variant="outline">
            <Link to={`/students/${dossier.studentId.studentId}`}>View student record</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
