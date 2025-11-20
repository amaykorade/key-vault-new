# Deploy Secret Scanner to Render - Complete Guide

## 🚀 Quick Start

Deploy the secret scanner to Render with custom subdomain: `scan.apivault.it.com`

## Prerequisites

- ✅ Render account (https://render.com)
- ✅ GitHub repository with `secret-scanner/` folder
- ✅ GitHub OAuth app credentials (see GITHUB_OAUTH_SETUP.md)

---

## Step 1: Build Locally (Already Done ✅)

The scanner has been built and tested:
```bash
cd secret-scanner
npm run build  # ✅ Already completed
```

---

## Step 2: Deploy to Render

### Manual Deployment (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +"** → **"Web Service"**

3. **Connect Repository**:
   - Select your GitHub repository
   - Branch: `main`

4. **Configure Service**:
   ```
   Name: secret-scanner
   Region: Oregon
   Branch: main
   Root Directory: secret-scanner  ⚠️ IMPORTANT!
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free (or Starter)
   ```

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXT_PUBLIC_GITHUB_CALLBACK_URL=https://scan.apivault.it.com/api/auth/github/callback
   NEXT_PUBLIC_APIVAULT_URL=https://www.apivault.it.com
   ```

6. **Click "Create Web Service"**

---

## Step 3: Configure Custom Subdomain

### 3.1 Add Custom Domain in Render

1. **Go to your service** in Render dashboard

2. **Navigate to "Settings"** → **"Custom Domains"**

3. **Click "Add Custom Domain"**

4. **Enter subdomain**:
   ```
   scan.apivault.it.com
   ```

5. **Copy the DNS instructions** shown by Render

### 3.2 Configure DNS

1. **Go to your domain registrar** (where `apivault.it.com` is registered)

2. **Add CNAME record**:
   - **Type**: `CNAME`
   - **Name**: `scan` (or your preferred subdomain prefix)
   - **Value**: `your-render-service.onrender.com` (from Render)
   - **TTL**: `3600` (or default)

3. **Save DNS changes**

4. **Wait 5-10 minutes** for DNS propagation

5. **Render will automatically provision SSL** certificate (HTTPS)

### 3.3 Verify Domain

- Render will show domain status in dashboard
- ✅ "Valid" = Domain is ready
- ⚠️ "Pending" = Still propagating (wait a few minutes)

---

## Step 4: Update GitHub OAuth App

1. **Go to GitHub OAuth Apps**: https://github.com/settings/developers/oauth_apps

2. **Click your OAuth app**

3. **Update Callback URL**:
   ```
   Authorization callback URL: https://scan.apivault.it.com/api/auth/github/callback
   ```

4. **Update Homepage URL**:
   ```
   Homepage URL: https://scan.apivault.it.com
   ```

5. **Click "Update application"**

6. **Update Render Environment Variable**:
   - Go to Render → Your service → Environment
   - Update `NEXT_PUBLIC_GITHUB_CALLBACK_URL`:
     ```
     https://scan.apivault.it.com/api/auth/github/callback
     ```
   - Save and redeploy

---

## Step 5: Verify Deployment

### 5.1 Test Public Repository Scanning

1. **Visit**: `https://scan.apivault.it.com`

2. **Enter a public GitHub repo**:
   ```
   facebook/react
   ```
   (or any public repo)

3. **Click "Scan Repository"**

4. **Should show results** (even if no secrets found)

### 5.2 Test GitHub OAuth (Private Repos)

1. **Click "Connect GitHub Account"** (if not connected)

2. **Authorize the app** on GitHub

3. **Should redirect back** with success message

4. **Try scanning a private repo** you have access to

5. **Should work** with your GitHub token

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `Ov23liSuOJeD0wzyPor7` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | `a1b2c3d4...` |
| `NEXT_PUBLIC_GITHUB_CALLBACK_URL` | OAuth callback URL | `https://scan.apivault.it.com/api/auth/github/callback` |
| `NEXT_PUBLIC_APIVAULT_URL` | APIVault main site | `https://www.apivault.it.com` |

### Setting Variables in Render

1. **Go to your service** in Render dashboard
2. **Click "Environment"** tab
3. **Add each variable**:
   - Key: `NEXT_PUBLIC_GITHUB_CLIENT_ID`
   - Value: `your_actual_client_id`
   - Click "Save Changes"
4. **Redeploy** after adding variables (Render will auto-redeploy)

---

## Important Notes

### Root Directory

⚠️ **CRITICAL**: Set root directory to `secret-scanner` in Render settings!

If you don't, Render will look for `package.json` in the repository root and fail.

### Build Command

```
npm install && npm run build
```

This:
1. Installs dependencies
2. Builds Next.js for production

### Start Command

```
npm start
```

Next.js will automatically use `$PORT` environment variable (10000 for Render).

### Port Configuration

Render uses port `10000` by default. Next.js will automatically use `$PORT` if set.

---

## Troubleshooting

### Build Fails

**Error**: "Cannot find package.json"
- **Fix**: Set root directory to `secret-scanner` in Render settings

**Error**: "TypeScript errors"
- **Fix**: Ensure all files are committed and pushed to GitHub
- **Check**: Build logs in Render dashboard

### Service Won't Start

**Error**: "Port already in use"
- **Fix**: Use `npm start` (not `npm run dev`)
- **Check**: PORT environment variable is set to `10000`

**Error**: "Module not found"
- **Fix**: Run `npm install` in build command
- **Check**: All dependencies are in `package.json`

### 404 Errors

**Issue**: Routes return 404
- **Fix**: Verify root directory is `secret-scanner`
- **Check**: Build completed successfully

### OAuth Not Working

**Issue**: "Bad request" or redirect errors
- **Fix**: Verify callback URL matches exactly in:
  1. GitHub OAuth app settings
  2. Render environment variables
  3. Must be `https://` (not `http://`)

**Issue**: "Client ID not configured"
- **Fix**: Add `NEXT_PUBLIC_GITHUB_CLIENT_ID` to Render environment
- **Note**: Must have `NEXT_PUBLIC_` prefix for client-side access

### Subdomain Not Working

**Issue**: Domain shows "Pending" or doesn't resolve
- **Fix**: Verify DNS CNAME record is set correctly
- **Wait**: DNS propagation can take 5-10 minutes
- **Check**: DNS in your domain registrar's control panel

**Issue**: SSL certificate not provisioning
- **Fix**: Render automatically provisions SSL (may take a few minutes)
- **Wait**: After domain validates, SSL will be issued

---

## Post-Deployment Checklist

- [ ] Service is running on Render
- [ ] Custom domain is configured and validated
- [ ] SSL certificate is active (HTTPS works)
- [ ] Landing page loads at subdomain
- [ ] Public repo scanning works
- [ ] GitHub OAuth works (connect account)
- [ ] Private repo scanning works
- [ ] Rate limiting works
- [ ] CTA links to APIVault correctly
- [ ] Mobile responsive
- [ ] Error handling works

---

## Subdomain Options

You can use any subdomain you prefer:

- `scan.apivault.it.com` (recommended)
- `secret-checker.apivault.it.com`
- `leak-scanner.apivault.it.com`
- `check-secrets.apivault.it.com`

Just update:
1. DNS CNAME record
2. Render custom domain
3. GitHub OAuth app callback URL
4. Render environment variables

---

## Cost

- **Free Tier**: $0/month
  - Slower cold starts
  - Auto-sleeps after inactivity
  - Limited resources

- **Starter Tier**: $7/month
  - Faster performance
  - Always on
  - Better for production

For a marketing tool, **Free tier** is usually sufficient.

---

## Next Steps

After deployment:

1. **Test thoroughly** (public + private repos)
2. **Monitor logs** in Render dashboard
3. **Check analytics** (if added)
4. **Share the tool** to drive signups!

---

**Your secret scanner will be live at**: `https://scan.apivault.it.com` 🚀

