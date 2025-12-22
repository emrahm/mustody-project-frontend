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
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
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

export default api;
