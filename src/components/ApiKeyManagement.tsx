import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Switch,
  FormControlLabel,
  Container,
  Fade,
  useTheme,
  alpha,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Key,
  Visibility,
  VisibilityOff,
  ContentCopy,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { apiKeyAPI } from '@/lib/api';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export default function ApiKeyManagement() {
  const { hasRole, user } = useAuth();
  const theme = useTheme();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState<{ [key: number]: boolean }>({});

  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    expires_at: '',
  });

  const availablePermissions = [
    'read:payments',
    'write:payments',
    'read:users',
    'write:users',
    'read:analytics',
    'admin:all',
  ];

  // Check if user has tenant admin role
  if (!hasRole('tenant_admin')) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Only tenant administrators can manage API keys.
        </Alert>
      </Container>
    );
  }

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeyAPI.getApiKeys();
      setApiKeys(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      setLoading(true);
      const response = await apiKeyAPI.createApiKey(
        formData.name,
        formData.permissions,
        formData.expires_at || undefined
      );
      setNewApiKey(response.data.key);
      fetchApiKeys();
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!editingKey) return;
    
    try {
      setLoading(true);
      await apiKeyAPI.updateApiKey(editingKey.id, formData.name, formData.permissions);
      fetchApiKeys();
      setOpenDialog(false);
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    
    try {
      await apiKeyAPI.deleteApiKey(id);
      fetchApiKeys();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete API key');
    }
  };

  const handleToggleApiKey = async (id: number, isActive: boolean) => {
    try {
      await apiKeyAPI.toggleApiKey(id, !isActive);
      fetchApiKeys();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to toggle API key');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      permissions: [],
      expires_at: '',
    });
    setEditingKey(null);
  };

  const openEditDialog = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    setFormData({
      name: apiKey.name,
      permissions: apiKey.permissions,
      expires_at: apiKey.expires_at || '',
    });
    setOpenDialog(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleShowKey = (id: number) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight="600"
            sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            API Key Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage API keys for tenant: {user?.tenant_name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          Create API Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {newApiKey && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <IconButton onClick={() => copyToClipboard(newApiKey)}>
              <ContentCopy />
            </IconButton>
          }
          onClose={() => setNewApiKey('')}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            API Key created successfully! Copy it now - you won't see it again:
          </Typography>
          <Typography variant="code" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {newApiKey}
          </Typography>
        </Alert>
      )}

      <Fade in timeout={500}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ background: theme.palette.primary.main }}>
                          <Key />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="500">
                            {apiKey.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {apiKey.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {showKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </Typography>
                        <IconButton size="small" onClick={() => toggleShowKey(apiKey.id)}>
                          {showKey[apiKey.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <IconButton size="small" onClick={() => copyToClipboard(apiKey.key)}>
                          <ContentCopy />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {apiKey.permissions.slice(0, 2).map(permission => (
                          <Chip 
                            key={permission} 
                            label={permission} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                        {apiKey.permissions.length > 2 && (
                          <Chip 
                            label={`+${apiKey.permissions.length - 2}`} 
                            size="small" 
                            sx={{ background: alpha(theme.palette.info.main, 0.1) }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={apiKey.is_active ? <CheckCircle /> : <Cancel />}
                        label={apiKey.is_active ? 'Active' : 'Inactive'} 
                        color={apiKey.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(apiKey.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Switch
                          checked={apiKey.is_active}
                          onChange={() => handleToggleApiKey(apiKey.id, apiKey.is_active)}
                          size="small"
                        />
                        <IconButton 
                          onClick={() => openEditDialog(apiKey)}
                          size="small"
                          sx={{ color: theme.palette.info.main }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          size="small"
                          sx={{ color: theme.palette.error.main }}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Fade>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingKey ? 'Edit API Key' : 'Create API Key'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Permissions</InputLabel>
                <Select
                  multiple
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availablePermissions.map((permission) => (
                    <MenuItem key={permission} value={permission}>
                      {permission}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!editingKey && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Expires At (Optional)"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingKey ? handleUpdateApiKey : handleCreateApiKey}
            variant="contained"
            disabled={loading}
          >
            {editingKey ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
