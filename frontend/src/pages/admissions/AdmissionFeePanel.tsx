import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdmissionFeeChallanForm from "@/components/student/AdmissionFeeChallanForm";
import {
  studentAdmissionsAPI,
  type AdmissionChallanPrint,
  type AdmissionFeeRecord,
} from "@/features/studentAdmissions";
import { studentApplicationsAPI } from "@/features/studentApplications";

type Mode = "application" | "dossier";

interface AdmissionFeePanelProps {
  mode: Mode;
  recordId: string;
  disabled?: boolean;
  onSatisfiedChange?: (satisfied: boolean) => void;
}

export default function AdmissionFeePanel({
  mode,
  recordId,
  disabled,
  onSatisfiedChange,
}: AdmissionFeePanelProps) {
  const [fee, setFee] = useState<AdmissionFeeRecord | null>(null);
  const [printChallan, setPrintChallan] = useState<AdmissionChallanPrint | null>(null);
  const [programFee, setProgramFee] = useState(0);
  const [satisfied, setSatisfied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      if (mode === "dossier") {
        const res = await studentAdmissionsAPI.getAdmissionFee(recordId);
        setFee(res.data);
        setPrintChallan(res.printChallan || null);
        setProgramFee(res.programAdmissionFee ?? 0);
        setSatisfied(Boolean(res.satisfied));
        onSatisfiedChange?.(Boolean(res.satisfied));
        if (res.data?.proofNotes) setNotes(res.data.proofNotes);
        if (res.data?.transactionId) setTransactionId(res.data.transactionId);
      } else {
        const res = await studentApplicationsAPI.getAdmissionFee(recordId);
        const data = res.data;
        setFee(data);
        setPrintChallan(res.printChallan || null);
        const amount = data?.amount ?? 0;
        const ok =
          amount <= 0 ||
          !data ||
          ["Paid", "Waived", "Scholarship"].includes(data.paymentStatus || "") ||
          data.proofStatus === "Verified";
        setProgramFee(amount);
        setSatisfied(ok);
        onSatisfiedChange?.(ok);
        if (data?.proofNotes) setNotes(data.proofNotes);
        if (data?.transactionId) setTransactionId(data.transactionId);
      }
    } catch {
      setFee(null);
      setPrintChallan(null);
      setSatisfied(false);
      onSatisfiedChange?.(false);
    } finally {
      setLoading(false);
    }
  }, [mode, recordId, onSatisfiedChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const payload = {
        markPaid: true,
        notes: notes.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
        proofStatus: "Verified" as const,
      };
      const res =
        mode === "dossier"
          ? await studentAdmissionsAPI.verifyAdmissionFee(recordId, payload)
          : await studentApplicationsAPI.verifyAdmissionFee(recordId, payload);
      setFee(res.data);
      setSatisfied(true);
      onSatisfiedChange?.(true);
      toast.success(res.message || "Admission fee verified");
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to verify admission fee";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-4 md:p-5 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading admission fee…
      </section>
    );
  }

  if (!fee && programFee <= 0) {
    return (
      <section className="rounded-xl border bg-card p-4 md:p-5 shadow-sm space-y-1">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Admission fee
        </h3>
        <p className="text-sm text-muted-foreground">
          No admission fee configured on this program — enroll can proceed without payment.
        </p>
      </section>
    );
  }

  if (!fee) {
    return (
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 md:p-5 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Admission fee
        </h3>
        <p className="text-sm text-muted-foreground">
          No challan yet. Accept the application (or promote) to generate one from the program
          admission fee.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-4 md:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Admission fee
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{fee.feeId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{fee.paymentStatus || "Pending"}</Badge>
          <Badge
            variant={
              fee.proofStatus === "Verified"
                ? "default"
                : fee.proofStatus === "Submitted"
                  ? "secondary"
                  : "outline"
            }
          >
            Proof: {fee.proofStatus || "None"}
          </Badge>
          {satisfied ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Ready to enroll
            </Badge>
          ) : null}
        </div>
      </div>

      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-semibold">PKR {Number(fee.amount || 0).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Due</dt>
          <dd className="font-medium">
            {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="font-medium">PKR {Number(fee.paidAmount || 0).toLocaleString()}</dd>
        </div>
      </dl>

      {fee.description ? (
        <p className="text-sm text-muted-foreground">{fee.description}</p>
      ) : null}

      {printChallan ? <AdmissionFeeChallanForm challan={printChallan} /> : null}

      {!satisfied && !disabled ? (
        <div className="space-y-3 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            After the applicant uploads bank receipt / transfer proof, verify here to unlock
            Complete → Student.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fee-txn">Transaction / slip ref</Label>
              <Input
                id="fee-txn"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-notes">Notes</Label>
              <Input
                id="fee-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional staff notes"
              />
            </div>
          </div>
          <Button type="button" disabled={verifying} onClick={handleVerify}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Verify fee & mark paid
          </Button>
        </div>
      ) : null}
    </section>
  );
}
