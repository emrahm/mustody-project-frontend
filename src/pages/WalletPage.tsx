import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Card, CardContent,
  Avatar,
  alpha, CircularProgress, Tooltip, Skeleton,
  Alert, Snackbar, LinearProgress, Collapse, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment,
} from '@mui/material';
import {
  ContentCopy, OpenInNew, Error as ErrorIcon,
  Shield, AccountBalanceWallet, Refresh,
  ExpandMore, ExpandLess, Add, Send, InfoOutlined,
  WarningAmber, CheckCircleOutline,
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

// Chain-specific deposit instructions
const DEPOSIT_INSTRUCTIONS: Record<string, string[]> = {
  EVM: [
    'Only send tokens on the correct EVM network (e.g. Ethereum, BNB Chain, Polygon).',
    'Sending on the wrong network will result in permanent loss of funds.',
    'EVM networks share the same address — double-check the network in your wallet.',
    'Minimum deposit: check the token\'s network fee before sending.',
  ],
  COSMOS: [
    'Only send via the Cosmos IBC network. Do not use EVM bridges.',
    'Ensure you select the correct IBC channel when transferring from exchanges.',
    'ATOM and IBC tokens require the correct memo field on some exchanges.',
    'Transfers typically confirm within 30 seconds.',
  ],
  SOLANA: [
    'Only send SOL or SPL tokens on the Solana network.',
    'Do not send from Ethereum or other EVM chains directly.',
    'Solana transactions are fast — usually confirmed in under 30 seconds.',
    'Ensure your sending wallet supports SPL token transfers.',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    <Tooltip title={ok ? 'Copied!' : 'Copy address'}>
      <IconButton size="small"
        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
        sx={{ color: ok ? 'success.main' : 'text.disabled', p: 0.5 }}>
        <ContentCopy sx={{ fontSize: 13 }} />
      </IconButton>
    </Tooltip>
  );
}

// ─── Deposit Dialog ───────────────────────────────────────────────────────────

// Per-chain token network info shown in deposit dialog
const TOKEN_NETWORK_INFO: Record<string, { network: string; standard: string; note: string }[]> = {
  EVM: [
    { network: 'Ethereum Mainnet', standard: 'ERC-20', note: 'Native ETH and all ERC-20 tokens (USDT, USDC, WBTC…)' },
    { network: 'BNB Smart Chain', standard: 'BEP-20', note: 'BNB and BEP-20 tokens. Same address as Ethereum.' },
    { network: 'Polygon', standard: 'ERC-20 (Polygon)', note: 'MATIC and Polygon ERC-20 tokens.' },
    { network: 'Arbitrum / Optimism / Base', standard: 'ERC-20 (L2)', note: 'Layer-2 EVM tokens. Same address, different network.' },
  ],
  COSMOS: [
    { network: 'Cosmos Hub', standard: 'IBC', note: 'ATOM via IBC. Use correct channel from your exchange.' },
  ],
  SOLANA: [
    { network: 'Solana', standard: 'SPL Token', note: 'SOL and all SPL tokens (USDC, USDT on Solana).' },
  ],
};

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  coin: PortfolioCoin | null;
  chain: PortfolioChain | null;
  onCreateWallet: () => void;
}

function DepositDialog({ open, onClose, coin, chain, onCreateWallet }: DepositDialogProps) {
  const accent = CHAIN_COLOR[chain?.mpc_chain_type ?? 'EVM'];
  const walletStatus = chain?.wallet?.status;
  const hasActiveWallet = walletStatus === 'active' && !!chain?.wallet?.public_address;
  const isPending = walletStatus === 'pending';
  const isFailed = walletStatus === 'failed';
  const noWallet = !chain?.wallet;
  const instructions = DEPOSIT_INSTRUCTIONS[chain?.mpc_chain_type ?? 'EVM'] ?? [];
  const tokenNetworks = TOKEN_NETWORK_INFO[chain?.mpc_chain_type ?? 'EVM'] ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ImgAvatar src={COIN_ICON[coin?.symbol.toUpperCase() ?? '']} alt={coin?.symbol ?? ''} size={30} fallback={coin?.symbol?.slice(0,2) ?? ''} />
          <Box>
            <Typography fontWeight={800} fontSize="1rem" lineHeight={1.2}>Deposit {coin?.symbol}</Typography>
            <Typography variant="caption" color="text.secondary">{coin?.display_name}</Typography>
          </Box>
          <Chip label={chain?.display_name} size="small"
            sx={{ ml: 'auto', fontSize: '0.7rem', bgcolor: accent.bg, color: accent.color, fontWeight: 700 }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {isPending && (
          <Alert severity="warning" sx={{ borderRadius: 2, mb: 1 }}>
            Your {chain?.mpc_chain_type} wallet is being created. Please wait a moment and refresh.
          </Alert>
        )}
        {isFailed && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2, textAlign: 'left' }}>
              Wallet creation failed. You can retry to create a new wallet — your previous attempt will be reset.
            </Alert>
            <Button variant="contained" startIcon={<Add />}
              onClick={() => { onClose(); onCreateWallet(); }}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accent.color,
                '&:hover': { bgcolor: accent.color, filter: 'brightness(1.1)' } }}>
              Retry Wallet Creation
            </Button>
          </Box>
        )}
        {noWallet && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: accent.bg }}>
              <AccountBalanceWallet sx={{ fontSize: 28, color: accent.color }} />
            </Avatar>
            <Typography fontWeight={700} gutterBottom>No wallet created yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You need a {chain?.mpc_chain_type} wallet to deposit {coin?.symbol}.
              Your address will be generated securely using MPC technology.
            </Typography>
            <Button variant="contained" startIcon={<Add />}
              onClick={() => { onClose(); onCreateWallet(); }}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accent.color,
                '&:hover': { bgcolor: accent.color, filter: 'brightness(1.1)' } }}>
              Create {chain?.mpc_chain_type} Wallet
            </Button>
          </Box>
        )}
        {hasActiveWallet && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Send <strong>{coin?.symbol}</strong> to this address on the <strong>{chain?.display_name}</strong> network only.
            </Typography>

            {/* Address card */}
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: alpha(accent.color, 0.4) }}>
              <CardContent sx={{ py: '12px !important', px: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Your {chain?.mpc_chain_type} Deposit Address
                </Typography>
                <Typography fontFamily="'Fira Code','JetBrains Mono',monospace"
                  fontSize="0.82rem" sx={{ wordBreak: 'break-all', lineHeight: 1.8, mt: 0.5 }}>
                  {chain?.wallet?.public_address}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                  <CopyBtn text={chain?.wallet?.public_address ?? ''} />
                  <Typography variant="caption" color="text.disabled">Copy address</Typography>
                  {chain?.explorer_url && (
                    <Tooltip title="View on block explorer">
                      <IconButton size="small" component="a"
                        href={`${chain.explorer_url}/address/${chain.wallet?.public_address}`}
                        target="_blank" sx={{ color: 'text.disabled', p: 0.5, ml: 'auto' }}>
                        <OpenInNew sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Supported networks / token standards */}
            {tokenNetworks.length > 0 && (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <InfoOutlined sx={{ fontSize: 15, color: accent.color }} />
                  <Typography variant="caption" fontWeight={700} color={accent.color} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Supported Networks & Token Standards
                  </Typography>
                </Box>
                {tokenNetworks.map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'flex-start' }}>
                    <Chip label={row.standard} size="small"
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: accent.bg, color: accent.color, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.primary">{row.network}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{row.note}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* General instructions */}
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <InfoOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Important
                </Typography>
              </Box>
              {instructions.map((line, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.4 }}>
                  <Typography variant="caption" color={accent.color} sx={{ flexShrink: 0 }}>•</Typography>
                  <Typography variant="caption" color="text.secondary">{line}</Typography>
                </Box>
              ))}
            </Box>

            <Alert severity="warning" icon={<WarningAmber fontSize="small" />}
              sx={{ mt: 1.5, borderRadius: 2, fontSize: '0.75rem' }}>
              <strong>Wrong network = lost funds.</strong> Always verify the network before sending.
            </Alert>
          </Box>
        )}
      </DialogContent>

      {(hasActiveWallet || isPending || isFailed) && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ─── Withdraw Dialog ──────────────────────────────────────────────────────────
interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  coin: PortfolioCoin | null;
  chain: PortfolioChain | null;
}

function WithdrawDialog({ open, onClose, coin, chain }: WithdrawDialogProps) {
  const accent = CHAIN_COLOR[chain?.mpc_chain_type ?? 'EVM'];
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [addrErr, setAddrErr] = useState('');
  const [amtErr, setAmtErr] = useState('');
  const balance = parseFloat(coin?.balance ?? '0');

  const handleClose = () => {
    setAddress(''); setAmount(''); setStep('form');
    setAddrErr(''); setAmtErr(''); setSubmitting(false);
    onClose();
  };

  const validate = () => {
    let ok = true;
    if (!address.trim()) { setAddrErr('Recipient address is required.'); ok = false; }
    else setAddrErr('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setAmtErr('Enter a valid amount.'); ok = false; }
    else if (amt > balance) { setAmtErr(`Insufficient balance. Max: ${balance.toFixed(6)} ${coin?.symbol}`); ok = false; }
    else setAmtErr('');
    return ok;
  };

  const handleReview = () => { if (validate()) setStep('confirm'); };

  const handleConfirm = async () => {
    setSubmitting(true);
    // Withdrawal API integration point — backend endpoint TBD
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    handleClose();
  };

  const hasWallet = !!chain?.wallet?.public_address;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ImgAvatar src={COIN_ICON[coin?.symbol.toUpperCase() ?? '']} alt={coin?.symbol ?? ''} size={30} fallback={coin?.symbol?.slice(0,2) ?? ''} />
          <Box>
            <Typography fontWeight={800} fontSize="1rem" lineHeight={1.2}>
              Withdraw {coin?.symbol}
            </Typography>
            <Typography variant="caption" color="text.secondary">{coin?.display_name}</Typography>
          </Box>
          <Chip label={chain?.display_name} size="small"
            sx={{ ml: 'auto', fontSize: '0.7rem', bgcolor: accent.bg, color: accent.color, fontWeight: 700 }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {!hasWallet ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            You don't have a {chain?.mpc_chain_type} wallet yet. Create one to withdraw funds.
          </Alert>
        ) : step === 'form' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">Available Balance</Typography>
              <Typography fontWeight={700} fontSize="1.1rem">
                {balance.toFixed(6)} <span style={{ color: accent.color }}>{coin?.symbol}</span>
              </Typography>
              {coin?.balance_usd && (
                <Typography variant="caption" color="text.secondary">≈ ${coin.balance_usd} USD</Typography>
              )}
            </Box>

            <TextField
              label="Recipient Address"
              placeholder={chain?.mpc_chain_type === 'EVM' ? '0x...' : chain?.mpc_chain_type === 'SOLANA' ? 'Solana address...' : 'cosmos1...'}
              value={address}
              onChange={e => { setAddress(e.target.value); setAddrErr(''); }}
              error={!!addrErr}
              helperText={addrErr || `Enter the ${chain?.mpc_chain_type} address to send to`}
              fullWidth
              size="small"
              InputProps={{ sx: { fontFamily: "'Fira Code','JetBrains Mono',monospace", fontSize: '0.82rem' } }}
            />

            <TextField
              label={`Amount (${coin?.symbol})`}
              placeholder="0.00"
              value={amount}
              onChange={e => { setAmount(e.target.value); setAmtErr(''); }}
              error={!!amtErr}
              helperText={amtErr}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => setAmount(balance.toFixed(6))}
                      sx={{ fontSize: '0.7rem', minWidth: 0, px: 1, color: accent.color }}>
                      MAX
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            <Alert severity="warning" icon={<WarningAmber fontSize="small" />}
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
              Withdrawals are irreversible. Verify the recipient address carefully before proceeding.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" icon={<CheckCircleOutline fontSize="small" />}
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
              Please review your withdrawal details before confirming.
            </Alert>
            {[
              { label: 'Network', value: chain?.display_name },
              { label: 'Token', value: `${coin?.display_name} (${coin?.symbol})` },
              { label: 'Amount', value: `${amount} ${coin?.symbol}` },
              { label: 'Recipient', value: truncate(address, 10, 8) },
            ].map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                px: 2, py: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={600}
                  sx={{ fontFamily: row.label === 'Recipient' ? "'Fira Code',monospace" : undefined }}>
                  {row.value}
                </Typography>
              </Box>
            ))}
            <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
              <strong>This action cannot be undone.</strong> Funds sent to the wrong address are unrecoverable.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }} disabled={submitting}>
          Cancel
        </Button>
        {hasWallet && step === 'form' && (
          <Button onClick={handleReview} variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            Review Withdrawal
          </Button>
        )}
        {hasWallet && step === 'confirm' && (
          <>
            <Button onClick={() => setStep('form')} variant="outlined" sx={{ borderRadius: 2 }} disabled={submitting}>
              Back
            </Button>
            <Button onClick={handleConfirm} variant="contained" disabled={submitting}
              startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
              {submitting ? 'Sending…' : 'Confirm Withdrawal'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── ChainCard ────────────────────────────────────────────────────────────────
interface ChainCardProps {
  chain: PortfolioChain;
  onCreateWallet: (type: string) => void;
  creating: boolean;
  onDeposit: (coin: PortfolioCoin, chain: PortfolioChain) => void;
  onWithdraw: (coin: PortfolioCoin, chain: PortfolioChain) => void;
}

function ChainCard({ chain, onCreateWallet, creating, onDeposit, onWithdraw }: ChainCardProps) {
  const accent = CHAIN_COLOR[chain.mpc_chain_type] ?? CHAIN_COLOR.EVM;
  const isActive = chain.wallet?.status === 'active';
  const isPending = chain.wallet?.status === 'pending';
  const isFailed = chain.wallet?.status === 'failed';
  const [open, setOpen] = useState(isActive);

  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 2.5, overflow: 'hidden',
      borderColor: open && isActive ? alpha(accent.color, 0.35) : 'divider',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      '&:hover': { boxShadow: `0 4px 20px ${alpha(accent.color, 0.1)}` },
    }}>
      {/* Chain header */}
      <Box onClick={() => setOpen(v => !v)} sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.75,
        cursor: 'pointer',
        bgcolor: open ? alpha(accent.color, 0.05) : 'transparent',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: alpha(accent.color, 0.07) },
      }}>
        <ImgAvatar src={CHAIN_ICON[chain.chain_id]} alt={chain.display_name} size={40}
          fallback={chain.chain_id.slice(0, 2).toUpperCase()} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography fontWeight={700} fontSize="0.95rem">{chain.display_name}</Typography>
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
                <Tooltip title="View on explorer">
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
              {chain.native_symbol}{chain.coins.length > 1 ? ` · ${chain.coins.length} tokens` : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {isActive && (
            <Chip icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', ml: '6px !important' }} />}
              label="Active" size="small"
              sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 700, fontSize: '0.72rem' }} />
          )}
          {isPending && (
            <Chip icon={<CircularProgress size={10} sx={{ color: '#f59e0b', ml: '6px !important' }} />}
              label="Creating…" size="small"
              sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700, fontSize: '0.72rem' }} />
          )}
          {isFailed && (
            <Chip icon={<ErrorIcon sx={{ fontSize: '14px !important', ml: '4px !important' }} />}
              label="Failed" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          )}
          {isFailed && !creating && (
            <Button size="small" variant="outlined"
              onClick={e => { e.stopPropagation(); onCreateWallet(chain.mpc_chain_type); }}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.72rem',
                borderColor: '#ef4444', color: '#ef4444',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' } }}>
              Retry
            </Button>
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
          {open ? <ExpandLess sx={{ fontSize: 18, color: 'text.disabled' }} />
                : <ExpandMore sx={{ fontSize: 18, color: 'text.disabled' }} />}
        </Box>
      </Box>

      {isPending && <LinearProgress color="warning" sx={{ height: 2 }} />}

      {/* Coin list — indented with border */}
      <Collapse in={open}>
        <Divider />
        <Box sx={{ ml: 2, mr: 2, my: 1.5, border: '1px solid', borderColor: alpha(accent.color, 0.2), borderRadius: 2, overflow: 'hidden' }}>
          {chain.coins.map((coin, idx) => (
            <Box key={coin.coin_id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: 'background.paper',
                borderBottom: idx < chain.coins.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <ImgAvatar src={COIN_ICON[coin.symbol.toUpperCase()]} alt={coin.symbol} size={32}
                fallback={coin.symbol.slice(0, 3)} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontSize="0.88rem" fontWeight={600} noWrap>{coin.display_name}</Typography>
                <Typography variant="caption" color="text.secondary">{coin.symbol}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography fontSize="0.88rem" fontWeight={700}>{parseFloat(coin.balance).toFixed(4)}</Typography>
                <Typography variant="caption" color="text.secondary">${coin.balance_usd}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                <Button size="small" variant="outlined"
                  onClick={() => onDeposit(coin, chain)}
                  sx={{ minWidth: 80, px: 1, py: 0.3, borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 800, lineHeight: 1.4,
                    color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: 'rgba(22,163,74,0.08)', borderColor: '#16a34a' } }}>
                  + Deposit
                </Button>
                <Button size="small" variant="outlined"
                  onClick={() => onWithdraw(coin, chain)}
                  sx={{ minWidth: 80, px: 1, py: 0.3, borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 800, lineHeight: 1.4,
                    color: '#ef4444', borderColor: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' } }}>
                  − Withdraw
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Card>
  );
}

// ─── WalletPage ───────────────────────────────────────────────────────────────
export default function WalletPage() {
  const [chains, setChains] = useState<PortfolioChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [depositState, setDepositState] = useState<{ coin: PortfolioCoin; chain: PortfolioChain } | null>(null);
  const [withdrawState, setWithdrawState] = useState<{ coin: PortfolioCoin; chain: PortfolioChain } | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; ok: boolean }>({ open: false, msg: '', ok: true });

  const load = useCallback(async () => {
    try {
      const res = await walletAPI.getPortfolio();
      setChains(res.data.data?.chains ?? []);
      setError(null);
    } catch (e: any) {
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
      setSnack({ open: true, msg: 'Wallet creation initiated!', ok: true });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Failed to create wallet.', ok: false });
    } finally {
      setCreating(null);
    }
  };

  const activeCount = chains.filter(c => c.wallet?.status === 'active').length;

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: 'auto' }}>
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

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
            action={<Button size="small" color="inherit" onClick={() => { setLoading(true); load(); }}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {!loading && !error && activeCount > 0 && (
          <Alert severity="success" icon={<Shield fontSize="small" />}
            sx={{ mb: 2.5, borderRadius: 2, '& .MuiAlert-message': { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' } }}>
            <span>MPC secured — private keys split across multiple nodes</span>
            <Chip label={`${activeCount} active`} size="small" color="success" sx={{ ml: 1, fontWeight: 700 }} />
          </Alert>
        )}

        {loading && [1, 2, 3].map(i => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 1.5, borderRadius: 2.5 }} />
        ))}

        {!loading && !error && chains.map(chain => (
          <ChainCard key={chain.chain_id} chain={chain}
            onCreateWallet={handleCreate}
            creating={creating === chain.mpc_chain_type}
            onDeposit={(coin, ch) => setDepositState({ coin, chain: ch })}
            onWithdraw={(coin, ch) => setWithdrawState({ coin, chain: ch })}
          />
        ))}

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

      <WithdrawDialog
        open={!!withdrawState}
        onClose={() => setWithdrawState(null)}
        coin={withdrawState?.coin ?? null}
        chain={withdrawState?.chain ?? null}
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
