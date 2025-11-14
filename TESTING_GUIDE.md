# APIVault Testing Guide

This guide will help you test API access, CLI access, and Vercel integration in your projects.

## Prerequisites

1. **Backend URL**: Your backend is hosted at `https://key-vault-new.onrender.com`
2. **Frontend URL**: Your frontend is hosted at `https://key-vault-new.vercel.app` (or your production URL)
3. **Account**: You have an account on APIVault

---

## 1. API Access Testing

### Step 1: Create a Personal Access Token (PAT)

1. Log in to your APIVault dashboard
2. Navigate to a project
3. Go to a folder (e.g., **Development → default**)
4. Click on the **Access** tab
5. Click **Generate service token**
6. Give it a name (e.g., "My Test Project Token")
7. Set scopes (Read, Write)
8. Optionally set expiration
9. Click **Generate service token**
10. **Copy the token immediately** - you'll only see it once!

**Note**: The token is automatically scoped to the current project, environment, and folder.

### Step 2: Add Secrets to Your Project

1. In your project, navigate to a folder (e.g., **Development → default**)
2. Create secrets:
   - `DATABASE_URL` = `postgresql://user:pass@localhost/db`
   - `API_KEY` = `sk_test_1234567890`
   - `JWT_SECRET` = `your-jwt-secret-key`

**Important**: Make sure the secrets are in the same folder where you created the token!

### Step 3: Test API Access

#### Using cURL

```bash
# Set your token
export VAULT_TOKEN="your-api-key-token-here"

# Get a secret (returns plain text)
curl -H "Authorization: Bearer $VAULT_TOKEN" \
  "https://key-vault-new.onrender.com/api/v1/DATABASE_URL"

# Get a secret with metadata (JSON format)
curl -H "Authorization: Bearer $VAULT_TOKEN" \
  "https://key-vault-new.onrender.com/api/v1/DATABASE_URL?format=json"
```

#### Using Node.js

Create a file `test-api.js`:

```javascript
const axios = require('axios');

const token = process.env.VAULT_TOKEN || 'your-api-key-token-here';
const apiUrl = 'https://key-vault-new.onrender.com/api/v1';

async function getSecret(name) {
  try {
    const response = await axios.get(`${apiUrl}/${name}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${name}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test fetching secrets
async function test() {
  try {
    const dbUrl = await getSecret('DATABASE_URL');
    const apiKey = await getSecret('API_KEY');
    const jwtSecret = await getSecret('JWT_SECRET');
    
    console.log('Database URL:', dbUrl);
    console.log('API Key:', apiKey);
    console.log('JWT Secret:', jwtSecret);
    
    // Use in your app
    process.env.DATABASE_URL = dbUrl;
    process.env.API_KEY = apiKey;
    process.env.JWT_SECRET = jwtSecret;
    
    console.log('\n✅ Secrets loaded successfully!');
  } catch (error) {
    console.error('❌ Failed to load secrets:', error.message);
    process.exit(1);
  }
}

test();
```

Run it:
```bash
export VAULT_TOKEN="your-api-key-token-here"
node test-api.js
```

#### Using Python

Create a file `test_api.py`:

```python
import os
import requests
import sys

token = os.getenv('VAULT_TOKEN', 'your-api-key-token-here')
api_url = 'https://key-vault-new.onrender.com/api/v1'

def get_secret(name: str) -> str:
    """Fetch a secret from the vault."""
    try:
        response = requests.get(
            f"{api_url}/{name}",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {name}: {e}", file=sys.stderr)
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}", file=sys.stderr)
        raise

# Test fetching secrets
def main():
    try:
        db_url = get_secret('DATABASE_URL')
        api_key = get_secret('API_KEY')
        jwt_secret = get_secret('JWT_SECRET')
        
        print(f"Database URL: {db_url}")
        print(f"API Key: {api_key}")
        print(f"JWT Secret: {jwt_secret}")
        
        # Use in your app
        os.environ['DATABASE_URL'] = db_url
        os.environ['API_KEY'] = api_key
        os.environ['JWT_SECRET'] = jwt_secret
        
        print("\n✅ Secrets loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load secrets: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

Run it:
```bash
export VAULT_TOKEN="your-api-key-token-here"
python test_api.py
```

#### Using Go

Create a file `test_api.go`:

```go
package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
    "os"
)

var (
    token  = os.Getenv("VAULT_TOKEN")
    apiURL = "https://key-vault-new.onrender.com/api/v1"
)

func getSecret(name string) (string, error) {
    req, err := http.NewRequest("GET", fmt.Sprintf("%s/%s", apiURL, name), nil)
    if err != nil {
        return "", err
    }
    
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := ioutil.ReadAll(resp.Body)
        return "", fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
    }
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    
    return string(body), nil
}

func main() {
    if token == "" {
        fmt.Fprintln(os.Stderr, "VAULT_TOKEN environment variable is required")
        os.Exit(1)
    }
    
    dbURL, err := getSecret("DATABASE_URL")
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error fetching DATABASE_URL: %v\n", err)
        os.Exit(1)
    }
    
    apiKey, err := getSecret("API_KEY")
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error fetching API_KEY: %v\n", err)
        os.Exit(1)
    }
    
    jwtSecret, err := getSecret("JWT_SECRET")
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error fetching JWT_SECRET: %v\n", err)
        os.Exit(1)
    }
    
    fmt.Printf("Database URL: %s\n", dbURL)
    fmt.Printf("API Key: %s\n", apiKey)
    fmt.Printf("JWT Secret: %s\n", jwtSecret)
    
    // Use in your app
    os.Setenv("DATABASE_URL", dbURL)
    os.Setenv("API_KEY", apiKey)
    os.Setenv("JWT_SECRET", jwtSecret)
    
    fmt.Println("\n✅ Secrets loaded successfully!")
}
```

Run it:
```bash
export VAULT_TOKEN="your-api-key-token-here"
go run test_api.go
```

### Step 4: Integrate into Your Application

#### For Node.js/Express

```javascript
// At application startup
const secrets = await loadSecrets();
process.env.DATABASE_URL = secrets.DATABASE_URL;
process.env.API_KEY = secrets.API_KEY;
// ... etc
```

#### For Python/Flask

```python
# At application startup
config = load_config()
app.config['DATABASE_URL'] = config['database_url']
app.config['API_KEY'] = config['api_key']
# ... etc
```

---

## 2. CLI Access Testing

### Step 1: Install the CLI

```bash
npm install -g @keyvault/cli
```

Or using npx (no installation):
```bash
npx @keyvault/cli --help
```

### Step 2: Authenticate

```bash
keyvault login
```

This will:
1. Open your browser
2. Prompt you to authorize the CLI
3. Store the token locally

### Step 3: Setup Your Project

```bash
keyvault setup
```

This will prompt you to:
1. Select an organization
2. Select a project
3. Select an environment (dev, staging, production)

This creates a `.keyvault.yaml` file in your current directory.

### Step 4: Test CLI Commands

```bash
# List all secrets (names only)
keyvault secrets list

# Get a specific secret
keyvault secrets get DATABASE_URL

# Run a command with secrets injected as environment variables
keyvault run -- npm start

# Run with a specific command
keyvault run -- node server.js
```

### Step 5: Use in Your Project

#### Option 1: Run Commands with Secrets

```bash
# Your app will have access to all secrets as environment variables
keyvault run -- npm start

# Or for Python
keyvault run -- python app.py

# Or for any command
keyvault run -- your-command-here
```

#### Option 2: Export Secrets to Environment

```bash
# Get all secrets and export them
eval $(keyvault secrets export)

# Now your shell has all the secrets
echo $DATABASE_URL
echo $API_KEY
```

#### Option 3: Use in CI/CD

```yaml
# GitHub Actions example
- name: Install KeyVault CLI
  run: npm install -g @keyvault/cli

- name: Setup KeyVault
  run: |
    keyvault login --token ${{ secrets.KEYVAULT_CLI_TOKEN }}
    keyvault setup --project my-project --env production

- name: Run tests with secrets
  run: keyvault run -- npm test
```

### Step 6: Test CLI Token Creation (Alternative)

If you prefer to use a token directly:

1. Go to your APIVault dashboard
2. Navigate to **API** section
3. Click **Create CLI Token**
4. Copy the token
5. Use it:

```bash
# Set the token
export KEYVAULT_TOKEN="your-cli-token-here"

# Use the CLI
keyvault secrets get DATABASE_URL
```

---

## 3. Vercel Integration Testing

### Step 1: Connect Vercel to APIVault

1. Log in to your APIVault dashboard
2. Navigate to your organization
3. Go to **Settings** → **Integrations** → **Vercel**
4. Click **Connect Vercel**
5. Authorize APIVault to access your Vercel account
6. Select a Vercel team (if applicable)

### Step 2: Prepare Your Secrets

1. In your APIVault project, create a folder (e.g., "vercel-secrets")
2. Add secrets to that folder:
   - `DATABASE_URL`
   - `API_KEY`
   - `STRIPE_KEY`
   - etc.

### Step 3: Sync Secrets to Vercel

1. In your APIVault dashboard, go to your project
2. Select the environment (production, preview, development)
3. Select the folder you created
4. Click **Sync to Vercel**
5. Select your Vercel project
6. Select the Vercel environment target (Production, Preview, or Development)
7. Click **Sync**

### Step 4: Verify in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify that your secrets are synced:
   - `DATABASE_URL` = (synced from APIVault)
   - `API_KEY` = (synced from APIVault)
   - etc.

### Step 5: Test in Your Vercel Deployment

1. Deploy your application to Vercel
2. Your application should automatically have access to the synced environment variables
3. Test that your app works with the synced secrets

### Step 6: Auto-Sync on Secret Changes

1. After syncing once, future secret updates can be synced manually
2. Go to your project → folder → **Sync to Vercel** again
3. Or use the API to trigger syncs automatically

### Step 7: Test with API (Advanced)

```bash
# Get your API token from APIVault
export VAULT_TOKEN="your-api-token"

# Sync secrets to Vercel via API
curl -X POST "https://key-vault-new.onrender.com/api/vercel/sync" \
  -H "Authorization: Bearer $VAULT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "environment": "production",
    "folder": "vercel-secrets",
    "vercelProjectId": "your-vercel-project-id",
    "vercelEnvTarget": "production"
  }'
```

---

## 4. Testing Checklist

### API Access
- [ ] Created API key in dashboard
- [ ] Copied and stored API key securely
- [ ] Tested fetching secrets with cURL
- [ ] Tested fetching secrets with Node.js/Python/Go
- [ ] Integrated API access into your application
- [ ] Verified secrets are loaded correctly in your app

### CLI Access
- [ ] Installed CLI (`npm install -g @keyvault/cli`)
- [ ] Authenticated CLI (`keyvault login`)
- [ ] Setup project (`keyvault setup`)
- [ ] Tested listing secrets
- [ ] Tested getting individual secrets
- [ ] Tested running commands with secrets (`keyvault run --`)
- [ ] Verified secrets are available as environment variables

### Vercel Integration
- [ ] Connected Vercel account to APIVault
- [ ] Created a folder with secrets
- [ ] Synced secrets to Vercel project
- [ ] Verified secrets in Vercel dashboard
- [ ] Deployed application to Vercel
- [ ] Verified application works with synced secrets
- [ ] Tested updating secrets and re-syncing

---

## 5. Troubleshooting

### API Access Issues

**Error: 401 Unauthorized**
- Check that your API token is correct
- Verify the token hasn't expired
- Ensure you're using `Bearer` authentication

**Error: 404 Not Found**
- Verify the secret name is correct
- Check that the secret exists in the project
- Ensure the API key has access to the project

**Error: Network Error**
- Check that the backend URL is correct: `https://key-vault-new.onrender.com`
- Verify your network connection
- Check firewall settings

### CLI Access Issues

**Error: "Not authenticated"**
- Run `keyvault login` again
- Check that the token is stored in `~/.keyvault/config.yaml`

**Error: "Project not found"**
- Run `keyvault setup` again
- Verify the project exists in your dashboard
- Check the `.keyvault.yaml` file in your project directory

**Error: "Cannot connect to backend"**
- Check that `KEYVAULT_API_URL` is set correctly
- Default is `https://key-vault-new.onrender.com`
- Verify the backend is running: `curl https://key-vault-new.onrender.com/health`

### Vercel Integration Issues

**Error: "Vercel not connected"**
- Go to dashboard → Settings → Integrations → Vercel
- Click "Connect Vercel" and authorize again

**Error: "Project not found"**
- Verify the Vercel project ID is correct
- Check that you have access to the Vercel project
- Ensure the Vercel team is selected correctly

**Secrets not syncing**
- Check that the folder exists and has secrets
- Verify the environment is correct
- Check Vercel API limits and rate limits

---

## 6. Environment Variables Reference

### For API Access
- `VAULT_TOKEN` - Your API key token
- `VAULT_API_URL` - API base URL (default: `https://key-vault-new.onrender.com/api/v1`)

### For CLI Access
- `KEYVAULT_TOKEN` - Your CLI token (optional, if using token auth)
- `KEYVAULT_API_URL` - Backend URL (default: `https://key-vault-new.onrender.com`)

### For Vercel Integration
- Vercel environment variables are automatically synced
- No additional environment variables needed

---

## 7. Security Best Practices

1. **Never commit tokens to git**
   - Use environment variables
   - Use `.env` files (and add them to `.gitignore`)
   - Use secret management in CI/CD

2. **Rotate tokens regularly**
   - Delete old API keys
   - Create new CLI tokens periodically
   - Revoke access when no longer needed

3. **Use environment-specific tokens**
   - Create separate API keys for dev/staging/production
   - Use different CLI tokens for different projects
   - Limit token scope to necessary projects only

4. **Monitor usage**
   - Check audit logs in dashboard
   - Monitor API usage
   - Review token access regularly

---

## 8. Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the audit logs in your dashboard
3. Check the browser console for errors
4. Contact support: contact@apivault.it.com

---

## Quick Reference

### API Endpoints
- Base URL: `https://key-vault-new.onrender.com/api/v1`
- Get Secret: `GET /{secretName}`
- Auth Header: `Authorization: Bearer {token}`

### CLI Commands
- `keyvault login` - Authenticate
- `keyvault setup` - Setup project
- `keyvault secrets list` - List secrets
- `keyvault secrets get {name}` - Get secret
- `keyvault run -- {command}` - Run command with secrets

### Vercel Integration
- Connect: Dashboard → Settings → Integrations → Vercel
- Sync: Project → Folder → Sync to Vercel
- Verify: Vercel Dashboard → Settings → Environment Variables

