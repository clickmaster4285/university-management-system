import { useEffect, useState } from "react";
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

  const handleSave = async () => {
    if (!form.name || !form.code || !form.campusId) {
      toast.error("Name, code and campus are required");
      return;
    }
    try {
      setSaving(true);
      await facultyAPI.create({
        name: form.name.trim(),
        code: form.code.trim(),
        campusId: form.campusId,
        headId: form.headId || undefined,
        description: form.description.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campus *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.campusId}
                onChange={(e) => setForm({ ...form, campusId: e.target.value })}
              >
                <option value="">Select campus</option>
                {campuses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Head of Faculty</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.headId}
                onChange={(e) => setForm({ ...form, headId: e.target.value })}
              >
                <option value="">Select staff head</option>
                {staffMembers.map((m) => (
                  <option key={m._id} value={m._id}>{getStaffDisplayName(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="faculty@university.edu.pk"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+92-42-35608000"
              />
            </div>
          </div>

          <div className="space-y-2">
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
