import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
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
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`messaging-tabpanel-${index}`}
      aria-labelledby={`messaging-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function MessagingPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Messaging System
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage message templates and configure your messaging providers.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Predefined Templates" />
            <Tab label="Custom Templates" />
            <Tab label="Settings" />
            <Tab label="Provider Configuration" />
          </Tabs>
        </Box>

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
      </Box>
    </DashboardLayout>
  );
}
