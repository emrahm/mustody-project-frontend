import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Avatar, Chip,
  IconButton, alpha, useTheme, CircularProgress, Tooltip, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, Tabs, Tab, Divider, Alert, Snackbar, Paper,
  List, ListItem, ListItemText, ListItemAvatar, Badge, Stack,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalanceWallet, ContentCopy, OpenInNew, Refresh,
  Add, Search, CheckCircle, Error as ErrorIcon, HourglassEmpty,
  ArrowUpward, ArrowDownward, SwapHoriz, QrCode2, Visibility,
  VisibilityOff, TrendingUp, Shield, Person, Close, Launch, Replay,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { walletAPI, adminWalletAPI, UserWallet, ChainDefinition, WalletBalance } from '@/lib/api';

// ─── Chain visual config ────────────────────────────────────────────────────

interface ChainMeta {
  label: string;
  color: string;
  gradient: string;
  icon: string;        // emoji fallback — no external deps
  networks: string[];  // chain_ids that belong to this type
}

const CHAIN_META: Record<'EVM' | 'COSMOS' | 'SOLANA', ChainMeta> = {
  EVM: {
    label: 'EVM Networks',
    color: '#627EEA',
    gradient: 'linear-gradient(135deg, #627EEA 0%, #3B5BDB 100%)',
    icon: '⬡',
    networks: ['Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Base', 'Optimism', 'Avalanche'],
  },
  COSMOS: {
    label: 'Cosmos',
    color: '#2E3148',
    gradient: 'linear-gradient(135deg, #6F73D2 0%, #2E3148 100%)',
    icon: '⚛',
    networks: ['Cosmos Hub', 'Osmosis', 'Juno'],
  },
  SOLANA: {
    label: 'Solana',
    color: '#9945FF',
    gradient: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
    icon: '◎',
    networks: ['Solana Mainnet', 'Solana Devnet'],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateAddress(addr: string, head = 8, tail = 6): string {
  if (!addr || addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

function statusColor(status: UserWallet['status']): 'success' | 'warning' | 'error' {
  return status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'error';
}

function statusIcon(status: UserWallet['status']) {
  if (status === 'active') return <CheckCircle fontSize="small" />;
  if (status === 'pending') return <HourglassEmpty fontSize="small" />;
  return <ErrorIcon fontSize="small" />;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
      <IconButton size="small" onClick={handleCopy} sx={{ color: copied ? 'success.main' : 'inherit' }}>
        <ContentCopy fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

function AddressPill({ address, explorerUrl }: { address: string; explorerUrl?: string }) {
  const theme = useTheme();
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.5, py: 0.5, borderRadius: 2,
      bgcolor: alpha(theme.palette.primary.main, 0.06),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      fontFamily: 'monospace', fontSize: '0.8rem',
      color: theme.palette.text.primary,
      maxWidth: '100%', overflow: 'hidden',
    }}>
      <Typography variant="caption" fontFamily="monospace" noWrap sx={{ flex: 1 }}>
        {address}
      </Typography>
      <CopyButton text={address} />
      {explorerUrl && (
        <Tooltip title="View on explorer">
          <IconButton size="small" component="a" href={`${explorerUrl}/address/${address}`} target="_blank">
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

// ─── WalletCard ───────────────────────────────────────────────────────────────

interface WalletCardProps {
  wallet: UserWallet;
  chains: ChainDefinition[];
  onRefreshBalance: (walletId: string, chainId: string) => void;
  balances: Record<string, WalletBalance>;
  loadingBalance: string | null;
}

function WalletCard({ wallet, chains, onRefreshBalance, balances, loadingBalance }: WalletCardProps) {
  const theme = useTheme();
  const meta = CHAIN_META[wallet.mpc_chain_type];
  const [showFull, setShowFull] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainDefinition | null>(
    chains.find(c => c.mpc_chain_type === wallet.mpc_chain_type && c.is_active) ?? null
  );

  const evmChains = chains.filter(c => c.mpc_chain_type === wallet.mpc_chain_type && c.is_active);
  const balanceKey = selectedChain ? `${wallet.id}:${selectedChain.chain_id}` : '';
  const balance = balances[balanceKey];
  const isLoadingBal = loadingBalance === balanceKey;

  return (
    <Card sx={{
      position: 'relative', overflow: 'hidden', height: '100%',
      border: `1px solid ${alpha(meta.color, 0.2)}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${alpha(meta.color, 0.18)}` },
    }}>
      {/* Gradient header strip */}
      <Box sx={{ background: meta.gradient, px: 3, py: 2.5, position: 'relative' }}>
        {/* Decorative circle */}
        <Box sx={{
          position: 'absolute', right: -24, top: -24,
          width: 120, height: 120, borderRadius: '50%',
          bgcolor: alpha('#fff', 0.08),
        }} />
        <Box sx={{
          position: 'absolute', right: 20, top: 20,
          width: 60, height: 60, borderRadius: '50%',
          bgcolor: alpha('#fff', 0.06),
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: alpha('#fff', 0.15),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', backdropFilter: 'blur(4px)',
            }}>
              {meta.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                {meta.label}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.75) }}>
                {meta.networks.slice(0, 3).join(' · ')}
                {meta.networks.length > 3 && ` +${meta.networks.length - 3}`}
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            icon={statusIcon(wallet.status)}
            label={wallet.status}
            color={statusColor(wallet.status)}
            sx={{ bgcolor: alpha('#fff', 0.15), color: '#fff', border: 'none', fontWeight: 600,
              '& .MuiChip-icon': { color: '#fff' } }}
          />
        </Box>

        {/* Balance display */}
        <Box sx={{ mt: 2.5 }}>
          {isLoadingBal ? (
            <Skeleton variant="text" width={140} height={48} sx={{ bgcolor: alpha('#fff', 0.2) }} />
          ) : balance ? (
            <Box>
              <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.75rem', mb: 0.25 }}>
                Balance · {selectedChain?.display_name}
              </Typography>
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, letterSpacing: '-0.5px' }}>
                {parseFloat(balance.balance).toFixed(6)}
                <Typography component="span" sx={{ color: alpha('#fff', 0.75), fontSize: '1rem', ml: 0.75 }}>
                  {selectedChain?.native_symbol}
                </Typography>
              </Typography>
              {balance.balance_usd && (
                <Typography sx={{ color: alpha('#fff', 0.65), fontSize: '0.8rem' }}>
                  ≈ ${balance.balance_usd} USD
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              <Typography sx={{ color: alpha('#fff', 0.6), fontSize: '0.75rem', mb: 0.5 }}>Balance</Typography>
              <Typography variant="h4" sx={{ color: alpha('#fff', 0.4), fontWeight: 700 }}>—</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <CardContent sx={{ pt: 2 }}>
        {/* Address row */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Public Address
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              fontFamily="monospace"
              fontSize="0.82rem"
              sx={{ flex: 1, wordBreak: 'break-all', color: 'text.primary', cursor: 'pointer' }}
              onClick={() => setShowFull(v => !v)}
            >
              {showFull ? wallet.public_address : truncateAddress(wallet.public_address)}
            </Typography>
            <Tooltip title={showFull ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={() => setShowFull(v => !v)}>
                {showFull ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </Tooltip>
            <CopyButton text={wallet.public_address} />
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Chain selector + refresh */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {evmChains.slice(0, 5).map(chain => (
            <Chip
              key={chain.chain_id}
              label={chain.display_name}
              size="small"
              variant={selectedChain?.chain_id === chain.chain_id ? 'filled' : 'outlined'}
              onClick={() => setSelectedChain(chain)}
              sx={{
                cursor: 'pointer', fontSize: '0.7rem',
                ...(selectedChain?.chain_id === chain.chain_id && {
                  bgcolor: alpha(meta.color, 0.12),
                  borderColor: meta.color,
                  color: meta.color,
                  fontWeight: 700,
                }),
              }}
            />
          ))}
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Refresh balance">
              <span>
                <IconButton
                  size="small"
                  disabled={!selectedChain || wallet.status !== 'active'}
                  onClick={() => selectedChain && onRefreshBalance(wallet.id, selectedChain.chain_id)}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {wallet.status === 'failed' && (
          <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }} icon={<ErrorIcon fontSize="small" />}>
            {wallet.failure_reason || wallet.last_error || 'Wallet creation failed'}
            {wallet.retry_count > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 0.25, opacity: 0.8 }}>
                Failed after {wallet.retry_count} attempt{wallet.retry_count !== 1 ? 's' : ''}
              </Typography>
            )}
          </Alert>
        )}
        {wallet.status === 'pending' && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress color="warning" sx={{ borderRadius: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Creating wallet… {wallet.retry_count > 0 && `(attempt ${wallet.retry_count + 1})`}
              </Typography>
              {wallet.next_retry_at && (
                <Typography variant="caption" color="text.secondary">
                  Next retry: {new Date(wallet.next_retry_at).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            {wallet.last_error && (
              <Alert severity="warning" sx={{ mt: 0.75, py: 0.25, fontSize: '0.72rem' }}>
                Last error: {wallet.last_error}
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── UserHeader ───────────────────────────────────────────────────────────────

function UserHeader({ name, email, avatarUrl, walletCount }: {
  name: string; email: string; avatarUrl?: string; walletCount: number;
}) {
  const theme = useTheme();
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Paper elevation={0} sx={{
      p: 3, mb: 3, borderRadius: 3,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap',
    }}>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box sx={{
            width: 18, height: 18, borderRadius: '50%',
            bgcolor: 'success.main', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield sx={{ fontSize: 10, color: '#fff' }} />
          </Box>
        }
      >
        <Avatar
          src={avatarUrl}
          sx={{ width: 64, height: 64, fontSize: '1.4rem', fontWeight: 700,
            bgcolor: theme.palette.primary.main }}
        >
          {initials}
        </Avatar>
      </Badge>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" fontWeight={700}>{name}</Typography>
        <Typography variant="body2" color="text.secondary">{email}</Typography>
      </Box>
      <Stack direction="row" spacing={2}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={800} color="primary.main">{walletCount}</Typography>
          <Typography variant="caption" color="text.secondary">Active Wallets</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
            <Shield fontSize="small" color="success" />
            <Typography variant="h6" fontWeight={700} color="success.main">MPC</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">Key Security</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── CreateWalletDialog ───────────────────────────────────────────────────────

function CreateWalletDialog({ open, onClose, onCreated, existingTypes }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  existingTypes: Set<string>;
}) {
  const [selected, setSelected] = useState<'EVM' | 'COSMOS' | 'SOLANA' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await walletAPI.createWallet(selected);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6" fontWeight={700}>Create New Wallet</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><Close /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          A new MPC key will be generated. Your private key never leaves the secure cluster.
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {(Object.entries(CHAIN_META) as [keyof typeof CHAIN_META, ChainMeta][]).map(([type, meta]) => {
            const already = existingTypes.has(type);
            return (
              <Grid item xs={12} key={type}>
                <Paper
                  onClick={() => !already && setSelected(type)}
                  elevation={0}
                  sx={{
                    p: 2, borderRadius: 2, cursor: already ? 'not-allowed' : 'pointer',
                    border: `2px solid`,
                    borderColor: selected === type ? meta.color : already ? 'divider' : 'divider',
                    opacity: already ? 0.5 : 1,
                    background: selected === type ? alpha(meta.color, 0.06) : 'transparent',
                    transition: 'all 0.15s',
                    '&:hover': !already ? { borderColor: meta.color, background: alpha(meta.color, 0.04) } : {},
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: 2,
                      background: meta.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem',
                    }}>
                      {meta.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={700}>{meta.label}</Typography>
                        {already && <Chip label="Already created" size="small" color="default" />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {meta.networks.join(' · ')}
                      </Typography>
                    </Box>
                    {selected === type && <CheckCircle sx={{ color: meta.color }} />}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained" disabled={!selected || loading}
          onClick={handleCreate}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Add />}
        >
          {loading ? 'Creating…' : 'Create Wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── TenantUserSearch ─────────────────────────────────────────────────────────

function TenantUserSearch({ onSelect }: { onSelect: (userId: string, name: string, email: string) => void }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search against admin users endpoint
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await import('@/lib/api').then(m => m.adminAPI.getUsers(1, 10));
        const filtered = res.data.users.filter(u =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.map(u => ({ id: u.id, name: u.name, email: u.email })));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Paper elevation={0} sx={{
      p: 2.5, mb: 3, borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
      bgcolor: alpha(theme.palette.warning.main, 0.03),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Person color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
          Viewing as Tenant Admin — Search User Wallet
        </Typography>
      </Box>
      <TextField
        fullWidth size="small" placeholder="Search by name or email…"
        value={query} onChange={e => setQuery(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start">
            {loading ? <CircularProgress size={16} /> : <Search fontSize="small" />}
          </InputAdornment>,
        }}
        sx={{ mb: results.length ? 1 : 0 }}
      />
      {results.length > 0 && (
        <List dense disablePadding>
          {results.map(u => (
            <ListItem
              key={u.id} disablePadding
              sx={{ borderRadius: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, cursor: 'pointer' }}
              onClick={() => { onSelect(u.id, u.name, u.email); setQuery(''); setResults([]); }}
            >
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: theme.palette.primary.main }}>
                  {u.name.slice(0, 2).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={u.name} secondary={u.email}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

// ─── PendingWalletsPanel (admin only) ────────────────────────────────────────

function PendingWalletsPanel() {
  const theme = useTheme();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  const load = useCallback(async () => {
    try {
      const res = await adminWalletAPI.getPendingWallets();
      setWallets(res.data.wallets ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (walletId: string) => {
    setRetrying(walletId);
    try {
      const res = await adminWalletAPI.retryWallet(walletId);
      const updated = res.data.wallet;
      setWallets(prev => prev.map(w => w.id === walletId ? updated : w).filter(w => w.status === 'pending'));
      setSnack({ open: true, msg: updated.status === 'active' ? 'Wallet activated!' : 'Retry triggered', severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Retry failed', severity: 'error' });
    } finally {
      setRetrying(null);
    }
  };

  if (loading) return null;
  if (wallets.length === 0) return null;

  return (
    <Paper elevation={0} sx={{
      mb: 3, borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
      overflow: 'hidden',
    }}>
      <Box sx={{
        px: 2.5, py: 1.5,
        bgcolor: alpha(theme.palette.warning.main, 0.08),
        borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HourglassEmpty sx={{ color: 'warning.main', fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
            Pending Wallets ({wallets.length})
          </Typography>
        </Box>
        <Tooltip title="Refresh list">
          <IconButton size="small" onClick={load}><Refresh fontSize="small" /></IconButton>
        </Tooltip>
      </Box>

      <List disablePadding>
        {wallets.map((w, i) => (
          <ListItem
            key={w.id}
            divider={i < wallets.length - 1}
            sx={{ px: 2.5, py: 1.5, alignItems: 'flex-start' }}
            secondaryAction={
              <Tooltip title="Retry now">
                <span>
                  <IconButton
                    size="small" color="warning"
                    disabled={retrying === w.id}
                    onClick={() => handleRetry(w.id)}
                  >
                    {retrying === w.id
                      ? <CircularProgress size={16} color="inherit" />
                      : <Replay fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            }
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" fontWeight={700}>{w.mpc_chain_type}</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                    {w.user_id}
                  </Typography>
                  <Chip label={`${w.retry_count} attempt${w.retry_count !== 1 ? 's' : ''}`}
                    size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                  {w.next_retry_at && (
                    <Typography variant="caption" color="text.secondary">
                      next: {new Date(w.next_retry_at).toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              }
              secondary={w.last_error && (
                <Typography variant="caption" color="error.main" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {w.last_error}
                </Typography>
              )}
            />
          </ListItem>
        ))}
      </List>

      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

// ─── WalletPage ───────────────────────────────────────────────────────────────

export default function WalletPage() {
  const theme = useTheme();
  const { user, hasRole } = useAuth();
  const isTenantAdmin = hasRole('tenant_admin') || hasRole('admin');

  // Viewed subject — own wallet by default, or a searched user
  const [viewedUser, setViewedUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const displayUser = viewedUser ?? (user ? { id: user.id, name: user.name, email: user.email } : null);

  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [chains, setChains] = useState<ChainDefinition[]>([]);
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});
  const [loadingBalance, setLoadingBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  const loadWallets = useCallback(async () => {
    if (!displayUser) return;
    setLoading(true);
    try {
      const [walletsRes, chainsRes] = await Promise.all([
        viewedUser
          ? walletAPI.getUserWallets(viewedUser.id)
          : walletAPI.getWallets(),
        walletAPI.getChains(),
      ]);
      setWallets((walletsRes.data as any).wallets ?? []);
      setChains((chainsRes.data as any).chains ?? []);
    } catch {
      setSnack({ open: true, msg: 'Failed to load wallet data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [displayUser?.id, viewedUser]);

  useEffect(() => { loadWallets(); }, [loadWallets]);

  // Auto-poll every 15s while any wallet is pending
  useEffect(() => {
    const hasPending = wallets.some(w => w.status === 'pending');
    if (!hasPending) return;
    const id = setInterval(loadWallets, 15_000);
    return () => clearInterval(id);
  }, [wallets, loadWallets]);

  const handleRefreshBalance = async (walletId: string, chainId: string) => {
    const key = `${walletId}:${chainId}`;
    setLoadingBalance(key);
    try {
      const res = await walletAPI.getBalance(walletId, chainId);
      setBalances(prev => ({ ...prev, [key]: res.data }));
    } catch {
      setSnack({ open: true, msg: 'Failed to fetch balance.', severity: 'error' });
    } finally {
      setLoadingBalance(null);
    }
  };

  const existingTypes = new Set(wallets.map(w => w.mpc_chain_type));
  const activeWallets = wallets.filter(w => w.status === 'active');

  // ── Stats bar ──
  const statsItems = [
    { label: 'Total Wallets', value: wallets.length, icon: <AccountBalanceWallet />, color: theme.palette.primary.main },
    { label: 'Active', value: activeWallets.length, icon: <CheckCircle />, color: theme.palette.success.main },
    { label: 'Networks Covered', value: activeWallets.reduce((acc, w) => acc + CHAIN_META[w.mpc_chain_type].networks.length, 0), icon: <TrendingUp />, color: '#627EEA' },
    { label: 'MPC Protected', value: activeWallets.length, icon: <Shield />, color: theme.palette.secondary.main },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

        {/* ── Page title ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
              Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MPC-secured, non-custodial wallets across all major networks
            </Typography>
          </Box>
          {!viewedUser && (
            <Button
              variant="contained" startIcon={<Add />}
              disabled={existingTypes.size >= 3}
              onClick={() => setCreateOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              New Wallet
            </Button>
          )}
          {viewedUser && (
            <Button variant="outlined" startIcon={<Close />} onClick={() => setViewedUser(null)}>
              Back to My Wallet
            </Button>
          )}
        </Box>

        {/* ── Tenant admin user search ── */}
        {isTenantAdmin && !viewedUser && (
          <TenantUserSearch onSelect={(id, name, email) => setViewedUser({ id, name, email })} />
        )}

        {/* ── Admin: pending wallets panel ── */}
        {isTenantAdmin && !viewedUser && <PendingWalletsPanel />}

        {/* ── User header ── */}
        {displayUser && !loading && (
          <UserHeader
            name={displayUser.name}
            email={displayUser.email}
            avatarUrl={(user as any)?.avatar_url}
            walletCount={activeWallets.length}
          />
        )}

        {/* ── Stats row ── */}
        {!loading && wallets.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {statsItems.map(s => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Paper elevation={0} sx={{
                  p: 2, borderRadius: 2, textAlign: 'center',
                  border: `1px solid ${alpha(s.color, 0.15)}`,
                  bgcolor: alpha(s.color, 0.04),
                }}>
                  <Box sx={{ color: s.color, mb: 0.5 }}>{s.icon}</Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <Grid container spacing={3}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Empty state ── */}
        {!loading && wallets.length === 0 && (
          <Paper elevation={0} sx={{
            p: 6, textAlign: 'center', borderRadius: 3,
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}>
            <AccountBalanceWallet sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>No wallets yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
              Create your first MPC wallet. Your private key is split across multiple secure nodes — no single point of failure.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2, px: 4 }}>
              Create First Wallet
            </Button>
          </Paper>
        )}

        {/* ── Wallet cards ── */}
        {!loading && wallets.length > 0 && (
          <Grid container spacing={3}>
            {wallets.map(wallet => (
              <Grid item xs={12} md={6} lg={4} key={wallet.id}>
                <WalletCard
                  wallet={wallet}
                  chains={chains}
                  onRefreshBalance={handleRefreshBalance}
                  balances={balances}
                  loadingBalance={loadingBalance}
                />
              </Grid>
            ))}

            {/* Add more card — only for own wallet view */}
            {!viewedUser && existingTypes.size < 3 && (
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  onClick={() => setCreateOpen(true)}
                  sx={{
                    height: '100%', minHeight: 200, cursor: 'pointer',
                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Add sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                    </Box>
                    <Typography fontWeight={700} color="primary.main">Add Wallet</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {3 - existingTypes.size} network type{3 - existingTypes.size !== 1 ? 's' : ''} available
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* ── Security note ── */}
        {!loading && (
          <Paper elevation={0} sx={{
            mt: 4, p: 2.5, borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            bgcolor: alpha(theme.palette.success.main, 0.03),
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
          }}>
            <Shield sx={{ color: 'success.main', mt: 0.25 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="success.dark">
                MPC Key Security
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your private key is never stored in one place. It is split using Multi-Party Computation (MPC) across
                multiple independent nodes with a 3-of-4 threshold scheme. No single party — including Mustody — can
                access your funds unilaterally.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      {/* ── Dialogs & Snackbar ── */}
      <CreateWalletDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { loadWallets(); setSnack({ open: true, msg: 'Wallet created successfully!', severity: 'success' }); }}
        existingTypes={existingTypes}
      />

      <Snackbar
        open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
