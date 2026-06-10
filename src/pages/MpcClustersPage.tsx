import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  alpha, useTheme, Divider, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Edit, PauseCircle, Refresh, Hub, UploadFile, VpnKey,
  Security, CloudQueue, Lock, CheckCircle, Info,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ApprovalStatus = 'approved' | 'pending' | 'rejected';

interface MPCCluster {
  id: string;
  tenant_id: string | null;
  name: string;
  grpc_addr: string;
  node_id: string;
  secret_provider: string;
  secret_ref: string;
  tls_cert_file: string | null;
  tls_key_file: string | null;
  is_active: boolean;
  approval_status: ApprovalStatus;
  review_notes?: string;
  reviewed_at?: string | null;
  expires_at: string | null;
  created_at: string;
}

interface MPCOverview {
  routing_mode: 'shared' | 'dedicated' | 'pending_review';
  can_configure: boolean;
  active_cluster_name: string;
  pending_cluster?: MPCCluster;
  dedicated_cluster?: MPCCluster;
}

function approvalChip(status: ApprovalStatus) {
  switch (status) {
    case 'pending':
      return <Chip label="Pending review" color="warning" size="small" />;
    case 'rejected':
      return <Chip label="Rejected" color="error" size="small" />;
    default:
      return <Chip label="Approved" color="success" size="small" />;
  }
}

function MpcInfrastructureInfo({ overview, loading }: { overview: MPCOverview | null; loading: boolean }) {
  const theme = useTheme();
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  }

  const mode = overview?.routing_mode ?? 'shared';
  const activeName = overview?.active_cluster_name ?? 'Mustody Shared MPC';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Card elevation={0} sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 70%)`,
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Hub sx={{ fontSize: 40, color: 'primary.main', mt: 0.5 }} />
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>MPC Infrastructure</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                Wallet creation, transfers, and contract signing are handled by <strong>Multi-Party Computation (MPC)</strong> nodes.
                Your organization does not need to configure anything to get started.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info" icon={<CloudQueue />} sx={{ borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {mode === 'dedicated' ? 'Dedicated MPC cluster active' : mode === 'pending_review' ? 'Dedicated cluster pending approval' : 'Using Mustody shared MPC'}
        </Typography>
        <Typography variant="body2">
          {mode === 'dedicated'
            ? `MPC requests for your tenant are routed to your approved cluster (${activeName}).`
            : mode === 'pending_review'
              ? 'Your tenant admin submitted a dedicated cluster request. Until Mustody approves it, all MPC traffic continues on the shared infrastructure.'
              : 'No dedicated cluster is configured for your tenant. All MPC wallet and signing requests are processed on Mustody\'s shared, production-grade MPC servers.'}
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>How routing works</Typography>
          <List dense disablePadding>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}><CheckCircle color="success" fontSize="small" /></ListItemIcon>
              <ListItemText
                primary="Default (no configuration)"
                secondary="Mustody shared MPC cluster handles wallet creation and transaction signing automatically."
              />
            </ListItem>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}><Security color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText
                primary="Optional dedicated cluster (tenant admin)"
                secondary="Your organization can deploy mustody-project-round MPC nodes on your own infrastructure and route MPC traffic exclusively to your servers after Mustody admin approval."
              />
            </ListItem>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}><Lock color="warning" fontSize="small" /></ListItemIcon>
              <ListItemText
                primary="Configuration is permanent after approval"
                secondary="gRPC address, node ID, and cluster identity cannot be changed once approved. Plan your endpoints, TLS certificates, and Vault secrets carefully before submitting."
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {!overview?.can_configure && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Contact your <strong>tenant administrator</strong> if your organization needs a dedicated MPC cluster on private infrastructure.
        </Alert>
      )}
    </Box>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MpcClustersPage() {
  const theme = useTheme();
  const { hasGlobalRole, hasRole } = useAuth();
  const isAdmin = hasGlobalRole('admin') || hasGlobalRole('owner');
  const isTenantAdmin = !isAdmin && hasRole('tenant_admin');
  const canManage = isAdmin || isTenantAdmin;

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

  const [overview, setOverview] = useState<MPCOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(!canManage);

  // Admin review
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<MPCCluster | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

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

  useEffect(() => { if (canManage) fetchClusters(); }, [fetchClusters, canManage]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await api.get<MPCOverview>('/tenant/mpc-clusters/overview');
      setOverview(res.data);
    } catch {
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

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
      fetchOverview();
    } catch (e: any) {
      setCreateError(e.response?.data?.error ?? 'Submit failed');
    }
  };

  const submitReview = async (approve: boolean) => {
    if (!reviewTarget) return;
    setReviewError(null);
    setActionLoading(reviewTarget.id + '_review');
    try {
      await api.put(`${adminBase}/${reviewTarget.id}/review`, {
        status: approve ? 'approved' : 'rejected',
        review_notes: reviewNotes,
      });
      setReviewOpen(false);
      setReviewNotes('');
      fetchClusters();
    } catch (e: any) {
      setReviewError(e.response?.data?.error ?? 'Review failed');
    } finally {
      setActionLoading(null);
    }
  };

  const openReview = (c: MPCCluster) => {
    setReviewTarget(c);
    setReviewNotes('');
    setReviewError(null);
    setReviewOpen(true);
  };

  // ── Guard ────────────────────────────────────────────────────────────────────

  if (!canManage) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <MpcInfrastructureInfo overview={overview} loading={overviewLoading} />
        </Box>
      </DashboardLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasDedicatedRequest = clusters.some(c =>
    c.tenant_id && (c.approval_status === 'pending' || c.approval_status === 'approved'),
  );

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
            {isTenantAdmin && !hasDedicatedRequest && (
              <Button variant="contained" size="small" onClick={() => { setCreateError(null); setCreateOpen(true); }}>
                Submit Cluster Request
              </Button>
            )}
            <Tooltip title="Refresh">
              <IconButton onClick={fetchClusters} disabled={loading}><Refresh /></IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Card elevation={0} sx={{ mb: 2, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={800} gutterBottom>
              {isTenantAdmin ? 'Dedicated MPC for your organization' : 'Tenant MPC cluster requests'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, maxWidth: 900 }}>
              By default, all MPC wallet and signing requests use <strong>Mustody&apos;s shared MPC servers</strong>.
              As a tenant admin you may register your own MPC nodes so traffic is routed to infrastructure you control.
              Requests require <strong>Mustody admin approval</strong> before activation.
              Once approved, <strong>gRPC address, node ID and cluster identity cannot be changed</strong> — only TLS renewal and secret rotation remain available.
            </Typography>
          </CardContent>
        </Card>

        {isTenantAdmin && overview?.routing_mode === 'pending_review' && (
          <Alert severity="warning" sx={{ mb: 2 }} icon={<Info />}>
            Your dedicated cluster request is <strong>awaiting Mustody admin approval</strong>.
            Until then, wallets and transfers continue on the shared MPC infrastructure ({overview.active_cluster_name}).
          </Alert>
        )}

        {isTenantAdmin && (
          <Alert severity="info" sx={{ mb: 2 }}>
            While pending review you may upload TLS certificates and configure the Vault secret.
            After approval the cluster configuration is locked.
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
                    Your tenant uses Mustody&apos;s shared MPC infrastructure. Wallet creation and signing work out of the box.
                    Submit a dedicated cluster request below if you need full isolation on your own servers.
                  </Typography>
                </Alert>
                <Button variant="outlined" size="small" disabled={hasDedicatedRequest}
                  onClick={() => { setCreateError(null); setCreateOpen(true); }}>
                  Submit Dedicated Cluster Request
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
                      <TableCell>Approval</TableCell>
                      <TableCell>Runtime</TableCell>
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
                          {approvalChip(c.approval_status ?? 'approved')}
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
                          {/* Admin: review pending tenant requests */}
                          {isAdmin && c.approval_status === 'pending' && c.tenant_id && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton size="small" color="success" onClick={() => openReview(c)}>
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
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

        {/* ── Admin Review Dialog ── */}
        <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Review MPC Cluster Request</DialogTitle>
          <DialogContent dividers>
            {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
            <Alert severity="warning" sx={{ mb: 2 }}>
              Approving activates routing to this cluster and <strong>locks the configuration permanently</strong>.
              Rejecting keeps the tenant on Mustody shared MPC.
            </Alert>
            {reviewTarget && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2"><strong>Name:</strong> {reviewTarget.name}</Typography>
                <Typography variant="body2" fontFamily="monospace"><strong>gRPC:</strong> {reviewTarget.grpc_addr}</Typography>
                <Typography variant="body2" fontFamily="monospace"><strong>Node:</strong> {reviewTarget.node_id}</Typography>
              </Box>
            )}
            <TextField
              label="Review notes (optional)"
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button color="error" onClick={() => submitReview(false)} disabled={actionLoading === reviewTarget?.id + '_review'}>
              Reject
            </Button>
            <Button variant="contained" color="success" onClick={() => submitReview(true)} disabled={actionLoading === reviewTarget?.id + '_review'}>
              {actionLoading === reviewTarget?.id + '_review' ? <CircularProgress size={20} /> : 'Approve & Activate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Create Cluster (tenant_admin) ── */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Submit Dedicated MPC Cluster</DialogTitle>
          <DialogContent dividers>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <Alert severity="warning" sx={{ mb: 2 }} icon={<Lock />}>
              <Typography variant="body2" fontWeight={700} gutterBottom>Important — read before submitting</Typography>
              <Typography variant="body2" component="div">
                • Your request is sent to <strong>Mustody admin for approval</strong> (maker-checker).<br />
                • Until approved, MPC traffic stays on <strong>Mustody shared servers</strong>.<br />
                • After approval, <strong>gRPC address, node ID and cluster name cannot be changed</strong>.<br />
                • Double-check endpoints, TLS, and Vault secrets before submitting.
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>Setup Requirements:</Typography>
              <Typography variant="body2" component="div">
                1. Install <strong>mustody-project-round</strong> MPC node on your infrastructure<br/>
                2. Install <strong>HashiCorp Vault</strong> for secret management<br/>
                3. Expose the gRPC endpoint to Mustody backend<br/>
                4. Configure shared secret in Vault / environment<br/>
                5. Upload TLS certificate after submission (while pending review)
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
              Submit for Admin Review
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
