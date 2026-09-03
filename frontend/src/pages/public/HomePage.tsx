import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Building2, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: GraduationCap,
    title: "Undergraduate & graduate programs",
    desc: "Engineering, computer science, business, and more across multiple campuses.",
  },
  {
    icon: Users,
    title: "Student-centered campus life",
    desc: "Libraries, hostels, transport, events, and support services for every student.",
  },
  {
    icon: BookOpen,
    title: "Modern academic operations",
    desc: "Curriculum planning, semester registration, assessments, and transparent fee management.",
  },
];

const stats = [
  { label: "Students enrolled", value: "10,000+" },
  { label: "Academic programs", value: "50+" },
  { label: "Faculty members", value: "400+" },
  { label: "Campus locations", value: "3" },
];

export default function HomePage() {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-20 text-center">
        <p className="text-sm font-medium text-primary mb-4">Admissions open for Fall 2026</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
          Welcome to{" "}
          <span className="gradient-brand-text">ScholarOS University</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Explore our programs, apply online in minutes, and track your application status — no account required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="gradient-brand text-white border-0 h-12 px-6">
            <Link to="/apply">
              Apply for admission <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 glass">
            <Link to="/apply/status">Track your application</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 px-6">
            <Link to="/about">Learn more</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((item) => (
            <div key={item.label} className="glass rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {highlights.map((item) => (
            <div key={item.title} className="glass rounded-2xl p-6">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-4">
            <Building2 className="h-10 w-10 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold">Ready to join us?</h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Submit your admission application online. You will receive an application ID to check status anytime.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="gradient-brand text-white border-0 shrink-0">
            <Link to="/apply">Start application</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
