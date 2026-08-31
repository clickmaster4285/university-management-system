import { Link, Outlet, useLocation } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/apply", label: "Admissions" },
];

export function PublicSiteLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="min-h-screen flex flex-col gradient-mesh">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              Scholar<span className="gradient-brand-text">OS</span> University
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to, link.end)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/apply/status">Track application</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Staff portal</Link>
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t px-6 py-4 space-y-1 bg-background">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.to, link.end) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/apply/status" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm">
              Track application
            </Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm">
              Staff portal
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-background/60 mt-auto">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <p className="font-semibold mb-2">ScholarOS University</p>
            <p className="text-muted-foreground">
              Quality higher education with modern admissions, academics, and student services.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Quick links</p>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <Link to="/about" className="hover:text-foreground">About us</Link>
              <Link to="/apply" className="hover:text-foreground">Apply for admission</Link>
              <Link to="/apply/status" className="hover:text-foreground">Track application</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Contact</p>
            <p className="text-muted-foreground">admissions@scholaros.edu</p>
            <p className="text-muted-foreground">+92 51 123 4567</p>
            <p className="text-muted-foreground mt-1">Islamabad, Pakistan</p>
          </div>
        </div>
        <div className="border-t text-center text-xs text-muted-foreground py-4">
          © {new Date().getFullYear()} ScholarOS University. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default PublicSiteLayout;
