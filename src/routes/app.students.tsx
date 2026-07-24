import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { generateStudents, type Student } from "@/lib/mock-data";
import { GraduationCap, UserCheck, UserX, Award, QrCode, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/students")({
  head: () => ({
    meta: [
      { title: "Students — ScholarOS" },
      { name: "description", content: "Manage the complete student lifecycle: profiles, academics, fees, and more." },
      { property: "og:title", content: "Students — ScholarOS" },
      { property: "og:description", content: "Enterprise student information system." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const data = generateStudents(120);
  const cols: Column<Student>[] = [
    {
      key: "name", header: "Student",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9"><AvatarFallback className="text-xs gradient-brand text-white">{r.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.id} · {r.email}</div>
          </div>
        </div>
      ),
    },
    { key: "program", header: "Program", cell: (r) => <Badge variant="secondary">{r.program}</Badge> },
    { key: "department", header: "Department", cell: (r) => <span className="text-sm">{r.department}</span> },
    { key: "semester", header: "Sem", cell: (r) => <span className="tabular-nums">{r.semester}</span> },
    { key: "cgpa", header: "CGPA", cell: (r) => <span className="tabular-nums font-medium">{r.cgpa.toFixed(2)}</span> },
    { key: "attendance", header: "Attendance", cell: (r) => (
      <span className={`tabular-nums font-medium ${r.attendance < 70 ? "text-destructive" : r.attendance < 85 ? "text-warning" : "text-success"}`}>{r.attendance}%</span>
    ) },
    { key: "fee", header: "Fee",
      cell: (r) => (
        <Badge className={
          r.fee === "Paid" ? "bg-success/15 text-success border-0"
          : r.fee === "Partial" ? "bg-warning/15 text-warning border-0"
          : "bg-destructive/15 text-destructive border-0"
        }>{r.fee}</Badge>
      ) },
    { key: "status", header: "Status", cell: (r) => <Badge variant="outline">{r.status}</Badge> },
    { key: "campus", header: "Campus", cell: (r) => <span className="text-xs text-muted-foreground">{r.campus.split(" - ")[1]}</span> },
  ];

  return (
    <AppShell
      title="Students"
      subtitle="10,248 total · 384 admitted this month"
      actions={
        <>
          <Button variant="outline" onClick={() => toast.success("Student cards printed")}><QrCode className="h-4 w-4" /> Print ID cards</Button>
          <Button variant="outline" onClick={() => toast.success("Transcripts downloaded")}><Download className="h-4 w-4" /> Transcripts</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Students" value="10,248" icon={GraduationCap} trend={4.2} tone="brand" />
        <KpiCard label="Active" value="9,842" icon={UserCheck} tone="success" />
        <KpiCard label="On Leave" value="286" icon={UserX} tone="warning" />
        <KpiCard label="Graduated" value="1,620" icon={Award} tone="info" />
      </div>
      <DataTable
        title="All students"
        description="Search, filter, and manage every enrolled student."
        data={data}
        columns={cols}
        searchKeys={["name", "id", "program", "department", "city"]}
        pageSize={10}
        addLabel="Add student"
      />
    </AppShell>
  );
}
