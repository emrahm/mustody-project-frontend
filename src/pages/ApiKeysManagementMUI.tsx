import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Key,
  Visibility,
  Delete,
  Edit,
  ContentCopy,
  Security,
  Schedule,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DashboardLayout from '@/components/DashboardLayout';

const schema = yup.object({
  name: yup.string().required('API key name is required'),
  appType: yup.string().required('App type is required'),
  expiresIn: yup.string().required('Expiration is required'),
});

type FormData = yup.InferType<typeof schema>;

const mockApiKeys = [
  {
    id: '1',
    name: 'Production API',
    keyPrefix: 'mk_live_abc123',
    appType: 'read_write',
    createdAt: '2024-01-15',
    lastUsedAt: '2024-01-20',
    expiresAt: '2024-12-31',
    status: 'active',
  },
  {
    id: '2',
    name: 'Development API',
    keyPrefix: 'mk_test_def456',
    appType: 'read_only',
    createdAt: '2024-01-10',
    lastUsedAt: '2024-01-19',
    expiresAt: null,
    status: 'active',
  },
];

export default function ApiKeysManagement() {
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [open, setOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      appType: '',
      expiresIn: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newKey = `mk_live_${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedKey(newKey);
      
      const newApiKey = {
        id: Date.now().toString(),
        name: data.name,
        keyPrefix: newKey.substring(0, 12) + '...',
        appType: data.appType,
        createdAt: new Date().toISOString().split('T')[0],
        lastUsedAt: null,
        expiresAt: data.expiresIn === 'never' ? null : new Date(Date.now() + parseInt(data.expiresIn) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      };
      
      setApiKeys(prev => [...prev, newApiKey]);
      reset();
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'revoked': return 'default';
      default: return 'default';
    }
  };

  const getAppTypeLabel = (type: string) => {
    switch (type) {
      case 'read_only': return 'Read Only';
      case 'read_write': return 'Read/Write';
      case 'admin': return 'Admin';
      default: return type;
    }
  };

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              API Keys Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your API keys for programmatic access to Mustody services
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            size="large"
          >
            Create API Key
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'primary.light', color: 'white' }}>
                    <Key />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'success.light', color: 'white' }}>
                    <Security />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'warning.light', color: 'white' }}>
                    <Schedule />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.expiresAt && new Date(k.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expiring Soon
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* API Keys Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              API Keys
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Key Prefix</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="600">
                          {apiKey.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontFamily="monospace">
                            {apiKey.keyPrefix}
                          </Typography>
                          <Tooltip title="Copy key prefix">
                            <IconButton size="small" onClick={() => copyToClipboard(apiKey.keyPrefix)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getAppTypeLabel(apiKey.appType)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={apiKey.status}
                          size="small"
                          color={getStatusColor(apiKey.status) as any}
                        />
                      </TableCell>
                      <TableCell>{apiKey.createdAt}</TableCell>
                      <TableCell>{apiKey.lastUsedAt || 'Never'}</TableCell>
                      <TableCell>{apiKey.expiresAt || 'Never'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View details">
                          <IconButton size="small">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(apiKey.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create API Key Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New API Key</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              {generatedKey && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    API Key Created Successfully!
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1 }}>
                      {generatedKey}
                    </Typography>
                    <IconButton size="small" onClick={() => copyToClipboard(generatedKey)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </Typography>
                </Alert>
              )}

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="API Key Name"
                    fullWidth
                    sx={{ mb: 3 }}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Production API, Development API"
                  />
                )}
              />

              <Controller
                name="appType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.appType}>
                    <InputLabel>App Type</InputLabel>
                    <Select {...field} label="App Type">
                      <MenuItem value="read_only">Read Only</MenuItem>
                      <MenuItem value="read_write">Read/Write</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                    {errors.appType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.appType.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="expiresIn"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.expiresIn}>
                    <InputLabel>Expires In</InputLabel>
                    <Select {...field} label="Expires In">
                      <MenuItem value="30">30 days</MenuItem>
                      <MenuItem value="90">90 days</MenuItem>
                      <MenuItem value="365">1 year</MenuItem>
                      <MenuItem value="never">Never</MenuItem>
                    </Select>
                    {errors.expiresIn && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.expiresIn.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
