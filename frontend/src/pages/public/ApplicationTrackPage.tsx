import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  StudentDossierForm,
  dossierToFormValue,
  emptyStudentDossierFormValue,
  formValueToApplicationPayload,
  getMissingDossierFields,
  type StudentDossierFormValue,
} from "@/components/student/StudentDossierForm";
import type { StagedDocumentMap } from "@/components/student/StudentDocumentSlots";
import AdmissionFeeChallanForm from "@/components/student/AdmissionFeeChallanForm";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  type AdmissionChallanPrint,
  type StudentDocument,
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import { studentApplicationsAPI } from "@/features/studentApplications";

type TrackResult = {
  applicationId: string;
  fullName: string;
  status: string;
  applicantMessage?: string;
  applicantReply?: string;
  canEdit?: boolean;
  canUploadFeeProof?: boolean;
  feeSatisfied?: boolean;
  admissionFee?: {
    feeId?: string;
    amount?: number;
    dueDate?: string;
    paymentStatus?: string;
    proofStatus?: string;
    proofNotes?: string;
    description?: string;
  } | null;
  admissionChallan?: AdmissionChallanPrint | null;
  documents?: StudentDocument[];
  [key: string]: unknown;
};

export default function ApplicationTrackPage() {
  const [searchParams] = useSearchParams();
  const [applicationId, setApplicationId] = useState(searchParams.get("applicationId") || "");
  const [cnic, setCnic] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [form, setForm] = useState<StudentDossierFormValue>(emptyStudentDossierFormValue);
  const [reply, setReply] = useState("");
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocumentMap>({});
  const [feeProofFile, setFeeProofFile] = useState<File | null>(null);
  const [uploadingFeeProof, setUploadingFeeProof] = useState(false);
  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ value: string; label: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const id = searchParams.get("applicationId");
    if (id) setApplicationId(id);
  }, [searchParams]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [programList, campusList, sessionList] = await Promise.all([
          studentApplicationsAPI.getPublicPrograms(),
          studentApplicationsAPI.getPublicCampuses(),
          studentApplicationsAPI.getPublicSessions(),
        ]);
        setPrograms(programList.map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })));
        setCampuses(campusList.map((c) => ({ value: c._id, label: c.name })));
        setSessions(sessionList.map((s) => ({ value: s._id, label: s.name })));
      } catch {
        toast.error("Failed to load form options");
      }
    };
    loadOptions();
  }, []);

  const handleTrack = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!applicationId || !cnic) {
      toast.error("Application ID and CNIC are required");
      return;
    }
    setLoading(true);
    try {
      const data = (await studentApplicationsAPI.trackPublicApplication(
        applicationId.trim(),
        cnic.trim()
      )) as TrackResult;
      setResult(data);
      setForm(dossierToFormValue(data as Record<string, unknown>));
      setReply("");
      setStagedDocuments({});
      setFeeProofFile(null);
    } catch (err: unknown) {
      setResult(null);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Application not found";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendUpdates = async () => {
    if (!result) return;
    const missing = getMissingDossierFields(form, "apply");
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSending(true);
    try {
      const entries = Object.entries(stagedDocuments) as Array<[StudentDocumentType, File]>;
      for (const [documentType, file] of entries) {
        if (!file) continue;
        await studentApplicationsAPI.uploadPublicApplicationDocument(result.applicationId, {
          file,
          documentType,
          documentName:
            file.name.replace(/\.[^.]+$/, "") || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
          cnic: cnic.trim(),
        });
      }

      const response = await studentApplicationsAPI.updatePublicApplication(
        result.applicationId,
        {
          ...formValueToApplicationPayload({ ...form, cnic: cnic.trim() }),
          cnic: cnic.trim(),
          applicantReply: reply.trim(),
        }
      );
      const data = response?.data as TrackResult;
      setResult(data);
      setForm(dossierToFormValue(data as Record<string, unknown>));
      setStagedDocuments({});
      setReply("");
      toast.success(response?.message || "Updates sent to admissions");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send updates";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleUploadFeeProof = async () => {
    if (!result || !feeProofFile) {
      toast.error("Choose a payment receipt file first");
      return;
    }
    setUploadingFeeProof(true);
    try {
      await studentApplicationsAPI.uploadPublicApplicationDocument(result.applicationId, {
        file: feeProofFile,
        documentType: "fee_payment_proof",
        documentName:
          feeProofFile.name.replace(/\.[^.]+$/, "") ||
          STUDENT_DOCUMENT_TYPE_LABELS.fee_payment_proof,
        cnic: cnic.trim(),
      });
      toast.success("Payment proof uploaded — admissions will verify it");
      setFeeProofFile(null);
      await handleTrack();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to upload payment proof";
      toast.error(message);
    } finally {
      setUploadingFeeProof(false);
    }
  };

  const canEdit =
    Boolean(result?.canEdit) &&
    !["Promoted", "Accepted", "Rejected"].includes(result?.status || "");

  const showFeeSection =
    Boolean(result?.admissionFee) || Boolean(result?.canUploadFeeProof);

  return (
    <div className="max-w-[80vw] mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Track your application</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Same full application form as when you applied. Fill anything that was missing, replace
          rejected documents, then press <strong>Send updates</strong>.
        </p>
      </div>

      <form onSubmit={handleTrack} className="glass rounded-2xl p-6 space-y-4 max-w-xl mx-auto mb-8">
        <div>
          <Label>Application ID</Label>
          <Input
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="APP-26-0001"
          />
        </div>
        <div>
          <Label>CNIC</Label>
          <Input
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
            placeholder="12345-1234567-1"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Open application
        </Button>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">{result.fullName}</h2>
                <p className="text-sm text-muted-foreground font-mono">{result.applicationId}</p>
              </div>
              <Badge
                variant={
                  result.status === "Action Required" || result.status === "Rejected"
                    ? "destructive"
                    : "default"
                }
              >
                {result.status}
              </Badge>
            </div>

            {result.applicantMessage ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  Message from admissions
                </p>
                <p className="text-sm whitespace-pre-wrap">{result.applicantMessage}</p>
              </div>
            ) : null}
          </div>

          {showFeeSection ? (
            <div className="glass rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Admission fee</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Print the challan, pay at the bank, then upload your stamped receipt / transfer
                  proof.
                </p>
              </div>
              {result.admissionChallan ? (
                <AdmissionFeeChallanForm challan={result.admissionChallan} />
              ) : result.admissionFee ? (
                <dl className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Challan</dt>
                    <dd className="font-mono font-medium">{result.admissionFee.feeId || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-semibold">
                      PKR {Number(result.admissionFee.amount || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      {result.admissionFee.paymentStatus || "Pending"} · Proof:{" "}
                      {result.admissionFee.proofStatus || "None"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Challan will appear here once admissions accepts your application.
                </p>
              )}
              {result.feeSatisfied ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Fee verified — admissions can complete enrollment.
                </p>
              ) : result.canUploadFeeProof && result.admissionFee ? (
                <div className="space-y-3 border-t pt-3 print:hidden">
                  <Label htmlFor="fee-proof">Upload payment proof</Label>
                  <Input
                    id="fee-proof"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFeeProofFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    type="button"
                    disabled={uploadingFeeProof || !feeProofFile}
                    onClick={handleUploadFeeProof}
                  >
                    {uploadingFeeProof ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit payment proof
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {canEdit ? (
            <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
              <StudentDossierForm
                mode="apply"
                value={form}
                onChange={(next) => setForm({ ...next, cnic: form.cnic || cnic.trim() })}
                programs={programs}
                campuses={campuses}
                sessions={sessions}
                lockCnic
                showDocuments
                documents={result.documents || []}
                stagedDocuments={stagedDocuments}
                onStagedDocumentsChange={setStagedDocuments}
                documentsDescription="Same document slots as the original apply form. Upload missing files or replace rejected ones — they send with Send updates."
              />

              <div className="space-y-2 border-t pt-4">
                <Label>Note to admissions (optional)</Label>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  placeholder="e.g. Filled missing mother name and replaced photo"
                />
              </div>

              <Button
                type="button"
                className="w-full gradient-brand text-white border-0"
                size="lg"
                disabled={sending}
                onClick={handleSendUpdates}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send updates to admissions
              </Button>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
              This application is locked ({result.status}). Contact admissions if you need changes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
