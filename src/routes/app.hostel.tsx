import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { Home, Bed, Utensils, Wrench } from "lucide-react";

export const Route = createFileRoute("/app/hostel")({
  head: () => ({
    meta: [
      { title: "Hostel — ScholarOS" },
      { name: "description", content: "Rooms, mess, complaints, and hostel fees across every building." },
      { property: "og:title", content: "Hostel — ScholarOS" },
      { property: "og:description", content: "Hostel operations." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Hostel" subtitle="8 buildings · 2,140 residents · 62 room requests"
      kpis={[
        { label: "Occupied Rooms", value: "1,072", icon: Home, tone: "brand" },
        { label: "Available Beds", value: 148, icon: Bed, tone: "success" },
        { label: "Mess Registered", value: "1,982", icon: Utensils, tone: "info" },
        { label: "Open Complaints", value: 14, icon: Wrench, tone: "warning" },
      ]}
      itemsTitle="Buildings"
      items={Array.from({ length: 12 }, (_, i) => ({
        title: `${["Iqbal","Jinnah","Fatima","Ayesha","Khan","Ghazali","Rumi","Sina"][i % 8]} Hall · Block ${String.fromCharCode(65 + (i % 4))}`,
        meta: `${140 + (i * 11) % 60} beds · ${120 + (i * 9) % 40} occupied · Warden: Dr. ${["Ali","Sara","Bilal","Zainab"][i % 4]}`,
        badge: i % 3 === 0 ? "Waitlist" : "Available",
        tone: (i % 3 === 0 ? "warning" : "success"),
      }))}
    />
  ),
});
