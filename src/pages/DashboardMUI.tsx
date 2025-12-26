import React from 'react';
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
} from '@mui/material';
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
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
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

  // Recent notifications for activities
  const recentActivities = notifications.slice(0, 5).map(notification => ({
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
    
    if (hasRole('admin') || hasRole('owner')) {
      actions.push(
        { title: 'Manage Users', icon: <People />, path: '/users', color: 'primary' },
        { title: 'Security Settings', icon: <Security />, path: '/security', color: 'warning' },
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
        { title: 'Become Our Tenant', icon: <Business />, path: '/tenant-request', color: 'primary' },
        { title: 'View Wallets', icon: <AccountBalanceWallet />, path: '/wallets', color: 'success' }
      );
    }
    
    return actions;
  };

  const quickActions = getQuickActions();

  const stats = [
    { title: 'Total Wallets', value: '24', change: 12, icon: <AccountBalanceWallet />, color: 'primary' },
    { title: 'Active Users', value: '1,234', change: 8, icon: <People />, color: 'success' },
    { title: 'Security Score', value: '98%', change: 2, icon: <Security />, color: 'warning' },
    { title: 'Total Volume', value: '$2.4M', change: 15, icon: <TrendingUp />, color: 'info' },
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
                  {recentActivities.length > 0 ? recentActivities.map((activity) => (
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

          {/* Quick Actions */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Grid container spacing={2}>
                  {quickActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
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
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
