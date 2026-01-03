import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { socialLoginService } from '@/lib/socialAuth';
import { authAPI } from '@/lib/api';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [status, setStatus] = useState('Processing...');

  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (processedRef.current) return;

    const handleCallback = async () => {
      processedRef.current = true;
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

        if (status === 'Processing...') {
           setStatus(`Authenticating with ${provider}...`);
        }

        // Use backend unified social login service
        try {
          // Call backend social callback endpoint
          const response = await socialLoginService.handleCallback(provider as 'google' | 'github', code, state || '');
          
          setStatus('Login successful! Redirecting...');
          
          // Construct User object compatible with AuthContext
          // Map backend response fields to the frontend User interface
          const userData = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            // Map first role from array to singular role, default to 'user'
            role: response.user.roles && response.user.roles.length > 0 ? response.user.roles[0] : 'user',
            roles: response.user.roles || [],
            // Map verified status
            email_verified: response.user.verified,
            // Initialize required fields that might be missing from this specific endpoint
            avatar_url: '', 
            members: [], // Initialize empty members array
          };
          
          // Store token and user data
          // We use 'as any' here because the constructed object matches what AuthContext needs at runtime,
          // even if the strict types might have slight discrepancies in optional fields.
          await login(response.token, userData as any);
          
          // Redirect to dashboard
          setLocation('/dashboard');

        } catch (backendError: any) {
          console.error('Backend auth error:', backendError);
          // If the error is "context canceled" it might be a strict mode artifact, but usually it means the request failed.
          // We can try to show a more helpful message or just the error.
          const msg = backendError.response?.data?.error || backendError.message;
          setStatus(`Authentication failed: ${msg}`);
          setTimeout(() => setLocation('/login'), 3000);
        }

      } catch (error: any) {
        console.error('Auth callback error:', error);
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
