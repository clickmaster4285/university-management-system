import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicCatalog, universityDisplayName } from "@/hooks/usePublicCatalog";

const highlights = [
  {
    icon: GraduationCap,
    title: "Browse by campus & category",
    desc: "Undergraduate, masters, and more — see which programs are open before you apply.",
  },
  {
    icon: Users,
    title: "Apply online without an account",
    desc: "Submit your application, upload documents, and track status with your application ID.",
  },
  {
    icon: BookOpen,
    title: "Clear open / closed windows",
    desc: "Each program shows whether admissions are open and until when.",
  },
];

export default function HomePage() {
  const { catalog, loading } = usePublicCatalog();
  const uniName = universityDisplayName(catalog);
  const openCount = catalog?.summary.openProgramCount ?? 0;
  const campusCount = catalog?.summary.campusCount ?? 0;
  const programCount = catalog?.summary.programCount ?? 0;

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-20 text-center">
        <p className="text-sm font-medium text-primary mb-4">
          {loading
            ? "Loading admissions…"
            : openCount > 0
              ? `${openCount} program${openCount === 1 ? "" : "s"} open for admission`
              : "Browse programs and campuses"}
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
          Welcome to{" "}
          <span className="gradient-brand-text">
            {loading ? "…" : uniName}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Explore campuses and programs by category, then apply online when admissions are open —
          no account required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="gradient-brand text-white border-0 h-12 px-6">
            <Link to="/programs">
              Browse programs <ArrowRight className="h-4 w-4" />
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
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Campuses", value: String(campusCount) },
              { label: "Programs listed", value: String(programCount) },
              { label: "Open for admission", value: String(openCount) },
              {
                label: "University",
                value: catalog?.university?.shortName || catalog?.university?.universityCode || "—",
              },
            ].map((item) => (
              <div key={item.label} className="glass rounded-2xl p-5 text-center">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!loading && (catalog?.campuses?.length ?? 0) > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 pb-16">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Our campuses</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a campus to see programs by category.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/programs">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog!.campuses.slice(0, 6).map((campus) => (
              <Link
                key={campus._id}
                to={`/programs#campus-${campus._id}`}
                className="glass rounded-2xl p-5 hover:border-primary/30 border border-transparent transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{campus.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[campus.city, campus.province].filter(Boolean).join(", ") ||
                        campus.campusCode}
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      {campus.openProgramCount || 0} open · {campus.programCount || 0} programs
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
              <h2 className="text-2xl font-bold">Find an open program</h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Browse by campus and category, then start an application only for programs that are
                currently accepting admissions.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="gradient-brand text-white border-0 shrink-0">
            <Link to="/programs">Browse programs</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
