import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, FileText, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  studentApplicationsAPI,
  type ApplicationStatus,
  type StudentApplication,
} from "@/features/studentApplications";
import ApplicationDocumentsPanel from "./ApplicationDocumentsPanel";
import AdmissionFeePanel from "./AdmissionFeePanel";

const STATUS_ACTIONS: ApplicationStatus[] = [
  "Under Review",
  "Shortlisted",
  "Accepted",
  "Rejected",
];

function FieldRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1 text-sm py-1.5 border-b border-border/60 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words min-w-0">{value || "—"}</dd>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
        {title}
      </h3>
      <dl>{children}</dl>
    </section>
  );
}

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: string } | null)?.from;
  const [application, setApplication] = useState<StudentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const backPath =
    fromState === "online" || application?.source === "public"
      ? "/admissions/online"
      : "/admissions";
  const backLabel =
    fromState === "online" || application?.source === "public"
      ? "Back to online applicants"
      : "Back to offline applicants";

  const trackPath = application?.applicationId
    ? `/apply/status?applicationId=${encodeURIComponent(application.applicationId)}`
    : "/apply/status";
  const trackUrl =
    typeof window !== "undefined" ? `${window.location.origin}${trackPath}` : trackPath;

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await studentApplicationsAPI.getById(id);
      setApplication(data);
      setRemarks(data.remarks || "");
      setApplicantMessage(
        data.applicantMessage ||
          "Please update the details we mentioned, replace any rejected documents on the track page, then press Send updates. You do not need to fill a new application."
      );
    } catch {
      toast.error("Application not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: ApplicationStatus) => {
    if (!id) return;
    setBusy(true);
    try {
      const result = await studentApplicationsAPI.updateStatus(
        id,
        status,
        remarks,
        applicantMessage
      );
      setApplication(result.data);
      toast.success(result.message || `Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const requestDocumentUpdates = async () => {
    if (!id) return;
    if (!applicantMessage.trim()) {
      toast.error("Write a message the applicant will see");
      return;
    }
    setBusy(true);
    try {
      const result = await studentApplicationsAPI.updateStatus(
        id,
        "Action Required",
        remarks,
        applicantMessage.trim()
      );
      setApplication(result.data);
      toast.success("Sent to applicant — they can edit and press Send updates on the track page");
    } catch {
      toast.error("Failed to notify applicant");
    } finally {
      setBusy(false);
    }
  };

  const copyTrackLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      toast.success("Track link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const promote = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const result = await studentApplicationsAPI.promote(id);
      const dossier = result.data;
      toast.success(result.message || "Moved to Fee & Enrollment");
      navigate(`/admissions/dossier/${dossier.admissionId || dossier._id}`, {
        state: { from: application?.source === "public" ? "online" : "offline" },
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to promote application";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">Application not found.</p>
        <Button asChild variant="outline">
          <Link to={backPath}>{backLabel}</Link>
        </Button>
      </div>
    );
  }

  const dossierRef = application.admissionDossierId;
  const dossierId =
    dossierRef == null
      ? undefined
      : typeof dossierRef === "object"
        ? dossierRef.admissionId || dossierRef._id
        : dossierRef;

  const previous =
    application.previousEducation?.[0]?.institution ||
    application.previousEducation?.[0]?.degree ||
    application.previousDegree
      ? [
          application.previousEducation?.[0]?.institution,
          application.previousEducation?.[0]?.degree || application.previousDegree,
          application.previousEducation?.[0]?.grade || application.previousMarks,
        ]
          .filter(Boolean)
          .join(" — ")
      : "—";

  const emailBody = `Dear ${application.firstName},

${applicantMessage.trim()}

Please open:
${trackUrl}

Use Application ID: ${application.applicationId}
and your CNIC to track and re-upload the rejected document(s).

You do not need to submit a new application.
`;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0 h-auto">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {application.firstName} {application.lastName}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{application.applicationId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {application.source === "public" ? "Online apply" : "Offline"}
          </Badge>
          <Badge className="text-sm">{application.status}</Badge>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <DetailCard title="Personal">
          <FieldRow label="Email" value={application.email} />
          <FieldRow label="Phone" value={application.phone} />
          <FieldRow label="CNIC" value={application.cnic} />
          <FieldRow
            label="Date of birth"
            value={
              application.dateOfBirth
                ? new Date(application.dateOfBirth).toLocaleDateString()
                : undefined
            }
          />
          <FieldRow label="Gender" value={application.gender} />
          <FieldRow label="Nationality" value={application.nationality} />
          <FieldRow label="Religion" value={application.religion} />
        </DetailCard>

        <DetailCard title="Program">
          <FieldRow
            label="Program"
            value={
              application.programId && typeof application.programId === "object"
                ? application.programId.name
                : undefined
            }
          />
          <FieldRow
            label="Campus"
            value={
              application.campusId && typeof application.campusId === "object"
                ? application.campusId.name
                : undefined
            }
          />
          <FieldRow label="Previous" value={previous} />
        </DetailCard>

        <DetailCard title="Guardian">
          <FieldRow label="Father" value={application.guardian?.fatherName} />
          <FieldRow label="Mother" value={application.guardian?.motherName} />
          <FieldRow label="Guardian" value={application.guardian?.guardianName} />
          <FieldRow label="Phone" value={application.guardian?.guardianPhone} />
          <FieldRow label="Relation" value={application.guardian?.guardianRelation} />
        </DetailCard>

        <DetailCard title="Address">
          <FieldRow label="Street" value={application.address?.street} />
          <FieldRow label="City" value={application.address?.city} />
          <FieldRow label="State" value={application.address?.state} />
          <FieldRow label="Postal" value={application.address?.postalCode} />
          <FieldRow label="Country" value={application.address?.country} />
        </DetailCard>
      </div>

      <ApplicationDocumentsPanel
        applicationId={application.applicationId || application._id || id!}
        ownerLabel={application.applicationId}
      />

      {["Accepted", "Promoted", "Shortlisted"].includes(application.status) ? (
        <AdmissionFeePanel
          mode="application"
          recordId={application.applicationId || application._id || id!}
        />
      ) : null}

      {application.applicantReply ? (
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-primary">
            Reply from applicant
          </h3>
          <p className="text-sm whitespace-pre-wrap">{application.applicantReply}</p>
          {application.applicantRepliedAt ? (
            <p className="text-xs text-muted-foreground">
              Received {new Date(application.applicantRepliedAt).toLocaleString()}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 md:p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-amber-900 dark:text-amber-200">
            Send to applicant
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tell them what to fix (wrong phone, city, photo, etc.). They open the track link, edit
            fields and/or replace documents, then press <strong>Send updates</strong> — data comes
            back here Under Review.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Message to applicant</Label>
          <Textarea
            value={applicantMessage}
            onChange={(e) => setApplicantMessage(e.target.value)}
            rows={3}
            placeholder="e.g. Please correct your phone number and replace the profile photo…"
          />
        </div>

        <div className="rounded-lg border bg-background/80 p-3 space-y-2 text-sm">
          <p className="font-medium">Share this with them</p>
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            <li>
              Open <span className="font-mono text-foreground break-all">{trackUrl}</span>
            </li>
            <li>
              Enter ID{" "}
              <span className="font-mono text-foreground">{application.applicationId}</span> and
              CNIC
            </li>
            <li>Edit fields / replace files → Send updates</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={copyTrackLink}>
              <Copy className="h-4 w-4" /> Copy track link
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a
                href={`mailto:${application.email}?subject=${encodeURIComponent(
                  `Action required: ${application.applicationId}`
                )}&body=${encodeURIComponent(emailBody)}`}
              >
                Open email draft
              </a>
            </Button>
          </div>
        </div>

        <Button type="button" disabled={busy} onClick={requestDocumentUpdates}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to applicant
        </Button>
      </section>

      <section className="rounded-xl border bg-card p-4 md:p-5 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Internal remarks
        </h3>
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          placeholder="Staff-only notes (not shown to applicant)…"
        />
      </section>

      <section className="rounded-xl border bg-card p-4 md:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Decision
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_ACTIONS.map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => updateStatus(status)}
            >
              Mark {status}
            </Button>
          ))}
        </div>
        <div className="pt-3 border-t flex flex-wrap gap-2">
          {dossierId ? (
            <Button asChild>
              <Link to={`/admissions/dossier/${dossierId}`}>
                <FileText className="h-4 w-4" /> Open Fee &amp; Enrollment
              </Link>
            </Button>
          ) : (
            <Button
              disabled={busy || !["Accepted", "Shortlisted"].includes(application.status)}
              onClick={promote}
            >
              Promote to Fee &amp; Enrollment
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
