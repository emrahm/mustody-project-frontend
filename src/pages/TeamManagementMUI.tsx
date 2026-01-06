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
import { api } from '@/lib/api';

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_at: string;
  accepted_at?: string;
  role?: string;
}

export default function TeamManagementMUI() {
  const { addNotification } = useNotifications();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/tenant/members');
      setTeamMembers(Array.isArray(response.data) ? response.data : response.data?.data || []);
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
        role: inviteRole,
      });
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('user');
      fetchTeamMembers();
      addNotification('Team member invited successfully', 'success');
    } catch (error) {
      console.error('Failed to invite member:', error);
      addNotification('Failed to invite team member', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'pending': return <Schedule sx={{ color: 'warning.main' }} />;
      case 'expired': return <Cancel sx={{ color: 'error.main' }} />;
      default: return <Schedule sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'accepted': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Active';
      case 'pending': return 'Pending';
      case 'expired': return 'Expired';
      default: return status;
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
                Manage your organization team members
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setShowInviteModal(true)}
          >
            Invite Member
          </Button>
        </Box>

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
            ) : teamMembers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <People sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No team members yet
                </Typography>
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
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Invited</TableCell>
                      <TableCell>Accepted</TableCell>
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
                              {member.name || 'Invited User'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(member.status)}
                            <Chip
                              label={getStatusLabel(member.status)}
                              size="small"
                              color={getStatusColor(member.status)}
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(member.invited_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {member.accepted_at ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(member.accepted_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
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
      </Box>
    </DashboardLayout>
  );
}
