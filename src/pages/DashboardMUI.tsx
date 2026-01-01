import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';
import TenantRequestDialog from '@/components/TenantRequestDialog';
import {
  TrendingUp,
  Security,
  People,
  Key,
  Warning,
  CheckCircle,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  AccountBalanceWallet,
  Business,
  Notifications,
  SwapHoriz,
  Person,
  VerifiedUser,
  Shield,
  Smartphone,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { tenantAPI } from '@/lib/api';
import { Link } from 'wouter';

const StatCard = ({ title, value, change, icon, color = 'primary' }: any) => {
  const theme = useTheme();
  const isPositive = change > 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
            }}
          >
            {icon}
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
        
        <Typography variant="h4" fontWeight="700" gutterBottom>
          {value}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isPositive ? (
            <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
              fontWeight: 600,
            }}
          >
            {Math.abs(change)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function DashboardContent() {
  const theme = useTheme();
  const { user, hasRole } = useAuth();
  const { notifications } = useNotifications();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activitiesResponse, profileResponse] = await Promise.all([
          tenantAPI.getDashboardStats(),
          tenantAPI.getRecentActivities(),
          api.get('/profile').catch(() => ({ data: null }))
        ]);
        
        setDashboardStats(statsResponse.data.stats);
        setRecentActivities(activitiesResponse.data.activities);
        setUserProfile(profileResponse.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback to default data
        setDashboardStats({
          totalWallets: 0,
          totalTransactions: 0,
          totalVolume: "0.00",
          activeChains: ["Ethereum", "Cosmos"],
          securityScore: 95,
          lastActivity: new Date().toISOString()
        });
        setRecentActivities([]);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  // Recent notifications for activities - use backend data if available, fallback to notifications
  const displayActivities = recentActivities.length > 0 
    ? recentActivities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        time: new Date(activity.timestamp).toLocaleTimeString(),
        type: activity.type,
        isRead: true
      }))
    : notifications.slice(0, 5).map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        time: new Date(notification.created_at).toLocaleTimeString(),
        type: notification.type,
        isRead: notification.is_read
      }));

  // Role-based quick actions
  const getQuickActions = () => {
    const actions = [];
    
    // Common actions for all users
    actions.push(
      { title: 'Profile Settings', icon: <Person />, path: '/profile', color: 'primary' },
      { title: 'Account Settings', icon: <Security />, path: '/settings', color: 'warning' }
    );

    // KYC and 2FA quick actions based on status
    const kycStatus = user?.kyc_status || 'not_started';
    const twoFAEnabled = user?.two_factor_enabled || false;

    if (kycStatus !== 'verified') {
      actions.push(
        { title: 'Complete KYC', icon: <VerifiedUser />, path: '/profile', color: 'error' }
      );
    }

    if (!twoFAEnabled) {
      actions.push(
        { title: 'Enable 2FA', icon: <Smartphone />, path: '/settings', color: 'warning' }
      );
    }
    
    if (hasRole('admin') || hasRole('owner')) {
      actions.push(
        { title: 'Manage Users', icon: <People />, path: '/users', color: 'primary' },
        { title: 'KYC Management', icon: <VerifiedUser />, path: '/admin/kyc', color: 'info' },
        { title: 'API Keys', icon: <Key />, path: '/api-keys', color: 'info' }
      );
    }
    
    if (hasRole('tenant_admin')) {
      actions.push(
        { title: 'Wallet Management', icon: <AccountBalanceWallet />, path: '/wallets', color: 'success' },
        { title: 'Team Settings', icon: <People />, path: '/team', color: 'primary' },
        { title: 'API Keys', icon: <Key />, path: '/api-keys', color: 'info' }
      );
    }
    
    // For regular users - encourage to become tenant
    if (!hasRole('admin') && !hasRole('owner') && !hasRole('tenant_admin')) {
      actions.push(
        { title: 'Become Our Tenant', icon: <Business />, onClick: () => setTenantDialogOpen(true), color: 'primary' },
        { title: 'View Wallets', icon: <AccountBalanceWallet />, path: '/wallets', color: 'success' }
      );
    }
    
    return actions;
  };

  const quickActions = getQuickActions();

  const stats = [
    { 
      title: 'Total Wallets', 
      value: dashboardStats?.totalWallets?.toString() || '0', 
      change: 12, 
      icon: <AccountBalanceWallet />, 
      color: 'primary' 
    },
    { 
      title: 'Total Transactions', 
      value: dashboardStats?.totalTransactions?.toString() || '0', 
      change: 8, 
      icon: <SwapHoriz />, 
      color: 'success' 
    },
    { 
      title: 'Security Score', 
      value: `${dashboardStats?.securityScore || 0}%`, 
      change: 2, 
      icon: <Security />, 
      color: 'warning' 
    },
    { 
      title: 'Total Volume', 
      value: `$${dashboardStats?.totalVolume || '0.00'}`, 
      change: 15, 
      icon: <TrendingUp />, 
      color: 'info' 
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here's what's happening with your custody wallets today.
        </Typography>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}

          {/* Recent Activities */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Recent Activities</Typography>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
                <List>
                  {displayActivities.length > 0 ? displayActivities.map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: activity.type === 'success' ? 'success.main' : 
                                  activity.type === 'warning' ? 'warning.main' : 
                                  activity.type === 'error' ? 'error.main' : 'info.main',
                          width: 32, 
                          height: 32 
                        }}>
                          <Notifications sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={`${activity.description} • ${activity.time}`}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          fontWeight: activity.isRead ? 'normal' : 'bold'
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  )) : (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="No recent activities"
                        secondary="Your activities will appear here"
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Status Widget */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Security Status</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* KYC Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUser sx={{ color: user?.kyc_status === 'verified' ? 'success.main' : 'warning.main' }} />
                      <Typography variant="body1">KYC Verification</Typography>
                    </Box>
                    <Chip
                      label={user?.kyc_status === 'verified' ? 'Verified' : user?.kyc_status?.toUpperCase() || 'NOT STARTED'}
                      color={user?.kyc_status === 'verified' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  {/* 2FA Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Shield sx={{ color: user?.two_factor_enabled ? 'success.main' : 'error.main' }} />
                      <Typography variant="body1">Two-Factor Auth</Typography>
                    </Box>
                    <Chip
                      label={user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                      color={user?.two_factor_enabled ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  {/* Overall Security Score */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Security Score</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {((user?.kyc_status === 'verified' ? 50 : 0) + (user?.two_factor_enabled ? 50 : 0))}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(user?.kyc_status === 'verified' ? 50 : 0) + (user?.two_factor_enabled ? 50 : 0)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.grey[500], 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: theme.palette.success.main,
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {user?.kyc_status !== 'verified' && (
                      <Link href="/profile">
                        <Button size="small" variant="outlined" color="warning">
                          Complete KYC
                        </Button>
                      </Link>
                    )}
                    {!user?.two_factor_enabled && (
                      <Link href="/settings">
                        <Button size="small" variant="outlined" color="error">
                          Enable 2FA
                        </Button>
                      </Link>
                    )}
                    {user?.kyc_status === 'verified' && user?.two_factor_enabled && (
                      <Chip
                        label="Fully Secured"
                        color="success"
                        icon={<CheckCircle />}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Grid container spacing={2}>
                  {quickActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      {action.path ? (
                        <Link href={action.path}>
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={action.icon}
                            sx={{
                              py: 1.5,
                              borderColor: `${action.color}.main`,
                              color: `${action.color}.main`,
                              '&:hover': {
                                borderColor: `${action.color}.dark`,
                                backgroundColor: alpha(theme.palette[action.color].main, 0.04),
                              }
                            }}
                          >
                            {action.title}
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={action.icon}
                          onClick={action.onClick}
                          sx={{
                            py: 1.5,
                            borderColor: `${action.color}.main`,
                            color: `${action.color}.main`,
                            '&:hover': {
                              borderColor: `${action.color}.dark`,
                              backgroundColor: alpha(theme.palette[action.color].main, 0.04),
                            }
                          }}
                        >
                          {action.title}
                        </Button>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <TenantRequestDialog 
        open={tenantDialogOpen} 
        onClose={() => setTenantDialogOpen(false)} 
      />
    </DashboardLayout>
  );
}
