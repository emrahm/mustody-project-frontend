import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { Send, Email, Sms, Notifications, TrendingUp } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';

interface MessageStats {
  pending: number;
  sent: number;
  failed: number;
}

export default function MessagingWidget() {
  const theme = useTheme();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<MessageStats>({ pending: 0, sent: 0, failed: 0 });
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentMessages();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/messages/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch message stats:', error);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const response = await api.get('/messages?limit=5');
      setRecentMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch recent messages:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Email fontSize="small" />;
      case 'sms': return <Sms fontSize="small" />;
      case 'notification': return <Notifications fontSize="small" />;
      default: return <Send fontSize="small" />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            >
              <Send />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              Messaging
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => setLocation('/messaging')}
            sx={{ textTransform: 'none' }}
          >
            View All
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              {stats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {stats.sent}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sent
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" fontWeight="bold" color="error.main">
              {stats.failed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Failed
            </Typography>
          </Box>
        </Box>

        {/* Recent Messages */}
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Recent Messages
        </Typography>
        
        {recentMessages.length > 0 ? (
          <List dense sx={{ p: 0 }}>
            {recentMessages.slice(0, 3).map((message: any) => (
              <ListItem key={message.id} sx={{ px: 0, py: 0.5 }}>
                <Box sx={{ mr: 1, color: 'text.secondary' }}>
                  {getTypeIcon(message.type)}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {message.recipient}
                      </Typography>
                      <Chip
                        label={message.status}
                        size="small"
                        color={getStatusColor(message.status) as any}
                        sx={{ minWidth: 60, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {new Date(message.created_at).toLocaleDateString()}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setLocation('/messaging')}
              sx={{ mt: 1, textTransform: 'none' }}
            >
              Create Template
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
