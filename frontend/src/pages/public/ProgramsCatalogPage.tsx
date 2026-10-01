import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicCatalog, universityDisplayName } from "@/hooks/usePublicCatalog";
import type { PublicCatalogCampus, PublicCatalogProgram } from "@/features/studentApplications";

function applyHref(campusId: string, programId: string) {
  const params = new URLSearchParams({ campusId, programId });
  return `/apply?${params.toString()}`;
}

function ProgramRow({
  campus,
  program,
}: {
  campus: PublicCatalogCampus;
  program: PublicCatalogProgram;
}) {
  const open = !!program.admissionOpen;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border/60 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold tracking-tight">{program.name}</h3>
          <span className="text-xs font-mono text-muted-foreground">{program.code}</span>
          {program.degreeLevel && (
            <Badge variant="outline" className="text-xs">
              {program.degreeLevel}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {program.department?.name || "—"}
          {program.duration ? ` · ${program.duration} semesters` : ""}
          {program.totalCredits ? ` · ${program.totalCredits} credits` : ""}
        </p>
        <p className={`text-sm mt-1 ${open ? "text-emerald-700" : "text-muted-foreground"}`}>
          {program.admissionLabel || (open ? "Open" : "Closed")}
        </p>
      </div>
      <div className="shrink-0">
        {open ? (
          <Button asChild size="sm" className="gradient-brand text-white border-0">
            <Link to={applyHref(campus._id, program._id)}>
              Apply <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled className="pointer-events-none opacity-60">
            <XCircle className="h-3.5 w-3.5" />
            Closed
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ProgramsCatalogPage() {
  const { catalog, loading, error } = usePublicCatalog();
  const location = useLocation();
  const campuses = catalog?.campuses || [];
  const [activeCampusId, setActiveCampusId] = useState<string>("");

  useEffect(() => {
    if (!campuses.length) return;
    const hash = location.hash.replace(/^#/, "");
    const fromHash = hash.startsWith("campus-") ? hash.slice("campus-".length) : "";
    if (fromHash && campuses.some((c) => c._id === fromHash)) {
      setActiveCampusId(fromHash);
      return;
    }
    setActiveCampusId((prev) => prev || campuses[0]._id);
  }, [campuses, location.hash]);

  const activeCampus = useMemo(
    () => campuses.find((c) => c._id === activeCampusId) || campuses[0] || null,
    [campuses, activeCampusId]
  );

  const uniName = universityDisplayName(catalog);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 text-center">
        <p className="text-muted-foreground">{error || "Catalog unavailable"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary mb-2">Programs &amp; campuses</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{uniName}</h1>
        <p className="mt-3 text-muted-foreground">
          Browse programs by campus and category. Apply only when admissions are open for that
          program.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            {catalog.summary.campusCount} campuses
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5">
            {catalog.summary.programCount} programs listed
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {catalog.summary.openProgramCount} open for admission
          </span>
        </div>
      </div>

      {campuses.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No active campuses are published yet.</p>
      ) : (
        <div className="mt-10 grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-2 lg:sticky lg:top-24 self-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Campuses
            </p>
            {campuses.map((campus) => {
              const selected = campus._id === activeCampus?._id;
              return (
                <button
                  key={campus._id}
                  type="button"
                  id={`campus-${campus._id}`}
                  onClick={() => {
                    setActiveCampusId(campus._id);
                    window.history.replaceState(null, "", `#campus-${campus._id}`);
                  }}
                  className={`w-full text-left rounded-xl px-3 py-3 transition-colors border ${
                    selected
                      ? "border-primary/40 bg-primary/5"
                      : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium text-sm">{campus.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[campus.city, campus.province].filter(Boolean).join(", ") || campus.campusCode}
                  </div>
                  <div className="text-xs mt-1.5 text-muted-foreground">
                    {campus.openProgramCount || 0} open · {campus.programCount || 0} total
                  </div>
                </button>
              );
            })}
          </aside>

          <div>
            {activeCampus && (
              <>
                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{activeCampus.name}</h2>
                    {activeCampus.isMainCampus && (
                      <Badge variant="secondary">Main campus</Badge>
                    )}
                    {activeCampus.type && (
                      <Badge variant="outline">{activeCampus.type}</Badge>
                    )}
                  </div>
                  {(activeCampus.city || activeCampus.description) && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                      {activeCampus.description ||
                        [activeCampus.city, activeCampus.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {!activeCampus.categories?.length ? (
                  <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                    No programs are linked to this campus yet.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {activeCampus.categories.map((category) => (
                      <section key={category.key} className="glass rounded-2xl p-5 md:p-6">
                        <h3 className="text-lg font-semibold mb-1">{category.label}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {category.programs.length} program
                          {category.programs.length === 1 ? "" : "s"}
                        </p>
                        <div>
                          {category.programs.map((program) => (
                            <ProgramRow
                              key={program._id}
                              campus={activeCampus}
                              program={program}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-14 border-t pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Already applied? Track your application with your ID and CNIC.
        </p>
        <Button asChild variant="outline">
          <Link to="/apply/status">Track application</Link>
        </Button>
      </div>
    </div>
  );
}
