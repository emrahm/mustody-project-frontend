import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Pagination,
} from '@mui/material';
import { AdminPanelSettings, OpenInNew, Search, Refresh } from '@mui/icons-material';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { supportAPI, SupportTicket, TicketStatus, TicketPriority } from '@/lib/api';

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

const PAGE_SIZE = 25;

export default function AdminSupportPage() {
  const [, setLocation] = useLocation();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportAPI.adminListTickets({
        search: search || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTickets(res.data.tickets ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority, page]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterPriority]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardLayout>
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <AdminPanelSettings color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>Support Tickets</Typography>
              <Typography variant="body2" color="text.secondary">{total} tickets total</Typography>
            </Box>
          </Stack>
          <Button startIcon={<Refresh />} onClick={load} disabled={loading} size="small">
            Refresh
          </Button>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

        {/* Filters */}
        <Stack direction="row" gap={2} mb={2} flexWrap="wrap" alignItems="center">
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
              {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map(s => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map(p => (
                <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Ticket #</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No tickets found</Typography>
                  </TableCell>
                </TableRow>
              ) : tickets.map(ticket => (
                <TableRow
                  key={ticket.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setLocation(`/admin/support/${ticket.id}`)}
                >
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace" fontWeight={600} color="primary">
                      {ticket.ticket_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={ticket.status === 'open' ? 700 : 400} noWrap sx={{ maxWidth: 280 }}>
                      {ticket.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                      {ticket.user?.name || ticket.user?.email || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {ticket.category || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status.replace('_', ' ')}
                      color={STATUS_COLOR[ticket.status]}
                      size="small"
                      sx={{ textTransform: 'capitalize', minWidth: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      color={PRIORITY_COLOR[ticket.priority]}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize', minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      {ticket.message_count ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={e => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<OpenInNew fontSize="small" />}
                      onClick={() => setLocation(`/admin/support/${ticket.id}`)}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Stack direction="row" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}
