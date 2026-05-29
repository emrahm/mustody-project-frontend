import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Card, CardContent,
  List, ListItem, ListItemAvatar, ListItemText, Avatar,
  alpha, useTheme, CircularProgress, Tooltip, Skeleton,
  Alert, Snackbar, LinearProgress, Collapse, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Add, ContentCopy, OpenInNew, Error as ErrorIcon,
  AccountBalanceWallet, Refresh, South,
  ExpandMore, ExpandLess,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { walletAPI, PortfolioChain, PortfolioCoin } from '@/lib/api';

// ─── Icon CDN ─────────────────────────────────────────────────────────────────

const CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';
const LOGOS = 'https://cryptologos.cc/logos';

const CHAIN_ICON: Record<string, string> = {
  'ethereum-mainnet':  `${LOGOS}/ethereum-eth-logo.svg`,
  'ethereum-sepolia':  `${LOGOS}/ethereum-eth-logo.svg`,
  'bsc-mainnet':       `${LOGOS}/bnb-bnb-logo.svg`,
  'bsc-testnet':       `${LOGOS}/bnb-bnb-logo.svg`,
  'polygon-mainnet':   `${LOGOS}/polygon-matic-logo.svg`,
  'polygon-amoy':      `${LOGOS}/polygon-matic-logo.svg`,
  'arbitrum-mainnet':  `${LOGOS}/arbitrum-arb-logo.svg`,
  'optimism-mainnet':  `${LOGOS}/optimism-ethereum-op-logo.svg`,
  'base-mainnet':      'https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg',
  'avalanche-mainnet': `${LOGOS}/avalanche-avax-logo.svg`,
  'cosmos-mainnet':    `${LOGOS}/cosmos-atom-logo.svg`,
  'solana-mainnet':    `${LOGOS}/solana-sol-logo.svg`,
  'solana-devnet':     `${LOGOS}/solana-sol-logo.svg`,
};

const COIN_ICON: Record<string, string> = {
  ETH:  `${CDN}/eth.svg`,
  BNB:  `${CDN}/bnb.svg`,
  SOL:  `${CDN}/sol.svg`,
  ATOM: `${CDN}/atom.svg`,
  AVAX: `${CDN}/avax.svg`,
  POL:  `${CDN}/matic.svg`,
  MATIC:`${CDN}/matic.svg`,
  USDT: `${CDN}/usdt.svg`,
  USDC: `${CDN}/usdc.svg`,
  WBTC: `${CDN}/wbtc.svg`,
  ARB:  `${LOGOS}/arbitrum-arb-logo.svg`,
  OP:   `${LOGOS}/optimism-ethereum-op-logo.svg`,
};

const CHAIN_COLOR: Record<string, { color: string; bg: string }> = {
  EVM:    { color: '#627EEA', bg: 'rgba(98,126,234,0.12)' },
  COSMOS: { color: '#6F73D2', bg: 'rgba(111,115,210,0.12)' },
  SOLANA: { color: '#9945FF', bg: 'rgba(153,69,255,0.12)' },
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function ImgAvatar({ src, alt, size = 36, fallback }: { src?: string; alt: string; size?: number; fallback: string }) {
  const [err, setErr] = useState(false);
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: 'action.selected', fontSize: size * 0.38, fontWeight: 700 }}
      src={(!err && src) ? src : undefined}
      imgProps={{ onError: () => setErr(true) }}>
      {fallback}
    </Avatar>
  );
}

function truncate(addr: string, h = 6, t = 4) {
  if (!addr || addr.length <= h + t + 3) return addr;
  return `${addr.slice(0, h)}…${addr.slice(-t)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Tooltip title={ok ? 'Copied!' : 'Copy'}>
      <IconButton size="small"
        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
        sx={{ color: ok ? 'success.main' : 'text.disabled', p: 0.5 }}>
        <ContentCopy sx={{ fontSize: 13 }} />
      </IconButton>
    </Tooltip>
  );
}

import { QRCodeSVG } from 'qrcode.react';

// ─── Deposit Dialog ───────────────────────────────────────────────────────────

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  coin: PortfolioCoin | null;
  chain: PortfolioChain | null;
  onCreateWallet: () => void;
}

function DepositDialog({ open, onClose, coin, chain, onCreateWallet }: DepositDialogProps) {
  const theme = useTheme();
  const accent = CHAIN_COLOR[chain?.mpc_chain_type ?? 'EVM'];
  const hasWallet = !!chain?.wallet?.public_address;
  const address = chain?.wallet?.public_address ?? '';

  const STEPS = [
    { n: '1', label: 'Copy your address', desc: 'Use the address below or scan the QR code from your sending wallet.' },
    { n: '2', label: `Select ${chain?.display_name} network`, desc: `On the sending side, make sure you choose the exact same network. Sending on the wrong network will result in permanent loss.` },
    { n: '3', label: `Send ${coin?.symbol ?? ''}`, desc: 'Initiate the transfer. Funds typically arrive within a few minutes depending on network congestion.' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ImgAvatar src={COIN_ICON[coin?.symbol.toUpperCase() ?? '']} alt={coin?.symbol ?? ''} size={28} fallback={coin?.symbol.slice(0,2) ?? ''} />
          <Typography fontWeight={800} fontSize="1rem">Deposit {coin?.symbol}</Typography>
          <Chip label={chain?.display_name} size="small" sx={{ ml: 'auto', fontSize: '0.7rem' }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {hasWallet ? (
          <Box>
            {/* QR + address */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
              {/* QR code */}
              <Box sx={{
                p: 1.5, borderRadius: 2, border: `1px solid ${alpha(accent.color, 0.25)}`,
                bgcolor: '#fff', flexShrink: 0,
              }}>
                <QRCodeSVG value={address} size={110} />
              </Box>

              {/* Address box */}
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                  Your {chain?.mpc_chain_type} address
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 2, borderColor: alpha(accent.color, 0.3) }}>
                  <CardContent sx={{ py: '10px !important', px: 1.5 }}>
                    <Typography fontFamily="'Fira Code','JetBrains Mono',monospace"
                      fontSize="0.75rem" sx={{ wordBreak: 'break-all', lineHeight: 1.8, color: 'text.primary' }}>
                      {address}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                      <CopyBtn text={address} />
                      <Typography variant="caption" color="text.disabled">Copy full address</Typography>
                      {chain?.explorer_url && (
                        <Tooltip title="View on explorer">
                          <IconButton size="small" component="a"
                            href={`${chain.explorer_url}/address/${address}`}
                            target="_blank" sx={{ color: 'text.disabled', p: 0.5, ml: 'auto' }}>
                            <OpenInNew sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* MPC security note */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" fontSize="0.72rem">
                    MPC-secured — private key is never stored in one place
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Steps */}
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
              How to deposit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {STEPS.map(s => (
                <Box key={s.n} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    bgcolor: alpha(accent.color, 0.15), color: accent.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800,
                  }}>{s.n}</Box>
                  <Box>
                    <Typography fontSize="0.82rem" fontWeight={700}>{s.label}</Typography>
                    <Typography fontSize="0.78rem" color="text.secondary" lineHeight={1.5}>{s.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Warning */}
            <Alert severity="warning" icon={false} sx={{ borderRadius: 2, fontSize: '0.78rem', py: 1 }}>
              ⚠️ Only send <strong>{coin?.symbol}</strong> on the <strong>{chain?.display_name}</strong> network.
              Sending any other asset or using a different network will result in <strong>permanent loss of funds</strong>.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: alpha(accent.color, 0.12) }}>
              <AccountBalanceWallet sx={{ fontSize: 28, color: accent.color }} />
            </Avatar>
            <Typography fontWeight={700} gutterBottom>No wallet yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a {chain?.mpc_chain_type} wallet to deposit {coin?.symbol}.
            </Typography>
            <Button variant="contained" startIcon={<Add />}
              onClick={() => { onClose(); onCreateWallet(); }}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accent.color,
                '&:hover': { bgcolor: accent.color, filter: 'brightness(1.1)' } }}>
              Create Wallet
            </Button>
          </Box>
        )}
      </DialogContent>

      {hasWallet && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ borderRadius: 2 }}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ─── ChainCard ────────────────────────────────────────────────────────────────

interface ChainCardProps {
  chain: PortfolioChain;
  onCreateWallet: (type: string) => void;
  creating: boolean;
  onDeposit: (coin: PortfolioCoin, chain: PortfolioChain) => void;
}

function ChainCard({ chain, onCreateWallet, creating, onDeposit }: ChainCardProps) {
  const theme = useTheme();
  const accent = CHAIN_COLOR[chain.mpc_chain_type] ?? CHAIN_COLOR.EVM;
  const isActive = chain.wallet?.status === 'active';
  const isPending = chain.wallet?.status === 'pending';
  const isFailed = chain.wallet?.status === 'failed';
  const [open, setOpen] = useState(false);
  const [coins, setCoins] = useState<PortfolioCoin[]>(chain.coins);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!isActive || !chain.wallet?.id) return;
    setBalanceLoading(true);
    try {
      const res = await walletAPI.getBalance(chain.wallet.id, chain.chain_id);
      const balances: Record<string, { balance: string; balance_usd?: string }> = {};
      for (const b of (res.data.data ?? [])) {
        balances[b.symbol] = { balance: b.balance, balance_usd: b.balance_usd };
      }
      setCoins(prev => prev.map(c => balances[c.symbol]
        ? { ...c, balance: balances[c.symbol].balance, balance_usd: balances[c.symbol].balance_usd ?? c.balance_usd }
        : c
      ));
    } finally {
      setBalanceLoading(false);
    }
  }, [chain, isActive]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && isActive) fetchBalances();
  };

  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 2.5, overflow: 'hidden',
      borderColor: open && isActive ? alpha(accent.color, 0.35) : 'divider',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      '&:hover': { boxShadow: `0 4px 20px ${alpha(accent.color, 0.1)}` },
    }}>
      {/* ── Chain header — clickable ── */}
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.75,
          cursor: 'pointer',
          bgcolor: open ? alpha(accent.color, 0.05) : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: alpha(accent.color, 0.07) },
        }}
      >
        <ImgAvatar src={CHAIN_ICON[chain.chain_id]} alt={chain.display_name} size={40}
          fallback={chain.chain_id.slice(0, 2).toUpperCase()} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
              {chain.display_name}
            </Typography>
            <Chip label={chain.mpc_chain_type} size="small" sx={{
              height: 18, fontSize: '0.62rem', fontWeight: 700,
              bgcolor: accent.bg, color: accent.color,
            }} />
          </Box>
          {isActive && chain.wallet?.public_address ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography fontFamily="'Fira Code','JetBrains Mono',monospace"
                fontSize="0.72rem" color="text.secondary" noWrap>
                {truncate(chain.wallet.public_address)}
              </Typography>
              <CopyBtn text={chain.wallet.public_address} />
              {chain.explorer_url && (
                <Tooltip title="Explorer">
                  <IconButton size="small" component="a"
                    href={`${chain.explorer_url}/address/${chain.wallet.public_address}`}
                    target="_blank" sx={{ color: 'text.disabled', p: 0.25 }}>
                    <OpenInNew sx={{ fontSize: 12 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {chain.native_symbol}{coins.length > 1 ? ` · ${coins.length} tokens` : ''}
            </Typography>
          )}
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {isActive && (
            <Chip
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', ml: '6px !important' }} />}
              label="Active" size="small"
              sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 700, fontSize: '0.72rem' }}
            />
          )}
          {isPending && (
            <Chip
              icon={<CircularProgress size={10} sx={{ color: '#f59e0b', ml: '6px !important' }} />}
              label="Creating…" size="small"
              sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700, fontSize: '0.72rem' }}
            />
          )}
          {isFailed && (
            <Chip icon={<ErrorIcon sx={{ fontSize: '14px !important', ml: '4px !important' }} />}
              label="Failed" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          )}
          {!chain.wallet && !creating && (
            <Button size="small" variant="outlined" startIcon={<Add />}
              onClick={e => { e.stopPropagation(); onCreateWallet(chain.mpc_chain_type); }}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.72rem',
                borderColor: accent.color, color: accent.color,
                '&:hover': { bgcolor: accent.bg, borderColor: accent.color } }}>
              Create
            </Button>
          )}
          {!chain.wallet && creating && <CircularProgress size={18} sx={{ color: accent.color }} />}
          {open
            ? <ExpandLess sx={{ fontSize: 18, color: 'text.disabled' }} />
            : <ExpandMore sx={{ fontSize: 18, color: 'text.disabled' }} />}
        </Box>
      </Box>

      {isPending && <LinearProgress color="warning" sx={{ height: 2 }} />}

      {/* ── Coin list — accordion ── */}
      <Collapse in={open}>
        <Divider />
        <List disablePadding>
          {balanceLoading && <LinearProgress sx={{ height: 2 }} />}
          {coins.map((coin, idx) => (
            <ListItem key={coin.coin_id} divider={idx < coins.length - 1}
              secondaryAction={
                <Tooltip title={`Deposit ${coin.symbol}`}>
                  <IconButton size="small"
                    onClick={() => onDeposit(coin, chain)}
                    sx={{ bgcolor: accent.bg, color: accent.color, borderRadius: 1.5,
                      '&:hover': { bgcolor: alpha(accent.color, 0.22) } }}>
                    <South sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              }
              sx={{ py: 1.25, px: 2 }}>
              <ListItemAvatar sx={{ minWidth: 48 }}>
                <ImgAvatar src={COIN_ICON[coin.symbol.toUpperCase()]} alt={coin.symbol} size={34}
                  fallback={coin.symbol.slice(0, 3)} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography fontSize="0.88rem" fontWeight={600} color="text.primary">
                    {coin.display_name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {coin.symbol}
                  </Typography>
                }
              />
              <Box sx={{ textAlign: 'right', mr: 5 }}>
                <Typography fontSize="0.88rem" fontWeight={700} color="text.primary">
                  {parseFloat(coin.balance).toFixed(8)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ${coin.balance_usd}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Card>
  );
}

// ─── MpcInfoBanner ────────────────────────────────────────────────────────────

const MPC_MESSAGES = [
  {
    text: 'Your private key is never stored in one place. It is split across multiple independent nodes using Multi-Party Computation (MPC) — a cryptographic technique used by leading custodians worldwide.',
    icon: '🔐',
  },
  {
    text: 'Even if one node is compromised, your funds remain safe. No single party — not even Mustody — can access your key alone.',
    icon: '🛡️',
  },
  {
    text: 'Signing a transaction requires a threshold of nodes to cooperate in real time. This eliminates single points of failure and protects against insider threats.',
    icon: '🤝',
  },
  {
    text: 'This process takes a moment because the nodes are performing a Distributed Key Generation (DKG) ceremony — securely negotiating your key shares without ever assembling the full key.',
    icon: '⚙️',
  },
];

const SUMMARY_MESSAGE = { text: 'MPC secured — your keys are safe across distributed nodes.', icon: '✅' };

// words-per-minute reading speed → ms
function readingMs(text: string, wpm = 180) {
  return Math.max(3500, (text.split(/\s+/).length / wpm) * 60_000);
}

function MpcInfoBanner({ active }: { active: boolean }) {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (done) return;
    const msg = MPC_MESSAGES[idx];
    const ms = readingMs(msg.text);
    const t = setTimeout(() => {
      if (idx < MPC_MESSAGES.length - 1) {
        setVisible(false);
        setTimeout(() => { setIdx(i => i + 1); setVisible(true); }, 300);
      } else {
        setVisible(false);
        setTimeout(() => { setDone(true); setVisible(true); }, 300);
      }
    }, ms);
    return () => clearTimeout(t);
  }, [idx, done]);

  const current = done ? SUMMARY_MESSAGE : MPC_MESSAGES[idx];

  return (
    <Box sx={{ mb: 2.5, minHeight: 90 }}>
      <Collapse in={visible}>
        <Alert
        icon={<span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{current.icon}</span>}
        severity={done ? 'success' : 'info'}
        sx={{
          mb: 2.5, borderRadius: 2,
          bgcolor: done
            ? alpha(theme.palette.success.main, 0.08)
            : alpha(theme.palette.info.main, 0.08),
          border: `1px solid ${done
            ? alpha(theme.palette.success.main, 0.25)
            : alpha(theme.palette.info.main, 0.25)}`,
          '& .MuiAlert-message': { fontSize: '0.85rem', lineHeight: 1.6 },
        }}
      >
        {!done && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="info.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {active ? 'Creating your wallet…' : 'How MPC works'}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {idx + 1} / {MPC_MESSAGES.length}
            </Typography>
          </Box>
        )}
        {current.text}
      </Alert>
      </Collapse>
    </Box>
  );
}

// ─── WalletPage ───────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [chains, setChains] = useState<PortfolioChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [depositState, setDepositState] = useState<{ coin: PortfolioCoin; chain: PortfolioChain } | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; ok: boolean }>({ open: false, msg: '', ok: true });

  const load = useCallback(async () => {
    try {
      const res = await walletAPI.getPortfolio();
      setChains(res.data.data?.chains ?? []);
      setError(null);
    } catch (e: any) {
      console.error('walletAPI.getPortfolio:', e?.response?.data ?? e);
      setError(e?.response?.data?.message || 'Failed to load portfolio.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!chains.some(c => c.wallet?.status === 'pending')) return;
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [chains, load]);

  const handleCreate = async (mpcChainType: string) => {
    setCreating(mpcChainType);
    try {
      await walletAPI.createWallet(mpcChainType as any);
      await load();
      setSnack({ open: true, msg: 'Wallet created!', ok: true });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Failed to create wallet.', ok: false });
    } finally {
      setCreating(null);
    }
  };

  const activeCount = chains.filter(c => c.wallet?.status === 'active').length;

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Wallets</Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading…' : error ? 'Could not load' : `${activeCount} of ${chains.length} networks active`}
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => { setLoading(true); load(); }} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* MPC info banner */}
        {!loading && !error && <MpcInfoBanner active={!!creating} />}

        {/* Error */}
        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
            action={<Button size="small" color="inherit" onClick={() => { setLoading(true); load(); }}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {/* Skeletons */}
        {loading && [1, 2, 3].map(i => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 1.5, borderRadius: 2.5 }} />
        ))}

        {/* Chain cards */}
        {!loading && !error && chains.map(chain => (
          <ChainCard key={chain.chain_id} chain={chain}
            onCreateWallet={handleCreate}
            creating={creating === chain.mpc_chain_type}
            onDeposit={(coin, ch) => setDepositState({ coin, chain: ch })}
          />
        ))}

        {/* Empty */}
        {!loading && !error && chains.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography fontWeight={700} color="text.secondary">No chains configured</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Contact your administrator to configure supported networks.
            </Typography>
          </Box>
        )}
      </Box>

      <DepositDialog
        open={!!depositState}
        onClose={() => setDepositState(null)}
        coin={depositState?.coin ?? null}
        chain={depositState?.chain ?? null}
        onCreateWallet={() => {
          const t = depositState?.chain?.mpc_chain_type;
          setDepositState(null);
          if (t) handleCreate(t);
        }}
      />

      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.ok ? 'success' : 'error'}
          onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
