import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { Library, BookOpen, Users, Clock } from "lucide-react";

const books = [
  "Introduction to Algorithms — Cormen","Clean Code — Robert C. Martin","Design Patterns — GoF",
  "Operating System Concepts — Silberschatz","Artificial Intelligence — Russell & Norvig",
  "Deep Learning — Ian Goodfellow","Database System Concepts — Korth","The Pragmatic Programmer",
  "Structure and Interpretation of Computer Programs","Compilers — Aho, Sethi, Ullman",
  "Computer Networks — Tanenbaum","Cracking the Coding Interview","Grokking Algorithms",
  "The C Programming Language — K&R","Effective Java — Joshua Bloch","You Don't Know JS",
  "Refactoring — Martin Fowler","Domain-Driven Design — Eric Evans",
];

export const Route = createFileRoute("/app/library")({
  head: () => ({
    meta: [
      { title: "Library — ScholarOS" },
      { name: "description", content: "Books, digital library, issue and return with fine tracking." },
      { property: "og:title", content: "Library — ScholarOS" },
      { property: "og:description", content: "Library management." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Library" subtitle="24,820 titles across 4 campus libraries"
      kpis={[
        { label: "Total Books", value: "24,820", icon: Library, tone: "brand" },
        { label: "Issued", value: "1,842", icon: BookOpen, tone: "info", trend: 5.4 },
        { label: "Members", value: "10,248", icon: Users, tone: "success" },
        { label: "Overdue", value: 68, icon: Clock, tone: "destructive" },
      ]}
      itemsTitle="Popular titles"
      itemsDescription="Most issued books this semester"
      items={books.map((b, i) => ({
        title: b,
        meta: `${["CS","AI","Engineering","Math","Business"][i % 5]} · ${5 + (i % 20)} copies · ${i % 3 === 0 ? "E-book available" : "Print only"}`,
        badge: i % 4 === 0 ? "Reserved" : "Available",
        tone: (i % 4 === 0 ? "warning" : "success"),
      }))}
    />
  ),
});
