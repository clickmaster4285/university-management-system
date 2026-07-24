import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { BookOpen, Users, Clock, GraduationCap } from "lucide-react";

const catalog = [
  "CS-201 · Data Structures & Algorithms","CS-301 · Operating Systems","CS-401 · Machine Learning","CS-305 · Databases",
  "EE-210 · Circuits","EE-320 · Signals & Systems","ME-110 · Thermodynamics","CE-220 · Structural Analysis",
  "MATH-104 · Linear Algebra","MATH-201 · Calculus III","PHY-101 · Mechanics","CHEM-102 · Organic Chemistry",
  "BBA-101 · Principles of Management","BBA-201 · Marketing Strategy","MBA-501 · Corporate Finance","LAW-201 · Contract Law",
  "ENG-101 · English Composition","PSY-201 · Cognitive Psychology","ARCH-301 · Studio III","AI-410 · Deep Learning",
  "DS-320 · Statistical Learning","BIO-201 · Molecular Biology","ECO-301 · Macroeconomics","MED-101 · Anatomy",
];
const instructors = ["Dr. Ahmed Malik","Prof. Sara Iqbal","Dr. Bilal Khan","Dr. Zainab Shah","Dr. Omar Raza","Prof. Aisha Butt"];

export const Route = createFileRoute("/app/courses")({
  head: () => ({
    meta: [
      { title: "Courses — ScholarOS" },
      { name: "description", content: "Course catalog with instructors, credit hours, prerequisites, and materials." },
      { property: "og:title", content: "Courses — ScholarOS" },
      { property: "og:description", content: "Course catalog management." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Courses" subtitle="316 active courses across 8 schools"
      kpis={[
        { label: "Active Courses", value: 316, icon: BookOpen, tone: "brand" },
        { label: "Enrollments", value: "24,910", icon: Users, tone: "info" },
        { label: "Avg Credit Hrs", value: "3.2", icon: Clock, tone: "success" },
        { label: "Programs", value: 42, icon: GraduationCap, tone: "warning" },
      ]}
      itemsTitle="Course catalog"
      itemsDescription="Instructors, semester, and enrollment."
      items={catalog.map((c, i) => ({
        title: c,
        meta: `${instructors[i % instructors.length]} · ${3 + (i % 3)} credit hrs · Semester ${1 + (i % 8)}`,
        badge: `${40 + (i * 7) % 90} enrolled`,
        tone: (["brand","info","success","warning"] as const)[i % 4],
      }))}
    />
  ),
});
