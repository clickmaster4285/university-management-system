import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Receipt, PiggyBank } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { revenueSeries } from "@/lib/mock-data";

export const Route = createFileRoute("/app/finance")({
  head: () => ({
    meta: [
      { title: "Finance — ScholarOS" },
      { name: "description", content: "Income, expenses, payroll, budgets, tax, invoices, and refunds." },
      { property: "og:title", content: "Finance — ScholarOS" },
      { property: "og:description", content: "Financial operations." },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const rev = revenueSeries();
  return (
    <AppShell title="Finance" subtitle="Consolidated view across all campuses">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Revenue YTD" value="PKR 62.5M" icon={TrendingUp} tone="success" trend={15.2} />
        <KpiCard label="Expenses" value="PKR 41.2M" icon={TrendingDown} tone="destructive" trend={4.7} />
        <KpiCard label="Net Income" value="PKR 21.3M" icon={PiggyBank} tone="brand" />
        <KpiCard label="Invoices Sent" value="8,412" icon={Receipt} tone="info" />
      </div>

      <Card className="glass">
        <CardHeader><CardTitle>Income vs expenses</CardTitle><CardDescription>PKR millions, last 12 months</CardDescription></CardHeader>
        <CardContent className="pl-0">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={rev}>
              <defs>
                <linearGradient id="fr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--success)" fill="url(#fr)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="var(--destructive)" fill="url(#fe)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader><CardTitle>Budget allocation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Salaries & payroll", pct: 48, amt: "PKR 32.4M" },
              { name: "Infrastructure", pct: 18, amt: "PKR 12.1M" },
              { name: "Research grants", pct: 14, amt: "PKR 9.4M" },
              { name: "Scholarships", pct: 10, amt: "PKR 6.7M" },
              { name: "Utilities & maintenance", pct: 6, amt: "PKR 4.0M" },
              { name: "Marketing & events", pct: 4, amt: "PKR 2.7M" },
            ].map((b) => (
              <div key={b.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.name}</span><span className="tabular-nums font-medium">{b.amt}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-brand" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: "INV-24-8842", vendor: "Cisco Networking", amt: 4820000, status: "Paid" },
              { id: "INV-24-8841", vendor: "Elsevier Journals", amt: 1240000, status: "Paid" },
              { id: "INV-24-8840", vendor: "K-Electric", amt: 3120000, status: "Pending" },
              { id: "INV-24-8839", vendor: "Sui Northern Gas", amt: 480000, status: "Paid" },
              { id: "INV-24-8838", vendor: "Facilities Maintenance", amt: 1810000, status: "Pending" },
            ].map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div>
                  <div className="text-sm font-medium">{i.vendor}</div>
                  <div className="text-xs text-muted-foreground">{i.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">PKR {i.amt.toLocaleString()}</div>
                  <div className={`text-[10px] font-medium ${i.status === "Paid" ? "text-success" : "text-warning"}`}>{i.status}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
