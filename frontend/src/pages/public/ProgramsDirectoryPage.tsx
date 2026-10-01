import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  LayoutGrid,
  Loader2,
  Table2,
  Grid3X3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePublicCatalog, universityDisplayName } from "@/hooks/usePublicCatalog";
import type {
  PublicCatalogCampus,
  PublicCatalogProgram,
} from "@/features/studentApplications";

type ViewMode = "table" | "cards" | "matrix";

type FlatProgramRow = {
  key: string;
  campus: PublicCatalogCampus;
  categoryLabel: string;
  program: PublicCatalogProgram;
};

function formatPkr(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return `PKR ${Number(amount).toLocaleString()}`;
}

function applyHref(campusId: string, programId: string) {
  return `/apply?${new URLSearchParams({ campusId, programId }).toString()}`;
}

function flattenCatalog(campuses: PublicCatalogCampus[]): FlatProgramRow[] {
  const rows: FlatProgramRow[] = [];
  for (const campus of campuses) {
    for (const category of campus.categories || []) {
      for (const program of category.programs || []) {
        rows.push({
          key: `${campus._id}-${program._id}`,
          campus,
          categoryLabel: category.label,
          program,
        });
      }
    }
  }
  return rows.sort((a, b) => {
    const byCampus = a.campus.name.localeCompare(b.campus.name);
    if (byCampus) return byCampus;
    const byCat = a.categoryLabel.localeCompare(b.categoryLabel);
    if (byCat) return byCat;
    return a.program.name.localeCompare(b.program.name);
  });
}

function semesterColumns(rows: FlatProgramRow[]) {
  const set = new Set<number>();
  for (const row of rows) {
    for (const s of row.program.feeSummary?.schedules || []) {
      set.add(s.semester);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

function downloadCsv(rows: FlatProgramRow[], semesters: number[]) {
  const headers = [
    "Campus",
    "Category",
    "Program",
    "Code",
    "Degree",
    "Department",
    "Duration",
    "Credits",
    "Admission",
    "Admission fee",
    ...semesters.map((s) => `Sem ${s}`),
    "Tuition total",
    "Program total",
  ];

  const escape = (value: unknown) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    const fee = row.program.feeSummary;
    const bySem = new Map(
      (fee?.schedules || []).map((s) => [s.semester, s.netPayable])
    );
    lines.push(
      [
        row.campus.name,
        row.categoryLabel,
        row.program.name,
        row.program.code,
        row.program.degreeLevel || "",
        row.program.department?.name || "",
        row.program.duration ?? "",
        row.program.totalCredits ?? "",
        row.program.admissionLabel || (row.program.admissionOpen ? "Open" : "Closed"),
        fee?.admissionFee ?? row.program.admissionFee ?? 0,
        ...semesters.map((s) => bySem.get(s) ?? ""),
        fee?.tuitionTotal ?? "",
        fee?.programTotal ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "program-directory.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProgramsDirectoryPage() {
  const { catalog, loading, error } = usePublicCatalog();
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);

  const allRows = useMemo(
    () => flattenCatalog(catalog?.campuses || []),
    [catalog]
  );

  const campuses = catalog?.campuses || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (campusFilter !== "all" && row.campus._id !== campusFilter) return false;
      if (openOnly && !row.program.admissionOpen) return false;
      if (!q) return true;
      const hay = [
        row.campus.name,
        row.categoryLabel,
        row.program.name,
        row.program.code,
        row.program.department?.name,
        row.program.degreeLevel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, search, campusFilter, openOnly]);

  const semesters = useMemo(() => semesterColumns(filtered), [filtered]);
  const uniName = universityDisplayName(catalog);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 text-center">
        <p className="text-muted-foreground">{error || "Directory unavailable"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/catalog">Back to programs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[90vw] xl:max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary mb-2">Program directory</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{uniName}</h1>
          <p className="mt-3 text-muted-foreground">
            All published programs in one place — campus, department, admission window, semester
            fees, and totals. Switch between table, cards, and fee matrix.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/catalog">Browse by campus</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(filtered, semesters)}
            disabled={!filtered.length}
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search program, code, campus, department…"
          className="max-w-sm"
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={campusFilter}
          onChange={(e) => setCampusFilter(e.target.value)}
        >
          <option value="all">All campuses</option>
          {campuses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            className="rounded border"
          />
          Open for admission only
        </label>
        <div className="ml-auto flex rounded-lg border p-1 gap-1">
          {(
            [
              { id: "table" as const, label: "Table", icon: Table2 },
              { id: "cards" as const, label: "Cards", icon: LayoutGrid },
              { id: "matrix" as const, label: "Fee matrix", icon: Grid3X3 },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.id}
              type="button"
              size="sm"
              variant={view === opt.id ? "default" : "ghost"}
              onClick={() => setView(opt.id)}
            >
              <opt.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Showing {filtered.length} of {allRows.length} program listings
        {filtered.some((r) => r.program.feeSummary?.studentCategory)
          ? " · fees shown for Regular category where published"
          : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No programs match these filters.
        </div>
      ) : view === "cards" ? (
        <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((row) => {
            const fee = row.program.feeSummary;
            return (
              <article key={row.key} className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold tracking-tight">{row.program.name}</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {row.program.code}
                    </p>
                  </div>
                  <Badge variant={row.program.admissionOpen ? "default" : "outline"}>
                    {row.program.admissionOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <dl className="text-sm space-y-1 text-muted-foreground">
                  <div>
                    <span className="text-foreground/80">{row.campus.name}</span>
                    {" · "}
                    {row.categoryLabel}
                  </div>
                  <div>{row.program.department?.name || "—"}</div>
                  <div>
                    {row.program.duration ? `${row.program.duration} semesters` : "—"}
                    {row.program.totalCredits ? ` · ${row.program.totalCredits} credits` : ""}
                  </div>
                  <div>{row.program.admissionLabel || "—"}</div>
                  <div className="pt-1 text-foreground">
                    Tuition {formatPkr(fee?.tuitionTotal)} · Total{" "}
                    {formatPkr(fee?.programTotal)}
                  </div>
                </dl>
                {row.program.admissionOpen ? (
                  <Button asChild size="sm" className="w-full">
                    <Link to={applyHref(row.campus._id, row.program._id)}>
                      Apply <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : view === "matrix" ? (
        <div className="mt-6 rounded-2xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card min-w-[12rem]">Program</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Admission fee</TableHead>
                {semesters.map((s) => (
                  <TableHead key={s} className="text-right whitespace-nowrap">
                    Sem {s}
                  </TableHead>
                ))}
                <TableHead className="text-right">Tuition</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const fee = row.program.feeSummary;
                const bySem = new Map(
                  (fee?.schedules || []).map((s) => [s.semester, s.netPayable])
                );
                return (
                  <TableRow key={row.key}>
                    <TableCell className="sticky left-0 bg-card font-medium">
                      <div>{row.program.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {row.program.code}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.campus.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPkr(fee?.admissionFee ?? row.program.admissionFee)}
                    </TableCell>
                    {semesters.map((s) => (
                      <TableCell key={s} className="text-right tabular-nums text-sm">
                        {bySem.has(s) ? formatPkr(bySem.get(s)) : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatPkr(fee?.tuitionTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-semibold">
                      {formatPkr(fee?.programTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campus</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Admission</TableHead>
                <TableHead className="text-right">Admission fee</TableHead>
                <TableHead className="text-right">Tuition total</TableHead>
                <TableHead className="text-right">Program total</TableHead>
                <TableHead className="text-right">Semesters priced</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const fee = row.program.feeSummary;
                return (
                  <TableRow key={row.key}>
                    <TableCell className="text-sm">{row.campus.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.categoryLabel}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.program.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {row.program.code}
                        {row.program.degreeLevel ? ` · ${row.program.degreeLevel}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.program.department?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {row.program.duration ? `${row.program.duration} sem` : "—"}
                      {row.program.totalCredits ? ` · ${row.program.totalCredits} cr` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.program.admissionOpen ? "default" : "outline"}>
                        {row.program.admissionOpen ? "Open" : "Closed"}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1 max-w-[10rem]">
                        {row.program.admissionLabel}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPkr(fee?.admissionFee ?? row.program.admissionFee)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPkr(fee?.tuitionTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatPkr(fee?.programTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {fee?.semesterCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.program.admissionOpen ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={applyHref(row.campus._id, row.program._id)}>Apply</Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
