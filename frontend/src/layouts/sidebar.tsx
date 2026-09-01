import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { hasModuleAccess, SIDEBAR_NAV } from "@/lib/appRoutes";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, GraduationCap, Building2, Layers, BookOpen,
  Users, UserPlus, UserCheck, CalendarCheck, ClipboardList, ClipboardCheck,
  Video, Calendar, School, Library, Home, Bus, QrCode,
  DollarSign, Wallet, Briefcase, BarChart3, Settings, Bell, Receipt,
  Sparkles, University, BookMarked, ChevronRight, Clock, Shield, UserCog,
  CalendarDays,
} from "lucide-react";

const SIDEBAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/notifications": Bell,
  "/ai": Sparkles,
  "/university": University,
  "/campuses": School,
  "/faculties": Building2,
  "/departments": Layers,
  "/programs": BookMarked,
  "/subjects": BookOpen,
  "/staff": Briefcase,
  "/workforce": Clock,
  "/workforce/leaves": CalendarDays,
  "/workforce/attendance": CalendarCheck,
  "/workforce/recruitment": Briefcase,
  "/access": Shield,
  "/role-assignments": UserCog,
  "/admissions": UserPlus,
  "/students": GraduationCap,
  "/academic-sessions": Calendar,
  "/batches": Layers,
  "/offerings": BookOpen,
  "/semester-registrations": UserCheck,
  "/attendance": CalendarCheck,
  "/assignments": ClipboardList,
  "/exams": ClipboardCheck,
  "/online-classes": Video,
  "/library": Library,
  "/hostel": Home,
  "/transport": Bus,
  "/events": Calendar,
  "/qr": QrCode,
  "/payroll": DollarSign,
  "/challans": Receipt,
  "/finance": Wallet,
  "/reports": BarChart3,
  "/settings": Settings,
  "/settings/profile": UserCog,
  "/settings/roles": Shield,
  "/settings/permission-audit": Shield,
};

const sidebarNav = SIDEBAR_NAV.map((section) => ({
  ...section,
  items: section.items.map((item) => ({
    ...item,
    icon: SIDEBAR_ICONS[item.to] || Settings,
  })),
}));

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

  const canAccessModule = (module?: string) => {
    if (!module) return true;
    return hasModuleAccess(user?.moduleAccess, module, user?.primaryRole);
  };

  const visibleNav = useMemo(
    () =>
      sidebarNav
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => canAccessModule(item.module)),
        }))
        .filter((section) => section.items.length > 0),
    [user]
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of visibleNav) {
      const hasActive = section.items.some((it) =>
        it.exact || it.to === "/" ? path === it.to : path === it.to || path.startsWith(it.to + "/")
      );
      initial[section.label] = hasActive;
    }
    if (!initial["Overview"]) initial["Overview"] = true;
    return initial;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const section of visibleNav) {
        const hasActive = section.items.some((it) =>
          it.exact || it.to === "/" ? path === it.to : path === it.to || path.startsWith(it.to + "/")
        );
        if (hasActive) next[section.label] = true;
      }
      return next;
    });
  }, [path, visibleNav]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 transition-shadow group-hover:shadow-primary/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">
              Scholar<span className="gradient-brand-text">OS</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              University Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="scrollbar-thin px-2 py-2">
        {visibleNav.map((section, idx) => {
          const isOpen = openGroups[section.label] ?? false;
          return (
            <div key={section.label}>
              {idx > 0 && <div className="my-1.5 mx-2 border-t border-border/50" />}
              <SidebarGroup className="p-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(section.label)}
                  className="flex w-full items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground hover:bg-muted/50 transition-all group-data-[collapsible=icon]:justify-center"
                >
                  <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">{section.label}</span>
                  <ChevronRight
                    className={`h-3 w-3 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>
                {isOpen && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((it) => {
                        const active = isActive(it.to, it.exact);
                        return (
                          <SidebarMenuItem key={it.to}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              className={`h-9 rounded-md transition-all ${active ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "hover:bg-muted/70"}`}
                              tooltip={it.label}
                            >
                              <Link to={it.to}>
                                <it.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                                <span>{it.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            </div>
          );
        })}
      </SidebarContent>

      <Separator />

      <SidebarFooter className="p-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold tracking-tight">ScholarOS</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">v1.0 — University ERP</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
