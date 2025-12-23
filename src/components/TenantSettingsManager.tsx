import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore, Save } from '@mui/icons-material';
import { api } from '@/lib/api';

interface TenantSettings {
  [key: string]: string;
}

export default function TenantSettingsManager() {
  const [settings, setSettings] = useState<TenantSettings>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const settingGroups = {
    email: {
      title: 'Email Configuration',
      settings: [
        { key: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
        { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
        { key: 'smtp_username', label: 'SMTP Username', placeholder: 'your-email@gmail.com' },
        { key: 'smtp_password', label: 'SMTP Password', type: 'password' },
        { key: 'from_email', label: 'From Email', placeholder: 'noreply@company.com' },
        { key: 'from_name', label: 'From Name', placeholder: 'Company Name' },
      ]
    },
    sms: {
      title: 'SMS Configuration',
      settings: [
        { key: 'sms_provider', label: 'SMS Provider', placeholder: 'twilio' },
        { key: 'sms_api_key', label: 'API Key/SID', placeholder: 'Your Twilio SID' },
        { key: 'sms_api_secret', label: 'API Secret/Token', type: 'password' },
        { key: 'sms_from_number', label: 'From Number', placeholder: '+1234567890' },
      ]
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/messages/settings');
      setSettings(response.data || {});
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.put(`/messages/settings/${key}`, { value });
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(settings).map(([key, value]) => 
        updateSetting(key, value)
      );
      await Promise.all(promises);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Messaging Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveAll}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your messaging providers. These settings will override system defaults.
      </Typography>

      {Object.entries(settingGroups).map(([groupKey, group]) => (
        <Accordion key={groupKey} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">{group.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {group.settings.map((setting) => (
                <Grid item xs={12} sm={6} key={setting.key}>
                  <TextField
                    fullWidth
                    label={setting.label}
                    type={setting.type || 'text'}
                    placeholder={setting.placeholder}
                    value={settings[setting.key] || ''}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> These settings are specific to your organization. 
          If not configured, the system will use default settings.
        </Typography>
      </Alert>
    </Box>
  );
}
