# GitHub OAuth Setup for Private Repository Scanning

## Overview

The secret scanner now supports scanning **private GitHub repositories** by authenticating users via GitHub OAuth.

## Setup Instructions

### 1. Create GitHub OAuth App

**Step-by-Step Instructions:**

1. **Go to GitHub Developer Settings**
   - Visit: https://github.com/settings/developers
   - Or: GitHub → Your Profile (top right) → Settings → Developer settings (left sidebar)

2. **Click "OAuth Apps"** (in the left sidebar)

3. **Click "New OAuth App"** button (top right)

4. **Fill in the Application Details:**
   
   **Application name**: 
   ```
   APIVault Secret Scanner
   ```
   (or any name you prefer)
   
   **Homepage URL**: 
   ```
   https://scan.apivault.it.com
   ```
   (or `http://localhost:3000` for local development)
   
   **Application description** (optional):
   ```
   Secret scanner tool for detecting leaked API keys and credentials
   ```
   
   **Authorization callback URL**: 
   ```
   https://scan.apivault.it.com/api/auth/github/callback
   ```
   (or `http://localhost:3000/api/auth/github/callback` for local development)
   
   **Important**: The callback URL must match **exactly** what you set in your environment variables!

5. **Click "Register application"**

6. **Get Your Credentials:**
   - **Client ID**: You'll see this immediately on the next page (looks like: `Iv1.8a61f9b3a7aba766`)
   - **Client Secret**: Click **"Generate a new client secret"** button
   - **Copy the secret immediately** - you can only see it once! (It looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`)

7. **Save Your Credentials:**
   - Copy both the **Client ID** and **Client Secret**
   - Store them securely (you'll need them for environment variables)

### 2. Configure Environment Variables

Add these to your `.env.local` file (or deployment environment):

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
NEXT_PUBLIC_GITHUB_CALLBACK_URL=https://scan.apivault.it.com/api/auth/github/callback
```

**Important Notes:**
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - Must be prefixed with `NEXT_PUBLIC_` to be available in the browser
- `GITHUB_CLIENT_SECRET` - Server-side only, never exposed to client
- `NEXT_PUBLIC_GITHUB_CALLBACK_URL` - Must match exactly what you set in GitHub OAuth app

### 3. For Local Development

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

**Note**: For local development, you may need to add `http://localhost:3000/api/auth/github/callback` as a callback URL in your GitHub OAuth app settings.

## How It Works

### User Flow

1. User enters a GitHub repository URL
2. Scanner checks if the repository is private
3. If private:
   - Shows warning: "Private repository detected"
   - Prompts user to "Connect GitHub Account"
   - User clicks button → redirected to GitHub OAuth
   - User authorizes the app
   - User is redirected back with access token
   - Token is stored in `sessionStorage`
   - Scanner can now access private repository
4. If public:
   - No authentication needed
   - Scanner proceeds directly

### Security

- **Access tokens** are stored in browser `sessionStorage` (cleared when browser closes)
- **Tokens are never** sent to any server except GitHub API
- **OAuth scope**: `repo` (read-only access to repositories)
- **Rate limiting**: Still applies (10 scans/hour per IP)

## Testing

### Test with Public Repo
1. Enter any public GitHub repository
2. Should work without authentication

### Test with Private Repo
1. Enter your own private repository
2. Should prompt for GitHub authentication
3. After connecting, should be able to scan

## Troubleshooting

### "Failed to initiate GitHub authentication"
- Check that `NEXT_PUBLIC_GITHUB_CLIENT_ID` is set
- Verify the callback URL matches exactly in GitHub OAuth app

### "Repository not found" for private repo
- Make sure you've connected your GitHub account
- Verify the token is stored in sessionStorage (check browser DevTools)
- Try disconnecting and reconnecting

### "Access denied" error
- The OAuth app may not have access to the repository
- Make sure you authorized the correct permissions
- Try revoking access in GitHub settings and re-authorizing

## OAuth Scopes

The scanner requests the `repo` scope, which grants:
- Read access to public and private repositories
- Read access to repository contents
- Read access to repository metadata

**Note**: Users can choose to grant access to all repositories or only specific ones during OAuth authorization.

## Production Deployment

1. **Update GitHub OAuth App**:
   - Set production callback URL: `https://scan.apivault.it.com/api/auth/github/callback`
   - Update homepage URL if needed

2. **Set Environment Variables** in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Render: Environment → Environment Variables

3. **Test**:
   - Try scanning a private repository
   - Verify OAuth flow works end-to-end

---

**Status**: ✅ Ready for production use!

