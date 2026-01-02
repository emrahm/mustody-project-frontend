import { api } from './api';

export interface GoogleAuthResponse {
  auth_url: string;
  state: string;
}

export interface GoogleCallbackResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  expires_in: number;
}

class GoogleOAuthService {
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.redirectUri = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
  }

  /**
   * Get Google OAuth authorization URL from backend
   */
  async getAuthUrl(): Promise<GoogleAuthResponse> {
    const response = await api.get<GoogleAuthResponse>('/auth/google');
    return response.data;
  }

  /**
   * Handle OAuth callback with authorization code
   */
  async handleCallback(code: string, state: string): Promise<GoogleCallbackResponse> {
    const response = await api.get<GoogleCallbackResponse>(`/auth/google/callback?code=${code}&state=${state}`);
    return response.data;
  }

  /**
   * Initiate Google OAuth login flow
   */
  async initiateLogin(): Promise<void> {
    try {
      const { auth_url } = await this.getAuthUrl();
      window.location.href = auth_url;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      throw new Error('Failed to start Google login process');
    }
  }

  /**
   * Check if Google OAuth is configured
   */
  isConfigured(): boolean {
    return !!this.clientId && !!this.redirectUri;
  }
}

export const googleOAuthService = new GoogleOAuthService();
