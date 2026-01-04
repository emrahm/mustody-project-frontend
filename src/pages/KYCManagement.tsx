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
  Avatar,
  Divider,
} from '@mui/material';
import {
  Visibility,
  Download,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
  Description,
  Image,
  PictureAsPdf,
  InsertDriveFile,
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
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDocuments = async (userId) => {
    try {
      // Documents are already in the request data, no need for separate API call
      const request = requests.find(r => r.user_id === userId);
      if (request?.data?.documents) {
        const docList = Object.keys(request.data.documents);
        setDocuments(docList);
      } else {
        setDocuments([]);
      }
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

  const getFileIcon = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return <PictureAsPdf sx={{ color: 'error.main' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <Image sx={{ color: 'info.main' }} />;
      case 'doc':
      case 'docx': return <Description sx={{ color: 'primary.main' }} />;
      default: return <InsertDriveFile sx={{ color: 'grey.600' }} />;
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
            KYC Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchKYCRequests}
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
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Documents</TableCell>
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
                          <Avatar 
                            src={request.user?.avatar_url}
                            sx={{ width: 32, height: 32 }}
                          >
                            {request.user?.name?.charAt(0)}
                          </Avatar>
                          {request.user?.name || 'N/A'}
                        </Box>
                      </TableCell>
                      <TableCell>{request.user?.email || 'N/A'}</TableCell>
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
                      <TableCell>{Object.keys(request.data?.documents || {}).length} files</TableCell>
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
        <Dialog 
          open={reviewDialog} 
          onClose={() => setReviewDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 3,
              boxShadow: 4,
              bgcolor: 'grey.50'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600,
            bgcolor: 'primary.dark',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Visibility />
            Review KYC Request - {selectedRequest?.user?.name}
          </DialogTitle>
          <DialogContent sx={{ p: 3, bgcolor: 'white', m: 2, borderRadius: 2 }}>
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
                    <CheckCircle />
                    User Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      src={selectedRequest?.user?.avatar_url}
                      sx={{ width: 40, height: 40 }}
                    >
                      {selectedRequest?.user?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 500 }}>
                        {selectedRequest?.user?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRequest?.user?.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography><strong>Status:</strong></Typography>
                    <Chip 
                      label={selectedRequest?.status} 
                      color={getStatusColor(selectedRequest?.status)}
                      size="small"
                      icon={getStatusIcon(selectedRequest?.status)}
                    />
                  </Box>
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
                    <InsertDriveFile />
                    Documents ({documents?.length || 0})
                  </Typography>
                  <Box sx={{ maxHeight: 180, overflowY: 'auto' }}>
                    {documents && documents.length > 0 ? documents.map((doc, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 1,
                        p: 1,
                        bgcolor: 'white',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        {getFileIcon(doc)}
                        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.85rem' }}>
                          {doc}
                        </Typography>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadDocument(selectedRequest.user_id, doc)}
                          sx={{ ml: 1 }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Box>
                    )) : (
                      <Typography variant="body2" color="text.secondary">No documents uploaded</Typography>
                    )}
                  </Box>
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
                      <MenuItem value="verified">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle color="success" />
                          Verified
                        </Box>
                      </MenuItem>
                      <MenuItem value="rejected">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Cancel color="error" />
                          Rejected
                        </Box>
                      </MenuItem>
                      <MenuItem value="in_progress">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Pending color="warning" />
                          Under Review
                        </Box>
                      </MenuItem>
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
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateStatus}
              variant="contained"
              disabled={!reviewData.status}
              startIcon={<CheckCircle />}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
