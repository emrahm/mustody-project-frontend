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
  TextField,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add,
  Business,
  MoreVert,
  Edit,
  Delete,
  Check,
  Close,
  Visibility,
  People,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DashboardLayout from '@/components/DashboardLayout';

const schema = yup.object({
  name: yup.string().required('Company name is required'),
  domain: yup.string().required('Domain is required'),
  registrationKey: yup.string().required('Registration key is required'),
  maxUsers: yup.number().min(1, 'Must be at least 1').required('Max users is required'),
});

type FormData = yup.InferType<typeof schema>;

const mockCompanies = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    domain: 'techcorp.com',
    registrationKey: 'TECH2024',
    status: 'active',
    maxUsers: 50,
    currentUsers: 12,
    createdAt: '2024-01-15',
    adminEmail: 'admin@techcorp.com',
  },
  {
    id: '2',
    name: 'StartupXYZ',
    domain: 'startupxyz.io',
    registrationKey: 'STARTUP2024',
    status: 'pending',
    maxUsers: 25,
    currentUsers: 0,
    createdAt: '2024-01-20',
    adminEmail: 'founder@startupxyz.io',
  },
];

export default function CompanyManagement() {
  const [companies, setCompanies] = useState(mockCompanies);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      domain: '',
      registrationKey: '',
      maxUsers: 10,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCompany = {
        id: Date.now().toString(),
        name: data.name,
        domain: data.domain,
        registrationKey: data.registrationKey,
        status: 'active',
        maxUsers: data.maxUsers,
        currentUsers: 0,
        createdAt: new Date().toISOString().split('T')[0],
        adminEmail: `admin@${data.domain}`,
      };
      
      setCompanies(prev => [...prev, newCompany]);
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, companyId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompany(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleApprove = (id: string) => {
    setCompanies(prev => prev.map(company => 
      company.id === id ? { ...company, status: 'active' } : company
    ));
    handleMenuClose();
  };

  const handleReject = (id: string) => {
    setCompanies(prev => prev.map(company => 
      company.id === id ? { ...company, status: 'rejected' } : company
    ));
    handleMenuClose();
  };

  const handleDelete = (id: string) => {
    setCompanies(prev => prev.filter(company => company.id !== id));
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

  const generateRegistrationKey = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Company Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage registered companies and their access permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            size="large"
          >
            Add Company
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'primary.light', color: 'white' }}>
                    <Business />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {companies.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Companies
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
                      {companies.filter(c => c.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Companies
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
                    <Close />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {companies.filter(c => c.status === 'pending').length}
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
                    <People />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {companies.reduce((sum, c) => sum + c.currentUsers, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Companies Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Registered Companies
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Registration Key</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {company.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {company.adminEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {company.domain}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {company.registrationKey}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={company.status}
                          size="small"
                          color={getStatusColor(company.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {company.currentUsers} / {company.maxUsers}
                        </Typography>
                      </TableCell>
                      <TableCell>{company.createdAt}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuClick(e, company.id)}
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
          <MenuItem onClick={() => handleApprove(selectedCompany!)}>
            <Check fontSize="small" sx={{ mr: 1 }} />
            Approve
          </MenuItem>
          <MenuItem onClick={() => handleReject(selectedCompany!)}>
            <Close fontSize="small" sx={{ mr: 1 }} />
            Reject
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Visibility fontSize="small" sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => handleDelete(selectedCompany!)} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Add Company Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Company</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                Companies need a registration key to allow their users to sign up. 
                Only users with matching company domains can register.
              </Alert>

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Company Name"
                    fullWidth
                    sx={{ mb: 3 }}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="domain"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Company Domain"
                    fullWidth
                    sx={{ mb: 3 }}
                    error={!!errors.domain}
                    helperText={errors.domain?.message}
                    placeholder="example.com"
                  />
                )}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Controller
                  name="registrationKey"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Registration Key"
                      sx={{ flex: 1 }}
                      error={!!errors.registrationKey}
                      helperText={errors.registrationKey?.message}
                    />
                  )}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    const key = generateRegistrationKey();
                    // Update form value
                  }}
                >
                  Generate
                </Button>
              </Box>

              <Controller
                name="maxUsers"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Maximum Users"
                    type="number"
                    fullWidth
                    error={!!errors.maxUsers}
                    helperText={errors.maxUsers?.message}
                  />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Adding...' : 'Add Company'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
