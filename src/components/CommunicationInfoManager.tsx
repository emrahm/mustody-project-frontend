import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add,
  Phone,
  Email,
  Sms,
  Edit,
  Delete,
  Verified,
} from '@mui/icons-material';
import PhoneInput, { validatePhoneNumber } from '@/components/PhoneInput';
import { api } from '@/lib/api';

const communicationTypes = [
  { value: 'phone', label: 'Phone', icon: <Phone /> },
  { value: 'sms', label: 'SMS', icon: <Sms /> },
  { value: 'email', label: 'Email', icon: <Email /> },
];

const communicationCategories = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' },
  { value: 'business', label: 'Business' },
];

export default function CommunicationInfoManager() {
  const [communicationInfo, setCommunicationInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'phone',
    category: 'personal',
    value: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCommunicationInfo();
  }, []);

  const fetchCommunicationInfo = async () => {
    try {
      const response = await api.get('/profile/communication');
      setCommunicationInfo(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch communication info:', error);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validate phone number if type is phone or sms
    if ((formData.type === 'phone' || formData.type === 'sms') && formData.value) {
      const validation = validatePhoneNumber(formData.value);
      if (!validation.isValid) {
        setError(validation.message);
        return;
      }
    }

    // Validate email
    if (formData.type === 'email' && formData.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.value)) {
        setError('Invalid email format');
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/profile/communication', formData);
      setDialogOpen(false);
      setFormData({ type: 'phone', category: 'personal', value: '' });
      fetchCommunicationInfo();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save communication info');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const typeObj = communicationTypes.find(t => t.value === type);
    return typeObj?.icon || <Phone />;
  };

  const getTypeLabel = (type) => {
    const typeObj = communicationTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const getCategoryLabel = (category) => {
    const categoryObj = communicationCategories.find(c => c.value === category);
    return categoryObj?.label || category;
  };

  const groupedInfo = communicationInfo.reduce((acc, info) => {
    if (!acc[info.type]) acc[info.type] = [];
    acc[info.type].push(info);
    return acc;
  }, {});

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Communication Information</Typography>

        {Object.keys(groupedInfo).length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No communication information added yet. Click "Add Contact Info" to get started.
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {Object.entries(groupedInfo).map(([type, infos]) => (
              <Box key={type} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2, fontWeight: 600 }}>
                  {getTypeIcon(type)}
                  <Box sx={{ ml: 1 }}>{getTypeLabel(type)}</Box>
                </Typography>
                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {infos.map((info, index) => (
                    <ListItem key={info.id} divider={index < infos.length - 1}>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {info.value}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip size="small" label={getCategoryLabel(info.category)} variant="outlined" />
                            {info.is_verified && (
                              <Chip
                                size="small"
                                icon={<Verified />}
                                label="Verified"
                                color="success"
                                variant="filled"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            size="medium"
          >
            Add Contact Info
          </Button>
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Communication Information</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {communicationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {type.icon}
                        <Box sx={{ ml: 1 }}>{type.label}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {communicationCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                {formData.type === 'phone' || formData.type === 'sms' ? (
                  <PhoneInput
                    value={formData.value}
                    onChange={(value) => setFormData({ ...formData, value })}
                    error={!!error}
                    helperText={error}
                    label={`${getTypeLabel(formData.type)} Number`}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={getTypeLabel(formData.type)}
                    type={formData.type === 'email' ? 'email' : 'text'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    error={!!error}
                    helperText={error}
                  />
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !formData.value}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
