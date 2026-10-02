import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function KpiCard({
  label, value, icon: Icon, trend, tone = "brand", onClick,
}: {
  label: string; value: string | number; icon: LucideIcon;
  trend?: number; tone?: "brand" | "success" | "warning" | "info" | "destructive";
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    brand: "from-primary/20 to-brand-2/20 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    info: "from-info/20 to-info/5 text-info",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
  };
  return (
    <Card
      className={cn("relative overflow-hidden card-hover glass", onClick && "cursor-pointer hover:shadow-md transition-shadow")}
      onClick={onClick}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none", tones[tone])} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}% vs last month
              </div>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
