import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ChevronLeft, GraduationCap, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { departmentAPI, type Department } from "@/features/departments";
import {
  staffMemberAPI,
  type StaffMember,
  type StaffPayload,
  type StaffStatus,
} from "@/features/staffMembers";

export type StaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  personalEmail: string;
  phone: string;
  cnic: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  joiningDate: string;
  jobDescription: string;
  status: StaffStatus;
  isAcademic: boolean;
  departmentId: string;
  designation: string;
  employmentType: StaffPayload["employments"][0]["employmentType"];
  specialization: string;
  officeHours: string;
  notes: string;
};

const STATUS_OPTIONS: StaffStatus[] = ["Active", "On Leave", "Resigned", "Terminated", "Retired"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Visiting", "Intern"] as const;

export const EMPTY_STAFF_FORM: StaffFormData = {
  firstName: "",
  lastName: "",
  email: "",
  personalEmail: "",
  phone: "",
  cnic: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  joiningDate: "",
  jobDescription: "",
  status: "Active",
  isAcademic: false,
  departmentId: "",
  designation: "",
  employmentType: "Full-time",
  specialization: "",
  officeHours: "",
  notes: "",
};

const resolveRefId = (value: string | { _id?: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return String(value);
};

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

const toFormData = (staff: StaffMember): StaffFormData => {
  const primaryEmployment =
    staff.employments?.find((e) => e.isPrimary) || staff.employments?.[0];
  return {
    firstName: staff.firstName || "",
    lastName: staff.lastName || "",
    email: staff.email || "",
    personalEmail: staff.personalEmail || "",
    phone: staff.phone || "",
    cnic: staff.cnic || "",
    dateOfBirth: toDateInput(staff.dateOfBirth),
    gender: staff.gender || "",
    address: staff.address || "",
    emergencyName: staff.emergencyContact?.name || "",
    emergencyPhone: staff.emergencyContact?.phone || "",
    emergencyRelation: staff.emergencyContact?.relation || "",
    joiningDate: toDateInput(staff.joiningDate),
    jobDescription: staff.jobDescription || "",
    status: staff.status || "Active",
    isAcademic: Boolean(staff.isAcademic),
    departmentId: resolveRefId(primaryEmployment?.departmentId),
    designation: primaryEmployment?.designation || "",
    employmentType: primaryEmployment?.employmentType || "Full-time",
    specialization: staff.teacherProfile?.specialization || "",
    officeHours: staff.teacherProfile?.officeHours || "",
    notes: staff.notes || "",
  };
};

interface StaffFormProps {
  mode: "create" | "edit";
  staff?: StaffMember | null;
  onUpdated?: (staff: StaffMember) => void;
  embedded?: boolean;
}

export function StaffForm({ mode, staff, onUpdated, embedded = false }: StaffFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StaffFormData>(EMPTY_STAFF_FORM);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const deptRes = await departmentAPI.getAll();
        setDepartments(deptRes?.data || []);
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (mode === "edit" && staff && !loadingOptions) {
      setFormData(toFormData(staff));
    }
  }, [mode, staff, loadingOptions]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = (): StaffPayload => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    personalEmail: formData.personalEmail.trim(),
    phone: formData.phone.trim(),
    cnic: formData.cnic.trim(),
    dateOfBirth: formData.dateOfBirth || null,
    gender: formData.gender,
    address: formData.address.trim(),
    emergencyContact: {
      name: formData.emergencyName.trim(),
      phone: formData.emergencyPhone.trim(),
      relation: formData.emergencyRelation.trim(),
    },
    joiningDate: formData.joiningDate || null,
    jobDescription: formData.jobDescription.trim(),
    status: formData.status,
    isAcademic: formData.isAcademic,
    notes: formData.notes.trim(),
    employments: [
      {
        departmentId: formData.departmentId,
        designation: formData.designation.trim(),
        employmentType: formData.employmentType,
        isPrimary: true,
      },
    ],
    teacherProfile: formData.isAcademic
      ? {
          specialization: formData.specialization.trim(),
          officeHours: formData.officeHours.trim(),
        }
      : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("First name, last name, and email are required");
      return;
    }
    if (!formData.departmentId || !formData.designation) {
      toast.error("Department and designation are required");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        await staffMemberAPI.create(payload);
        toast.success("Staff member created");
        navigate("/staff");
      } else {
        const id = staff ? getStaffRecordId(staff) : "";
        if (!id) {
          toast.error("Cannot update: missing staff ID");
          return;
        }
        const updated = await staffMemberAPI.update(id, payload);
        toast.success("Staff member updated");
        onUpdated?.(updated);
        if (!embedded) navigate("/staff");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (mode === "create" ? "Failed to create staff member" : "Failed to update staff member");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name *</Label>
            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name *</Label>
            <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email *</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personalEmail">Personal email</Label>
            <Input id="personalEmail" name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnic">CNIC</Label>
            <Input id="cnic" name="cnic" value={formData.cnic} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Contact name</Label>
            <Input id="emergencyName" name="emergencyName" value={formData.emergencyName} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Contact phone</Label>
            <Input id="emergencyPhone" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyRelation">Relation</Label>
            <Input id="emergencyRelation" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Employment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departmentId">Department *</Label>
            <select
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={loadingOptions}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.departmentId} value={dept._id || dept.departmentId}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="designation">Designation *</Label>
            <Input
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="Professor, Accounts Officer..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment type</Label>
            <select
              id="employmentType"
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="joiningDate">Joining date</Label>
            <Input id="joiningDate" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40 w-full">
              <Switch
                id="isAcademic"
                checked={formData.isAcademic}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isAcademic: checked }))
                }
              />
              <Label htmlFor="isAcademic" className="text-sm font-medium cursor-pointer">
                Academic / teaching staff
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="jobDescription">Job description</Label>
            <Textarea
              id="jobDescription"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              className="min-h-[100px]"
              placeholder="Responsibilities, reporting line, key duties..."
            />
          </div>
        </div>
      </div>

      {formData.isAcademic && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Teacher profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeHours">Office hours note</Label>
              <Input
                id="officeHours"
                name="officeHours"
                value={formData.officeHours}
                onChange={handleChange}
                placeholder="Mon–Wed 10:00–12:00"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="min-h-[80px]" />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        {!embedded && (
          <Button type="button" variant="outline" onClick={() => navigate("/staff")}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="gradient-brand text-white border-0">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Create staff" : "Save profile"}
            </>
          )}
        </Button>
      </div>
    </form>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate("/staff")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to staff
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Add Staff Member" : "Edit Staff Member"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified record for academic and non-academic personnel
          </p>
        </div>
        {formBody}
      </CardContent>
    </Card>
  );
}

export default StaffForm;
