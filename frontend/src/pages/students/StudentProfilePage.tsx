import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentAPI, type PortalLoginCredentials, type Student } from "@/features/students";
import { feeChallanAPI, type FeeChallan } from "@/features/feeChallan";
import {
  semesterRegistrationAPI,
  type SemesterRegistration,
} from "@/features/semesterRegistration";
import { StudentDocumentsPanel } from "./StudentDocumentsPanel";
import { toast } from "sonner";

const resolveRefLabel = (value: Student["programId"], fallback?: string) => {
  if (typeof value === "object" && value) {
    return value.name || value.code || value.campusCode || fallback || "—";
  }
  return fallback || "—";
};

const admissionHref = (student: Student) => {
  if (!student.admissionId) return null;
  if (typeof student.admissionId === "object") {
    return student.admissionId.admissionId || student.admissionId._id || null;
  }
  return student.admissionNumber || student.admissionId;
};

const hasPortalLogin = (student: Student) => {
  if (!student.userId) return false;
  if (typeof student.userId === "object") return Boolean(student.userId._id || student.userId.email);
  return true;
};

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const money = (n?: number) => `PKR ${Number(n || 0).toLocaleString()}`;

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [registrations, setRegistrations] = useState<SemesterRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingLogin, setEnablingLogin] = useState(false);
  const [portalCreds, setPortalCreds] = useState<PortalLoginCredentials | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await studentAPI.getById(id);
        setStudent(data);
        const studentKey = data.studentId || data._id || id;
        const [feeList, regList] = await Promise.all([
          feeChallanAPI.list({ studentId: studentKey }).catch(() => [] as FeeChallan[]),
          semesterRegistrationAPI.listByStudent(studentKey).catch(() => [] as SemesterRegistration[]),
        ]);
        setChallans(feeList);
        setRegistrations(regList);
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const patch = (partial: Partial<Student>) => {
    setStudent((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const patchGuardian = (key: string, value: string) => {
    setStudent((prev) => {
      if (!prev) return prev;
      const guardian = { ...(prev.guardian || {}), [key]: value };
      const next: Student = { ...prev, guardian };
      if (key === "fatherName") next.fatherName = value;
      if (key === "motherName") next.motherName = value;
      return next;
    });
  };

  const patchAddress = (key: string, value: string) => {
    setStudent((prev) => {
      if (!prev) return prev;
      const address = { ...(prev.address || {}), [key]: value };
      const next: Student = { ...prev, address };
      if (key === "city") next.city = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!id || !student) return;
    setSaving(true);
    try {
      const res = await studentAPI.update(id, student);
      setStudent(res.data);
      toast.success("Student updated");
    } catch {
      toast.error("Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePortalLogin = async () => {
    if (!id) return;
    setEnablingLogin(true);
    try {
      const result = await studentAPI.enablePortalLogin(id);
      setStudent(result.data);
      if (result.portalLogin?.temporaryPassword) {
        setPortalCreds(result.portalLogin);
        toast.success("Portal login enabled — save the temporary password now");
      } else {
        toast.success(result.message || "Portal login enabled");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to enable portal login";
      toast.error(message);
    } finally {
      setEnablingLogin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">Student not found.</p>
        <Button variant="outline" onClick={() => navigate("/students")}>
          Back to directory
        </Button>
      </div>
    );
  }

  const displayName =
    student.fullName ||
    student.name ||
    `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
    "Student";
  const admissionLink = admissionHref(student);
  const admissionLabel =
    student.admissionNumber ||
    (typeof student.admissionId === "object" ? student.admissionId.admissionId : null) ||
    admissionLink;

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
              {admissionLabel ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Admission{" "}
                  {admissionLink ? (
                    <Link
                      className="font-mono text-primary underline-offset-2 hover:underline"
                      to={`/admissions/dossier/${admissionLink}`}
                    >
                      {admissionLabel}
                    </Link>
                  ) : (
                    <span className="font-mono">{admissionLabel}</span>
                  )}
                </p>
              ) : null}
            </div>
            <Badge>{student.status || "Active"}</Badge>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Student portal login</h3>
            {hasPortalLogin(student) ? (
              <p className="text-sm text-muted-foreground">
                Portal login is enabled
                {typeof student.userId === "object" && student.userId.email
                  ? ` for ${student.userId.email}`
                  : student.email
                    ? ` for ${student.email}`
                    : ""}
                .
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">No portal account yet.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={enablingLogin}
                  onClick={handleEnablePortalLogin}
                >
                  {enablingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Enable portal login
                </Button>
              </div>
            )}
            {portalCreds?.temporaryPassword ? (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <p className="font-medium">Temporary password (shown once)</p>
                <p>
                  Email: <span className="font-mono">{portalCreds.email}</span>
                </p>
                <p>
                  Password: <span className="font-mono">{portalCreds.temporaryPassword}</span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-semibold">Personal</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First name</Label>
                  <Input
                    value={student.firstName || ""}
                    onChange={(e) => patch({ firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input
                    value={student.lastName || ""}
                    onChange={(e) => patch({ lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={student.email || ""}
                  onChange={(e) => patch({ email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={student.phone || ""}
                  onChange={(e) => patch({ phone: e.target.value })}
                />
              </div>
              <div>
                <Label>CNIC</Label>
                <Input
                  value={student.cnic || ""}
                  onChange={(e) => patch({ cnic: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of birth</Label>
                  <Input
                    type="date"
                    value={toDateInput(student.dateOfBirth)}
                    onChange={(e) => patch({ dateOfBirth: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    value={student.gender || ""}
                    onChange={(e) => patch({ gender: e.target.value })}
                  >
                    <option value="">—</option>
                    {["Male", "Female", "Other"].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nationality</Label>
                  <Input
                    value={student.nationality || ""}
                    onChange={(e) => patch({ nationality: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Religion</Label>
                  <Input
                    value={student.religion || ""}
                    onChange={(e) => patch({ religion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-semibold">Academic</h3>
              <p className="text-sm">
                <span className="text-muted-foreground">Program:</span>{" "}
                {resolveRefLabel(student.programId, student.program)}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Department:</span>{" "}
                {resolveRefLabel(student.departmentId, student.department)}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Campus:</span>{" "}
                {resolveRefLabel(student.campusId, student.campus)}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Batch:</span>{" "}
                {resolveRefLabel(student.batchId)}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Enrolled:</span>{" "}
                {student.enrollmentDate
                  ? new Date(student.enrollmentDate).toLocaleDateString()
                  : "—"}
              </p>
              <div>
                <Label>Current semester</Label>
                <Input
                  type="number"
                  min={1}
                  value={student.currentSemester || student.semester || 1}
                  onChange={(e) =>
                    patch({
                      currentSemester: Number(e.target.value),
                      semester: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full h-10 rounded-md border px-3 text-sm"
                  value={student.status || "Active"}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  {["Active", "Inactive", "On Leave", "Graduated", "Suspended", "Dropped"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-semibold">Guardian / parents</h3>
              <div>
                <Label>Father name</Label>
                <Input
                  value={student.guardian?.fatherName || student.fatherName || ""}
                  onChange={(e) => patchGuardian("fatherName", e.target.value)}
                />
              </div>
              <div>
                <Label>Mother name</Label>
                <Input
                  value={student.guardian?.motherName || student.motherName || ""}
                  onChange={(e) => patchGuardian("motherName", e.target.value)}
                />
              </div>
              <div>
                <Label>Guardian name</Label>
                <Input value={student.guardian?.guardianName || ""} disabled />
              </div>
              <div>
                <Label>Guardian phone</Label>
                <Input value={student.guardian?.guardianPhone || ""} disabled />
              </div>
            </div>

            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-semibold">Address</h3>
              <div>
                <Label>Street</Label>
                <Input value={student.address?.street || ""} disabled />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={student.address?.city || student.city || ""}
                  onChange={(e) => patchAddress("city", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>State</Label>
                  <Input value={student.address?.state || ""} disabled />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input value={student.address?.postalCode || ""} disabled />
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Input value={student.address?.country || ""} disabled />
              </div>
            </div>
          </div>

          {student.previousEducation && student.previousEducation.length > 0 ? (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Previous education</h3>
              <div className="space-y-2">
                {student.previousEducation.map((edu, index) => (
                  <div
                    key={`${edu.institution || "edu"}-${index}`}
                    className="text-sm grid sm:grid-cols-4 gap-2 border-b last:border-0 pb-2 last:pb-0"
                  >
                    <span>{edu.institution || "—"}</span>
                    <span>{edu.degree || "—"}</span>
                    <span>
                      {edu.grade || (edu.percentage != null ? `${edu.percentage}%` : "—")}
                    </span>
                    <span>{edu.yearOfCompletion || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/students")}>
              Back to directory
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Fee challans</h2>
            <Badge variant="outline">{challans.length} record(s)</Badge>
          </div>
          {challans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee challans linked to this student yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Challan</th>
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Paid</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((c) => (
                    <tr key={c._id || c.feeId} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{c.feeId || "—"}</td>
                      <td className="py-2 pr-3">{c.description || c.source || "—"}</td>
                      <td className="py-2 pr-3">{money(c.amount)}</td>
                      <td className="py-2 pr-3">{money(c.paidAmount)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{c.paymentStatus}</Badge>
                      </td>
                      <td className="py-2">
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Semester registrations</h2>
            <Badge variant="outline">{registrations.length} record(s)</Badge>
          </div>
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No semester registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Registration</th>
                    <th className="py-2 pr-3 font-medium">Semester</th>
                    <th className="py-2 pr-3 font-medium">Session</th>
                    <th className="py-2 pr-3 font-medium">Mode</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r._id || r.registrationId} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{r.registrationId || "—"}</td>
                      <td className="py-2 pr-3">{r.programSemester ?? "—"}</td>
                      <td className="py-2 pr-3">
                        {typeof r.academicSessionId === "object"
                          ? r.academicSessionId?.name || r.academicSessionId?.code || "—"
                          : "—"}
                      </td>
                      <td className="py-2 pr-3">{r.registrationMode || "—"}</td>
                      <td className="py-2">
                        <Badge variant="outline">{r.status || "—"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <StudentDocumentsPanel student={student} />
        </CardContent>
      </Card>
    </div>
  );
}
