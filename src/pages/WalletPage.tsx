import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Card, CardContent,
  List, ListItem, ListItemAvatar, ListItemText, Avatar,
  alpha, useTheme, CircularProgress, Tooltip, Skeleton,
  Alert, Snackbar, LinearProgress, Collapse, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, Step, Stepper, StepLabel,
} from '@mui/material';
import {
  Add, ContentCopy, OpenInNew, Error as ErrorIcon,
  AccountBalanceWallet, Refresh, South, North,
  CheckCircle, ArrowBack, Launch, WarningAmber,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { walletAPI, PortfolioChain, PortfolioCoin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
  TRON:   { color: '#627EEA', bg: 'rgba(98,126,234,0.12)' },
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
  const accent = CHAIN_COLOR[chain?.mpc_chain_type ?? ''] ?? CHAIN_COLOR.EVM;
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

// ─── Withdraw Dialog ──────────────────────────────────────────────────────────

type WithdrawStep = 'form' | 'review' | '2fa' | 'setup_2fa' | 'processing' | 'done';

interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  coin: PortfolioCoin | null;
  chain: PortfolioChain | null;
  onSuccess?: (chainId: string) => void;
}

function WithdrawDialog({ open, onClose, coin, chain, onSuccess }: WithdrawDialogProps) {
  const theme = useTheme();
  const accent = CHAIN_COLOR[chain?.mpc_chain_type ?? ''] ?? CHAIN_COLOR.EVM;
  const { user } = useAuth();

  const [step, setStep] = useState<WithdrawStep>(() => user?.two_factor_enabled ? 'form' : 'setup_2fa');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [addrError, setAddrError] = useState('');
  const [amtError, setAmtError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [txHash, setTxHash] = useState('');
  const [failReason, setFailReason] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(user?.two_factor_enabled ? 'form' : 'setup_2fa');
      setToAddress('');
      setAmount('');
      setMemo('');
      setAddrError('');
      setAmtError('');
      setSessionId('');
      setTxHash('');
      setFailReason('');
      setTwoFACode('');
      setTwoFAError('');
      setFailedAttempts(0);
    }
  }, [open, user?.two_factor_enabled]);

  const balance = parseFloat(coin?.balance ?? '0');
  const amountNum = parseFloat(amount || '0');

  // Basic address validation — non-empty, reasonable length
  function validateAddress(addr: string): string {
    if (!addr.trim()) return 'Recipient address is required';
    if (addr.trim().length < 10) return 'Address appears too short';
    if (chain?.mpc_chain_type === 'EVM' && !/^0x[0-9a-fA-F]{40}$/.test(addr.trim()))
      return 'Invalid EVM address — must be 0x followed by 40 hex characters';
    return '';
  }

  function validateAmount(val: string): string {
    const n = parseFloat(val);
    if (!val || isNaN(n) || n <= 0) return 'Enter a valid amount greater than 0';
    if (n > balance) return `Exceeds available balance (${balance.toFixed(8)} ${coin?.symbol})`;
    return '';
  }

  function handleNext() {
    const ae = validateAddress(toAddress);
    const ve = validateAmount(amount);
    setAddrError(ae);
    setAmtError(ve);
    if (ae || ve) return;
    setStep('review');
  }

  async function handleConfirm() {
    if (!chain || !coin) return;
    setStep('2fa');
  }

  async function handleSubmitWithdraw() {
    if (!chain || !coin) return;
    if (!twoFACode.trim()) {
      setTwoFAError('Please enter your 6-digit authentication code');
      return;
    }
    setStep('processing');
    try {
      const res = await walletAPI.withdraw({
        chain_id: chain.chain_id,
        symbol: coin.symbol,
        to_address: toAddress.trim(),
        amount,
        memo: memo.trim() || undefined,
        two_fa_code: twoFACode.trim(),
      });
      const sid = res.data.data.session_id;
      setSessionId(sid);
      pollStatus(sid);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.setup_required) {
        setStep('setup_2fa');
        return;
      }
      if (data?.requires_2fa) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (data?.force_logout || newAttempts >= 3) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
          return;
        }
        setTwoFACode('');
        setTwoFAError(`Invalid authentication code. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? '' : 's'} remaining.`);
        setStep('2fa');
        return;
      }
      const msg = data?.message || e?.message || 'Withdrawal failed';
      setFailReason(msg);
      setStep('done');
    }
  }

  function pollStatus(sid: string) {
    let attempts = 0;
    const maxAttempts = 60; // 5 min at 5s intervals
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await walletAPI.withdrawStatus(sid);
        const { status, tx_hash, error } = res.data.data;
        if (status === 'COMPLETED') {
          clearInterval(interval);
          setTxHash(tx_hash ?? '');
          setStep('done');
          if (chain) onSuccess?.(chain.chain_id);
        } else if (status === 'FAILED' || status === 'TIMEOUT') {
          clearInterval(interval);
          setFailReason(error || 'Signing failed or timed out');
          setStep('done');
        }
      } catch {
        // network hiccup — keep polling
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setFailReason('Timed out waiting for MPC signature. Check your notifications for the final status.');
        setStep('done');
      }
    }, 5000);
  }

  const isEVM = chain?.mpc_chain_type === 'EVM';
  const explorerBase = chain?.explorer_url ?? '';
  const txUrl = txHash && explorerBase ? `${explorerBase}/tx/${txHash}` : '';

  const STEPS_LABELS = ['Details', 'Review', '2FA', 'Sign & Send'];
  const stepIndex = step === 'form' ? 0 : step === 'review' ? 1 : step === '2fa' ? 2 : 3;

  return (
    <Dialog open={open} onClose={step === 'processing' ? undefined : onClose}
      maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>

      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {step === 'review' && (
            <IconButton size="small" onClick={() => setStep('form')} sx={{ mr: -0.5 }}>
              <ArrowBack fontSize="small" />
            </IconButton>
          )}
          <ImgAvatar src={COIN_ICON[coin?.symbol.toUpperCase() ?? '']} alt={coin?.symbol ?? ''} size={28}
            fallback={coin?.symbol.slice(0, 2) ?? ''} />
          <Typography fontWeight={800} fontSize="1rem">
            {step === 'done' ? (txHash ? 'Withdrawal Sent' : 'Withdrawal Failed') : `Withdraw ${coin?.symbol}`}
          </Typography>
          <Chip label={chain?.display_name} size="small" sx={{ ml: 'auto', fontSize: '0.7rem' }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>

        {/* Step indicator */}
        {(step === 'form' || step === 'review' || step === '2fa' || step === 'processing') && (
          <Stepper activeStep={stepIndex} sx={{ mb: 2.5, mt: 0.5 }} alternativeLabel>
            {STEPS_LABELS.map(label => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.72rem' } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* ── STEP 1: Form ── */}
        {step === 'form' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Balance summary */}
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 2, py: 1.25, borderRadius: 2,
              bgcolor: alpha(accent.color, 0.08), border: `1px solid ${alpha(accent.color, 0.2)}`,
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Available Balance</Typography>
                <Typography fontWeight={800} fontSize="1.05rem" color={accent.color}>
                  {balance.toFixed(8)} {coin?.symbol}
                </Typography>
              </Box>
              <ImgAvatar src={COIN_ICON[coin?.symbol.toUpperCase() ?? '']} alt={coin?.symbol ?? ''} size={36}
                fallback={coin?.symbol.slice(0, 2) ?? ''} />
            </Box>

            {/* Recipient address */}
            <TextField
              label="Recipient Address"
              placeholder={isEVM ? '0x…' : 'Destination address'}
              value={toAddress}
              onChange={e => { setToAddress(e.target.value); setAddrError(''); }}
              error={!!addrError}
              helperText={addrError || `Enter a valid ${chain?.mpc_chain_type} address`}
              fullWidth
              size="small"
              inputProps={{ style: { fontFamily: "'Fira Code','JetBrains Mono',monospace", fontSize: '0.82rem' } }}
            />

            {/* Amount */}
            <TextField
              label={`Amount (${coin?.symbol})`}
              placeholder="0.00"
              value={amount}
              onChange={e => { setAmount(e.target.value); setAmtError(''); }}
              error={!!amtError}
              helperText={amtError || `Max: ${balance.toFixed(8)} ${coin?.symbol}`}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => setAmount(balance.toFixed(8))}
                      sx={{ minWidth: 0, px: 1, fontSize: '0.72rem', fontWeight: 700, color: accent.color }}>
                      MAX
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            {/* Memo (optional) */}
            <TextField
              label="Memo / Tag (optional)"
              placeholder="Payment reference or note"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              fullWidth
              size="small"
              helperText="Some exchanges require a memo/tag for deposits"
            />

            {/* Network warning */}
            <Alert severity="warning" icon={<WarningAmber fontSize="small" />}
              sx={{ borderRadius: 2, fontSize: '0.78rem', py: 0.75 }}>
              Only send to a <strong>{chain?.display_name}</strong> address.
              Sending to the wrong network results in <strong>permanent loss of funds</strong>.
            </Alert>
          </Box>
        )}

        {/* ── STEP 2: Review ── */}
        {step === 'review' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Review your withdrawal
            </Typography>

            {[
              { label: 'From', value: truncate(chain?.wallet?.public_address ?? '', 10, 6), mono: true },
              { label: 'To', value: truncate(toAddress, 10, 6), mono: true },
              { label: 'Amount', value: `${amount} ${coin?.symbol}` },
              { label: 'Network', value: chain?.display_name ?? '' },
              ...(memo ? [{ label: 'Memo', value: memo }] : []),
            ].map(row => (
              <Box key={row.label} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                px: 2, py: 1, borderRadius: 1.5,
                bgcolor: theme.palette.action.hover,
              }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{row.label}</Typography>
                <Typography fontSize="0.82rem" fontWeight={600}
                  fontFamily={row.mono ? "'Fira Code','JetBrains Mono',monospace" : undefined}>
                  {row.value}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 0.5 }} />

            {/* MPC signing note */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 1 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', mt: 0.75, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                This transaction will be signed by the MPC cluster — your private key is never assembled in one place.
                Signing typically takes 10–30 seconds.
              </Typography>
            </Box>

            <Alert severity="error" icon={false} sx={{ borderRadius: 2, fontSize: '0.78rem', py: 0.75 }}>
              ⚠️ <strong>This action is irreversible.</strong> Once broadcast, the transaction cannot be cancelled.
              Verify the recipient address carefully before confirming.
            </Alert>
          </Box>
        )}

        {/* ── STEP: Setup 2FA required ── */}
        {step === 'setup_2fa' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', py: 2, textAlign: 'center' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(245,158,11,0.12)' }}>
              <span style={{ fontSize: '1.6rem' }}>🔒</span>
            </Avatar>
            <Typography fontWeight={700}>Two-Factor Authentication Required</Typography>
            <Typography variant="body2" color="text.secondary">
              Withdrawals require 2FA to be enabled on your account. Please set it up first, then try again.
            </Typography>
            <Button
              variant="contained"
              href="/settings"
              onClick={onClose}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            >
              Enable Two-Factor Authentication
            </Button>
          </Box>
        )}

        {/* ── STEP 3: 2FA ── */}
        {step === '2fa' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', py: 1 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(accent.color, 0.12) }}>
              <span style={{ fontSize: '1.6rem' }}>🔐</span>
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography fontWeight={700} gutterBottom>Two-Factor Authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                Enter the 6-digit code from your authenticator app to confirm this withdrawal.
              </Typography>
            </Box>
            <TextField
              label="Authentication Code"
              placeholder="000000"
              value={twoFACode}
              onChange={e => { setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTwoFAError(''); }}
              error={!!twoFAError}
              helperText={twoFAError}
              inputProps={{ inputMode: 'numeric', style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em', fontFamily: 'monospace' } }}
              sx={{ width: 220 }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSubmitWithdraw(); }}
            />
          </Box>
        )}

        {/* ── STEP 4: Processing ── */}
        {step === 'processing' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress size={52} sx={{ color: accent.color, mb: 2 }} />
            <Typography fontWeight={700} gutterBottom>Signing in progress…</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              The MPC cluster is signing your transaction. This usually takes 10–30 seconds.
            </Typography>
            {sessionId && (
              <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                Session: {truncate(sessionId, 8, 4)}
              </Typography>
            )}
            <LinearProgress sx={{ mt: 2.5, borderRadius: 1, bgcolor: alpha(accent.color, 0.15),
              '& .MuiLinearProgress-bar': { bgcolor: accent.color } }} />
          </Box>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 'done' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {txHash ? (
              <>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'rgba(34,197,94,0.12)' }}>
                  <CheckCircle sx={{ fontSize: 32, color: '#22c55e' }} />
                </Avatar>
                <Typography fontWeight={800} fontSize="1.05rem" gutterBottom>Transaction Broadcast</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your withdrawal has been signed and submitted to the network.
                  It may take a few minutes to confirm.
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 2, mb: 2, textAlign: 'left' }}>
                  <CardContent sx={{ py: '10px !important', px: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                      Transaction Hash
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography fontFamily="'Fira Code','JetBrains Mono',monospace"
                        fontSize="0.72rem" sx={{ wordBreak: 'break-all', flex: 1 }}>
                        {txHash}
                      </Typography>
                      <CopyBtn text={txHash} />
                    </Box>
                  </CardContent>
                </Card>
                {txUrl && (
                  <Button variant="outlined" size="small" startIcon={<Launch fontSize="small" />}
                    component="a" href={txUrl} target="_blank"
                    sx={{ borderRadius: 2, fontWeight: 700, borderColor: accent.color, color: accent.color }}>
                    View on Explorer
                  </Button>
                )}
              </>
            ) : (
              <>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'rgba(239,68,68,0.12)' }}>
                  <ErrorIcon sx={{ fontSize: 32, color: '#ef4444' }} />
                </Avatar>
                <Typography fontWeight={800} fontSize="1.05rem" gutterBottom>Withdrawal Failed</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {failReason || 'An unexpected error occurred. Please try again.'}
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setStep('form')}
                  sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Try Again
                </Button>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {step === 'setup_2fa' && (
          <Button onClick={onClose} sx={{ borderRadius: 2 }}>Close</Button>
        )}
        {step === 'form' && (
          <>
            <Button onClick={onClose} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={handleNext}
              disabled={!toAddress || !amount}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accent.color,
                '&:hover': { bgcolor: accent.color, filter: 'brightness(1.1)' } }}>
              Review
            </Button>
          </>
        )}
        {step === 'review' && (
          <>
            <Button onClick={() => setStep('form')} sx={{ borderRadius: 2 }}>Back</Button>
            <Button variant="contained" onClick={handleConfirm}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626' } }}>
              Confirm Withdrawal
            </Button>
          </>
        )}
        {step === '2fa' && (
          <>
            <Button onClick={() => setStep('review')} sx={{ borderRadius: 2 }}>Back</Button>
            <Button variant="contained" onClick={handleSubmitWithdraw}
              disabled={twoFACode.length !== 6}
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626' } }}>
              Submit
            </Button>
          </>
        )}
        {step === 'done' && (
          <Button onClick={onClose} variant="contained" fullWidth
            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accent.color,
              '&:hover': { bgcolor: accent.color, filter: 'brightness(1.1)' } }}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── CoinPanel ────────────────────────────────────────────────────────────────

interface CoinPanelProps {
  chain: PortfolioChain;
  onCreateWallet: (type: string, chain_id: string) => void;
  creating: boolean;
  onDeposit: (coin: PortfolioCoin, chain: PortfolioChain) => void;
  onWithdraw: (coin: PortfolioCoin, chain: PortfolioChain) => void;
  refreshKey?: number;
}

function CoinPanel({ chain, onCreateWallet, creating, onDeposit, onWithdraw, refreshKey }: CoinPanelProps) {
  const theme = useTheme();
  const accent = CHAIN_COLOR[chain.mpc_chain_type] ?? CHAIN_COLOR.EVM;
  const isActive = chain.wallet?.status === 'active';
  const isPending = chain.wallet?.status === 'pending';
  const [coins, setCoins] = useState<PortfolioCoin[]>(chain.coins);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    setCoins(chain.coins);
    if (!isActive || !chain.wallet?.id) return;
    setBalanceLoading(true);
    walletAPI.getBalance(chain.wallet.id, chain.chain_id).then(res => {
      const map: Record<string, { balance: string; balance_usd?: string }> = {};
      for (const b of (res.data.data ?? [])) map[b.symbol] = b;
      setCoins(prev => prev.map(c => map[c.symbol] ? { ...c, ...map[c.symbol] } : c));
    }).finally(() => setBalanceLoading(false));
  }, [chain, refreshKey]);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Panel header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ImgAvatar src={CHAIN_ICON[chain.chain_id]} alt={chain.display_name} size={36}
            fallback={chain.chain_id.slice(0, 2).toUpperCase()} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} fontSize="0.95rem">{chain.display_name}</Typography>
            {isActive && chain.wallet?.public_address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography fontFamily="monospace" fontSize="0.7rem" color="text.secondary" noWrap>
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
            )}
          </Box>
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
        </Box>
      </Box>

      {isPending && <LinearProgress color="warning" sx={{ height: 2 }} />}
      {balanceLoading && <LinearProgress sx={{ height: 2 }} />}

      {/* Coin list */}
      {isActive ? (
        <List disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
          {coins.map((coin, i) => (
            <Box key={coin.coin_id}>
              {i > 0 && <Divider />}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                py: 1.25, px: 2.5,
              }}>
                {/* Coin icon */}
                <ImgAvatar src={COIN_ICON[coin.symbol.toUpperCase()]} alt={coin.symbol} size={34}
                  fallback={coin.symbol.slice(0, 3)} />

                {/* Name + symbol */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize="0.88rem" fontWeight={600} noWrap>{coin.display_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{coin.symbol}</Typography>
                </Box>

                {/* Balance */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography fontSize="0.88rem" fontWeight={700} noWrap>
                    {parseFloat(coin.balance).toFixed(6)} {coin.symbol}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    ${coin.balance_usd ?? '0.00'}
                  </Typography>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
                  <Tooltip title={`Withdraw ${coin.symbol}`}>
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<North sx={{ fontSize: 13 }} />}
                        onClick={() => onWithdraw(coin, chain)}
                        disabled={parseFloat(coin.balance) <= 0}
                        sx={{
                          borderRadius: 1.5, fontWeight: 700, fontSize: '0.72rem',
                          px: 1.25, py: 0.5, minWidth: 0,
                          borderColor: alpha('#ef4444', 0.5), color: '#ef4444',
                          '&:hover': { borderColor: '#ef4444', bgcolor: alpha('#ef4444', 0.08) },
                          '&.Mui-disabled': { opacity: 0.35 },
                        }}>
                        Send
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title={`Deposit ${coin.symbol}`}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<South sx={{ fontSize: 13 }} />}
                      onClick={() => onDeposit(coin, chain)}
                      sx={{
                        borderRadius: 1.5, fontWeight: 700, fontSize: '0.72rem',
                        px: 1.25, py: 0.5, minWidth: 0,
                        borderColor: alpha(accent.color, 0.5), color: accent.color,
                        '&:hover': { borderColor: accent.color, bgcolor: alpha(accent.color, 0.08) },
                      }}>
                      Receive
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          ))}
        </List>
      ) : !chain.wallet ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1.5 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: alpha(accent.color, 0.12) }}>
            <AccountBalanceWallet sx={{ fontSize: 24, color: accent.color }} />
          </Avatar>
          <Typography fontWeight={700} fontSize="0.9rem">No wallet yet</Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
            Create a {chain.mpc_chain_type} wallet to start receiving funds.
          </Typography>
          {!creating ? (
            <Button size="small" variant="contained" startIcon={<Add />}
              onClick={() => onCreateWallet(chain.mpc_chain_type, chain.chain_id)}
              sx={{ mt: 0.5, borderRadius: 2, fontWeight: 700, bgcolor: accent.color,
                '&:hover': { bgcolor: accent.color, filter: 'brightness(1.1)' } }}>
              Create Wallet
            </Button>
          ) : (
            <CircularProgress size={22} sx={{ color: accent.color, mt: 0.5 }} />
          )}
        </Box>
      ) : null}
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
    <Box sx={{ mb: 2.5 }}>
      {/* Summary: collapse up when done */}
      <Collapse in={done}>
        <Alert
          icon={<span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{SUMMARY_MESSAGE.icon}</span>}
          severity="success"
          sx={{
            mb: 2.5, borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.08),
            border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
            '& .MuiAlert-message': { fontSize: '0.85rem', lineHeight: 1.6 },
          }}
        >
          {SUMMARY_MESSAGE.text}
        </Alert>
      </Collapse>

      {/* Info messages: fixed height, only opacity transitions */}
      {!done && (
        <Alert
          icon={<span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{MPC_MESSAGES[idx].icon}</span>}
          severity="info"
          sx={{
            mb: 2.5, borderRadius: 2, minHeight: 90,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
            '& .MuiAlert-message': { fontSize: '0.85rem', lineHeight: 1.6 },
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="info.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {active ? 'Creating your wallet…' : 'How MPC works'}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {idx + 1} / {MPC_MESSAGES.length}
            </Typography>
          </Box>
          {MPC_MESSAGES[idx].text}
        </Alert>
      )}
    </Box>
  );
}

// ─── WalletPage ───────────────────────────────────────────────────────────────

export default function WalletPage() {
  const theme = useTheme();
  const [chains, setChains] = useState<PortfolioChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [depositState, setDepositState] = useState<{ coin: PortfolioCoin; chain: PortfolioChain } | null>(null);
  const [withdrawState, setWithdrawState] = useState<{ coin: PortfolioCoin; chain: PortfolioChain } | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; ok: boolean }>({ open: false, msg: '', ok: true });
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  const handleWithdrawSuccess = useCallback((chainId: string) => {
    setRefreshKeys(prev => ({ ...prev, [chainId]: (prev[chainId] ?? 0) + 1 }));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await walletAPI.getPortfolio();
      const loaded: PortfolioChain[] = res.data.data?.chains ?? [];
      setChains(loaded);
      setSelectedChainId(prev => prev ?? loaded[0]?.chain_id ?? null);
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

  const handleCreate = async (mpcChainType: string, chainId: string) => {
    setCreating(mpcChainType);
    try {
      await walletAPI.createWallet(mpcChainType as any, undefined, chainId);
      await load();
      setSnack({ open: true, msg: 'Wallet created!', ok: true });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Failed to create wallet.', ok: false });
    } finally {
      setCreating(null);
    }
  };

  const activeCount = chains.filter(c => c.wallet?.status === 'active').length;
  const selectedChain = chains.find(c => c.chain_id === selectedChainId) ?? null;

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

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
        {loading && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 2 }}>
            <Box>
              {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1, borderRadius: 2 }} />)}
            </Box>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2.5 }} />
          </Box>
        )}

        {/* 2-column layout */}
        {!loading && !error && chains.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 2, alignItems: 'start' }}>

            {/* Left: chain list */}
            <Card variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
              <List disablePadding>
                {chains.map((chain, i) => {
                  const accent = CHAIN_COLOR[chain.mpc_chain_type] ?? CHAIN_COLOR.EVM;
                  const isActive = chain.wallet?.status === 'active';
                  const isPending = chain.wallet?.status === 'pending';
                  const isSelected = chain.chain_id === selectedChainId;
                  return (
                    <React.Fragment key={chain.chain_id}>
                      {i > 0 && <Divider />}
                      <ListItem
                        onClick={() => setSelectedChainId(chain.chain_id)}
                        sx={{
                          cursor: 'pointer', py: 1.5, px: 2,
                          bgcolor: isSelected ? alpha(accent.color, 0.08) : 'transparent',
                          borderLeft: isSelected ? `3px solid ${accent.color}` : '3px solid transparent',
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: alpha(accent.color, 0.05) },
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <ImgAvatar src={CHAIN_ICON[chain.chain_id]} alt={chain.display_name} size={32}
                            fallback={chain.chain_id.slice(0, 2).toUpperCase()} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography fontSize="0.88rem" fontWeight={isSelected ? 700 : 500}>{chain.display_name}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary">{chain.native_symbol}</Typography>
                          }
                        />
                        {isActive && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0 }} />}
                        {isPending && <CircularProgress size={10} sx={{ color: '#f59e0b', flexShrink: 0 }} />}
                        {!chain.wallet && (
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                        )}
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            </Card>

            {/* Right: coin panel */}
            {selectedChain && (
              <CoinPanel
                key={selectedChain.chain_id}
                chain={selectedChain}
                onCreateWallet={handleCreate}
                creating={creating === selectedChain.mpc_chain_type}
                onDeposit={(coin, ch) => setDepositState({ coin, chain: ch })}
                onWithdraw={(coin, ch) => setWithdrawState({ coin, chain: ch })}
                refreshKey={refreshKeys[selectedChain.chain_id] ?? 0}
              />
            )}
          </Box>
        )}

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
          const cid = depositState?.chain?.chain_id;
          setDepositState(null);
          if (t && cid) handleCreate(t, cid);
        }}
      />

      <WithdrawDialog
        open={!!withdrawState}
        onClose={() => setWithdrawState(null)}
        coin={withdrawState?.coin ?? null}
        chain={withdrawState?.chain ?? null}
        onSuccess={handleWithdrawSuccess}
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
