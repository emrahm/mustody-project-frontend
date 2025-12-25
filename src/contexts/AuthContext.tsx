import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[]; // Additional roles from memberships
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

  // Token refresh mechanism
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;

      const response = await authAPI.refreshToken();
      localStorage.setItem('auth_token', response.data.token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      return false;
    }
  };

  // Set up token refresh interval (30 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem('auth_token');
      if (token && user) {
        await refreshToken();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user]);

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
      generateMenuItems(user);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const generateMenuItems = (userData: User | null) => {
    if (!userData) {
      setMenuItems([]);
      return;
    }

    // Generate menu based on roles
    const menuItems: MenuItem[] = [
      { id: '1', label: 'Dashboard', path: '/dashboard', icon: 'Dashboard', roles: [], order: 1 },
    ];

    const allRoles = userData.roles || [userData.role];

    // Admin/Owner specific items
    if (allRoles.includes('admin') || allRoles.includes('owner')) {
      menuItems.push(
        { id: '2', label: 'User Management', path: '/users', icon: 'People', roles: ['admin', 'owner'], order: 2 },
        { id: '3', label: 'Role Management', path: '/roles', icon: 'Security', roles: ['admin', 'owner'], order: 3 },
        { id: '4', label: 'Company Management', path: '/company', icon: 'Business', roles: ['admin', 'owner'], order: 4 },
        { id: '5', label: 'Audit Logs', path: '/audit-logs', icon: 'Security', roles: ['admin', 'owner'], order: 5 }
      );
    }

    // Tenant Admin specific items
    if (allRoles.includes('tenant_admin')) {
      menuItems.push(
        { id: '6', label: 'Role Management', path: '/roles', icon: 'Security', roles: ['tenant_admin'], order: 6 },
        { id: '7', label: 'API Keys', path: '/api-keys', icon: 'Key', roles: ['tenant_admin'], order: 7 },
        { id: '8', label: 'Team Management', path: '/team', icon: 'People', roles: ['tenant_admin'], order: 8 }
      );
    }

    // Common items for all authenticated users
    menuItems.push(
      { id: '9', label: 'Messaging', path: '/messaging', icon: 'Message', roles: [], order: 9 },
      { id: '10', label: 'Analytics', path: '/analytics', icon: 'Analytics', roles: [], order: 10 }
    );

    setMenuItems(menuItems.sort((a, b) => a.order - b.order));
  };

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Add roles to user data if not present
          const allRoles = [userData.role];
          if (userData.members) {
            userData.members.forEach(member => {
              if (!allRoles.includes(member.role)) {
                allRoles.push(member.role);
              }
            });
          }
          
          const userWithRoles = { ...userData, roles: allRoles };
          setUser(userWithRoles);
          generateMenuItems(userWithRoles);
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem('user_data');
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token: string, userData?: User) => {
    localStorage.setItem('auth_token', token);
    
    if (userData) {
      // Add roles to user data
      const allRoles = [userData.role];
      if (userData.members) {
        userData.members.forEach(member => {
          if (!allRoles.includes(member.role)) {
            allRoles.push(member.role);
          }
        });
      }
      
      const userWithRoles = { ...userData, roles: allRoles };
      
      // Store user data in localStorage for persistence
      localStorage.setItem('user_data', JSON.stringify(userWithRoles));
      
      // Set user first, then generate menu items
      setUser(userWithRoles);
      generateMenuItems(userWithRoles);
    } else {
      await fetchUserData();
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setMenuItems([]);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    // Check user's main role
    if (user.role === role) return true;
    // Check additional roles
    if (user.roles?.includes(role)) return true;
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
