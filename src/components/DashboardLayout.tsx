import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Security,
  People,
  Settings,
  AccountCircle,
  Notifications,
  Business,
  Key,
  Analytics,
  Support,
  Logout,
  ChevronLeft,
  Home,
  Description,
  Message,
  CloudSync,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';

const drawerWidth = 260;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const iconMap: { [key: string]: React.ReactElement } = {
  'Home': <Home />,
  'Dashboard': <Dashboard />,
  'Analytics': <Analytics />,
  'Notifications': <Notifications />,
  'Message': <Message />,
  'Description': <Description />,
  'CloudSync': <CloudSync />,
  'People': <People />,
  'Business': <Business />,
  'Key': <Key />,
  'Security': <Security />,
  'Settings': <Settings />,
  'Support': <Support />,
};

const menuCategories = {
  main: 'Dashboard',
  security: 'Security & Access',
  management: 'Organization',
  support: 'Help & Settings'
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const [, setLocation] = useLocation();
  const { user, menuItems, loading, logout, canAccess } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentPath = window.location.pathname;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderMenuItems = () => {
    // Filter menu items based on user roles
    const filteredItems = menuItems.filter(item => 
      canAccess(item.roles) || item.roles.length === 0
    );

    // Group by category (if available) or show as flat list
    const groupedItems = filteredItems.reduce((acc, item) => {
      const category = 'main'; // Default category since backend doesn't provide it yet
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof menuItems>);

    return Object.entries(groupedItems).map(([category, items]) => (
      <Box key={category}>
        <List sx={{ px: 2 }}>
          {items.map((item) => {
            const isActive = currentPath === item.path;
            const icon = iconMap[item.icon] || <Dashboard />;
            
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => setLocation(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: isActive ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    ));
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography variant="h6" color="white" fontWeight="bold">
              M
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Mustody
          </Typography>
        </Box>
        <Chip
          label="Enterprise"
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            color: 'success.main',
            fontWeight: 500,
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {renderMenuItems()}
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography variant="body2" fontWeight="600" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Contact our support team
          </Typography>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setLocation('/support')}
          >
            Get Support →
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="600">
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back to your crypto custody platform
            </Typography>
          </Box>

          <NotificationBell />

          <IconButton
            size="large"
            edge="end"
            onClick={handleProfileMenuOpen}
            sx={{
              p: 0.5,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                backgroundColor: 'primary.main',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight="600">
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
          {user?.tenant_name && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {user.tenant_name}
            </Typography>
          )}
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {user?.roles?.map(role => (
              <Chip 
                key={role} 
                label={role} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
          </Box>
        </Box>
        <MenuItem onClick={() => setLocation('/profile')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile Settings" />
        </MenuItem>
        <MenuItem onClick={() => setLocation('/settings')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Account Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#fafbfc',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
