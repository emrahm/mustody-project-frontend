import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import { Building, User, MessageSquare, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface TenantRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function TenantRequestDialog({ open, onClose }: TenantRequestDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUserProfile();
    }
  }, [open]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile');
      setUserProfile(response.data);
      
      const kycVerified = response.data.kyc_status === 'verified';
      const twoFAEnabled = response.data.two_factor_enabled === true;
      setCanSubmit(kycVerified && twoFAEnabled);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      setError('Please complete KYC verification and enable 2FA before submitting tenant request.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/tenant-request', formData);
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', company: '', purpose: '' });
    setSuccess(false);
    setError('');
    onClose();
  };

  if (success) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', color: 'success.main' }}>
          Request Submitted
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Your request has been received. We'll get back to you soon.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" fullWidth>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Building size={20} />
          Tenant Application
        </Box>
        <Typography variant="body2" color="text.secondary">
          Request a tenant account for API key management
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Requirements Status:
          </Typography>
          
          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              {userProfile?.kyc_status === 'verified' ? (
                <CheckCircle size={16} color="#4caf50" />
              ) : (
                <AlertTriangle size={16} color="#f44336" />
              )}
              <Chip
                label={`KYC ${userProfile?.kyc_status === 'verified' ? 'Completed' : 'Required'}`}
                color={userProfile?.kyc_status === 'verified' ? 'success' : 'error'}
                size="small"
              />
              {userProfile?.kyc_status !== 'verified' && (
                <Button size="small" variant="text" href="/profile">
                  Complete
                </Button>
              )}
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              {userProfile?.two_factor_enabled ? (
                <CheckCircle size={16} color="#4caf50" />
              ) : (
                <AlertTriangle size={16} color="#f44336" />
              )}
              <Chip
                label={`2FA ${userProfile?.two_factor_enabled ? 'Enabled' : 'Required'}`}
                color={userProfile?.two_factor_enabled ? 'success' : 'error'}
                size="small"
              />
              {!userProfile?.two_factor_enabled && (
                <Button size="small" variant="text" href="/settings">
                  Enable
                </Button>
              )}
            </Box>
          </Stack>
        </Box>

        {!canSubmit && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You must complete KYC verification and enable 2FA before submitting a tenant request.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={!canSubmit}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <User size={16} style={{ marginRight: 8, color: '#666' }} />
            }}
          />

          <TextField
            fullWidth
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
            disabled={!canSubmit}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Building size={16} style={{ marginRight: 8, color: '#666' }} />
            }}
          />

          <TextField
            fullWidth
            label="Use Case"
            multiline
            rows={4}
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            required
            disabled={!canSubmit}
            placeholder="How do you plan to use the API?"
            InputProps={{
              startAdornment: <MessageSquare size={16} style={{ marginRight: 8, color: '#666', alignSelf: 'flex-start', marginTop: 12 }} />
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !canSubmit}
        >
          {loading ? 'Submitting...' : canSubmit ? 'Submit Application' : 'Complete Requirements First'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
