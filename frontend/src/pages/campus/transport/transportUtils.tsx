import { Badge } from "@/components/ui/badge";

export const TRANSPORT_CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function getTransportStatusBadge(status: string) {
  const statusMap: Record<string, { className: string; label: string }> = {
    Active: { className: "bg-green-500/15 text-green-600 border-0", label: "Active" },
    Inactive: { className: "bg-gray-500/15 text-gray-600 border-0", label: "Inactive" },
    Maintenance: { className: "bg-yellow-500/15 text-yellow-600 border-0", label: "Maintenance" },
    Retired: { className: "bg-red-500/15 text-red-600 border-0", label: "Retired" },
    "On Route": { className: "bg-blue-500/15 text-blue-600 border-0", label: "On Route" },
    Available: { className: "bg-green-500/15 text-green-600 border-0", label: "Available" },
    "On Leave": { className: "bg-orange-500/15 text-orange-600 border-0", label: "On Leave" },
    "Off Duty": { className: "bg-gray-500/15 text-gray-600 border-0", label: "Off Duty" },
    Suspended: { className: "bg-red-500/15 text-red-600 border-0", label: "Suspended" },
    Terminated: { className: "bg-red-600/15 text-red-600 border-0", label: "Terminated" },
  };

  const info = statusMap[status] || statusMap.Active;
  return <Badge className={info.className}>{info.label}</Badge>;
}

export type TransportTab = "buses" | "drivers" | "routes";

export const transportListPath = (tab: TransportTab = "buses") =>
  tab === "buses" ? "/transport" : `/transport?tab=${tab}`;
