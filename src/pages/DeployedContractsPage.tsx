import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Tooltip, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider,
} from '@mui/material';
import { Refresh, Delete, Visibility, VerifiedUser, Fullscreen, FullscreenExit, Save } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import SolEditor from '@/components/SolEditor';
import { deployedContractAPI, DeployedContract, ContractDeployStatus } from '@/lib/api';

// ── Status chip ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ContractDeployStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'default',
  deploying: 'info',
  deployed: 'success',
  failed: 'error',
  verifying: 'warning',
  verified: 'success',
};

function StatusChip({ status }: { status: ContractDeployStatus }) {
  return <Chip label={status.toUpperCase()} size="small" color={STATUS_COLOR[status] ?? 'default'} />;
}

// ── Detail / Edit dialog ──────────────────────────────────────────────────────

interface DetailDialogProps {
  open: boolean;
  contract: DeployedContract | null;
  onClose: () => void;
  onRefresh: () => void;
}

function DetailDialog({ open, contract, onClose, onRefresh }: DetailDialogProps) {
  const [fullScreen, setFullScreen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifiedSource, setVerifiedSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [contractName, setContractName] = useState('');
  const [editedSource, setEditedSource] = useState('');

  useEffect(() => {
    if (!contract) return;
    setContractName(contract.contract_name || '');
    const src = contract.rendered_source
      ? (() => { try { return atob(contract.rendered_source); } catch { return contract.rendered_source; } })()
      : '';
    setEditedSource(src);
    setError(null);
    setUpdateSuccess(false);
    setVerifyOpen(false);
  }, [contract]);

  if (!contract) return null;

  const isStuckDeploying = contract.status === 'deploying' &&
    Date.now() - new Date(contract.updated_at).getTime() > 10 * 60 * 1000;
  const canDeploy = !contract.is_deployed && (contract.status !== 'deploying' || isStuckDeploying);
  const isDirty = contractName !== contract.contract_name ||
    editedSource !== (() => { try { return atob(contract.rendered_source ?? ''); } catch { return contract.rendered_source ?? ''; } })();

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);
    setUpdateSuccess(false);
    try {
      await deployedContractAPI.update(contract.id, {
        contract_name: contractName,
        chain_id: contract.chain_id,
        owner_address: contract.owner_address,
        rendered_source: editedSource,
      });
      setUpdateSuccess(true);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeploy = async () => {
    setSaving(true);
    setError(null);
    try {
      await deployedContractAPI.deploy(contract.id, editedSource, contractName);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setSaving(true);
    setError(null);
    try {
      await deployedContractAPI.verify(contract.id, verifiedSource);
      setVerifyOpen(false);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const verifiedText = contract.verified_source
    ? (() => { try { return atob(contract.verified_source); } catch { return contract.verified_source; } })()
    : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          {contract.contract_name}
          <StatusChip status={contract.status} />
          {contract.is_deployed && (
            <Chip label="DEPLOYED" size="small" color="success" variant="outlined" />
          )}
        </Box>
        <Tooltip title={fullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
          <IconButton size="small" onClick={() => setFullScreen((v) => !v)}>
            {fullScreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {updateSuccess && <Alert severity="success" sx={{ mb: 2 }}>Saved.</Alert>}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">Chain ID</Typography>
            <Typography variant="body2">{contract.chain_id}</Typography>
          </Box>
          <Box sx={{ flex: 2, minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">Owner Address</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{contract.owner_address}</Typography>
          </Box>
          {contract.contract_address && (
            <Box sx={{ flex: 2, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">Contract Address</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{contract.contract_address}</Typography>
            </Box>
          )}
          {contract.deploy_tx_hash && (
            <Box sx={{ flex: 2, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">Deploy Tx Hash</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{contract.deploy_tx_hash}</Typography>
            </Box>
          )}
          {contract.error_message && (
            <Box sx={{ flex: '100%' }}>
              <Alert severity="error">{contract.error_message}</Alert>
            </Box>
          )}
        </Box>

        {(contract.params_used || []).length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Parameters Used</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {contract.params_used.map((p) => (
                <Chip key={p.name} label={`${p.name} = ${p.value}`} size="small" variant="outlined" />
              ))}
            </Box>
          </>
        )}

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" gutterBottom>#NAME — Contract Name</Typography>
        <TextField
          value={contractName}
          onChange={(e) => setContractName(e.target.value)}
          size="small"
          fullWidth
          disabled={contract.is_deployed}
          placeholder="Contract name (used as #NAME parameter)"
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" gutterBottom>
          {contract.is_deployed ? 'Source (read-only — deployed)' : 'Source (editable before deploy)'}
        </Typography>
        <SolEditor
          value={editedSource}
          onChange={contract.is_deployed ? () => {} : setEditedSource}
          minRows={fullScreen ? 24 : 14}
        />

        {verifiedText && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Verified Source</Typography>
            <SolEditor value={verifiedText} onChange={() => {}} minRows={10} />
          </>
        )}

        {verifyOpen && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Submit Verified Source</Typography>
            <SolEditor value={verifiedSource} onChange={setVerifiedSource} minRows={10} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="contained" color="primary" size="small" onClick={handleVerify} disabled={saving || !verifiedSource}>
                {saving ? <CircularProgress size={16} /> : 'Submit'}
              </Button>
              <Button size="small" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!contract.is_deployed && isDirty && (
          <Button
            startIcon={updating ? <CircularProgress size={16} /> : <Save />}
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? 'Saving…' : 'Update'}
          </Button>
        )}
        {canDeploy && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleDeploy}
            disabled={saving || !contractName || !editedSource}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Deploying…' : 'Deploy'}
          </Button>
        )}
        {contract.status === 'deploying' && (
          <Chip label="Deploying…" color="info" size="small" sx={{ mr: 1 }} />
        )}
        {contract.is_deployed && !contract.verified_source && !verifyOpen && (
          <Button startIcon={<VerifiedUser />} color="primary" onClick={() => setVerifyOpen(true)}>
            Submit Verified Source
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeployedContractsPage() {
  const { hasGlobalRole, hasRole } = useAuth();
  const isAdmin = hasGlobalRole('admin') || hasGlobalRole('owner');
  const isTenantAdmin = hasRole('tenant_admin');
  const canEdit = isAdmin || isTenantAdmin;
  const [, setLocation] = useLocation();

  const [contracts, setContracts] = useState<DeployedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<DeployedContract | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deployedContractAPI.list();
      setContracts(res.data.contracts || []);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this contract record?')) return;
    try {
      await deployedContractAPI.delete(id);
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const openDetail = (c: DeployedContract) => {
    setSelected(c);
    setDetailOpen(true);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>Deployed Contracts</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={load}><Refresh /></IconButton>
          </Tooltip>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Chain</TableCell>
                <TableCell>Contract Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Deployed</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No contracts found.{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      color="primary"
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setLocation('/contract-templates')}
                    >
                      Go to Contract Templates
                    </Typography>
                    {' '}to create one.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => openDetail(c)}
                      >
                        {c.contract_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{c.chain_id}</TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.contract_address || '—'}
                    </TableCell>
                    <TableCell><StatusChip status={c.status} /></TableCell>
                    <TableCell>
                      <Chip
                        label={c.is_deployed ? 'Yes' : 'No'}
                        size="small"
                        color={c.is_deployed ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.verified_source ? 'Yes' : 'No'}
                        size="small"
                        color={c.verified_source ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openDetail(c)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && !c.is_deployed && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <DetailDialog
        open={detailOpen}
        contract={selected}
        onClose={() => setDetailOpen(false)}
        onRefresh={() => { load(); setDetailOpen(false); }}
      />
    </DashboardLayout>
  );
}
