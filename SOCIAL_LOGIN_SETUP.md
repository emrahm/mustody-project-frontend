# Social Login Setup Instructions (Unified Service)

## Backend Configuration

### 1. Environment Variables (.env)

Add these variables to your backend `.env` file:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OAuth Redirect URLs
GOOGLE_REDIRECT_URL_DEV=http://localhost:3000/auth/callback?provider=google
GOOGLE_REDIRECT_URL_PROD=https://yourdomain.com/auth/callback?provider=google

# Future: GitHub OAuth (when needed)
# GITHUB_CLIENT_ID=your_github_client_id_here
# GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### 2. Required Go Dependencies

Add these to your `go.mod` (if not already present):

```bash
go get golang.org/x/oauth2
go get golang.org/x/oauth2/google
```

### 3. Server Routes (Already Added)

The unified social login routes are:

```go
// Unified social login routes
authGroup.GET("/social/url", authController.SocialAuthURL)
authGroup.GET("/social/callback", authController.SocialCallback)
```

### 4. Controller Initialization (Already Updated)

The auth controller now uses the unified social login service:

```go
socialLoginService := services.NewSocialLoginService()
authController := controllers.NewAuthController(authService, jwtManager, socialLoginService)
```

## Frontend Configuration

### 1. Environment Variables (.env)

**Development:**
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
VITE_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Production (.env.production):**
```bash
VITE_GOOGLE_CLIENT_ID=your_prod_google_client_id_here.apps.googleusercontent.com
VITE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

## New Unified API Endpoints

### 1. Get OAuth URL
```
GET /auth/social/url?provider=google
Response: { "auth_url": "...", "state": "..." }
```

### 2. Handle OAuth Callback
```
GET /auth/social/callback?provider=google&code=...&state=...
Response: { "token": "...", "user": {...}, "expires_in": 3600 }
```

### 3. Direct Social Login (Enhanced)
```
POST /auth/login/social
Body: { "provider": "google", "provider_id": "...", "email": "...", "name": "...", "avatar_url": "..." }
```

## Google Cloud Console Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/callback?provider=google`
   - Production: `https://yourdomain.com/auth/callback?provider=google`
5. Save and copy the Client ID and Client Secret

### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" for public apps
3. Fill in required fields:
   - App name: "Mustody Platform"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users if in development mode

## Adding GitHub (Future)

When you want to add GitHub login:

### 1. Backend Changes
1. Add GitHub OAuth config to `SocialLoginService`
2. Add GitHub case to switch statements in `GetAuthURL` and `ExchangeCodeForUserInfo`
3. No route changes needed!

### 2. Frontend Changes
1. Call `socialLoginService.initiateLogin('github')`
2. Add GitHub button to login page

### 3. Environment Variables
```bash
# Backend
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Frontend
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

## Development vs Production Configuration

### Development Setup
- Use `http://localhost:3000/auth/callback` as redirect URI
- Use development Google Client ID
- Backend uses `GOOGLE_REDIRECT_URL_DEV`

### Production Setup
- Use `https://yourdomain.com/auth/callback` as redirect URI
- Use production Google Client ID (can be same as dev)
- Backend uses `GOOGLE_REDIRECT_URL_PROD`
- Ensure HTTPS is enabled

## Testing

### 1. Start Backend
```bash
cd ../mustody-project-backend
go run main.go
```

### 2. Start Frontend
```bash
cd mustody-project-frontend
npm run dev
```

### 3. Test Google Login
1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Should redirect to dashboard with user logged in

## Benefits of Unified Service

1. **Extensible**: Easy to add new providers (GitHub, Facebook, etc.)
2. **Consistent**: Single API pattern for all social providers
3. **Maintainable**: One service manages all social authentication
4. **Future-ready**: Adding new providers requires minimal changes

## Security Notes

1. **Never commit secrets**: Keep `.env` files in `.gitignore`
2. **Use HTTPS in production**: OAuth requires HTTPS for production
3. **Validate state parameter**: Backend validates CSRF state token
4. **Secure cookies**: OAuth state stored in HTTP-only cookies
5. **Token expiration**: JWT tokens have configurable expiration

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: Check Google Console redirect URIs match exactly
2. **"invalid_client"**: Verify Client ID and Secret are correct
3. **CORS errors**: Ensure backend ALLOWED_ORIGINS includes frontend URL
4. **State mismatch**: Clear browser cookies and try again
5. **"unsupported provider"**: Ensure provider parameter is correct (google/github)

### Debug Steps:

1. Check browser network tab for failed requests
2. Check backend logs for OAuth errors
3. Verify environment variables are loaded correctly
4. Test with Google OAuth Playground for API issues
5. Verify provider parameter in URL matches backend expectations
