import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { Briefcase, Users, Calendar, Wallet } from "lucide-react";

export const Route = createFileRoute("/app/hr")({
  head: () => ({
    meta: [
      { title: "Human Resources — ScholarOS" },
      { name: "description", content: "Employees, leaves, payroll, recruitment, and performance." },
      { property: "og:title", content: "Human Resources — ScholarOS" },
      { property: "og:description", content: "HR management." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Human Resources" subtitle="1,412 employees across all campuses"
      kpis={[
        { label: "Employees", value: "1,412", icon: Users, tone: "brand" },
        { label: "On leave", value: 42, icon: Calendar, tone: "warning" },
        { label: "Payroll", value: "PKR 68M", icon: Wallet, tone: "success" },
        { label: "Open roles", value: 18, icon: Briefcase, tone: "info" },
      ]}
      itemsTitle="Recent HR activity"
      items={[
        "Payroll processed — October 2024","New hire · Dr. Nida Farooq — CS Faculty",
        "Leave request · Prof. Bilal Khan","Performance review · Q3 2024",
        "Recruitment · 3 lecturers for EE","Contract renewal · 12 faculty",
        "Training · Faculty Development Program","Increment cycle · January 2025 draft",
        "Employee handbook v3.2 published",
      ].map((t, i) => ({
        title: t,
        meta: `HR Ops · ${["Oct 28","Nov 02","Nov 05","Nov 12"][i % 4]} · Owner: ${["Ayesha","Kashif","Sana","Danish"][i % 4]}`,
        badge: i % 3 === 0 ? "Approved" : i % 3 === 1 ? "Pending" : "Draft",
        tone: i % 3 === 0 ? "success" : i % 3 === 1 ? "warning" : "info",
      }))}
    />
  ),
});
