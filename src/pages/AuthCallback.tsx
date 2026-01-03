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
        const provider = urlParams.get('provider') || 'google'; // Check for provider param first
        const error = urlParams.get('error');

        if (error) {
          setStatus(`Authentication failed: ${error}`);
          setTimeout(() => setLocation('/login'), 3000);
          return;
        }

        if (!code) {
          setStatus('Missing authorization code');
          setTimeout(() => setLocation('/login'), 3000);
          return;
        }

        setStatus(`Authenticating with ${provider}...`);

        // Use backend unified social login service
        try {
          // Call backend social callback endpoint
          const response = await socialLoginService.handleCallback(provider as 'google' | 'github', code, state);
          
          
          setStatus('Login successful! Redirecting...');
          
          // Store token and user data
          await login(response.token, response.user);
          
          
          // Redirect to dashboard
          setLocation('/dashboard');

        } catch (backendError) {
          setStatus(`Authentication failed: ${backendError.message}`);
          setTimeout(() => setLocation('/login'), 3000);
        }

      } catch (error) {
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
