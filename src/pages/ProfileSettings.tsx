import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  CloudUpload,
  Verified,
  Warning,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    avatar_url: '',
    kyc_status: 'pending',
    kyc_documents: []
  });
  const [kycDialog, setKycDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Set default values from user context
      setProfile({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        company: user?.company || '',
        avatar_url: user?.avatar_url || '',
        kyc_status: user?.kyc_status || 'pending',
        kyc_documents: user?.kyc_documents || []
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile', profile);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleKycUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    
    setLoading(true);
    try {
      await api.post('/profile/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setKycDialog(false);
      setSelectedFile(null);
      fetchProfile();
      alert('KYC document uploaded successfully');
    } catch (error) {
      console.error('Failed to upload KYC document:', error);
      alert('Failed to upload KYC document');
    } finally {
      setLoading(false);
    }
  };

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Profile Settings</Typography>
        
        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company"
                      value={profile.company}
                      onChange={(e) => setProfile({...profile, company: e.target.value})}
                      InputProps={{
                        startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    Save Changes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Profile Picture & KYC */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  src={profile.avatar_url}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {profile.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 3 }}
                >
                  Upload Photo
                </Button>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>KYC Status</Typography>
                <Chip
                  label={profile.kyc_status?.toUpperCase()}
                  color={getKycStatusColor(profile.kyc_status)}
                  icon={profile.kyc_status === 'verified' ? <Verified /> : <Warning />}
                  sx={{ mb: 2 }}
                />
                
                {profile.kyc_status !== 'verified' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => setKycDialog(true)}
                    fullWidth
                  >
                    Upload KYC Documents
                  </Button>
                )}
                
                {profile.kyc_status === 'verified' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Your identity has been verified
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* KYC Upload Dialog */}
        <Dialog open={kycDialog} onClose={() => setKycDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload KYC Documents</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please upload a clear photo of your government-issued ID (passport, driver's license, or national ID card).
            </Typography>
            
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ width: '100%', padding: '10px', border: '1px dashed #ccc', borderRadius: '4px' }}
            />
            
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setKycDialog(false)}>Cancel</Button>
            <Button
              onClick={handleKycUpload}
              variant="contained"
              disabled={!selectedFile || loading}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
