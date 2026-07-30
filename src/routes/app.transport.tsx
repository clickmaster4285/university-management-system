import { createFileRoute } from "@tanstack/react-router";
import { GenericModulePage } from "@/components/generic-module";
import { Bus, Users, MapPin, Fuel } from "lucide-react";

export const Route = createFileRoute("/app/transport")({
  head: () => ({
    meta: [
      { title: "Transport — ScholarOS" },
      { name: "description", content: "Buses, routes, drivers, and live GPS tracking." },
      { property: "og:title", content: "Transport — ScholarOS" },
      { property: "og:description", content: "Campus transport operations." },
    ],
  }),
  component: () => (
    <GenericModulePage
      title="Transport" subtitle="48 buses · 24 routes · 1,580 riders daily"
      kpis={[
        { label: "Buses", value: 48, icon: Bus, tone: "brand" },
        { label: "Routes", value: 24, icon: MapPin, tone: "info" },
        { label: "Riders", value: "1,580", icon: Users, tone: "success" },
        { label: "Fuel budget", value: "PKR 3.8M", icon: Fuel, tone: "warning" },
      ]}
      itemsTitle="Active routes"
      items={Array.from({ length: 12 }, (_, i) => ({
        title: `Route R-${100 + i} · ${["G-9 → Main","Bahria → Main","F-11 → Main","DHA → North","Model Town → South","Gulshan → South","Clifton → South","Hayatabad → East"][i % 8]}`,
        meta: `Driver: ${["Rashid","Kamran","Naveed","Tariq","Faisal"][i % 5]} · ${28 + (i * 3) % 15} riders · ETA 08:${(10 + i * 3) % 60}`,
        badge: `Bus ${i + 12}`,
        tone: "brand",
      }))}
    />
  ),
});
