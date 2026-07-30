import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { Calendar, Users, Award, Trophy } from "lucide-react";

export const Route = createFileRoute("/app/events")({
  head: () => ({
    meta: [
      { title: "Events — ScholarOS" },
      { name: "description", content: "Seminars, workshops, sports, and convocation calendar." },
      { property: "og:title", content: "Events — ScholarOS" },
      { property: "og:description", content: "Campus events." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Events" subtitle="24 upcoming events across all campuses"
      kpis={[
        { label: "Upcoming", value: 24, icon: Calendar, tone: "brand" },
        { label: "Registered", value: "2,412", icon: Users, tone: "info" },
        { label: "Certificates", value: 842, icon: Award, tone: "success" },
        { label: "Sports events", value: 12, icon: Trophy, tone: "warning" },
      ]}
      itemsTitle="Event calendar"
      items={[
        "AI Summit 2024 — Keynote by Dr. Fei-Fei Li","Convocation Ceremony — Class of 2024",
        "Robotics Workshop — Hands-on with Boston Dynamics","Cricket Tournament — Inter-Campus",
        "Entrepreneurship Bootcamp — YC Alumni","TEDx Islamabad — Student Speakers",
        "Hackathon 48 — Prize Pool PKR 2M","Cultural Night — Basant Festival",
        "Career Fair — 120+ recruiters",
      ].map((t, i) => ({
        title: t,
        meta: `${["Auditorium","Main Grounds","AI Lab","Cricket Stadium","Convention Hall"][i % 5]} · ${["Nov 20","Nov 25","Dec 02","Dec 10","Dec 15"][i % 5]} · ${100 + (i * 40) % 800} registered`,
        badge: i % 3 === 0 ? "Featured" : "Open",
        tone: i % 3 === 0 ? "warning" : "brand",
      }))}
    />
  ),
});
