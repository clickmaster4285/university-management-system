import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  studentApplicationsAPI,
  type ApplicationStatus,
  type StudentApplication,
} from "@/features/studentApplications";

const STATUS_ACTIONS: ApplicationStatus[] = [
  "Under Review",
  "Shortlisted",
  "Accepted",
  "Rejected",
];

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<StudentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await studentApplicationsAPI.getById(id);
      setApplication(data);
      setRemarks(data.remarks || "");
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
      const updated = await studentApplicationsAPI.updateStatus(id, status, remarks);
      setApplication(updated);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const promote = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const dossier = await studentApplicationsAPI.promote(id);
      toast.success("Admission dossier created");
      navigate(`/admissions/dossier/${dossier.admissionId || dossier._id}`);
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
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">Application not found.</p>
        <Button asChild variant="outline"><Link to="/admissions">Back to pipeline</Link></Button>
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

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/admissions"><ArrowLeft className="h-4 w-4" /> Back to pipeline</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{application.firstName} {application.lastName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{application.applicationId}</p>
        </div>
        <Badge className="text-sm">{application.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="border rounded-lg p-4 space-y-2">
          <p><span className="text-muted-foreground">Email:</span> {application.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {application.phone}</p>
          <p><span className="text-muted-foreground">CNIC:</span> {application.cnic}</p>
          <p><span className="text-muted-foreground">Source:</span> {application.source}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <p><span className="text-muted-foreground">Program:</span> {application.programId && typeof application.programId === "object" ? application.programId.name : "—"}</p>
          <p><span className="text-muted-foreground">Campus:</span> {application.campusId && typeof application.campusId === "object" ? application.campusId.name : "—"}</p>
          {application.previousDegree && <p><span className="text-muted-foreground">Previous:</span> {application.previousDegree} {application.previousMarks}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Internal remarks</label>
        <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_ACTIONS.map((status) => (
          <Button key={status} variant="outline" disabled={busy} onClick={() => updateStatus(status)}>
            Mark {status}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {dossierId ? (
          <Button asChild>
            <Link to={`/admissions/dossier/${dossierId}`}>
              <FileText className="h-4 w-4" /> Open admission dossier
            </Link>
          </Button>
        ) : (
          <Button disabled={busy || !["Accepted", "Shortlisted"].includes(application.status)} onClick={promote}>
            Promote to admission dossier
          </Button>
        )}
      </div>
    </div>
  );
}
