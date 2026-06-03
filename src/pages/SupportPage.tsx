import { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputLabel,
  MenuItem, Paper, Select, Stack, TextField, Typography, Avatar,
  Alert, Tooltip, IconButton, Popover,
} from '@mui/material';
import {
  Add, SupportAgent, Send, ConfirmationNumber, AccessTime, FiberManualRecord, EmojiEmotions,
} from '@mui/icons-material';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  supportAPI, SupportTicket, SupportMessage, TicketPriority,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'error'> = {
  open: 'info',
  in_progress: 'default',
  resolved: 'success',
  closed: 'error',
};

const PRIORITY_COLOR: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
  low: 'success',
  medium: 'default',
  high: 'warning',
  urgent: 'error',
};

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const knownIds = useRef<Set<string>>(new Set());
  const [sseConnected, setSseConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(null);

  const [form, setForm] = useState({
    subject: '',
    body: '',
    category: '',
    priority: 'medium' as TicketPriority,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await supportAPI.listMyTickets({ limit: 50 });
      setTickets(res.data.tickets ?? []);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setThreadLoading(true);
    try {
      const res = await supportAPI.getMyTicket(ticket.id);
      const msgs = res.data.messages ?? [];
      setMessages(msgs);
      knownIds.current = new Set(msgs.map(m => m.id));
    } finally {
      setThreadLoading(false);
    }
  };

  // SSE: real-time new messages for the open ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const url = supportAPI.streamUrl(selectedTicket.id, false);
    const es = new EventSource(url);
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.onmessage = (e) => {
      try {
        const msg: SupportMessage = JSON.parse(e.data);
        // Kendi mesajlarımızı SSE'den alma — handleReply zaten API response'undan ekliyor
        if (msg.sender_id === user?.id) return;
        if (!knownIds.current.has(msg.id)) {
          knownIds.current.add(msg.id);
          setMessages(prev => [...prev, msg]);
        }
      } catch { /* ignore */ }
    };
    return () => { es.close(); setSseConnected(false); };
  }, [selectedTicket?.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async () => {
    if (!selectedTicket || !replyBody.trim() || replying) return;
    setReplying(true);
    try {
      const res = await supportAPI.replyToTicket(selectedTicket.id, replyBody);
      // ID'yi SSE'den önce kaydet, sonra API response'u (sender bilgisiyle) ekle
      knownIds.current.add(res.data.id);
      setMessages(prev => [...prev, res.data]);
      setReplyBody('');
    } finally {
      setReplying(false);
    }
  };

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      await supportAPI.createTicket(form);
      setCreateOpen(false);
      setForm({ subject: '', body: '', category: '', priority: 'medium' });
      await loadTickets();
    } catch {
      setError('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const isClosed = (t: SupportTicket) => t.status === 'resolved' || t.status === 'closed';

  return (
    <DashboardLayout>
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <SupportAgent color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>Support</Typography>
              <Typography variant="body2" color="text.secondary">
                {total} ticket{total !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Ticket
          </Button>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction={{ xs: 'column', md: 'row' }} gap={3}>
          {/* Ticket list */}
          <Paper variant="outlined" sx={{ width: { md: 340 }, flexShrink: 0, overflow: 'auto', maxHeight: '75vh' }}>
            {loading ? (
              <Box p={4} textAlign="center"><CircularProgress /></Box>
            ) : tickets.length === 0 ? (
              <Box p={4} textAlign="center">
                <ConfirmationNumber sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No tickets yet</Typography>
              </Box>
            ) : (
              tickets.map((t, i) => (
                <Box key={t.id}>
                  {i > 0 && <Divider />}
                  <Box
                    sx={{
                      p: 2, cursor: 'pointer', transition: 'background 0.15s',
                      bgcolor: selectedTicket?.id === t.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => openTicket(t)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                        {t.subject}
                      </Typography>
                      <Chip
                        label={t.status.replace('_', ' ')}
                        color={STATUS_COLOR[t.status]}
                        size="small"
                        sx={{ textTransform: 'capitalize', ml: 1 }}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        {t.ticket_number}
                      </Typography>
                      <Chip
                        label={t.priority}
                        color={PRIORITY_COLOR[t.priority]}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                      {t.category && (
                        <Typography variant="caption" color="text.secondary">· {t.category}</Typography>
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                      <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        {new Date(t.created_at).toLocaleDateString()}
                      </Typography>
                      {t.message_count !== undefined && (
                        <Typography variant="caption" color="text.disabled">
                          · {t.message_count} message{t.message_count !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Box>
              ))
            )}
          </Paper>

          {/* Thread */}
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 400 }}>
            {!selectedTicket ? (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={4}>
                <Box textAlign="center">
                  <SupportAgent sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Select a ticket to view the conversation</Typography>
                </Box>
              </Box>
            ) : threadLoading ? (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Thread header */}
                <Box p={2.5} borderBottom="1px solid" borderColor="divider">
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight={600}>{selectedTicket.subject}</Typography>
                        <Tooltip title={sseConnected ? 'Live updates active' : 'Connecting…'}>
                          <FiberManualRecord sx={{ fontSize: 10, color: sseConnected ? 'success.main' : 'grey.400' }} />
                        </Tooltip>
                      </Stack>
                      <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
                        <Chip label={selectedTicket.ticket_number} size="small" variant="outlined" />
                        <Chip
                          label={selectedTicket.status.replace('_', ' ')}
                          color={STATUS_COLOR[selectedTicket.status]}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={selectedTicket.priority}
                          color={PRIORITY_COLOR[selectedTicket.priority]}
                          size="small"
                          variant="outlined"
                        />
                        {selectedTicket.category && (
                          <Chip label={selectedTicket.category} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Box>
                    {!isClosed(selectedTicket) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={async () => {
                          try {
                            await supportAPI.resolveTicket(selectedTicket.id);
                            setSelectedTicket(t => t ? { ...t, status: 'resolved' } : t);
                            setTickets(ts => ts.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved' } : t));
                          } catch {
                            setError('Failed to resolve ticket');
                          }
                        }}
                      >
                        Mark as Resolved
                      </Button>
                    )}
                  </Stack>
                </Box>

                {/* Messages */}
                <Box flex={1} overflow="auto" p={2.5} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {messages.length === 0 && (
                    <Typography color="text.secondary" textAlign="center">No messages yet.</Typography>
                  )}
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <Box
                        key={msg.id}
                        sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 1.5, alignItems: 'flex-start' }}
                      >
                        <Tooltip title={msg.sender?.name ?? 'User'}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: isMe ? 'primary.main' : 'grey.400', fontSize: 14 }}>
                            {(msg.sender?.name ?? 'S')[0].toUpperCase()}
                          </Avatar>
                        </Tooltip>
                        <Box
                          sx={{
                            maxWidth: '75%',
                            bgcolor: isMe ? 'primary.main' : 'grey.100',
                            color: isMe ? 'primary.contrastText' : 'text.primary',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            px: 2, py: 1.25,
                          }}
                        >
                          {!isMe && (
                            <Typography variant="caption" fontWeight={700} display="block" mb={0.25}>
                              {msg.sender?.name ?? 'Support Team'}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.body}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: isMe ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Reply box */}
                {!isClosed(selectedTicket) ? (
                  <Box p={2} borderTop="1px solid" borderColor="divider">
                    <Stack direction="row" gap={1}>
                      <IconButton size="small" onClick={e => setEmojiAnchor(e.currentTarget)}>
                        <EmojiEmotions fontSize="small" />
                      </IconButton>
                      <TextField
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={5}
                        placeholder="Write a reply…"
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        size="small"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleReply}
                        disabled={!replyBody.trim() || replying}
                        sx={{ minWidth: 48, px: 1.5 }}
                      >
                        {replying ? <CircularProgress size={18} color="inherit" /> : <Send />}
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                      Press Enter to send, Shift+Enter for new line
                    </Typography>
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
                ) : (
                  <Box p={2} borderTop="1px solid" borderColor="divider">
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      This ticket is {selectedTicket.status}. You cannot reply to a closed ticket.
                    </Alert>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Stack>

        {/* Create Ticket Dialog */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" gap={1}>
              <ConfirmationNumber color="primary" />
              <Typography variant="h6">New Support Ticket</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack gap={2} mt={1}>
              <TextField
                label="Subject"
                fullWidth
                required
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                inputProps={{ maxLength: 255 }}
                helperText={`${form.subject.length}/255`}
              />
              <TextField
                label="Message"
                fullWidth
                required
                multiline
                minRows={4}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Describe your issue in detail…"
              />
              <Stack direction="row" gap={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <MenuItem value="">— None —</MenuItem>
                    <MenuItem value="billing">Billing</MenuItem>
                    <MenuItem value="technical">Technical</MenuItem>
                    <MenuItem value="account">Account</MenuItem>
                    <MenuItem value="general">General</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    label="Priority"
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!form.subject.trim() || !form.body.trim() || submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
            >
              Submit Ticket
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
