import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  programAPI,
  type ProgramCurriculumEntry,
  type CurriculumType,
} from "@/features/programs";
import { subjectAPI, type Subject } from "@/features/subjects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { ProgramProgramNav } from "./ProgramProgramNav";

const CURRICULUM_TYPES: CurriculumType[] = ["Core", "Elective", "Optional"];

type DraftEntry = ProgramCurriculumEntry & { key: string };

const resolveSubjectId = (value: string | { _id: string }) =>
  typeof value === "object" ? value._id : value;

const getProgramRecordId = (program: { _id?: string; programId?: string }) =>
  program._id || program.programId || "";

export default function ProgramCurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programName, setProgramName] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [duration, setDuration] = useState(8);
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [summary, setSummary] = useState({ totalSubjects: 0, totalCredits: 0 });
  const [addSemester, setAddSemester] = useState(1);
  const [addSubjectId, setAddSubjectId] = useState("");

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [curriculumRes, subjectRes] = await Promise.all([
        programAPI.getCurriculum(id),
        subjectAPI.getAll({ limit: 500 }),
      ]);

      const data = curriculumRes.data;
      const program = data.program;
      setProgramName(program.name);
      setProgramCode(program.code);
      setDuration(program.duration || 8);
      setSummary(data.summary || { totalSubjects: 0, totalCredits: 0 });

      const catalogSubjects: Subject[] = subjectRes?.data || [];
      const curriculumSubjects: Subject[] = [];
      const flatEntries: DraftEntry[] = [];

      for (const semester of data.semesters || []) {
        for (const item of semester.items) {
          const subjectId = resolveSubjectId(item.subjectId);
          if (typeof item.subjectId === "object" && item.subjectId) {
            curriculumSubjects.push({
              _id: item.subjectId._id,
              code: item.subjectId.code,
              name: item.subjectId.name,
              credits: item.subjectId.credits,
              ...(item.subjectId.departmentId ? { departmentId: item.subjectId.departmentId } : {}),
              status: item.subjectId.status as Subject["status"],
            });
          }
          flatEntries.push({
            key: `${subjectId}-${item.semester}`,
            subjectId,
            semester: item.semester,
            type: item.type,
            order: item.order,
            status: item.status,
          });
        }
      }
      setEntries(flatEntries);

      const merged = new Map<string, Subject>();
      for (const subject of [...catalogSubjects, ...curriculumSubjects]) {
        const sid = subject._id || subject.subjectId || "";
        if (sid) merged.set(sid, subject);
      }
      setAllSubjects([...merged.values()].filter((s) => (s.status || "Active") === "Active"));
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to load program curriculum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    allSubjects.forEach((s) => {
      const sid = s._id || s.subjectId || "";
      if (sid) map.set(sid, s);
    });
    return map;
  }, [allSubjects]);

  const getDeptName = (subject: Subject | undefined) => {
    if (!subject?.departmentId) return "";
    if (typeof subject.departmentId === "object") return subject.departmentId.name;
    return "";
  };

  const usedSubjectIds = useMemo(() => new Set(entries.map((e) => e.subjectId)), [entries]);

  const availableSubjects = useMemo(
    () => allSubjects.filter((s) => !usedSubjectIds.has(s._id || s.subjectId || "")),
    [allSubjects, usedSubjectIds]
  );

  const semesters = useMemo(() => {
    return Array.from({ length: duration }, (_, i) => {
      const semester = i + 1;
      const items = entries
        .filter((e) => e.semester === semester)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((entry) => ({
          entry,
          subject: subjectMap.get(entry.subjectId),
        }));

      const totalCredits = items.reduce((sum, item) => sum + (item.subject?.credits || 0), 0);
      return { semester, items, totalCredits };
    });
  }, [duration, entries, subjectMap]);

  const liveSummary = useMemo(() => {
    const totalSubjects = entries.length;
    const totalCredits = entries.reduce((sum, entry) => {
      const subject = subjectMap.get(entry.subjectId);
      return sum + (subject?.credits || 0);
    }, 0);
    return { totalSubjects, totalCredits };
  }, [entries, subjectMap]);

  const addSubjectToSemester = () => {
    if (!addSubjectId) {
      toast.error("Select a subject to add");
      return;
    }
    if (usedSubjectIds.has(addSubjectId)) {
      toast.error("Subject is already in this program curriculum");
      return;
    }

    const semesterEntries = entries.filter((e) => e.semester === addSemester);
    setEntries((prev) => [
      ...prev,
      {
        key: `${addSubjectId}-${addSemester}-${Date.now()}`,
        subjectId: addSubjectId,
        semester: addSemester,
        type: "Core",
        order: semesterEntries.length + 1,
        status: "Active",
      },
    ]);
    setAddSubjectId("");
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  const updateEntry = (key: string, patch: Partial<DraftEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e))
    );
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const payload: ProgramCurriculumEntry[] = entries.map((entry, index) => ({
        subjectId: entry.subjectId,
        semester: entry.semester,
        type: entry.type,
        order: entry.order ?? index + 1,
        status: entry.status,
      }));

      const res = await programAPI.updateCurriculum(id, payload);
      toast.success("Program curriculum saved");
      setSummary(res.data?.summary || liveSummary);
      await fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to save curriculum");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Button variant="outline" onClick={() => navigate("/programs")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Programs
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-brand text-white border-0"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Curriculum</>
          )}
        </Button>
      </div>

      <ProgramProgramNav active="curriculum" programCode={programCode} />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <KpiCard label="Program" value={programCode} icon={GraduationCap} />
        <KpiCard label="Subjects in Plan" value={liveSummary.totalSubjects} icon={BookOpen} />
        <KpiCard label="Total Credits" value={liveSummary.totalCredits} icon={Layers} />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{programName}</CardTitle>
          <CardDescription>
            Build the semester-wise subject plan for this program ({duration} semesters).
            The same subject can be used in multiple programs (e.g. CSC101 in BSCS and BSIT).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="add-semester">Semester</Label>
              <select
                id="add-semester"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={addSemester}
                onChange={(e) => setAddSemester(Number(e.target.value))}
              >
                {Array.from({ length: duration }, (_, i) => i + 1).map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="add-subject">Subject</Label>
              <select
                id="add-subject"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={addSubjectId}
                onChange={(e) => setAddSubjectId(e.target.value)}
              >
                <option value="">Select subject</option>
                {availableSubjects.map((s) => {
                  const deptLabel = getDeptName(s);
                  return (
                    <option key={s._id} value={s._id}>
                      {s.code} — {s.name} ({s.credits} cr){deptLabel ? ` · ${deptLabel}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <Button type="button" onClick={addSubjectToSemester} disabled={!availableSubjects.length}>
              <Plus className="h-4 w-4 mr-2" /> Add to semester
            </Button>
          </div>
          {allSubjects.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              No active subjects in the catalog. Create subjects first under Subjects.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {semesters.map(({ semester, items, totalCredits }) => (
          <Card key={semester}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Semester {semester}</CardTitle>
                <Badge variant="secondary">{totalCredits} credits</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                  No subjects assigned yet
                </p>
              ) : (
                items.map(({ entry, subject }) => (
                  <div
                    key={entry.key}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm">{subject?.code || "—"}</div>
                      <div className="text-sm truncate">{subject?.name || "Unknown subject"}</div>
                      <div className="text-xs text-muted-foreground">{subject?.credits || 0} credit hours</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={entry.type}
                        onChange={(e) =>
                          updateEntry(entry.key, { type: e.target.value as CurriculumType })
                        }
                      >
                        {CURRICULUM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeEntry(entry.key)}
                        title="Remove subject"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.totalSubjects > 0 && summary.totalCredits !== liveSummary.totalCredits && (
        <p className="text-xs text-muted-foreground mt-4">
          Saved plan: {summary.totalSubjects} subjects, {summary.totalCredits} credits.
          You have unsaved changes.
        </p>
      )}
    </>
  );
}
