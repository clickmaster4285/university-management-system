import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Sparkles, Shield, BarChart3, Users, Building2, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScholarOS — The University Operating System" },
      { name: "description", content: "One platform for admissions, academics, attendance, fees, hostel, transport, and AI-driven insights across every campus." },
      { property: "og:title", content: "ScholarOS — The University Operating System" },
      { property: "og:description", content: "One platform for admissions, academics, attendance, fees, hostel, transport, and AI-driven insights across every campus." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && user) navigate({ to: "/app" });
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">Scholar<span className="gradient-brand-text">OS</span></span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
          <Button asChild className="gradient-brand text-white border-0"><Link to="/login">Launch console <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3 text-primary" /> Trusted by 200+ universities worldwide
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05]">
          The operating system for<br />
          <span className="gradient-brand-text">modern universities</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          From admissions to graduation — ScholarOS unifies every campus workflow with real-time analytics, role-based portals, and AI that actually understands academia.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="gradient-brand text-white border-0 h-12 px-6">
            <Link to="/login">Enter the console <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 glass">
            <Link to="/login">Book a demo</Link>
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Students", value: "10,248" },
            { icon: Building2, label: "Departments", value: "52" },
            { icon: BarChart3, label: "Uptime", value: "99.99%" },
            { icon: Shield, label: "SOC 2 Type II", value: "Certified" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 text-left">
              <s.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-5 text-left">
          {[
            { icon: Users, title: "Unified student journey", desc: "From application to alumni, every touchpoint is connected." },
            { icon: BarChart3, title: "Realtime analytics", desc: "Live dashboards for admissions, attendance, and finance." },
            { icon: Bell, title: "AI at every step", desc: "Ask questions, generate reports, and flag at-risk students." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 card-hover">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
