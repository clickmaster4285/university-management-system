import { useCallback, useEffect, useMemo, useState } from "react";
import {
  semesterRegistrationAPI,
  type SemesterRegistration,
  type RegistrationPreview,
  type StudentCategory,
} from "@/features/semesterRegistration";
import { studentAPI, type Student } from "@/features/students";
import { programAPI, type Program } from "@/features/programs";
import { batchAPI, type Batch } from "@/features/batches";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Loader2,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STUDENT_CATEGORIES: StudentCategory[] = [
  "Regular",
  "Self-Finance",
  "Scholarship",
  "International",
];

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const resolveRefLabel = (
  value: string | { _id?: string; code?: string; name?: string } | null | undefined,
  fallback = "—"
) => {
  if (!value) return fallback;
  if (typeof value === "object") {
    return value.code || value.name || fallback;
  }
  return value;
};

const formatCurrency = (amount: number) =>
  `PKR ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const statusVariant = (status: string) => {
  switch (status) {
    case "Paid":
      return "default";
    case "Partial":
      return "secondary";
    case "Dropped":
      return "destructive";
    default:
      return "outline";
  }
};

export default function SemesterRegistrationsPage() {
  const [registrations, setRegistrations] = useState<SemesterRegistration[]>([]);
  const [stats, setStats] = useState({ total: 0, expectedRevenue: 0, registered: 0 });
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  const [sessionFilter, setSessionFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<RegistrationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingChallanId, setGeneratingChallanId] = useState<string | null>(null);

  const [form, setForm] = useState({
    studentId: "",
    programId: "",
    batchId: "",
    academicSessionId: "",
    programSemester: "1",
    studentCategory: "Regular" as StudentCategory,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [regs, statData, studentList, programList, batchList, sessionList] =
        await Promise.all([
          semesterRegistrationAPI.list({
            academicSessionId: sessionFilter || undefined,
            programId: programFilter || undefined,
            batchId: batchFilter || undefined,
          }),
          semesterRegistrationAPI.getStats({
            academicSessionId: sessionFilter || undefined,
            programId: programFilter || undefined,
            batchId: batchFilter || undefined,
          }),
          studentAPI.getAll(),
          programAPI.getAll(),
          batchAPI.getAll(),
          academicSessionAPI.getAll(),
        ]);
      setRegistrations(regs);
      setStats({
        total: statData.total,
        expectedRevenue: statData.expectedRevenue,
        registered: statData.byStatus?.Registered ?? 0,
      });
      setStudents(studentList);
      setPrograms(programList?.data || []);
      setBatches(batchList?.data || []);
      setSessions(sessionList?.data || []);
    } catch {
      toast.error("Failed to load semester registrations");
    } finally {
      setLoading(false);
    }
  }, [sessionFilter, programFilter, batchFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBatches = useMemo(() => {
    if (!form.programId) return batches;
    const program = programs.find((p) => p._id === form.programId);
    if (!program) return batches;
    return batches.filter(
      (b) =>
        b.programId === form.programId ||
        b.programId === program.programId ||
        b.program === program.code
    );
  }, [batches, form.programId, programs]);

  const columns: Column<SemesterRegistration>[] = [
    {
      key: "registrationId",
      header: "ID",
      cell: (row) => (
        <span className="font-mono text-xs">{row.registrationId || "—"}</span>
      ),
    },
    {
      key: "student",
      header: "Student",
      cell: (row) => resolveRefLabel(row.studentId, "—"),
    },
    {
      key: "program",
      header: "Program",
      cell: (row) => resolveRefLabel(row.programId),
    },
    {
      key: "batch",
      header: "Batch",
      cell: (row) => resolveRefLabel(row.batchId),
    },
    {
      key: "session",
      header: "Session",
      cell: (row) => resolveRefLabel(row.academicSessionId),
    },
    {
      key: "semester",
      header: "Sem",
      cell: (row) => `Sem ${row.programSemester}`,
    },
    {
      key: "netPayable",
      header: "Package total",
      cell: (row) => formatCurrency(row.semesterFeeSnapshot?.netPayable ?? 0),
    },
    {
      key: "enrollments",
      header: "Enrollments",
      cell: (row) => row.enrollmentIds?.length ?? 0,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          {!row.feeId && row.status !== "Dropped" && (
            <Button
              variant="ghost"
              size="sm"
              disabled={generatingChallanId === (row.registrationId || row._id)}
              onClick={() => handleGenerateChallan(row)}
            >
              {generatingChallanId === (row.registrationId || row._id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Challan"
              )}
            </Button>
          )}
          {row.feeId && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/challans">View bill</Link>
            </Button>
          )}
          {row.status === "Registered" && !row.feeId && (
            <Button variant="ghost" size="sm" onClick={() => handleDrop(row)}>
              Drop
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleGenerateChallan = async (row: SemesterRegistration) => {
    const id = row.registrationId || row._id;
    if (!id) return;
    setGeneratingChallanId(id);
    try {
      const result = await semesterRegistrationAPI.generateChallan(id, { dueDays: 30 });
      toast.success(`Challan ${result.challan.feeId} generated`);
      loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to generate challan";
      toast.error(message);
    } finally {
      setGeneratingChallanId(null);
    }
  };

  const handleDrop = async (row: SemesterRegistration) => {
    const id = row.registrationId || row._id;
    if (!id) return;
    try {
      await semesterRegistrationAPI.drop(id);
      toast.success("Registration dropped");
      loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to drop registration";
      toast.error(message);
    }
  };

  const handlePreview = async () => {
    if (!form.studentId || !form.programId || !form.batchId || !form.academicSessionId) {
      toast.error("Fill in student, program, batch, and session");
      return;
    }
    setPreviewLoading(true);
    try {
      const data = await semesterRegistrationAPI.preview({
        studentId: form.studentId,
        programId: form.programId,
        batchId: form.batchId,
        academicSessionId: form.academicSessionId,
        programSemester: parseInt(form.programSemester, 10),
        studentCategory: form.studentCategory,
        registrationMode: "package",
      });
      setPreview(data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Preview failed";
      toast.error(message);
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!preview?.semesterFeeSnapshot) {
      await handlePreview();
      return;
    }
    setSubmitting(true);
    try {
      const { data, warnings } = await semesterRegistrationAPI.create({
        studentId: form.studentId,
        programId: form.programId,
        batchId: form.batchId,
        academicSessionId: form.academicSessionId,
        programSemester: parseInt(form.programSemester, 10),
        studentCategory: form.studentCategory,
        registrationMode: "package",
      });
      toast.success(`Registered ${data.registrationId}`);
      if (warnings.length) {
        toast.warning(`${warnings.length} enrollment warning(s) — check details`);
      }
      setDialogOpen(false);
      setPreview(null);
      loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDialog = () => {
    const currentSession = sessions.find((s) => s.isCurrent);
    setForm({
      studentId: "",
      programId: programFilter || "",
      batchId: batchFilter || "",
      academicSessionId: sessionFilter || currentSession?._id || "",
      programSemester: "1",
      studentCategory: "Regular",
    });
    setPreview(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Semester Registrations</h1>
          <p className="text-sm text-muted-foreground">
            Register students for a semester package — fees locked from the active schedule
          </p>
        </div>
        <Button onClick={openDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Register student
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total registrations" value={stats.total} icon={ClipboardList} />
        <KpiCard label="Registered (unpaid)" value={stats.registered} icon={UserCheck} />
        <KpiCard
          label="Expected revenue"
          value={formatCurrency(stats.expectedRevenue)}
          icon={DollarSign}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <DataTable
        data={registrations}
        columns={columns}
        searchKeys={["registrationId"]}
        filterPanel={
          <div className="flex flex-wrap gap-3">
            <Select value={sessionFilter || "all"} onValueChange={(v) => setSessionFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s._id} value={s._id!}>
                    {s.code || s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={programFilter || "all"} onValueChange={(v) => setProgramFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p._id} value={p._id!}>
                    {p.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={batchFilter || "all"} onValueChange={(v) => setBatchFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b._id} value={b._id!}>
                    {b.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register for semester package</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Student</Label>
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s._id} value={s._id!}>
                      {s.name} ({s.program})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Program</Label>
                <Select
                  value={form.programId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, programId: v, batchId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p._id} value={p._id!}>
                        {p.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Batch</Label>
                <Select
                  value={form.batchId}
                  onValueChange={(v) => setForm((f) => ({ ...f, batchId: v }))}
                  disabled={!form.programId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatches.map((b) => (
                      <SelectItem key={b._id} value={b._id!}>
                        {b.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Academic session</Label>
                <Select
                  value={form.academicSessionId}
                  onValueChange={(v) => setForm((f) => ({ ...f, academicSessionId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s._id} value={s._id!}>
                        {s.code || s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Program semester</Label>
                <Select
                  value={form.programSemester}
                  onValueChange={(v) => setForm((f) => ({ ...f, programSemester: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Semester {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Student category</Label>
              <Select
                value={form.studentCategory}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, studentCategory: v as StudentCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preview && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
                {preview.existingRegistration ? (
                  <p className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Already registered ({preview.existingRegistration.registrationId})
                  </p>
                ) : preview.schedule ? (
                  <>
                    <p>
                      Package <span className="font-mono">{preview.schedule.scheduleId}</span> —{" "}
                      {preview.schedule.subjectCount} subjects
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(preview.semesterFeeSnapshot?.netPayable ?? 0)}
                    </p>
                    <p className="text-muted-foreground">
                      {preview.linkedEnrollmentCount} existing enrollments will be linked; new
                      enrollments created for remaining offerings.
                    </p>
                  </>
                ) : (
                  <p className="text-destructive">No active fee package for this scope</p>
                )}
                {preview.warnings?.length > 0 && (
                  <ul className="text-amber-600 dark:text-amber-400 space-y-1">
                    {preview.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {w.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Preview
            </Button>
            <Button
              onClick={handleRegister}
              disabled={
                submitting ||
                !preview?.semesterFeeSnapshot ||
                !!preview?.existingRegistration
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
