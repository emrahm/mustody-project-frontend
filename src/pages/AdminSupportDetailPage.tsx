import { useEffect, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
  FormControl, IconButton, InputLabel, MenuItem, Paper, Popover, Select,
  Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AdminPanelSettings, ArrowBack, EmojiEmotions, Lock, LockOpen, Send, VisibilityOff,
  FiberManualRecord,
} from '@mui/icons-material';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useLocation, useParams } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  supportAPI, SupportMessage, SupportTicket, TicketStatus,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'error',
};

const PRIORITY_COLOR: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
  low: 'success',
  medium: 'default',
  high: 'warning',
  urgent: 'error',
};

const ALL_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [replyBody, setReplyBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replying, setReplying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    supportAPI.adminGetTicket(params.id)
      .then(res => {
        setTicket(res.data.ticket);
        const msgs = res.data.messages ?? [];
        setMessages(msgs);
        msgs.forEach(m => knownIds.current.add(m.id));
      })
      .catch(() => setError('Failed to load ticket'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  // SSE: real-time new messages
  const [sseConnected, setSseConnected] = useState(false);
  useEffect(() => {
    if (!params?.id) return;
    const url = supportAPI.streamUrl(params.id, true);
    const es = new EventSource(url);

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.onmessage = (e) => {
      try {
        const msg: SupportMessage = JSON.parse(e.data);
        if (msg.sender_id === user?.id) return;
        if (!knownIds.current.has(msg.id)) {
          knownIds.current.add(msg.id);
          setMessages(prev => [...prev, msg]);
        }
      } catch { /* ignore parse errors */ }
    };

    return () => {
      es.close();
      setSseConnected(false);
    };
  }, [params?.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async () => {
    if (!ticket || !replyBody.trim() || replying) return;
    setReplying(true);
    try {
      const res = await supportAPI.adminReply(ticket.id, replyBody, isInternal);
      knownIds.current.add(res.data.id);
      setMessages(prev => [...prev, res.data]);
      setReplyBody('');
      setIsInternal(false);
      // If ticket was open and this is a public reply, it auto-transitions to in_progress on backend.
      // Refresh ticket to get latest status.
      if (!isInternal && ticket.status === 'open') {
        setTicket(prev => prev ? { ...prev, status: 'in_progress' } : prev);
      }
    } catch {
      setError('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    try {
      await supportAPI.adminUpdateStatus(ticket.id, status);
      setTicket(prev => prev ? { ...prev, status } : prev);
    } catch {
      setError('Failed to update status');
    }
  };

  const isClosed = ticket?.status === 'resolved' || ticket?.status === 'closed';

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error && !ticket) {
    return (
      <DashboardLayout>
        <Box p={3}>
          <Alert severity="error">{error}</Alert>
          <Button startIcon={<ArrowBack />} sx={{ mt: 2 }} onClick={() => setLocation('/admin/support')}>
            Back to list
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => setLocation('/admin/support')}
          sx={{ mb: 2 }}
          size="small"
        >
          Back to tickets
        </Button>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

        {ticket && (
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500 }}>
            {/* Header */}
            <Box p={2.5} borderBottom="1px solid" borderColor="divider">
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box flex={1} minWidth={0}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <AdminPanelSettings color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700} noWrap>{ticket.subject}</Typography>
                    <Tooltip title={sseConnected ? 'Live updates active' : 'Live updates disconnected'}>
                      <FiberManualRecord sx={{ fontSize: 10, color: sseConnected ? 'success.main' : 'grey.400', ml: 0.5 }} />
                    </Tooltip>
                  </Stack>
                  <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
                    <Typography variant="caption" fontFamily="monospace" color="text.secondary" fontWeight={600}>
                      {ticket.ticket_number}
                    </Typography>
                    {ticket.user && (
                      <Typography variant="caption" color="text.secondary">
                        · {ticket.user.name} &lt;{ticket.user.email}&gt;
                      </Typography>
                    )}
                    {ticket.category && (
                      <Typography variant="caption" color="text.secondary">· {ticket.category}</Typography>
                    )}
                  </Stack>
                  <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
                    <Chip label={ticket.status.replace('_', ' ')} color={STATUS_COLOR[ticket.status]} size="small" sx={{ textTransform: 'capitalize' }} />
                    <Chip label={ticket.priority} color={PRIORITY_COLOR[ticket.priority]} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    {ticket.external_ref_id && (
                      <Chip
                        label={`Ref: ${ticket.external_ref_id}`}
                        size="small"
                        variant="outlined"
                        component={ticket.external_ref_url ? 'a' : 'div'}
                        href={ticket.external_ref_url}
                        target="_blank"
                        clickable={!!ticket.external_ref_url}
                      />
                    )}
                  </Stack>
                </Box>
                {/* Status control */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Change Status</InputLabel>
                  <Select
                    label="Change Status"
                    value={ticket.status}
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
            </Box>

            {/* Messages */}
            <Box flex={1} overflow="auto" p={2.5} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" mt={4}>No messages yet.</Typography>
              ) : messages.map((msg, idx) => {
                const isAdminMsg = msg.sender_id !== ticket.user_id;
                const showDateDivider = idx === 0 || (
                  new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString()
                );
                return (
                  <Box key={msg.id}>
                    {showDateDivider && (
                      <Divider sx={{ my: 1 }}>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </Typography>
                      </Divider>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isAdminMsg ? 'row-reverse' : 'row',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        opacity: msg.is_internal ? 0.8 : 1,
                      }}
                    >
                      <Tooltip title={msg.sender?.name ?? '?'}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: isAdminMsg ? 'secondary.main' : 'grey.400', fontSize: 14, flexShrink: 0 }}>
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
                            bgcolor: msg.is_internal
                              ? 'warning.light'
                              : isAdminMsg
                              ? 'secondary.main'
                              : 'grey.100',
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
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
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
              {isClosed ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Ticket is {ticket.status}. Change status to reply.
                </Alert>
              ) : (
                <Stack direction="row" gap={1}>
                  <IconButton size="small" onClick={e => setEmojiAnchor(e.currentTarget)}>
                    <EmojiEmotions fontSize="small" />
                  </IconButton>
                  <TextField
                    fullWidth
                    multiline
                    minRows={1}
                    maxRows={6}
                    placeholder={isInternal ? 'Write an internal note…' : 'Write a reply to the user…'}
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    size="small"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                    }}
                  />
                  <Tooltip title={isInternal ? 'Switch to public reply' : 'Switch to internal note'}>
                    <IconButton onClick={() => setIsInternal(v => !v)} color={isInternal ? 'warning' : 'default'}>
                      {isInternal ? <Lock /> : <LockOpen />}
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    color={isInternal ? 'warning' : 'primary'}
                    onClick={handleReply}
                    disabled={!replyBody.trim() || replying}
                    sx={{ minWidth: 48, px: 1.5 }}
                  >
                    {replying ? <CircularProgress size={18} color="inherit" /> : <Send />}
                  </Button>
                </Stack>
              )}
              <Popover
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <EmojiPicker
                  theme={Theme.AUTO}
                  onEmojiClick={(e: EmojiClickData) => {
                    setReplyBody(prev => prev + e.emoji);
                    setEmojiAnchor(null);
                  }}
                />
              </Popover>
            </Box>
          </Paper>
        )}
      </Box>
    </DashboardLayout>
  );
}
