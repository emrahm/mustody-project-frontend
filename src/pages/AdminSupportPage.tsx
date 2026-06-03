import { useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
  FormControl, IconButton, InputAdornment, InputLabel, MenuItem,
  Paper, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AdminPanelSettings, Lock, LockOpen, Search, Send,
  VisibilityOff,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import {
  supportAPI, SupportMessage, SupportTicket, TicketStatus,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'error'> = {
  open: 'info', in_progress: 'default', resolved: 'success', closed: 'error',
};

const PRIORITY_COLOR: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
  low: 'success', medium: 'default', high: 'warning', urgent: 'error',
};

const ALL_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await supportAPI.adminListTickets({
        search: search || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        limit: 100,
      });
      setTickets(res.data.tickets ?? []);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, [search, filterStatus, filterPriority]);

  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket);
    setThreadLoading(true);
    try {
      const res = await supportAPI.adminGetTicket(ticket.id);
      setMessages(res.data.messages ?? []);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setReplying(true);
    try {
      const res = await supportAPI.adminReply(selected.id, replyBody, isInternal);
      setMessages(prev => [...prev, res.data]);
      setReplyBody('');
      setIsInternal(false);
    } catch {
      setError('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selected) return;
    try {
      await supportAPI.adminUpdateStatus(selected.id, status);
      setSelected(prev => prev ? { ...prev, status } : prev);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status } : t));
    } catch {
      setError('Failed to update status');
    }
  };

  const isClosed = (t: SupportTicket) => t.status === 'resolved' || t.status === 'closed';

  return (
    <DashboardLayout>
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
          <AdminPanelSettings color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Support Management</Typography>
            <Typography variant="body2" color="text.secondary">{total} tickets total</Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

        {/* Filters */}
        <Stack direction="row" gap={2} mb={2.5} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search subject or ticket number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {ALL_STATUSES.map(s => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {['low', 'medium', 'high', 'urgent'].map(p => (
                <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: 'column', lg: 'row' }} gap={3}>
          {/* Ticket list */}
          <Paper variant="outlined" sx={{ width: { lg: 380 }, flexShrink: 0, overflow: 'auto', maxHeight: '72vh' }}>
            {loading ? (
              <Box p={4} textAlign="center"><CircularProgress /></Box>
            ) : tickets.length === 0 ? (
              <Box p={4} textAlign="center">
                <Typography color="text.secondary">No tickets found</Typography>
              </Box>
            ) : (
              tickets.map((t, i) => (
                <Box key={t.id}>
                  {i > 0 && <Divider />}
                  <Box
                    sx={{
                      p: 2, cursor: 'pointer', transition: 'background 0.15s',
                      bgcolor: selected?.id === t.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderLeft: t.status === 'open' ? '3px solid' : '3px solid transparent',
                      borderLeftColor: t.status === 'open' ? 'primary.main' : 'transparent',
                    }}
                    onClick={() => openTicket(t)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                        {t.subject}
                      </Typography>
                      <Chip
                        label={t.status.replace('_', ' ')}
                        color={STATUS_COLOR[t.status]}
                        size="small"
                        sx={{ ml: 1, textTransform: 'capitalize', whiteSpace: 'nowrap' }}
                      />
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {t.ticket_number}
                      </Typography>
                      <Chip label={t.priority} color={PRIORITY_COLOR[t.priority]} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                      {t.category && <Typography variant="caption" color="text.secondary">· {t.category}</Typography>}
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" mt={0.5}>
                      <Typography variant="caption" color="text.disabled">
                        {t.user?.name ?? t.user?.email ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(t.created_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))
            )}
          </Paper>

          {/* Thread */}
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            {!selected ? (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={4}>
                <Box textAlign="center">
                  <AdminPanelSettings sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Select a ticket to manage</Typography>
                </Box>
              </Box>
            ) : threadLoading ? (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>
            ) : (
              <>
                {/* Thread header */}
                <Box p={2.5} borderBottom="1px solid" borderColor="divider">
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="h6" fontWeight={600} noWrap>{selected.subject}</Typography>
                      <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap" alignItems="center">
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {selected.ticket_number}
                        </Typography>
                        {selected.user && (
                          <Typography variant="caption" color="text.secondary">
                            · {selected.user.name} &lt;{selected.user.email}&gt;
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                    {/* Status control */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={selected.status}
                        onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                      >
                        {ALL_STATUSES.map(s => (
                          <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                            {s.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
                    <Chip label={selected.status.replace('_', ' ')} color={STATUS_COLOR[selected.status]} size="small" sx={{ textTransform: 'capitalize' }} />
                    <Chip label={selected.priority} color={PRIORITY_COLOR[selected.priority]} size="small" variant="outlined" />
                    {selected.category && <Chip label={selected.category} size="small" variant="outlined" />}
                    {selected.external_ref_id && (
                      <Chip
                        label={`Ref: ${selected.external_ref_id}`}
                        size="small"
                        variant="outlined"
                        component={selected.external_ref_url ? 'a' : 'div'}
                        href={selected.external_ref_url}
                        target="_blank"
                        clickable={!!selected.external_ref_url}
                      />
                    )}
                  </Stack>
                </Box>

                {/* Messages */}
                <Box flex={1} overflow="auto" p={2.5} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {messages.length === 0 && (
                    <Typography color="text.secondary" textAlign="center">No messages yet.</Typography>
                  )}
                  {messages.map(msg => {
                    const isAdminMsg = msg.sender_id !== selected.user_id;
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          flexDirection: isAdminMsg ? 'row-reverse' : 'row',
                          gap: 1.5,
                          alignItems: 'flex-start',
                          opacity: msg.is_internal ? 0.75 : 1,
                        }}
                      >
                        <Tooltip title={msg.sender?.name ?? '?'}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: isAdminMsg ? 'secondary.main' : 'grey.400', fontSize: 14 }}>
                            {(msg.sender?.name ?? '?')[0].toUpperCase()}
                          </Avatar>
                        </Tooltip>
                        <Box sx={{ maxWidth: '75%' }}>
                          {msg.is_internal && (
                            <Stack direction="row" alignItems="center" gap={0.5} mb={0.25} justifyContent={isAdminMsg ? 'flex-end' : 'flex-start'}>
                              <VisibilityOff sx={{ fontSize: 12, color: 'warning.main' }} />
                              <Typography variant="caption" color="warning.main" fontWeight={600}>Internal Note</Typography>
                            </Stack>
                          )}
                          <Box
                            sx={{
                              bgcolor: msg.is_internal ? 'warning.light' : isAdminMsg ? 'secondary.main' : 'grey.100',
                              color: isAdminMsg && !msg.is_internal ? 'secondary.contrastText' : 'text.primary',
                              borderRadius: isAdminMsg ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              px: 2, py: 1.25,
                              border: msg.is_internal ? '1px dashed' : 'none',
                              borderColor: 'warning.main',
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} display="block" mb={0.25}>
                              {msg.sender?.name ?? (isAdminMsg ? 'Support Team' : 'User')}
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {msg.body}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5, textAlign: isAdminMsg ? 'right' : 'left' }}>
                              {new Date(msg.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* Reply box */}
                <Box
                  p={2}
                  borderTop="1px solid"
                  borderColor="divider"
                  bgcolor={isInternal ? 'warning.light' : 'transparent'}
                  sx={{ transition: 'background 0.2s' }}
                >
                  {isInternal && (
                    <Typography variant="caption" color="warning.dark" fontWeight={600} display="block" mb={0.75}>
                      ⚠ Internal note — not visible to the user
                    </Typography>
                  )}
                  <Stack direction="row" gap={1}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      maxRows={6}
                      placeholder={isInternal ? 'Write an internal note…' : 'Write a reply to the user…'}
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      size="small"
                      disabled={isClosed(selected)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                      }}
                    />
                    <Tooltip title={isInternal ? 'Switch to public reply' : 'Switch to internal note'}>
                      <IconButton
                        onClick={() => setIsInternal(v => !v)}
                        color={isInternal ? 'warning' : 'default'}
                        disabled={isClosed(selected)}
                      >
                        {isInternal ? <Lock /> : <LockOpen />}
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      color={isInternal ? 'warning' : 'primary'}
                      onClick={handleReply}
                      disabled={!replyBody.trim() || replying || isClosed(selected)}
                      sx={{ minWidth: 48, px: 1.5 }}
                    >
                      {replying ? <CircularProgress size={18} color="inherit" /> : <Send />}
                    </Button>
                  </Stack>
                  {isClosed(selected) && (
                    <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                      This ticket is {selected.status}. Change status to reply.
                    </Alert>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
