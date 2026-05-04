import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Visibility,
  Replay,
  Delete,
  Email,
  Security,
  Close,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface EmailQueueItem {
  id: string;
  correlation_id?: string;
  tenant_id?: string;
  user_id?: string;
  to_email: string;
  from_email: string;
  from_name?: string;
  subject: string;
  body: string;
  is_sent: boolean;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export default function EmailQueueMUI() {
  const { hasGlobalRole } = useAuth();
  const [emails, setEmails] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailQueueItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', is_sent: '' });
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 25, total: 0 });

  const hasAccess = hasGlobalRole('admin') || hasGlobalRole('owner');

  useEffect(() => {
    if (hasAccess) fetchEmails();
    else setLoading(false);
  }, [pagination.page, pagination.rowsPerPage, filters, hasAccess]);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: (pagination.page + 1).toString(),
        limit: pagination.rowsPerPage.toString(),
      });
      if (filters.search) params.set('search', filters.search);
      if (filters.is_sent !== '') params.set('is_sent', filters.is_sent);

      const response = await api.get(`/admin/email-queue?${params}`);
      setEmails(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch email queue');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const response = await api.get(`/admin/email-queue/${id}`);
      setSelectedEmail(response.data);
      setDetailOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch email details');
    }
  };

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/email-queue/${id}/retry`);
      fetchEmails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retry email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/admin/email-queue/${id}`);
      setDeleteConfirm(null);
      fetchEmails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {!hasAccess ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>Access Denied</Typography>
              <Typography variant="body1" color="text.secondary">
                You need administrator privileges to access the email queue.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight="600" gutterBottom>Email Queue</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor and manage outgoing email delivery
                </Typography>
              </Box>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchEmails} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Filters</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth size="small"
                      label="Search"
                      placeholder="to, from, subject..."
                      value={filters.search}
                      onChange={e => handleFilterChange('search', e.target.value)}
                      InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.is_sent}
                        label="Status"
                        onChange={e => handleFilterChange('is_sent', e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Sent</MenuItem>
                        <MenuItem value="false">Pending / Failed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterList />}
                      onClick={() => { setFilters({ search: '', is_sent: '' }); setPagination(p => ({ ...p, page: 0 })); }}
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Card>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell>Created</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Retries</TableCell>
                        <TableCell>Error</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : emails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Email sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                            <Typography color="text.secondary">No emails found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        emails.map(email => (
                          <TableRow key={email.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(email.created_at).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{email.to_email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {email.subject}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={email.is_sent ? 'Sent' : email.error_message ? 'Failed' : 'Pending'}
                                color={email.is_sent ? 'success' : email.error_message ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{email.retry_count}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error.main" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {email.error_message || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="View Email">
                                  <IconButton size="small" onClick={() => handleViewDetail(email.id)}>
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {!email.is_sent && (
                                  <Tooltip title="Retry">
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRetry(email.id)}
                                        disabled={actionLoading === email.id}
                                      >
                                        {actionLoading === email.id ? <CircularProgress size={16} /> : <Replay fontSize="small" />}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error" onClick={() => setDeleteConfirm(email.id)}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={pagination.page}
                  onPageChange={(_, p) => setPagination(prev => ({ ...prev, page: p }))}
                  rowsPerPage={pagination.rowsPerPage}
                  onRowsPerPageChange={e => setPagination(prev => ({ ...prev, rowsPerPage: parseInt(e.target.value, 10), page: 0 }))}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Email Detail Dialog — mailbox-style view */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          {selectedEmail && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email color="primary" />
                  <Typography variant="h6" fontWeight="600">Email Detail</Typography>
                </Box>
                <IconButton size="small" onClick={() => setDetailOpen(false)}><Close /></IconButton>
              </DialogTitle>
              <Divider />
              <DialogContent sx={{ p: 0 }}>
                {/* Email header — like a mail client */}
                <Box sx={{ px: 3, py: 2, backgroundColor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        {selectedEmail.subject}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>From:</strong> {selectedEmail.from_name ? `${selectedEmail.from_name} <${selectedEmail.from_email}>` : selectedEmail.from_email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>To:</strong> {selectedEmail.to_email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Date:</strong> {new Date(selectedEmail.created_at).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary"><strong>Status:</strong></Typography>
                        <Chip
                          label={selectedEmail.is_sent ? 'Sent' : selectedEmail.error_message ? 'Failed' : 'Pending'}
                          color={selectedEmail.is_sent ? 'success' : selectedEmail.error_message ? 'error' : 'warning'}
                          size="small"
                        />
                        {selectedEmail.retry_count > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({selectedEmail.retry_count} retries)
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    {selectedEmail.sent_at && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Sent at:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    {selectedEmail.error_message && (
                      <Grid item xs={12}>
                        <Alert severity="error" sx={{ mt: 1 }}>
                          <strong>Error:</strong> {selectedEmail.error_message}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Email body — rendered as HTML if it looks like HTML, otherwise plain text */}
                <Box sx={{ p: 3 }}>
                  {selectedEmail.body.trim().startsWith('<') ? (
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                        '& iframe': { border: 'none', width: '100%', minHeight: 400 },
                      }}
                    >
                      <iframe
                        title="email-body"
                        srcDoc={selectedEmail.body}
                        sandbox="allow-same-origin"
                        style={{ width: '100%', minHeight: 400, border: 'none' }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedEmail.body}
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <Divider />
              <DialogActions sx={{ px: 3, py: 2 }}>
                {!selectedEmail.is_sent && (
                  <Button
                    variant="contained"
                    startIcon={<Replay />}
                    onClick={() => { handleRetry(selectedEmail.id); setDetailOpen(false); }}
                  >
                    Retry
                  </Button>
                )}
                <Button onClick={() => setDetailOpen(false)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Email</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this email from the queue? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={!!actionLoading}
            >
              {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
