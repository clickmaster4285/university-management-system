import { useState } from "react";
import { Printer, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdmissionChallanPrint } from "@/features/studentAdmissions";

export type { AdmissionChallanPrint };

type PreviewSize = "fit" | "a4";

function formatPkr(amount?: number) {
  return `PKR ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ChallanCopy({
  challan,
  copyLabel,
}: {
  challan: AdmissionChallanPrint;
  copyLabel: string;
}) {
  const uni = challan.university || {};
  const applicant = challan.applicant || {};
  const program = challan.program || {};
  const campus = challan.campus || {};
  const bank = challan.bank || {};
  const lines = challan.lineItems?.length
    ? challan.lineItems
    : [{ label: challan.feeType || "Admission Fee", amount: challan.amount || 0 }];

  return (
    <section className="admission-challan-copy h-full border border-black bg-white text-black p-2 flex flex-col min-w-0">
      <div className="flex items-start justify-between gap-1 border-b border-black/50 pb-1.5">
        <div className="min-w-0">
          <p className="text-[8px] uppercase tracking-wider text-black/55">Fee challan · A4 landscape</p>
          <h2 className="text-[11px] font-bold leading-tight">{uni.name || "University"}</h2>
          <p className="text-[8px] text-black/65 mt-0.5 leading-snug">
            {[uni.code, uni.city || uni.address].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[8px] font-bold uppercase border border-black px-1.5 py-0.5 leading-none">
            {copyLabel}
          </p>
          <p className="text-[8px] font-mono mt-1">{challan.feeId || "—"}</p>
          <p className="text-[8px]">Due {formatDate(challan.dueDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] mt-1.5 leading-snug">
        <div>
          <span className="text-black/55">Applicant</span>
          <p className="font-semibold truncate">{applicant.fullName || "—"}</p>
        </div>
        <div>
          <span className="text-black/55">Application ID</span>
          <p className="font-mono font-semibold truncate">{applicant.applicationId || "—"}</p>
        </div>
        <div>
          <span className="text-black/55">Father</span>
          <p className="font-medium truncate">{applicant.fatherName || "—"}</p>
        </div>
        <div>
          <span className="text-black/55">CNIC</span>
          <p className="font-mono truncate">{applicant.cnic || "—"}</p>
        </div>
        <div className="col-span-2">
          <span className="text-black/55">Program</span>
          <p className="font-semibold truncate">
            {program.name || "—"}
            {program.code ? ` (${program.code})` : ""}
          </p>
        </div>
        <div>
          <span className="text-black/55">Campus</span>
          <p className="font-medium truncate">{campus.name || "—"}</p>
        </div>
        <div>
          <span className="text-black/55">Fee type</span>
          <p className="font-medium truncate">{challan.feeType || "Admission Fee"}</p>
        </div>
      </div>

      <table className="w-full mt-1.5 text-[8px] border border-black/60">
        <thead>
          <tr className="bg-black/[0.04]">
            <th className="text-left p-1 border-b border-black/40 font-semibold">Particulars</th>
            <th className="text-right p-1 border-b border-black/40 font-semibold w-16">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.label}>
              <td className="p-1 border-b border-black/20">{line.label}</td>
              <td className="p-1 border-b border-black/20 text-right tabular-nums font-medium">
                {formatPkr(line.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="p-1 font-bold">Total payable</td>
            <td className="p-1 text-right tabular-nums font-bold">{formatPkr(challan.amount)}</td>
          </tr>
        </tbody>
      </table>

      <p className="text-[7.5px] mt-1 leading-snug">
        <span className="text-black/55">In words: </span>
        <span className="font-medium">{challan.amountInWords || "—"}</span>
      </p>

      <div className="mt-auto pt-1.5 grid grid-cols-2 gap-1.5 text-[7.5px] border border-dashed border-black/50 p-1.5">
        <div className="min-w-0">
          <p className="font-semibold uppercase text-[7px] tracking-wide">Bank</p>
          <p className="truncate">{bank.bankName || "—"}</p>
          <p className="truncate">{bank.accountTitle || "—"}</p>
          <p className="font-mono truncate">{bank.accountNumber || "—"}</p>
          <p className="truncate">{bank.branch || "—"}</p>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-black/55">Depositor sign</p>
            <div className="h-5 border-b border-black/40" />
          </div>
          <div>
            <p className="text-black/55">Bank stamp</p>
            <div className="h-5 border-b border-black/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPrintHtml(challan: AdmissionChallanPrint, copies: string[]) {
  const uni = challan.university || {};
  const applicant = challan.applicant || {};
  const program = challan.program || {};
  const campus = challan.campus || {};
  const bank = challan.bank || {};
  const lines = challan.lineItems?.length
    ? challan.lineItems
    : [{ label: challan.feeType || "Admission Fee", amount: challan.amount || 0 }];

  const copyHtml = copies
    .map((copyLabel) => {
      const lineRows = lines
        .map(
          (line) => `
            <tr>
              <td>${escapeHtml(line.label)}</td>
              <td class="right">${escapeHtml(formatPkr(line.amount))}</td>
            </tr>`
        )
        .join("");

      return `
      <section class="copy">
        <header>
          <div>
            <div class="eyebrow">Fee challan · A4 landscape</div>
            <div class="uni">${escapeHtml(uni.name || "University")}</div>
            <div class="meta">${escapeHtml(
              [uni.code, uni.city || uni.address].filter(Boolean).join(" · ")
            )}</div>
          </div>
          <div class="badge-wrap">
            <div class="badge">${escapeHtml(copyLabel)}</div>
            <div class="mono">${escapeHtml(challan.feeId || "—")}</div>
            <div>Due ${escapeHtml(formatDate(challan.dueDate))}</div>
          </div>
        </header>
        <div class="grid">
          <div><span>Applicant</span><b>${escapeHtml(applicant.fullName || "—")}</b></div>
          <div><span>Application ID</span><b class="mono">${escapeHtml(
            applicant.applicationId || "—"
          )}</b></div>
          <div><span>Father</span><b>${escapeHtml(applicant.fatherName || "—")}</b></div>
          <div><span>CNIC</span><b class="mono">${escapeHtml(applicant.cnic || "—")}</b></div>
          <div class="span2"><span>Program</span><b>${escapeHtml(
            `${program.name || "—"}${program.code ? ` (${program.code})` : ""}`
          )}</b></div>
          <div><span>Campus</span><b>${escapeHtml(campus.name || "—")}</b></div>
          <div><span>Fee type</span><b>${escapeHtml(challan.feeType || "Admission Fee")}</b></div>
        </div>
        <table>
          <thead><tr><th>Particulars</th><th class="right">Amount</th></tr></thead>
          <tbody>
            ${lineRows}
            <tr>
              <td><b>Total payable</b></td>
              <td class="right"><b>${escapeHtml(formatPkr(challan.amount))}</b></td>
            </tr>
          </tbody>
        </table>
        <p class="words"><span>In words:</span> ${escapeHtml(challan.amountInWords || "—")}</p>
        <div class="bank">
          <div>
            <div class="bank-title">Bank</div>
            <div>${escapeHtml(bank.bankName || "—")}</div>
            <div>${escapeHtml(bank.accountTitle || "—")}</div>
            <div class="mono">${escapeHtml(bank.accountNumber || "—")}</div>
            <div>${escapeHtml(bank.branch || "—")}</div>
          </div>
          <div>
            <div class="sign"><span>Depositor sign</span><i></i></div>
            <div class="sign"><span>Bank stamp</span><i></i></div>
          </div>
        </div>
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(challan.feeId || "Admission challan")}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      /* Do NOT force 210mm height — that overflows past @page margins and creates a blank 2nd page */
      height: auto;
      overflow: hidden;
    }
    .sheet {
      width: 100%;
      max-width: 281mm; /* 297 - 8 - 8 */
      max-height: 194mm; /* 210 - 8 - 8 */
      padding: 0;
      margin: 0;
      overflow: hidden;
      page-break-after: avoid;
      page-break-inside: avoid;
      break-after: avoid;
      break-inside: avoid;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 2.5mm;
      height: 194mm;
      max-height: 194mm;
    }
    .copy {
      border: 1px solid #000;
      padding: 2mm;
      height: 194mm;
      max-height: 194mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    header { display: flex; justify-content: space-between; gap: 2mm; border-bottom: 1px solid #666; padding-bottom: 1.5mm; }
    .eyebrow { font-size: 7.5pt; text-transform: uppercase; color: #555; }
    .uni { font-size: 10.5pt; font-weight: 700; line-height: 1.15; }
    .meta { font-size: 7.5pt; color: #444; margin-top: 0.5mm; }
    .badge { border: 1px solid #000; padding: 0.8mm 1.5mm; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; display: inline-block; }
    .badge-wrap { text-align: right; font-size: 7.5pt; }
    .mono { font-family: Consolas, monospace; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8mm 2mm; margin-top: 1.5mm; font-size: 7.5pt; }
    .grid span { display: block; color: #666; }
    .grid b { display: block; font-weight: 700; }
    .span2 { grid-column: 1 / -1; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5mm; font-size: 7.5pt; }
    th, td { border: 1px solid #777; padding: 1mm; }
    th { text-align: left; background: #f3f3f3; }
    .right { text-align: right; }
    .words { font-size: 7pt; margin: 1mm 0 0; }
    .words span { color: #666; }
    .bank { margin-top: auto; border: 1px dashed #777; padding: 1.2mm; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm; font-size: 7pt; }
    .bank-title { font-weight: 700; text-transform: uppercase; font-size: 6.5pt; }
    .sign { margin-bottom: 2mm; }
    .sign span { color: #666; }
    .sign i { display: block; border-bottom: 1px solid #666; height: 5mm; margin-top: 1mm; }
  </style>
</head>
<body>
  <div class="sheet"><div class="row">${copyHtml}</div></div>
  <script>
    window.onload = function () {
      window.focus();
      setTimeout(function () { window.print(); }, 50);
    };
  </script>
</body>
</html>`;
}

export default function AdmissionFeeChallanForm({
  challan,
}: {
  challan: AdmissionChallanPrint;
}) {
  const [previewSize, setPreviewSize] = useState<PreviewSize>("a4");
  const copies = challan.copies?.length
    ? challan.copies
    : ["Student Copy", "Bank Copy", "University Copy"];

  const handlePrint = () => {
    const html = buildPrintHtml(challan, copies);
    const win = window.open("", );
    if (!win) {
      // Popup blocked — fallback to same-tab blob print
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        window.setTimeout(() => {
          iframe.remove();
          URL.revokeObjectURL(url);
        }, 1500);
      };
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Admission fee challan</h3>
          <p className="text-sm text-muted-foreground">
            Opens a dedicated A4 landscape print window (one page, three copies).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border p-0.5 gap-0.5">
            <Button
              type="button"
              size="sm"
              variant={previewSize === "fit" ? "default" : "ghost"}
              onClick={() => setPreviewSize("fit")}
            >
              Fit width
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewSize === "a4" ? "default" : "ghost"}
              onClick={() => setPreviewSize("a4")}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              A4 size
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print A4 landscape
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-muted/30 p-3">
        <div
          className={cn(
            "mx-auto bg-white text-black shadow-sm border overflow-hidden",
            previewSize === "a4" ? "w-[297mm] max-w-none" : "w-full min-w-[720px]"
          )}
        >
          <div className="px-2 pt-2 pb-1 text-[10px] text-black/50 flex justify-between">
            <span>Preview · A4 landscape (297 × 210 mm)</span>
            <span>1 page · 3 copies</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-2">
            {copies.map((label) => (
              <ChallanCopy key={label} challan={challan} copyLabel={label} />
            ))}
          </div>
          {challan.instructions?.length ? (
            <ol className="list-decimal pl-5 pr-2 pb-2 text-[9px] text-black/65 space-y-0.5">
              {challan.instructions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </div>
  );
}
