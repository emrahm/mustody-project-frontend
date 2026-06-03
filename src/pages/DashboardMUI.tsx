import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Avatar, Chip,
  LinearProgress, IconButton, alpha, useTheme, List, ListItem,
  ListItemText, ListItemAvatar, CircularProgress, Alert,
} from '@mui/material';
import TenantRequestDialog from '@/components/TenantRequestDialog';
import {
  Security, Key, AccountBalanceWallet, Business, Notifications,
  Person, VerifiedUser, Shield, Smartphone, People, CheckCircle,
  ConfirmationNumber, NotificationsNone, SupportAgent,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { tenantAPI, api } from '@/lib/api';
import { Link } from 'wouter';

interface DashboardStats {
  totalWallets: number;
  activeChains: string[];
  totalTickets: number;
  openTickets: number;
  unreadNotifs: number;
  kycStatus: string;
  twoFactorEnabled: boolean;
  securityScore: number;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  is_read: boolean;
}

const NOTIF_TYPE_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

const StatCard = ({ title, value, icon, color = 'primary', subtitle }: {
  title: string; value: string | number; icon: React.ReactNode;
  color?: string; subtitle?: string;
}) => {
  const theme = useTheme();
  const c = color as keyof typeof theme.palette;
  const main = (theme.palette[c] as any)?.main ?? theme.palette.primary.main;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(main, 0.1), color: main }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.disabled">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
};

export default function DashboardContent() {
  const theme = useTheme();
  const { user, hasRole, hasGlobalRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      tenantAPI.getDashboardStats(),
      tenantAPI.getRecentActivities(),
    ])
      .then(([statsRes, activitiesRes]) => {
        setStats(statsRes.data.stats);
        setActivities(activitiesRes.data.activities ?? []);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
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

  const kycVerified = stats?.kycStatus === 'verified';
  const twoFAEnabled = stats?.twoFactorEnabled ?? false;
  const securityScore = stats?.securityScore ?? 0;

  const quickActions = (() => {
    const actions: { title: string; icon: React.ReactNode; path?: string; onClick?: () => void; color: string }[] = [
      { title: 'Profile', icon: <Person />, path: '/profile', color: 'primary' },
      { title: 'Account Settings', icon: <Security />, path: '/settings', color: 'warning' },
    ];

    if (!kycVerified)
      actions.push({ title: 'Complete KYC', icon: <VerifiedUser />, path: '/profile', color: 'error' });
    if (!twoFAEnabled)
      actions.push({ title: 'Enable 2FA', icon: <Smartphone />, path: '/settings', color: 'warning' });

    if (hasGlobalRole('admin') || hasGlobalRole('owner')) {
      actions.push(
        { title: 'Manage Users', icon: <People />, path: '/users', color: 'primary' },
        { title: 'KYC Management', icon: <VerifiedUser />, path: '/admin/kyc', color: 'info' },
        { title: 'API Keys', icon: <Key />, path: '/api-keys', color: 'info' },
      );
    }
    if (hasRole('tenant_admin')) {
      actions.push(
        { title: 'Wallets', icon: <AccountBalanceWallet />, path: '/wallet', color: 'success' },
        { title: 'Team', icon: <People />, path: '/team', color: 'primary' },
        { title: 'API Keys', icon: <Key />, path: '/api-keys', color: 'info' },
      );
    }
    if (!hasRole('admin') && !hasRole('owner') && !hasRole('tenant_admin')) {
      actions.push(
        { title: 'Become a Tenant', icon: <Business />, onClick: () => setTenantDialogOpen(true), color: 'primary' },
        { title: 'View Wallets', icon: <AccountBalanceWallet />, path: '/wallet', color: 'success' },
      );
    }
    return actions;
  })();

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here's your custody platform overview.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={3}>
          {/* Stat Cards */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Wallets"
              value={stats?.totalWallets ?? 0}
              icon={<AccountBalanceWallet />}
              color="primary"
              subtitle={stats?.activeChains?.join(', ') || 'No active chains'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Support Tickets"
              value={stats?.totalTickets ?? 0}
              icon={<SupportAgent />}
              color="info"
              subtitle={stats?.openTickets ? `${stats.openTickets} open` : 'All resolved'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Unread Notifications"
              value={stats?.unreadNotifs ?? 0}
              icon={<NotificationsNone />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Security Score"
              value={`${securityScore}%`}
              icon={<Security />}
              color={securityScore === 100 ? 'success' : securityScore >= 50 ? 'warning' : 'error'}
            />
          </Grid>

          {/* Recent Activities */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Notifications</Typography>
                <List disablePadding>
                  {activities.length > 0 ? activities.map(a => (
                    <ListItem key={a.id} sx={{ px: 0 }} disableGutters>
                      <ListItemAvatar>
                        <Avatar sx={{
                          bgcolor: alpha(theme.palette[NOTIF_TYPE_COLOR[a.type] ?? 'info'].main, 0.15),
                          color: theme.palette[NOTIF_TYPE_COLOR[a.type] ?? 'info'].main,
                          width: 36, height: 36,
                        }}>
                          <Notifications sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={a.title}
                        secondary={`${a.description} · ${new Date(a.timestamp).toLocaleString()}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: a.is_read ? 'normal' : 700 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  )) : (
                    <ListItem sx={{ px: 0 }} disableGutters>
                      <ListItemText
                        primary="No notifications yet"
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
                <Box mt={1}>
                  <Link href="/notifications">
                    <Button size="small" variant="text">View all notifications →</Button>
                  </Link>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Status */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Security Status</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUser sx={{ color: kycVerified ? 'success.main' : 'warning.main' }} />
                      <Typography variant="body1">KYC Verification</Typography>
                    </Box>
                    <Chip
                      label={stats?.kycStatus?.replace('_', ' ').toUpperCase() ?? 'UNKNOWN'}
                      color={kycVerified ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Shield sx={{ color: twoFAEnabled ? 'success.main' : 'error.main' }} />
                      <Typography variant="body1">Two-Factor Auth</Typography>
                    </Box>
                    <Chip
                      label={twoFAEnabled ? 'Enabled' : 'Disabled'}
                      color={twoFAEnabled ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Overall Security</Typography>
                      <Typography variant="body2" fontWeight={700}>{securityScore}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={securityScore}
                      sx={{
                        height: 8, borderRadius: 4,
                        bgcolor: alpha(theme.palette.grey[500], 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: securityScore === 100 ? 'success.main' : securityScore >= 50 ? 'warning.main' : 'error.main',
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {!kycVerified && (
                      <Link href="/profile">
                        <Button size="small" variant="outlined" color="warning">Complete KYC</Button>
                      </Link>
                    )}
                    {!twoFAEnabled && (
                      <Link href="/settings">
                        <Button size="small" variant="outlined" color="error">Enable 2FA</Button>
                      </Link>
                    )}
                    {kycVerified && twoFAEnabled && (
                      <Chip label="Fully Secured" color="success" icon={<CheckCircle />} />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Grid container spacing={2}>
                  {quickActions.map((action, i) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={i}>
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
                              '&:hover': { bgcolor: alpha((theme.palette[action.color as keyof typeof theme.palette] as any)?.main ?? '#000', 0.04) },
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
                            '&:hover': { bgcolor: alpha((theme.palette[action.color as keyof typeof theme.palette] as any)?.main ?? '#000', 0.04) },
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

      <TenantRequestDialog open={tenantDialogOpen} onClose={() => setTenantDialogOpen(false)} />
    </DashboardLayout>
  );
}
