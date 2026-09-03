import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { feeChallanAPI, type FeeChallan, type ChallanPaymentStatus } from "@/features/feeChallan";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Loader2,
  Receipt,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  `PKR ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const statusVariant = (status: string) => {
  switch (status) {
    case "Paid":
      return "default";
    case "Partial":
      return "secondary";
    case "Overdue":
      return "destructive";
    default:
      return "outline";
  }
};

export default function ChallansPage() {
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<FeeChallan | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [paying, setPaying] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, statData] = await Promise.all([
        feeChallanAPI.list({
          paymentStatus: statusFilter !== "all" ? (statusFilter as ChallanPaymentStatus) : undefined,
        }),
        feeChallanAPI.getStats(),
      ]);
      setChallans(list);
      setStats({
        total: statData.total,
        totalAmount: statData.totalAmount,
        totalPaid: statData.totalPaid,
        totalRemaining: statData.totalRemaining,
        pending: statData.byStatus?.Pending ?? 0,
      });
    } catch {
      toast.error("Failed to load challans");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => challans, [challans]);

  const openPayDialog = (challan: FeeChallan) => {
    setSelectedChallan(challan);
    setPayAmount(String(challan.remainingAmount ?? challan.amount - (challan.paidAmount || 0)));
    setPayMethod("Cash");
    setPayDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedChallan) return;
    const id = selectedChallan.feeId || selectedChallan._id;
    if (!id) return;

    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    setPaying(true);
    try {
      await feeChallanAPI.recordPayment(id, {
        amount,
        paymentMethod: payMethod,
      });
      toast.success("Payment recorded");
      setPayDialogOpen(false);
      setSelectedChallan(null);
      loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to record payment";
      toast.error(message);
    } finally {
      setPaying(false);
    }
  };

  const columns: Column<FeeChallan>[] = [
    {
      key: "feeId",
      header: "Challan",
      cell: (row) => (
        <span className="font-mono text-xs">{row.feeId || row._id?.slice(-8)}</span>
      ),
    },
    {
      key: "studentName",
      header: "Student",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.studentName}</div>
          <div className="text-xs text-muted-foreground">{row.registrationId || row.studentRegistrationNo}</div>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program / Sem",
      cell: (row) => (
        <span>
          {row.program} · Sem {row.semester}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.amount),
    },
    {
      key: "paidAmount",
      header: "Paid",
      cell: (row) => formatCurrency(row.paidAmount || 0),
    },
    {
      key: "remainingAmount",
      header: "Due",
      cell: (row) => formatCurrency(row.remainingAmount ?? row.amount - (row.paidAmount || 0)),
    },
    {
      key: "dueDate",
      header: "Due date",
      cell: (row) => new Date(row.dueDate).toLocaleDateString(),
    },
    {
      key: "paymentStatus",
      header: "Status",
      cell: (row) => <Badge variant={statusVariant(row.paymentStatus)}>{row.paymentStatus}</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) =>
        row.paymentStatus !== "Paid" ? (
          <Button variant="ghost" size="sm" onClick={() => openPayDialog(row)}>
            Record payment
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fee Challans</h1>
          <p className="text-sm text-muted-foreground">
            Semester package bills generated from registrations
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/semester-registrations">Semester registrations</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total challans" value={stats.total} icon={Receipt} />
        <KpiCard label="Pending" value={stats.pending} icon={Wallet} />
        <KpiCard label="Collected" value={formatCurrency(stats.totalPaid)} icon={DollarSign} tone="success" />
        <KpiCard label="Outstanding" value={formatCurrency(stats.totalRemaining)} icon={DollarSign} tone="warning" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={["feeId", "studentName", "registrationId", "program"]}
          filterPanel={
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          {selectedChallan && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {selectedChallan.studentName} — {formatCurrency(selectedChallan.amount)} total,{" "}
                {formatCurrency(
                  selectedChallan.remainingAmount ??
                    selectedChallan.amount - (selectedChallan.paidAmount || 0)
                )}{" "}
                remaining
              </p>
              <div className="space-y-2">
                <Label>Amount (PKR)</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Cash", "Bank Transfer", "JazzCash", "EasyPaisa", "Cheque", "Other"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={paying}>
              {paying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
