import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { departmentAPI, type Department, type DepartmentCampusAssignment } from "@/features/departments";
import { campusAPI, type Campus } from "@/features/campus";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { facultyAPI, type Faculty } from "@/features/faculties";

type AssignmentDraft = {
  campusId: string;
  headId: string;
  email: string;
  phone: string;
  location: string;
  establishedDate: string;
  status: "Active" | "Inactive";
};

export type DepartmentFormData = {
  name: string;
  code: string;
  description: string;
  campusIds: string[];
  facultyIds: string[];
  campusAssignments: AssignmentDraft[];
};

const emptyAssignment = (campusId: string): AssignmentDraft => ({
  campusId,
  headId: "",
  email: "",
  phone: "",
  location: "",
  establishedDate: "",
  status: "Active",
});

export const EMPTY_FORM: DepartmentFormData = {
  name: "", code: "", description: "", campusIds: [], facultyIds: [], campusAssignments: [],
};

export const STATUS_OPTIONS = ["Active", "Inactive"] as const;

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const getDepartmentRecordId = (dept: Department) => dept._id || dept.departmentId || "";

const toFormData = (dept: Department): DepartmentFormData => {
  const campusIds = (dept.campusIds || [])
    .map((c) => resolveRefId(c as string | { _id: string } | null | undefined))
    .filter(Boolean);
  const facultyIds = (dept.facultyIds || [])
    .map((f) => resolveRefId(f as string | { _id: string } | null | undefined))
    .filter(Boolean);

  const assignments: AssignmentDraft[] = campusIds.map((cid) => {
    const existing = (dept.campusAssignments || []).find((a) => {
      const ac = resolveRefId(a.campus as string | { _id: string } | null | undefined);
      return ac === cid;
    });
    if (existing) {
      return {
        campusId: cid,
        headId: resolveRefId(existing.headId as string | { _id: string } | null | undefined),
        email: existing.email || "",
        phone: existing.phone || "",
        location: existing.location || "",
        establishedDate: existing.establishedDate ? existing.establishedDate.slice(0, 10) : "",
        status: existing.status || "Active",
      };
    }
    return emptyAssignment(cid);
  });

  return {
    name: dept.name || "",
    code: dept.code || "",
    description: dept.description || "",
    campusIds,
    facultyIds,
    campusAssignments: assignments,
  };
};

interface DepartmentFormProps {
  mode: "create" | "edit";
  department?: Department | null;
}

export function DepartmentForm({ mode, department }: DepartmentFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DepartmentFormData>(EMPTY_FORM);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeAssignmentTab, setActiveAssignmentTab] = useState<string>("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [campusRes, staffRes, facRes] = await Promise.all([
          campusAPI.getAll(),
          staffMemberAPI.listAcademic(),
          facultyAPI.getAll(),
        ]);
        setCampuses(Array.isArray(campusRes?.data) ? campusRes.data : []);
        setStaffMembers(staffRes);
        setFaculties(Array.isArray(facRes?.data) ? facRes.data : []);
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (mode === "edit" && department) {
      const fd = toFormData(department);
      setFormData(fd);
      if (fd.campusAssignments.length > 0) {
        setActiveAssignmentTab(fd.campusAssignments[0].campusId);
      }
    }
  }, [mode, department]);

  const selectedCampusIds = useMemo(() => new Set(formData.campusIds), [formData.campusIds]);

  const campusFaculties = useMemo(() => {
    if (formData.campusIds.length === 0) return faculties;
    return faculties.filter((f) =>
      (f.campusIds || []).some((c) =>
        selectedCampusIds.has(resolveRefId(c as string | { _id: string } | null | undefined))
      )
    );
  }, [faculties, formData.campusIds, selectedCampusIds]);

  const toggleCampus = (campusId: string, checked: boolean) => {
    setFormData((prev) => {
      const nextCampusIds = checked
        ? [...prev.campusIds, campusId]
        : prev.campusIds.filter((id) => id !== campusId);
      let nextAssignments = [...prev.campusAssignments];
      if (checked) {
        nextAssignments.push(emptyAssignment(campusId));
      } else {
        nextAssignments = nextAssignments.filter((a) => a.campusId !== campusId);
      }
      const nextFacultyIds = checked
        ? prev.facultyIds
        : prev.facultyIds.filter((fid) => {
            const faculty = faculties.find((f) => f._id === fid);
            if (!faculty) return false;
            return (faculty.campusIds || [])
              .map((c) => resolveRefId(c as string | { _id: string } | null | undefined))
              .some((cid) => nextCampusIds.includes(cid));
          });
      if (!nextCampusIds.includes(activeAssignmentTab)) {
        setActiveAssignmentTab(nextCampusIds[0] || "");
      }
      return { ...prev, campusIds: nextCampusIds, facultyIds: nextFacultyIds, campusAssignments: nextAssignments };
    });
  };

  const toggleFaculty = (facultyId: string, checked: boolean) => {
    setFormData((prev) => {
      const nextIds = checked
        ? [...prev.facultyIds, facultyId]
        : prev.facultyIds.filter((id) => id !== facultyId);
      return { ...prev, facultyIds: nextIds };
    });
  };

  const updateAssignment = (campusId: string, field: keyof AssignmentDraft, value: string) => {
    setFormData((prev) => ({
      ...prev,
      campusAssignments: prev.campusAssignments.map((a) =>
        a.campusId === campusId ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || formData.campusIds.length === 0) {
      toast.error("Name, code and at least one campus are required");
      return;
    }

    setSaving(true);
    try {
      const campusAssignments = formData.campusAssignments.map((a) => ({
        campus: a.campusId,
        headId: a.headId || undefined,
        email: a.email,
        phone: a.phone,
        location: a.location,
        establishedDate: a.establishedDate || undefined,
        status: a.status,
      }));
      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        campusIds: formData.campusIds,
        campusId: formData.campusIds[0] || undefined,
        facultyIds: formData.facultyIds,
        facultyId: formData.facultyIds[0] || undefined,
        campusAssignments,
      };
      if (mode === "create") {
        await departmentAPI.create(payload);
        toast.success("Department created successfully");
      } else {
        const id = department ? getDepartmentRecordId(department) : "";
        if (!id) {
          toast.error("Cannot update department: missing ID");
          return;
        }
        await departmentAPI.update(id, payload);
        toast.success("Department updated successfully");
      }
      navigate("/departments");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const getCampusName = (campusId: string) => {
    const c = campuses.find((x) => x._id === campusId);
    return c?.name || campusId;
  };

  const getCampusCode = (campusId: string) => {
    const c = campuses.find((x) => x._id === campusId);
    return c?.campusCode || "";
  };

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Department" : "Edit Department"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Add a new academic department across campuses and faculties"
              : "Update department information"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Department of Computer Science" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input id="code" name="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="CS" required className="uppercase" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Campuses *</Label>
              <p className="text-xs text-muted-foreground">
                A department can exist on multiple campuses. Each campus gets its own head, email, phone, and status.
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
                      checked={formData.campusIds.includes(c._id)}
                      onChange={(e) => toggleCampus(c._id, e.target.checked)}
                    />
                    <span className="text-sm">{c.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{c.campusCode}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Faculties / Schools</Label>
              <p className="text-xs text-muted-foreground">
                A department can belong to multiple faculties. Faculties are filtered by selected campuses.
              </p>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {campusFaculties.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    {formData.campusIds.length > 0 ? "No faculties for the selected campuses" : "Select campuses first"}
                  </p>
                )}
                {campusFaculties.map((f) => (
                  <label
                    key={f._id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={f._id ? formData.facultyIds.includes(f._id) : false}
                      onChange={(e) => f._id && toggleFaculty(f._id, e.target.checked)}
                    />
                    <span className="text-sm">{f.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{f.code}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {formData.campusAssignments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Per-Campus Details
              </h3>
              <p className="text-xs text-muted-foreground">
                Configure the head, contact info, and status for each campus this department operates on.
              </p>

              <div className="flex gap-2 flex-wrap">
                {formData.campusAssignments.map((a) => (
                  <button
                    key={a.campusId}
                    type="button"
                    onClick={() => setActiveAssignmentTab(a.campusId)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      activeAssignmentTab === a.campusId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                    }`}
                  >
                    {getCampusName(a.campusId)}
                    <span className="ml-1 text-xs opacity-70">{getCampusCode(a.campusId)}</span>
                  </button>
                ))}
              </div>

              {formData.campusAssignments.map((a) => {
                if (a.campusId !== activeAssignmentTab) return null;
                return (
                  <div key={a.campusId} className="border rounded-md p-4 space-y-4 bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Head of Department</Label>
                        <select
                          value={a.headId}
                          onChange={(e) => updateAssignment(a.campusId, "headId", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select HOD</option>
                          {staffMembers.map((member) => (
                            <option key={member._id} value={member._id}>
                              {getStaffDisplayName(member)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          value={a.status}
                          onChange={(e) => updateAssignment(a.campusId, "status", e.target.value as "Active" | "Inactive")}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={a.email}
                          onChange={(e) => updateAssignment(a.campusId, "email", e.target.value)}
                          placeholder={`cs@${getCampusCode(a.campusId).toLowerCase()}.edu.pk`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={a.phone}
                          onChange={(e) => updateAssignment(a.campusId, "phone", e.target.value)}
                          placeholder="051-1234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Office Location</Label>
                        <Input
                          value={a.location}
                          onChange={(e) => updateAssignment(a.campusId, "location", e.target.value)}
                          placeholder="Block A - Room 201"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Established Date</Label>
                        <Input
                          type="date"
                          value={a.establishedDate}
                          onChange={(e) => updateAssignment(a.campusId, "establishedDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Department Description
            </h3>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Department description..." className="min-h-[80px]" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/departments")} className="h-12 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 h-12 gradient-brand text-white border-0">
              {saving ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Save className="h-5 w-5 mr-2" /> {mode === "create" ? "Create Department" : "Update Department"}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default DepartmentForm;
