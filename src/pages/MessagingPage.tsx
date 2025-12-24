import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Container,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  Message, 
  Settings, 
  Description, 
  CloudSync 
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import MessagingDashboard from '@/components/MessagingDashboard';
import TenantConfigDashboard from '@/components/TenantConfigDashboard';
import ParameterizedTemplates from '@/components/ParameterizedTemplates';
import TenantSettingsManager from '@/components/TenantSettingsManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Fade in={value === index} timeout={300}>
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`messaging-tabpanel-${index}`}
        aria-labelledby={`messaging-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
      </div>
    </Fade>
  );
}

export default function MessagingPage() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabConfig = [
    { label: "Predefined Templates", icon: <Description />, color: theme.palette.primary.main },
    { label: "Custom Templates", icon: <Message />, color: theme.palette.secondary.main },
    { label: "Settings", icon: <Settings />, color: theme.palette.info.main },
    { label: "Provider Configuration", icon: <CloudSync />, color: theme.palette.warning.main },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
            pointerEvents: 'none',
          }
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h3" 
              fontWeight="700" 
              sx={{ 
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Messaging System
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 400,
                maxWidth: 600,
                lineHeight: 1.6
              }}
            >
              Streamline your communication with powerful template management and multi-provider configuration
            </Typography>
          </Box>
        </Box>

        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.default, 0.3),
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 72,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.04),
                  },
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }
              }}
            >
              {tabConfig.map((tab, index) => (
                <Tab 
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: tabValue === index ? tab.color : 'inherit' }}>
                        {tab.icon}
                      </Box>
                      {tab.label}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <TabPanel value={tabValue} index={0}>
              <ParameterizedTemplates />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <MessagingDashboard />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <TenantSettingsManager />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <TenantConfigDashboard />
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </DashboardLayout>
  );
}
