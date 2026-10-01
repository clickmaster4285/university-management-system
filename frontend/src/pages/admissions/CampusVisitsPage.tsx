import { useCallback, useEffect, useState } from "react";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { campusAPI, type Campus } from "@/features/campus";
import { programAPI, type Program } from "@/features/programs";
import {
  campusVisitsAPI,
  type CampusVisit,
  type CampusVisitPurpose,
  type CampusVisitStatus,
} from "@/features/campusVisits";

const PURPOSES: CampusVisitPurpose[] = ["Info", "Tour", "Counseling", "Other"];
const STATUSES: CampusVisitStatus[] = ["New", "Follow-up", "Closed", "Converted"];

const emptyForm = () => ({
  visitorName: "",
  phone: "",
  email: "",
  campusId: "",
  interestedProgramId: "",
  purpose: "Info" as CampusVisitPurpose,
  notes: "",
  visitedAt: new Date().toISOString().slice(0, 10),
  status: "New" as CampusVisitStatus,
});

const refLabel = (value: CampusVisit["campusId"]) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || "—";
  return value;
};

export default function CampusVisitsPage() {
  const [visits, setVisits] = useState<CampusVisit[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 200 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await campusVisitsAPI.list(params);
      setVisits(res.data || []);
    } catch {
      toast.error("Failed to load campus visits");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([campusAPI.getAll(), programAPI.getAll({ limit: 500 })])
      .then(([campusRes, programRes]) => {
        const campusList = Array.isArray(campusRes)
          ? campusRes
          : Array.isArray((campusRes as { data?: Campus[] })?.data)
            ? (campusRes as { data: Campus[] }).data
            : [];
        setCampuses(campusList);
        setPrograms(programRes?.data || []);
      })
      .catch(() => undefined);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName.trim()) {
      toast.error("Visitor name is required");
      return;
    }
    setSaving(true);
    try {
      await campusVisitsAPI.create({
        ...form,
        campusId: form.campusId || undefined,
        interestedProgramId: form.interestedProgramId || undefined,
      });
      toast.success("Visit logged");
      setForm(emptyForm());
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to save visit"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (visit: CampusVisit, status: CampusVisitStatus) => {
    const id = visit._id || visit.visitId;
    try {
      await campusVisitsAPI.update(id, { status });
      toast.success("Status updated");
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const remove = async (visit: CampusVisit) => {
    const id = visit._id || visit.visitId;
    if (!confirm(`Remove visit ${visit.visitId}?`)) return;
    try {
      await campusVisitsAPI.remove(id);
      toast.success("Visit removed");
      load();
    } catch {
      toast.error("Failed to remove visit");
    }
  };

  const columns: Column<CampusVisit>[] = [
    {
      key: "visitorName",
      header: "Visitor",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.visitorName}</div>
          <div className="text-xs font-mono text-muted-foreground">{row.visitId}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="text-sm">
          <div>{row.phone || "—"}</div>
          <div className="text-xs text-muted-foreground">{row.email || ""}</div>
        </div>
      ),
    },
    {
      key: "campusId",
      header: "Campus",
      cell: (row) => refLabel(row.campusId),
    },
    {
      key: "purpose",
      header: "Purpose",
      cell: (row) => row.purpose || "Info",
    },
    {
      key: "visitedAt",
      header: "Visited",
      cell: (row) => (row.visitedAt ? String(row.visitedAt).slice(0, 10) : "—"),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <select
          className="h-8 rounded-md border px-2 text-xs bg-background"
          value={row.status || "New"}
          onChange={(e) => updateStatus(row, e.target.value as CampusVisitStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button size="sm" variant="ghost" onClick={() => remove(row)} title="Remove">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Campus visits
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            People who came only for information or a tour — not applicants. If they decide to
            apply, create an <strong>offline</strong> or send them to <strong>online</strong> apply.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Log visit
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-2xl p-5 space-y-4 border">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.visitorName}
                onChange={(e) => setForm((f) => ({ ...f, visitorName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Campus</Label>
              <select
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                value={form.campusId}
                onChange={(e) => setForm((f) => ({ ...f, campusId: e.target.value }))}
              >
                <option value="">Any / not specified</option>
                {campuses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Interested program</Label>
              <select
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                value={form.interestedProgramId}
                onChange={(e) => setForm((f) => ({ ...f, interestedProgramId: e.target.value }))}
              >
                <option value="">None yet</option>
                {programs.map((p) => (
                  <option key={p._id || p.programId} value={p._id || p.programId}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <select
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                value={form.purpose}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purpose: e.target.value as CampusVisitPurpose }))
                }
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Visit date</Label>
              <Input
                type="date"
                value={form.visitedAt}
                onChange={(e) => setForm((f) => ({ ...f, visitedAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="What they asked about…"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save visit
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name, phone, email, visit ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="h-10 rounded-md border px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Badge variant="secondary" className="h-10 px-3 items-center">
          Info only — not an application
        </Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No visits logged yet. Use Log visit when someone comes only for information.
        </div>
      ) : (
        <DataTable columns={columns} data={visits} />
      )}
    </div>
  );
}
