import React, { useState } from 'react';
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
} from '@mui/material';
import {
  People,
  MoreVert,
  Check,
  Close,
  Edit,
  Delete,
  PersonAdd,
  Security,
  Business,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@techcorp.com',
    company: 'TechCorp Inc.',
    role: 'tenant_admin',
    status: 'active',
    emailVerified: true,
    twoFactorEnabled: true,
    lastLogin: '2024-01-20',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@techcorp.com',
    company: 'TechCorp Inc.',
    role: 'tenant_user',
    status: 'pending',
    emailVerified: false,
    twoFactorEnabled: false,
    lastLogin: null,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@startupxyz.io',
    company: 'StartupXYZ',
    role: 'owner',
    status: 'active',
    emailVerified: true,
    twoFactorEnabled: false,
    lastLogin: '2024-01-19',
    createdAt: '2024-01-18',
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleApprove = (id: string) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, status: 'active' } : user
    ));
    handleMenuClose();
  };

  const handleReject = (id: string) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, status: 'rejected' } : user
    ));
    handleMenuClose();
  };

  const handleChangeRole = () => {
    if (selectedUser && newRole) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser ? { ...user, role: newRole } : user
      ));
      setRoleDialog(false);
      setNewRole('');
      handleMenuClose();
    }
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'suspended': return 'default';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'error';
      case 'tenant_admin': return 'warning';
      case 'tenant_user': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'tenant_admin': return 'Admin';
      case 'tenant_user': return 'User';
      default: return role;
    }
  };

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
        </Box>

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
                    <Typography variant="h5" fontWeight="bold">
                      {users.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
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
                    <Typography variant="h5" fontWeight="bold">
                      {users.filter(u => u.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
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
                      {users.filter(u => u.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approval
                    </Typography>
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
                    <Typography variant="h5" fontWeight="bold">
                      {users.filter(u => u.twoFactorEnabled).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      2FA Enabled
                    </Typography>
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
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Security</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {user.name.charAt(0)}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business fontSize="small" color="action" />
                          <Typography variant="body2">
                            {user.company}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(user.role)}
                          size="small"
                          color={getRoleColor(user.role) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          color={getStatusColor(user.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={user.emailVerified ? 'Email ✓' : 'Email ✗'}
                            size="small"
                            color={user.emailVerified ? 'success' : 'default'}
                            variant="outlined"
                          />
                          <Chip
                            label={user.twoFactorEnabled ? '2FA ✓' : '2FA ✗'}
                            size="small"
                            color={user.twoFactorEnabled ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{user.lastLogin || 'Never'}</TableCell>
                      <TableCell>{user.createdAt}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuClick(e, user.id)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleApprove(selectedUser!)}>
            <Check fontSize="small" sx={{ mr: 1 }} />
            Approve User
          </MenuItem>
          <MenuItem onClick={() => handleReject(selectedUser!)}>
            <Close fontSize="small" sx={{ mr: 1 }} />
            Reject User
          </MenuItem>
          <MenuItem onClick={() => { setRoleDialog(true); handleMenuClose(); }}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Change Role
          </MenuItem>
          <MenuItem onClick={() => handleDelete(selectedUser!)} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete User
          </MenuItem>
        </Menu>

        {/* Change Role Dialog */}
        <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Changing user roles will affect their access permissions immediately.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>New Role</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                label="New Role"
              >
                <MenuItem value="owner">Owner</MenuItem>
                <MenuItem value="tenant_admin">Admin</MenuItem>
                <MenuItem value="tenant_user">User</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} variant="contained">
              Change Role
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
