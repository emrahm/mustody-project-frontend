import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Security,
  VpnKey,
  Smartphone,
  Google,
  Shield,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function AccountSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    two_factor_enabled: false,
    email_notifications: true,
    sms_notifications: false,
    login_alerts: true,
  });
  const [twoFADialog, setTwoFADialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchAccountSettings();
  }, []);

  const fetchAccountSettings = async () => {
    try {
      const response = await api.get('/account/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch account settings:', error);
    }
  };

  const handleSettingsUpdate = async (key, value) => {
    setLoading(true);
    try {
      await api.put('/account/settings', { [key]: value });
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/account/2fa/enable');
      setQrCode(response.data.qr_code);
      setTwoFADialog(true);
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      alert('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    try {
      await api.post('/account/2fa/verify', { code: verificationCode });
      setSettings({ ...settings, two_factor_enabled: true });
      setTwoFADialog(false);
      setVerificationCode('');
      alert('2FA enabled successfully');
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      alert('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    
    setLoading(true);
    try {
      await api.post('/account/2fa/disable');
      setSettings({ ...settings, two_factor_enabled: false });
      alert('2FA disabled successfully');
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      alert('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await api.put('/account/password', passwordData);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await api.get('/auth/google/url');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
      alert('Failed to connect Google account');
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Account Settings</Typography>
        
        <Grid container spacing={3}>
          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom startIcon={<Security />}>
                  Security Settings
                </Typography>
                
                {/* 2FA Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">Two-Factor Authentication</Typography>
                    <Chip
                      label={settings.two_factor_enabled ? 'Enabled' : 'Disabled'}
                      color={settings.two_factor_enabled ? 'success' : 'error'}
                      size="small"
                      icon={settings.two_factor_enabled ? <CheckCircle /> : <Warning />}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add an extra layer of security to your account with 2FA
                  </Typography>
                  
                  {!settings.two_factor_enabled ? (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Smartphone />}
                      onClick={handleEnable2FA}
                      disabled={loading}
                    >
                      Enable 2FA
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDisable2FA}
                      disabled={loading}
                    >
                      Disable 2FA
                    </Button>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Google Authentication */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Google Authentication</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Link your Google account for easier sign-in
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Google />}
                    onClick={handleGoogleAuth}
                    sx={{ color: '#4285f4', borderColor: '#4285f4' }}
                  >
                    Connect Google Account
                  </Button>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Password Change */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Change Password</Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      />
                    </Grid>
                  </Grid>
                  
                  <Button
                    variant="contained"
                    onClick={handlePasswordChange}
                    disabled={loading || !passwordData.current_password || !passwordData.new_password}
                    sx={{ mt: 2 }}
                    startIcon={<VpnKey />}
                  >
                    Change Password
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email_notifications}
                      onChange={(e) => handleSettingsUpdate('email_notifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.sms_notifications}
                      onChange={(e) => handleSettingsUpdate('sms_notifications', e.target.checked)}
                    />
                  }
                  label="SMS Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.login_alerts}
                      onChange={(e) => handleSettingsUpdate('login_alerts', e.target.checked)}
                    />
                  }
                  label="Login Alerts"
                />
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  We recommend keeping login alerts enabled for security
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 2FA Setup Dialog */}
        <Dialog open={twoFADialog} onClose={() => setTwoFADialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              1. Install Google Authenticator or similar app on your phone
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              2. Scan this QR code with your authenticator app
            </Typography>
            
            {qrCode && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img src={qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
              </Box>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              3. Enter the 6-digit code from your app
            </Typography>
            
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTwoFADialog(false)}>Cancel</Button>
            <Button
              onClick={handleVerify2FA}
              variant="contained"
              disabled={verificationCode.length !== 6 || loading}
            >
              Verify & Enable
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
