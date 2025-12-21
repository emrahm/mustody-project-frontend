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
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');

    if (emailParam) {
      setEmail(emailParam);
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
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login?verified=true');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Email verification failed.');
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    try {
      await authAPI.resendVerification(email);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to resend verification email.');
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
