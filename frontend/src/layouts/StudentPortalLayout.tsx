import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/student", label: "Home", end: true },
  { to: "/student/registrations", label: "Registrations" },
  { to: "/student/fees", label: "Fees" },
  { to: "/student/profile", label: "Profile" },
];

export function StudentPortalLayout() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "Student") {
      navigate("/dashboard");
    }
  }, [ready, user, navigate]);

  if (!mounted || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "Student") return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg gradient-brand flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">
                Scholar<span className="gradient-brand-text">OS</span>
              </p>
              <p className="text-xs text-muted-foreground">Student portal</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">
              {user.name || user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default StudentPortalLayout;
