# Quick Testing Guide for APIVault

This is a quick reference guide for testing APIVault features in your project.

## Backend URLs
- **Backend API**: `https://key-vault-new.onrender.com`
- **Frontend**: `https://key-vault-new.vercel.app` (or your production URL)

---

## 1. API Access - Quick Start

### Step 1: Get API Token
1. Login to dashboard: `https://key-vault-new.vercel.app`
2. Go to a project → Select a folder (e.g., **Development → default**)
3. Click on the **Access** tab
4. Click **Generate service token**
5. Give it a name and set scopes
6. Click **Generate service token**
7. **Copy the token** (shown only once!)

**Note**: Token is automatically scoped to the current project, environment, and folder.

### Step 2: Test with cURL

```bash
# Set your token
export VAULT_TOKEN="your-api-key-token-here"

# Test fetching a secret
curl -H "Authorization: Bearer $VAULT_TOKEN" \
  "https://key-vault-new.onrender.com/api/v1/DATABASE_URL"
```

### Step 3: Test with Node.js

```bash
# Install dependencies
npm install axios

# Run test script
export VAULT_TOKEN="your-api-key-token-here"
node examples/test-api.js
```

### Step 4: Use in Your App

```javascript
// Load secrets at startup
const axios = require('axios');
const token = process.env.VAULT_TOKEN;
const apiUrl = 'https://key-vault-new.onrender.com/api/v1';

async function loadSecrets() {
  const dbUrl = await axios.get(`${apiUrl}/DATABASE_URL`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  process.env.DATABASE_URL = dbUrl.data;
  // ... load other secrets
}

loadSecrets().then(() => {
  // Start your app
  require('./server.js');
});
```

---

## 2. CLI Access - Quick Start

### Step 1: Install CLI

```bash
npm install -g @keyvault/cli
```

### Step 2: Login

```bash
keyvault login
```

This opens your browser to authorize the CLI.

### Step 3: Setup Project

```bash
cd /path/to/your/project
keyvault setup
```

Select:
- Organization
- Project
- Environment (dev/staging/production)

### Step 4: Test CLI

```bash
# List secrets
keyvault secrets list

# Get a secret
keyvault secrets get DATABASE_URL

# Run your app with secrets
keyvault run -- npm start
```

### Step 5: Use in Your Project

```bash
# Run any command with secrets injected
keyvault run -- node server.js
keyvault run -- python app.py
keyvault run -- your-command-here
```

Your app will have access to all secrets as environment variables:
- `DATABASE_URL`
- `API_KEY`
- `JWT_SECRET`
- etc.

---

## 3. Vercel Integration - Quick Start

### Step 1: Connect Vercel

1. Login to dashboard
2. Go to **Settings** → **Integrations** → **Vercel**
3. Click **Connect Vercel**
4. Authorize APIVault to access your Vercel account

### Step 2: Prepare Secrets

1. In your project, create a folder (e.g., "vercel")
2. Add secrets to that folder:
   - `DATABASE_URL`
   - `API_KEY`
   - etc.

### Step 3: Sync to Vercel

1. Go to your project
2. Select environment (production/preview/development)
3. Select the folder
4. Click **Sync to Vercel**
5. Select your Vercel project
6. Select Vercel environment target
7. Click **Sync**

### Step 4: Verify

1. Go to Vercel dashboard
2. **Settings** → **Environment Variables**
3. Verify secrets are synced

### Step 5: Deploy

Deploy your app to Vercel. It will automatically have access to the synced environment variables.

---

## 4. Testing Checklist

### API Access
- [ ] Created Personal Access Token (PAT)
- [ ] Tested with cURL
- [ ] Tested with Node.js/Python
- [ ] Integrated into app
- [ ] Verified secrets are loaded

### CLI Access
- [ ] Installed CLI
- [ ] Logged in
- [ ] Setup project
- [ ] Tested listing secrets
- [ ] Tested getting secrets
- [ ] Tested running commands
- [ ] Verified secrets in environment

### Vercel Integration
- [ ] Connected Vercel
- [ ] Created folder with secrets
- [ ] Synced to Vercel
- [ ] Verified in Vercel dashboard
- [ ] Deployed app
- [ ] Verified app works with secrets

---

## 5. Example Test Scripts

### Test API Access (Node.js)

```bash
# Copy example script
cp examples/test-api.js test-api.js

# Edit the script to use your secret names
# Then run:
export VAULT_TOKEN="your-token"
node test-api.js
```

### Test CLI Access

```bash
# Copy example script
cp examples/test-cli.sh test-cli.sh
chmod +x test-cli.sh

# Run:
./test-cli.sh
```

### Test API Access (Python)

```bash
# Copy example script
cp examples/test-api.py test-api.py

# Install dependencies
pip install requests

# Run:
export VAULT_TOKEN="your-token"
python test-api.py
```

---

## 6. Common Issues

### API Access
- **401 Unauthorized**: Check token is correct
- **404 Not Found**: Check secret name and project
- **Network Error**: Check backend URL is correct

### CLI Access
- **Not authenticated**: Run `keyvault login`
- **Project not found**: Run `keyvault setup`
- **Cannot connect**: Check `KEYVAULT_API_URL` is set

### Vercel Integration
- **Not connected**: Reconnect in dashboard
- **Secrets not syncing**: Check folder and environment
- **Project not found**: Verify Vercel project ID

---

## 7. Environment Variables

### API Access
```bash
export VAULT_TOKEN="your-api-key-token"
export VAULT_API_URL="https://key-vault-new.onrender.com/api/v1"  # optional
```

### CLI Access
```bash
export KEYVAULT_TOKEN="your-cli-token"  # optional, if using token auth
export KEYVAULT_API_URL="https://key-vault-new.onrender.com"  # optional
```

---

## 8. Next Steps

1. **Test API Access**: Use the test scripts to verify API access works
2. **Test CLI Access**: Install CLI and test in your project
3. **Test Vercel Integration**: Connect Vercel and sync secrets
4. **Integrate**: Add API/CLI access to your application
5. **Deploy**: Deploy your app with secrets from APIVault

---

## Support

For detailed documentation, see `TESTING_GUIDE.md`

For issues, contact: contact@apivault.it.com

