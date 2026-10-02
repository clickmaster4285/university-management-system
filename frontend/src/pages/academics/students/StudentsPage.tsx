import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studentAPI, type Student } from "@/features/students";
import { programAPI, type Program } from "@/features/programs";
import { campusAPI, type Campus } from "@/features/campus";
import { batchAPI, type Batch } from "@/features/batches";
import { GraduationCap, Eye, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const resolveRefLabel = (value: Student["programId"], fallback?: string) => {
  if (typeof value === "object" && value) return value.name || value.code || fallback || "—";
  return fallback || "—";
};

const getStudentRecordId = (student: Student) => student.studentId || student._id || "";

const getBatchYear = (student: Student) => {
  const batch = student.batchId;
  if (batch && typeof batch === "object" && "year" in batch) {
    return (batch as { year?: number }).year ?? null;
  }
  return null;
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, graduatedStudents: 0 });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [programRes, campusRes, batchRes] = await Promise.all([
          programAPI.getAll({ limit: 500 }),
          campusAPI.getAll(),
          batchAPI.getAll(),
        ]);
        setPrograms(programRes?.data || []);
        const campusList = Array.isArray(campusRes)
          ? campusRes
          : Array.isArray((campusRes as { data?: Campus[] })?.data)
            ? (campusRes as { data: Campus[] }).data
            : [];
        setCampuses(campusList);
        setBatches(batchRes?.data || []);
      } catch {
        /* options optional for empty DB */
      }
    };
    loadOptions();
  }, []);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const b of batches) {
      if (b.year) years.add(b.year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [batches]);

  const batchOptions = useMemo(() => {
    return batches.filter((b) => {
      if (programFilter !== "all") {
        const pid = typeof b.programId === "object" ? (b.programId as { _id?: string })?._id : b.programId;
        if (String(pid) !== programFilter && b.programId !== programFilter) return false;
      }
      if (yearFilter !== "all" && String(b.year) !== yearFilter) return false;
      return true;
    });
  }, [batches, programFilter, yearFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 500 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (campusFilter !== "all") params.campusId = campusFilter;
      if (programFilter !== "all") params.programId = programFilter;
      if (batchFilter !== "all") params.batchId = batchFilter;
      else if (yearFilter !== "all") params.year = yearFilter;

      const [list, statsRes] = await Promise.all([
        studentAPI.getAll(params),
        studentAPI.getStats(),
      ]);
      setStudents(list);
      setStats(statsRes || { totalStudents: 0, activeStudents: 0, graduatedStudents: 0 });
    } catch {
      toast.error("Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filters change
  }, [search, statusFilter, campusFilter, programFilter, yearFilter, batchFilter]);

  const handleDelete = async (student: Student) => {
    const id = getStudentRecordId(student);
    const name = student.fullName || student.name;
    if (!id || !confirm(`Delete student record for ${name}?`)) return;
    try {
      await studentAPI.delete(id);
      toast.success(`${name} deleted`);
      fetchData();
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.fullName || row.name}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.studentId}</div>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program",
      cell: (row) => resolveRefLabel(row.programId, row.program),
    },
    {
      key: "campus",
      header: "Campus",
      cell: (row) => resolveRefLabel(row.campusId, row.campus),
    },
    {
      key: "year",
      header: "Intake year",
      cell: (row) => getBatchYear(row) ?? "—",
    },
    {
      key: "batch",
      header: "Batch",
      cell: (row) => resolveRefLabel(row.batchId as Student["programId"]),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge>{row.status || "Active"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/students/${getStudentRecordId(row)}`)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/students/${getStudentRecordId(row)}`)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row)} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const selectClass = "h-10 rounded-md border px-3 text-sm bg-background";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Student directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Filter enrolled students by campus, program, and intake year (e.g. Main · BSCS · 2025).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Total students" value={stats.totalStudents} icon={Users} />
        <KpiCard label="Active" value={stats.activeStudents} icon={GraduationCap} />
        <KpiCard label="Graduated" value={stats.graduatedStudents} icon={GraduationCap} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name, email, student ID, CNIC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          className={selectClass}
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
        <select
          className={selectClass}
          value={programFilter}
          onChange={(e) => {
            setProgramFilter(e.target.value);
            setBatchFilter("all");
          }}
        >
          <option value="all">All programs</option>
          {programs.map((p) => (
            <option key={p._id || p.programId} value={p._id || p.programId}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setBatchFilter("all");
          }}
        >
          <option value="all">All intake years</option>
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="all">All batches</option>
          {batchOptions.map((b) => (
            <option key={b._id || b.batchId} value={b._id || b.batchId}>
              {b.code} ({b.year})
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {["Active", "Inactive", "On Leave", "Graduated", "Suspended", "Dropped"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={students} />
      )}
    </div>
  );
}
