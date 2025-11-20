# Deploy Secret Scanner to Render

## Overview

This guide will help you deploy the secret scanner to Render as a web service with a custom subdomain.

## Prerequisites

- Render account (sign up at https://render.com)
- GitHub repository with the secret-scanner code
- GitHub OAuth app credentials (see GITHUB_OAUTH_SETUP.md)

## Deployment Steps

### Step 1: Prepare Your Code

1. **Push your code to GitHub**:
   ```bash
   cd "/Users/amay/SAAS/Key Vault"
   git add secret-scanner/
   git commit -m "Add secret scanner Next.js app"
   git push
   ```

2. **Build locally to verify** (already done):
   ```bash
   cd secret-scanner
   npm run build
   ```

### Step 2: Create New Web Service on Render

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +"** → **"Web Service"**

3. **Connect Your Repository**:
   - Select your GitHub repository
   - Select branch: `main` (or your default branch)

4. **Configure Service**:
   - **Name**: `secret-scanner`
   - **Region**: `Oregon` (or your preferred region)
   - **Branch**: `main`
   - **Root Directory**: `secret-scanner` (important!)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or `Starter` for better performance)

5. **Set Environment Variables**:
   Click "Advanced" → "Add Environment Variable":
   
   **Required:**
   ```
   NODE_ENV=production
   PORT=10000
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXT_PUBLIC_GITHUB_CALLBACK_URL=https://scan.apivault.it.com/api/auth/github/callback
   NEXT_PUBLIC_APIVAULT_URL=https://www.apivault.it.com
   ```

6. **Click "Create Web Service"**

### Step 3: Configure Custom Subdomain

1. **After deployment, go to your service settings**

2. **Scroll to "Custom Domains"** section

3. **Click "Add Custom Domain"**

4. **Enter your subdomain**:
   ```
   scan.apivault.it.com
   ```
   (or your preferred subdomain like `secret-checker.apivault.it.com`)

5. **Follow Render's DNS instructions**:
   - Add a CNAME record in your DNS:
     - **Type**: CNAME
     - **Name**: `scan` (or your subdomain prefix)
     - **Value**: `your-render-service.onrender.com`
     - **TTL**: 3600 (or default)

6. **Wait for DNS propagation** (usually 5-10 minutes)

### Step 4: Update GitHub OAuth App

1. **Go to GitHub OAuth Apps**: https://github.com/settings/developers/oauth_apps

2. **Click on your OAuth app**

3. **Update Callback URL**:
   - **Authorization callback URL**: `https://scan.apivault.it.com/api/auth/github/callback`
   - (Replace with your actual subdomain)

4. **Update Homepage URL**:
   - **Homepage URL**: `https://scan.apivault.it.com`

5. **Click "Update application"**

6. **Update Environment Variable in Render**:
   - Go to Render dashboard → Your service → Environment
   - Update `NEXT_PUBLIC_GITHUB_CALLBACK_URL` to match your subdomain

### Step 5: Verify Deployment

1. **Visit your subdomain**: `https://scan.apivault.it.com`

2. **Test the scanner**:
   - Enter a public GitHub repo
   - Click "Scan Repository"
   - Should show results

3. **Test GitHub OAuth** (for private repos):
   - Try scanning a private repo
   - Should prompt for GitHub authentication
   - Connect account and scan

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `Ov23liSuOJeD0wzyPor7` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | `your_secret_here` |
| `NEXT_PUBLIC_GITHUB_CALLBACK_URL` | OAuth callback URL | `https://scan.apivault.it.com/api/auth/github/callback` |
| `NEXT_PUBLIC_APIVAULT_URL` | APIVault main site | `https://www.apivault.it.com` |

### Optional Variables

- None (all variables have defaults or are optional)

## Troubleshooting

### Build Fails

- **Check Node version**: Render uses Node 20 by default
- **Check build logs**: View in Render dashboard
- **Verify dependencies**: Ensure `package.json` is correct

### Service Won't Start

- **Check PORT**: Must be `10000` for Render (or use `$PORT` env var)
- **Check start command**: Should be `npm start`
- **Check logs**: View in Render dashboard

### 404 Errors

- **Verify root directory**: Must be `secret-scanner` (not root)
- **Check custom domain**: Ensure DNS is configured correctly
- **Check HTTPS**: Render requires HTTPS for custom domains

### OAuth Not Working

- **Verify callback URL**: Must match exactly in GitHub OAuth app
- **Check environment variables**: `NEXT_PUBLIC_GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` must be set
- **Check HTTPS**: OAuth requires HTTPS in production

### Subdomain Not Working

- **Check DNS**: Verify CNAME record is set correctly
- **Wait for propagation**: DNS changes can take 5-10 minutes
- **Check SSL**: Render automatically provisions SSL certificates

## Post-Deployment

After deployment:

1. ✅ Test public repo scanning
2. ✅ Test GitHub OAuth (private repos)
3. ✅ Test rate limiting
4. ✅ Verify CTA links to APIVault
5. ✅ Check error handling
6. ✅ Test on mobile devices

---

**Your secret scanner is now live at**: `https://scan.apivault.it.com` 🚀

