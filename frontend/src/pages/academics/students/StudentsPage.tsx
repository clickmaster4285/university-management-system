import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studentAPI, type Student } from "@/features/students";
import { GraduationCap, Eye, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const resolveRefLabel = (value: Student["programId"], fallback?: string) => {
  if (typeof value === "object" && value) return value.name || value.code || fallback || "—";
  return fallback || "—";
};

const getStudentRecordId = (student: Student) => student.studentId || student._id || "";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, graduatedStudents: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 500 };
      if (search) params.search = search;
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
  }, [search]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => statusFilter === "all" || student.status === statusFilter);
  }, [students, statusFilter]);

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
      key: "semester",
      header: "Semester",
      cell: (row) => row.currentSemester || row.semester || 1,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Student directory
        </h1>
        <p className="text-sm text-muted-foreground">
          Official enrolled students created from completed admissions
        </p>
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
          className="h-10 rounded-md border px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {["Active", "Inactive", "On Leave", "Graduated", "Suspended", "Dropped"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={filteredStudents} />
      )}
    </div>
  );
}
