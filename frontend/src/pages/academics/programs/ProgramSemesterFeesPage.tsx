import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { programAPI } from "@/features/programs";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import {
  programSemesterFeeAPI,
  type AdditionalFeeLine,
  type ProgramSemesterFeeSchedule,
  type ScheduleStatus,
  type StudentCategory,
} from "@/features/programSemesterFee";
import { ProgramProgramNav } from "./ProgramProgramNav";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STUDENT_CATEGORIES: StudentCategory[] = [
  "Regular",
  "Self-Finance",
  "Scholarship",
  "International",
];

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return `PKR ${value.toLocaleString()}`;
};

const getScheduleId = (schedule: ProgramSemesterFeeSchedule) => schedule._id || "";

const statusBadge = (status: ScheduleStatus | null) => {
  if (!status) return <Badge variant="outline">Not built</Badge>;
  if (status === "Active") return <Badge className="bg-green-100 text-green-800 border-0">Published</Badge>;
  if (status === "Draft") return <Badge className="bg-amber-100 text-amber-900 border-0">Draft — publish when ready</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const pickScheduleForSemester = (
  schedules: ProgramSemesterFeeSchedule[],
  semester: number
): ProgramSemesterFeeSchedule | undefined => {
  const rows = schedules.filter((s) => s.semester === semester);
  return (
    rows.find((s) => s.status === "Active") ||
    rows.find((s) => s.status === "Draft") ||
    rows[0]
  );
};

const emptyAdditionalFee = (): AdditionalFeeLine => ({
  name: "",
  type: "Fixed",
  amount: 0,
  percentage: 0,
  description: "",
  isOptional: false,
  appliesTo: "All",
});

export default function ProgramSemesterFeesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busySemester, setBusySemester] = useState<number | "all" | null>(null);
  const [savingSemester, setSavingSemester] = useState<number | null>(null);

  const [programName, setProgramName] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [duration, setDuration] = useState(8);

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [academicSessionId, setAcademicSessionId] = useState("");
  const [studentCategory, setStudentCategory] = useState<StudentCategory>("Regular");
  const [schedules, setSchedules] = useState<ProgramSemesterFeeSchedule[]>([]);

  const [expandedSemester, setExpandedSemester] = useState<number | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<ProgramSemesterFeeSchedule | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshingSemester, setRefreshingSemester] = useState<number | null>(null);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFeeLine[]>([]);

  const fetchSchedules = useCallback(async (programId: string, sessionId: string) => {
    const listRes = await programSemesterFeeAPI.listForProgram(programId, {
      academicSessionId: sessionId,
    });
    return (listRes?.data || []) as ProgramSemesterFeeSchedule[];
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [programRes, sessionRes] = await Promise.all([
        programAPI.getById(id),
        academicSessionAPI.getAll(),
      ]);

      const program = programRes?.data;
      if (program) {
        setProgramName(program.name);
        setProgramCode(program.code);
        setDuration(program.duration || 8);
      }

      const sessionList: AcademicSession[] = sessionRes?.data || [];
      setSessions(sessionList);

      const current = sessionList.find((s) => s.isCurrent);
      const sessionId = academicSessionId || current?._id || sessionList[0]?._id || "";
      if (!academicSessionId && sessionId) {
        setAcademicSessionId(sessionId);
      }

      if (sessionId) {
        setSchedules(await fetchSchedules(id, sessionId));
      } else {
        setSchedules([]);
      }
    } catch {
      toast.error("Failed to load semester fees");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [id, academicSessionId, fetchSchedules]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const semesterRows = useMemo(() => {
    return Array.from({ length: duration }, (_, i) => {
      const semester = i + 1;
      const schedule = pickScheduleForSemester(schedules, semester);
      const hasMissingRates = schedule?.subjectLines?.some((l) => l.missingRate) ?? false;
      return {
        semester,
        schedule,
        subjectCount: schedule?.subjectLines?.length ?? 0,
        subjectTotal: schedule?.totalSubjectFee ?? null,
        extras: schedule?.totalAdditionalFee ?? null,
        grandTotal: schedule?.netPayable ?? null,
        status: schedule?.status ?? null,
        hasMissingRates,
        canPublish: !!schedule && schedule.status === "Draft" && !hasMissingRates,
      };
    });
  }, [duration, schedules]);

  const summary = useMemo(() => {
    const activeCount = semesterRows.filter((r) => r.status === "Active").length;
    const draftCount = semesterRows.filter((r) => r.status === "Draft").length;
    const notBuilt = semesterRows.filter((r) => !r.schedule).length;
    const publishableDrafts = semesterRows.filter((r) => r.canPublish).length;
    const totals = semesterRows
      .map((r) => r.grandTotal)
      .filter((v): v is number => v !== null);
    return {
      activeCount,
      draftCount,
      notBuilt,
      publishableDrafts,
      minTotal: totals.length ? Math.min(...totals) : null,
      maxTotal: totals.length ? Math.max(...totals) : null,
    };
  }, [semesterRows]);

  const loadSemesterDetail = async (schedule: ProgramSemesterFeeSchedule, semester: number) => {
    const scheduleId = getScheduleId(schedule);
    if (!scheduleId) return;
    if (expandedSemester === semester) {
      setExpandedSemester(null);
      setDetailSchedule(null);
      return;
    }
    try {
      setDetailLoading(true);
      setExpandedSemester(semester);
      const res = await programSemesterFeeAPI.getById(scheduleId, { live: true });
      const full = res?.data as ProgramSemesterFeeSchedule;
      setDetailSchedule(full);
      setAdditionalFees(full.additionalFees?.length ? [...full.additionalFees] : []);
    } catch {
      toast.error("Failed to load semester details");
      setExpandedSemester(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGenerate = async (semester?: number) => {
    if (!id || !academicSessionId) {
      toast.error("Select an academic session first");
      return;
    }
    try {
      setBusySemester(semester ?? "all");
      const res = await programSemesterFeeAPI.generate(id, {
        academicSessionId,
        studentCategory,
        semester,
      });
      const warnings = res?.meta?.warnings || [];
      const generated = (res?.data || []) as ProgramSemesterFeeSchedule[];
      setSchedules(await fetchSchedules(id, academicSessionId));

      if (warnings.length) {
        toast.warning("Built with warnings — fix missing subject fees before publishing");
      } else if (semester) {
        toast.success(`Semester ${semester} built. Add extras if needed, then Publish.`);
        const first = generated.find((s) => s.semester === semester) || generated[0];
        if (first) await loadSemesterDetail(first, semester);
      } else {
        toast.success(`Built ${generated.length} semester fee draft(s). Review and publish when ready.`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to build semester fees");
    } finally {
      setBusySemester(null);
    }
  };

  const publishSchedule = async (
    schedule: ProgramSemesterFeeSchedule,
    semester: number,
    fees?: AdditionalFeeLine[]
  ) => {
    const scheduleId = getScheduleId(schedule);
    if (!scheduleId) return;

    if (schedule.subjectLines?.some((l) => l.missingRate)) {
      toast.error(`Semester ${semester}: set subject fee rates before publishing`);
      return;
    }

    try {
      setBusySemester(semester);
      if (fees) {
        const invalid = fees.some((f) => !f.name.trim());
        if (invalid) {
          toast.error("Each additional fee needs a name");
          return;
        }
        await programSemesterFeeAPI.update(scheduleId, { additionalFees: fees });
      }
      await programSemesterFeeAPI.activate(scheduleId);
      toast.success(`Semester ${semester} published — students can be billed this package`);
      setExpandedSemester(null);
      setDetailSchedule(null);
      if (id && academicSessionId) {
        setSchedules(await fetchSchedules(id, academicSessionId));
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to publish");
    } finally {
      setBusySemester(null);
    }
  };

  const handleRefreshRates = async (semester: number) => {
    if (!detailSchedule) return;
    const scheduleId = getScheduleId(detailSchedule);
    if (!scheduleId) return;
    try {
      setRefreshingSemester(semester);
      const res = await programSemesterFeeAPI.refreshRates(scheduleId);
      const full = res?.data as ProgramSemesterFeeSchedule;
      setDetailSchedule(full);
      if (id && academicSessionId) {
        setSchedules(await fetchSchedules(id, academicSessionId));
      }
      toast.success("Package updated to current subject fee rates");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to refresh rates");
    } finally {
      setRefreshingSemester(null);
    }
  };

  const handleSaveExtras = async (semester: number) => {
    if (!detailSchedule) return;
    const scheduleId = getScheduleId(detailSchedule);
    if (!scheduleId) return;

    const invalid = additionalFees.some((f) => !f.name.trim());
    if (invalid) {
      toast.error("Each additional fee needs a name");
      return;
    }

    try {
      setSavingSemester(semester);
      const res = await programSemesterFeeAPI.update(scheduleId, { additionalFees });
      setDetailSchedule(res.data);
      if (id && academicSessionId) {
        setSchedules(await fetchSchedules(id, academicSessionId));
      }
      toast.success("Extras saved");
    } catch {
      toast.error("Failed to save extras");
    } finally {
      setSavingSemester(null);
    }
  };

  const handlePublishAll = async () => {
    const ready = semesterRows.filter((r) => r.canPublish && r.schedule);
    if (!ready.length) {
      toast.info("No draft semesters ready to publish");
      return;
    }
    setBusySemester("all");
    let ok = 0;
    for (const row of ready) {
      try {
        await programSemesterFeeAPI.activate(getScheduleId(row.schedule!));
        ok += 1;
      } catch {
        // continue with others
      }
    }
    if (id && academicSessionId) {
      setSchedules(await fetchSchedules(id, academicSessionId));
    }
    setBusySemester(null);
    toast.success(`Published ${ok} of ${ready.length} semester(s)`);
  };

  const updateAdditionalFee = (index: number, patch: Partial<AdditionalFeeLine>) => {
    setAdditionalFees((prev) => prev.map((fee, i) => (i === index ? { ...fee, ...patch } : fee)));
  };

  const workflowStep = summary.notBuilt === duration ? 1 : summary.activeCount < duration ? 2 : 3;

  if (loading && !programCode) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <Button variant="outline" onClick={() => navigate("/programs")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Programs
        </Button>
        <Button variant="outline" onClick={() => fetchData()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <ProgramProgramNav active="semester-fees" programCode={programCode} />

      {/* Simple workflow */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">How this works</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                <strong>1. Build</strong> fees from curriculum → <strong>2. Add extras</strong> (optional) →{" "}
                <strong>3. Publish</strong> so the semester package is live. One click per step where possible.
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                <Badge variant={workflowStep >= 1 ? "default" : "outline"}>1. Session & category</Badge>
                <Badge variant={workflowStep >= 2 ? "default" : "outline"}>2. Build fees</Badge>
                <Badge variant={workflowStep >= 3 ? "default" : "outline"}>3. Publish</Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={() => handleGenerate()}
                disabled={busySemester !== null || !academicSessionId}
                className="gradient-brand text-white border-0"
              >
                {busySemester === "all" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Build all semesters
              </Button>
              {summary.publishableDrafts > 0 && (
                <Button
                  variant="secondary"
                  onClick={handlePublishAll}
                  disabled={busySemester !== null}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Publish all ready ({summary.publishableDrafts})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <KpiCard label="Published" value={`${summary.activeCount}/${duration}`} icon={CheckCircle2} tone="success" />
        <KpiCard label="Drafts" value={summary.draftCount} icon={Sparkles} tone="warning" />
        <KpiCard label="Not built" value={summary.notBuilt} icon={Wallet} />
        <KpiCard
          label="Package range"
          value={
            summary.minTotal !== null && summary.maxTotal !== null
              ? summary.minTotal === summary.maxTotal
                ? formatMoney(summary.minTotal)
                : `${formatMoney(summary.minTotal)} – ${formatMoney(summary.maxTotal)}`
              : "—"
          }
          icon={Wallet}
        />
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{programName}</CardTitle>
          <CardDescription>Applies to all semesters below for the selected session.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="fee-session">Academic session</Label>
              <select
                id="fee-session"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={academicSessionId}
                onChange={(e) => setAcademicSessionId(e.target.value)}
              >
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}{s.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-category">Student category</Label>
              <select
                id="fee-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={studentCategory}
                onChange={(e) => setStudentCategory(e.target.value as StudentCategory)}
              >
                {STUDENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semester packages</CardTitle>
          <CardDescription>
            Click a row to add extras. Use <strong>Publish</strong> when the total looks right.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : semesterRows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No semesters configured for this program.</p>
          ) : (
            semesterRows.map((row) => (
              <Collapsible
                key={row.semester}
                open={expandedSemester === row.semester}
                onOpenChange={(open) => {
                  if (!open) {
                    setExpandedSemester(null);
                    setDetailSchedule(null);
                  } else if (row.schedule) {
                    loadSemesterDetail(row.schedule, row.semester);
                  }
                }}
              >
                <div
                  className={cn(
                    "rounded-lg border transition-colors",
                    row.status === "Active" && "border-green-200 bg-green-50/30",
                    expandedSemester === row.semester && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                    <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4 items-center">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="font-semibold">Sem {row.semester}</p>
                        <div className="mt-1">{statusBadge(row.status)}</div>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs">Subjects</p>
                        <p className="font-medium">{row.subjectCount || "—"}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs">Tuition</p>
                        <p className="font-medium">{formatMoney(row.subjectTotal)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs">Extras</p>
                        <p className="font-medium">{formatMoney(row.extras)}</p>
                      </div>
                      <div className="text-sm col-span-2 sm:col-span-1">
                        <p className="text-muted-foreground text-xs">Total</p>
                        <p className="font-bold text-primary">{formatMoney(row.grandTotal)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      {row.hasMissingRates && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                          Fix subject fees
                        </Badge>
                      )}

                      {!row.schedule ? (
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(row.semester)}
                          disabled={busySemester !== null || !academicSessionId}
                        >
                          {busySemester === row.semester ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" /> Build
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          {row.status === "Draft" && (
                            <Button
                              size="sm"
                              className="gradient-brand text-white border-0"
                              disabled={busySemester !== null || !row.canPublish}
                              onClick={() => publishSchedule(row.schedule!, row.semester)}
                              title={row.hasMissingRates ? "Set subject fee rates first" : "Publish this semester package"}
                            >
                              {busySemester === row.semester ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-1" /> Publish
                                </>
                              )}
                            </Button>
                          )}
                          <CollapsibleTrigger asChild>
                            <Button size="sm" variant="outline">
                              {expandedSemester === row.semester ? "Hide" : "Extras & details"}
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 ml-1 transition-transform",
                                  expandedSemester === row.semester && "rotate-180"
                                )}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        </>
                      )}
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/20">
                      {detailLoading && expandedSemester === row.semester ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : detailSchedule && expandedSemester === row.semester ? (
                        <>
                          {detailSchedule.livePreview?.ratesStale && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="text-sm text-amber-900">
                                <p className="font-medium">Subject fees have changed</p>
                                <p className="text-amber-800">
                                  The table below shows <strong>today&apos;s rates</strong>. Your published
                                  package still uses older amounts until you apply the update.
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-300 bg-white shrink-0"
                                disabled={refreshingSemester === row.semester}
                                onClick={() => handleRefreshRates(row.semester)}
                              >
                                {refreshingSemester === row.semester ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1" /> Apply current rates
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div className="rounded-md border bg-background p-2">
                              <p className="text-xs text-muted-foreground">Tuition (current)</p>
                              <p className="font-semibold">
                                {formatMoney(
                                  detailSchedule.livePreview?.totalSubjectFee ??
                                    detailSchedule.totalSubjectFee
                                )}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background p-2">
                              <p className="text-xs text-muted-foreground">Extras</p>
                              <p className="font-semibold">
                                {formatMoney(
                                  detailSchedule.livePreview?.totalAdditionalFee ??
                                    detailSchedule.totalAdditionalFee
                                )}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background p-2 col-span-2 sm:col-span-2">
                              <p className="text-xs text-muted-foreground">Total (current)</p>
                              <p className="font-bold text-primary">
                                {formatMoney(
                                  detailSchedule.livePreview?.netPayable ?? detailSchedule.netPayable
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Subject lines — current rates from fee history (today)
                            </p>
                            <div className="rounded-lg border overflow-x-auto max-h-48 overflow-y-auto bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-right">Cr</TableHead>
                                    <TableHead className="text-right">Rate/cr</TableHead>
                                    <TableHead className="text-right">Fee</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(detailSchedule.livePreview?.subjectLines ||
                                    detailSchedule.subjectLines
                                  ).map((line, idx) => (
                                    <TableRow key={`${line.subjectId}-${idx}`}>
                                      <TableCell>
                                        <span className="font-mono text-xs">{line.code}</span>
                                        <span className="text-muted-foreground text-xs ml-2">{line.name}</span>
                                      </TableCell>
                                      <TableCell className="text-right">{line.credits}</TableCell>
                                      <TableCell className="text-right text-xs">
                                        {line.missingRate ? "—" : formatMoney(line.feePerCredit)}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {line.missingRate ? (
                                          <span className="text-amber-700">No rate</span>
                                        ) : (
                                          formatMoney(line.lineTotal)
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-semibold">Additional fees (optional)</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setAdditionalFees((p) => [...p, emptyAdditionalFee()])}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add
                              </Button>
                            </div>
                            {additionalFees.length === 0 ? (
                              <p className="text-sm text-muted-foreground border border-dashed rounded-md p-3 bg-background">
                                No extras — tuition only. Add registration, exam, etc. if needed.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {additionalFees.map((fee, index) => (
                                  <div
                                    key={index}
                                    className="flex flex-wrap items-end gap-2 rounded-md border p-2 bg-background"
                                  >
                                    <Input
                                      className="flex-1 min-w-[120px]"
                                      placeholder="Name"
                                      value={fee.name}
                                      onChange={(e) => updateAdditionalFee(index, { name: e.target.value })}
                                    />
                                    <select
                                      className="h-9 rounded-md border px-2 text-sm"
                                      value={fee.type}
                                      onChange={(e) =>
                                        updateAdditionalFee(index, {
                                          type: e.target.value as "Fixed" | "Percentage",
                                        })
                                      }
                                    >
                                      <option value="Fixed">Fixed</option>
                                      <option value="Percentage">%</option>
                                    </select>
                                    <Input
                                      type="number"
                                      className="w-28"
                                      min={0}
                                      value={fee.type === "Percentage" ? fee.percentage || 0 : fee.amount || 0}
                                      onChange={(e) =>
                                        updateAdditionalFee(index, {
                                          ...(fee.type === "Percentage"
                                            ? { percentage: Number(e.target.value) }
                                            : { amount: Number(e.target.value) }),
                                        })
                                      }
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        setAdditionalFees((p) => p.filter((_, i) => i !== index))
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={savingSemester === row.semester}
                              onClick={() => handleSaveExtras(row.semester)}
                            >
                              {savingSemester === row.semester ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save extras"
                              )}
                            </Button>
                            {row.status === "Draft" && (
                              <Button
                                type="button"
                                size="sm"
                                className="gradient-brand text-white border-0"
                                disabled={busySemester !== null || row.hasMissingRates}
                                onClick={() =>
                                  publishSchedule(row.schedule!, row.semester, additionalFees)
                                }
                              >
                                {busySemester === row.semester ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Zap className="h-4 w-4 mr-1" /> Save & publish
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
