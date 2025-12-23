import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Email, Refresh } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { authAPI } from '@/lib/api';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'required'>('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');

    // Clear any existing auth token to prevent 401 redirects
    if (emailParam) {
      localStorage.removeItem('auth_token');
    }

    if (emailParam) {
      setEmail(emailParam);
      setStatus('required');
      
      // Prevent navigation back to login when email verification is required
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
      };
      
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }

    if (token) {
      verifyEmail(token);
    }
  }, []);

  const verifyEmail = async (token: string) => {
    try {
      await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage('Your email has been successfully verified!');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Email verification failed.');
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await authAPI.resendVerification(email);
      setMessage('Verification email sent successfully! Please check your inbox and spam folder.');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box mb={3}>
            <Typography variant="h3" color="primary" gutterBottom>
              Mustody
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enterprise Crypto Custody Platform
            </Typography>
          </Box>

          {status === 'required' && (
            <>
              <Email sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Verify Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We've sent a verification email to:
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                {email}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please check your email and click the verification link to activate your account.
                If you don't see the email, check your spam folder.
              </Typography>

              {message && (
                <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                  {message}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={resendVerification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  You must verify your email before you can access your account.
                </Typography>
              </Box>
            </>
          )}

          {status === 'pending' && !message && (
            <>
              <Email sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Check Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                We've sent a verification link to {email || 'your email address'}.
                Please click the link to verify your account.
              </Typography>
              
              {email && (
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resendVerification}
                >
                  Resend Verification Email
                </Button>
              )}
            </>
          )}

          {status === 'pending' && message && (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Verifying Email...
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="success.main">
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                {message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to login...
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                onClick={() => setLocation('/login')}
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
