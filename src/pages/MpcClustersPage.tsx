import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel,
} from '@mui/material';
import { Edit, PauseCircle, Refresh, Hub, UploadFile, VpnKey } from '@mui/icons-material';
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
  secret_provider: string;
  secret_ref: string; // always "**" from backend
  tls_cert_file: string | null;
  tls_key_file: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MpcClustersPage() {
  const { hasGlobalRole, user } = useAuth();
  const isAdmin = hasGlobalRole('admin') || hasGlobalRole('owner');
  const isTenantAdmin = !isAdmin && (user?.members?.some((m) => m.role === 'tenant_admin') ?? false);

  const adminBase = '/admin/mpc-clusters';
  const tenantBase = '/tenant/mpc-clusters';

  const [clusters, setClusters] = useState<MPCCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit dialog (admin only)
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MPCCluster | null>(null);
  const [editForm, setEditForm] = useState({ name: '', grpc_addr: '', node_id: '', is_active: true, secret: '' });
  const [editError, setEditError] = useState<string | null>(null);

  // TLS upload dialog (admin + tenant_admin)
  const [tlsOpen, setTlsOpen] = useState(false);
  const [tlsTarget, setTlsTarget] = useState<MPCCluster | null>(null);
  const [tlsCert, setTlsCert] = useState<File | null>(null);
  const [tlsKey, setTlsKey] = useState<File | null>(null);
  const [tlsError, setTlsError] = useState<string | null>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  // Secret rotation dialog (tenant_admin + admin via edit)
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretTarget, setSecretTarget] = useState<MPCCluster | null>(null);
  const [secretValue, setSecretValue] = useState('');
  const [secretError, setSecretError] = useState<string | null>(null);

  // Confirm deactivate
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<MPCCluster | null>(null);

  // Create cluster (tenant_admin)
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', grpc_addr: '', node_id: '', secret_ref: '' });
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = isAdmin ? adminBase : tenantBase;
      const res = await api.get<{ clusters: MPCCluster[] }>(base);
      setClusters(res.data.clusters ?? []);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to load clusters');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  // ── Expiry helpers ───────────────────────────────────────────────────────────

  const daysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  };

  const expiryChip = (cluster: MPCCluster) => {
    const days = daysUntil(cluster.expires_at);
    if (days === null) return <Typography variant="caption" color="text.secondary">—</Typography>;
    if (days <= 0) return <Chip label="Expired" color="error" size="small" />;
    if (days <= 14) return <Chip label={`${days}d left`} color="warning" size="small" />;
    return <Typography variant="caption">{new Date(cluster.expires_at!).toLocaleDateString()}</Typography>;
  };

  // ── Edit (admin) ─────────────────────────────────────────────────────────────

  const openEdit = (c: MPCCluster) => {
    setEditTarget(c);
    setEditForm({ name: c.name, grpc_addr: c.grpc_addr, node_id: c.node_id, is_active: c.is_active, secret: '' });
    setEditError(null);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setEditError(null);
    try {
      const body: any = {
        name: editForm.name,
        grpc_addr: editForm.grpc_addr,
        node_id: editForm.node_id,
        is_active: editForm.is_active,
      };
      if (editForm.secret) body.secret = editForm.secret;
      await api.put(`${adminBase}/${editTarget.id}`, body);
      setEditOpen(false);
      fetchClusters();
    } catch (e: any) {
      setEditError(e.response?.data?.error ?? 'Save failed');
    }
  };

  // ── TLS Upload (admin + tenant_admin) ────────────────────────────────────────

  const openTLS = (c: MPCCluster) => {
    setTlsTarget(c);
    setTlsCert(null);
    setTlsKey(null);
    setTlsError(null);
    setTlsOpen(true);
  };

  const submitTLS = async () => {
    if (!tlsTarget || !tlsCert || !tlsKey) return;
    setTlsError(null);
    setActionLoading(tlsTarget.id + '_tls');
    try {
      const fd = new FormData();
      fd.append('cert', tlsCert);
      fd.append('key', tlsKey);
      const base = isAdmin ? adminBase : tenantBase;
      await api.post(`${base}/${tlsTarget.id}/upload-tls`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTlsOpen(false);
      fetchClusters();
    } catch (e: any) {
      setTlsError(e.response?.data?.error ?? 'Upload failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Secret Rotation (tenant_admin) ───────────────────────────────────────────

  const openSecret = (c: MPCCluster) => {
    setSecretTarget(c);
    setSecretValue('');
    setSecretError(null);
    setSecretOpen(true);
  };

  const submitSecret = async () => {
    if (!secretTarget || !secretValue) return;
    setSecretError(null);
    setActionLoading(secretTarget.id + '_secret');
    try {
      await api.post(`${tenantBase}/${secretTarget.id}/rotate-secret`, { secret: secretValue });
      setSecretOpen(false);
      fetchClusters();
    } catch (e: any) {
      setSecretError(e.response?.data?.error ?? 'Rotation failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Deactivate (admin) ───────────────────────────────────────────────────────

  const submitDeactivate = async () => {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    setActionLoading(confirmTarget.id + '_deactivate');
    try {
      await api.post(`${adminBase}/${confirmTarget.id}/deactivate`);
      fetchClusters();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Deactivate failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Create (tenant_admin) ────────────────────────────────────────────────────

  const submitCreate = async () => {
    setCreateError(null);
    try {
      await api.post(tenantBase, createForm);
      setCreateOpen(false);
      setCreateForm({ name: '', grpc_addr: '', node_id: '', secret_ref: '' });
      fetchClusters();
    } catch (e: any) {
      setCreateError(e.response?.data?.error ?? 'Create failed');
    }
  };

  // ── Guard ────────────────────────────────────────────────────────────────────

  if (!isAdmin && !isTenantAdmin) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}><Alert severity="error">Access denied.</Alert></Box>
      </DashboardLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
            {isTenantAdmin && (
              <Button variant="contained" size="small" onClick={() => { setCreateError(null); setCreateOpen(true); }}>
                Add Cluster
              </Button>
            )}
            <Tooltip title="Refresh">
              <IconButton onClick={fetchClusters} disabled={loading}><Refresh /></IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {isTenantAdmin && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You can upload TLS certificates and rotate the secret key for your cluster.
            Certificate expiry date is read automatically from the uploaded file.
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : clusters.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600}>Shared MPC Cluster Active</Typography>
                  <Typography variant="body2">
                    Your tenant is currently using Mustody's shared MPC infrastructure. Wallet creation and signing are fully operational.
                    You can optionally add a dedicated cluster for full isolation and control.
                  </Typography>
                </Alert>
                <Button variant="outlined" size="small" onClick={() => { setCreateError(null); setCreateOpen(true); }}>
                  Add Dedicated Cluster
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
                      <TableCell>Secret</TableCell>
                      <TableCell>TLS</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Cert Expires</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clusters.map(c => (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{c.name}</Typography>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {c.tenant_id ?? <em>shared</em>}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">{c.grpc_addr}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">{c.node_id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                            {c.secret_ref || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {c.tls_cert_file
                            ? <Chip label="Uploaded" color="success" size="small" />
                            : <Chip label="None" size="small" variant="outlined" />}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.is_active ? 'Active' : 'Inactive'}
                            color={c.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{expiryChip(c)}</TableCell>
                        <TableCell align="right">
                          {/* Admin: edit cluster fields */}
                          {isAdmin && (
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {/* Both: upload TLS */}
                          <Tooltip title="Upload TLS Certificate & Key">
                            <IconButton size="small" color="primary" onClick={() => openTLS(c)}>
                              <UploadFile fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* Tenant admin: rotate secret */}
                          {isTenantAdmin && (
                            <Tooltip title="Rotate Secret Key">
                              <span>
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  disabled={actionLoading === c.id + '_secret'}
                                  onClick={() => openSecret(c)}
                                >
                                  {actionLoading === c.id + '_secret'
                                    ? <CircularProgress size={16} />
                                    : <VpnKey fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {/* Admin: deactivate */}
                          {isAdmin && c.is_active && (
                            <Tooltip title="Deactivate">
                              <span>
                                <IconButton
                                  size="small"
                                  color="warning"
                                  disabled={actionLoading === c.id + '_deactivate'}
                                  onClick={() => { setConfirmTarget(c); setConfirmOpen(true); }}
                                >
                                  {actionLoading === c.id + '_deactivate'
                                    ? <CircularProgress size={16} />
                                    : <PauseCircle fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Edit Dialog (admin) ── */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Cluster</DialogTitle>
          <DialogContent dividers>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Name" value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} fullWidth />
              <TextField label="gRPC Address" value={editForm.grpc_addr}
                onChange={e => setEditForm(f => ({ ...f, grpc_addr: e.target.value }))} fullWidth />
              <TextField label="Node ID" value={editForm.node_id}
                onChange={e => setEditForm(f => ({ ...f, node_id: e.target.value }))} fullWidth />
              <TextField
                label="New Secret (leave blank to keep current)"
                type="password"
                value={editForm.secret}
                onChange={e => setEditForm(f => ({ ...f, secret: e.target.value }))}
                helperText="If provided, saved to HashiCorp Vault under GRPC_CLUSTER_SECRET_<tenantID>"
                fullWidth
              />
              <FormControlLabel
                control={<Switch checked={editForm.is_active}
                  onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} />}
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={submitEdit}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* ── TLS Upload Dialog (admin + tenant_admin) ── */}
        <Dialog open={tlsOpen} onClose={() => setTlsOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Upload TLS Certificate & Key</DialogTitle>
          <DialogContent dividers>
            {tlsError && <Alert severity="error" sx={{ mb: 2 }}>{tlsError}</Alert>}
            <Alert severity="info" sx={{ mb: 2 }}>
              The certificate's expiry date will be read automatically and set as the cluster's expiry.
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">TLS Certificate (.crt / .pem)</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <input ref={certRef} type="file" accept=".crt,.pem,.cer"
                    style={{ display: 'none' }}
                    onChange={e => setTlsCert(e.target.files?.[0] ?? null)} />
                  <Button variant="outlined" size="small" onClick={() => certRef.current?.click()}>
                    {tlsCert ? tlsCert.name : 'Choose cert file'}
                  </Button>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">TLS Key (.key / .pem)</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <input ref={keyRef} type="file" accept=".key,.pem"
                    style={{ display: 'none' }}
                    onChange={e => setTlsKey(e.target.files?.[0] ?? null)} />
                  <Button variant="outlined" size="small" onClick={() => keyRef.current?.click()}>
                    {tlsKey ? tlsKey.name : 'Choose key file'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTlsOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!tlsCert || !tlsKey || actionLoading === tlsTarget?.id + '_tls'}
              onClick={submitTLS}
            >
              {actionLoading === tlsTarget?.id + '_tls' ? <CircularProgress size={20} /> : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Secret Rotation Dialog (tenant_admin) ── */}
        <Dialog open={secretOpen} onClose={() => setSecretOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Rotate Secret Key</DialogTitle>
          <DialogContent dividers>
            {secretError && <Alert severity="error" sx={{ mb: 2 }}>{secretError}</Alert>}
            <Alert severity="warning" sx={{ mb: 2 }}>
              The new secret will be saved to HashiCorp Vault. The cluster connection will be re-established immediately.
            </Alert>
            <TextField
              label="New Secret"
              type="password"
              value={secretValue}
              onChange={e => setSecretValue(e.target.value)}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSecretOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              disabled={!secretValue || actionLoading === secretTarget?.id + '_secret'}
              onClick={submitSecret}
            >
              {actionLoading === secretTarget?.id + '_secret' ? <CircularProgress size={20} /> : 'Rotate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Deactivate Confirm (admin) ── */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Deactivate Cluster</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Deactivating <strong>{confirmTarget?.name}</strong> will mark it inactive and fail all
              pending MPC wallet requests for this tenant. Continue?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={submitDeactivate}>Deactivate</Button>
          </DialogActions>
        </Dialog>

        {/* ── Create Cluster (tenant_admin) ── */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add MPC Cluster</DialogTitle>
          <DialogContent dividers>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>Setup Requirements:</Typography>
              <Typography variant="body2" component="div">
                1. Install <strong>mustody-project-round</strong> MPC node on your infrastructure<br/>
                2. Install <strong>HashiCorp Vault</strong> server for secret management<br/>
                3. Configure the MPC node to allow backend access (gRPC endpoint)<br/>
                4. Set environment variable <code>GRPC_CLUSTER_SECRET_&lt;tenant_id&gt;</code> with your shared secret<br/>
                5. Ensure the node is accessible from this backend system
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Cluster Name" value={createForm.name} required
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} fullWidth />
              <TextField label="gRPC Address" placeholder="node.example.com:50051" value={createForm.grpc_addr} required
                onChange={e => setCreateForm(f => ({ ...f, grpc_addr: e.target.value }))} fullWidth />
              <TextField label="Node ID" placeholder="node-1" value={createForm.node_id} required
                onChange={e => setCreateForm(f => ({ ...f, node_id: e.target.value }))} fullWidth />
              <TextField label="Secret Reference" placeholder="GRPC_CLUSTER_SECRET_<tenant_id>" value={createForm.secret_ref}
                onChange={e => setCreateForm(f => ({ ...f, secret_ref: e.target.value }))}
                helperText="Environment variable name containing the shared secret (defaults to env provider)"
                fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={submitCreate}
              disabled={!createForm.name || !createForm.grpc_addr || !createForm.node_id}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
