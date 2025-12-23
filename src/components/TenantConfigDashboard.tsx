import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { ExpandMore, Settings } from '@mui/icons-material';
import { api } from '@/lib/api';

interface TenantConfig {
  type: 'email' | 'sms' | 'notification';
  provider: string;
  config: Record<string, any>;
  auth_type?: string;
  auth_config?: Record<string, any>;
}

export default function TenantConfigDashboard() {
  const [openDialog, setOpenDialog] = useState(false);
  const [configType, setConfigType] = useState<'email' | 'sms' | 'notification'>('email');
  const [provider, setProvider] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [authType, setAuthType] = useState('');
  const [authConfig, setAuthConfig] = useState<Record<string, string>>({});

  const handleSaveConfig = async () => {
    try {
      const payload: TenantConfig = {
        type: configType,
        provider,
        config,
      };

      if (authType) {
        payload.auth_type = authType;
        payload.auth_config = authConfig;
      }

      await api.post('/messages/config', payload);
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const resetForm = () => {
    setConfigType('email');
    setProvider('');
    setConfig({});
    setAuthType('');
    setAuthConfig({});
  };

  const renderConfigFields = () => {
    switch (configType) {
      case 'email':
        return (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Provider</InputLabel>
              <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <MenuItem value="smtp">SMTP</MenuItem>
              </Select>
            </FormControl>
            {provider === 'smtp' && (
              <>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={config.host || ''}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="SMTP Port"
                  value={config.port || ''}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Username"
                  value={config.username || ''}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  value={config.password || ''}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="From Email"
                  value={config.from_email || ''}
                  onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="From Name"
                  value={config.from_name || ''}
                  onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </>
        );

      case 'sms':
        return (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Provider</InputLabel>
              <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="aws_sns">AWS SNS</MenuItem>
              </Select>
            </FormControl>
            {provider === 'twilio' && (
              <>
                <TextField
                  fullWidth
                  label="Account SID"
                  value={config.account_sid || ''}
                  onChange={(e) => setConfig({ ...config, account_sid: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Auth Token"
                  value={config.auth_token || ''}
                  onChange={(e) => setConfig({ ...config, auth_token: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="From Number"
                  value={config.from_number || ''}
                  onChange={(e) => setConfig({ ...config, from_number: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </>
        );

      case 'notification':
        return (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Provider</InputLabel>
              <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <MenuItem value="webhook">Webhook</MenuItem>
              </Select>
            </FormControl>
            {provider === 'webhook' && (
              <>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={config.webhook_url || ''}
                  onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Authentication Type</InputLabel>
                  <Select value={authType} onChange={(e) => setAuthType(e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="hmac">HMAC</MenuItem>
                    <MenuItem value="rsa">RSA</MenuItem>
                    <MenuItem value="bearer">Bearer Token</MenuItem>
                    <MenuItem value="basic">Basic Auth</MenuItem>
                  </Select>
                </FormControl>
                {authType === 'hmac' && (
                  <TextField
                    fullWidth
                    type="password"
                    label="HMAC Secret"
                    value={authConfig.secret || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, secret: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                )}
                {authType === 'rsa' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="RSA Private Key"
                    value={authConfig.private_key || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, private_key: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                )}
                {authType === 'bearer' && (
                  <TextField
                    fullWidth
                    type="password"
                    label="Bearer Token"
                    value={authConfig.token || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                )}
                {authType === 'basic' && (
                  <>
                    <TextField
                      fullWidth
                      label="Username"
                      value={authConfig.username || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      value={authConfig.password || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Message Configuration</Typography>
        <Button
          variant="contained"
          startIcon={<Settings />}
          onClick={() => setOpenDialog(true)}
        >
          Configure Provider
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Email Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configure your SMTP settings to send emails from your own server.
              </Alert>
              <Typography variant="body2">
                Current Status: Not Configured
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">SMS Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configure Twilio or AWS SNS to send SMS messages.
              </Alert>
              <Typography variant="body2">
                Current Status: Not Configured
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Notification Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configure webhook endpoints to receive notifications with HMAC or RSA authentication.
              </Alert>
              <Typography variant="body2">
                Current Status: Not Configured
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure Message Provider</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Message Type</InputLabel>
            <Select
              value={configType}
              onChange={(e) => setConfigType(e.target.value as any)}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="notification">Notification</MenuItem>
            </Select>
          </FormControl>

          {renderConfigFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
