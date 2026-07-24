import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { ClipboardCheck, Award, TrendingUp, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/exams")({
  head: () => ({
    meta: [
      { title: "Exams & Grades — ScholarOS" },
      { name: "description", content: "Exam scheduling, hall allocation, marks entry, GPA/CGPA, and transcripts." },
      { property: "og:title", content: "Exams & Grades — ScholarOS" },
      { property: "og:description", content: "Complete examination workflow." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Exams & Grades" subtitle="Fall 2024 midterms in progress"
      kpis={[
        { label: "Exams scheduled", value: 214, icon: Calendar, tone: "brand" },
        { label: "In progress", value: 48, icon: ClipboardCheck, tone: "warning" },
        { label: "Avg GPA", value: "3.24", icon: TrendingUp, tone: "success" },
        { label: "Result cards", value: "2,140", icon: Award, tone: "info" },
      ]}
      itemsTitle="Exam schedule"
      itemsDescription="Upcoming and ongoing examinations"
      items={[
        "CS-201 Midterm","CS-301 Midterm","EE-210 Final","MATH-104 Quiz 3","PHY-101 Lab Assessment",
        "BBA-101 Midterm","MBA-501 Case Study","LAW-201 Written Exam","ENG-101 Essay","AI-410 Project Defense",
        "DS-320 Kaggle Challenge","BIO-201 Practical",
      ].map((e, i) => ({
        title: e,
        meta: `Hall ${["A-101","B-204","C-301","D-102"][i % 4]} · Invigilator: Dr. ${["Ali","Sara","Bilal","Zainab"][i % 4]} · ${["09:00","11:00","14:00","16:00"][i % 4]}`,
        badge: i % 3 === 0 ? "In Progress" : i % 3 === 1 ? "Scheduled" : "Completed",
        tone: i % 3 === 0 ? "warning" : i % 3 === 1 ? "info" : "success",
      }))}
    />
  ),
});
