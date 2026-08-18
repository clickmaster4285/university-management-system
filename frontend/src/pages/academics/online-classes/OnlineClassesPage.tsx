import { GenericModulePage } from "@/components/generic-module";
import { Video, Users, MessageSquare, PlayCircle } from "lucide-react";

export function OnlineClassesPage() {
  return (
    <GenericModulePage
      title="Online Classes"
      subtitle="26 live now · 148 scheduled this week"
      kpis={[
        { label: "Live now", value: 26, icon: Video, tone: "success" },
        { label: "Attendees", value: "1,842", icon: Users, tone: "brand" },
        { label: "Recordings", value: 412, icon: PlayCircle, tone: "info" },
        { label: "Chat messages", value: "12.4K", icon: MessageSquare, tone: "warning" },
      ]}
      itemsTitle="Upcoming sessions"
      items={[
        "CS-201 · Trees & Graphs — Google Meet",
        "CS-401 · Neural Networks — Zoom",
        "BBA-201 · Digital Marketing — Google Meet",
        "MBA-501 · M&A Case — Zoom",
        "EE-320 · Fourier Transforms — Google Meet",
        "MATH-201 · Multivariable — Zoom",
        "AI-410 · Transformers — Google Meet",
        "LAW-201 · Case Discussion — Zoom",
        "ENG-101 · Rhetoric — Google Meet",
      ].map((t, i) => ({
        title: t,
        meta: `Dr. ${["Ahmed", "Sara", "Bilal", "Zainab", "Omar"][i % 5]} · ${20 + (i * 5) % 60} students · Starts ${["14:00", "15:30", "16:00", "17:00"][i % 4]}`,
        badge: i % 3 === 0 ? "LIVE" : "Scheduled",
        tone: i % 3 === 0 ? "success" : "brand",
      }))}
    />
  );
}

export default OnlineClassesPage;
