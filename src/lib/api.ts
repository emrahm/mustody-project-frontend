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

export interface PortfolioCoin {
  coin_id: string;
  symbol: string;
  display_name: string;
  manage_type: string;
  contract_address?: string;
  decimals: number;
  balance: string;
  balance_usd: string;
}

export interface PortfolioWallet {
  id: string;
  public_address: string;
  status: 'pending' | 'active' | 'failed';
}

export interface PortfolioChain {
  chain_id: string;
  display_name: string;
  mpc_chain_type: 'EVM' | 'COSMOS' | 'SOLANA';
  native_symbol: string;
  explorer_url?: string;
  wallet: PortfolioWallet | null;
  coins: PortfolioCoin[];
}

export const walletAPI = {
  // Get portfolio: all chains with wallet status and coin balances
  // Backend wraps in { success, data: { chains } }
  getPortfolio: () =>
    api.get<{ success: boolean; data: { chains: PortfolioChain[] } }>('/wallet/portfolio'),

  // Get wallets for the current user (or a specific user if tenant admin)
  getWallets: (userId?: string) =>
    api.get<{ wallets: UserWallet[] }>('/wallet', { params: userId ? { user_id: userId } : undefined }),

  // Create a wallet for a given chain type
  createWallet: (mpc_chain_type: 'EVM' | 'COSMOS' | 'SOLANA', external_user_id?: string) =>
    api.post<UserWallet>('/wallet/create', { mpc_chain_type, external_user_id }),

  // Get balance for a wallet on a specific chain
  getBalance: (wallet_id: string, chain_id: string) =>
    api.get<{ success: boolean; data: WalletBalance[] }>(`/wallet/${wallet_id}/balance`, { params: { chain_id } }),

  // Get all supported chains
  getChains: () =>
    api.get<{ chains: ChainDefinition[] }>('/blockchain/param/chains'),

  // Tenant admin: look up a user's wallets by user_id
  getUserWallets: (userId: string) =>
    api.get<{ wallets: UserWallet[]; user: WalletUser }>(`/wallet/user/${userId}`),

  // Initiate a withdrawal from the authenticated user's own wallet via MPC signing.
  // Returns immediately with status=PENDING; poll withdrawStatus for the tx_hash.
  withdraw: (req: {
    chain_id: string;
    symbol: string;
    to_address: string;
    amount: string;
    memo?: string;
    two_fa_code?: string;
  }) =>
    api.post<{
      success: boolean;
      data: {
        session_id: string;
        status: 'PENDING' | 'COMPLETED' | 'FAILED';
        from: string;
        to: string;
        amount: string;
        symbol: string;
        chain_id: string;
        tx_hash?: string;
      };
    }>('/wallet/withdraw', req, { _skipAuthRedirect: true } as any),

  // Poll the status of a withdrawal signing session.
  withdrawStatus: (sessionId: string) =>
    api.get<{
      success: boolean;
      data: {
        session_id: string;
        status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
        tx_hash?: string;
        error?: string;
        created_at: string;
        updated_at: string;
      };
    }>(`/wallet/withdraw/${sessionId}`),
};

export const adminWalletAPI = {
  getPendingWallets: () =>
    api.get<{ count: number; wallets: UserWallet[] }>('/admin/wallets/pending'),

  retryWallet: (walletId: string) =>
    api.post<{ message: string; wallet: UserWallet }>(`/admin/wallets/${walletId}/retry`),
};

export interface EmailQueueItem {
  id: string;
  correlation_id?: string;
  tenant_id?: string;
  user_id?: string;
  to_email: string;
  from_email: string;
  from_name?: string;
  subject: string;
  body: string;
  is_sent: boolean;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export const adminEmailQueueAPI = {
  list: (page = 1, limit = 25, isSent?: boolean, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isSent !== undefined) params.set('is_sent', String(isSent));
    if (search) params.set('search', search);
    return api.get<{ data: EmailQueueItem[]; total: number; page: number; limit: number }>(
      `/admin/email-queue?${params}`
    );
  },
  getById: (id: string) => api.get<EmailQueueItem>(`/admin/email-queue/${id}`),
  retry: (id: string) => api.post(`/admin/email-queue/${id}/retry`),
  delete: (id: string) => api.delete(`/admin/email-queue/${id}`),
};

// Contract Template types
export interface ContractTemplateParam {
  name: string;
  description: string;
  required: boolean;
}

export interface ContractTemplate {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  name: string;
  description: string;
  type: 'wasm' | 'evm';
  template_content: string; // base64 encoded bytes from backend
  parameters: ContractTemplateParam[];
  is_active: boolean;
  is_system_template: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimulateResult {
  rendered: string;
  params_used: Record<string, string>;
}

export const contractTemplateAPI = {
  list: () =>
    api.get<{ templates: ContractTemplate[] }>('/contract-templates'),

  get: (id: string) =>
    api.get<ContractTemplate>(`/contract-templates/${id}`),

  create: (data: { name: string; description: string; type: 'wasm' | 'evm'; template_content: string; parameters: ContractTemplateParam[] }) =>
    api.post<ContractTemplate>('/contract-templates', data),

  update: (id: string, data: { name: string; description: string; type: 'wasm' | 'evm'; template_content: string; parameters: ContractTemplateParam[] }) =>
    api.put<ContractTemplate>(`/contract-templates/${id}`, data),

  delete: (id: string) =>
    api.delete(`/contract-templates/${id}`),

  simulate: (id: string, params: Record<string, string>) =>
    api.post<SimulateResult>(`/contract-templates/${id}/simulate`, { params }),
};

// Deployed Contract types
export type ContractDeployStatus = 'pending' | 'deploying' | 'deployed' | 'failed' | 'verifying' | 'verified';

export interface DeployedContract {
  id: string;
  tenant_id: string;
  user_id: string | null;
  template_id: string | null;
  chain_id: string;
  owner_address: string;
  contract_name: string;
  contract_address: string;
  deploy_tx_hash: string;
  verify_tx_hash: string;
  status: ContractDeployStatus;
  params_used: Array<{ name: string; value: string }>;
  rendered_source: string | null; // base64 encoded
  is_deployed: boolean;
  verified_source: string | null; // base64 encoded
  solc_version: string;
  oz_version: string;
  optimizer_enabled: boolean;
  optimizer_runs: number;
  evm_version: string;
  error_message: string;
  deployed_by: string | null;
  created_at: string;
  updated_at: string;
}

export const deployedContractAPI = {
  list: () =>
    api.get<{ contracts: DeployedContract[] }>('/deployed-contracts'),

  get: (id: string) =>
    api.get<DeployedContract>(`/deployed-contracts/${id}`),

  create: (data: {
    template_id?: string;
    chain_id: string;
    owner_address: string;
    contract_name: string;
    params_used?: Array<{ name: string; value: string }>;
    rendered_source?: string;
    solc_version?: string;
  }) => api.post<DeployedContract>('/deployed-contracts', data),

  update: (id: string, data: {
    chain_id?: string;
    owner_address?: string;
    contract_name?: string;
    params_used?: Array<{ name: string; value: string }>;
    rendered_source?: string;
    solc_version?: string;
  }) => api.put(`/deployed-contracts/${id}`, data),

  markDeployed: (id: string, contractAddress: string, deployTxHash: string) =>
    api.post(`/deployed-contracts/${id}/mark-deployed`, { contract_address: contractAddress, deploy_tx_hash: deployTxHash }),

  deploy: (id: string, renderedSource: string, contractName: string) =>
    api.post<{ message: string; status: string }>(`/deployed-contracts/${id}/deploy`, {
      rendered_source: renderedSource,
      contract_name: contractName,
    }),

  verify: (id: string, verifiedSource: string) =>
    api.post(`/deployed-contracts/${id}/verify`, { verified_source: verifiedSource }),

  delete: (id: string) =>
    api.delete(`/deployed-contracts/${id}`),

  /** SSE stream: calls onUpdate for each event until status != 'deploying' or aborted. */
  statusStream: (
    id: string,
    onUpdate: (data: { status: string; contract_address: string; deploy_tx_hash: string; error_message: string }) => void,
    signal?: AbortSignal,
  ): void => {
    const token = localStorage.getItem('auth_token');
    const url = `${API_BASE_URL}/deployed-contracts/${id}/status-stream`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }).then(async (res) => {
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { onUpdate(JSON.parse(line.slice(6))); } catch { /* ignore */ }
          }
        }
      }
    }).catch(() => { /* aborted or network error */ });
  },
};

export interface CoinDefinition {
  id: string;
  chain_id: string;
  tenant_id?: string | null;
  symbol: string;
  display_name: string;
  manage_type: 'native' | 'erc20' | 'erc721' | 'cw20';
  contract_address?: string | null;
  decimals: number;
  gas_symbol: string;
  is_active: boolean;
}

export const coinAPI = {
  getByContract: (contractId: string) =>
    api.get<{ success: boolean; coin: CoinDefinition | null }>('/wallet/coins', { params: { contract_id: contractId } }),
  add: (data: { contract_id: string; symbol: string; display_name: string; decimals?: number }) =>
    api.post<{ success: boolean; coin: CoinDefinition }>('/wallet/coins', data),
  remove: (coinId: string, contractId: string) =>
    api.delete<{ success: boolean }>(`/wallet/coins/${coinId}`, { params: { contract_id: contractId } }),
};

// ─── Support Ticket API ───────────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  message_count?: number;
  external_ref_id?: string;
  external_ref_url?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string };
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  sender?: { id: string; name: string; email: string; avatar_url?: string };
}

export interface TicketListResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketDetailResponse {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export const supportAPI = {
  // User
  createTicket: (data: { subject: string; body: string; category?: string; priority?: TicketPriority }) =>
    api.post<SupportTicket>('/support/tickets', data),

  listMyTickets: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<TicketListResponse>('/support/tickets', { params }),

  getMyTicket: (id: string) =>
    api.get<TicketDetailResponse>(`/support/tickets/${id}`),

  replyToTicket: (id: string, body: string) =>
    api.post<SupportMessage>(`/support/tickets/${id}/messages`, { body }),

  resolveTicket: (id: string) =>
    api.patch(`/support/tickets/${id}/resolve`),

  // Admin
  adminListTickets: (params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) =>
    api.get<TicketListResponse>('/admin/support/tickets', { params }),

  adminGetTicket: (id: string) =>
    api.get<TicketDetailResponse>(`/admin/support/tickets/${id}`),

  adminReply: (id: string, body: string, is_internal = false) =>
    api.post<SupportMessage>(`/admin/support/tickets/${id}/messages`, { body, is_internal }),

  adminUpdateStatus: (id: string, status: TicketStatus) =>
    api.patch(`/admin/support/tickets/${id}/status`, { status }),

  // SSE stream URL — use with EventSource
  streamUrl: (id: string, isAdmin: boolean): string => {
    const token = localStorage.getItem('auth_token') ?? '';
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1');
    const path = isAdmin
      ? `/admin/support/tickets/${id}/stream`
      : `/support/tickets/${id}/stream`;
    return `${base}${path}?token=${encodeURIComponent(token)}`;
  },
};

export default api;
