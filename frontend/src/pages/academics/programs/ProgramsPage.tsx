import { useState, useEffect, useMemo } from "react";
import { programAPI, type Program } from "@/features/programs";
import { departmentAPI, type Department } from "@/features/departments";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Layers, Building2, BookOpen, RefreshCw, UserPlus, X, Save,
  Loader2, Pencil, Trash2, AlertCircle, Search, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

type ProgramFormData = {
  name: string;
  code: string;
  departmentId: string;
  degreeLevel: string;
  duration: number;
  totalCredits: number;
  description: string;
};

const EMPTY_FORM: ProgramFormData = {
  name: "", code: "", departmentId: "", degreeLevel: "BS",
  duration: 8, totalCredits: 0, description: ""
};

const DEGREE_LEVELS = ["BS", "MS", "PhD", "BBA", "MBA", "LLB", "Other"];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, deptRes] = await Promise.all([
        programAPI.getAll(),
        departmentAPI.getAll()
      ]);
      setPrograms(progRes?.data || []);
      setDepartments(deptRes?.data || []);
      const progStats = await programAPI.getStats();
      setStats(progStats?.data || { total: 0, active: 0, inactive: 0 });
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return programs;
    const q = search.toLowerCase();
    return programs.filter(p =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [programs, search]);

  const getDeptName = (dept: Program["departmentId"]) => {
    if (!dept) return "—";
    if (typeof dept === "object") return dept.name;
    const found = departments.find(d => d._id === dept);
    return found?.name || dept;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Program) => {
    setForm({
      name: p.name,
      code: p.code,
      departmentId: typeof p.departmentId === "object" ? p.departmentId._id : p.departmentId,
      degreeLevel: p.degreeLevel,
      duration: p.duration,
      totalCredits: p.totalCredits || 0,
      description: p.description || ""
    });
    setEditingId(p._id!);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.departmentId || !form.degreeLevel) {
      toast.error("Name, code, department and degree level are required");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await programAPI.update(editingId, form);
        toast.success("Program updated");
      } else {
        await programAPI.create(form);
        toast.success("Program created");
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    try {
      await programAPI.delete(id);
      toast.success("Program deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const columns: Column<Program>[] = [
    { key: "code", header: "Code", cell: (p) => <span className="font-mono font-semibold">{p.code}</span> },
    { key: "name", header: "Name" },
    { key: "departmentId", header: "Department", cell: (p) => getDeptName(p.departmentId) },
    { key: "degreeLevel", header: "Degree", cell: (p) => <Badge variant="outline">{p.degreeLevel}</Badge> },
    { key: "duration", header: "Duration", cell: (p) => `${p.duration} sem` },
    { key: "totalCredits", header: "Credits", cell: (p) => p.totalCredits || 0 },
    {
      key: "status", header: "Status",
      cell: (p) => <Badge variant={p.status === "Active" ? "default" : "secondary"}>{p.status || "Active"}</Badge>
    },
    {
      key: "_id", header: "Actions",
      cell: (p) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(p._id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-muted-foreground">Manage academic programs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button size="sm" onClick={openCreate}><UserPlus className="h-4 w-4 mr-1" />Add Program</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Programs" value={stats.total} icon={Layers} />
        <KpiCard label="Active" value={stats.active} icon={BookOpen} />
        <KpiCard label="Inactive" value={stats.inactive} icon={Building2} />
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Program" : "Create Program"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Program Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <Label>Code *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. BSCS" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Degree Level *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={form.degreeLevel}
                    onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })}
                  >
                    {DEGREE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (semesters)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Total Credits</Label>
                  <Input type="number" value={form.totalCredits} onChange={(e) => setForm({ ...form, totalCredits: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
