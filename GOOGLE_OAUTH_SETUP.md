# Google OAuth Setup Instructions

## Backend Configuration

### 1. Environment Variables (.env)

Add these variables to your backend `.env` file:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OAuth Redirect URLs
GOOGLE_REDIRECT_URL_DEV=http://localhost:3000/auth/callback
GOOGLE_REDIRECT_URL_PROD=https://yourdomain.com/auth/callback
```

### 2. Required Go Dependencies

Add these to your `go.mod` (if not already present):

```bash
go get golang.org/x/oauth2
go get golang.org/x/oauth2/google
```

### 3. Update Server Routes

Add these routes to your server setup (usually in `internal/server/server.go` or similar):

```go
// Add to your auth routes group
authGroup.GET("/google", authController.GoogleLogin)
authGroup.GET("/google/callback", authController.GoogleCallback)
```

### 4. Update Controller Initialization

Update your auth controller initialization to include the Google OAuth service:

```go
googleOAuthService := services.NewGoogleOAuthService()
authController := controllers.NewAuthController(authService, jwtManager, googleOAuthService)
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
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
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

## Security Notes

1. **Never commit secrets**: Keep `.env` files in `.gitignore`
2. **Use HTTPS in production**: Google OAuth requires HTTPS for production
3. **Validate state parameter**: Backend validates CSRF state token
4. **Secure cookies**: OAuth state stored in HTTP-only cookies
5. **Token expiration**: JWT tokens have configurable expiration

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: Check Google Console redirect URIs match exactly
2. **"invalid_client"**: Verify Client ID and Secret are correct
3. **CORS errors**: Ensure backend ALLOWED_ORIGINS includes frontend URL
4. **State mismatch**: Clear browser cookies and try again

### Debug Steps:

1. Check browser network tab for failed requests
2. Check backend logs for OAuth errors
3. Verify environment variables are loaded correctly
4. Test with Google OAuth Playground for API issues
