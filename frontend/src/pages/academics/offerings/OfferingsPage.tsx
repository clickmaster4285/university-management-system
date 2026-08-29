import { useCallback, useEffect, useMemo, useState } from "react";
import {
  offeringAPI,
  type CourseOffering,
  type Enrollment,
  type OfferingStats,
} from "@/features/offerings";
import { programAPI, type Program, type ProgramCurriculumItem } from "@/features/programs";
import { batchAPI, type Batch } from "@/features/batches";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import { teacherAPI, type Teacher } from "@/features/teachers";
import { studentAPI, type Student } from "@/features/students";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

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
    if (value.code && value.name) return `${value.code} — ${value.name}`;
    return value.name || value.code || fallback;
  }
  return value;
};

const getOfferingId = (offering: CourseOffering) => offering._id || offering.offeringId || "";

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [curriculum, setCurriculum] = useState<ProgramCurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OfferingStats>({
    total: 0,
    active: 0,
    draft: 0,
    completed: 0,
    totalEnrollments: 0,
  });

  const [programFilter, setProgramFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    programId: "",
    batchId: "",
    academicSessionId: "",
    semester: "1",
    subjectId: "",
    instructorId: "",
    capacity: "30",
  });

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [offeringRes, programRes, batchRes, sessionRes, teacherRes, statsRes] = await Promise.all([
        offeringAPI.getAll({ limit: 500 }),
        programAPI.getAll({ limit: 100 }),
        batchAPI.getAll(),
        academicSessionAPI.getAll(),
        teacherAPI.getAll({ limit: 200 }),
        offeringAPI.getStats(),
      ]);
      setOfferings(offeringRes?.data || []);
      setPrograms(programRes?.data || []);
      setBatches(batchRes?.data || []);
      setSessions(sessionRes?.data || []);
      setTeachers(teacherRes || []);
      setStats(statsRes?.data || { total: 0, active: 0, draft: 0, completed: 0, totalEnrollments: 0 });
    } catch {
      toast.error("Failed to load offerings");
      setOfferings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!form.programId) {
      setCurriculum([]);
      return;
    }
    programAPI
      .getCurriculum(form.programId)
      .then((res) => {
        const semesters = res?.data?.semesters || [];
        const flat = semesters.flatMap(
          (sem: { items?: ProgramCurriculumItem[] }) => sem.items || []
        );
        setCurriculum(flat);
      })
      .catch(() => setCurriculum([]));
  }, [form.programId]);

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

  const curriculumSubjects = useMemo(() => {
    const semester = parseInt(form.semester, 10);
    return curriculum.filter((item) => item.semester === semester && item.status !== "Inactive");
  }, [curriculum, form.semester]);

  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      if (programFilter !== "all" && resolveRefId(o.programId) !== programFilter) return false;
      if (sessionFilter !== "all" && resolveRefId(o.academicSessionId) !== sessionFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [offerings, programFilter, sessionFilter, statusFilter]);

  const openEnrollDialog = async (offering: CourseOffering) => {
    setSelectedOffering(offering);
    setEnrollOpen(true);
    setSelectedStudentId("");
    setEnrollmentsLoading(true);
    try {
      const [enrollRes, studentList] = await Promise.all([
        offeringAPI.getEnrollments(getOfferingId(offering)),
        studentAPI.getAll(),
      ]);
      setEnrollments(enrollRes?.data || []);
      setStudents(studentList || []);
    } catch {
      toast.error("Failed to load enrollments");
      setEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.programId || !form.batchId || !form.academicSessionId || !form.subjectId) {
      toast.error("Program, batch, session and subject are required");
      return;
    }
    try {
      setCreating(true);
      await offeringAPI.create({
        programId: form.programId,
        batchId: form.batchId,
        academicSessionId: form.academicSessionId,
        semester: parseInt(form.semester, 10),
        subjectId: form.subjectId,
        instructorId: form.instructorId || null,
        capacity: parseInt(form.capacity, 10) || 30,
        status: "Active",
      });
      toast.success("Offering created");
      setCreateOpen(false);
      setForm({
        programId: "",
        batchId: "",
        academicSessionId: "",
        semester: "1",
        subjectId: "",
        instructorId: "",
        capacity: "30",
      });
      fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to create offering");
    } finally {
      setCreating(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedOffering || !selectedStudentId) {
      toast.error("Select a student");
      return;
    }
    try {
      setEnrolling(true);
      await offeringAPI.enrollStudent(getOfferingId(selectedOffering), selectedStudentId);
      toast.success("Student enrolled — fee snapshot locked");
      const enrollRes = await offeringAPI.getEnrollments(getOfferingId(selectedOffering));
      setEnrollments(enrollRes?.data || []);
      setSelectedStudentId("");
      fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const handleDrop = async (enrollment: Enrollment) => {
    if (!selectedOffering) return;
    const studentId = resolveRefId(enrollment.studentId);
    if (!studentId) return;
    if (!confirm("Drop this student from the offering?")) return;
    try {
      await offeringAPI.dropStudent(getOfferingId(selectedOffering), studentId);
      toast.success("Student dropped");
      const enrollRes = await offeringAPI.getEnrollments(getOfferingId(selectedOffering));
      setEnrollments(enrollRes?.data || []);
      fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Drop failed");
    }
  };

  const handleDelete = async (offering: CourseOffering) => {
    const id = getOfferingId(offering);
    if (!id) return;
    if (!confirm(`Delete offering ${offering.offeringId || ""}?`)) return;
    try {
      await offeringAPI.delete(id);
      toast.success("Offering deleted");
      fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Delete failed");
    }
  };

  const columns: Column<CourseOffering>[] = [
    {
      key: "offeringId",
      header: "ID",
      cell: (o) => <span className="font-mono text-sm">{o.offeringId || "—"}</span>,
    },
    {
      key: "subjectId",
      header: "Subject",
      cell: (o) => resolveRefLabel(o.subjectId),
    },
    {
      key: "programId",
      header: "Program",
      cell: (o) => resolveRefLabel(o.programId),
    },
    {
      key: "batchId",
      header: "Batch",
      cell: (o) =>
        typeof o.batchId === "object" ? o.batchId.code || o.batchId.batchId || "—" : o.batchId,
    },
    {
      key: "academicSessionId",
      header: "Session",
      cell: (o) =>
        typeof o.academicSessionId === "object" ? o.academicSessionId.name : o.academicSessionId,
    },
    { key: "semester", header: "Sem" },
    {
      key: "enrolledStudents",
      header: "Seats",
      cell: (o) => (
        <span>
          {o.enrolledStudents}/{o.capacity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => (
        <Badge variant={o.status === "Active" ? "default" : "secondary"}>{o.status}</Badge>
      ),
    },
    {
      key: "_id",
      header: "Actions",
      cell: (o) => (
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => openEnrollDialog(o)} title="Enrollments">
            <Users className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(o)} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const enrolledStudentIds = new Set(
    enrollments.filter((e) => e.status === "Enrolled").map((e) => resolveRefId(e.studentId))
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Offerings" value={stats.total} icon={BookOpen} />
        <KpiCard title="Active" value={stats.active} icon={Layers} />
        <KpiCard title="Enrollments" value={stats.totalEnrollments} icon={GraduationCap} />
        <KpiCard title="Completed" value={stats.completed} icon={Calendar} />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Program</Label>
            <select
              className="mt-1 block w-44 rounded-md border bg-background px-3 py-2 text-sm"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
            >
              <option value="all">All programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Session</Label>
            <select
              className="mt-1 block w-44 rounded-md border bg-background px-3 py-2 text-sm"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
            >
              <option value="all">All sessions</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <select
              className="mt-1 block w-36 rounded-md border bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Offering
        </Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredOfferings} emptyMessage="No offerings yet" />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Course Offering</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Program</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.programId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, programId: e.target.value, batchId: "", subjectId: "" }))
                }
              >
                <option value="">Select program</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Semester</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.semester}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, semester: e.target.value, subjectId: "" }))
                  }
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Subject (from curriculum)</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                disabled={!form.programId}
              >
                <option value="">Select subject</option>
                {curriculumSubjects.map((item) => {
                  const subject = item.subjectId;
                  const id = typeof subject === "object" ? subject._id : subject;
                  const label =
                    typeof subject === "object" ? `${subject.code} — ${subject.name}` : subject;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <Label>Batch</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                disabled={!form.programId}
              >
                <option value="">Select batch</option>
                {filteredBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.code} ({b.year})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Academic Session</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.academicSessionId}
                onChange={(e) => setForm((f) => ({ ...f, academicSessionId: e.target.value }))}
              >
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Instructor (optional)</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.instructorId}
                onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Enrollments — {selectedOffering?.offeringId}{" "}
              {selectedOffering && resolveRefLabel(selectedOffering.subjectId)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-end gap-3 border-b pb-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Add student</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">Select student</option>
                {students
                  .filter((s) => s._id && !enrolledStudentIds.has(s._id) && s.status === "Active")
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.studentId || s._id} — {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <Button onClick={handleEnroll} disabled={enrolling || !selectedStudentId}>
              {enrolling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Enroll
            </Button>
          </div>

          {enrollmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : enrollments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No enrollments yet</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => {
                const student = e.studentId;
                const name = typeof student === "object" ? student.name : student;
                const sid = typeof student === "object" ? student.studentId : "";
                return (
                  <div
                    key={e._id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{sid}</p>
                      <p className="mt-1 text-sm">
                        Fee locked:{" "}
                        <span className="font-mono">
                          {e.feeSnapshot.totalFee.toLocaleString()} ({e.feeSnapshot.feePerCredit}/
                          credit × {e.feeSnapshot.credits})
                        </span>
                      </p>
                      <Badge variant={e.status === "Enrolled" ? "default" : "secondary"} className="mt-2">
                        {e.status}
                      </Badge>
                    </div>
                    {e.status === "Enrolled" && (
                      <Button size="sm" variant="ghost" onClick={() => handleDrop(e)}>
                        Drop
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
