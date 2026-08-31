import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { departmentAPI, type Department } from "@/features/departments";
import { programAPI, type Program } from "@/features/programs";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { campusAPI, type Campus } from "@/features/campus";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import { roleAssignmentAPI, type RoleAssignment } from "@/features/roleAssignments";

interface StaffRoleAssignmentsProps {
  staffMemberId: string;
}

const EMPTY_FORM = {
  roleType: "",
  scopeType: "Department",
  scopeId: "",
  academicSessionId: "",
  notes: "",
};

export function StaffRoleAssignments({ staffMemberId }: StaffRoleAssignmentsProps) {
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [meta, setMeta] = useState({ roleTypes: [] as string[], scopeTypes: [] as string[] });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentList, metaData, deptRes, programRes, facultyRes, campusRes, sessionRes] =
        await Promise.all([
          roleAssignmentAPI.list({ staffMemberId }),
          roleAssignmentAPI.getMeta(),
          departmentAPI.getAll(),
          programAPI.getAll({ limit: 200 }),
          facultyAPI.getAll(),
          campusAPI.getAll(),
          academicSessionAPI.getAll(),
        ]);
      setAssignments(assignmentList);
      setMeta(metaData);
      setDepartments(deptRes?.data || []);
      setPrograms(programRes?.data || []);
      setFaculties(facultyRes?.data || []);
      setCampuses(Array.isArray(campusRes?.data) ? campusRes.data : []);
      setSessions(sessionRes?.data || []);
    } catch {
      toast.error("Failed to load role assignments");
    } finally {
      setLoading(false);
    }
  }, [staffMemberId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scopeOptions = useMemo(() => {
    switch (form.scopeType) {
      case "Campus":
        return campuses.map((item) => ({
          id: item._id || item.campusId || "",
          label: item.name,
        }));
      case "Faculty":
        return faculties.map((item) => ({
          id: item._id || item.facultyId || "",
          label: item.name,
        }));
      case "Department":
        return departments.map((item) => ({
          id: item._id || item.departmentId || "",
          label: item.name,
        }));
      case "Program":
        return programs.map((item) => ({
          id: item._id || item.programId || "",
          label: `${item.code} — ${item.name}`,
        }));
      default:
        return [];
    }
  }, [form.scopeType, campuses, faculties, departments, programs]);

  const scopeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    campuses.forEach((item) => map.set(item._id || item.campusId || "", item.name));
    faculties.forEach((item) => map.set(item._id || item.facultyId || "", item.name));
    departments.forEach((item) => map.set(item._id || item.departmentId || "", item.name));
    programs.forEach((item) => map.set(item._id || item.programId || "", `${item.code} — ${item.name}`));
    return map;
  }, [campuses, faculties, departments, programs]);

  const resolveScopeLabel = (assignment: RoleAssignment) => {
    if (assignment.scopeType === "University") return "Whole university";
    const scopeId =
      typeof assignment.scopeId === "object"
        ? assignment.scopeId?._id
        : assignment.scopeId || "";
    return scopeLabelMap.get(scopeId) || scopeId || "—";
  };

  const handleCreate = async () => {
    if (!form.roleType || !form.scopeType) {
      toast.error("Role type and scope type are required");
      return;
    }
    if (form.scopeType !== "University" && !form.scopeId) {
      toast.error("Select a scope target");
      return;
    }

    setSaving(true);
    try {
      await roleAssignmentAPI.create({
        staffMemberId,
        roleType: form.roleType,
        scopeType: form.scopeType,
        scopeId: form.scopeType === "University" ? null : form.scopeId,
        academicSessionId: form.academicSessionId || null,
        notes: form.notes,
      });
      toast.success("Role assignment added");
      setForm(EMPTY_FORM);
      loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to add role assignment";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Remove this role assignment?")) return;
    try {
      await roleAssignmentAPI.delete(id);
      toast.success("Role assignment removed");
      loadData();
    } catch {
      toast.error("Failed to remove role assignment");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
      <div>
        <h3 className="font-semibold">Role assignments</h3>
        <p className="text-sm text-muted-foreground">
          Duties like HOD, Program Coordinator, or Exam Controller with scoped access.
        </p>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment._id}
              className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge>{assignment.roleType}</Badge>
                  <span className="text-sm text-muted-foreground">{assignment.scopeType}</span>
                </div>
                <p className="text-sm mt-1">{resolveScopeLabel(assignment)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(assignment._id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No duties assigned yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <div className="space-y-2">
          <Label>Role type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.roleType}
            onChange={(e) => setForm((prev) => ({ ...prev, roleType: e.target.value }))}
          >
            <option value="">Select role</option>
            {meta.roleTypes.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Scope type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.scopeType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, scopeType: e.target.value, scopeId: "" }))
            }
          >
            {meta.scopeTypes.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>
        {form.scopeType !== "University" && (
          <div className="space-y-2">
            <Label>Scope target</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.scopeId}
              onChange={(e) => setForm((prev) => ({ ...prev, scopeId: e.target.value }))}
            >
              <option value="">Select {form.scopeType.toLowerCase()}</option>
              {scopeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Academic session (optional)</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.academicSessionId}
            onChange={(e) => setForm((prev) => ({ ...prev, academicSessionId: e.target.value }))}
          >
            <option value="">Any session</option>
            {sessions.map((session) => (
              <option key={session._id || session.sessionId} value={session._id || session.sessionId}>
                {session.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes about this duty"
          />
        </div>
      </div>

      <Button type="button" variant="secondary" onClick={handleCreate} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
        Add role assignment
      </Button>
    </div>
  );
}
