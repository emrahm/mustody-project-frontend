import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { authAPI } from '@/lib/api';
import TwoFactorDialog from '@/components/TwoFactorDialog';

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authAPI.getSocialAuthUrl(provider);
      
      if (response.data && response.data.auth_url) {
        window.location.href = response.data.auth_url;
      } else {
        setError('Failed to get social login URL');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Social login error:', error);
      setError(error.response?.data?.error || 'Failed to initialize social login');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailVerificationNeeded(false);
    
    try {
      // Use regular login endpoint
      const response = await authAPI.login(formData.email, formData.password);
      
      // Store the token and user data
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      console.log('Login successful:', response.data);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.';
      
      // Check if error is related to email verification
      if (errorMessage.includes('email not verified') || errorMessage.includes('verify your email')) {
        setLocation(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        return;
      }
      
      // Check if 2FA is required
      if (errorMessage === '2fa_required' || errorMessage.includes('2fa_required')) {
        setRequires2FA(true);
        setTwoFactorError('');
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code: string) => {
    try {
      const response = await authAPI.loginWith2FA(formData.email, formData.password, code);
      
      // Store the token and user data
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      console.log('2FA Login successful:', response.data);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('2FA Login error:', error);
      
      const errorMessage = error.response?.data?.error || 'Invalid 2FA code. Please try again.';
      
      // Handle specific 2FA errors according to backend documentation
      if (errorMessage.includes('invalid 2FA code') || errorMessage === 'invalid 2FA code') {
        setTwoFactorError('Invalid 2FA code. Please try again.');
      } else if (errorMessage.includes('invalid credentials')) {
        setTwoFactorError('Invalid credentials. Please try logging in again.');
      } else {
        setTwoFactorError(errorMessage);
      }
      
      throw error; // Re-throw to keep dialog open
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    
    setLoading(true);
    try {
      await authAPI.resendVerification(formData.email);
      setError('Verification email sent! Please check your inbox and spam folder.');
      setEmailVerificationNeeded(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Mustody</h1>
          <p className="text-gray-600">Enterprise Crypto Custody Platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className={`mb-4 p-3 border rounded-md text-sm ${
                emailVerificationNeeded 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  {emailVerificationNeeded && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="ml-2"
                    >
                      Resend Email
                    </Button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              {!requires2FA && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin('google')}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin('github')}>
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                      </svg>
                      GitHub
                    </Button>
                  </div>
                </>
              )}
            </form>

            {!requires2FA && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-500 font-semibold">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2026 Mustody. All rights reserved.</p>
        </div>
      </div>

      <TwoFactorDialog
        open={requires2FA}
        onClose={() => setRequires2FA(false)}
        onVerify={handle2FAVerify}
        error={twoFactorError}
      />
    </div>
  );
}
