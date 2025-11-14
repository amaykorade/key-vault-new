# APIVault Test Scripts

This directory contains test scripts to help you test APIVault features in your projects.

## Files

- `test-api.js` - Node.js script to test API access
- `test-api.py` - Python script to test API access
- `test-cli.sh` - Bash script to test CLI access

---

## API Access Testing

### Node.js

1. Install dependencies:
   ```bash
   npm install axios
   ```

2. Set your token:
   ```bash
   export VAULT_TOKEN="your-personal-access-token-here"
   ```

3. Run the test:
   ```bash
   node test-api.js
   ```

### Python

1. Install dependencies:
   ```bash
   pip install requests
   ```

2. Set your token:
   ```bash
   export VAULT_TOKEN="your-personal-access-token-here"
   ```

3. Run the test:
   ```bash
   python test-api.py
   ```

### Customizing

Edit the `secretsToTest` array in the script to test your own secrets:
```javascript
const secretsToTest = [
  'DATABASE_URL',
  'API_KEY',
  'JWT_SECRET',
  // Add your secrets here
];
```

---

## CLI Access Testing

1. Make the script executable:
   ```bash
   chmod +x test-cli.sh
   ```

2. Run the test:
   ```bash
   ./test-cli.sh
   ```

**Prerequisites:**
- CLI must be installed: `npm install -g @keyvault/cli`
- You must be logged in: `keyvault login`
- Project must be setup: `keyvault setup`

---

## Getting Your Token

### Personal Access Token (PAT)

1. Login to your APIVault dashboard
2. Go to a project → Select a folder (e.g., Development → default)
3. Click on the **Access** tab
4. Click **Generate service token**
5. Give it a name and set scopes
6. Click **Generate service token**
7. **Copy the token** (shown only once!)

**Note**: The token is automatically scoped to the current project, environment, and folder.

---

## Troubleshooting

### API Access Issues

**Error: 401 Unauthorized**
- Check that your token is correct
- Verify the token hasn't expired
- Ensure you're using `Bearer` authentication

**Error: 404 Not Found**
- Verify the secret name is correct
- Check that the secret exists in the folder
- Ensure the token has access to the project/environment/folder

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

---

## Next Steps

1. Test API access with the test scripts
2. Integrate API access into your application
3. Test CLI access in your project
4. Connect Vercel and sync secrets
5. Deploy your application with secrets from APIVault

---

For detailed documentation, see `../TESTING_GUIDE.md`

