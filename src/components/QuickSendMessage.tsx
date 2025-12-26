import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
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
  Alert,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { api } from '@/lib/api';

export default function QuickSendMessage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    type: 'email' as 'email' | 'sms' | 'notification',
    recipient: '',
    subject: '',
    body: '',
    priority: 5,
  });

  const handleSend = async () => {
    setLoading(true);
    try {
      await api.post('/messages', formData);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'email',
      recipient: '',
      subject: '',
      body: '',
      priority: 5,
    });
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Send sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Quick Send Message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Send an email, SMS, or notification instantly
            </Typography>
            <Button
              variant="contained"
              onClick={() => setOpen(true)}
              startIcon={<Send />}
            >
              Send Message
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Quick Message</DialogTitle>
        <DialogContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Message sent successfully!
            </Alert>
          )}
          
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Message Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="notification">Notification</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={
              formData.type === 'email' ? 'Email Address' :
              formData.type === 'sms' ? 'Phone Number' : 'Webhook URL'
            }
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            sx={{ mb: 2 }}
          />

          {formData.type === 'email' && (
            <TextField
              fullWidth
              label="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message Body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Priority (1-10)"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSend} 
            variant="contained" 
            disabled={loading || !formData.recipient || !formData.body}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
