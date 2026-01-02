import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { googleOAuthService } from '@/lib/googleAuth';

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
        const error = urlParams.get('error');

        if (error) {
          setStatus('Authentication failed');
          setTimeout(() => setLocation('/login'), 2000);
          return;
        }

        if (!code || !state) {
          setStatus('Missing authorization parameters');
          setTimeout(() => setLocation('/login'), 2000);
          return;
        }

        setStatus('Authenticating with Google...');

        // Handle callback through backend
        const response = await googleOAuthService.handleCallback(code, state);

        setStatus('Login successful! Redirecting...');

        // Store token and user data
        await login(response.token, response.user);

        // Redirect to dashboard
        setLocation('/dashboard');

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('Authentication failed');
        setTimeout(() => setLocation('/login'), 2000);
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
