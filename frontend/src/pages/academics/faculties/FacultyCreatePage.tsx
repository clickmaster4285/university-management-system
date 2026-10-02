import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { facultyAPI } from "@/features/faculties";
import { campusAPI, type Campus } from "@/features/campus";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AssignmentDraft = {
  campusId: string;
  headId: string;
  email: string;
  phone: string;
  establishedDate: string;
  status: "Active" | "Inactive";
};

type FacultyFormData = {
  name: string;
  code: string;
  campusIds: string[];
  description: string;
  status: "Active" | "Inactive";
  campusAssignments: AssignmentDraft[];
};

const EMPTY_FORM: FacultyFormData = {
  name: "",
  code: "",
  campusIds: [],
  description: "",
  status: "Active",
  campusAssignments: [],
};

const blankAssignment = (campusId: string): AssignmentDraft => ({
  campusId,
  headId: "",
  email: "",
  phone: "",
  establishedDate: "",
  status: "Active",
});

export default function FacultyCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FacultyFormData>(EMPTY_FORM);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, staffRes] = await Promise.all([
          campusAPI.getAll(),
          staffMemberAPI.listAcademic(),
        ]);
        setCampuses(Array.isArray(campRes?.data) ? campRes.data : []);
        setStaffMembers(staffRes);
      } catch {
        // dropdowns will be empty — user can still fill other fields
      }
    };
    fetchData();
  }, []);

  const toggleCampus = (campusId: string, checked: boolean) => {
    setForm((prev) => {
      const nextCampusIds = checked
        ? [...prev.campusIds, campusId]
        : prev.campusIds.filter((id) => id !== campusId);
      const nextAssignments = checked
        ? [...prev.campusAssignments, blankAssignment(campusId)]
        : prev.campusAssignments.filter((a) => a.campusId !== campusId);
      return { ...prev, campusIds: nextCampusIds, campusAssignments: nextAssignments };
    });
  };

  const updateAssignment = (campusId: string, patch: Partial<AssignmentDraft>) => {
    setForm((prev) => ({
      ...prev,
      campusAssignments: prev.campusAssignments.map((a) =>
        a.campusId === campusId ? { ...a, ...patch } : a
      ),
    }));
  };

  const sortedAssignments = useMemo(() => {
    const order = new Map(campuses.map((c, idx) => [c._id, idx]));
    return [...form.campusAssignments].sort((a, b) => {
      return (order.get(a.campusId) ?? 0) - (order.get(b.campusId) ?? 0);
    });
  }, [form.campusAssignments, campuses]);

  const handleSave = async () => {
    if (!form.name || !form.code || form.campusIds.length === 0) {
      toast.error("Name, code and at least one campus are required");
      return;
    }
    try {
      setSaving(true);
      const campusAssignments = form.campusIds.map((campusId) => {
        const draft = form.campusAssignments.find((a) => a.campusId === campusId);
        return {
          campusId,
          headId: draft?.headId || undefined,
          email: draft?.email?.trim() || undefined,
          phone: draft?.phone?.trim() || undefined,
          establishedDate: draft?.establishedDate || undefined,
          status: draft?.status || "Active",
        };
      });
      await facultyAPI.create({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        campusIds: form.campusIds,
        campusAssignments,
        description: form.description.trim(),
        status: form.status,
      });
      toast.success("Faculty created");
      navigate("/faculties");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create faculty");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/faculties")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Create Faculty</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faculty Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Faculty of Computing"
              />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FOC"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Campuses *</Label>
            <p className="text-xs text-muted-foreground">
              A faculty can exist on multiple campuses. Each campus gets its own head, phone, email, and status below.
            </p>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
              {campuses.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">No campuses available</p>
              )}
              {campuses.map((c) => (
                <label
                  key={c._id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.campusIds.includes(c._id)}
                    onChange={(e) => toggleCampus(c._id, e.target.checked)}
                  />
                  <span className="text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{c.campusCode}</span>
                </label>
              ))}
            </div>
          </div>

          {sortedAssignments.map((assignment) => {
            const campus = campuses.find((c) => c._id === assignment.campusId);
            if (!campus) return null;
            return (
              <div key={assignment.campusId} className="space-y-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{campus.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{campus.campusCode}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Head of Faculty (at this campus)</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={assignment.headId}
                      onChange={(e) => updateAssignment(assignment.campusId, { headId: e.target.value })}
                    >
                      <option value="">Select staff head</option>
                      {staffMembers.map((m) => (
                        <option key={m._id} value={m._id}>{getStaffDisplayName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={assignment.email}
                      onChange={(e) => updateAssignment(assignment.campusId, { email: e.target.value })}
                      placeholder={`${campus.name.toLowerCase().replace(/\s+/g, ".")}@university.edu.pk`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={assignment.phone}
                      onChange={(e) => updateAssignment(assignment.campusId, { phone: e.target.value })}
                      placeholder="+92-42-35608000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Established Date</Label>
                    <Input
                      type="date"
                      value={assignment.establishedDate}
                      onChange={(e) => updateAssignment(assignment.campusId, { establishedDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status (at this campus)</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={assignment.status}
                      onChange={(e) =>
                        updateAssignment(assignment.campusId, {
                          status: e.target.value as "Active" | "Inactive",
                        })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="space-y-2">
            <Label>Status (faculty-level)</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/faculties")}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Create
        </Button>
      </div>
    </div>
  );
}