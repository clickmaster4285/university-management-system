import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  workforceAPI,
  type ApplicantStatus,
  type RecruitmentPosting,
} from "@/features/workforce";

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const;
const APPLICANT_STATUSES: ApplicantStatus[] = [
  'Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Hired',
];

export default function WorkforceRecruitmentPage() {
  const [postings, setPostings] = useState<RecruitmentPosting[]>([]);
  const [stats, setStats] = useState({ open: 0, interviewing: 0, filled: 0, totalApplicants: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<RecruitmentPosting | null>(null);
  const [applicantForm, setApplicantForm] = useState({ name: '', email: '', phone: '' });
  const [form, setForm] = useState({
    title: '',
    department: '',
    type: 'Full-time' as (typeof JOB_TYPES)[number],
    description: '',
    closingDate: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, recruitmentStats] = await Promise.all([
        workforceAPI.listRecruitments(),
        workforceAPI.getRecruitmentStats(),
      ]);
      setPostings(list);
      setStats(recruitmentStats);
    } catch {
      toast.error('Failed to load recruitment postings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!form.title || !form.department || !form.description) {
      toast.error('Title, department, and description are required');
      return;
    }
    try {
      await workforceAPI.createRecruitment({
        ...form,
        closingDate: form.closingDate || undefined,
        status: 'Open',
      });
      toast.success('Job posting created');
      setShowForm(false);
      setForm({ title: '', department: '', type: 'Full-time', description: '', closingDate: '' });
      await loadData();
    } catch {
      toast.error('Failed to create posting');
    }
  };

  const handleAddApplicant = async () => {
    if (!selected?._id || !applicantForm.name || !applicantForm.email) return;
    try {
      const updated = await workforceAPI.addApplicant(selected._id, applicantForm);
      setSelected(updated);
      setApplicantForm({ name: '', email: '', phone: '' });
      toast.success('Applicant added');
      await loadData();
    } catch {
      toast.error('Failed to add applicant');
    }
  };

  const handleApplicantStatus = async (applicantId: string, status: ApplicantStatus) => {
    if (!selected?._id) return;
    try {
      const updated = await workforceAPI.updateApplicantStatus(selected._id, applicantId, status);
      setSelected(updated);
      await loadData();
    } catch {
      toast.error('Failed to update applicant');
    }
  };

  const handleHire = async (applicantId: string) => {
    if (!selected?._id) return;
    try {
      await workforceAPI.hireApplicant(selected._id, applicantId);
      toast.success('Applicant hired — staff record created');
      const refreshed = await workforceAPI.getRecruitment(selected._id);
      setSelected(refreshed);
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to hire applicant';
      toast.error(message);
    }
  };

  const columns: Column<RecruitmentPosting>[] = [
    {
      key: 'title',
      header: 'Position',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.positionId}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Department', cell: (row) => row.department },
    { key: 'type', header: 'Type', cell: (row) => <Badge variant="outline">{row.type}</Badge> },
    {
      key: 'applicants',
      header: 'Applicants',
      cell: (row) => row.applicants?.length || 0,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <Badge>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setSelected(row)}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Recruitment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Job postings, applicants, and hire-to-staff workflow.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/workforce">Back to workforce</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KpiCard label="Open positions" value={stats.open} icon={Briefcase} />
        <KpiCard label="Interviewing" value={stats.interviewing} icon={Briefcase} tone="warning" />
        <KpiCard label="Filled" value={stats.filled} icon={Briefcase} tone="success" />
        <KpiCard label="Total applicants" value={stats.totalApplicants} icon={UserPlus} />
      </div>

      {showForm && (
        <div className="mb-6 border rounded-lg p-4 space-y-4 bg-muted/20">
          <h3 className="font-semibold">New job posting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as typeof form.type }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Closing date</Label>
              <Input type="date" value={form.closingDate} onChange={(e) => setForm((p) => ({ ...p, closingDate: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Create posting</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {selected && (
        <div className="mb-6 border rounded-lg p-4 space-y-4 bg-muted/10">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h3 className="font-semibold">{selected.title}</h3>
              <p className="text-sm text-muted-foreground">{selected.department} · {selected.type}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Applicant name" value={applicantForm.name} onChange={(e) => setApplicantForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Email" value={applicantForm.email} onChange={(e) => setApplicantForm((p) => ({ ...p, email: e.target.value }))} />
            <Input placeholder="Phone" value={applicantForm.phone} onChange={(e) => setApplicantForm((p) => ({ ...p, phone: e.target.value }))} />
            <Button onClick={handleAddApplicant}>Add applicant</Button>
          </div>

          <div className="space-y-2">
            {(selected.applicants || []).map((applicant) => (
              <div key={applicant._id} className="flex flex-wrap items-center justify-between gap-2 border rounded p-3">
                <div>
                  <p className="font-medium">{applicant.name}</p>
                  <p className="text-xs text-muted-foreground">{applicant.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{applicant.status}</Badge>
                  {APPLICANT_STATUSES.filter((s) => s !== applicant.status).map((status) => (
                    <Button key={status} size="sm" variant="ghost" onClick={() => applicant._id && handleApplicantStatus(applicant._id, status)}>
                      {status}
                    </Button>
                  ))}
                  {applicant.status !== 'Hired' && applicant._id && (
                    <Button size="sm" onClick={() => handleHire(applicant._id!)}>Hire</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Job postings"
          description="Open roles and applicant pipeline"
          data={postings}
          columns={columns}
          searchKeys={["title", "department", "positionId", "status"]}
          pageSize={10}
          addLabel="New posting"
          onAdd={() => setShowForm(true)}
        />
      )}
    </>
  );
}
