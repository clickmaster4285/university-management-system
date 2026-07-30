import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
// import { campuses, generateStudents } from "@/lib/mock-data";
import { QrCode, Download, Printer, Palette, Globe, School } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ScholarOS" },
      { name: "description", content: "University profile, campuses, grading, permissions, themes, and integrations." },
      { property: "og:title", content: "Settings — ScholarOS" },
      { property: "og:description", content: "Configure your ERP." },
    ],
  }),
  component: SettingsPage,
});

// ✅ Define campuses locally since we removed the mock-data import
const campuses = [
  "Main Campus - Islamabad",
  "North Campus - Lahore",
  "South Campus - Karachi",
  "East Campus - Peshawar"
];

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Configure your university operating system">
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>University profile</CardTitle>
            <CardDescription>Basic information shown across all portals</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>University name</Label><Input defaultValue="ScholarOS University" /></div>
            <div className="space-y-1.5"><Label>Short code</Label><Input defaultValue="SU" /></div>
            <div className="space-y-1.5"><Label>Contact email</Label><Input defaultValue="registrar@scholaros.edu" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input defaultValue="+92 51 111 111 111" /></div>
            <div className="space-y-1.5"><Label>Currency</Label>
              <Select defaultValue="PKR"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem><SelectItem value="USD">USD — US Dollar</SelectItem><SelectItem value="GBP">GBP — Pound Sterling</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Language</Label>
              <Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ur">اردو</SelectItem><SelectItem value="ar">العربية</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end"><Button className="gradient-brand text-white border-0" onClick={() => toast.success("Settings saved")}>Save changes</Button></div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Enable dark mode", desc: "Auto-syncs with system" },
              { label: "Email digests", desc: "Weekly summary to admins" },
              { label: "Public portal", desc: "Alumni & recruiters" },
              { label: "AI insights", desc: "At-risk detection & auto-reports" },
              { label: "Face recognition attendance", desc: "Requires camera hardware" },
            ].map((p, i) => (
              <div key={p.label} className="flex items-center justify-between">
                <div><div className="text-sm font-medium">{p.label}</div><div className="text-xs text-muted-foreground">{p.desc}</div></div>
                <Switch defaultChecked={i !== 2} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><School className="h-4 w-4" /> Multi-campus</CardTitle>
          <CardDescription>Each campus keeps its own students, faculty, finance, and analytics</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {campuses.map((c, i) => (
            <div key={c} className="rounded-xl border p-4 bg-card/50 card-hover">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center mb-3"><Globe className="h-5 w-5 text-white" /></div>
              <div className="font-semibold text-sm">{c}</div>
              <div className="text-xs text-muted-foreground mt-1">{2400 + i * 700} students · {180 + i * 40} staff</div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.info("Campus dashboard")}>Manage</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}