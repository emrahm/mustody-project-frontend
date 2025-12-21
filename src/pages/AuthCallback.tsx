import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { authAPI } from '@/lib/api';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('Authentication failed');
          setTimeout(() => setLocation('/login'), 2000);
          return;
        }

        if (!code) {
          setStatus('No authorization code received');
          setTimeout(() => setLocation('/login'), 2000);
          return;
        }

        // Exchange code for user info with Google
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
            code,
            grant_type: 'authorization_code',
            redirect_uri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
          }),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
          throw new Error('Failed to get access token');
        }

        // Get user info from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();

        // Send to backend
        const response = await authAPI.socialLogin(
          'google',
          userData.id,
          userData.email,
          userData.name,
          userData.picture
        );

        // Store token and redirect
        localStorage.setItem('auth_token', response.data.token);
        
        if (state === 'register') {
          setLocation('/dashboard?welcome=true');
        } else {
          setLocation('/dashboard');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('Authentication failed');
        setTimeout(() => setLocation('/login'), 2000);
      }
    };

    handleCallback();
  }, [setLocation]);

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
