import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Tooltip, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider,
} from '@mui/material';
import { Refresh, Delete, Visibility, VerifiedUser, Fullscreen, FullscreenExit, Save, OpenInNew, ContentCopy, Token } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import SolEditor from '@/components/SolEditor';
import { deployedContractAPI, walletAPI, coinAPI, CoinDefinition, DeployedContract, ContractDeployStatus, ChainDefinition } from '@/lib/api';

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
  onRefresh: () => void;       // reload list, keep dialog open
  onDeployed: () => void;      // reload list + close dialog
  onStatusUpdate: (id: string, patch: Partial<DeployedContract>) => void;
  explorerUrl?: string;
}

function DetailDialog({ open, contract, onClose, onRefresh, onDeployed, onStatusUpdate, explorerUrl }: DetailDialogProps) {
  const { user } = useAuth();
  const isOwner = contract != null && (
    (contract.deployed_by != null && contract.deployed_by === user?.id) ||
    (contract.user_id != null && contract.user_id === user?.id)
  );
  const [fullScreen, setFullScreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [contractName, setContractName] = useState('');
  const [editedSource, setEditedSource] = useState('');

  // Coin state
  const [coin, setCoin] = useState<CoinDefinition | null>(null);
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinSymbol, setCoinSymbol] = useState('');
  const [coinName, setCoinName] = useState('');
  const [coinDecimals, setCoinDecimals] = useState(18);
  const [showCoinForm, setShowCoinForm] = useState(false);

  useEffect(() => {
    if (!contract) return;
    setContractName(contract.contract_name || '');
    const src = contract.rendered_source
      ? (() => { try { return atob(contract.rendered_source); } catch { return contract.rendered_source; } })()
      : '';
    setEditedSource(src);
    setError(null);
    setUpdateSuccess(false);
    setShowCoinForm(false);
    // Check if already a coin
    if (contract.is_deployed && contract.contract_address) {
      coinAPI.getByContract(contract.id).then((res) => setCoin(res.data.coin)).catch(() => setCoin(null));
    } else {
      setCoin(null);
    }
  }, [contract?.id]);

  const handleAddCoin = async () => {
    if (!contract) return;
    setCoinLoading(true);
    setError(null);
    try {
      const res = await coinAPI.add({
        contract_id: contract.id,
        symbol: coinSymbol.trim().toUpperCase(),
        display_name: coinName.trim() || coinSymbol.trim(),
        decimals: coinDecimals,
      });
      setCoin(res.data.coin);
      setShowCoinForm(false);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setCoinLoading(false);
    }
  };

  const handleRemoveCoin = async () => {
    if (!coin || !contract) return;
    if (!window.confirm(`Remove "${coin.symbol}" from the coin list?`)) return;
    setCoinLoading(true);
    setError(null);
    try {
      await coinAPI.remove(coin.id, contract.id);
      setCoin(null);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setCoinLoading(false);
    }
  };

  // SSE: watch deploying status while dialog is open
  useEffect(() => {
    if (!open || !contract || contract.status !== 'deploying') return;
    const ctrl = new AbortController();
    deployedContractAPI.statusStream(
      contract.id,
      (data) => {
        onStatusUpdate(contract.id, {
          status: data.status as ContractDeployStatus,
          contract_address: data.contract_address,
          deploy_tx_hash: data.deploy_tx_hash,
          error_message: data.error_message,
          is_deployed: data.status === 'deployed',
        });
      },
      ctrl.signal,
    );
    return () => ctrl.abort();
  }, [open, contract?.id, contract?.status]); // eslint-disable-line react-hooks/exhaustive-deps

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
      onDeployed();
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
      await deployedContractAPI.verify(contract.id, editedSource);
      onStatusUpdate(contract.id, { status: 'verified', verified_source: btoa(unescape(encodeURIComponent(editedSource))) });
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
          {contract.solc_version && (
            <Box sx={{ flex: 1, minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">Solidity Version</Typography>
              <Typography variant="body2">{contract.solc_version}</Typography>
            </Box>
          )}
          <Box sx={{ flex: 2, minWidth: 200 }}>

            <Typography variant="caption" color="text.secondary">Owner Address</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {explorerUrl && contract.owner_address ? (
                <Box component="a" href={`${explorerUrl}/address/${contract.owner_address}`} target="_blank" rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {contract.owner_address}<OpenInNew sx={{ fontSize: 14 }} />
                </Box>
              ) : contract.owner_address}
            </Typography>
          </Box>
          {contract.contract_address && (
            <Box sx={{ flex: 2, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">Contract Address</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {explorerUrl ? (
                  <Box component="a" href={`${explorerUrl}/address/${contract.contract_address}`} target="_blank" rel="noopener noreferrer"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {contract.contract_address}<OpenInNew sx={{ fontSize: 14 }} />
                  </Box>
                ) : contract.contract_address}
              </Typography>
            </Box>
          )}
          {contract.deploy_tx_hash && (
            <Box sx={{ flex: 2, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">Deploy Tx Hash</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {explorerUrl ? (
                  <Box component="a" href={`${explorerUrl}/tx/${contract.deploy_tx_hash}`} target="_blank" rel="noopener noreferrer"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {contract.deploy_tx_hash}<OpenInNew sx={{ fontSize: 14 }} />
                  </Box>
                ) : contract.deploy_tx_hash}
              </Typography>
            </Box>
          )}
          {contract.error_message && (
            <Box sx={{ flex: '100%' }}>
              <Alert severity="error">{contract.error_message}</Alert>
            </Box>
          )}
        </Box>

        {contract.is_deployed && contract.solc_version && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Etherscan Verification Parameters</Typography>
              <Tooltip title="Copy all as text">
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(
                  `Compiler: ${contract.solc_version}\nOptimization: ${contract.optimizer_enabled ? 'Yes' : 'No'}${contract.optimizer_enabled ? `, Runs: ${contract.optimizer_runs}` : ''}\nEVM Version: ${contract.evm_version || 'default'}`
                )}>
                  <ContentCopy sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Compiler Version</Typography>
                <Typography variant="body2" fontFamily="monospace">{contract.solc_version}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Optimization</Typography>
                <Typography variant="body2">
                  {contract.optimizer_enabled ? `Yes, Runs: ${contract.optimizer_runs}` : 'No'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">EVM Version</Typography>
                <Typography variant="body2" fontFamily="monospace">{contract.evm_version || 'default'}</Typography>
              </Box>
            </Box>
          </>
        )}

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2">Verified Source</Typography>
              <Tooltip title="Copy to clipboard">
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(verifiedText)}>
                  <ContentCopy sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <SolEditor value={verifiedText} onChange={() => {}} minRows={10} />
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="info.main">Deploying…</Typography>
          </Box>
        )}
        {contract.is_deployed && contract.status !== 'verified' && (
          <Button startIcon={saving ? <CircularProgress size={16} /> : <VerifiedUser />} color="primary" onClick={handleVerify} disabled={saving || !editedSource}>
            {saving ? 'Submitting…' : 'Submit Verified Source'}
          </Button>
        )}
        {contract.is_deployed && contract.status === 'verified' && (
          <Button startIcon={saving ? <CircularProgress size={16} /> : <VerifiedUser />} color="inherit" size="small" onClick={handleVerify} disabled={saving || !editedSource}>
            {saving ? 'Submitting…' : 'Re-submit Verified Source'}
          </Button>
        )}

        {/* ── Coin actions ── */}
        {contract.is_deployed && contract.contract_address && isOwner && !coin && !showCoinForm && (
          <Button startIcon={<Token />} color="secondary" onClick={() => {
            setCoinSymbol('');
            setCoinName(contract.contract_name || '');
            setCoinDecimals(18);
            setShowCoinForm(true);
          }}>
            Add as Coin
          </Button>
        )}
        {contract.is_deployed && isOwner && showCoinForm && (
          <>
            <TextField
              size="small"
              placeholder="Symbol (e.g. TKN)"
              value={coinSymbol}
              onChange={(e) => setCoinSymbol(e.target.value)}
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              placeholder="Display name"
              value={coinName}
              onChange={(e) => setCoinName(e.target.value)}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              type="number"
              placeholder="Decimals"
              value={coinDecimals}
              onChange={(e) => setCoinDecimals(Number(e.target.value))}
              sx={{ width: 90 }}
            />
            <Button
              variant="contained"
              color="secondary"
              size="small"
              disabled={coinLoading || !coinSymbol.trim()}
              onClick={handleAddCoin}
              startIcon={coinLoading ? <CircularProgress size={14} /> : <Token />}
            >
              Confirm
            </Button>
            <Button size="small" onClick={() => setShowCoinForm(false)}>Cancel</Button>
          </>
        )}
        {contract.is_deployed && isOwner && coin && (
          <Button
            startIcon={coinLoading ? <CircularProgress size={14} /> : <Token />}
            color="warning"
            size="small"
            disabled={coinLoading}
            onClick={handleRemoveCoin}
          >
            Remove from Coins ({coin.symbol})
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
  const [chainMap, setChainMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deployedContractAPI.list();
      const list = res.data.contracts || [];
      setContracts(list);
      // Keep selected in sync without closing the dialog
      setSelected((prev) => prev ? (list.find((c) => c.id === prev.id) ?? prev) : null);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    walletAPI.getChains().then((res) => {
      const map: Record<string, string> = {};
      (res.data.chains || []).forEach((c: ChainDefinition) => {
        if (c.explorer_url) map[c.chain_id] = c.explorer_url.replace(/\/$/, '');
      });
      setChainMap(map);
    }).catch(() => {});
  }, []);

  // SSE: watch all deploying contracts in the table
  useEffect(() => {
    const deploying = contracts.filter((c) => c.status === 'deploying');
    if (deploying.length === 0) return;
    const controllers = deploying.map((c) => {
      const ctrl = new AbortController();
      deployedContractAPI.statusStream(
        c.id,
        (data) => handleStatusUpdate(c.id, {
          status: data.status as ContractDeployStatus,
          contract_address: data.contract_address,
          deploy_tx_hash: data.deploy_tx_hash,
          error_message: data.error_message,
          is_deployed: data.status === 'deployed',
        }),
        ctrl.signal,
      );
      return ctrl;
    });
    return () => controllers.forEach((ctrl) => ctrl.abort());
  }, [contracts.map((c) => c.id + c.status).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusUpdate = useCallback((id: string, patch: Partial<DeployedContract>) => {
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
    setSelected((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  }, []);

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
                      {c.contract_address
                        ? chainMap[c.chain_id]
                          ? <Box component="a" href={`${chainMap[c.chain_id]}/address/${c.contract_address}`} target="_blank" rel="noopener noreferrer"
                              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.contract_address}<OpenInNew sx={{ fontSize: 12, flexShrink: 0 }} />
                            </Box>
                          : c.contract_address
                        : '—'}
                    </TableCell>
                    <TableCell><StatusChip status={c.status} />{c.status === 'deploying' && <CircularProgress size={12} sx={{ ml: 1, verticalAlign: 'middle' }} />}</TableCell>
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
        onRefresh={load}
        onDeployed={() => { load(); setDetailOpen(false); }}
        onStatusUpdate={handleStatusUpdate}
        explorerUrl={selected ? chainMap[selected.chain_id] : undefined}
      />
    </DashboardLayout>
  );
}
