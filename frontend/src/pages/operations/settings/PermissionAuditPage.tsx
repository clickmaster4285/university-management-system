import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, Loader2 } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { platformRoleAPI, type PermissionAuditLog } from "@/features/platformRoles";

const actionLabel = (action: string) => action.replace(/_/g, ' ');

export default function PermissionAuditPage() {
  const [logs, setLogs] = useState<PermissionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformRoleAPI.listAuditLogs({ limit: 100 });
      setLogs(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const columns: Column<PermissionAuditLog>[] = [
    {
      key: "when",
      header: "When",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => <Badge variant="outline">{actionLabel(row.action)}</Badge>,
    },
    {
      key: "target",
      header: "Target",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.targetLabel}</p>
          <p className="text-xs text-muted-foreground">{row.targetType}</p>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      cell: (row) => row.actorEmail || "—",
    },
    {
      key: "summary",
      header: "Summary",
      cell: (row) => <span className="text-sm">{row.summary || "—"}</span>,
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Permission audit log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track role changes and portal access updates.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/settings/roles">Back to roles</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="Recent permission changes"
          description="Role template edits, apply-to-users, and staff portal access changes"
          data={logs}
          columns={columns}
          searchKeys={["targetLabel", "actorEmail", "summary", "action"]}
          pageSize={15}
        />
      )}
    </>
  );
}
