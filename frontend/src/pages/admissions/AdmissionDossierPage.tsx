import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdmissionApiError,
  STUDENT_DOCUMENT_TYPE_LABELS,
  studentAdmissionsAPI,
  type StudentAdmissionDossier,
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import { batchAPI } from "@/features/batches";
import AdmissionDocumentsPanel from "./AdmissionDocumentsPanel";

const REQUIRED_FIELDS: Array<{ key: string; label: string; check: (d: StudentAdmissionDossier) => boolean }> = [
  { key: "firstName", label: "First name", check: (d) => !!d.firstName },
  { key: "lastName", label: "Last name", check: (d) => !!d.lastName },
  { key: "email", label: "Email", check: (d) => !!d.email },
  { key: "phone", label: "Phone", check: (d) => !!d.phone },
  { key: "cnic", label: "CNIC", check: (d) => !!d.cnic },
  { key: "dateOfBirth", label: "Date of birth", check: (d) => !!d.dateOfBirth },
  { key: "gender", label: "Gender", check: (d) => !!d.gender },
  { key: "batchId", label: "Batch", check: (d) => !!(typeof d.batchId === "object" ? d.batchId?._id : d.batchId) },
  { key: "guardian.fatherName", label: "Father name", check: (d) => !!d.guardian?.fatherName },
  { key: "address.city", label: "City", check: (d) => !!d.address?.city },
];

export default function AdmissionDossierPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<StudentAdmissionDossier | null>(null);
  const [batches, setBatches] = useState<Array<{ _id: string; code: string; year: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

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
        setBatches(batchRes?.data || batchRes || []);
      } catch {
        toast.error("Admission dossier not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const missingFields = useMemo(
    () => (dossier ? REQUIRED_FIELDS.filter((field) => !field.check(dossier)) : []),
    [dossier]
  );

  const canComplete = dossier?.status !== "Enrolled" && missingFields.length === 0;

  const updateField = (key: string, value: unknown) => {
    if (!dossier) return;
    setDossier({ ...dossier, [key]: value });
  };

  const updateNested = (parent: "guardian" | "address", key: string, value: string) => {
    if (!dossier) return;
    setDossier({
      ...dossier,
      [parent]: { ...(dossier[parent] || {}), [key]: value },
    });
  };

  const handleSave = async () => {
    if (!id || !dossier) return;
    setSaving(true);
    try {
      const updated = await studentAdmissionsAPI.updateDossier(id, dossier);
      setDossier(updated);
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
      const saved = await studentAdmissionsAPI.updateDossier(id, dossier);
      setDossier(saved);
      const result = await studentAdmissionsAPI.completeAdmission(id);
      toast.success(result?.message || "Student created");
      const student = result?.data;
      navigate(`/students/${student?.studentId || student?._id}`);
    } catch (err: unknown) {
      const data = getAdmissionApiError(err);
      const parts = [data?.message];
      if (data?.missingFields?.length) parts.push(`Missing fields: ${data.missingFields.join(", ")}`);
      if (data?.missingDocuments?.length) {
        parts.push(
          `Missing documents: ${data.missingDocuments.map((type) => STUDENT_DOCUMENT_TYPE_LABELS[type as StudentDocumentType] || type).join(", ")}`
        );
      }
      toast.error(parts.filter(Boolean).join(" — "));
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!dossier) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">Admission dossier not found.</p>
        <Button asChild variant="outline"><Link to="/admissions">Back to pipeline</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/admissions"><ArrowLeft className="h-4 w-4" /> Back to pipeline</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{dossier.firstName} {dossier.lastName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{dossier.admissionId}</p>
        </div>
        <Badge>{dossier.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3 border rounded-lg p-4">
          <h3 className="font-semibold">Personal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First name</Label><Input value={dossier.firstName} onChange={(e) => updateField("firstName", e.target.value)} /></div>
            <div><Label>Last name</Label><Input value={dossier.lastName} onChange={(e) => updateField("lastName", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={dossier.email} onChange={(e) => updateField("email", e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={dossier.phone} onChange={(e) => updateField("phone", e.target.value)} /></div>
            <div><Label>CNIC</Label><Input value={dossier.cnic} onChange={(e) => updateField("cnic", e.target.value)} /></div>
            <div>
              <Label>Gender</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={dossier.gender || ""} onChange={(e) => updateField("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div><Label>Date of birth</Label><Input type="date" value={dossier.dateOfBirth ? dossier.dateOfBirth.slice(0, 10) : ""} onChange={(e) => updateField("dateOfBirth", e.target.value)} /></div>
            <div><Label>Nationality</Label><Input value={dossier.nationality || ""} onChange={(e) => updateField("nationality", e.target.value)} /></div>
          </div>
        </div>

        <div className="space-y-3 border rounded-lg p-4">
          <h3 className="font-semibold">Guardian & address</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Father name</Label><Input value={dossier.guardian?.fatherName || ""} onChange={(e) => updateNested("guardian", "fatherName", e.target.value)} /></div>
            <div><Label>Mother name</Label><Input value={dossier.guardian?.motherName || ""} onChange={(e) => updateNested("guardian", "motherName", e.target.value)} /></div>
            <div className="col-span-2"><Label>City</Label><Input value={dossier.address?.city || ""} onChange={(e) => updateNested("address", "city", e.target.value)} /></div>
            <div className="col-span-2"><Label>Street</Label><Input value={dossier.address?.street || ""} onChange={(e) => updateNested("address", "street", e.target.value)} /></div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Program assignment</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Program</Label>
            <Input disabled value={typeof dossier.programId === "object" ? dossier.programId.name : ""} />
          </div>
          <div>
            <Label>Campus</Label>
            <Input disabled value={typeof dossier.campusId === "object" ? dossier.campusId.name : ""} />
          </div>
          <div>
            <Label>Batch *</Label>
            <select
              className="w-full h-10 rounded-md border px-3 text-sm"
              value={typeof dossier.batchId === "object" ? dossier.batchId?._id : dossier.batchId || ""}
              onChange={(e) => updateField("batchId", e.target.value)}
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>{batch.code} ({batch.year})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Remarks</Label>
          <Textarea value={dossier.remarks || ""} onChange={(e) => updateField("remarks", e.target.value)} rows={2} />
        </div>
      </div>

      <AdmissionDocumentsPanel dossierId={id!} ownerLabel={dossier.admissionId} />

      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <h3 className="font-semibold">Completion checklist</h3>
        <p className="text-sm text-muted-foreground">
          Save the dossier with all required fields before completing admission. Documents are optional for now.
        </p>
        <div className="text-sm">
          <p className="font-medium mb-2">Required fields</p>
          <ul className="space-y-1">
            {REQUIRED_FIELDS.map((field) => {
              const done = dossier ? field.check(dossier) : false;
              return (
                <li key={field.key} className="flex items-center gap-2">
                  {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={done ? "" : "text-amber-700 dark:text-amber-400"}>{field.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
        {!canComplete && dossier.status !== "Enrolled" && missingFields.length > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Missing fields: {missingFields.map((f) => f.label).join(", ")}.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button onClick={handleSave} disabled={saving || dossier.status === "Enrolled"}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save dossier
        </Button>
        {dossier.status !== "Enrolled" && (
          <Button variant="default" onClick={handleComplete} disabled={completing || !canComplete}>
            {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
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
