import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QrCode as QrIcon, ScanLine, Printer, Download, CheckCircle2, DollarSign, Library, Home, Bus, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";


function QrPattern({ seed }: { seed: number }) {
  const size = 21;
  const cells: boolean[] = [];
  let s = seed;
  for (let i = 0; i < size * size; i++) {
    s = (s * 9301 + 49297) % 233280;
    cells.push(s / 233280 > 0.55);
  }
  // Add finder patterns
  const finder = (r: number, c: number) =>
    (r === 0 || r === 6 || c === 0 || c === 6) ||
    (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <rect width={size} height={size} fill="white" />
      {Array.from({ length: size }).map((_, r) =>
        Array.from({ length: size }).map((__, c) => {
          let filled = false;
          if (inFinder(r, c)) {
            const [fr, fc] = [r < 7 ? r : r - (size - 7), c < 7 ? c : c - (size - 7)];
            filled = finder(fr, fc);
          } else {
            filled = cells[r * size + c];
          }
          return filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="currentColor" /> : null;
        })
      )}
    </svg>
  );
}

export function SmartQrPage() {
  const [scanned, setScanned] = useState(false);
  const student = {
    id: "STU-2024001", name: "Aisha Khan", program: "BSCS · Sem 5",
    attendance: 92, fee: "Paid", library: "2 books", hostel: "Jinnah Hall B-204", transport: "Route R-108",
  };

  return (
    <AppShell title="Smart QR System" subtitle="Every student, one QR — instant access to everything">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Student QR card</CardTitle>
            <CardDescription>Auto-generated for every enrolled student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl gradient-brand p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-80">ScholarOS University</div>
                  <div className="text-xl font-bold mt-1">{student.name}</div>
                  <div className="text-xs opacity-90 mt-0.5">{student.program}</div>
                  <div className="text-[11px] opacity-75 mt-1 font-mono">{student.id}</div>
                </div>
                <GraduationCap className="h-6 w-6 opacity-80" />
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-75">Valid until</div>
                  <div className="text-sm font-semibold">June 2028</div>
                </div>
                <div className="bg-white p-2 rounded-lg text-black w-32 h-32">
                  <QrPattern seed={12345} />
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => toast.success("Card printed")}><Printer className="h-4 w-4" /> Print</Button>
              <Button variant="outline" onClick={() => toast.success("Downloaded PDF")}><Download className="h-4 w-4" /> Download PDF</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Scan a QR</CardTitle>
            <CardDescription>Open full student record instantly</CardDescription>
          </CardHeader>
          <CardContent>
            {!scanned ? (
              <div className="rounded-xl border-2 border-dashed border-primary/40 p-10 text-center bg-primary/5">
                <ScanLine className="h-20 w-20 mx-auto text-primary animate-pulse" />
                <p className="mt-4 text-sm font-medium">Point the scanner at any student QR</p>
                <Button className="mt-4 gradient-brand text-white border-0" onClick={() => { setScanned(true); toast.success("Scanned STU-2024001"); }}>
                  Simulate scan
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-sm font-medium">Verified · {student.name}</div>
                    <div className="text-xs text-muted-foreground">{student.id}</div>
                  </div>
                </div>
                {[
                  { icon: CheckCircle2, label: "Attendance", value: `${student.attendance}%`, tone: "success" },
                  { icon: DollarSign, label: "Fee status", value: student.fee, tone: "success" },
                  { icon: Library, label: "Library", value: student.library, tone: "info" },
                  { icon: Home, label: "Hostel", value: student.hostel, tone: "brand" },
                  { icon: Bus, label: "Transport", value: student.transport, tone: "brand" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg bg-${r.tone}/15 text-${r.tone} flex items-center justify-center`}>
                        <r.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{r.label}</span>
                    </div>
                    <Badge variant="secondary">{r.value}</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setScanned(false)}>Scan another</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default SmartQrPage;
