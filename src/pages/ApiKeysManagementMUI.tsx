import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Add,
  Key,
  Visibility,
  Delete,
  Edit,
  ContentCopy,
  Security,
  Schedule,
  ExpandMore,
  Code,
  PowerSettingsNew,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DashboardLayout from '@/components/DashboardLayout';
import { apiKeyAPI } from '@/lib/api';

const schema = yup.object({
  name: yup.string().required('API key name is required'),
  authType: yup.string().required('Authentication type is required'),
  publicKey: yup.string().when('authType', {
    is: 'rsa',
    then: (schema) => schema.required('Public key is required for RSA authentication'),
    otherwise: (schema) => schema.notRequired(),
  }),
  expiresIn: yup.string().required('Expiration is required'),
});

type FormData = {
  name: string;
  authType: 'hmac' | 'rsa';
  publicKey?: string;
  expiresIn: string;
};

interface ApiKey {
  id: string;
  name: string;
  keyId: string;
  authType: 'hmac' | 'rsa';
  secret?: string;
  publicKey?: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
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

export default function ApiKeysManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [open, setOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{secret?: string; keyId: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuthType, setSelectedAuthType] = useState<'hmac' | 'rsa'>('hmac');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      authType: 'hmac',
      publicKey: '',
      expiresIn: '',
    },
  });

  const watchAuthType = watch('authType');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await apiKeyAPI.getApiKeys();
      const apiKeysData = response?.data?.data || response?.data || [];
      setApiKeys(Array.isArray(apiKeysData) ? apiKeysData : []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setApiKeys([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const expiresAt = data.expiresIn === 'never' ? null : new Date(Date.now() + parseInt(data.expiresIn) * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await apiKeyAPI.createApiKey(
        data.name, 
        [], // permissions - empty for now
        expiresAt,
        data.authType as 'hmac' | 'rsa',
        data.authType === 'rsa' ? data.publicKey : undefined
      );
      
      if (data.authType === 'hmac') {
        setGeneratedKey({
          secret: response.data.secret,
          keyId: response.data.keyId,
        });
      } else {
        setGeneratedKey({
          keyId: response.data.keyId,
        });
      }
      
      await loadApiKeys();
      reset();
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiKeyAPI.toggleApiKey(id, !isActive);
      await loadApiKeys();
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiKeyAPI.deleteApiKey(id);
      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setGeneratedKey(null);
    reset();
  };

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              API Keys Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your API keys for programmatic access to Mustody services
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            size="large"
          >
            Create API Key
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'primary.light', color: 'white' }}>
                    <Key />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'success.light', color: 'white' }}>
                    <Security />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.isActive).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'info.light', color: 'white' }}>
                    <Code />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.authType === 'hmac').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      HMAC Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'warning.light', color: 'white' }}>
                    <Security />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {apiKeys.filter(k => k.authType === 'rsa').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      RSA Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* API Keys Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              API Keys
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Key ID</TableCell>
                    <TableCell>Auth Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="600">
                          {apiKey.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontFamily="monospace">
                            {apiKey.keyId}
                          </Typography>
                          <Tooltip title="Copy key ID">
                            <IconButton size="small" onClick={() => copyToClipboard(apiKey.keyId)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={apiKey.authType.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color={apiKey.authType === 'hmac' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={apiKey.isActive ? 'Active' : 'Disabled'}
                          size="small"
                          color={getStatusColor(apiKey.isActive) as any}
                        />
                      </TableCell>
                      <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>{apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={apiKey.isActive ? 'Disable' : 'Enable'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleActive(apiKey.id, apiKey.isActive)}
                            color={apiKey.isActive ? 'warning' : 'success'}
                          >
                            <PowerSettingsNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(apiKey.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create API Key Dialog */}
        <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Create New API Key</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              {generatedKey && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    API Key Created Successfully!
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Key ID: 
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1 }}>
                      {generatedKey.keyId}
                    </Typography>
                    <IconButton size="small" onClick={() => copyToClipboard(generatedKey.keyId)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  {generatedKey.secret && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Secret: 
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1 }}>
                        {generatedKey.secret}
                      </Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(generatedKey.secret!)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {generatedKey.secret 
                      ? 'Make sure to copy your secret now. You won\'t be able to see it again!'
                      : 'Your RSA key has been registered. Use your private key for signing requests.'
                    }
                  </Typography>
                </Alert>
              )}

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="API Key Name"
                    fullWidth
                    sx={{ mb: 3 }}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Production API, Development API"
                  />
                )}
              />

              <Controller
                name="authType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.authType}>
                    <InputLabel>Authentication Type</InputLabel>
                    <Select {...field} label="Authentication Type">
                      <MenuItem value="hmac">HMAC-SHA256</MenuItem>
                      <MenuItem value="rsa">RSA-SHA256</MenuItem>
                    </Select>
                    {errors.authType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.authType.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {watchAuthType === 'rsa' && (
                <Controller
                  name="publicKey"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Public Key"
                      fullWidth
                      multiline
                      rows={6}
                      sx={{ mb: 3 }}
                      error={!!errors.publicKey}
                      helperText={errors.publicKey?.message || 'Paste your RSA public key in PEM format'}
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                    />
                  )}
                />
              )}

              <Controller
                name="expiresIn"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.expiresIn}>
                    <InputLabel>Expires In</InputLabel>
                    <Select {...field} label="Expires In">
                      <MenuItem value="30">30 days</MenuItem>
                      <MenuItem value="90">90 days</MenuItem>
                      <MenuItem value="365">1 year</MenuItem>
                      <MenuItem value="never">Never</MenuItem>
                    </Select>
                    {errors.expiresIn && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.expiresIn.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <Divider sx={{ my: 3 }} />

              {/* Documentation Section */}
              <Box sx={{ mt: 3 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                  <Tab label="HMAC Documentation" />
                  <Tab label="RSA Documentation" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                  <Typography variant="h6" gutterBottom>
                    HMAC Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    HMAC uses a shared secret to sign requests. Include these headers in your API requests:
                  </Typography>
                  
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">JavaScript/Node.js Example</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="pre" sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
{`const crypto = require('crypto');

const secret = 'your-secret-key';
const keyID = 'your-key-id';
const nonce = Math.random().toString(36).substring(2, 15);
const timestamp = Math.floor(Date.now() / 1000);
const method = 'POST';
const host = 'api.mustody.com';
const requestBody = JSON.stringify({ /* your data */ });

// Create body hash
const bodyHash = crypto.createHmac('sha256', secret)
  .update(requestBody)
  .digest('hex');

// Create signature
const signingString = \`\${host}\${method}\${timestamp}\${nonce}\${keyID}\`;
const signature = crypto.createHmac('sha256', secret)
  .update(signingString)
  .digest('hex');

// Headers
const headers = {
  'Key-ID': keyID,
  'Nonce': nonce,
  'Timestamp': timestamp.toString(),
  'Hash': bodyHash,
  'Signature': signature,
  'Content-Type': 'application/json'
};`}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">C# .NET Example</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="pre" sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
{`using System.Security.Cryptography;
using System.Text;

var secret = "your-secret-key";
var keyId = "your-key-id";
var nonce = Guid.NewGuid().ToString("N")[..12];
var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
var method = "POST";
var host = "api.mustody.com";
var requestBody = "{\\"data\\": \\"value\\"}";

// Create body hash
using var hmacBody = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
var bodyHash = Convert.ToHexString(hmacBody.ComputeHash(
  Encoding.UTF8.GetBytes(requestBody))).ToLower();

// Create signature
var signingString = $"{host}{method}{timestamp}{nonce}{keyId}";
using var hmacSig = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
var signature = Convert.ToHexString(hmacSig.ComputeHash(
  Encoding.UTF8.GetBytes(signingString))).ToLower();

// Add headers to HttpClient
client.DefaultRequestHeaders.Add("Key-ID", keyId);
client.DefaultRequestHeaders.Add("Nonce", nonce);
client.DefaultRequestHeaders.Add("Timestamp", timestamp.ToString());
client.DefaultRequestHeaders.Add("Hash", bodyHash);
client.DefaultRequestHeaders.Add("Signature", signature);`}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Typography variant="h6" gutterBottom>
                    RSA Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    RSA authentication uses public/private key pairs. Generate your keys and register the public key.
                  </Typography>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">Generate RSA Key Pair</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" gutterBottom>
                        Generate your RSA key pair using OpenSSL:
                      </Typography>
                      <Box component="pre" sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
{`# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out priv_key.pem

# Generate public key
openssl pkey -in priv_key.pem -pubout -out pub_key.pem`}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">Node.js RSA Example</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="pre" sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
{`const crypto = require('crypto');
const fs = require('fs');

const privateKey = fs.readFileSync('priv_key.pem', 'utf8');
const keyId = 'your-key-id';
const nonce = Math.random().toString(36).substring(2, 15);
const timestamp = Math.floor(Date.now() / 1000);
const method = 'POST';
const host = 'api.mustody.com';
const requestBody = JSON.stringify({ /* your data */ });

// Create body hash
const bodyHash = crypto.createHash('sha256')
  .update(requestBody)
  .digest('base64');

// Create signature string
const signingString = \`\${host}\${method}\${timestamp}\${nonce}\${keyId}\`;

// Sign with private key
const signature = crypto.sign('sha256', Buffer.from(signingString), {
  key: privateKey,
  format: 'pem'
}).toString('base64');

// OAuth header
const oauthHeader = \`OAuth oauth_consumer_key="\${keyId}",\` +
  \`oauth_signature_method="RSA-SHA256",\` +
  \`oauth_timestamp="\${timestamp}",\` +
  \`oauth_nonce="\${nonce}",\` +
  \`oauth_body_hash="\${bodyHash}",\` +
  \`oauth_signature="\${signature}"\`;

const headers = {
  'Authorization': oauthHeader,
  'Content-Type': 'application/json'
};`}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">C# .NET RSA Example</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="pre" sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
{`using System.Security.Cryptography;
using System.Text;

var privateKeyPem = File.ReadAllText("priv_key.pem");
var keyId = "your-key-id";
var nonce = Guid.NewGuid().ToString("N")[..12];
var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
var method = "POST";
var host = "api.mustody.com";
var requestBody = "{\\"data\\": \\"value\\"}";

// Create body hash
var bodyHash = Convert.ToBase64String(
  SHA256.HashData(Encoding.UTF8.GetBytes(requestBody)));

// Create signature string
var signingString = $"{host}{method}{timestamp}{nonce}{keyId}";

// Load private key and sign
using var rsa = RSA.Create();
rsa.ImportFromPem(privateKeyPem);
var signature = Convert.ToBase64String(
  rsa.SignData(Encoding.UTF8.GetBytes(signingString), 
    HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));

// Create OAuth header
var oauthHeader = $"OAuth oauth_consumer_key=\\"{keyId}\\","
  + $"oauth_signature_method=\\"RSA-SHA256\\","
  + $"oauth_timestamp=\\"{timestamp}\\","
  + $"oauth_nonce=\\"{nonce}\\","
  + $"oauth_body_hash=\\"{bodyHash}\\","
  + $"oauth_signature=\\"{signature}\\"";

client.DefaultRequestHeaders.Authorization = 
  new System.Net.Http.Headers.AuthenticationHeaderValue("OAuth", oauthHeader);`}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </TabPanel>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
