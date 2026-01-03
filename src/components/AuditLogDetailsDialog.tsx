import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  IconButton,
} from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';

interface AuditLogDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  log: any;
}

const JsonViewer: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const formatValue = (value: any): React.ReactNode => {
    if (value === null) return <span style={{ color: '#999' }}>null</span>;
    if (typeof value === 'boolean') return <span style={{ color: '#0066cc' }}>{value.toString()}</span>;
    if (typeof value === 'number') return <span style={{ color: '#0066cc' }}>{value}</span>;
    if (typeof value === 'string') return <span style={{ color: '#d14' }}>"{value}"</span>;
    if (Array.isArray(value)) {
      return (
        <Box sx={{ ml: 2 }}>
          [
          {value.map((item, index) => (
            <Box key={index} sx={{ ml: 2 }}>
              {formatValue(item)}{index < value.length - 1 && ','}
            </Box>
          ))}
          ]
        </Box>
      );
    }
    if (typeof value === 'object') {
      return (
        <Box sx={{ ml: 2 }}>
          {'{'}
          {Object.entries(value).map(([key, val], index, arr) => (
            <Box key={key} sx={{ ml: 2 }}>
              <span style={{ color: '#0066cc' }}>"{key}"</span>: {formatValue(val)}{index < arr.length - 1 && ','}
            </Box>
          ))}
          {'}'}
        </Box>
      );
    }
    return value;
  };

  return (
    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="600">
          {title}
        </Typography>
        <IconButton size="small" onClick={copyToClipboard}>
          <ContentCopy fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
        {formatValue(data)}
      </Box>
    </Paper>
  );
};

export default function AuditLogDetailsDialog({ open, onClose, log }: AuditLogDetailsDialogProps) {
  if (!log) return null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'success';
      case 'update': return 'info';
      case 'delete': return 'error';
      case 'login': return 'primary';
      case 'logout': return 'default';
      default: return 'default';
    }
  };

  const parseJsonSafely = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Audit Log Details</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">ID</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.id}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                <Typography variant="body1">{new Date(log.timestamp).toLocaleString()}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Action</Typography>
                <Chip
                  label={log.action}
                  color={getActionColor(log.action) as any}
                  size="small"
                  variant="outlined"
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Resource</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.resource}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Level</Typography>
                <Chip
                  label={log.level}
                  color={getLevelColor(log.level) as any}
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">IP Address</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.ip_address}</Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              User Information
            </Typography>
            {log.user ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.user.id}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{log.user.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{log.user.email}</Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">System Action</Typography>
            )}
            
            {log.tenant && (
              <>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ mt: 3 }}>
                  Tenant Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tenant ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.tenant.id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tenant Name</Typography>
                    <Typography variant="body1">{log.tenant.name}</Typography>
                  </Box>
                </Box>
              </>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Message
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {log.message}
              </Typography>
            </Paper>
          </Grid>
          
          {log.user_agent && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                User Agent
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {log.user_agent}
                </Typography>
              </Paper>
            </Grid>
          )}
          
          {log.path && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Request Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Path</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.path}</Typography>
                </Box>
                {log.method && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Method</Typography>
                    <Chip label={log.method} size="small" variant="outlined" />
                  </Box>
                )}
                {log.query && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Query Parameters</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.query}</Typography>
                  </Box>
                )}
                {log.status_code && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Status Code</Typography>
                    <Chip 
                      label={log.status_code} 
                      size="small" 
                      color={log.status_code >= 400 ? 'error' : log.status_code >= 300 ? 'warning' : 'success'}
                    />
                  </Box>
                )}
                {log.correlation_id && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Correlation ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.correlation_id}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          )}
          
          {log.request && (
            <Grid item xs={12}>
              <JsonViewer data={parseJsonSafely(log.request)} title="Request Data" />
            </Grid>
          )}
          
          {log.response && (
            <Grid item xs={12}>
              <JsonViewer data={parseJsonSafely(log.response)} title="Response Data" />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
