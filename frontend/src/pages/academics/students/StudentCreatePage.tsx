import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Direct directory create is disabled — students must come from
 * online/offline application → admission dossier → complete.
 */
export default function StudentCreatePage() {
  return (
    <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Students are enrolled via admissions</h1>
      <p className="text-muted-foreground text-sm">
        There is no direct “Add student” in the directory. Start an{" "}
        <strong>offline</strong> or <strong>online</strong> application, then promote to an{" "}
        <strong>admission dossier</strong> (holding place). Completing the dossier creates the
        official student record.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/admissions/internal/create">
            <UserPlus className="h-4 w-4" /> New offline application
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admissions/dossiers">
            <ClipboardList className="h-4 w-4" /> Fee &amp; enrollment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link to="/students">Back to student directory</Link>
      </Button>
    </div>
  );
}
