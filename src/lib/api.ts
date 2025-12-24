import axios from 'axios';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
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
    if (error.response?.status === 401) {
      console.log('401 error detected, current path:', window.location.pathname);
      console.log('Token exists:', !!localStorage.getItem('auth_token'));
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      // Don't redirect if on verify-email or login page
      if (window.location.pathname !== '/verify-email' && window.location.pathname !== '/login') {
        console.log('Redirecting to login due to 401');
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

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
  refreshToken: () =>
    api.post('/refresh-token'),
  
  adminLogin: (email: string, password: string) =>
    api.post('/admin/login', { email, password }),
  
  registerAdmin: (name: string, email: string, password: string, org_name: string) =>
    api.post('/register/admin', { name, email, password, org_name }),
  
  registerUser: (name: string, email: string, password: string) =>
    api.post('/register', { name, email, password }),
  
  socialLogin: (provider: string, provider_id: string, email: string, name?: string, avatar_url?: string) =>
    api.post('/login/social', { provider, provider_id, email, name, avatar_url }),
  
  verifyEmail: (token: string) =>
    api.post('/verify-email', { token }),
  
  resendVerification: (email: string) =>
    api.post('/resend-verification', { email }),
  
  enable2FA: () =>
    api.post('/2fa/enable'),
  
  verify2FA: (code: string) =>
    api.post('/2fa/verify', { code }),
  
  logout: () => api.post('/logout'),
  
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

export default api;
