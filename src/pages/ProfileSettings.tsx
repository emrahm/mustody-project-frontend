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
import PhoneInput, { validatePhoneNumber } from '@/components/PhoneInput';
import CommunicationInfoManager from '@/components/CommunicationInfoManager';

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
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Set default values from user context if API fails
      if (user) {
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          company: user.company || '',
          avatar_url: user.avatar_url || '',
          kyc_status: user.kyc_status || 'pending',
          kyc_documents: user.kyc_documents || [],
          two_factor_enabled: user.two_factor_enabled || false
        });
      }
    }
  };

  const handleSave = async () => {
    // Validate phone number before saving
    const phoneValidation = validatePhoneNumber(profile.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
      return;
    }
    setPhoneError('');

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
    if (!selectedFile || selectedFile.length === 0) return;
    
    const formData = new FormData();
    Array.from(selectedFile).forEach((file, index) => {
      formData.append(`document_${index}`, file);
    });
    
    setLoading(true);
    try {
      await api.post('/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setKycDialog(false);
      setSelectedFile(null);
      fetchProfile();
      alert('KYC documents uploaded successfully. Review process will take 1-3 business days.');
    } catch (error) {
      console.error('Failed to upload KYC documents:', error);
      alert('Failed to upload KYC documents');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfile({ ...profile, avatar_url: response.data.avatar_url });
      alert('Avatar uploaded successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar');
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
                    <PhoneInput
                      value={profile.phone}
                      onChange={(phone) => {
                        setProfile({...profile, phone});
                        setPhoneError('');
                      }}
                      error={!!phoneError}
                      helperText={phoneError}
                      label="Phone Number"
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
          
          {/* Communication Information */}
          <Grid item xs={12} md={8}>
            <CommunicationInfoManager />
          </Grid>
          
          {/* Profile Picture & KYC */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  src={profile.avatar_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}${profile.avatar_url}` : ''}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {profile.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 3 }}
                    component="span"
                    disabled={loading}
                  >
                    Upload Photo
                  </Button>
                </label>
                
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
        <Dialog open={kycDialog} onClose={() => setKycDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Complete KYC Verification</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Required Documents for Individual KYC:
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                1. Identity Document (Required)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Passport (preferred) OR National ID Card OR Driver's License
                • Must be government-issued and valid
                • Clear, high-resolution photo showing all details
              </Typography>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                2. Proof of Address (Required)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Utility bill (electricity, water, gas) - max 3 months old
                • Bank statement - max 3 months old
                • Government correspondence - max 3 months old
                • Rental agreement (if recent)
              </Typography>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                3. Selfie with ID (Required)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Clear photo of yourself holding your ID document
                • Both your face and ID must be clearly visible
                • Good lighting, no shadows or glare
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom>
              Additional Requirements for Company/Business:
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                4. Business Registration (Required for Business)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Certificate of Incorporation
                • Business License
                • Tax Registration Certificate
                • Chamber of Commerce Registration
              </Typography>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                5. Company Address Proof (Required for Business)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Business utility bill - max 3 months old
                • Commercial lease agreement
                • Business bank statement with address
                • Official government business correspondence
              </Typography>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                6. Authorized Signatory Documents (Required for Business)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Board resolution authorizing the signatory
                • Power of attorney (if applicable)
                • Authorized signatory's ID and proof of address
                • Company stamp/seal on authorization documents
              </Typography>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                7. Financial Information (Required for Business)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Latest audited financial statements
                • Bank statements (last 6 months)
                • Tax returns (last 2 years)
                • Source of funds declaration
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> All documents must be in original language with certified English translation if not in English. 
                Documents older than 3 months will not be accepted unless specified otherwise.
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> KYC verification and 2FA are mandatory requirements to become a tenant on our platform.
              </Typography>
            </Alert>
            
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => setSelectedFile(e.target.files)}
              style={{ width: '100%', padding: '10px', border: '1px dashed #ccc', borderRadius: '4px' }}
            />
            
            {selectedFile && selectedFile.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Selected files ({selectedFile.length}):
                </Typography>
                {Array.from(selectedFile).map((file, index) => (
                  <Typography key={index} variant="caption" display="block">
                    • {file.name}
                  </Typography>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setKycDialog(false)}>Cancel</Button>
            <Button
              onClick={handleKycUpload}
              variant="contained"
              disabled={!selectedFile || selectedFile.length === 0 || loading}
            >
              Upload Documents
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
