import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { studentPortalAPI } from "@/features/studentPortal";
import type { FeeChallan } from "@/features/feeChallan";
import { toast } from "sonner";

const formatMoney = (amount?: number) => {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `PKR ${Number(amount).toLocaleString()}`;
};

export default function StudentPortalFeesPage() {
  const [rows, setRows] = useState<FeeChallan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setRows(await studentPortalAPI.getChallans());
      } catch {
        toast.error("Could not load fee challans");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees &amp; challans</h1>
        <p className="text-sm text-muted-foreground mt-1">Payment status for your semester packages.</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No challans yet.</p>
      ) : (
        <ul className="divide-y border rounded-lg">
          {rows.map((row) => (
            <li key={row._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{row.feeId || "Challan"}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {row.program || "—"}
                  {row.semester != null ? ` · Sem ${row.semester}` : ""}
                  {" · "}
                  {formatMoney(row.amount)}
                </p>
              </div>
              <Badge variant={row.paymentStatus === "Paid" ? "default" : "secondary"}>
                {row.paymentStatus || "—"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
