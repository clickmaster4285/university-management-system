import { Link, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import {
  LayoutDashboard, Users, GraduationCap as GraduationIcon, 
  Building2, BookOpen, CalendarCheck, QrCode, Library, Home, 
  Bus, DollarSign, FileText, ClipboardCheck, ClipboardList,
  Video, Sparkles, Bell, BarChart3, Settings, UserPlus, 
  Calendar, Briefcase, Wallet, Layers, University, School,
} from "lucide-react";

// ✅ NAVIGATION CONFIGURATION IS HERE - INSIDE SIDEBAR
// Anyone looking for sidebar changes will find it immediately
const sidebarNav = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/university", label: "University", icon: University },
      { to: "/campuses", label: "Campuses", icon: School },
      { to: "/ai", label: "AI Assistant", icon: Sparkles },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/admissions", label: "Admissions", icon: UserPlus },
      { to: "/departments", label: "Departments", icon: Building2 },
      { to: "/programs", label: "Programs", icon: Layers },
      { to: "/teachers", label: "Teachers", icon: Users },
      { to: "/students", label: "Students", icon: GraduationIcon },
      { to: "/courses", label: "Courses", icon: BookOpen },
      { to: "/attendance", label: "Attendance", icon: CalendarCheck },
      { to: "/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/exams", label: "Exam Grades", icon: ClipboardCheck },
      { to: "/online-classes", label: "Online Classes", icon: Video },
      { to: "/academic-sessions", label: "Sessions", icon: Calendar },
      { to: "/semesters", label: "Semesters", icon: Layers },
      { to: "/batches", label: "Batches", icon: Users },
    ],
  },
  {
    label: "Campus",
    items: [
      { to: "/library", label: "Library", icon: Library },
      { to: "/hostel", label: "Hostel", icon: Home },
      { to: "/transport", label: "Transport", icon: Bus },
      { to: "/events", label: "Events", icon: Calendar },
      { to: "/qr", label: "Smart QR", icon: QrCode },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/fees", label: "Fees", icon: DollarSign },
      { to: "/finance", label: "Finance", icon: Wallet },
      { to: "/hr", label: "Human Resources", icon: Briefcase },
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;
  
  const isActive = (to: string, exact?: boolean) => 
    (exact || to === "/" ? path === to : path === to || path.startsWith(to + "/"));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-3 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold gradient-brand-text">
              Scholar<span className="text-foreground">OS</span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              University ERP
            </span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="scrollbar-thin">
        {sidebarNav.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((it) => (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(it.to, it.exact)} 
                      tooltip={it.label}
                    >
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
          <Button size="sm" variant="secondary" className="mt-2 h-7 w-full text-xs">
            Explore
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}