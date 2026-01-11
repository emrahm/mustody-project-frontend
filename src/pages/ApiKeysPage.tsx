import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Key,
  Delete,
  ContentCopy,
  Security,
  Code,
  PowerSettingsNew,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DashboardLayout from '@/components/DashboardLayout';
import { apiKeyAPI } from '@/lib/api';
import { Link } from 'wouter';

const schema = yup.object({
  name: yup.string().required('API key name is required'),
  authType: yup.string().required('Authentication type is required'),
  publicKey: yup.string().when('authType', {
    is: 'rsa',
    then: (schema) => schema.required('Public key is required for RSA authentication'),
    otherwise: (schema) => schema.notRequired(),
  }),
  expiresIn: yup.string().required('Expiration is required'),
});

type FormData = {
  name: string;
  authType: 'hmac' | 'rsa';
  publicKey?: string;
  expiresIn: string;
};

interface ApiKey {
  id: string;
  name: string;
  keyId: string;
  authType: 'hmac' | 'rsa';
  secret?: string;
  publicKey?: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [open, setOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{secret?: string; keyId: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'disable';
    apiKey: ApiKey | null;
  }>({ open: false, type: 'delete', apiKey: null });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      authType: 'hmac',
      publicKey: '',
      expiresIn: '',
    },
  });

  const watchAuthType = watch('authType');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await apiKeyAPI.getApiKeys();
      const apiKeysData = response?.data?.data || response?.data || [];
      setApiKeys(Array.isArray(apiKeysData) ? apiKeysData : []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setApiKeys([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const expiresAt = data.expiresIn === 'never' ? null : new Date(Date.now() + parseInt(data.expiresIn) * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await apiKeyAPI.createApiKey(
        data.name, 
        [], // permissions - empty for now
        expiresAt,
        data.authType,
        data.authType === 'rsa' ? data.publicKey : undefined
      );
      
      setGeneratedKey({
        keyId: response.data.keyId,
        secret: data.authType === 'hmac' ? response.data.secret : undefined,
      });
      
      await loadApiKeys();
      reset();
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (apiKey: ApiKey) => {
    setConfirmDialog({
      open: true,
      type: 'disable',
      apiKey
    });
  };

  const handleDelete = async (apiKey: ApiKey) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      apiKey
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.apiKey) return;
    
    try {
      if (confirmDialog.type === 'delete') {
        await apiKeyAPI.deleteApiKey(confirmDialog.apiKey.id);
      } else {
        await apiKeyAPI.toggleApiKey(confirmDialog.apiKey.id, !confirmDialog.apiKey.isActive);
      }
      await loadApiKeys();
      setConfirmDialog({ open: false, type: 'delete', apiKey: null });
    } catch (error) {
      console.error(`Error ${confirmDialog.type === 'delete' ? 'deleting' : 'toggling'} API key:`, error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setGeneratedKey(null);
    reset();
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/api-docs">
              <Button variant="outlined" startIcon={<Code />}>
                View Documentation
              </Button>
            </Link>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpen(true)}
              size="large"
            >
              Create API Key
            </Button>
          </Box>
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
                      {apiKeys.filter(k => k.isActive).length}
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
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'info.light', color: 'white' }}>
                    <Code />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.authType === 'hmac').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      HMAC Keys
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
                    <Security />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.authType === 'rsa').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      RSA Keys
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
                    <TableCell>Key ID</TableCell>
                    <TableCell>Auth Type</TableCell>
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
                            {apiKey.keyId}
                          </Typography>
                          <Tooltip title="Copy key ID">
                            <IconButton size="small" onClick={() => copyToClipboard(apiKey.keyId)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={apiKey.authType.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color={apiKey.authType === 'hmac' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={apiKey.isActive ? 'Active' : 'Disabled'}
                          size="small"
                          color={getStatusColor(apiKey.isActive) as any}
                        />
                      </TableCell>
                      <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>{apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={apiKey.isActive ? 'Disable' : 'Enable'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleActive(apiKey)}
                            color={apiKey.isActive ? 'warning' : 'success'}
                          >
                            <PowerSettingsNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(apiKey)}
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
        <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create New API Key</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              {generatedKey && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.dark' }}>
                    🎉 API Key Created Successfully!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Please copy these credentials now. The secret will not be shown again for security reasons.
                  </Typography>
                  
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: '80px' }}>
                        Key ID:
                      </Typography>
                      <TextField
                        value={generatedKey.keyId}
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputProps={{
                          readOnly: true,
                          style: { fontFamily: 'monospace', fontSize: '0.875rem' }
                        }}
                      />
                      <IconButton size="small" onClick={() => copyToClipboard(generatedKey.keyId)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {generatedKey.secret && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: '80px' }}>
                          Secret:
                        </Typography>
                        <TextField
                          value={generatedKey.secret}
                          variant="outlined"
                          size="small"
                          fullWidth
                          InputProps={{
                            readOnly: true,
                            style: { fontFamily: 'monospace', fontSize: '0.875rem' }
                          }}
                        />
                        <IconButton size="small" onClick={() => copyToClipboard(generatedKey.secret!)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚠️ {generatedKey.secret 
                        ? 'Store your secret securely! You won\'t be able to see it again after closing this dialog.'
                        : 'Your RSA key has been registered. Use your private key for signing requests.'
                      }
                    </Typography>
                  </Alert>
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
                name="authType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.authType}>
                    <InputLabel>Authentication Type</InputLabel>
                    <Select {...field} label="Authentication Type">
                      <MenuItem value="hmac">HMAC-SHA256</MenuItem>
                      <MenuItem value="rsa">RSA-SHA256</MenuItem>
                    </Select>
                    {errors.authType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.authType.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {watchAuthType === 'rsa' && (
                <Controller
                  name="publicKey"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Public Key"
                      fullWidth
                      multiline
                      rows={6}
                      sx={{ mb: 3 }}
                      error={!!errors.publicKey}
                      helperText={errors.publicKey?.message || 'Paste your RSA public key in PEM format'}
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                    />
                  )}
                />
              )}

              <Controller
                name="expiresIn"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.expiresIn}>
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
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: 'delete', apiKey: null })}>
          <DialogTitle>
            {confirmDialog.type === 'delete' ? 'Delete API Key' : 
             confirmDialog.apiKey?.isActive ? 'Disable API Key' : 'Enable API Key'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {confirmDialog.type === 'delete' 
                ? `Are you sure you want to delete the API key "${confirmDialog.apiKey?.name}"? This action cannot be undone and will immediately revoke access for any applications using this key.`
                : confirmDialog.apiKey?.isActive 
                  ? `Are you sure you want to disable the API key "${confirmDialog.apiKey?.name}"? Applications using this key will lose access until it's re-enabled.`
                  : `Are you sure you want to enable the API key "${confirmDialog.apiKey?.name}"?`
              }
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false, type: 'delete', apiKey: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction} 
              color={confirmDialog.type === 'delete' ? 'error' : 'primary'}
              variant="contained"
            >
              {confirmDialog.type === 'delete' ? 'Delete' : 
               confirmDialog.apiKey?.isActive ? 'Disable' : 'Enable'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
