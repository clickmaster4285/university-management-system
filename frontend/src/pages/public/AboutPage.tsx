import { Link } from "react-router-dom";
import { Award, Globe, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Our mission",
    desc: "Deliver accessible, high-quality education that prepares graduates for professional success and lifelong learning.",
  },
  {
    icon: Globe,
    title: "Our vision",
    desc: "Be a leading university in the region, recognized for academic excellence, research, and community impact.",
  },
  {
    icon: Award,
    title: "Our commitment",
    desc: "Transparent admissions, fair assessments, and student services that support every stage of the academic journey.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">About ScholarOS University</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          ScholarOS University is a modern institution offering undergraduate and graduate programs across
          engineering, computing, business, and social sciences. We combine rigorous academics with practical
          experience and a supportive campus environment.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {values.map((item) => (
          <div key={item.title} className="glass rounded-2xl p-6">
            <item.icon className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-semibold text-lg">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 glass rounded-2xl p-8">
        <h2 className="text-xl font-semibold">Admissions process</h2>
        <ol className="mt-4 space-y-3 text-muted-foreground list-decimal list-inside">
          <li>Submit a basic online application with your personal and academic details.</li>
          <li>Receive an application ID and track your status online.</li>
          <li>If shortlisted, complete the full admission dossier with the admissions office.</li>
          <li>Upon acceptance, enroll in your program and register for the semester.</li>
        </ol>
        <Button asChild className="mt-6 gradient-brand text-white border-0">
          <Link to="/apply">Apply now</Link>
        </Button>
      </div>
    </div>
  );
}
