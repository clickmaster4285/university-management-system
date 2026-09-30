import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Real-life university setup order (matches ops reality). */
export const ACADEMIC_SETUP_LADDER = [
  { step: 1, label: "University Profile", to: "/university", section: "institution" },
  { step: 2, label: "Campuses", to: "/campuses", section: "institution" },
  { step: 3, label: "Faculties", to: "/faculties", section: "institution" },
  { step: 4, label: "Departments", to: "/departments", section: "institution" },
  { step: 5, label: "Programs", to: "/programs", section: "catalog" },
  { step: 6, label: "Subjects", to: "/subjects", section: "catalog" },
  {
    step: 7,
    label: "Program Curriculum",
    to: "/programs",
    hint: "Open a program → Curriculum",
    section: "catalog",
  },
  {
    step: 8,
    label: "Subject / Semester Fees",
    to: "/subjects",
    hint: "Subject fees + Program → Semester Fees",
    section: "catalog",
  },
  { step: 9, label: "Academic Sessions", to: "/academic-sessions", section: "term" },
  { step: 10, label: "Batches", to: "/batches", section: "term" },
  { step: 11, label: "Course Offerings", to: "/offerings", section: "term" },
  {
    step: 12,
    label: "Enrollments",
    to: "/offerings",
    hint: "On an offering → Enrollments",
    section: "term",
  },
] as const;

export type SetupLadderKey =
  | "university"
  | "campuses"
  | "faculties"
  | "departments"
  | "programs"
  | "subjects"
  | "curriculum"
  | "fees"
  | "sessions"
  | "batches"
  | "offerings"
  | "enrollments"
  | "registrations"
  | "students";

const KEY_TO_STEP: Record<SetupLadderKey, number> = {
  university: 1,
  campuses: 2,
  faculties: 3,
  departments: 4,
  programs: 5,
  subjects: 6,
  curriculum: 7,
  fees: 8,
  sessions: 9,
  batches: 10,
  offerings: 11,
  enrollments: 12,
  registrations: 12,
  students: 12,
};

type SetupContextBannerProps = {
  current: SetupLadderKey;
  title: string;
  description: string;
  /** Override next-step link text / path */
  nextOverride?: { label: string; to: string };
  className?: string;
};

/**
 * Compact page header strip: where you are in the setup ladder + next step.
 */
export function SetupContextBanner({
  current,
  title,
  description,
  nextOverride,
  className,
}: SetupContextBannerProps) {
  const stepNum = KEY_TO_STEP[current];
  const next = ACADEMIC_SETUP_LADDER.find((s) => s.step === stepNum + 1);

  return (
    <div className={cn("mb-6 space-y-3", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Setup step {stepNum} of 12
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">{description}</p>
        </div>
        <Link
          to="/setup"
          className="text-xs text-primary hover:underline underline-offset-2 shrink-0"
        >
          View full setup guide
        </Link>
      </div>

      {(nextOverride || next) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Next in real life:</span>
          <Link
            to={nextOverride?.to || next!.to}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline underline-offset-2"
          >
            {nextOverride?.label || `Step ${next!.step}: ${next!.label}`}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {!nextOverride && "hint" in (next || {}) && next && (next as { hint?: string }).hint && (
            <span className="text-xs text-muted-foreground">
              ({(next as { hint?: string }).hint})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

type SetupLadderListProps = {
  /** Highlight this step number */
  activeStep?: number;
  compact?: boolean;
};

export function SetupLadderList({ activeStep, compact }: SetupLadderListProps) {
  return (
    <ol className={cn("space-y-1", compact && "text-sm")}>
      {ACADEMIC_SETUP_LADDER.map((item) => {
        const active = activeStep === item.step;
        const done = activeStep != null && item.step < activeStep;
        return (
          <li key={item.step}>
            <Link
              to={item.to}
              className={cn(
                "flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors",
                active ? "bg-primary/10 text-primary" : "hover:bg-muted/70 text-foreground"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              ) : (
                <Circle
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
              <span className="min-w-0">
                <span className="font-medium">
                  {item.step}. {item.label}
                </span>
                {"hint" in item && item.hint && (
                  <span className="block text-xs text-muted-foreground">{item.hint}</span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
