import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send,
  Add,
  Mail,
  Sms,
  Notifications,
  Edit,
  Delete,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useNotifications } from '@/contexts/NotificationContext';

interface MessageTemplate {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'notification';
  subject?: string;
  body: string;
  variables: string;
  is_active: boolean;
  is_custom: boolean;
  tenant_id?: string;
}

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MessagingPage() {
  const [adminTemplates, setAdminTemplates] = useState<MessageTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { addNotification } = useNotifications();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'notification',
    subject: '',
    body: '',
    variables: '',
  });

  const [sendData, setSendData] = useState({
    recipient: '',
    variables: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchAdminTemplates();
    fetchCustomTemplates();
  }, []);

  const fetchAdminTemplates = async () => {
    try {
      const response = await api.get('/messages/admin/templates');
      setAdminTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch admin templates:', error);
      setAdminTemplates([]);
    }
  };

  const fetchCustomTemplates = async () => {
    try {
      const response = await api.get('/messages/custom/templates');
      setCustomTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch custom templates:', error);
      setCustomTemplates([]);
    }
  };

  const createCustomTemplate = async () => {
    setLoading(true);
    try {
      await api.post('/messages/custom/templates', newTemplate);
      setIsCreateModalOpen(false);
      setNewTemplate({ name: '', type: 'email', subject: '', body: '', variables: '' });
      fetchCustomTemplates();
      addNotification('Template created successfully', 'success');
    } catch (error) {
      console.error('Failed to create template:', error);
      addNotification('Failed to create template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      await api.post('/messages/custom/send', {
        template_id: selectedTemplate.id,
        recipient: sendData.recipient,
        variables: sendData.variables,
      });
      setIsSendModalOpen(false);
      setSendData({ recipient: '', variables: {} });
      addNotification('Message sent successfully', 'success');
    } catch (error) {
      console.error('Failed to send message:', error);
      addNotification('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const parseVariables = (variablesStr: string): string[] => {
    try {
      return variablesStr ? JSON.parse(variablesStr) : [];
    } catch {
      return [];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail />;
      case 'sms': return <Sms />;
      case 'notification': return <Notifications />;
      default: return <Mail />;
    }
  };

  const TemplateCard = ({ template }: { template: MessageTemplate }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {getTypeIcon(template.type)}
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
            {template.name}
          </Typography>
          <Chip 
            label={template.type} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        {template.subject && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Subject: {template.subject}
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.body.length > 100 ? `${template.body.substring(0, 100)}...` : template.body}
        </Typography>
        
        {parseVariables(template.variables).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Variables:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {parseVariables(template.variables).map((variable) => (
                <Chip key={variable} label={variable} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
        
        {!template.is_active && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This template is inactive
          </Alert>
        )}
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Send />}
          onClick={() => {
            setSelectedTemplate(template);
            setIsSendModalOpen(true);
          }}
          disabled={!template.is_active}
        >
          Send
        </Button>
      </Box>
    </Card>
  );

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Message Templates
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Custom Template
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="System Templates" />
            <Tab label="Custom Templates" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {adminTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <TemplateCard template={template} />
              </Grid>
            ))}
            {adminTemplates.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">No system templates available</Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {customTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <TemplateCard template={template} />
              </Grid>
            ))}
            {customTemplates.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No custom templates created yet. Click "Create Custom Template" to get started.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Create Template Dialog */}
        <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Custom Template</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Template Name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                fullWidth
              />
              
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newTemplate.type}
                  label="Type"
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as any })}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="notification">Notification</MenuItem>
                </Select>
              </FormControl>
              
              {newTemplate.type === 'email' && (
                <TextField
                  label="Subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  fullWidth
                />
              )}
              
              <TextField
                label="Message Body"
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                multiline
                rows={4}
                fullWidth
                helperText="Use {{variable}} for dynamic content"
              />
              
              <TextField
                label="Variables"
                value={newTemplate.variables}
                onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                fullWidth
                helperText='JSON array format: ["name", "email"]'
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={createCustomTemplate} disabled={loading} variant="contained">
              {loading ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Send Message: {selectedTemplate?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label={
                  selectedTemplate?.type === 'email' ? 'Email Address' :
                  selectedTemplate?.type === 'sms' ? 'Phone Number' : 'Recipient'
                }
                value={sendData.recipient}
                onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
                fullWidth
              />
              
              {selectedTemplate && parseVariables(selectedTemplate.variables).map((variable) => (
                <TextField
                  key={variable}
                  label={variable}
                  value={sendData.variables[variable] || ''}
                  onChange={(e) => setSendData({
                    ...sendData,
                    variables: { ...sendData.variables, [variable]: e.target.value }
                  })}
                  fullWidth
                />
              ))}
              
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTemplate?.body.replace(/\{\{(\w+)\}\}/g, (match, variable) => 
                    sendData.variables[variable] || `{{${variable}}}`
                  )}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsSendModalOpen(false)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={loading} variant="contained">
              {loading ? <CircularProgress size={20} /> : 'Send Message'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
