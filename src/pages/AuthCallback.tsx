import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

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

          // Use unified Auth API
          try {
            // Call backend social callback endpoint via authAPI
            // Note: api.get returns AxiosResponse, so we need .data
            const response = await authAPI.socialCallback(provider as string, code, state || '');
            const responseData = response.data;
            

            setStatus('Login successful! Redirecting...');
            
            // Construct User object compatible with AuthContext
            // Map backend response fields to the frontend User interface
            const userData = {
              id: responseData.user.id,
              name: responseData.user.name,
              email: responseData.user.email,
              // Map first role from array to singular role, default to 'user'
              role: responseData.user.roles && responseData.user.roles.length > 0 ? responseData.user.roles[0] : 'user',
              roles: responseData.user.roles || [],
              // Map verified status
              email_verified: responseData.user.verified,
              // Initialize required fields that might be missing from this specific endpoint
              avatar_url: responseData.user.avatar_url || '', 
              members: responseData.user.members || [], 
            };
            
            // Store token and user data
            await login(responseData.token, userData as any);
          
          // Redirect to dashboard
          setLocation('/dashboard');


        } catch (backendError: any) {
          console.error('Backend auth error:', backendError);
          setStatus('Login failed. Please try again.');
          
          // If the error is "context canceled" it might be a strict mode artifact, but usually it means the request failed.
          // We can try to show a more helpful message or just the error.
          const msg = backendError.response?.data?.error || backendError.message;
          setStatus(`Authentication failed: ${msg}`);
          
          // Only redirect if it's not a network/server setup issue
          if (backendError.response?.status !== 404 && backendError.response?.status !== 500) {
             setTimeout(() => setLocation('/login'), 3000);
          }
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
