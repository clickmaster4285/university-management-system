import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  studentAdmissionsAPI,
  type DossierStatus,
  type StudentAdmissionDossier,
} from "@/features/studentAdmissions";

const STATUS_OPTIONS: DossierStatus[] = [
  "In Progress",
  "Documents Pending",
  "Complete",
  "Enrolled",
];

const resolveRefLabel = (
  value: string | { name?: string; code?: string } | null | undefined
) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || value.code || "—";
  return value;
};

/**
 * Holding place after promote / before official Student Directory enrollment.
 */
export default function AdmissionDossiersPage() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<StudentAdmissionDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 500 };
      if (search) params.search = search;
      const res = await studentAdmissionsAPI.listDossiers(params);
      setDossiers(res.data || []);
    } catch {
      toast.error("Failed to load admission dossiers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return dossiers.filter((d) => statusFilter === "all" || d.status === statusFilter);
  }, [dossiers, statusFilter]);

  const stats = useMemo(() => {
    const open = dossiers.filter((d) => d.status !== "Enrolled");
    return {
      total: dossiers.length,
      holding: open.length,
      enrolled: dossiers.filter((d) => d.status === "Enrolled").length,
      inProgress: dossiers.filter((d) => d.status === "In Progress").length,
    };
  }, [dossiers]);

  const columns: Column<StudentAdmissionDossier>[] = [
    {
      key: "admissionId",
      header: "Candidate",
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{row.admissionId}</div>
        </div>
      ),
    },
    {
      key: "programId",
      header: "Program",
      cell: (row) => resolveRefLabel(row.programId as { name?: string; code?: string }),
    },
    {
      key: "campusId",
      header: "Campus",
      cell: (row) => resolveRefLabel(row.campusId as { name?: string; code?: string }),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "Enrolled" ? "secondary" : "default"}>{row.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => {
        const id = row._id || row.admissionId;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admissions/dossier/${id}`)}
          >
            <Eye className="h-4 w-4" /> Open dossier
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Fee &amp; enrollment
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          After an online or offline application is accepted and promoted: check{" "}
          <strong>admission fee submission</strong>, finish remaining dossier details, then enroll
          into Student Directory. This is not a campus visit and not the final student list.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total dossiers" value={stats.total} icon={ClipboardList} />
        <KpiCard label="Still holding" value={stats.holding} icon={ClipboardList} />
        <KpiCard label="In progress" value={stats.inProgress} icon={ClipboardList} />
        <KpiCard label="Enrolled" value={stats.enrolled} icon={ClipboardList} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name, email, CNIC, admission ID..."
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No fee / enrollment dossiers yet. Accept and promote an online or offline applicant first.
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  );
}
