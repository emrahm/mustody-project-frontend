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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Email,
  CalendarToday,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function TeamManagementMUI() {
  const { addNotification } = useNotifications();
  const { user, hasGlobalRole } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const isAdmin = hasGlobalRole('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchTenants();
    } else {
      fetchTeamMembers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedTenant) {
      fetchTeamMembers(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/admin/tenants');
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      addNotification('Failed to fetch tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (tenantId?: string) => {
    try {
      const params = tenantId ? { tenant_id: tenantId } : {};
      const response = await api.get('/tenant/members', { params });
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      addNotification('Failed to fetch team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    
    setInviteLoading(true);
    try {
      await api.post('/tenant/invite', {
        email: inviteEmail,
      });
      
      setShowInviteModal(false);
      setInviteEmail('');
      fetchTeamMembers(selectedTenant);
      addNotification('Team member invited successfully', 'success');
    } catch (error) {
      console.error('Failed to invite member:', error);
      addNotification('Failed to invite team member', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const getRoleColor = (role: string): "success" | "warning" | "error" | "default" | "primary" | "secondary" => {
    switch (role) {
      case 'admin': return 'error';
      case 'tenant_admin': return 'primary';
      case 'tenant_user': return 'success';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'tenant_admin': return 'Tenant Admin';
      case 'tenant_user': return 'User';
      default: return role;
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <People sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Team Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage team members in your organization
              </Typography>
            </Box>
          </Box>
          {!isAdmin && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Member
            </Button>
          )}
        </Box>

        {isAdmin && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Tenant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a tenant to view their team members
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select a tenant...</InputLabel>
                <Select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  label="Select a tenant..."
                >
                  {tenants.map((tenant) => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Team Members</Typography>
              <Typography variant="body2" color="text.secondary">
                {teamMembers.length} member(s)
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (isAdmin && !selectedTenant) ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <People sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Please select a tenant to view team members
                </Typography>
              </Box>
            ) : teamMembers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <People sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No team members found
                </Typography>
                {!isAdmin && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Invite your first team member to get started
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={() => setShowInviteModal(true)}
                    >
                      Invite Member
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Joined</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              <Email />
                            </Avatar>
                            <Typography variant="body2">
                              {member.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleLabel(member.role)}
                            size="small"
                            color={getRoleColor(member.role)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Invite Member Dialog */}
        {!isAdmin && (
          <Dialog open={showInviteModal} onClose={() => setShowInviteModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  fullWidth
                  placeholder="Enter email address"
                />
                <Alert severity="info">
                  An invitation email will be sent to this address with instructions to join your team.
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button 
                onClick={handleInviteMember} 
                disabled={inviteLoading || !inviteEmail} 
                variant="contained"
              >
                {inviteLoading ? <CircularProgress size={20} /> : 'Send Invitation'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </DashboardLayout>
  );
}
