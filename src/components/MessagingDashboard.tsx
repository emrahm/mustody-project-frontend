import React, { useState, useEffect } from 'react';
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
  Chip,
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
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete, Send } from '@mui/icons-material';
import { api } from '@/lib/api';

interface MessageTemplate {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'notification';
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  tenant_id?: number;
}

export default function MessagingDashboard() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [sendDialog, setSendDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'notification',
    subject: '',
    body: '',
    variables: [] as string[],
  });

  const [sendData, setSendData] = useState({
    recipient: '',
    variables: {} as Record<string, string>,
    priority: 5,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/messages/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await api.post('/messages/templates', formData);
      fetchTemplates();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      await api.post('/messages', {
        template_id: selectedTemplate?.id,
        type: selectedTemplate?.type,
        recipient: sendData.recipient,
        variables: sendData.variables,
        priority: sendData.priority,
      });
      setSendDialog(false);
      resetSendForm();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      body: '',
      variables: [],
    });
    setEditingTemplate(null);
  };

  const resetSendForm = () => {
    setSendData({
      recipient: '',
      variables: {},
      priority: 5,
    });
    setSelectedTemplate(null);
  };

  const openSendDialog = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    const vars: Record<string, string> = {};
    template.variables.forEach(v => vars[v] = '');
    setSendData({ ...sendData, variables: vars });
    setSendDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Message Templates</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Create Template
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Variables</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={template.type} 
                    color={template.type === 'email' ? 'primary' : template.type === 'sms' ? 'secondary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>
                  {template.variables.map(v => (
                    <Chip key={v} label={v} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={template.is_active ? 'Active' : 'Inactive'} 
                    color={template.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => openSendDialog(template)}>
                    <Send />
                  </IconButton>
                  <IconButton>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Template Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Message Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="notification">Notification</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.type === 'email' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Message Body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                helperText="Use {{variable_name}} for dynamic content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Variables (comma separated)"
                placeholder="user_name, company_name, amount"
                onChange={(e) => setFormData({ 
                  ...formData, 
                  variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTemplate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={selectedTemplate?.type === 'email' ? 'Email Address' : 
                       selectedTemplate?.type === 'sms' ? 'Phone Number' : 'Webhook URL'}
                value={sendData.recipient}
                onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
              />
            </Grid>
            {selectedTemplate?.variables.map((variable) => (
              <Grid item xs={12} key={variable}>
                <TextField
                  fullWidth
                  label={variable}
                  value={sendData.variables[variable] || ''}
                  onChange={(e) => setSendData({
                    ...sendData,
                    variables: { ...sendData.variables, [variable]: e.target.value }
                  })}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Priority (1-10)"
                value={sendData.priority}
                onChange={(e) => setSendData({ ...sendData, priority: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained">Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
