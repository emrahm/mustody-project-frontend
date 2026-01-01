import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Email,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocation } from 'wouter';
import { authAPI } from '@/lib/api';
import { getErrorMessage, getErrorDetails } from '@/lib/errorUtils';
import { useAuth } from '@/contexts/AuthContext';
import TwoFactorDialog from '@/components/TwoFactorDialog';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  rememberMe: yup.boolean(),
});

type FormData = yup.InferType<typeof schema>;

export default function LoginMUI() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    setEmailVerificationNeeded(false);

    try {
      const response = await authAPI.login(data.email, data.password);
      
      // Store token and user data from login response
      await login(response.data.token, response.data.user);
      
      console.log('Login successful, user:', response.data.user);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Get detailed error information
      const errorDetails = getErrorDetails(error);
      console.error('Error details:', errorDetails);
      
      const errorMessage = getErrorMessage(error);
      
      // Check if error is related to email verification
      if (errorMessage.includes('email not verified') || errorMessage.includes('verify your email')) {
        setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
      
      // Check if 2FA is required
      if (errorMessage === '2fa_required' || errorMessage.includes('2fa_required')) {
        setLoginData({ email: data.email, password: data.password });
        setRequires2FA(true);
        setTwoFactorError('');
        return;
      }
      
      // Show detailed error message with correlation ID if available
      const displayMessage = errorDetails.correlationId 
        ? `${errorMessage} (ID: ${errorDetails.correlationId})`
        : errorMessage;
      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code: string) => {
    try {
      const response = await authAPI.loginWith2FA(loginData.email, loginData.password, code);
      
      // Store token and user data from login response
      await login(response.data.token, response.data.user);
      
      console.log('2FA Login successful:', response.data);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('2FA Login error:', error);
      
      const errorMessage = getErrorMessage(error);
      
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
    if (!userEmail) return;
    
    setLoading(true);
    try {
      await authAPI.resendVerification(userEmail);
      setError('Verification email sent! Please check your inbox and spam folder.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    
    if (!clientId) {
      setError('Google OAuth is not configured');
      return;
    }
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `state=login`;
    
    window.location.href = googleAuthUrl;
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
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h3" color="primary" gutterBottom>
              Mustody
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enterprise Crypto Custody Platform
            </Typography>
          </Box>

          <Typography variant="h4" textAlign="center" mb={1}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert 
              severity={emailVerificationNeeded ? "warning" : "error"} 
              sx={{ mb: 3 }}
              action={
                emailVerificationNeeded && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    Resend Email
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={handleGoogleSignIn}
            sx={{ mb: 3 }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Or continue with email
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  sx={{ mb: 2 }}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Remember me"
                  />
                )}
              />
              <MuiLink
                component="button"
                type="button"
                variant="body2"
                onClick={() => setLocation('/forgot-password')}
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 3 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Don't have an account?{' '}
            <MuiLink
              component="button"
              onClick={() => setLocation('/register')}
              color="primary"
            >
              Sign up
            </MuiLink>
          </Typography>
        </CardContent>
      </Card>

      <TwoFactorDialog
        open={requires2FA}
        onClose={() => setRequires2FA(false)}
        onVerify={handle2FAVerify}
        error={twoFactorError}
      />
    </Box>
  );
}
