import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Code,
  Security,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';

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

export default function ApiDocumentationPage() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            API Authentication Documentation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to authenticate your API requests using HMAC or RSA signatures
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="HMAC Authentication" icon={<Code />} />
              <Tab label="RSA Authentication" icon={<Security />} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h5" gutterBottom>
                HMAC-SHA256 Authentication
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                HMAC uses a shared secret to sign requests. Include these headers in your API requests:
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Required Headers:</strong> Key-ID, Nonce, Timestamp, Hash, Signature, Content-Type
                </Typography>
              </Alert>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">JavaScript/Node.js Example</Typography>
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
};

// Make request
const response = await fetch('https://api.mustody.com/endpoint', {
  method: 'POST',
  headers: headers,
  body: requestBody
});`}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">C# .NET Example</Typography>
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
using var client = new HttpClient();
client.DefaultRequestHeaders.Add("Key-ID", keyId);
client.DefaultRequestHeaders.Add("Nonce", nonce);
client.DefaultRequestHeaders.Add("Timestamp", timestamp.ToString());
client.DefaultRequestHeaders.Add("Hash", bodyHash);
client.DefaultRequestHeaders.Add("Signature", signature);

var response = await client.PostAsync("https://api.mustody.com/endpoint", 
  new StringContent(requestBody, Encoding.UTF8, "application/json"));`}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Python Example</Typography>
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
{`import hmac
import hashlib
import time
import random
import string
import requests
import json

secret = 'your-secret-key'
key_id = 'your-key-id'
nonce = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
timestamp = int(time.time())
method = 'POST'
host = 'api.mustody.com'
request_body = json.dumps({"data": "value"})

# Create body hash
body_hash = hmac.new(
    secret.encode('utf-8'),
    request_body.encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Create signature
signing_string = f"{host}{method}{timestamp}{nonce}{key_id}"
signature = hmac.new(
    secret.encode('utf-8'),
    signing_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Headers
headers = {
    'Key-ID': key_id,
    'Nonce': nonce,
    'Timestamp': str(timestamp),
    'Hash': body_hash,
    'Signature': signature,
    'Content-Type': 'application/json'
}

# Make request
response = requests.post('https://api.mustody.com/endpoint', 
                        headers=headers, data=request_body)`}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h5" gutterBottom>
                RSA-SHA256 Authentication
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                RSA authentication uses public/private key pairs following OAuth 1.0a standard. 
                Generate your keys and register the public key with Mustody.
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Keep your private key secure and never share it. 
                  Only register your public key with Mustody.
                </Typography>
              </Alert>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Generate RSA Key Pair</Typography>
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
{`# Generate private key (keep this secure!)
openssl ecparam -name prime256v1 -genkey -noout -out priv_key.pem

# Generate public key (register this with Mustody)
openssl pkey -in priv_key.pem -pubout -out pub_key.pem

# View your public key
cat pub_key.pem`}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Node.js RSA Example</Typography>
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
};

// Make request
const response = await fetch('https://api.mustody.com/endpoint', {
  method: 'POST',
  headers: headers,
  body: requestBody
});`}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">C# .NET RSA Example</Typography>
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

using var client = new HttpClient();
client.DefaultRequestHeaders.Authorization = 
  new System.Net.Http.Headers.AuthenticationHeaderValue("OAuth", oauthHeader);

var response = await client.PostAsync("https://api.mustody.com/endpoint",
  new StringContent(requestBody, Encoding.UTF8, "application/json"));`}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Python RSA Example</Typography>
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
{`from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import base64
import time
import random
import string
import requests
import json

# Load private key
with open('priv_key.pem', 'rb') as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None
    )

key_id = 'your-key-id'
nonce = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
timestamp = int(time.time())
method = 'POST'
host = 'api.mustody.com'
request_body = json.dumps({"data": "value"})

# Create body hash
body_hash = base64.b64encode(
    hashlib.sha256(request_body.encode('utf-8')).digest()
).decode('utf-8')

# Create signature string
signing_string = f"{host}{method}{timestamp}{nonce}{key_id}"

# Sign with private key
signature = private_key.sign(
    signing_string.encode('utf-8'),
    padding.PKCS1v15(),
    hashes.SHA256()
)
signature_b64 = base64.b64encode(signature).decode('utf-8')

# Create OAuth header
oauth_header = (
    f'OAuth oauth_consumer_key="{key_id}",'
    f'oauth_signature_method="RSA-SHA256",'
    f'oauth_timestamp="{timestamp}",'
    f'oauth_nonce="{nonce}",'
    f'oauth_body_hash="{body_hash}",'
    f'oauth_signature="{signature_b64}"'
)

headers = {
    'Authorization': oauth_header,
    'Content-Type': 'application/json'
}

# Make request
response = requests.post('https://api.mustody.com/endpoint', 
                        headers=headers, data=request_body)`}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
