import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, UserCheck, UserX, Clock, QrCode, Fingerprint, ScanLine, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { attendanceWeek } from "@/lib/mock-data";

export const Route = createFileRoute("/app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — ScholarOS" },
      { name: "description", content: "QR, RFID, biometric, and face-recognition attendance in one dashboard." },
      { property: "og:title", content: "Attendance — ScholarOS" },
      { property: "og:description", content: "Multi-modal attendance." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const data = attendanceWeek();
  return (
    <AppShell title="Attendance" subtitle="Multi-modal attendance across every campus">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Present today" value="8,952" icon={UserCheck} tone="success" trend={0.8} />
        <KpiCard label="Absent" value="812" icon={UserX} tone="destructive" />
        <KpiCard label="Late" value="284" icon={Clock} tone="warning" />
        <KpiCard label="On leave" value="200" icon={CalendarCheck} tone="info" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly overview</CardTitle>
            <CardDescription>Present vs absent</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="present" fill="var(--brand)" radius={[6,6,0,0]} />
                <Bar dataKey="absent" fill="var(--destructive)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Mark attendance</CardTitle>
            <CardDescription>Choose your preferred method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="qr">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="qr">QR</TabsTrigger>
                <TabsTrigger value="bio">Biometric</TabsTrigger>
              </TabsList>
              <TabsContent value="qr" className="pt-4">
                <div className="rounded-xl border-2 border-dashed border-primary/40 p-8 text-center bg-primary/5">
                  <QrCode className="h-16 w-16 mx-auto text-primary" />
                  <p className="mt-3 text-sm font-medium">Scan student QR</p>
                  <p className="text-xs text-muted-foreground">Point camera at student ID card</p>
                  <Button className="mt-4 gradient-brand text-white border-0" onClick={() => toast.success("Attendance recorded")}>Start scanning</Button>
                </div>
              </TabsContent>
              <TabsContent value="bio" className="pt-4">
                <div className="rounded-xl border-2 border-dashed border-primary/40 p-8 text-center bg-primary/5">
                  <Fingerprint className="h-16 w-16 mx-auto text-primary" />
                  <p className="mt-3 text-sm font-medium">Place finger on scanner</p>
                  <Button className="mt-4 gradient-brand text-white border-0" onClick={() => toast.success("Verified: Aisha Khan")}>Scan fingerprint</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Attendance methods</CardTitle>
          <CardDescription>All modes are supported enterprise-wide</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: QrCode, name: "QR Code", desc: "Instant scan" },
            { icon: ScanLine, name: "RFID", desc: "Contactless" },
            { icon: ScanLine, name: "NFC", desc: "Tap to check in" },
            { icon: Fingerprint, name: "Biometric", desc: "Fingerprint" },
            { icon: ScanFace, name: "Face Recognition", desc: "AI-powered" },
            { icon: CalendarCheck, name: "Manual", desc: "Teacher entry" },
          ].map((m) => (
            <div key={m.name} className="rounded-xl border p-4 text-center card-hover bg-card/50">
              <m.icon className="h-8 w-8 mx-auto text-primary" />
              <div className="mt-2 text-sm font-medium">{m.name}</div>
              <div className="text-[11px] text-muted-foreground">{m.desc}</div>
              <Badge className="mt-2 bg-success/15 text-success border-0 text-[10px]">Enabled</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
