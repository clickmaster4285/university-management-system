import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "@/lib/auth";
import { useSidebar } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Bell, Sun, Moon, Menu, ChevronDown, Command,
  Settings, LogOut,
} from "lucide-react";
import { toast } from "sonner";

export function Topbar() {
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
      
      <Button variant="ghost" size="icon" className="hidden md:flex md:mr-0">
        <Menu className="h-4 w-4" />
      </Button>
      
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q} 
          onChange={(e) => setQ(e.target.value)}
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
                  {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) ?? "AD"}
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
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { 
              logout(); 
              navigate("/login"); 
              toast.success("Signed out"); 
            }}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}