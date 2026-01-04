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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
  Business,
  Person,
  Description,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function TenantRequestManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    review_notes: ''
  });
  const [editData, setEditData] = useState({
    name: '',
    company: '',
    purpose: ''
  });

  useEffect(() => {
    fetchTenantRequests();
  }, []);

  const fetchTenantRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tenant-requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tenant requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setReviewData({ status: '', review_notes: '' });
    setReviewDialog(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setEditData({
      name: request.name,
      company: request.company,
      purpose: request.purpose
    });
    setEditDialog(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      await api.put(`/admin/tenant-requests/${selectedRequest.id}`, editData);
      setEditDialog(false);
      fetchTenantRequests();
      alert('Tenant request updated successfully');
    } catch (error) {
      console.error('Failed to update request:', error);
      alert('Failed to update request');
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest || !reviewData.status) return;

    try {
      await api.put(`/admin/tenant-requests/${selectedRequest.id}/review`, reviewData);
      setReviewDialog(false);
      setReviewData({ status: '', review_notes: '' });
      fetchTenantRequests();
      alert('Tenant request reviewed successfully');
    } catch (error) {
      console.error('Failed to review request:', error);
      alert('Failed to review request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'in_progress': return 'info';
      case 'required_meeting': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'in_progress': return <Pending />;
      case 'required_meeting': return <Pending />;
      case 'pending': return <Pending />;
      default: return <Pending />;
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Tenant Request Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTenantRequests}
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Refresh
          </Button>
        </Box>

        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Applicant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow 
                      key={request.id}
                      sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {request.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {request.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{request.company}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(request.status)}
                          icon={getStatusIcon(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => handleViewRequest(request)}
                            color="primary"
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                          {(request.status === 'pending' || request.status === 'in_progress') && (
                            <IconButton
                              onClick={() => handleEditRequest(request)}
                              color="secondary"
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {requests.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No tenant requests found
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog 
          open={reviewDialog} 
          onClose={() => setReviewDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Visibility />
            Review Tenant Request - {selectedRequest?.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'primary.main'
                  }}>
                    <Person />
                    Applicant Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {selectedRequest?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 500 }}>
                        {selectedRequest?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRequest?.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography><strong>Status:</strong> {selectedRequest?.status}</Typography>
                  <Typography><strong>Submitted:</strong> {new Date(selectedRequest?.created_at).toLocaleDateString()}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'success.main'
                  }}>
                    <Business />
                    Company Details
                  </Typography>
                  <Typography sx={{ mb: 2 }}>
                    <strong>Company:</strong> {selectedRequest?.company}
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'info.main'
                  }}>
                    <Description />
                    Use Case
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    bgcolor: 'white',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    {selectedRequest?.purpose}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'warning.main'
                  }}>
                    <Pending />
                    Review Decision
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={reviewData.status}
                      onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="in_progress">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Pending color="info" />
                          In Progress
                        </Box>
                      </MenuItem>
                      <MenuItem value="required_meeting">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Pending color="warning" />
                          Required Meeting
                        </Box>
                      </MenuItem>
                      <MenuItem value="approved">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle color="success" />
                          Approved
                        </Box>
                      </MenuItem>
                      <MenuItem value="rejected">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Cancel color="error" />
                          Rejected
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Review Notes"
                    value={reviewData.review_notes}
                    onChange={(e) => setReviewData({ ...reviewData, review_notes: e.target.value })}
                    placeholder="Add notes about the review decision..."
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button
              onClick={handleReviewRequest}
              variant="contained"
              disabled={!reviewData.status}
              startIcon={<CheckCircle />}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialog} 
          onClose={() => setEditDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Edit Tenant Request</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Company"
                value={editData.company}
                onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Use Case"
                value={editData.purpose}
                onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateRequest}
              variant="contained"
              startIcon={<Edit />}
            >
              Update Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
