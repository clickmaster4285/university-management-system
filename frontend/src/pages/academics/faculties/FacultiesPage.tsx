import { useState, useEffect } from "react";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { campusAPI, type Campus } from "@/features/campus";
import { teacherAPI, type Teacher } from "@/features/teachers";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Users, BookOpen, RefreshCw, UserPlus, X, Save,
  Loader2, Pencil, Trash2, GraduationCap
} from "lucide-react";
import { toast } from "sonner";

type FacultyFormData = {
  name: string;
  code: string;
  campusId: string;
  headId: string;
  description: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
};

const EMPTY_FORM: FacultyFormData = {
  name: "", code: "", campusId: "", headId: "",
  description: "", email: "", phone: "", status: "Active"
};

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FacultyFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, campRes, teachRes] = await Promise.all([
        facultyAPI.getAll(),
        campusAPI.getAll(),
        teacherAPI.getAll()
      ]);
      setFaculties(facRes?.data || []);
      setCampuses(Array.isArray(campRes?.data) ? campRes.data : []);
      setTeachers(teachRes?.data || []);
      const facStats = await facultyAPI.getStats();
      setStats(facStats?.data || { total: 0, active: 0, inactive: 0 });
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getCampusName = (campus: Faculty["campusId"]) => {
    if (!campus) return "—";
    if (typeof campus === "object") return campus.name;
    const found = campuses.find(c => c._id === campus);
    return found?.name || campus;
  };

  const getHeadName = (head: Faculty["headId"]) => {
    if (!head) return "—";
    if (typeof head === "object") return head.name;
    const found = teachers.find(t => t._id === head);
    return found?.name || head;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (f: Faculty) => {
    setForm({
      name: f.name,
      code: f.code,
      campusId: typeof f.campusId === "object" ? f.campusId._id : (f.campusId || ""),
      headId: typeof f.headId === "object" ? f.headId._id : (f.headId || ""),
      description: f.description || "",
      email: f.email || "",
      phone: f.phone || "",
      status: f.status || "Active"
    });
    setEditingId(f._id!);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.campusId) {
      toast.error("Name, code and campus are required");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await facultyAPI.update(editingId, form);
        toast.success("Faculty updated");
      } else {
        await facultyAPI.create(form);
        toast.success("Faculty created");
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
    if (!confirm("Delete this faculty? Departments under it will be unaffected.")) return;
    try {
      await facultyAPI.delete(id);
      toast.success("Faculty deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const columns: Column<Faculty>[] = [
    { key: "code", header: "Code", cell: (f) => <span className="font-mono font-semibold">{f.code}</span> },
    { key: "name", header: "Name" },
    { key: "campusId", header: "Campus", cell: (f) => getCampusName(f.campusId) },
    { key: "headId", header: "Head", cell: (f) => getHeadName(f.headId) },
    { key: "email", header: "Email", cell: (f) => f.email || "—" },
    {
      key: "status", header: "Status",
      cell: (f) => <Badge variant={f.status === "Active" ? "default" : "secondary"}>{f.status || "Active"}</Badge>
    },
    {
      key: "_id", header: "Actions",
      cell: (f) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(f._id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Faculties" value={stats.total} icon={Building2} />
        <KpiCard label="Active" value={stats.active} icon={BookOpen} />
        <KpiCard label="Inactive" value={stats.inactive} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={columns}
          data={faculties}
          searchKeys={["name", "code"]}
          addLabel="Create Faculty"
          onAdd={openCreate}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Faculty" : "Create Faculty"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Faculty Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Faculty of Computing" />
                </div>
                <div>
                  <Label>Code *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. FOC" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Campus *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={form.campusId}
                    onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                  >
                    <option value="">Select campus</option>
                    {campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Head of Faculty</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={form.headId}
                    onChange={(e) => setForm({ ...form, headId: e.target.value })}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="faculty@university.edu.pk" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92-42-35608000" />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
    </>
  );
}
