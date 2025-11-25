# APIVault CLI Guide

## Overview
APIVault CLI provides a secure, device-code based workflow to authenticate via your browser, choose a project/environment/folder, and inject secrets into any command. Secrets exist only in process memory and are never written to disk.

## Prerequisites
- Node.js 18 or newer (for the npm-based install)
- Access to an APIVault workspace
- Ability to reach `https://key-vault-new.onrender.com`

> No Node.js? Download the upcoming binary release or run the CLI in Docker (see *Alternative installation*).

## Installation
```bash
# Recommended (global npm package)
npm install -g @keyvault/cli

# Install a specific version
npm install -g @keyvault/cli@0.1.0
```

Alternative installation (coming soon):
- **Homebrew:** `brew install keyvault/cli/keyvault`
- **Tarball:** download from GitHub Releases and add the executable to your PATH
- **Docker:** `docker run --rm -it keyvault/cli` (set `KEYVAULT_API_URL` and mount config)

## Authenticate (Device Code Flow)
```bash
keyvault login
```
1. The CLI opens `https://key-vault-new.vercel.app/cli/auth` in your browser.
2. Sign in (email/password or Google) and approve the request.
3. The CLI writes an encrypted token to `~/.config/keyvault/config.yaml` (macOS/Linux) or `%APPDATA%\keyvault\config.yaml` (Windows).

Targeting another backend (self-hosted/staging)?
```bash
export KEYVAULT_API_URL=https://your-api.example.com
keyvault login
```

## Configure Project Defaults
```bash
keyvault setup
```
- Pick organization → project → environment → folder
- Selection is stored in `.keyvault.yaml` inside the current directory (do not commit this file)

## Inject Secrets into Commands
```bash
# Node.js
keyvault run -- npm start

# Python
keyvault run -- python app.py

# Docker
keyvault run -- docker compose up
```
Within the launched command, secrets appear as environment variables (`process.env.DATABASE_URL`, `os.environ['API_KEY']`, etc.).

### CI/CD Example (GitHub Actions)
```yaml
- name: Run tests
  run: keyvault run -- npm test
```

## Helpful Commands
- `keyvault whoami` – display the authenticated account and API base
- `keyvault tokens list` – list CLI tokens tied to your account (coming soon)
- `keyvault logout` – revoke the active CLI token on this device (planned)

## Configuration Files
| File | Purpose | Location |
| ---- | ------- | -------- |
| `~/.config/keyvault/config.yaml` | Encrypted CLI tokens per device | User home directory |
| `.keyvault.yaml` | Project defaults (project/env/folder) | Project root (local) |

## Security Best Practices
- Use a separate CLI login for each machine; revoke old tokens from **Access → CLI Tokens**
- Rotate CLI tokens every 90 days (UI or upcoming CLI command)
- Never commit `.keyvault.yaml` or any token values to version control
- Prefer short-lived tokens for CI pipelines; revoke after each rotation

## Troubleshooting
| Symptom | Fix |
| ------- | --- |
| `fetch failed` | Verify backend is reachable (`curl $KEYVAULT_API_URL/health`) and `KEYVAULT_API_URL` is correct |
| `Authorization expired` | Approve the browser request within 10 minutes; rerun `keyvault login` if needed |
| `Device code not found` | Code already used or expired; rerun `keyvault login` |
| `Invalid token` after approval | Ensure you are logged into the web app before clicking “Give Access” |
| `keyvault: command not found` | Install globally via npm, use the binary, or add the CLI to PATH |

## Alternative Installation (Docker)
```bash
docker run --rm -it \
  -e KEYVAULT_API_URL=https://key-vault-new.onrender.com \
  -v "$HOME/.config/keyvault:/root/.config/keyvault" \
  -v "$PWD/.keyvault.yaml:/workspace/.keyvault.yaml" \
  keyvault/cli keyvault run -- npm test
```

## Support
- Revoke/create CLI tokens in the UI under **Access → CLI Tokens**
- Check backend logs for detailed authentication errors
- Contact support with the output of `keyvault --version` and the timestamp of the issue
