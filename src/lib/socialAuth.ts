import { api } from './api';

export interface SocialAuthResponse {
  auth_url: string;
  state: string;
}

export interface SocialCallbackResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    tenant_id: string;
    kyc_status: string;
    two_factor_enabled: boolean;
    verified: boolean;
  };
  expires_in: number;
}

class SocialLoginService {
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.redirectUri = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
  }

  /**
   * Get social OAuth authorization URL from backend
   */
  async getAuthUrl(provider: 'google' | 'github' = 'google'): Promise<SocialAuthResponse> {
    const response = await api.get<SocialAuthResponse>(`/social/url?provider=${provider}`);
    return response.data;
  }

  /**
   * Handle OAuth callback with authorization code
   */
  async handleCallback(provider: 'google' | 'github', code: string, state: string): Promise<SocialCallbackResponse> {
    const response = await api.get<SocialCallbackResponse>(`/social/callback?provider=${provider}&code=${code}&state=${state}`);
    return response.data;
  }

  /**
   * Initiate social OAuth login flow
   */
  async initiateLogin(provider: 'google' | 'github' = 'google'): Promise<void> {
    try {
      const { auth_url } = await this.getAuthUrl(provider);
      window.location.href = auth_url;
    } catch (error) {
      console.error(`Failed to initiate ${provider} login:`, error);
      throw new Error(`Failed to start ${provider} login process`);
    }
  }

  /**
   * Check if social OAuth is configured
   */
  isConfigured(): boolean {
    return !!this.clientId && !!this.redirectUri;
  }
}

export const socialLoginService = new SocialLoginService();
