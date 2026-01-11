import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import { Code, Security, Key } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';

export default function ApiDocsPage() {
  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            API Documentation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete guide for API key management and authentication
          </Typography>
        </Box>

        {/* Base URL */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Code sx={{ mr: 1 }} />
              Base URL
            </Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              /api/api-keys
            </Typography>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Security sx={{ mr: 1 }} />
              Authentication
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              All endpoints require Bearer token authentication and tenant_admin or tenant_user role.
            </Typography>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Endpoints
            </Typography>
            
            {/* Create API Key */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="POST" color="success" size="small" />
                <Typography variant="body2" fontFamily="monospace">/api/api-keys</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Creates a new API key with HMAC or RSA authentication.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>Request Body:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                <pre style={{ margin: 0, fontSize: '0.875rem' }}>
{`{
  "name": "string (required)",
  "auth_type": "hmac|rsa (optional, default: hmac)",
  "public_key": "string (required for RSA)",
  "expires_at": "string|null (ISO 8601 format)",
  "permissions": ["string"] (optional)
}`}
                </pre>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* List API Keys */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="GET" color="primary" size="small" />
                <Typography variant="body2" fontFamily="monospace">/api/api-keys</Typography>
              </Box>
              <Typography variant="body2">
                Returns all API keys for the current tenant.
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Update API Key */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="PUT" color="warning" size="small" />
                <Typography variant="body2" fontFamily="monospace">/api/api-keys/:id</Typography>
              </Box>
              <Typography variant="body2">
                Updates an existing API key's name and permissions.
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Toggle API Key */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="PATCH" color="info" size="small" />
                <Typography variant="body2" fontFamily="monospace">/api/api-keys/:id/toggle</Typography>
              </Box>
              <Typography variant="body2">
                Enables or disables an API key.
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Delete API Key */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="DELETE" color="error" size="small" />
                <Typography variant="body2" fontFamily="monospace">/api/api-keys/:id</Typography>
              </Box>
              <Typography variant="body2">
                Permanently revokes an API key.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Authentication Types */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Key sx={{ mr: 1 }} />
              Authentication Types
            </Typography>

            {/* HMAC */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                HMAC Authentication
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Uses shared secret for request signing. Secret is generated automatically and shown only once.
                Requires Key-ID, Nonce, Timestamp, Hash, and Signature headers.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Java Example:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
{`// Create signature string
String signatureString = method + "\\n" + path + "\\n" + nonce + "\\n" + timestamp + "\\n" + hash;

// Generate HMAC signature
Mac mac = Mac.getInstance("HmacSHA256");
SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
mac.init(secretKey);
String signature = Base64.getEncoder().encodeToString(
    mac.doFinal(signatureString.getBytes(StandardCharsets.UTF_8))
);

// Set headers: Key-ID, Nonce, Timestamp, Hash, Signature`}
                </pre>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Go Example:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
{`// Create signature string
signatureString := strings.Join([]string{method, path, nonce, timestamp, hash}, "\\n")

// Generate HMAC signature
mac := hmac.New(sha256.New, []byte(secret))
mac.Write([]byte(signatureString))
signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

// Set headers
req.Header.Set("Key-ID", keyID)
req.Header.Set("Nonce", nonce)
req.Header.Set("Timestamp", timestamp)
req.Header.Set("Hash", hash)
req.Header.Set("Signature", signature)`}
                </pre>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* RSA */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                RSA Authentication
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Uses public/private key pairs. Public key must be provided during creation.
                Uses OAuth-style authorization header with RSA-SHA256 signature.
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Java Example:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
{`String signatureString = method + "\\n" + path + "\\n" + timestamp + "\\n" + body;

Signature signature = Signature.getInstance("SHA256withRSA");
signature.initSign(privateKey);
signature.update(signatureString.getBytes());

String signatureBase64 = Base64.getEncoder().encodeToString(signature.sign());
String authHeader = String.format("RSA-SHA256 KeyId=%s,Timestamp=%s,Signature=%s", 
    keyId, timestamp, signatureBase64);`}
                </pre>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Go Example:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
{`signatureString := strings.Join([]string{method, path, timestamp, body}, "\\n")

hashed := sha256.Sum256([]byte(signatureString))
signature, _ := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])

signatureBase64 := base64.StdEncoding.EncodeToString(signature)
authHeader := fmt.Sprintf("RSA-SHA256 KeyId=%s,Timestamp=%s,Signature=%s",
    keyID, timestamp, signatureBase64)

req.Header.Set("Authorization", authHeader)`}
                </pre>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Error Responses */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Error Responses
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              All endpoints return standard error responses with appropriate HTTP status codes.
            </Alert>
            <Typography variant="body2" sx={{ mb: 1 }}>Common HTTP status codes:</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li><strong>400</strong> - Bad Request (invalid input)</li>
              <li><strong>401</strong> - Unauthorized (missing/invalid token)</li>
              <li><strong>403</strong> - Forbidden (insufficient permissions)</li>
              <li><strong>404</strong> - Not Found (API key not found)</li>
              <li><strong>500</strong> - Internal Server Error</li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
