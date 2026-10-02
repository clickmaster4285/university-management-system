import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Save,
  Loader2,
  Users,
  UserPlus,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { batchAPI, type Batch } from "@/features/batches";
import { departmentAPI, type Department } from "@/features/departments";
import { programAPI, type Program } from "@/features/programs";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";

export type BatchFormData = {
  year: number;
  code: string;
  department: string;
  departmentId: string;
  program: string;
  programId: string;
  admissionSession: string;
  admissionSessionId: string;
  admissionSemester: string;
  expectedGraduation: number;
  status: "Active" | "Inactive" | "Upcoming" | "Completed";
  description: string;
};

const STATUS_OPTIONS = ["Active", "Upcoming", "Completed", "Inactive"] as const;
const SEMESTER_TYPES = ["Fall", "Spring", "Summer", "Winter"];

const suggestBatchCode = (programCode: string, year: number) =>
  programCode && year ? `${programCode}-${year}` : "";

const resolveDeptId = (dept: Department) => dept._id || dept.departmentId || "";

const resolveRefId = (value: string | { _id?: string; sessionId?: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.sessionId || "";
  return String(value);
};

const resolveProgramId = (batch: Batch, programs: Program[]) => {
  const raw = batch.programId;
  if (!raw) {
    const byName = programs.find(
      (program) => program.name === batch.program || program.code === batch.program
    );
    return byName?._id || "";
  }
  if (typeof raw === "object") {
    return (raw as { _id?: string })._id || "";
  }
  const id = String(raw);
  if (programs.some((program) => program._id === id)) return id;
  const match = programs.find(
    (program) =>
      program._id === id ||
      program.code === id ||
      program.programId === id ||
      program.name === id ||
      program.name === batch.program
  );
  return match?._id || id;
};

const getBatchRecordId = (batch: Batch) => batch._id || batch.batchId || "";

const toFormData = (batch: Batch, programs: Program[] = []): BatchFormData => ({
  year: batch.year || new Date().getFullYear(),
  code: batch.code || "",
  department:
    typeof batch.departmentId === "object" && batch.departmentId
      ? (batch.departmentId as { name?: string }).name || batch.department || ""
      : batch.department || "",
  departmentId: resolveRefId(batch.departmentId as string | { _id?: string } | null | undefined),
  program: batch.program || "",
  programId: resolveProgramId(batch, programs),
  admissionSession:
    typeof batch.admissionSessionId === "object" && batch.admissionSessionId
      ? (batch.admissionSessionId as { name?: string }).name || batch.admissionSession || ""
      : batch.admissionSession || "",
  admissionSessionId: resolveRefId(
    batch.admissionSessionId as string | { _id?: string; sessionId?: string } | null | undefined
  ),
  admissionSemester: batch.admissionSemester || "Fall",
  expectedGraduation: batch.expectedGraduation || new Date().getFullYear() + 4,
  status: batch.status || "Upcoming",
  description: batch.description || "",
});

const emptyForm = (sessions: AcademicSession[]): BatchFormData => {
  const current = sessions.find((s) => s.isCurrent);
  const year = new Date().getFullYear();
  return {
    year,
    code: "",
    department: "",
    departmentId: "",
    program: "",
    programId: "",
    admissionSession: current?.name || "",
    admissionSessionId: current?._id || "",
    admissionSemester: "Fall",
    expectedGraduation: year + 4,
    status: "Upcoming",
    description: "",
  };
};

interface BatchFormProps {
  mode: "create" | "edit";
  batch?: Batch | null;
}

export function BatchForm({ mode, batch }: BatchFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BatchFormData>(emptyForm([]));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOptions(true);
        const [deptRes, progRes, sessRes] = await Promise.all([
          departmentAPI.getAll(),
          programAPI.getAll({ limit: 200 }),
          academicSessionAPI.getAll(),
        ]);
        const deptList = deptRes?.data || [];
        const sessList = sessRes?.data || [];
        setDepartments(deptList);
        setPrograms(progRes?.data || []);
        setSessions(sessList);
        if (mode === "create") {
          setFormData(emptyForm(sessList));
        }
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, [mode]);

  useEffect(() => {
    if (mode === "edit" && batch && !loadingOptions) {
      setFormData(toFormData(batch, programs));
      setCodeManuallyEdited(true);
    }
  }, [mode, batch, loadingOptions, programs]);

  const filteredPrograms = useMemo(() => {
    if (!formData.departmentId) return programs;
    return programs.filter((p) => {
      const deptRef = p.departmentId;
      const deptId = typeof deptRef === "object" ? deptRef._id : deptRef;
      return deptId === formData.departmentId;
    });
  }, [programs, formData.departmentId]);

  const selectedProgram = programs.find((p) => p._id === formData.programId);

  const applySuggestedCode = (programCode: string, year: number, manual: boolean) => {
    if (manual) return undefined;
    return suggestBatchCode(programCode, year);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "code") setCodeManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    const dept = departments.find((d) => resolveDeptId(d) === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      department: dept?.name || "",
      program: "",
      programId: "",
      code: codeManuallyEdited ? prev.code : "",
    }));
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const programId = e.target.value;
    const program = programs.find((p) => p._id === programId);
    if (!program) {
      setFormData((prev) => ({ ...prev, programId: "", program: "", code: "" }));
      return;
    }
    const duration = program.duration || 4;
    const programCode = program.code || program.programId || "";
    setFormData((prev) => ({
      ...prev,
      programId: program._id || "",
      program: program.name,
      expectedGraduation: prev.year + duration,
      code:
        applySuggestedCode(programCode, prev.year, codeManuallyEdited) ??
        prev.code,
    }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value, 10) || 0;
    const program = programs.find((p) => p._id === formData.programId);
    const duration = program?.duration || 4;
    const programCode = program?.code || program?.programId || "";
    setFormData((prev) => ({
      ...prev,
      year,
      expectedGraduation: year + duration,
      code:
        applySuggestedCode(programCode, year, codeManuallyEdited) ?? prev.code,
    }));
  };

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value;
    const session = sessions.find(
      (s) => s._id === sessionId || s.sessionId === sessionId
    );
    setFormData((prev) => ({
      ...prev,
      admissionSessionId: sessionId,
      admissionSession: session?.name || "",
    }));
  };

  const validateWizardStep = (step: number) => {
    if (step === 1) {
      if (!formData.departmentId || !formData.programId || !formData.year || !formData.code.trim()) {
        toast.error("Select department, program, intake year, and batch code");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.admissionSessionId) {
        toast.error("Select the admission session (when this cohort joined)");
        return false;
      }
    }
    return true;
  };

  const goNextWizardStep = () => {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((s) => Math.min(3, s + 1));
  };

  const goPrevWizardStep = () => setWizardStep((s) => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create" && wizardStep < 3) {
      goNextWizardStep();
      return;
    }

    if (
      !formData.year ||
      !formData.code.trim() ||
      !formData.departmentId ||
      !formData.programId ||
      !formData.admissionSessionId
    ) {
      toast.error("Year, code, department, program, and admission session are required");
      return;
    }

    const submitData = {
      year: formData.year,
      code: formData.code.trim().toUpperCase(),
      department: formData.department,
      departmentId: formData.departmentId,
      program: formData.program,
      programId: formData.programId || formData.program,
      admissionSession: formData.admissionSession,
      admissionSessionId: formData.admissionSessionId,
      admissionSemester: formData.admissionSemester,
      expectedGraduation: formData.expectedGraduation,
      status: formData.status,
      description: formData.description || "",
    };

    setSaving(true);
    try {
      if (mode === "create") {
        const response = await batchAPI.create(submitData);
        if (response?.success === false) {
          toast.error(response?.message || "Failed to create batch");
          return;
        }
        toast.success(`Batch "${submitData.code}" created`);
      } else {
        const id = batch ? getBatchRecordId(batch) : "";
        if (!id) {
          toast.error("Cannot update batch: missing ID");
          return;
        }
        const response = await batchAPI.update(id, submitData);
        if (response?.success === false) {
          toast.error(response?.message || "Failed to update batch");
          return;
        }
        toast.success(`Batch "${submitData.code}" updated`);
      }
      navigate("/batches");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (mode === "create" ? "Failed to create batch" : "Failed to update batch");
      toast.error(message);
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

  const showStep = (step: number) => mode === "edit" || wizardStep === step;

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate("/batches")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to batches
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Batch" : "Edit Batch"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? `Step ${wizardStep} of 3 — Program & cohort, admission session, then status`
              : "Update cohort information"}
          </p>
        </div>

        {sessions.length === 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No academic sessions yet.{" "}
            <Link to="/academic-sessions" className="underline font-medium">
              Create a session
            </Link>{" "}
            before adding batches.
          </div>
        )}

        {mode === "create" && (
          <div className="flex gap-2 text-xs mb-6">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`rounded-full px-3 py-1 ${
                  wizardStep === step
                    ? "bg-primary text-primary-foreground"
                    : wizardStep > step
                      ? "bg-green-100 text-green-800"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step === 1 ? "Program" : step === 2 ? "Admission" : "Settings"}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {showStep(1) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {mode === "create" ? "Step 1 — Program & cohort" : "Batch information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleDepartmentChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={resolveDeptId(dept)}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="programId">Program *</Label>
                  <select
                    id="programId"
                    name="programId"
                    value={formData.programId}
                    onChange={handleProgramChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    disabled={!formData.departmentId}
                  >
                    <option value="">
                      {formData.departmentId ? "Select program" : "Select department first"}
                    </option>
                    {filteredPrograms.map((program) => (
                      <option key={program._id} value={program._id}>
                        {program.code} — {program.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Intake year *</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    min={2000}
                    max={2100}
                    value={formData.year}
                    onChange={handleYearChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Year students joined (e.g. 2024)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Batch code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="BSCS-2024"
                    required
                    className="uppercase"
                  />
                  {selectedProgram && !codeManuallyEdited && (
                    <p className="text-xs text-muted-foreground">
                      Auto-suggested: {suggestBatchCode(selectedProgram.code, formData.year)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {showStep(2) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                {mode === "create" ? "Step 2 — When did they join?" : "Admission information"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Admission session is when this cohort entered the university — not necessarily the
                session you teach in today.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admissionSessionId">Admission session *</Label>
                  <select
                    id="admissionSessionId"
                    name="admissionSessionId"
                    value={formData.admissionSessionId}
                    onChange={handleSessionChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select admission session</option>
                    {sessions.map((session) => {
                      const sessionId = session._id || session.sessionId || "";
                      return (
                        <option key={sessionId} value={sessionId}>
                          {session.name}
                          {session.isCurrent ? " (current)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionSemester">Admission term *</Label>
                  <select
                    id="admissionSemester"
                    name="admissionSemester"
                    value={formData.admissionSemester}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {SEMESTER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedGraduation">Expected graduation *</Label>
                  <Input
                    id="expectedGraduation"
                    name="expectedGraduation"
                    type="number"
                    min={2000}
                    max={2100}
                    value={formData.expectedGraduation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {showStep(3) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {mode === "create" ? "Step 3 — Status & notes" : "Batch settings"}
              </h3>
              {mode === "create" && formData.code && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{formData.code}</p>
                  <p className="text-muted-foreground">
                    {formData.program} · joined {formData.admissionSession || "—"} (
                    {formData.admissionSemester})
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional notes about this cohort..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4 border-t">
            <div>
              {mode === "create" && wizardStep > 1 && (
                <Button type="button" variant="outline" onClick={goPrevWizardStep}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/batches")}>
                Cancel
              </Button>
              {mode === "create" && wizardStep < 3 ? (
                <Button type="button" onClick={goNextWizardStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={saving} className="gradient-brand text-white border-0">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {mode === "create" ? "Create Batch" : "Update Batch"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BatchForm;
