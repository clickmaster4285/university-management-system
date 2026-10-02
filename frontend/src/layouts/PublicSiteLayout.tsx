import { Link, Outlet, useLocation } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePublicCatalog, universityDisplayName } from "@/hooks/usePublicCatalog";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/catalog", label: "Programs" },
  { to: "/catalog/directory", label: "Directory" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function PublicSiteLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { catalog } = usePublicCatalog();
  const uniName = universityDisplayName(catalog);
  const contactEmail = catalog?.university?.officialEmail || "admissions@scholaros.edu";
  const contactPhone = catalog?.university?.phoneNumber || "";
  const contactCity = [
    catalog?.university?.address?.city,
    catalog?.university?.address?.province,
  ]
    .filter(Boolean)
    .join(", ");

  const isActive = (to: string, end?: boolean) => {
    if (end || to === "/catalog") return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="min-h-screen flex flex-col gradient-mesh">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold truncate max-w-[12rem] sm:max-w-xs md:max-w-sm">
              {catalog?.university ? (
                uniName
              ) : (
                <>
                  Scholar<span className="gradient-brand-text">OS</span>
                </>
              )}
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
            <Button asChild size="sm" className="gradient-brand text-white border-0">
              <Link to="/catalog">Browse programs</Link>
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
            <Link to="/catalog" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-primary">
              Browse programs
            </Link>
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
            <p className="font-semibold mb-2">{uniName}</p>
            <p className="text-muted-foreground">
              Quality higher education with modern admissions, academics, and student services.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Quick links</p>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <Link to="/catalog" className="hover:text-foreground">Programs &amp; campuses</Link>
              <Link to="/about" className="hover:text-foreground">About us</Link>
              <Link to="/apply/status" className="hover:text-foreground">Track application</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Contact</p>
            <p className="text-muted-foreground">{contactEmail}</p>
            {contactPhone && <p className="text-muted-foreground">{contactPhone}</p>}
            {contactCity && <p className="text-muted-foreground mt-1">{contactCity}</p>}
          </div>
        </div>
        <div className="border-t text-center text-xs text-muted-foreground py-4">
          © {new Date().getFullYear()} {uniName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default PublicSiteLayout;
