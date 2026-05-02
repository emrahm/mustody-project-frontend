import axios from 'axios';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Backend server base URL (for static files like avatars)
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

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
  
  createApiKey: (name: string, permissions: string[], expires_at?: string | null, auth_type?: 'hmac' | 'rsa', public_key?: string) =>
    api.post('/api-keys', { name, permissions, expires_at, auth_type, public_key }),
  
  updateApiKey: (id: string, name: string, permissions: string[]) =>
    api.put(`/api-keys/${id}`, { name, permissions }),
  
  deleteApiKey: (id: string) =>
    api.delete(`/api-keys/${id}`),
  
  toggleApiKey: (id: string, is_active: boolean) =>
    api.patch(`/api-keys/${id}/toggle`, { is_active }),
};

// Admin API endpoints
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  user_status: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  kyc_status: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  members?: Array<{ role: string; tenant: { id: string; name: string; slug: string } }>;
  roles?: Array<{ role: string; tenant_id: string }>;
}

export const adminAPI = {
  getUsers: (page = 1, limit = 20) =>
    api.get<{ users: AdminUser[]; total: number; page: number; limit: number }>(
      `/admin/users?page=${page}&limit=${limit}`
    ),

  updateUserStatus: (userId: string, status: string) =>
    api.put(`/admin/users/${userId}/status`, { status }),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  reset2FA: (userId: string) =>
    api.delete(`/admin/users/${userId}/2fa`),
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

// Wallet types
export interface UserWallet {
  id: string;
  user_id: string;
  tenant_id: string;
  external_user_id: string;
  mpc_chain_type: 'EVM' | 'COSMOS' | 'SOLANA';
  public_address: string;
  mpc_wallet_id: string;
  status: 'pending' | 'active' | 'failed';
  failure_reason?: string;
  retry_count: number;
  last_error?: string;
  next_retry_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChainDefinition {
  chain_id: string;
  display_name: string;
  mpc_chain_type: 'EVM' | 'COSMOS' | 'SOLANA';
  evm_chain_id?: number;
  rpc_url: string;
  native_symbol: string;
  native_decimals: number;
  explorer_url?: string;
  is_active: boolean;
}

export interface WalletBalance {
  chain_id: string;
  symbol: string;
  balance: string;       // raw string from RPC
  balance_usd?: string;
  updated_at: string;
}

export interface WalletUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export const walletAPI = {
  // Get wallets for the current user (or a specific user if tenant admin)
  getWallets: (userId?: string) =>
    api.get<{ wallets: UserWallet[] }>('/wallet', { params: userId ? { user_id: userId } : undefined }),

  // Create a wallet for a given chain type
  createWallet: (mpc_chain_type: 'EVM' | 'COSMOS' | 'SOLANA', external_user_id?: string) =>
    api.post<UserWallet>('/wallet/create', { mpc_chain_type, external_user_id }),

  // Get balance for a wallet on a specific chain
  getBalance: (wallet_id: string, chain_id: string) =>
    api.get<WalletBalance>(`/wallet/${wallet_id}/balance`, { params: { chain_id } }),

  // Get all supported chains
  getChains: () =>
    api.get<{ chains: ChainDefinition[] }>('/blockchain/param/chains'),

  // Tenant admin: look up a user's wallets by user_id
  getUserWallets: (userId: string) =>
    api.get<{ wallets: UserWallet[]; user: WalletUser }>(`/wallet/user/${userId}`),
};

export const adminWalletAPI = {
  getPendingWallets: () =>
    api.get<{ count: number; wallets: UserWallet[] }>('/admin/wallets/pending'),

  retryWallet: (walletId: string) =>
    api.post<{ message: string; wallet: UserWallet }>(`/admin/wallets/${walletId}/retry`),
};

export default api;
