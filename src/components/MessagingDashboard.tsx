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
  Container,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Send, 
  Email, 
  Sms, 
  Notifications,
  Visibility,
  VisibilityOff,
  Schedule,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
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
  const theme = useTheme();

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Email sx={{ fontSize: 18 }} />;
      case 'sms': return <Sms sx={{ fontSize: 18 }} />;
      case 'notification': return <Notifications sx={{ fontSize: 18 }} />;
      default: return <Email sx={{ fontSize: 18 }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return theme.palette.primary.main;
      case 'sms': return theme.palette.secondary.main;
      case 'notification': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight="600"
            sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Custom Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your custom message templates
          </Typography>
        </Box>
        <Zoom in timeout={300}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Create Template
          </Button>
        </Zoom>
      </Box>

      <Fade in timeout={500}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Variables</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template, index) => (
                  <Fade in timeout={300 + index * 100} key={template.id}>
                    <TableRow 
                      sx={{ 
                        '&:hover': { 
                          background: alpha(theme.palette.primary.main, 0.02),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40,
                              background: `linear-gradient(45deg, ${getTypeColor(template.type)}, ${alpha(getTypeColor(template.type), 0.7)})`,
                            }}
                          >
                            {getTypeIcon(template.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="500">
                              {template.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {template.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getTypeIcon(template.type)}
                          label={template.type.toUpperCase()} 
                          sx={{
                            background: alpha(getTypeColor(template.type), 0.1),
                            color: getTypeColor(template.type),
                            border: `1px solid ${alpha(getTypeColor(template.type), 0.2)}`,
                            fontWeight: 500,
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {template.subject || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {template.variables.slice(0, 3).map(v => (
                            <Chip 
                              key={v} 
                              label={v} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          ))}
                          {template.variables.length > 3 && (
                            <Chip 
                              label={`+${template.variables.length - 3}`} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.75rem',
                                height: 24,
                                background: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                              }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={template.is_active ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
                          label={template.is_active ? 'Active' : 'Inactive'} 
                          color={template.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            onClick={() => openSendDialog(template)}
                            sx={{ 
                              background: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              '&:hover': { 
                                background: alpha(theme.palette.success.main, 0.2),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            size="small"
                          >
                            <Send fontSize="small" />
                          </IconButton>
                          <IconButton 
                            sx={{ 
                              background: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              '&:hover': { 
                                background: alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            size="small"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </Fade>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Fade>

      {/* Create Template Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <Typography variant="h5" fontWeight="600">
            Create Message Template
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="email">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" />
                      Email
                    </Box>
                  </MenuItem>
                  <MenuItem value="sms">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Sms fontSize="small" />
                      SMS
                    </Box>
                  </MenuItem>
                  <MenuItem value="notification">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Notifications fontSize="small" />
                      Notification
                    </Box>
                  </MenuItem>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTemplate} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog 
        open={sendDialog} 
        onClose={() => setSendDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.info.main, 0.1)})`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <Typography variant="h5" fontWeight="600">
            Send Message
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={selectedTemplate?.type === 'email' ? 'Email Address' : 
                       selectedTemplate?.type === 'sms' ? 'Phone Number' : 'Webhook URL'}
                value={sendData.recipient}
                onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setSendDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained"
            startIcon={<Send />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
            }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
