import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — ScholarOS" },
      { name: "description", content: "Student, teacher, finance, library, and admission reports in CSV & PDF." },
      { property: "og:title", content: "Reports — ScholarOS" },
      { property: "og:description", content: "Enterprise reporting." },
    ],
  }),
  component: ReportsPage,
});

const reports = [
  "Student enrollment", "Teacher performance", "Departmental summary", "Admissions funnel",
  "Attendance analytics", "Finance summary", "Fee collection", "Library usage",
  "Hostel occupancy", "Transport utilization", "Exam results", "Scholarship distribution",
];

function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Generate, print, and export any operational report">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <Card key={r} className="glass card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="mt-3 text-base">{r}</CardTitle>
              <CardDescription>Auto-refreshed hourly · {(i + 1) * 12 + 42} data sources</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success("PDF ready")}><Download className="h-3.5 w-3.5" /> PDF</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success("CSV downloaded")}>CSV</Button>
              <Button variant="outline" size="sm" onClick={() => toast.success("Sent to printer")}><Printer className="h-3.5 w-3.5" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
