# APIVault Testing Summary

Quick reference for testing API access, CLI access, and Vercel integration.

## Backend Information
- **Backend URL**: `https://key-vault-new.onrender.com`
- **API Base URL**: `https://key-vault-new.onrender.com/api/v1`
- **Frontend URL**: `https://key-vault-new.vercel.app`

---

## 1. API Access Testing

### Create Token
1. Login to dashboard
2. Go to **Project → Folder** (e.g., Development → default)
3. Click **Access** tab
4. Click **Generate service token**
5. **Copy token** (shown only once!)

### Test with cURL
```bash
export VAULT_TOKEN="your-token-here"

# Get secret (plain text)
curl -H "Authorization: Bearer $VAULT_TOKEN" \
  "https://key-vault-new.onrender.com/api/v1/DATABASE_URL"

# Get secret with metadata (JSON)
curl -H "Authorization: Bearer $VAULT_TOKEN" \
  "https://key-vault-new.onrender.com/api/v1/DATABASE_URL?format=json"
```

### Test with Node.js
```bash
# Install dependencies
npm install axios

# Run test script
export VAULT_TOKEN="your-token-here"
node examples/test-api.js
```

### Use in Your App
```javascript
const axios = require('axios');
const token = process.env.VAULT_TOKEN;
const apiUrl = 'https://key-vault-new.onrender.com/api/v1';

async function getSecret(name) {
  const response = await axios.get(`${apiUrl}/${name}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

// Load secrets at startup
const dbUrl = await getSecret('DATABASE_URL');
process.env.DATABASE_URL = dbUrl;
```

---

## 2. CLI Access Testing

### Install CLI
```bash
npm install -g @keyvault/cli
```

### Login
```bash
keyvault login
```
Opens browser for authorization.

### Setup Project
```bash
cd /path/to/your/project
keyvault setup
```
Select: Organization → Project → Environment

### Test CLI
```bash
# List secrets
keyvault secrets list

# Get secret
keyvault secrets get DATABASE_URL

# Run command with secrets
keyvault run -- npm start
```

### Use in Your Project
```bash
# Run your app with secrets injected
keyvault run -- node server.js
keyvault run -- python app.py
keyvault run -- your-command-here
```

All secrets are available as environment variables in your command.

---

## 3. Vercel Integration Testing

### Connect Vercel
1. Login to dashboard
2. Go to **Settings** → **Integrations** → **Vercel**
3. Click **Connect Vercel**
4. Authorize APIVault

### Sync Secrets
1. Go to **Project → Folder**
2. Click **Sync to Vercel**
3. Select Vercel project
4. Select environment (Production/Preview/Development)
5. Click **Sync**

### Verify
1. Go to Vercel dashboard
2. **Settings** → **Environment Variables**
3. Verify secrets are synced

### Deploy
Deploy your app. It will have access to synced environment variables.

---

## 4. Test Scripts

### Test API (Node.js)
```bash
export VAULT_TOKEN="your-token"
node examples/test-api.js
```

### Test API (Python)
```bash
export VAULT_TOKEN="your-token"
python examples/test-api.py
```

### Test CLI
```bash
chmod +x examples/test-cli.sh
./examples/test-cli.sh
```

---

## 5. Common Issues

### API Access
- **401 Unauthorized**: Check token is correct
- **404 Not Found**: Check secret name and folder
- **403 Forbidden**: Check token scope matches folder

### CLI Access
- **Not authenticated**: Run `keyvault login`
- **Project not found**: Run `keyvault setup`
- **Cannot connect**: Check backend URL

### Vercel Integration
- **Not connected**: Reconnect in dashboard
- **Secrets not syncing**: Check folder and environment
- **Project not found**: Verify Vercel project ID

---

## 6. Quick Reference

### API Endpoint
- **URL**: `https://key-vault-new.onrender.com/api/v1/{secretName}`
- **Method**: `GET`
- **Header**: `Authorization: Bearer {token}`
- **Response**: Plain text (or JSON with `?format=json`)

### CLI Commands
- `keyvault login` - Authenticate
- `keyvault setup` - Setup project
- `keyvault secrets list` - List secrets
- `keyvault secrets get {name}` - Get secret
- `keyvault run -- {command}` - Run with secrets

### Vercel Integration
- Connect: Dashboard → Settings → Integrations → Vercel
- Sync: Project → Folder → Sync to Vercel
- Verify: Vercel Dashboard → Settings → Environment Variables

---

For detailed documentation, see `TESTING_GUIDE.md`

