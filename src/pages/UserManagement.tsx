import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Menu,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  People,
  MoreVert,
  Check,
  Close,
  Delete,
  PersonAdd,
  Security,
  Refresh,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { adminAPI, AdminUser } from '@/lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getUsers(page, limit);
      setUsers(res.data.users ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser || !newStatus) return;
    setActionLoading(true);
    try {
      await adminAPI.updateUserStatus(selectedUser, newStatus);
      setUsers(prev => prev.map(u => u.id === selectedUser ? { ...u, user_status: newStatus } : u));
      setStatusDialog(false);
      setNewStatus('');
      handleMenuClose();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to delete user');
    } finally {
      setActionLoading(false);
      setDeleteDialog(false);
      setUserToDelete(null);
      handleMenuClose();
    }
  };

  const handleReset2FA = async (id: string) => {
    setActionLoading(true);
    try {
      await adminAPI.reset2FA(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, two_factor_enabled: false } : u));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to reset 2FA');
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      case 'inactive': return 'default';
      case 'invited': return 'warning';
      default: return 'default';
    }
  };

  const getUserRole = (user: AdminUser): string => {
    if (user.roles?.length) return user.roles[0].role;
    if (user.members?.length) return user.members[0].role;
    return 'user';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'owner': return 'error';
      case 'tenant_admin': return 'warning';
      default: return 'info';
    }
  };

  const getUserCompany = (user: AdminUser): string => {
    if (user.members?.length) return user.members[0].tenant?.name ?? '-';
    return '-';
  };

  const activeCount = users.filter(u => u.user_status === 'active').length;
  const twoFACount = users.filter(u => u.two_factor_enabled).length;

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage user registrations, roles, and permissions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'primary.light', color: 'white' }}>
                    <People />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{total}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'success.light', color: 'white' }}>
                    <Check />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{activeCount}</Typography>
                    <Typography variant="body2" color="text.secondary">Active Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'warning.light', color: 'white' }}>
                    <PersonAdd />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {users.filter(u => u.user_status === 'invited').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'info.light', color: 'white' }}>
                    <Security />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{twoFACount}</Typography>
                    <Typography variant="body2" color="text.secondary">2FA Enabled</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Users Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Registered Users
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Security</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No users found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {user.name?.charAt(0) ?? '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="600">
                                  {user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{getUserCompany(user)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getUserRole(user)}
                              size="small"
                              color={getRoleColor(getUserRole(user)) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.user_status}
                              size="small"
                              color={getStatusColor(user.user_status) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Chip
                                label={user.email_verified ? 'Email ✓' : 'Email ✗'}
                                size="small"
                                color={user.email_verified ? 'success' : 'default'}
                                variant="outlined"
                              />
                              <Chip
                                label={user.two_factor_enabled ? '2FA ✓' : '2FA ✗'}
                                size="small"
                                color={user.two_factor_enabled ? 'success' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, user.id)}
                              disabled={actionLoading}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {total > limit && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(total / limit)}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { setNewStatus('active'); setStatusDialog(true); handleMenuClose(); }}>
            <Check fontSize="small" sx={{ mr: 1 }} />
            Set Active
          </MenuItem>
          <MenuItem onClick={() => { setNewStatus('suspended'); setStatusDialog(true); handleMenuClose(); }}>
            <Close fontSize="small" sx={{ mr: 1 }} />
            Suspend User
          </MenuItem>
          <MenuItem onClick={() => selectedUser && handleReset2FA(selectedUser)}>
            <Security fontSize="small" sx={{ mr: 1 }} />
            Reset 2FA
          </MenuItem>
          <MenuItem onClick={() => { setUserToDelete(selectedUser); setDeleteDialog(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete User
          </MenuItem>
        </Menu>

        {/* Change Status Dialog */}
        <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Update User Status</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Changing user status will affect their access immediately.
            </Alert>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} variant="contained" disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : 'Update Status'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 1 }}>
              This action cannot be undone. The user will be deactivated and lose all access immediately.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to continue?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              onClick={() => userToDelete && handleDelete(userToDelete)}
              variant="contained"
              color="error"
              disabled={actionLoading}
            >
              {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
