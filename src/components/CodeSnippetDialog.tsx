import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import { ContentCopy, Close } from '@mui/icons-material';
import { Highlight, themes, Prism } from 'prism-react-renderer';

// Extend with additional languages by loading them against this Prism instance
(async () => {
  // @ts-ignore
  window.Prism = Prism;
  // @ts-ignore
  await import('prismjs/components/prism-java');
  // @ts-ignore
  await import('prismjs/components/prism-csharp');
  // @ts-ignore
  await import('prismjs/components/prism-markup-templating'); // required by php
  // @ts-ignore
  await import('prismjs/components/prism-php');
})();

interface ApiKey {
  id: string;
  name: string;
  keyId: string;
  authType: 'hmac' | 'rsa';
}

interface Props {
  open: boolean;
  onClose: () => void;
  apiKey: ApiKey | null;
}

type Language = 'nodejs' | 'dotnet' | 'java' | 'go' | 'php';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'nodejs', label: 'Node.js' },
  { value: 'dotnet', label: 'C# .NET' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
];

function getHmacSnippet(lang: Language, keyId: string, secret: string): string {
  const host = 'api.mustody.com';
  const endpoint = '/blockchain/wallet/balance';

  switch (lang) {
    case 'nodejs':
      return `const crypto = require('crypto');
const https = require('https');

const KEY_ID = '${keyId}';
const SECRET = '${secret}';

const method = 'POST';
const host = '${host}';
const path = '${endpoint}';
const body = JSON.stringify({ chainId: 'ethereum', address: '0x...' });

const nonce = crypto.randomBytes(8).toString('hex').slice(0, 12);
const timestamp = Math.floor(Date.now() / 1000).toString();

const bodyHash = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
const sigData = \`\${host}\${method}\${timestamp}\${nonce}\${KEY_ID}\`;
const signature = crypto.createHmac('sha256', SECRET).update(sigData).digest('hex');

const options = {
  hostname: host,
  path: path,
  method: method,
  headers: {
    'Content-Type': 'application/json',
    'X-Key-ID': KEY_ID,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Hash': bodyHash,
    'X-Signature': signature,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
req.write(body);
req.end();`;

    case 'dotnet':
      return `using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Headers;

const string KEY_ID = "${keyId}";
const string SECRET = "${secret}";

var host = "${host}";
var method = "POST";
var path = "${endpoint}";
var body = """{"chainId":"ethereum","address":"0x..."}""";

var nonce = Guid.NewGuid().ToString("N")[..12];
var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

byte[] secretBytes = Encoding.UTF8.GetBytes(SECRET);

using var hmacBody = new HMACSHA256(secretBytes);
var bodyHash = Convert.ToHexString(hmacBody.ComputeHash(Encoding.UTF8.GetBytes(body))).ToLower();

var sigData = $"{host}{method}{timestamp}{nonce}{KEY_ID}";
using var hmacSig = new HMACSHA256(secretBytes);
var signature = Convert.ToHexString(hmacSig.ComputeHash(Encoding.UTF8.GetBytes(sigData))).ToLower();

using var client = new HttpClient();
client.BaseAddress = new Uri($"https://{host}");
var request = new HttpRequestMessage(HttpMethod.Post, path);
request.Headers.Add("X-Key-ID", KEY_ID);
request.Headers.Add("X-Timestamp", timestamp);
request.Headers.Add("X-Nonce", nonce);
request.Headers.Add("X-Hash", bodyHash);
request.Headers.Add("X-Signature", signature);
request.Content = new StringContent(body, Encoding.UTF8, "application/json");

var response = await client.SendAsync(request);
Console.WriteLine(await response.Content.ReadAsStringAsync());`;

    case 'java':
      return `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.*;
import java.net.URI;
import java.time.Instant;
import java.util.HexFormat;

public class MustodyClient {
    static final String KEY_ID = "${keyId}";
    static final String SECRET = "${secret}";

    public static void main(String[] args) throws Exception {
        var host = "${host}";
        var method = "POST";
        var path = "${endpoint}";
        var body = "{\\"chainId\\":\\"ethereum\\",\\"address\\":\\"0x...\\"}";

        var nonce = Long.toHexString(Double.doubleToLongBits(Math.random())).substring(0, 12);
        var timestamp = String.valueOf(Instant.now().getEpochSecond());

        var bodyHash = hmac(SECRET, body);
        var sigData = host + method + timestamp + nonce + KEY_ID;
        var signature = hmac(SECRET, sigData);

        var client = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder()
            .uri(URI.create("https://" + host + path))
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .header("Content-Type", "application/json")
            .header("X-Key-ID", KEY_ID)
            .header("X-Timestamp", timestamp)
            .header("X-Nonce", nonce)
            .header("X-Hash", bodyHash)
            .header("X-Signature", signature)
            .build();

        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }

    static String hmac(String secret, String data) throws Exception {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes()));
    }
}`;

    case 'go':
      return `package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

const (
	KeyID  = "${keyId}"
	Secret = "${secret}"
)

func sign(secret, data string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func main() {
	host := "${host}"
	method := "POST"
	path := "${endpoint}"
	body := []byte(\`{"chainId":"ethereum","address":"0x..."}\`)

	nonceBytes := make([]byte, 6)
	rand.Read(nonceBytes)
	nonce := hex.EncodeToString(nonceBytes)
	timestamp := strconv.FormatInt(time.Now().UTC().Unix(), 10)

	bodyHash := sign(Secret, string(body))
	sigData := host + method + timestamp + nonce + KeyID
	signature := sign(Secret, sigData)

	req, _ := http.NewRequest(method, fmt.Sprintf("https://%s%s", host, path), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Key-ID", KeyID)
	req.Header.Set("X-Timestamp", timestamp)
	req.Header.Set("X-Nonce", nonce)
	req.Header.Set("X-Hash", bodyHash)
	req.Header.Set("X-Signature", signature)

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	fmt.Println(string(data))
}`;

    case 'php':
      return `<?php

$KEY_ID = '${keyId}';
$SECRET = '${secret}';

$host    = '${host}';
$method  = 'POST';
$path    = '${endpoint}';
$body    = json_encode(['chainId' => 'ethereum', 'address' => '0x...']);

$nonce     = bin2hex(random_bytes(6));
$timestamp = (string) time();

$bodyHash  = hash_hmac('sha256', $body, $SECRET);
$sigData   = $host . $method . $timestamp . $nonce . $KEY_ID;
$signature = hash_hmac('sha256', $sigData, $SECRET);

$ch = curl_init("https://$host$path");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        "X-Key-ID: $KEY_ID",
        "X-Timestamp: $timestamp",
        "X-Nonce: $nonce",
        "X-Hash: $bodyHash",
        "X-Signature: $signature",
    ],
]);

echo curl_exec($ch);
curl_close($ch);`;
  }
}

function getRsaSnippet(lang: Language, keyId: string): string {
  const host = 'api.mustody.com';
  const endpoint = '/blockchain/wallet/balance';

  switch (lang) {
    case 'nodejs':
      return `const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const KEY_ID = '${keyId}';
const PRIVATE_KEY = fs.readFileSync('priv_key.pem', 'utf8'); // Set path to your private key

const method = 'POST';
const host = '${host}';
const path = '${endpoint}';
const body = JSON.stringify({ chainId: 'ethereum', address: '0x...' });

const nonce = crypto.randomBytes(8).toString('hex').slice(0, 12);
const timestamp = Math.floor(Date.now() / 1000).toString();

// Body hash: base64(sha256(body))
const bodyHash = crypto.createHash('sha256').update(body).digest('base64');

// Build OAuth params
const oauthParams = {
  oauth_consumer_key: KEY_ID,
  oauth_signature_method: 'RSA-SHA256',
  oauth_version: '1.0',
  oauth_timestamp: timestamp,
  oauth_nonce: nonce,
  oauth_body_hash: bodyHash,
};

// Build base string
const paramStr = Object.entries(oauthParams)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => \`\${encodeURIComponent(k)}=\${encodeURIComponent(v)}\`)
  .join('&');

const baseString = \`\${method}&\${encodeURIComponent('https://' + host + path)}&\${encodeURIComponent(paramStr)}\`;

// Sign: sha256(baseString) then RSA PKCS1v15
const hash = crypto.createHash('sha256').update(baseString).digest();
const signature = crypto.sign(null, hash, { key: PRIVATE_KEY, padding: crypto.constants.RSA_PKCS1_PADDING });
const oauthSignature = signature.toString('base64');

const authHeader = Object.entries({ ...oauthParams, oauth_signature: oauthSignature })
  .map(([k, v]) => \`\${k}="\${v}"\`)
  .join(', ');

const options = {
  hostname: host, path, method,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`OAuth \${authHeader}\`,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
req.write(body);
req.end();`;

    case 'dotnet':
      return `using System.Security.Cryptography;
using System.Text;
using System.Web;

const string KEY_ID = "${keyId}";
// Set your RSA private key (PEM format)
const string PRIVATE_KEY_PEM = """
-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
""";

var host = "${host}";
var method = "POST";
var path = "${endpoint}";
var body = """{"chainId":"ethereum","address":"0x..."}""";

var nonce = Guid.NewGuid().ToString("N")[..12];
var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

// Body hash: base64(sha256(body))
var bodyHashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(body));
var bodyHash = Convert.ToBase64String(bodyHashBytes);

var oauthParams = new SortedDictionary<string, string> {
    ["oauth_body_hash"] = bodyHash,
    ["oauth_consumer_key"] = KEY_ID,
    ["oauth_nonce"] = nonce,
    ["oauth_signature_method"] = "RSA-SHA256",
    ["oauth_timestamp"] = timestamp,
    ["oauth_version"] = "1.0",
};

var paramStr = string.Join("&", oauthParams.Select(kv =>
    $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

var baseString = $"{method}&{Uri.EscapeDataString($"https://{host}{path}")}&{Uri.EscapeDataString(paramStr)}";

using var rsa = RSA.Create();
rsa.ImportFromPem(PRIVATE_KEY_PEM);
var baseHash = SHA256.HashData(Encoding.UTF8.GetBytes(baseString));
var sigBytes = rsa.SignHash(baseHash, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
var signature = Convert.ToBase64String(sigBytes);

var allParams = new Dictionary<string, string>(oauthParams) { ["oauth_signature"] = signature };
var authHeader = "OAuth " + string.Join(", ", allParams.Select(kv => $"{kv.Key}=\\"{kv.Value}\\""));

using var client = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.Post, $"https://{host}{path}");
request.Headers.TryAddWithoutValidation("Authorization", authHeader);
request.Content = new StringContent(body, Encoding.UTF8, "application/json");

var response = await client.SendAsync(request);
Console.WriteLine(await response.Content.ReadAsStringAsync());`;

    case 'java':
      return `import java.net.http.*;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

public class MustodyRsaClient {
    static final String KEY_ID = "${keyId}";
    // Set path to your PKCS8 private key file
    static final String PRIVATE_KEY_PATH = "priv_key_pkcs8.pem";

    public static void main(String[] args) throws Exception {
        var host = "${host}";
        var method = "POST";
        var path = "${endpoint}";
        var body = "{\\"chainId\\":\\"ethereum\\",\\"address\\":\\"0x...\\"}";

        var nonce = Long.toHexString(Double.doubleToLongBits(Math.random())).substring(0, 12);
        var timestamp = String.valueOf(Instant.now().getEpochSecond());

        // Body hash: base64(sha256(body))
        var sha256 = MessageDigest.getInstance("SHA-256");
        var bodyHash = Base64.getEncoder().encodeToString(sha256.digest(body.getBytes()));

        var oauthParams = new TreeMap<>(Map.of(
            "oauth_body_hash", bodyHash,
            "oauth_consumer_key", KEY_ID,
            "oauth_nonce", nonce,
            "oauth_signature_method", "RSA-SHA256",
            "oauth_timestamp", timestamp,
            "oauth_version", "1.0"
        ));

        var paramStr = oauthParams.entrySet().stream()
            .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
            .collect(Collectors.joining("&"));

        var baseString = method + "&" + encode("https://" + host + path) + "&" + encode(paramStr);

        // Load private key
        var pem = Files.readString(Path.of(PRIVATE_KEY_PATH))
            .replaceAll("-----.*-----", "").replaceAll("\\\\s", "");
        var keySpec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem));
        var privateKey = KeyFactory.getInstance("RSA").generatePrivate(keySpec);

        sha256.reset();
        var baseHash = sha256.digest(baseString.getBytes());
        var sig = Signature.getInstance("NONEwithRSA");
        sig.initSign(privateKey);
        sig.update(baseHash);
        var signature = Base64.getEncoder().encodeToString(sig.sign());

        oauthParams.put("oauth_signature", signature);
        var authHeader = "OAuth " + oauthParams.entrySet().stream()
            .map(e -> e.getKey() + "=\\"" + e.getValue() + "\\"")
            .collect(Collectors.joining(", "));

        var client = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder()
            .uri(URI.create("https://" + host + path))
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .header("Content-Type", "application/json")
            .header("Authorization", authHeader)
            .build();

        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }

    static String encode(String s) { return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8); }
}`;

    case 'go':
      return `package main

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

const KeyID = "${keyId}"

func main() {
	// Load your RSA private key
	pemData, _ := os.ReadFile("priv_key.pem") // Set path to your private key
	block, _ := pem.Decode(pemData)
	privateKey, _ := x509.ParsePKCS8PrivateKey(block.Bytes)
	rsaKey := privateKey.(*rsa.PrivateKey)

	host := "${host}"
	method := "POST"
	path := "${endpoint}"
	body := []byte(\`{"chainId":"ethereum","address":"0x..."}\`)

	nonceBytes := make([]byte, 6)
	rand.Read(nonceBytes)
	nonce := hex.EncodeToString(nonceBytes)
	timestamp := strconv.FormatInt(time.Now().UTC().Unix(), 10)

	// Body hash: base64(sha256(body))
	bodyHashRaw := sha256.Sum256(body)
	bodyHash := base64.StdEncoding.EncodeToString(bodyHashRaw[:])

	oauthParams := map[string]string{
		"oauth_body_hash":         bodyHash,
		"oauth_consumer_key":      KeyID,
		"oauth_nonce":             nonce,
		"oauth_signature_method":  "RSA-SHA256",
		"oauth_timestamp":         timestamp,
		"oauth_version":           "1.0",
	}

	// Build sorted param string
	keys := make([]string, 0, len(oauthParams))
	for k := range oauthParams { keys = append(keys, k) }
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, url.QueryEscape(k)+"="+url.QueryEscape(oauthParams[k]))
	}
	paramStr := strings.Join(parts, "&")

	baseString := fmt.Sprintf("%s&%s&%s", method,
		url.QueryEscape(fmt.Sprintf("https://%s%s", host, path)),
		url.QueryEscape(paramStr))

	// Sign: sha256(baseString) then RSA PKCS1v15
	baseHash := sha256.Sum256([]byte(baseString))
	sigBytes, _ := rsa.SignPKCS1v15(rand.Reader, rsaKey, crypto.SHA256, baseHash[:])
	signature := base64.StdEncoding.EncodeToString(sigBytes)

	oauthParams["oauth_signature"] = signature
	headerParts := make([]string, 0)
	for _, k := range append(keys, "oauth_signature") {
		if v, ok := oauthParams[k]; ok {
			headerParts = append(headerParts, fmt.Sprintf("%s=%q", k, v))
		}
	}
	authHeader := "OAuth " + strings.Join(headerParts, ", ")

	req, _ := http.NewRequest(method, fmt.Sprintf("https://%s%s", host, path), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader)

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	fmt.Println(string(data))
}`;

    case 'php':
      return `<?php

$KEY_ID      = '${keyId}';
$PRIVATE_KEY = openssl_pkey_get_private(file_get_contents('priv_key.pem')); // Set path to your private key

$host   = '${host}';
$method = 'POST';
$path   = '${endpoint}';
$body   = json_encode(['chainId' => 'ethereum', 'address' => '0x...']);

$nonce     = bin2hex(random_bytes(6));
$timestamp = (string) time();

// Body hash: base64(sha256(body))
$bodyHash = base64_encode(hash('sha256', $body, true));

$oauthParams = [
    'oauth_body_hash'        => $bodyHash,
    'oauth_consumer_key'     => $KEY_ID,
    'oauth_nonce'            => $nonce,
    'oauth_signature_method' => 'RSA-SHA256',
    'oauth_timestamp'        => $timestamp,
    'oauth_version'          => '1.0',
];
ksort($oauthParams);

$paramStr = implode('&', array_map(
    fn($k, $v) => rawurlencode($k) . '=' . rawurlencode($v),
    array_keys($oauthParams), $oauthParams
));

$baseString = $method . '&' . rawurlencode("https://$host$path") . '&' . rawurlencode($paramStr);

// Sign: sha256(baseString) then RSA PKCS1v15
$baseHash = hash('sha256', $baseString, true);
openssl_sign($baseHash, $rawSig, $PRIVATE_KEY, OPENSSL_ALGO_SHA256);
// Note: openssl_sign with OPENSSL_ALGO_SHA256 hashes internally; use raw sign instead:
openssl_private_encrypt($baseHash, $rawSig, $PRIVATE_KEY); // PKCS1v15 raw
$signature = base64_encode($rawSig);

$oauthParams['oauth_signature'] = $signature;
$authParts = array_map(fn($k, $v) => "$k=\\"$v\\"", array_keys($oauthParams), $oauthParams);
$authHeader = 'OAuth ' . implode(', ', $authParts);

$ch = curl_init("https://$host$path");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        "Authorization: $authHeader",
    ],
]);

echo curl_exec($ch);
curl_close($ch);`;
  }
}

export default function CodeSnippetDialog({ open, onClose, apiKey }: Props) {
  const [lang, setLang] = useState<Language>('nodejs');
  const [secret, setSecret] = useState('');

  if (!apiKey) return null;

  const snippet = apiKey.authType === 'hmac'
    ? getHmacSnippet(lang, apiKey.keyId, secret || 'YOUR_SECRET_KEY')
    : getRsaSnippet(lang, apiKey.keyId);

  const copyToClipboard = () => navigator.clipboard.writeText(snippet);

  const prismLang: Record<Language, string> = {
    nodejs: 'javascript',
    dotnet: 'csharp',
    java: 'java',
    go: 'go',
    php: 'php',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { height: '90vh', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6">Code Sample — {apiKey.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {apiKey.authType === 'hmac'
                ? 'Enter your HMAC secret to pre-fill the code.'
                : 'Replace the private key path with your RSA private key.'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}><Close /></IconButton>
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={lang}
              label="Language"
              onChange={(e) => setLang(e.target.value as Language)}
            >
              {LANGUAGES.map((l) => (
                <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {apiKey.authType === 'hmac' && (
            <TextField
              size="small"
              label="HMAC Secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Paste your secret key"
              sx={{ flex: 1 }}
              inputProps={{ style: { fontFamily: 'monospace' } }}
            />
          )}

          <Tooltip title="Copy code">
            <IconButton onClick={copyToClipboard} color="primary">
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', pt: 1 }}>
        <Highlight theme={themes.vsDark} code={snippet} language={prismLang[lang]} prism={Prism}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <Box
              component="pre"
              sx={{
                ...style,
                flex: 1,
                overflow: 'auto',
                m: 0,
                p: 2,
                borderRadius: 1,
                fontSize: '0.82rem',
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                lineHeight: 1.6,
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </Box>
          )}
        </Highlight>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<ContentCopy />} onClick={copyToClipboard}>
          Copy Code
        </Button>
      </DialogActions>
    </Dialog>
  );
}
