import { useEffect, useMemo, useState } from "react";
import { Calendar, DollarSign, GraduationCap, History, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  subjectAPI,
  SUBJECT_FEE_TYPES,
  type Subject,
  type SubjectFeeHistory,
  type SubjectFeeType,
} from "@/features/subjects";
import { programAPI, type Program } from "@/features/programs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";

const DEFAULT_SCOPE_KEY = "default";

const getSubjectRecordId = (subject: Subject) => subject._id || subject.subjectId || "";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);

const getScopeKey = (programId: SubjectFeeHistory["programId"]) => {
  if (!programId) return DEFAULT_SCOPE_KEY;
  if (typeof programId === "object") return programId._id;
  return String(programId);
};

type FeeScopeGroup = {
  key: string;
  code: string;
  title: string;
  subtitle: string;
  entries: SubjectFeeHistory[];
  current: SubjectFeeHistory | null;
};

interface SubjectFeePanelProps {
  subject: Subject;
}

export function SubjectFeePanel({ subject }: SubjectFeePanelProps) {
  const subjectId = getSubjectRecordId(subject);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SubjectFeeHistory[]>([]);
  const [currentDefault, setCurrentDefault] = useState<SubjectFeeHistory | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState({
    feePerCredit: "",
    feeType: "Tuition" as SubjectFeeType,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    programId: "",
    reason: "",
  });

  const fetchFees = async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const res = await subjectAPI.getFees(subjectId);
      setHistory(res?.data?.history || []);
      setCurrentDefault(res?.data?.currentDefault || null);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to load fee history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await programAPI.getAll({ limit: 200 });
        setPrograms(res?.data || []);
      } catch {
        toast.error("Failed to load programs");
      }
    };
    loadPrograms();
  }, []);

  useEffect(() => {
    fetchFees();
  }, [subjectId]);

  const programMap = useMemo(() => {
    const map = new Map<string, Program>();
    programs.forEach((p) => {
      if (p._id) map.set(p._id, p);
    });
    return map;
  }, [programs]);

  const groupedFees = useMemo(() => {
    const groups = new Map<string, FeeScopeGroup>();

    const ensureGroup = (key: string, row?: SubjectFeeHistory) => {
      if (groups.has(key)) return groups.get(key)!;

      if (key === DEFAULT_SCOPE_KEY) {
        const group: FeeScopeGroup = {
          key,
          code: "DEFAULT",
          title: "All programs",
          subtitle: "Fallback rate when no program-specific fee exists",
          entries: [],
          current: null,
        };
        groups.set(key, group);
        return group;
      }

      const populated =
        row && typeof row.programId === "object" && row.programId ? row.programId : null;
      const program = programMap.get(key);
      const group: FeeScopeGroup = {
        key,
        code: populated?.code || program?.code || "PROGRAM",
        title: populated?.name || program?.name || "Program override",
        subtitle: `${populated?.code || program?.code || key} — program-specific rate`,
        entries: [],
        current: null,
      };
      groups.set(key, group);
      return group;
    };

    ensureGroup(DEFAULT_SCOPE_KEY);

    for (const row of history) {
      const key = getScopeKey(row.programId);
      const group = ensureGroup(key, row);
      group.entries.push(row);
    }

    for (const group of groups.values()) {
      group.entries.sort(
        (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
      );
      group.current = group.entries.find((row) => !row.effectiveTo) || null;
    }

    return [...groups.values()].sort((a, b) => {
      if (a.key === DEFAULT_SCOPE_KEY) return -1;
      if (b.key === DEFAULT_SCOPE_KEY) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [history, programMap]);

  const visibleGroups = useMemo(
    () => groupedFees.filter((group) => group.entries.length > 0),
    [groupedFees]
  );

  const scopeCount = visibleGroups.length;
  const currentTotalFee = currentDefault
    ? currentDefault.feePerCredit * (subject.credits || 0)
    : 0;

  const prefillProgram = (programId: string) => {
    setForm((prev) => ({ ...prev, programId }));
    document.getElementById("fee-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    const feePerCredit = Number(form.feePerCredit);
    if (!Number.isFinite(feePerCredit) || feePerCredit < 0) {
      toast.error("Enter a valid fee per credit");
      return;
    }

    setSaving(true);
    try {
      await subjectAPI.addFee(subjectId, {
        feePerCredit,
        feeType: form.feeType,
        effectiveFrom: form.effectiveFrom,
        programId: form.programId || null,
        reason: form.reason.trim(),
      });
      toast.success("Fee rate added");
      setForm((prev) => ({
        ...prev,
        feePerCredit: "",
        reason: "",
      }));
      await fetchFees();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to add fee rate");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Default rate / credit"
          value={currentDefault ? formatCurrency(currentDefault.feePerCredit) : "Not set"}
          icon={DollarSign}
        />
        <KpiCard
          label={`Default total (${subject.credits} cr)`}
          value={currentDefault ? formatCurrency(currentTotalFee) : "—"}
          icon={Calendar}
        />
        <KpiCard
          label="Program fee tracks"
          value={scopeCount}
          icon={History}
        />
      </div>

      <Card id="fee-form">
        <CardHeader>
          <CardTitle>Add fee rate</CardTitle>
          <CardDescription>
            Pick a program scope below or leave default for all programs without their own rate.
            A new rate closes the previous active row for that same program only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="feePerCredit">Fee per credit *</Label>
              <Input
                id="feePerCredit"
                type="number"
                min={0}
                step={100}
                value={form.feePerCredit}
                onChange={(e) => setForm((prev) => ({ ...prev, feePerCredit: e.target.value }))}
                placeholder="e.g. 5000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeType">Fee type</Label>
              <select
                id="feeType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.feeType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, feeType: e.target.value as SubjectFeeType }))
                }
              >
                {SUBJECT_FEE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective from *</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="programId">Program scope</Label>
              <select
                id="programId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.programId}
                onChange={(e) => setForm((prev) => ({ ...prev, programId: e.target.value }))}
              >
                <option value="">All programs (default)</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>{p.code} — {p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Board approval Spring 2026"
              />
            </div>
            <Button type="submit" disabled={saving} className="gradient-brand text-white border-0">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Add rate</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Fees by program</h2>
          <p className="text-sm text-muted-foreground">
            Each program has its own rate history for {subject.code}. Changes appear as new rows under that program.
          </p>
        </div>

        {visibleGroups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No fee rates yet. Add the first rate above.
            </CardContent>
          </Card>
        ) : (
          visibleGroups.map((group) => {
            const currentTotal = group.current
              ? group.current.feePerCredit * (subject.credits || 0)
              : null;

            return (
              <Card key={group.key} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{group.code}</CardTitle>
                        {group.key !== DEFAULT_SCOPE_KEY && (
                          <Badge variant="secondary">Program override</Badge>
                        )}
                        {group.key === DEFAULT_SCOPE_KEY && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{group.title}</p>
                      <CardDescription>{group.subtitle}</CardDescription>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      {group.current ? (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Current rate</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(group.current.feePerCredit)} / credit
                          </p>
                          {currentTotal !== null && (
                            <p className="text-xs text-muted-foreground">
                              Total {formatCurrency(currentTotal)} ({subject.credits} cr)
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No active rate</Badge>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => prefillProgram(group.key === DEFAULT_SCOPE_KEY ? "" : group.key)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add rate for {group.code}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {group.entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No rates for this scope yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/20 text-left text-muted-foreground">
                            <th className="px-4 py-3 font-medium">Effective from</th>
                            <th className="px-4 py-3 font-medium">Effective to</th>
                            <th className="px-4 py-3 font-medium">Rate / credit</th>
                            <th className="px-4 py-3 font-medium">Total fee</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((row) => {
                            const isActive = !row.effectiveTo;
                            return (
                              <tr key={row._id} className="border-b last:border-0 hover:bg-muted/10">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {formatDate(row.effectiveFrom)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {isActive ? (
                                    <span className="text-emerald-600 font-medium">Ongoing</span>
                                  ) : (
                                    formatDate(row.effectiveTo)
                                  )}
                                </td>
                                <td className="px-4 py-3 font-medium whitespace-nowrap">
                                  {formatCurrency(row.feePerCredit)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {formatCurrency(row.feePerCredit * (subject.credits || 0))}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary">{row.feeType}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                  {isActive ? (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
                                  ) : (
                                    <Badge variant="outline">Closed</Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                                  {row.reason || "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SubjectFeePanel;
