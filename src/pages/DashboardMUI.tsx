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
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import MessagingWidget from '@/components/MessagingWidget';

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
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
          <IconButton size="small">
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {isPositive ? (
            <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
          ) : (
            <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
              fontWeight: 600,
            }}
          >
            {Math.abs(change)}% from last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const SecurityAlert = ({ type, title, description, action }: any) => {
  const theme = useTheme();
  const severity = type === 'warning' ? 'warning' : type === 'error' ? 'error' : 'info';
  const icon = type === 'warning' ? <Warning /> : <CheckCircle />;
  
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid`,
        borderColor: `${severity}.light`,
        backgroundColor: (theme) => alpha(theme.palette[severity].light, 0.05),
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ color: `${severity}.main`, mt: 0.5 }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
          {action && (
            <Button size="small" variant="outlined" color={severity as any}>
              {action}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default function DashboardContent() {
  const theme = useTheme();

  const stats = [
    {
      title: 'Total Assets Under Custody',
      value: '$2.4M',
      change: 12.5,
      icon: <TrendingUp />,
      color: 'primary',
    },
    {
      title: 'Active API Keys',
      value: '8',
      change: 25,
      icon: <Key />,
      color: 'success',
    },
    {
      title: 'Team Members',
      value: '12',
      change: 8.3,
      icon: <People />,
      color: 'info',
    },
    {
      title: 'Security Score',
      value: '94%',
      change: 2.1,
      icon: <Security />,
      color: 'warning',
    },
  ];

  const securityAlerts = [
    {
      type: 'warning',
      title: '2FA Not Enabled',
      description: 'Enable two-factor authentication to secure your account.',
      action: 'Enable 2FA',
    },
    {
      type: 'success',
      title: 'All API Keys Active',
      description: 'Your API keys are functioning properly with no issues detected.',
    },
  ];

  const recentActivity = [
    { action: 'API Key Created', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { action: 'Team Member Added', user: 'Jane Smith', time: '1 day ago', type: 'info' },
    { action: 'Security Alert', user: 'System', time: '2 days ago', type: 'warning' },
  ];

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Good morning, John! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your crypto custody platform today.
          </Typography>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Security Overview */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight="600">
                    Security Overview
                  </Typography>
                  <Button size="small" variant="outlined">
                    View All
                  </Button>
                </Box>

                {securityAlerts.map((alert, index) => (
                  <SecurityAlert key={index} {...alert} />
                ))}

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Overall Security Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={94}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'success.main',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="body2" fontWeight="600" color="success.main">
                      94%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Messaging Widget */}
          <Grid item xs={12} lg={6}>
            <MessagingWidget />
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Recent Activity
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {recentActivity.map((activity, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 2,
                        borderBottom: index < recentActivity.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: `${activity.type}.light`,
                          color: `${activity.type}.main`,
                        }}
                      >
                        {activity.user.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="500">
                          {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {activity.user} • {activity.time}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={activity.type}
                        color={activity.type as any}
                        variant="outlined"
                      />
                    </Box>
                  ))}
                </Box>

                <Button fullWidth variant="text" sx={{ mt: 2 }}>
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Key />}
                      sx={{ py: 1.5 }}
                    >
                      Create API Key
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<People />}
                      sx={{ py: 1.5 }}
                    >
                      Invite Team Member
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Security />}
                      sx={{ py: 1.5 }}
                    >
                      Security Settings
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      sx={{ py: 1.5 }}
                    >
                      View Analytics
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
