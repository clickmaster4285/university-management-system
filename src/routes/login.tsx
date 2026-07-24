import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, ROLES, type Role } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Mail, Lock, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ScholarOS" },
      { name: "description", content: "Sign in to the ScholarOS university operating system." },
      { property: "og:title", content: "Sign in — ScholarOS" },
      { property: "og:description", content: "Access the ScholarOS admin console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@scholaros.edu");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("Super Admin");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({ name: role === "Student" ? "Aisha Khan" : "Dr. Ali Raza", email, role });
      toast.success("Welcome back");
      navigate({ to: "/app" });
    }, 900);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative gradient-mesh items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">Scholar<span className="gradient-brand-text">OS</span></span>
        </div>
        <div className="relative max-w-md">
          <div className="glass rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" /> AI SNAPSHOT · today
            </div>
            <h3 className="text-2xl font-bold leading-tight">
              384 new applications, <span className="gradient-brand-text">87.4% attendance</span>, and 3 students flagged as at-risk.
            </h3>
            <div className="mt-6 space-y-3 text-sm">
              {[
                ["Fees collected today", "PKR 4.82M", "success"],
                ["Pending approvals", "12", "warning"],
                ["Online classes live", "26", "info"],
              ].map(([l, v, tone]) => (
                <div key={l} className="flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">{l}</span>
                  <span className={`font-semibold text-${tone}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            SOC 2 Type II · FERPA · GDPR compliant
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-xl lg:border">
          <CardContent className="p-8">
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">Scholar<span className="gradient-brand-text">OS</span></span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your university console.</p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sign in as</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="rem" defaultChecked /><Label htmlFor="rem" className="text-xs font-normal">Remember me for 30 days</Label>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 gradient-brand text-white border-0">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
              </Button>
              <Button type="button" variant="outline" className="w-full h-11" onClick={() => navigate({ to: "/otp" })}>
                Sign in with OTP
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              New here? <Link to="/login" className="text-primary hover:underline">Request access</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
