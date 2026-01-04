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
  Grid,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Add,
  Business,
  People,
  Refresh,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function CompanyManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    domain: '',
    settings: {}
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tenants');
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTenant = (tenant) => {
    setSelectedTenant(tenant);
    setViewDialog(true);
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant);
    setEditData({
      name: tenant.name,
      description: tenant.description || '',
      domain: tenant.domain || '',
      settings: tenant.settings || {}
    });
    setEditDialog(true);
  };

  const handleCreateTenant = () => {
    setEditData({
      name: '',
      description: '',
      domain: '',
      settings: {}
    });
    setCreateDialog(true);
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    try {
      await api.put(`/admin/tenants/${selectedTenant.id}`, editData);
      setEditDialog(false);
      fetchTenants();
      alert('Tenant updated successfully');
    } catch (error) {
      console.error('Failed to update tenant:', error);
      alert('Failed to update tenant');
    }
  };

  const handleCreateTenantSubmit = async () => {
    try {
      await api.post('/admin/tenants', editData);
      setCreateDialog(false);
      fetchTenants();
      alert('Tenant created successfully');
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert('Failed to create tenant');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
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
            Company Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateTenant}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Add Company
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTenants}
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Members</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow 
                      key={tenant.id}
                      sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <Business />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {tenant.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tenant.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{tenant.domain || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.status?.toUpperCase() || 'ACTIVE'}
                          color={getStatusColor(tenant.status || 'active')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <People fontSize="small" />
                          {tenant.member_count || 0}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => handleViewTenant(tenant)}
                            color="primary"
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            onClick={() => handleEditTenant(tenant)}
                            color="secondary"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {tenants.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No companies found
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog 
          open={viewDialog} 
          onClose={() => setViewDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Company Details - {selectedTenant?.name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Typography><strong>Name:</strong> {selectedTenant?.name}</Typography>
                <Typography><strong>Description:</strong> {selectedTenant?.description || 'N/A'}</Typography>
                <Typography><strong>Domain:</strong> {selectedTenant?.domain || 'N/A'}</Typography>
                <Typography><strong>Status:</strong> {selectedTenant?.status || 'active'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Statistics</Typography>
                <Typography><strong>Members:</strong> {selectedTenant?.member_count || 0}</Typography>
                <Typography><strong>Created:</strong> {new Date(selectedTenant?.created_at).toLocaleDateString()}</Typography>
                <Typography><strong>Updated:</strong> {new Date(selectedTenant?.updated_at).toLocaleDateString()}</Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialog} 
          onClose={() => setEditDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Edit Company</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Domain"
                value={editData.domain}
                onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
                placeholder="company.com"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateTenant}
              variant="contained"
              startIcon={<Edit />}
            >
              Update Company
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Dialog */}
        <Dialog 
          open={createDialog} 
          onClose={() => setCreateDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Create New Company</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Domain"
                value={editData.domain}
                onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
                placeholder="company.com"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTenantSubmit}
              variant="contained"
              startIcon={<Add />}
              disabled={!editData.name}
            >
              Create Company
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
