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

// Updated User interface with multiple id fields for compatibility
export interface User {
  id?: string;
  _id?: string;
  userId?: string;
  name: string;
  email: string;
  role: Role;
  token?: string;
  avatar?: string;
  phone?: string;
  department?: string;
}

interface AuthCtx {
  user: User | null;
  login: (userData: User | { name: string; email: string; role: Role; token?: string }) => void;
  logout: () => void;
  ready: boolean;
  updateUser: (data: Partial<User>) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

// Storage keys
const STORAGE_KEYS = {
  USER: "uni-erp-user",
  TOKEN: "uni-erp-token",
  THEME: "uni-erp-theme"
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Try to get user from localStorage
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (raw) {
        const parsedUser = JSON.parse(raw);
        // Ensure user has all required fields
        if (parsedUser && parsedUser.name && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // If user data is invalid, clear it
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
        }
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    setReady(true);
  }, []);

  const login = (userData: User | { name: string; email: string; role: Role; token?: string }) => {
    try {
      // Ensure user data has all required fields
      const userObject: User = {
        id: 'id' in userData ? userData.id : undefined,
        _id: '_id' in userData ? userData._id : undefined,
        userId: 'userId' in userData ? userData.userId : undefined,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        token: userData.token || 'mock-token-123',
        ...(userData as Partial<User>)
      };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObject));
      if (userData.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, userData.token);
      }
      
      setUser(userObject);
      console.log('✅ User logged in:', userObject.name, userObject.role);
    } catch (error) {
      console.error('Failed to login:', error);
      throw new Error('Failed to login. Please try again.');
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      setUser(null);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, ...data };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log('✅ User updated:', updatedUser.name);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <Ctx.Provider value={{ user, login, logout, ready, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      const isDark = saved === "dark";
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }, []);

  const toggle = () => {
    try {
      const next = !dark;
      setDark(next);
      localStorage.setItem(STORAGE_KEYS.THEME, next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  };

  return { dark, toggle };
}

// Helper function to get user ID from user object
export function getUserId(user: User | null): string | null {
  if (!user) return null;
  return user.id || user._id || user.userId || null;
}

// Helper function to get user role
export function getUserRole(user: User | null): Role | null {
  if (!user) return null;
  return user.role || null;
}

// Helper function to check if user has a specific role
export function hasRole(user: User | null, role: Role | Role[]): boolean {
  if (!user) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

// Helper function to check if user is authenticated
export function isAuthenticated(user: User | null): user is User {
  return user !== null && !!user.name && !!user.email && !!user.role;
}

// Helper function to get user display name
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Guest';
  return user.name || user.email || 'User';
}

// Helper function to get user initials
export function getUserInitials(user: User | null): string {
  if (!user) return 'G';
  if (user.name) {
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }
  return user.email?.substring(0, 2).toUpperCase() || 'U';
}

// Helper function to get user avatar color
export function getUserAvatarColor(user: User | null): string {
  if (!user) return '#6b7280';
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#ef4444', '#06b6d4', '#f97316'
  ];
  const index = (user.name || user.email || '').length % colors.length;
  return colors[index];
}