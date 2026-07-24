import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateTeachers, type Teacher } from "@/lib/mock-data";
import { Users, Award, BookOpen, Star } from "lucide-react";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — ScholarOS" },
      { name: "description", content: "Faculty profiles, schedules, performance, and payroll." },
      { property: "og:title", content: "Teachers — ScholarOS" },
      { property: "og:description", content: "Complete faculty management." },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const data = generateTeachers(80);
  const cols: Column<Teacher>[] = [
    { key: "name", header: "Faculty", cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarFallback className="text-xs gradient-brand text-white">{r.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
        <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.id} · {r.email}</div></div>
      </div>
    ) },
    { key: "designation", header: "Designation", cell: (r) => <Badge variant="secondary">{r.designation}</Badge> },
    { key: "department", header: "Department" },
    { key: "experience", header: "Experience", cell: (r) => <span className="tabular-nums">{r.experience} yrs</span> },
    { key: "courses", header: "Courses", cell: (r) => <span className="tabular-nums">{r.courses}</span> },
    { key: "rating", header: "Rating", cell: (r) => (
      <span className="flex items-center gap-1 font-medium"><Star className="h-3 w-3 fill-warning text-warning" /> {r.rating}</span>
    ) },
    { key: "salary", header: "Salary", cell: (r) => <span className="tabular-nums">PKR {(r.salary/1000).toFixed(0)}K</span> },
    { key: "status", header: "Status", cell: (r) => <Badge variant="outline">{r.status}</Badge> },
  ];

  return (
    <AppShell title="Teachers" subtitle="812 faculty across 52 departments">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Faculty" value="812" icon={Users} trend={2.1} tone="brand" />
        <KpiCard label="Professors" value="184" icon={Award} tone="info" />
        <KpiCard label="Active Courses" value="316" icon={BookOpen} tone="success" />
        <KpiCard label="Avg Rating" value="4.6" icon={Star} tone="warning" />
      </div>
      <DataTable title="Faculty directory" data={data} columns={cols} searchKeys={["name","id","department","designation"]} pageSize={10} addLabel="Add faculty" />
    </AppShell>
  );
}
