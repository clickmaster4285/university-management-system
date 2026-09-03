import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { campusAPI, type Campus } from "@/features/campus";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, BookOpen, X, Save,
  Loader2, Pencil, Trash2, Eye, BarChart3 } from "lucide-react";
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

const getFacultyId = (faculty: Faculty) => faculty._id || faculty.facultyId || "";

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const buildPayload = (form: FacultyFormData): Partial<Faculty> => ({
  name: form.name.trim(),
  code: form.code.trim(),
  campusId: form.campusId,
  description: form.description.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  status: form.status,
  headId: form.headId || undefined,
});

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FacultyFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [campusFilter, setCampusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null);
  const [viewingFacultyDetail, setViewingFacultyDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, campRes, staffRes] = await Promise.all([
        facultyAPI.getAll(),
        campusAPI.getAll(),
        staffMemberAPI.listAcademic(),
      ]);
      setFaculties(facRes?.data || []);
      setCampuses(Array.isArray(campRes?.data) ? campRes.data : []);
      setStaffMembers(staffRes);
      const facStats = await facultyAPI.getStats();
      setStats(facStats?.data || { total: 0, active: 0, inactive: 0 });
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredFaculties = useMemo(() => {
    return faculties.filter((f) => {
      if (statusFilter !== "all" && (f.status || "Active") !== statusFilter) return false;
      if (campusFilter !== "all") {
        const campusId = resolveRefId(f.campusId as string | { _id: string } | null | undefined);
        if (campusId !== campusFilter) return false;
      }
      return true;
    });
  }, [faculties, campusFilter, statusFilter]);

  const clearFilters = () => {
    setCampusFilter("all");
    setStatusFilter("all");
  };

  const getCampusName = (campus: Faculty["campusId"]) => {
    if (!campus) return "—";
    if (typeof campus === "object") return campus.name;
    const found = campuses.find(c => c._id === campus);
    return found?.name || campus;
  };

  const getHeadName = (head: Faculty["headId"]) => {
    if (!head) return "—";
    if (typeof head === "object") {
      return getStaffDisplayName({
        firstName: (head as { firstName?: string }).firstName || "",
        lastName: (head as { lastName?: string }).lastName || "",
        fullName: (head as { name?: string }).name,
      });
    }
    const found = staffMembers.find((member) => member._id === head);
    return found ? getStaffDisplayName(found) : head;
  };

  const openViewFaculty = async (f: Faculty) => {
    const id = getFacultyId(f);
    if (!id) {
      setViewingFaculty(f);
      return;
    }
    setViewingFaculty(f);
    setLoadingDetail(true);
    try {
      const res = await facultyAPI.getById(id);
      setViewingFacultyDetail(res?.data || f);
    } catch {
      setViewingFacultyDetail(f);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (f: Faculty) => {
    const id = getFacultyId(f);
    if (!id) {
      toast.error("Cannot edit faculty: missing ID");
      return;
    }
    setForm({
      name: f.name,
      code: f.code,
      campusId: resolveRefId(f.campusId as string | { _id: string } | null | undefined),
      headId: resolveRefId(f.headId as string | { _id: string } | null | undefined),
      description: f.description || "",
      email: f.email || "",
      phone: f.phone || "",
      status: f.status || "Active"
    });
    setEditingId(id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.campusId) {
      toast.error("Name, code and campus are required");
      return;
    }
    try {
      setSaving(true);
      const payload = buildPayload(form);
      if (editingId) {
        await facultyAPI.update(editingId, payload);
        toast.success("Faculty updated");
      } else {
        await facultyAPI.create(payload);
        toast.success("Faculty created");
      }
      closeForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faculty: Faculty) => {
    const id = getFacultyId(faculty);
    if (!id) {
      toast.error("Cannot delete faculty: missing ID");
      return;
    }
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openViewFaculty(f)}
            title="View faculty"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); openEdit(f); }}
            title="Edit faculty"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(f)} title="Delete faculty">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
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
          title="All Faculties"
          description={`${filteredFaculties.length} of ${faculties.length} facult${faculties.length === 1 ? "y" : "ies"} shown`}
          columns={columns}
          data={filteredFaculties}
          searchKeys={["name", "code"]}
          addLabel="Create Faculty"
          onAdd={openCreate}
          filterPanel={(
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty-campus-filter">Campus</Label>
                <select
                  id="faculty-campus-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                >
                  <option value="all">All campuses</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-status-filter">Status</Label>
                <select
                  id="faculty-status-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={clearFilters}
                  disabled={campusFilter === "all" && statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        />
      )}

      {viewingFaculty && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewingFaculty(null); }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-xl font-bold">{viewingFaculty.name}</h2>
                <p className="text-sm text-muted-foreground font-mono">{viewingFaculty.code}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingFaculty(null)}>Close</Button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Campus</p>
                  <p className="font-medium">{getCampusName(viewingFaculty.campusId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Head</p>
                  <p className="font-medium">{getHeadName(viewingFaculty.headId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{viewingFaculty.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingFaculty.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="mt-1" variant={viewingFaculty.status === "Active" ? "default" : "secondary"}>
                    {viewingFaculty.status || "Active"}
                  </Badge>
                </div>
              </div>
              {viewingFaculty.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="mt-1">{viewingFaculty.description}</p>
                </div>
              )}
              {viewingFacultyDetail?.stats && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1.5 mb-2">
                    <BarChart3 className="h-3.5 w-3.5" /> Statistics
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Departments", value: viewingFacultyDetail.stats.totalDepartments },
                      { label: "Programs", value: viewingFacultyDetail.stats.totalPrograms },
                      { label: "Subjects", value: viewingFacultyDetail.stats.totalSubjects },
                      { label: "Batches", value: viewingFacultyDetail.stats.totalBatches },
                    ].map((item) => (
                      <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{item.value ?? 0}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewingFaculty(null)}>Close</Button>
                <Button onClick={() => { openEdit(viewingFaculty); setViewingFaculty(null); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit faculty
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Faculty" : "Create Faculty"}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}><X className="h-4 w-4" /></Button>
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
                    <option value="">Select staff head</option>
                    {staffMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {getStaffDisplayName(member)}
                      </option>
                    ))}
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
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
