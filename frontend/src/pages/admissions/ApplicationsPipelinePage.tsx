import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Globe, Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  studentApplicationsAPI,
  type ApplicationStatus,
  type StudentApplication,
} from "@/features/studentApplications";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Submitted",
  "Under Review",
  "Action Required",
  "Shortlisted",
  "Accepted",
  "Rejected",
  "Promoted",
];

const resolveRefLabel = (value: StudentApplication["programId"]) => {
  if (!value) return "—";
  if (typeof value === "object") return value.name || value.code || "—";
  return value;
};

export type IntakeListVariant = "offline" | "online";

interface ApplicationsPipelinePageProps {
  /** offline = walk-in / staff-entered admission app (internal); online = /apply (public) */
  variant?: IntakeListVariant;
}

export default function ApplicationsPipelinePage({
  variant = "offline",
}: ApplicationsPipelinePageProps) {
  const navigate = useNavigate();
  const source = variant === "online" ? "public" : "internal";
  const isOnline = variant === "online";

  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
    promoted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 500, source };
      if (search) params.search = search;
      const [listRes, statsRes] = await Promise.all([
        studentApplicationsAPI.list(params),
        studentApplicationsAPI.getStats({ source }),
      ]);
      setApplications(listRes.data || []);
      setStats(statsRes);
    } catch {
      toast.error(isOnline ? "Failed to load online applicants" : "Failed to load offline applicants");
    } finally {
      setLoading(false);
    }
  }, [search, source, isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return applications.filter((app) => statusFilter === "all" || app.status === statusFilter);
  }, [applications, statusFilter]);

  const columns: Column<StudentApplication>[] = [
    {
      key: "applicationId",
      header: "Applicant",
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{row.applicationId}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="text-sm">
          <div className="truncate max-w-[180px]">{row.email}</div>
          <div className="text-xs text-muted-foreground">{row.phone}</div>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program",
      cell: (row) => resolveRefLabel(row.programId),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigate(`/admissions/${row.applicationId}`, {
              state: { from: isOnline ? "online" : "offline" },
            })
          }
        >
          <Eye className="h-4 w-4" /> Review
        </Button>
      ),
    },
  ];

  const TitleIcon = isOnline ? Globe : UserPlus;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TitleIcon className="h-6 w-6 text-primary" />
            {isOnline ? "Online applicants" : "Offline applicants"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isOnline
              ? "People who applied from the public /apply site. Review, accept, promote to an admission dossier — not yet students."
              : "Walk-in / staff-entered admission applications (same pipeline as online). Not campus visitors — those are inquiry visits only."}
          </p>
        </div>
        {!isOnline ? (
          <Button onClick={() => navigate("/admissions/internal/create")}>
            <Plus className="h-4 w-4" /> New offline application
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total" value={stats.total} icon={TitleIcon} onClick={() => setStatusFilter("all")} />
        <KpiCard
          label="Submitted"
          value={stats.submitted}
          icon={TitleIcon}
          onClick={() => setStatusFilter("Submitted")}
        />
        <KpiCard
          label="Under review"
          value={stats.underReview}
          icon={TitleIcon}
          onClick={() => setStatusFilter("Under Review")}
        />
        <KpiCard
          label="Promoted"
          value={stats.promoted}
          icon={TitleIcon}
          onClick={() => setStatusFilter("Promoted")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, CNIC, application ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {statusFilter !== "all" ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
            Clear filter
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {isOnline
            ? "No online applications yet. Applicants appear here after submitting /apply."
            : "No offline applications yet. Use New offline application for walk-in admissions."}
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  );
}
