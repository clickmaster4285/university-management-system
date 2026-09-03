import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { departmentAPI, type Department } from "@/features/departments";
import { campusAPI, type Campus } from "@/features/campus";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { facultyAPI, type Faculty } from "@/features/faculties";

export type DepartmentFormData = {
  name: string;
  code: string;
  description: string;
  campusId: string;
  headId: string;
  facultyId: string;
  status: "Active" | "Inactive";
  location: string;
  email: string;
  phone: string;
  establishedDate: string;
};

export const EMPTY_FORM: DepartmentFormData = {
  name: "", code: "", description: "", campusId: "", headId: "",
  facultyId: "", status: "Active", location: "", email: "", phone: "",
  establishedDate: "",
};

export const STATUS_OPTIONS = ["Active", "Inactive"] as const;

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const getDepartmentRecordId = (dept: Department) => dept._id || dept.departmentId || "";

const toFormData = (dept: Department): DepartmentFormData => ({
  name: dept.name || "",
  code: dept.code || "",
  description: dept.description || "",
  campusId: resolveRefId(dept.campusId as string | { _id: string } | null | undefined),
  headId: resolveRefId(dept.headId as string | { _id: string } | null | undefined),
  facultyId: resolveRefId(dept.facultyId as string | { _id: string } | null | undefined),
  status: dept.status || "Active",
  location: dept.location || "",
  email: dept.email || "",
  phone: dept.phone || "",
  establishedDate: dept.establishedDate ? dept.establishedDate.slice(0, 10) : "",
});

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
      setFormData(toFormData(department));
    }
  }, [mode, department]);

  const campusFaculties = useMemo(() => {
    if (!formData.campusId) return faculties;
    return faculties.filter((f) => resolveRefId(f.campusId as string | { _id: string } | null | undefined) === formData.campusId);
  }, [faculties, formData.campusId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "campusId" && prev.facultyId) {
        const facultyStillValid = faculties.some(
          (f) => f._id === prev.facultyId && resolveRefId(f.campusId as string | { _id: string } | null | undefined) === value
        );
        if (!facultyStillValid) next.facultyId = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.campusId) {
      toast.error("Name, code and campus are required");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await departmentAPI.create(formData);
        toast.success("Department created successfully");
      } else {
        const id = department ? getDepartmentRecordId(department) : "";
        if (!id) {
          toast.error("Cannot update department: missing ID");
          return;
        }
        await departmentAPI.update(id, formData);
        toast.success("Department updated successfully");
      }
      navigate("/departments");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
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
              ? "Add a new academic department under a campus and faculty"
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
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Department of Computer Science" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input id="code" name="code" value={formData.code} onChange={handleChange} placeholder="CS" required className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusId">Campus *</Label>
                <select id="campusId" name="campusId" value={formData.campusId} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  <option value="">Select campus</option>
                  {campuses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facultyId">Faculty / School</Label>
                <select id="facultyId" name="facultyId" value={formData.facultyId} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!formData.campusId}>
                  <option value="">{formData.campusId ? "Select faculty" : "Select campus first"}</option>
                  {campusFaculties.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headId">Head of Department</Label>
                <select id="headId" name="headId" value={formData.headId} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select HOD</option>
                  {staffMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {getStaffDisplayName(member)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Department Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="cs@university.edu.pk" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="051-1234567" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Office Location</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Block A - Room 201" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="establishedDate">Established Date</Label>
                <Input id="establishedDate" name="establishedDate" type="date" value={formData.establishedDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select id="status" name="status" value={formData.status} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Department description..." className="min-h-[80px]" />
              </div>
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
