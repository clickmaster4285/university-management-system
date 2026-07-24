import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role =
  | "Super Admin" | "University Admin" | "Principal" | "Vice Chancellor"
  | "Dean" | "Head of Department" | "Teacher" | "Student" | "Receptionist"
  | "Admission Officer" | "Finance Officer" | "HR" | "Library Staff"
  | "Transport Manager" | "Hostel Manager" | "Parents";

export const ROLES: Role[] = [
  "Super Admin","University Admin","Principal","Vice Chancellor","Dean",
  "Head of Department","Teacher","Student","Receptionist","Admission Officer",
  "Finance Officer","HR","Library Staff","Transport Manager","Hostel Manager","Parents",
];

interface User { name: string; email: string; role: Role; }

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("uni-erp-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = (u: User) => {
    localStorage.setItem("uni-erp-user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("uni-erp-user");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("uni-erp-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("uni-erp-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };
  return { dark, toggle };
}
