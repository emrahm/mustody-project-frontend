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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { People, PersonAdd } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'owner', label: 'Owner', description: 'Organization owner' },
  { value: 'tenant_admin', label: 'Tenant Admin', description: 'Tenant management access' },
  { value: 'tenant_user', label: 'Tenant User', description: 'Basic tenant access' },
  { value: 'tenant_viewer', label: 'Tenant Viewer', description: 'Read-only access' },
];

export default function RoleManagement() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', roles: ['tenant_admin'] },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', roles: ['tenant_user'] },
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const canAssignRole = (role: string) => {
    if (hasRole('admin') || hasRole('owner')) {
      return true; // Admin can assign any role
    }
    if (hasRole('tenant_admin')) {
      return ['tenant_viewer', 'tenant_admin', 'tenant_user'].includes(role);
    }
    return false;
  };

  const handleAssignRole = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    setSelectedUser(userToUpdate);
    setOpenDialog(true);
  };

  const handleSaveRole = () => {
    if (selectedUser && newRole) {
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, roles: [...u.roles, newRole] }
          : u
      ));
      setOpenDialog(false);
      setSelectedUser(null);
      setNewRole('');
    }
  };

  const getAvailableRoles = () => {
    if (hasRole('admin') || hasRole('owner')) {
      return roleOptions;
    }
    if (hasRole('tenant_admin')) {
      return roleOptions.filter(role => 
        ['tenant_viewer', 'tenant_admin', 'tenant_user'].includes(role.value)
      );
    }
    return [];
  };

  if (!hasRole('admin') && !hasRole('owner') && !hasRole('tenant_admin')) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography>
            You don't have permission to manage user roles.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <People sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Role Management
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                User Roles
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setOpenDialog(true)}
              >
                Assign Role
              </Button>
            </Box>

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
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {user.roles.map((role) => (
                            <Box
                              key={role}
                              sx={{
                                px: 2,
                                py: 0.5,
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderRadius: 1,
                                fontSize: '0.875rem',
                              }}
                            >
                              {roleOptions.find(r => r.value === role)?.label || role}
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleAssignRole(user.id)}
                        >
                          Manage Roles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
