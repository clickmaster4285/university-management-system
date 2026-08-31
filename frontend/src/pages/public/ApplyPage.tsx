import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, GraduationCap, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  studentApplicationsAPI,
  type PublicCatalogCampus,
  type PublicCatalogProgram,
  type PublicCatalogSession,
} from "@/features/studentApplications";

export default function ApplyPage() {
  const [programs, setPrograms] = useState<PublicCatalogProgram[]>([]);
  const [campuses, setCampuses] = useState<PublicCatalogCampus[]>([]);
  const [sessions, setSessions] = useState<PublicCatalogSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    programId: "",
    campusId: "",
    academicSessionId: "",
    previousDegree: "",
    previousMarks: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [programList, campusList, sessionList] = await Promise.all([
          studentApplicationsAPI.getPublicPrograms(),
          studentApplicationsAPI.getPublicCampuses(),
          studentApplicationsAPI.getPublicSessions(),
        ]);
        setPrograms(programList);
        setCampuses(campusList);
        setSessions(sessionList);
      } catch {
        toast.error("Failed to load application form options");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.cnic || !form.programId || !form.campusId) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const result = await studentApplicationsAPI.submitPublicApplication({
        ...form,
        academicSessionId: form.academicSessionId || undefined,
      });
      setSubmittedId(result?.data?.applicationId);
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
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-brand mb-4">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Apply for admission</h1>
          <p className="text-muted-foreground mt-2">
            Submit your basic details. No login required.
          </p>
        </div>

        {submittedId ? (
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-semibold">Application received</h2>
            <p className="text-muted-foreground">
              Save your application ID to track status:
            </p>
            <p className="text-2xl font-mono font-bold text-primary">{submittedId}</p>
            <Button asChild>
              <Link to={`/apply/status?applicationId=${submittedId}`}>Track status</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First name *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last name *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>CNIC *</Label>
              <Input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} placeholder="12345-1234567-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Program *</Label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.programId}
                  onChange={(e) => setForm({ ...form, programId: e.target.value })}
                >
                  <option value="">Select program</option>
                  {programs.map((program) => (
                    <option key={program._id} value={program._id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Campus *</Label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.campusId}
                  onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                >
                  <option value="">Select campus</option>
                  {campuses.map((campus) => (
                    <option key={campus._id} value={campus._id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Intake session (optional)</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.academicSessionId}
                onChange={(e) => setForm({ ...form, academicSessionId: e.target.value })}
              >
                <option value="">Any open session</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Previous degree (optional)</Label>
                <Input value={form.previousDegree} onChange={(e) => setForm({ ...form, previousDegree: e.target.value })} />
              </div>
              <div>
                <Label>Marks / grade (optional)</Label>
                <Input value={form.previousMarks} onChange={(e) => setForm({ ...form, previousMarks: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-brand text-white border-0" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit application
            </Button>
          </form>
        )}
    </div>
  );
}
