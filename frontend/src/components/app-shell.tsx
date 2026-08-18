// src/components/app-shell.tsx
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth, useTheme } from "@/lib/auth";
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen, CalendarCheck,
  QrCode, Library, Home, Bus, DollarSign, FileText, ClipboardCheck, ClipboardList,
  Video, Sparkles, Bell, BarChart3, Settings, LogOut, Sun, Moon, Search,
  UserPlus, Calendar, Briefcase, Wallet, Menu, ChevronDown, Command, Layers,
  University, School, // ✅ School is now imported here
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

const nav = [
  {
    label: "Overview",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/app/university", label: "University", icon: University },
      { to: "/app/campuses", label: "Campuses", icon: School }, // ✅ Now works
      { to: "/app/ai", label: "AI Assistant", icon: Sparkles },
      { to: "/app/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/app/admissions", label: "Admissions", icon: UserPlus },
      { to: "/app/departments", label: "Departments", icon: Building2 },
      { to: "/app/teachers", label: "Teachers", icon: Users },
      { to: "/app/students", label: "Students", icon: GraduationCap },
      { to: "/app/courses", label: "Courses", icon: BookOpen },
      { to: "/app/attendance", label: "Attendance", icon: CalendarCheck },
      { to: "/app/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/app/exams", label: "Exam Grades", icon: ClipboardCheck },
      { to: "/app/online-classes", label: "Online Classes", icon: Video },
      { to: "/app/academic-sessions", label: "Sessions", icon: Calendar },
      { to: "/app/semesters", label: "Semesters", icon: Layers },
      { to: "/app/batches", label: "Batches", icon: Users },
    ],
  },
  {
    label: "Campus",
    items: [
      { to: "/app/library", label: "Library", icon: Library },
      { to: "/app/hostel", label: "Hostel", icon: Home },
      { to: "/app/transport", label: "Transport", icon: Bus },
      { to: "/app/events", label: "Events", icon: Calendar },
      { to: "/app/qr", label: "Smart QR", icon: QrCode },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/app/fees", label: "Fees", icon: DollarSign },
      { to: "/app/finance", label: "Finance", icon: Wallet },
      { to: "/app/hr", label: "Human Resources", icon: Briefcase },
      { to: "/app/reports", label: "Reports", icon: BarChart3 },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path === to || path.startsWith(to + "/"));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-3 py-4">
        <Link to="/app" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold gradient-brand-text">Scholar<span className="text-foreground">OS</span></span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">University ERP</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="scrollbar-thin">
        {nav.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((it) => (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={isActive(it.to, it.exact)} tooltip={it.label}>
                      <Link to={it.to}>
                        <it.icon className="h-4 w-4" />
                        <span>{it.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <div className="rounded-lg gradient-brand p-3 text-white group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold">Upgrade to Enterprise</p>
          <p className="text-[10px] opacity-90 mt-0.5">Unlock multi-campus AI insights</p>
          <Button size="sm" variant="secondary" className="mt-2 h-7 w-full text-xs">Explore</Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Topbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 h-16 border-b glass-strong flex items-center gap-3 px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
        <Menu className="h-4 w-4" />
      </Button>
      <SidebarTrigger className="hidden md:flex" />
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search students, courses, fees, rooms…"
          className="pl-9 pr-16 bg-muted/40 border-border/60"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Badge variant="outline" className="hidden lg:inline-flex gap-1.5 py-1 border-success/30 text-success bg-success/10">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
        </Badge>
        <Button variant="ghost" size="icon" onClick={() => toast.info("3 new notifications")}>
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="gradient-brand text-white text-xs font-semibold">
                  {user?.name?.split(" ").map(n => n[0]).join("").slice(0,2) ?? "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col leading-tight text-left">
                <span className="text-xs font-medium">{user?.name ?? "Guest"}</span>
                <span className="text-[10px] text-muted-foreground">{user?.role ?? "Admin"}</span>
              </div>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); toast.success("Signed out"); }}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode;
}) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!mounted || !ready) {
    return <div className="min-h-screen flex items-center justify-center gradient-mesh"><div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }
  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
            {(title || actions) && (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {title && <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>}
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}