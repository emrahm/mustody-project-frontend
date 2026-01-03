import axios from 'axios';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the request explicitly requested to skip auth redirect
    const skipRedirect = (error.config as any)?._skipAuthRedirect;

    if (error.response?.status === 401 && !skipRedirect) {
      // Only clear token and redirect if it's NOT a public page and NOT the homepage
      const publicPaths = ['/verify-email', '/login', '/register', '/landing', '/auth/callback'];
      const isHomepage = window.location.pathname === '/';
      
      if (!publicPaths.includes(window.location.pathname) && !isHomepage) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
    }
    
    // Log detailed error for development
    if (error.response?.data) {
      console.error('API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    
    return Promise.reject(error);
  }
);



// Auth Response Types
export interface AuthResponse {
  message?: string;
  token: string;
  expires_in?: number;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];        // Standard from backend
    tenant_id: string;      // Standard from backend
    kyc_status: string;     // Standard from backend
    two_factor_enabled: boolean; // Standard from backend
    verified: boolean;      // Standard from backend
    
    // Optional/Legacy fields that might not be in all responses
    role?: string;          
    avatar_url?: string;
    members?: Array<{
      role: string;
      tenant: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };
}

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/login', { email, password }),
  
  loginWith2FA: (email: string, password: string, code: string) =>
    api.post<AuthResponse>('/login/2fa', { email, password, code }),
  
  logout: () =>
    api.post('/logout'),
  
  refreshToken: () =>
    api.post<{token: string}>('/refresh-token'),
  
  adminLogin: (email: string, password: string) =>
    api.post<AuthResponse>('/admin/login', { email, password }),
  
  registerAdmin: (name: string, email: string, password: string, org_name: string) =>
    api.post<AuthResponse>('/register/admin', { name, email, password, org_name }),
  
  registerUser: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/register', { name, email, password }),
  
  socialLogin: (provider: string, provider_id: string, email: string, name?: string, avatar_url?: string) =>
    api.post<AuthResponse>('/login/social', { provider, provider_id, email, name, avatar_url }),

  getSocialAuthUrl: (provider: string) =>
    api.get<{auth_url: string; state: string}>(`/social/url?provider=${provider}`),
    
  socialCallback: (provider: string, code: string, state: string) =>
    api.get<any>(`/social/callback?provider=${provider}&code=${code}&state=${state}`),
  
  verifyEmail: (token: string) =>
    api.post('/verify-email', { token }),
  
  resendVerification: (email: string) =>
    api.post('/resend-verification', { email }),
  
  enable2FA: () =>
    api.post('/account/2fa/enable'),
  
  verify2FA: (code: string) =>
    api.post('/account/2fa/verify', { code }),
  
  disable2FA: () =>
    api.post('/account/2fa/disable'),
  
  regenerateBackupCodes: () =>
    api.post('/account/2fa/backup-codes'),
  
  me: () => api.get('/me'),
  
  getMenuItems: () => api.get('/menu'),
};

// Tenant API endpoints
export const tenantAPI = {
  requestTenant: (name: string, email: string, company: string, purpose: string) =>
    api.post('/tenant-request', { name, email, company, purpose }),
  
  sendInvitation: (email: string, role: string) =>
    api.post('/invitations', { email, role }),
  
  getInvitation: (token: string) =>
    api.get(`/invitation/${token}`),
  
  acceptInvitation: (token: string, name: string, password: string) =>
    api.post('/invitation/accept', { token, name, password }),

  // Dashboard stats
  getDashboardStats: (config?: any) => api.get('/dashboard/stats', config),
  
  getRecentActivities: (config?: any) => api.get('/dashboard/activities', config),
};

// API Key management endpoints
export const apiKeyAPI = {
  getApiKeys: () => api.get('/api-keys'),
  
  createApiKey: (name: string, permissions: string[], expires_at?: string) =>
    api.post('/api-keys', { name, permissions, expires_at }),
  
  updateApiKey: (id: number, name: string, permissions: string[]) =>
    api.put(`/api-keys/${id}`, { name, permissions }),
  
  deleteApiKey: (id: number) =>
    api.delete(`/api-keys/${id}`),
  
  toggleApiKey: (id: number, is_active: boolean) =>
    api.patch(`/api-keys/${id}/toggle`, { is_active }),
};

// Notification API endpoints
export const notificationAPI = {
  getNotifications: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
  
  subscribePush: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post('/notifications/subscribe', subscription),
  
  sendNotification: (data: { user_id: string; title: string; message: string; type?: string; data?: any }) =>
    api.post('/notifications/send', data),
};

export default api;
