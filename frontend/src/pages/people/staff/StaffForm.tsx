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
import { StaffRoleAssignments } from "./StaffRoleAssignments";

export type StaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cnic: string;
  gender: string;
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
  phone: "",
  cnic: "",
  gender: "",
  status: "Active",
  isAcademic: false,
  departmentId: "",
  designation: "",
  employmentType: "Full-time",
  specialization: "",
  officeHours: "",
  notes: "",
};

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

const toFormData = (staff: StaffMember): StaffFormData => {
  const primaryEmployment =
    staff.employments?.find((e) => e.isPrimary) || staff.employments?.[0];
  return {
    firstName: staff.firstName || "",
    lastName: staff.lastName || "",
    email: staff.email || "",
    phone: staff.phone || "",
    cnic: staff.cnic || "",
    gender: staff.gender || "",
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
}

export function StaffForm({ mode, staff }: StaffFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StaffFormData>(EMPTY_STAFF_FORM);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformRoles, setPlatformRoles] = useState<string[]>([]);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("Faculty");
  const [enablingLogin, setEnablingLogin] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [deptRes, roles] = await Promise.all([
          departmentAPI.getAll(),
          staffMemberAPI.getPlatformRoles(),
        ]);
        setDepartments(deptRes?.data || []);
        setPlatformRoles(roles);
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (mode === "edit" && staff) {
      setFormData(toFormData(staff));
    }
  }, [mode, staff]);

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
    phone: formData.phone.trim(),
    cnic: formData.cnic.trim(),
    gender: formData.gender,
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
      } else {
        const id = staff ? getStaffRecordId(staff) : "";
        if (!id) {
          toast.error("Cannot update: missing staff ID");
          return;
        }
        await staffMemberAPI.update(id, payload);
        toast.success("Staff member updated");
      }
      navigate("/staff");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (mode === "create" ? "Failed to create staff member" : "Failed to update staff member");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableLogin = async () => {
    const id = staff ? getStaffRecordId(staff) : "";
    if (!id) return;
    if (!loginPassword || loginPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setEnablingLogin(true);
    try {
      await staffMemberAPI.enableLogin(id, {
        password: loginPassword,
        primaryRole: loginRole,
      });
      toast.success("Login enabled");
      setLoginPassword("");
      navigate(`/staff/edit/${id}`, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to enable login";
      toast.error(message);
    } finally {
      setEnablingLogin(false);
    }
  };

  const hasLogin = Boolean(staff?.userId);

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
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC</Label>
                <Input id="cnic" name="cnic" value={formData.cnic} onChange={handleChange} />
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
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Primary employment
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
                  placeholder="Professor, Accounts Officer, Lab Attendant..."
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
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeHours">Office hours</Label>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="min-h-[80px]"
            />
          </div>

          {mode === "edit" && staff && (
            <StaffRoleAssignments staffMemberId={getStaffRecordId(staff)} />
          )}

          {mode === "edit" && staff && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h3 className="font-semibold">Portal login</h3>
              {hasLogin ? (
                <p className="text-sm text-muted-foreground">
                  Login is enabled for this staff member (
                  {typeof staff.userId === "object" ? staff.userId.email : "linked user"}).
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Platform role</Label>
                    <select
                      value={loginRole}
                      onChange={(e) => setLoginRole(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {platformRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Temporary password</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Min 8 characters"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleEnableLogin}
                        disabled={enablingLogin}
                      >
                        {enablingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable login"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/staff")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gradient-brand text-white border-0">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Create staff" : "Update staff"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default StaffForm;
