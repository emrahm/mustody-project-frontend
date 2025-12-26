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
  Alert,
} from '@mui/material';
import {
  Visibility,
  Download,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function KYCManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchKYCRequests();
  }, []);

  const fetchKYCRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kyc/admin/requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDocuments = async (userId) => {
    try {
      const response = await api.get(`/kyc/admin/documents/${userId}`);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    }
  };

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    await fetchUserDocuments(request.user_id);
    setReviewDialog(true);
  };

  const handleDownloadDocument = async (userId, filename) => {
    try {
      const response = await api.get(`/kyc/admin/document/${userId}/${filename}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !reviewData.status) return;

    try {
      await api.put(`/kyc/admin/status/${selectedRequest.user_id}`, reviewData);
      setReviewDialog(false);
      setReviewData({ status: '', notes: '' });
      fetchKYCRequests();
      alert('KYC status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'rejected': return 'error';
      case 'under_review': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'under_review': return <Pending />;
      case 'pending': return <Pending />;
      default: return <Pending />;
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">KYC Management</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchKYCRequests}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.user_id}>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(request.status)}
                          icon={getStatusIcon(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(request.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{request.documents?.length || 0} files</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewRequest(request)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {requests.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No KYC requests found
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Review KYC Request - {selectedRequest?.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>User Information</Typography>
                <Typography><strong>Name:</strong> {selectedRequest?.name}</Typography>
                <Typography><strong>Email:</strong> {selectedRequest?.email}</Typography>
                <Typography><strong>Status:</strong> {selectedRequest?.status}</Typography>
                <Typography><strong>Submitted:</strong> {selectedRequest?.submitted_at}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Documents ({documents.length})</Typography>
                {documents.map((doc, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2">{doc}</Typography>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadDocument(selectedRequest.user_id, doc)}
                    >
                      Download
                    </Button>
                  </Box>
                ))}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Review Decision</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={reviewData.status}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                  >
                    <MenuItem value="verified">Verified</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Review Notes"
                  value={reviewData.notes}
                  onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                  placeholder="Add notes about the review decision..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateStatus}
              variant="contained"
              disabled={!reviewData.status}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
