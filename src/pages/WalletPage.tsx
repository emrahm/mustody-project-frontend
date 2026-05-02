import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, IconButton,
  alpha, useTheme, CircularProgress, Tooltip, Skeleton, Collapse,
  Alert, Snackbar, Paper, Divider, LinearProgress,
} from '@mui/material';
import {
  CheckCircle, Add, ContentCopy, OpenInNew, ExpandMore, ExpandLess,
  HourglassEmpty, Error as ErrorIcon, Shield, AccountBalanceWallet,
  Refresh,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { walletAPI, PortfolioChain } from '@/lib/api';

// ─── Chain visual config ──────────────────────────────────────────────────────

const CHAIN_COLOR: Record<string, { color: string; gradient: string; icon: string }> = {
  EVM:    { color: '#627EEA', gradient: 'linear-gradient(135deg,#627EEA,#3B5BDB)', icon: '⬡' },
  COSMOS: { color: '#6F73D2', gradient: 'linear-gradient(135deg,#6F73D2,#2E3148)', icon: '⚛' },
  SOLANA: { color: '#9945FF', gradient: 'linear-gradient(135deg,#9945FF,#14F195)', icon: '◎' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(addr: string, h = 8, t = 6) {
  if (!addr || addr.length <= h + t + 3) return addr;
  return `${addr.slice(0, h)}…${addr.slice(-t)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Tooltip title={ok ? 'Copied!' : 'Copy'}>
      <IconButton size="small" onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
        sx={{ color: ok ? 'success.main' : 'text.secondary' }}>
        <ContentCopy sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );
}

// ─── ChainRow ─────────────────────────────────────────────────────────────────

interface ChainRowProps {
  chain: PortfolioChain;
  onCreateWallet: (mpcChainType: string) => void;
  creating: boolean;
}

function ChainRow({ chain, onCreateWallet, creating }: ChainRowProps) {
  const theme = useTheme();
  const meta = CHAIN_COLOR[chain.mpc_chain_type] ?? CHAIN_COLOR.EVM;
  const [open, setOpen] = useState(chain.wallet?.status === 'active');
  const hasWallet = !!chain.wallet;
  const isActive = chain.wallet?.status === 'active';
  const isPending = chain.wallet?.status === 'pending';

  return (
    <Card sx={{
      mb: 1.5,
      border: `1px solid ${isActive ? alpha(meta.color, 0.3) : alpha(theme.palette.divider, 1)}`,
      borderRadius: 2.5,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: `0 4px 20px ${alpha(meta.color, 0.12)}` },
    }}>
      {/* ── Row header ── */}
      <Box
        onClick={() => hasWallet && setOpen(v => !v)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.75,
          cursor: hasWallet ? 'pointer' : 'default',
          bgcolor: isActive ? alpha(meta.color, 0.04) : 'transparent',
        }}
      >
        {/* Chain icon */}
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          background: meta.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {meta.icon}
        </Box>

        {/* Chain name + type */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography fontWeight={700} fontSize="0.95rem" noWrap>
              {chain.display_name}
            </Typography>
            <Chip label={chain.mpc_chain_type} size="small"
              sx={{ height: 18, fontSize: '0.65rem', bgcolor: alpha(meta.color, 0.1), color: meta.color, fontWeight: 700 }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {chain.native_symbol}
            {chain.coins.length > 1 && ` · ${chain.coins.length} tokens`}
          </Typography>
        </Box>

        {/* Right side: status or create button */}
        {isActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
            <Typography variant="caption" color="success.main" fontWeight={700}>Active</Typography>
            {open ? <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
                   : <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />}
          </Box>
        )}
        {isPending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <HourglassEmpty sx={{ color: 'warning.main', fontSize: 18 }} />
            <Typography variant="caption" color="warning.main" fontWeight={700}>Creating…</Typography>
          </Box>
        )}
        {chain.wallet?.status === 'failed' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <ErrorIcon sx={{ color: 'error.main', fontSize: 18 }} />
            <Typography variant="caption" color="error.main" fontWeight={700}>Failed</Typography>
            {open ? <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
                   : <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />}
          </Box>
        )}
        {!hasWallet && (
          <Button
            size="small" variant="outlined"
            startIcon={creating ? <CircularProgress size={12} color="inherit" /> : <Add />}
            disabled={creating}
            onClick={e => { e.stopPropagation(); onCreateWallet(chain.mpc_chain_type); }}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
              borderColor: meta.color, color: meta.color,
              '&:hover': { bgcolor: alpha(meta.color, 0.06), borderColor: meta.color } }}
          >
            {creating ? 'Creating…' : 'Create Wallet'}
          </Button>
        )}
      </Box>

      {/* ── Pending progress bar ── */}
      {isPending && <LinearProgress color="warning" sx={{ height: 2 }} />}

      {/* ── Expanded detail ── */}
      <Collapse in={open && hasWallet}>
        <Divider />
        <CardContent sx={{ pt: 2, pb: '16px !important' }}>
          {/* Address */}
          {chain.wallet?.public_address && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                Public Address
              </Typography>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.75, borderRadius: 1.5,
                bgcolor: alpha(meta.color, 0.06),
                border: `1px solid ${alpha(meta.color, 0.15)}`,
                maxWidth: '100%',
              }}>
                <Typography fontFamily="monospace" fontSize="0.82rem" noWrap sx={{ flex: 1 }}>
                  {truncate(chain.wallet.public_address)}
                </Typography>
                <CopyBtn text={chain.wallet.public_address} />
                {chain.explorer_url && (
                  <Tooltip title="View on explorer">
                    <IconButton size="small"
                      component="a" href={`${chain.explorer_url}/address/${chain.wallet.public_address}`} target="_blank"
                      sx={{ color: 'text.secondary' }}>
                      <OpenInNew sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}

          {/* Coins */}
          {chain.coins.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                Tokens
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {chain.coins.map(coin => (
                  <Box key={coin.coin_id} sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 1.5, py: 1, borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.action.hover, 0.5),
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        bgcolor: alpha(meta.color, 0.15),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 800, color: meta.color,
                      }}>
                        {coin.symbol.slice(0, 3)}
                      </Box>
                      <Box>
                        <Typography fontSize="0.85rem" fontWeight={600}>{coin.display_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{coin.symbol}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography fontSize="0.85rem" fontWeight={700}>
                        {parseFloat(coin.balance).toFixed(4)} {coin.symbol}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${coin.balance_usd}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}

// ─── WalletPage ───────────────────────────────────────────────────────────────

export default function WalletPage() {
  const theme = useTheme();
  const [chains, setChains] = useState<PortfolioChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null); // mpc_chain_type being created
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  const load = useCallback(async () => {
    try {
      const res = await walletAPI.getPortfolio();
      setChains(res.data.chains ?? []);
    } catch {
      setSnack({ open: true, msg: 'Failed to load portfolio.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll while any wallet is pending
  useEffect(() => {
    const hasPending = chains.some(c => c.wallet?.status === 'pending');
    if (!hasPending) return;
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [chains, load]);

  const handleCreate = async (mpcChainType: string) => {
    setCreating(mpcChainType);
    try {
      await walletAPI.createWallet(mpcChainType as any);
      await load();
      setSnack({ open: true, msg: 'Wallet created successfully!', severity: 'success' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to create wallet.';
      setSnack({ open: true, msg, severity: 'error' });
    } finally {
      setCreating(null);
    }
  };

  const activeCount = chains.filter(c => c.wallet?.status === 'active').length;
  const totalCount = chains.length;

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>
              Wallets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading…' : `${activeCount} of ${totalCount} networks active`}
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Summary bar ── */}
        {!loading && totalCount > 0 && (
          <Paper elevation={0} sx={{
            display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5, mb: 3,
            borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            bgcolor: alpha(theme.palette.success.main, 0.03),
          }}>
            <Shield sx={{ color: 'success.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700} color="success.dark">
                MPC Key Security
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Private keys are split across multiple nodes — no single point of failure.
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="h6" fontWeight={800} color="success.main">{activeCount}</Typography>
              <Typography variant="caption" color="text.secondary">active</Typography>
            </Box>
          </Paper>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2.5 }} />)}
          </Box>
        )}

        {/* ── Chain list ── */}
        {!loading && chains.map(chain => (
          <ChainRow
            key={chain.chain_id}
            chain={chain}
            onCreateWallet={handleCreate}
            creating={creating === chain.mpc_chain_type}
          />
        ))}

        {/* ── Empty state ── */}
        {!loading && chains.length === 0 && (
          <Paper elevation={0} sx={{
            p: 6, textAlign: 'center', borderRadius: 3,
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
          }}>
            <AccountBalanceWallet sx={{ fontSize: 56, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>No chains configured</Typography>
            <Typography variant="body2" color="text.secondary">
              Contact your administrator to configure supported networks.
            </Typography>
          </Paper>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
