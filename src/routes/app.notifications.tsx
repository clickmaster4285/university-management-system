import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MessageSquare, Mail, Smartphone, AlertTriangle, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ScholarOS" },
      { name: "description", content: "SMS, WhatsApp, email, push, and emergency alerts from one control center." },
      { property: "og:title", content: "Notifications — ScholarOS" },
      { property: "og:description", content: "Unified notification center." },
    ],
  }),
  component: NotificationsPage,
});

const items = [
  { icon: AlertTriangle, tone: "destructive", title: "Emergency drill scheduled", meta: "All campuses · Tomorrow 10:00 AM", time: "2m ago" },
  { icon: Megaphone, tone: "brand", title: "Fall convocation registrations open", meta: "Class of 2024 · Deadline Nov 30", time: "1h ago" },
  { icon: Mail, tone: "info", title: "Fee reminder sent to 214 students", meta: "PKR 6.8M pending", time: "3h ago" },
  { icon: MessageSquare, tone: "success", title: "SMS delivered to 8,412 parents", meta: "Midterm schedule notification", time: "5h ago" },
  { icon: Smartphone, tone: "warning", title: "WhatsApp broadcast queued", meta: "Sports gala announcement · 1,242 recipients", time: "Yesterday" },
  { icon: Bell, tone: "brand", title: "Push notification: New assignment posted", meta: "CS-201 · 82 students", time: "Yesterday" },
];

function NotificationsPage() {
  return (
    <AppShell title="Notifications" subtitle="Reach every student, parent, and staff — instantly">
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, name: "SMS", count: "12.4K", tone: "brand" },
          { icon: Smartphone, name: "WhatsApp", count: "8.2K", tone: "success" },
          { icon: Mail, name: "Email", count: "24.1K", tone: "info" },
          { icon: Bell, name: "Push", count: "42.8K", tone: "warning" },
        ].map((c) => (
          <Card key={c.name} className="glass card-hover">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.name}</div>
                <div className="text-2xl font-bold mt-1">{c.count}</div>
                <div className="text-[11px] text-muted-foreground">delivered today</div>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-${c.tone}/15 text-${c.tone} flex items-center justify-center`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Notification center</CardTitle>
            <CardDescription>Recent activity across all channels</CardDescription>
          </div>
          <Button className="gradient-brand text-white border-0" onClick={() => toast.success("Broadcast queued")}>
            <Megaphone className="h-4 w-4" /> New broadcast
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4 space-y-2">
              {items.map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/30">
                  <div className={`h-9 w-9 rounded-lg bg-${n.tone}/15 text-${n.tone} flex items-center justify-center shrink-0`}>
                    <n.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.meta}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{n.time}</Badge>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="alerts" className="mt-4 text-sm text-muted-foreground p-6 text-center">No active alerts.</TabsContent>
            <TabsContent value="scheduled" className="mt-4 text-sm text-muted-foreground p-6 text-center">3 broadcasts scheduled this week.</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppShell>
  );
}
