import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { Edit, Send, Settings } from '@mui/icons-material';
import { api } from '@/lib/api';

interface TemplateParameter {
  id: number;
  name: string;
  type: string;
  description: string;
  parameters: string[];
  is_active: boolean;
}

interface TenantTemplate {
  id: number;
  parameter_id: number;
  subject: string;
  body: string;
  is_enabled: boolean;
  parameter: TemplateParameter;
}

export default function ParameterizedTemplates() {
  const [parameters, setParameters] = useState<TemplateParameter[]>([]);
  const [tenantTemplates, setTenantTemplates] = useState<TenantTemplate[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [sendDialog, setSendDialog] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<TemplateParameter | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TenantTemplate | null>(null);

  const [editData, setEditData] = useState({
    subject: '',
    body: '',
    is_enabled: true,
  });

  const [sendData, setSendData] = useState({
    recipient: '',
    parameters: {} as Record<string, string>,
    priority: 5,
  });

  useEffect(() => {
    fetchParameters();
    fetchTenantTemplates();
  }, []);

  const fetchParameters = async () => {
    try {
      const response = await api.get('/messages/parameters');
      setParameters(response.data);
    } catch (error) {
      console.error('Failed to fetch parameters:', error);
    }
  };

  const fetchTenantTemplates = async () => {
    try {
      const response = await api.get('/messages/tenant-templates');
      setTenantTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch tenant templates:', error);
    }
  };

  const openEditDialog = (parameter: TemplateParameter) => {
    const existing = tenantTemplates.find(t => t.parameter_id === parameter.id);
    setSelectedParameter(parameter);
    setEditData({
      subject: existing?.subject || '',
      body: existing?.body || getDefaultTemplate(parameter),
      is_enabled: existing?.is_enabled ?? true,
    });
    setEditDialog(true);
  };

  const openSendDialog = (template: TenantTemplate) => {
    setSelectedTemplate(template);
    const params: Record<string, string> = {};
    template.parameter.parameters.forEach(p => params[p] = '');
    setSendData({ recipient: '', parameters: params, priority: 5 });
    setSendDialog(true);
  };

  const getDefaultTemplate = (parameter: TemplateParameter) => {
    const templates: Record<string, string> = {
      email_welcome: 'Welcome to {{company_name}}, {{user_name}}! Click here to get started: {{login_url}}',
      email_verification: 'Hi {{user_name}}, please verify your email by clicking: {{verification_url}}',
      email_password_reset: 'Hi {{user_name}}, reset your password here: {{reset_url}}',
      sms_verification: 'Your {{company_name}} verification code is: {{code}}',
      sms_alert: 'Alert from {{company_name}}: {{alert_message}}',
      notification_payment: '{"event":"payment","user_id":"{{user_id}}","amount":"{{amount}}","currency":"{{currency}}","transaction_id":"{{transaction_id}}"}',
      notification_user_action: '{"event":"user_action","user_id":"{{user_id}}","action":"{{action}}","timestamp":"{{timestamp}}","ip":"{{ip_address}}"}',
    };
    return templates[parameter.name] || 'Default template for {{parameter_name}}';
  };

  const handleSaveTemplate = async () => {
    if (!selectedParameter) return;

    try {
      await api.put(`/messages/tenant-templates/${selectedParameter.name}`, editData);
      fetchTenantTemplates();
      setEditDialog(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTemplate) return;

    try {
      await api.post('/messages/send', {
        parameter_name: selectedTemplate.parameter.name,
        recipient: sendData.recipient,
        parameters: sendData.parameters,
        priority: sendData.priority,
      });
      setSendDialog(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getTenantTemplate = (parameterId: number) => {
    return tenantTemplates.find(t => t.parameter_id === parameterId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Predefined Message Templates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize predefined templates for your organization. Templates starting with email_, sms_, or notification_ are system-defined.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Template Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Parameters</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parameters.map((parameter) => {
              const tenantTemplate = getTenantTemplate(parameter.id);
              return (
                <TableRow key={parameter.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {parameter.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={parameter.type} 
                      color={parameter.type === 'email' ? 'primary' : parameter.type === 'sms' ? 'secondary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {parameter.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {parameter.parameters.map(p => (
                      <Chip key={p} label={p} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tenantTemplate?.is_enabled ? 'Enabled' : 'Disabled'} 
                      color={tenantTemplate?.is_enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => openEditDialog(parameter)}
                      sx={{ mr: 1 }}
                    >
                      Customize
                    </Button>
                    {tenantTemplate?.is_enabled && (
                      <Button
                        size="small"
                        startIcon={<Send />}
                        onClick={() => openSendDialog(tenantTemplate)}
                      >
                        Send
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Template Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Customize Template: {selectedParameter?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Available parameters: {selectedParameter?.parameters.map(p => `{{${p}}}`).join(', ')}
          </Alert>
          
          <FormControlLabel
            control={
              <Switch
                checked={editData.is_enabled}
                onChange={(e) => setEditData({ ...editData, is_enabled: e.target.checked })}
              />
            }
            label="Enable this template"
            sx={{ mb: 2 }}
          />

          {selectedParameter?.type === 'email' && (
            <TextField
              fullWidth
              label="Subject"
              value={editData.subject}
              onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Message Body"
            value={editData.body}
            onChange={(e) => setEditData({ ...editData, body: e.target.value })}
            helperText="Use {{parameter_name}} for dynamic content"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">Save Template</Button>
        </DialogActions>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message: {selectedTemplate?.parameter.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={selectedTemplate?.parameter.type === 'email' ? 'Email Address' : 
                   selectedTemplate?.parameter.type === 'sms' ? 'Phone Number' : 'Webhook URL'}
            value={sendData.recipient}
            onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />

          {selectedTemplate?.parameter.parameters.map((param) => (
            <TextField
              key={param}
              fullWidth
              label={param}
              value={sendData.parameters[param] || ''}
              onChange={(e) => setSendData({
                ...sendData,
                parameters: { ...sendData.parameters, [param]: e.target.value }
              })}
              sx={{ mb: 2 }}
            />
          ))}

          <TextField
            fullWidth
            type="number"
            label="Priority (1-10)"
            value={sendData.priority}
            onChange={(e) => setSendData({ ...sendData, priority: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained">Send Message</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
