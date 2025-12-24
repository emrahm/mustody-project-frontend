import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  members: Array<{
    role: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  email_verified: boolean;
  avatar_url: string;
}

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: string[];
  order: number;
}

interface AuthContextType {
  user: User | null;
  menuItems: MenuItem[];
  loading: boolean;
  login: (token: string, userData?: User) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  canAccess: (requiredRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('fetchUserData called, token exists:', !!token);
      if (!token) {
        setLoading(false);
        return;
      }

      // Since /me endpoint doesn't exist, we'll just set default menu items
      // User data should be set during login
      console.log('Setting default menu items...');
      setMenuItems([
        { id: '1', label: 'Dashboard', path: '/dashboard', icon: 'Dashboard', roles: [], order: 1 },
        { id: '2', label: 'API Keys', path: '/api-keys', icon: 'Key', roles: ['admin', 'owner'], order: 2 },
        { id: '3', label: 'Messaging', path: '/messaging', icon: 'Message', roles: [], order: 3 },
        { id: '4', label: 'Analytics', path: '/analytics', icon: 'Analytics', roles: [], order: 4 },
      ]);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const login = async (token: string, userData?: User) => {
    localStorage.setItem('auth_token', token);
    if (userData) {
      setUser(userData);
      // Set default menu items since backend doesn't have menu endpoint
      setMenuItems([
        { id: '1', label: 'Dashboard', path: '/dashboard', icon: 'Dashboard', roles: [], order: 1 },
        { id: '2', label: 'API Keys', path: '/api-keys', icon: 'Key', roles: ['admin', 'owner'], order: 2 },
        { id: '3', label: 'Messaging', path: '/messaging', icon: 'Message', roles: [], order: 3 },
        { id: '4', label: 'Analytics', path: '/analytics', icon: 'Analytics', roles: [], order: 4 },
      ]);
    } else {
      await fetchUserData();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setMenuItems([]);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    // Check user's main role
    if (user.role === role) return true;
    // Check member roles
    return user.members?.some(member => member.role === role) || false;
  };

  const canAccess = (requiredRoles: string[]): boolean => {
    if (!user || !requiredRoles.length) return true; // Allow access if no roles required
    return requiredRoles.some(role => hasRole(role));
  };

  const value: AuthContextType = {
    user,
    menuItems,
    loading,
    login,
    logout,
    hasRole,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
