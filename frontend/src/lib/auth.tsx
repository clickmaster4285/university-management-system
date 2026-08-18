// src/lib/auth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from './api/auth';
import { toast } from 'sonner';

export type Role = 'Super Admin' | 'Admin' | 'Teacher' | 'Student' | 'Student Affairs' | 'Finance' | 'Transport' | 'Library' | 'HR';

export const ROLES: Role[] = ['Super Admin', 'Admin', 'Teacher', 'Student', 'Student Affairs', 'Finance', 'Transport', 'Library', 'HR'];

interface LoginPayload {
  email: string;
  password?: string;
  name?: string;
  role?: Role;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  ready: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void; // Add setUser function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper function to set user and update localStorage
  const updateUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      // Also store universityId separately for easy access
      if ((userData as any).universityId) {
        localStorage.setItem('universityId', (userData as any).universityId);
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('universityId');
    }
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const legacyToken = localStorage.getItem('auth_token');
        if (legacyToken && !localStorage.getItem('token')) {
          localStorage.setItem('token', legacyToken);
        }
        if (!legacyToken && localStorage.getItem('token')) {
          localStorage.removeItem('auth_token');
        }

        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log("✅ User loaded from storage:", parsedUser);
            
            // Also check for universityId
            const storedUnivId = localStorage.getItem('universityId');
            if (storedUnivId && !parsedUser.universityId) {
              (parsedUser as any).universityId = storedUnivId;
              localStorage.setItem('user', JSON.stringify(parsedUser));
              setUser(parsedUser);
            }
          } catch (error) {
            console.error("Failed to parse stored user:", error);
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('universityId');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('universityId');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginPayload) => {
    try {
      if (credentials.password) {
        const response = await authAPI.login(credentials.email, credentials.password);
        if (response.success) {
          const { user, token } = response.data;
          localStorage.setItem('token', token);
          updateUser(user);
          toast.success('Login successful!');
          return;
        }

        toast.error(response.message || 'Login failed');
        throw new Error(response.message || 'Login failed');
      }

      if (credentials.name && credentials.role) {
        const user: User = {
          _id: credentials.email,
          id: credentials.email,
          email: credentials.email,
          name: credentials.name,
          role: credentials.role,
        };
        updateUser(user);
        toast.success('Login successful!');
        return;
      }

      throw new Error('Invalid login credentials');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('universityId');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const register = async (data: Partial<User> & { password: string }) => {
    try {
      const response = await authAPI.register(data);
      if (response.success) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        updateUser(user);
        toast.success('Registration successful!');
      } else {
        toast.error(response.message || 'Registration failed');
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(data);
      if (response.success) {
        updateUser(response.data);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.message || 'Profile update failed');
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profile update failed');
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      if (response.success) {
        toast.success('Password changed successfully!');
      } else {
        toast.error(response.message || 'Password change failed');
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password change failed');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    ready: !loading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    setUser: updateUser, // Expose setUser function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useTheme = () => {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', theme);
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);
  return { dark, toggle };
};

export default AuthContext;