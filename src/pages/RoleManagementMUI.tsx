import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { People, PersonAdd, Security } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'owner', label: 'Owner', description: 'Organization owner' },
  { value: 'tenant_admin', label: 'Tenant Admin', description: 'Tenant management access' },
  { value: 'user', label: 'User', description: 'Basic access' },
];

export default function RoleManagementMUI() {
  const { user, hasRole } = useAuth();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/tenant/members');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canAssignRole = (role: string) => {
    if (hasRole('admin') || hasRole('owner')) {
      return true;
    }
    if (hasRole('tenant_admin')) {
      return ['user', 'tenant_admin'].includes(role);
    }
    return false;
  };

  const handleAssignRole = (userToUpdate: User) => {
    setSelectedUser(userToUpdate);
    setOpenDialog(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await api.put(`/tenant/members/${selectedUser.id}/role`, {
        role: newRole,
      });
      
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, roles: [...u.roles.filter(r => r !== newRole), newRole] }
          : u
      ));
      
      setOpenDialog(false);
      setSelectedUser(null);
      setNewRole('');
      addNotification('Role assigned successfully', 'success');
    } catch (error) {
      console.error('Failed to assign role:', error);
      addNotification('Failed to assign role', 'error');
    }
  };

  const getAvailableRoles = () => {
    if (hasRole('admin') || hasRole('owner')) {
      return roleOptions;
    }
    if (hasRole('tenant_admin')) {
      return roleOptions.filter(role => 
        ['user', 'tenant_admin'].includes(role.value)
      );
    }
    return [];
  };

  if (!hasRole('admin') && !hasRole('owner') && !hasRole('tenant_admin')) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <Typography variant="h6">Access Denied</Typography>
            <Typography>You don't have permission to manage user roles.</Typography>
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Security sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Role Management
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">User Roles</Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Roles</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>{userItem.name}</TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {userItem.roles?.map((role) => (
                              <Chip
                                key={role}
                                label={roleOptions.find(r => r.value === role)?.label || role}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAssignRole(userItem)}
                          >
                            Manage Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Assign Role {selectedUser && `to ${selectedUser.name}`}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                label="Role"
              >
                {getAvailableRoles().map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Box>
                      <Typography variant="body1">{role.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} variant="contained">
              Assign Role
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
