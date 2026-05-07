import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PauseCircle,
  Refresh,
  Hub,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MPCCluster {
  id: string;
  tenant_id: string | null;
  name: string;
  grpc_addr: string;
  node_id: string;
  secret_provider: 'env' | 'vault' | 'docker_secret';
  secret_ref: string;
  tls_cert_file: string | null;
  tls_key_file: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
}

const emptyForm = (): Partial<MPCCluster> => ({
  name: '',
  grpc_addr: '',
  node_id: '',
  secret_provider: 'env',
  secret_ref: '',
  tls_cert_file: null,
  tls_key_file: null,
  is_active: true,
  expires_at: null,
  tenant_id: null,
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function MpcClustersPage() {
  const { hasGlobalRole, user } = useAuth();
  const isAdmin = hasGlobalRole('admin') || hasGlobalRole('owner');
  const isTenantAdmin = !isAdmin && (user?.roles?.some((r: any) => r.role === 'tenant_admin') ?? false);

  const apiBase = isAdmin ? '/admin/mpc-clusters' : '/tenant/mpc-clusters';

  const [clusters, setClusters] = useState<MPCCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MPCCluster | null>(null);
  const [form, setForm] = useState<Partial<MPCCluster>>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ open: false, title: '', message: '', action: () => {} });

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ clusters: MPCCluster[] }>(apiBase);
      setClusters(res.data.clusters ?? []);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to load clusters');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (cluster: MPCCluster) => {
    setEditTarget(cluster);
    setForm({ ...cluster });
    setFormError(null);
    setFormOpen(true);
  };

  const handleFormChange = (field: keyof MPCCluster, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async () => {
    setFormError(null);
    try {
      if (editTarget) {
        await api.put(`${apiBase}/${editTarget.id}`, form);
      } else {
        await api.post(apiBase, form);
      }
      setFormOpen(false);
      fetchClusters();
    } catch (e: any) {
      setFormError(e.response?.data?.error ?? 'Save failed');
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const confirmDeactivate = (cluster: MPCCluster) => {
    setConfirmDialog({
      open: true,
      title: 'Deactivate Cluster',
      message: `Deactivating "${cluster.name}" will mark it inactive and fail all pending MPC wallet requests for this tenant. To resume MPC operations, re-activate this cluster or create a new one with the same data source.\n\nContinue?`,
      action: async () => {
        setConfirmDialog(d => ({ ...d, open: false }));
        setActionLoading(cluster.id + '_deactivate');
        try {
          await api.post(`${apiBase}/${cluster.id}/deactivate`);
          fetchClusters();
        } catch (e: any) {
          setError(e.response?.data?.error ?? 'Deactivate failed');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const confirmDelete = (cluster: MPCCluster) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Cluster',
      message: `Permanently deleting "${cluster.name}" will remove the cluster definition and fail all pending MPC wallet requests for this tenant. This cannot be undone.\n\nTo resume MPC operations you must create a new cluster with the same data source.\n\nContinue?`,
      action: async () => {
        setConfirmDialog(d => ({ ...d, open: false }));
        setActionLoading(cluster.id + '_delete');
        try {
          await api.delete(`${apiBase}/${cluster.id}`);
          fetchClusters();
        } catch (e: any) {
          setError(e.response?.data?.error ?? 'Delete failed');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!isAdmin && !isTenantAdmin) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Access denied.</Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hub color="primary" />
            <Typography variant="h5" fontWeight={600}>MPC Clusters</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchClusters} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Cluster
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* Info banner for tenant_admin */}
        {isTenantAdmin && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You are managing MPC clusters for your tenant. Deactivating or deleting a cluster will fail
            all pending wallet requests. To resume, re-activate the cluster or create a new one with the
            same data source.
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : clusters.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Hub sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No MPC clusters defined yet.</Typography>
                <Button variant="outlined" startIcon={<Add />} sx={{ mt: 2 }} onClick={openCreate}>
                  Create First Cluster
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      {isAdmin && <TableCell>Tenant</TableCell>}
                      <TableCell>gRPC Address</TableCell>
                      <TableCell>Node ID</TableCell>
                      <TableCell>Secret Provider</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clusters.map(cluster => (
                      <TableRow key={cluster.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{cluster.name}</Typography>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {cluster.tenant_id ?? <em>shared</em>}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">{cluster.grpc_addr}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">{cluster.node_id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={cluster.secret_provider} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cluster.is_active ? 'Active' : 'Inactive'}
                            color={cluster.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {cluster.expires_at
                              ? new Date(cluster.expires_at).toLocaleDateString()
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(cluster)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {cluster.is_active && (
                            <Tooltip title="Deactivate">
                              <span>
                                <IconButton
                                  size="small"
                                  color="warning"
                                  disabled={actionLoading === cluster.id + '_deactivate'}
                                  onClick={() => confirmDeactivate(cluster)}
                                >
                                  {actionLoading === cluster.id + '_deactivate'
                                    ? <CircularProgress size={16} />
                                    : <PauseCircle fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={actionLoading === cluster.id + '_delete'}
                                onClick={() => confirmDelete(cluster)}
                              >
                                {actionLoading === cluster.id + '_delete'
                                  ? <CircularProgress size={16} />
                                  : <Delete fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit Dialog */}
        <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editTarget ? 'Edit Cluster' : 'New MPC Cluster'}</DialogTitle>
          <DialogContent dividers>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Name"
                value={form.name ?? ''}
                onChange={e => handleFormChange('name', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="gRPC Address"
                value={form.grpc_addr ?? ''}
                onChange={e => handleFormChange('grpc_addr', e.target.value)}
                placeholder="host:50051"
                required
                fullWidth
              />
              <TextField
                label="Node ID"
                value={form.node_id ?? ''}
                onChange={e => handleFormChange('node_id', e.target.value)}
                required
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Secret Provider</InputLabel>
                <Select
                  value={form.secret_provider ?? 'env'}
                  label="Secret Provider"
                  onChange={e => handleFormChange('secret_provider', e.target.value)}
                >
                  <MenuItem value="env">Environment Variable</MenuItem>
                  <MenuItem value="vault">HashiCorp Vault</MenuItem>
                  <MenuItem value="docker_secret">Docker Secret</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Secret Ref"
                value={form.secret_ref ?? ''}
                onChange={e => handleFormChange('secret_ref', e.target.value)}
                helperText={
                  form.secret_provider === 'env'
                    ? 'Env var name, e.g. MPC_CLUSTER_SECRET'
                    : form.secret_provider === 'vault'
                    ? 'Vault path, e.g. secret/mpc/cluster-a'
                    : 'Docker secret file name'
                }
                required
                fullWidth
              />
              <TextField
                label="TLS Cert File (optional)"
                value={form.tls_cert_file ?? ''}
                onChange={e => handleFormChange('tls_cert_file', e.target.value || null)}
                fullWidth
              />
              <TextField
                label="TLS Key File (optional)"
                value={form.tls_key_file ?? ''}
                onChange={e => handleFormChange('tls_key_file', e.target.value || null)}
                fullWidth
              />
              <TextField
                label="Expires At (optional)"
                type="datetime-local"
                value={form.expires_at ? form.expires_at.slice(0, 16) : ''}
                onChange={e => handleFormChange('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active ?? true}
                    onChange={e => handleFormChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleFormSubmit}>
              {editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(d => ({ ...d, open: false }))} maxWidth="xs" fullWidth>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {confirmDialog.message}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(d => ({ ...d, open: false }))}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDialog.action}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
