import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertCircle, TrendingUp, Percent, Receipt, CreditCard, Building2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { revenueSeries } from "@/lib/mock-data";

export const Route = createFileRoute("/app/fees")({
  head: () => ({
    meta: [
      { title: "Fees — ScholarOS" },
      { name: "description", content: "Fee structure, scholarships, installments, online payments, and invoicing." },
      { property: "og:title", content: "Fees — ScholarOS" },
      { property: "og:description", content: "Fee management." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  const rev = revenueSeries();
  return (
    <AppShell title="Fees" subtitle="PKR 48.2M collected this month">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Collected" value="PKR 48.2M" icon={DollarSign} tone="success" trend={12.4} />
        <KpiCard label="Pending" value="PKR 6.8M" icon={AlertCircle} tone="warning" trend={-3.1} />
        <KpiCard label="Scholarships" value="PKR 2.4M" icon={Percent} tone="info" />
        <KpiCard label="Revenue YTD" value="PKR 62.5M" icon={TrendingUp} tone="brand" trend={15.2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader><CardTitle>Fee collection trend</CardTitle><CardDescription>Monthly, in PKR millions</CardDescription></CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rev}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Payment methods</CardTitle><CardDescription>Accept every channel</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { icon: CreditCard, name: "Stripe", tone: "brand" },
              { icon: Building2, name: "Bank Transfer", tone: "info" },
              { icon: Smartphone, name: "JazzCash", tone: "warning" },
              { icon: Smartphone, name: "EasyPaisa", tone: "success" },
              { icon: DollarSign, name: "Cash", tone: "brand" },
              { icon: Receipt, name: "Cheque", tone: "info" },
            ].map((m) => (
              <button key={m.name} onClick={() => toast.success(`${m.name} selected`)}
                className="rounded-lg border p-3 text-center card-hover bg-card/50">
                <m.icon className="h-6 w-6 mx-auto text-primary" />
                <div className="mt-1.5 text-xs font-medium">{m.name}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </div>
          <Button className="gradient-brand text-white border-0" onClick={() => toast.success("Invoice generated · Receipt-2024-8842")}><Receipt className="h-4 w-4" /> Generate invoice</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { id: "STU-2024001", name: "Aisha Khan", amount: 285000, method: "Stripe", status: "Paid" },
            { id: "STU-2024045", name: "Hamza Ali", amount: 195000, method: "JazzCash", status: "Paid" },
            { id: "STU-2024078", name: "Fatima Sheikh", amount: 320000, method: "Bank", status: "Pending" },
            { id: "STU-2024122", name: "Usman Raza", amount: 145000, method: "EasyPaisa", status: "Paid" },
            { id: "STU-2024189", name: "Iqra Baig", amount: 275000, method: "Cash", status: "Partial" },
            { id: "STU-2024211", name: "Kashif Malik", amount: 405000, method: "Stripe", status: "Paid" },
          ].map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/30">
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.id} · {t.method}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tabular-nums">PKR {t.amount.toLocaleString()}</span>
                <Badge className={
                  t.status === "Paid" ? "bg-success/15 text-success border-0"
                  : t.status === "Partial" ? "bg-warning/15 text-warning border-0"
                  : "bg-destructive/15 text-destructive border-0"
                }>{t.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => toast.success("Receipt printed")}>Print</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
