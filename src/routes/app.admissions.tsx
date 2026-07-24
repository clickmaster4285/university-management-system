import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle2, Clock, XCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { programs, departments } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admissions")({
  head: () => ({
    meta: [
      { title: "Online Admissions — ScholarOS" },
      { name: "description", content: "Apply online, upload documents, and track application status in real time." },
      { property: "og:title", content: "Online Admissions — ScholarOS" },
      { property: "og:description", content: "End-to-end admissions workflow." },
    ],
  }),
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const [step, setStep] = useState(1);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Application submitted · ID STU-2024589 generated");
    setStep(1);
  };
  return (
    <AppShell title="Online Admissions" subtitle="384 new applications this month">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Applications" value={1284} icon={UserPlus} tone="brand" trend={22.5} />
        <KpiCard label="Approved" value={862} icon={CheckCircle2} tone="success" />
        <KpiCard label="Pending" value={318} icon={Clock} tone="warning" />
        <KpiCard label="Rejected" value={104} icon={XCircle} tone="destructive" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>New application</CardTitle>
            <CardDescription>Step {step} of 3 — auto-generated Student ID on submission</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Full name</Label><Input placeholder="Aisha Khan" required /></div>
              <div className="space-y-1.5"><Label>Father's name</Label><Input placeholder="Muhammad Khan" required /></div>
              <div className="space-y-1.5"><Label>Mother's name</Label><Input placeholder="Fatima Khan" /></div>
              <div className="space-y-1.5"><Label>CNIC / Passport</Label><Input placeholder="61101-1234567-8" required /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="you@email.com" required /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input placeholder="+92 300 1234567" required /></div>
              <div className="space-y-1.5">
                <Label>Program</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{programs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Previous education</Label>
                <Textarea placeholder="Board, year, marks…" rows={3} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Upload documents</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/60 transition cursor-pointer" onClick={() => toast.success("Documents uploaded")}>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm">Drop PDF, JPG or PNG files here</p>
                  <p className="text-xs text-muted-foreground">Transcripts, CNIC, photo, character certificate</p>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-between items-center pt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Application fee:</span> <span className="font-semibold">PKR 2,500</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(Math.max(1, step - 1))}>Back</Button>
                  <Button type="submit" className="gradient-brand text-white border-0">Submit application</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent applications</CardTitle>
            <CardDescription>Live status updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Hamza Ali", program: "BSCS", status: "Approved", tone: "success" },
              { name: "Fatima Sheikh", program: "MBA", status: "Under Review", tone: "warning" },
              { name: "Usman Raza", program: "BEE", status: "Approved", tone: "success" },
              { name: "Iqra Baig", program: "BSSE", status: "Documents pending", tone: "warning" },
              { name: "Kashif Malik", program: "BBA", status: "Rejected", tone: "destructive" },
              { name: "Sana Ahmed", program: "BSAI", status: "Approved", tone: "success" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.program}</div>
                </div>
                <Badge className={
                  r.tone === "success" ? "bg-success/15 text-success border-0"
                  : r.tone === "warning" ? "bg-warning/15 text-warning border-0"
                  : "bg-destructive/15 text-destructive border-0"
                }>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
