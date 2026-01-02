import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { socialLoginService } from '@/lib/socialAuth';
import { authAPI } from '@/lib/api';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const provider = urlParams.get('provider') || 'google';
        const error = urlParams.get('error');

        console.log('OAuth callback - Full URL:', window.location.href);
        console.log('OAuth callback params:', { code: !!code, state, provider, error });

        if (error) {
          console.error('OAuth error:', error);
          setStatus(`Authentication failed: ${error}`);
          setTimeout(() => setLocation('/login'), 3000);
          return;
        }

        if (!code) {
          console.error('Missing authorization code');
          setStatus('Missing authorization code');
          setTimeout(() => setLocation('/login'), 3000);
          return;
        }

        setStatus(`Authenticating with ${provider}...`);

        // Direct social login approach (since we're using direct Google OAuth)
        try {
          console.log('Getting access token from Google...');
          
          // Get user info from Google directly
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              code,
              grant_type: 'authorization_code',
              redirect_uri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
            }),
          });

          const tokenData = await tokenResponse.json();
          console.log('Token response:', { success: !!tokenData.access_token, error: tokenData.error });
          
          if (!tokenData.access_token) {
            throw new Error(`Failed to get access token: ${tokenData.error || 'Unknown error'}`);
          }

          console.log('Getting user info from Google...');
          
          // Get user info
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });

          const userData = await userResponse.json();
          console.log('User data from Google:', { id: userData.id, email: userData.email, name: userData.name });

          console.log('Calling backend social login...');
          
          // Use backend social login endpoint
          const response = await authAPI.socialLogin('google', userData.id, userData.email, userData.name, userData.picture);
          
          console.log('Backend social login response:', { success: !!response.data.token, user: response.data.user });
          
          setStatus('Login successful! Redirecting...');
          
          // Store token and user data
          await login(response.data.token, response.data.user);
          
          console.log('Login context updated, redirecting to dashboard...');
          
          // Redirect to dashboard
          setLocation('/dashboard');

        } catch (directError) {
          console.error('Social login failed:', directError);
          setStatus(`Authentication failed: ${directError.message}`);
          setTimeout(() => setLocation('/login'), 3000);
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus(`Authentication failed: ${error.message}`);
        setTimeout(() => setLocation('/login'), 3000);
      }
    };

    handleCallback();
  }, [setLocation, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
