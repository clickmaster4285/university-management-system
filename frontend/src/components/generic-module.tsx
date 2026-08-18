import { AppShell } from "@/layouts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";

export interface ModuleItem { title: string; meta: string; badge?: string; tone?: "brand"|"success"|"warning"|"info"|"destructive"; }

export function GenericModulePage({
  title, subtitle, kpis, items, itemsTitle, itemsDescription, extras,
}: {
  title: string; subtitle: string;
  kpis: { label: string; value: string | number; icon: LucideIcon; tone?: "brand"|"success"|"warning"|"info"|"destructive"; trend?: number }[];
  items: ModuleItem[]; itemsTitle: string; itemsDescription?: string;
  extras?: ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-primary/15 text-primary border-0",
    success: "bg-success/15 text-success border-0",
    warning: "bg-warning/15 text-warning border-0",
    info: "bg-info/15 text-info border-0",
    destructive: "bg-destructive/15 text-destructive border-0",
  };
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <Button variant="outline" onClick={() => toast.success("Exported")}><Download className="h-4 w-4" /> Export</Button>
          <Button className="gradient-brand text-white border-0" onClick={() => toast.success("Item created")}><Plus className="h-4 w-4" /> Add new</Button>
        </>
      }
    >
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(kpis.length, 4)} gap-4`}>
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {extras}

      <Card className="glass">
        <CardHeader>
          <CardTitle>{itemsTitle}</CardTitle>
          {itemsDescription && <CardDescription>{itemsDescription}</CardDescription>}
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl border p-4 bg-card/50 card-hover">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{it.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{it.meta}</div>
                </div>
                {it.badge && <Badge className={toneClasses[it.tone ?? "brand"]}>{it.badge}</Badge>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info("Details opened")}>View</Button>
                <Button size="sm" className="flex-1 gradient-brand text-white border-0" onClick={() => toast.success("Action completed")}>Manage</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
