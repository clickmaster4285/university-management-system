import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/app/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — ScholarOS" },
      { name: "description", content: "Assign, submit, grade, and give feedback across every course." },
      { property: "og:title", content: "Assignments — ScholarOS" },
      { property: "og:description", content: "Assignment workflow." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Assignments" subtitle="1,842 active · 214 pending grading"
      kpis={[
        { label: "Active", value: "1,842", icon: ClipboardList, tone: "brand" },
        { label: "Submitted", value: "8,412", icon: CheckCircle2, tone: "success" },
        { label: "Due today", value: 68, icon: Clock, tone: "warning" },
        { label: "Overdue", value: 42, icon: AlertCircle, tone: "destructive" },
      ]}
      itemsTitle="Recent assignments"
      items={[
        "Data Structures — Binary Trees","Algorithms — Dynamic Programming","OS — Process Scheduling",
        "Databases — Normalization","ML — Regression Project","AI — Search Agents","Networks — TCP Analysis",
        "Compilers — Parser Implementation","Marketing — Case Study","Finance — Valuation Model",
        "Law — Contract Analysis","Physics — Lab Report",
      ].map((t, i) => ({
        title: t,
        meta: `Dr. ${["Ahmed","Sara","Bilal","Zainab"][i % 4]} · Due ${["Nov 12","Nov 15","Nov 18","Nov 20"][i % 4]} · ${20 + (i * 7) % 40}/50 submitted`,
        badge: i % 3 === 0 ? "Grading" : "Open",
        tone: i % 3 === 0 ? "warning" : "brand",
      }))}
    />
  ),
});
