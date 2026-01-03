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
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Refresh,
  Security,
  Visibility,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import AuditLogDetailsDialog from '@/components/AuditLogDetailsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  level: string;
  message: string;
  ip_address: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AuditLogsMUI() {
  const { hasGlobalRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    level: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 25,
    total: 0
  });

  // Check if user has admin access
  const hasAccess = hasGlobalRole('admin') || hasGlobalRole('owner');

  useEffect(() => {
    if (hasAccess) {
      fetchAuditLogs();
    } else {
      setLoading(false);
    }
  }, [pagination.page, pagination.rowsPerPage, filters, hasAccess]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: (pagination.page + 1).toString(),
        limit: pagination.rowsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await api.get(`/audit-logs?${params}`);
      setLogs(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      setError(error.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (logId: string) => {
    try {
      const response = await api.get(`/audit-logs/${logId}`);
      setSelectedLog(response.data);
      setDetailsOpen(true);
    } catch (error: any) {
      console.error('Failed to fetch log details:', error);
      setError(error.response?.data?.message || 'Failed to fetch log details');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resource: '',
      level: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Level', 'Message', 'IP Address'],
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user?.name || 'System',
        log.action,
        log.resource,
        log.level,
        log.message,
        log.ip_address
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'success';
      case 'update': return 'info';
      case 'delete': return 'error';
      case 'login': return 'primary';
      case 'logout': return 'default';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {!hasAccess ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Access Denied
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You need administrator privileges to access audit logs.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight="600" gutterBottom>
                  Audit Logs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track all system activities and user actions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton onClick={fetchAuditLogs} disabled={loading}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={exportLogs}
                  disabled={logs.length === 0}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.action}
                    label="Action"
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    <MenuItem value="create">Create</MenuItem>
                    <MenuItem value="update">Update</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                    <MenuItem value="login">Login</MenuItem>
                    <MenuItem value="logout">Logout</MenuItem>
                    <MenuItem value="view">View</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={filters.level}
                    label="Level"
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource</InputLabel>
                  <Select
                    value={filters.resource}
                    label="Resource"
                    onChange={(e) => handleFilterChange('resource', e.target.value)}
                  >
                    <MenuItem value="">All Resources</MenuItem>
                    <MenuItem value="audit-logs">Audit Logs</MenuItem>
                    <MenuItem value="profile">Profile</MenuItem>
                    <MenuItem value="dashboard">Dashboard</MenuItem>
                    <MenuItem value="users">Users</MenuItem>
                    <MenuItem value="tenants">Tenants</MenuItem>
                    <MenuItem value="api-keys">API Keys</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Search in messages, users, resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No audit logs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {log.user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.user.email}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              System
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {log.resource}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.level}
                            color={getLevelColor(log.level) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {log.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {log.ip_address}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(log.id)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
              onPageChange={(_, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
              rowsPerPage={pagination.rowsPerPage}
              onRowsPerPageChange={(e) => setPagination(prev => ({ 
                ...prev, 
                rowsPerPage: parseInt(e.target.value, 10),
                page: 0
              }))}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </CardContent>
        </Card>
          </>
        )}
        
        <AuditLogDetailsDialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          log={selectedLog}
        />
      </Box>
    </DashboardLayout>
  );
}
