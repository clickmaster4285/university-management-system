import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { Building2, Users, GraduationCap, DollarSign } from "lucide-react";
import { departments } from "@/lib/mock-data";

export const Route = createFileRoute("/app/departments")({
  head: () => ({
    meta: [
      { title: "Departments — ScholarOS" },
      { name: "description", content: "Manage academic departments, HODs, budgets, and programs." },
      { property: "og:title", content: "Departments — ScholarOS" },
      { property: "og:description", content: "Departmental operations." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Departments" subtitle="52 departments across 4 campuses"
      kpis={[
        { label: "Departments", value: 52, icon: Building2, tone: "brand" },
        { label: "Faculty", value: 812, icon: Users, tone: "info" },
        { label: "Students", value: "10,248", icon: GraduationCap, tone: "success" },
        { label: "Annual Budget", value: "PKR 380M", icon: DollarSign, tone: "warning" },
      ]}
      itemsTitle="All departments"
      itemsDescription="Head of department, faculty count, and current cohort size."
      items={departments.map((d, i) => ({
        title: d,
        meta: `HOD: Dr. ${["Ali Raza","Sara Iqbal","Bilal Khan","Zainab Shah","Omar Malik"][i % 5]} · ${20 + (i * 3) % 60} faculty · ${300 + (i * 40) % 900} students`,
        badge: `PKR ${5 + (i % 12)}M`,
        tone: "brand",
      }))}
    />
  ),
});
