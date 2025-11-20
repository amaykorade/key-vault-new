# Secret Scanner - APIVault Marketing Tool

A free Next.js tool to scan GitHub repositories for leaked secrets, API keys, and credentials. Built as a marketing tool to drive signups to APIVault.

## 🎯 Purpose

- **Lead Generation**: Users find leaks → need secure storage → sign up for APIVault
- **SEO**: Rank for "check for leaked API keys" searches
- **Viral Sharing**: Users share scan results
- **Trust Building**: Demonstrates security expertise

## 🚀 Features

- **GitHub Repository Scanning**: Scan public repos (no login required) or private repos (with GitHub OAuth)
- **25+ Secret Patterns**: Detects AWS keys, Stripe tokens, database URLs, JWT secrets, SSH keys, Slack, Twilio, SendGrid, and more
- **Private Repository Support**: Connect your GitHub account to scan private repositories
- **Detailed Results**: Shows file paths, line numbers, and code context
- **Severity Levels**: High, medium, and low severity classifications
- **Privacy First**: Never stores actual secrets, only metadata
- **Rate Limiting**: IP-based rate limiting (10 scans/hour)

## 📁 Project Structure

```
secret-scanner/
├── app/
│   ├── api/
│   │   └── scan/
│   │       └── route.ts          # API endpoint for scanning
│   ├── results/
│   │   └── page.tsx              # Results display page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── lib/
│   ├── patterns.ts               # Secret detection patterns
│   └── github.ts                 # GitHub API integration
└── package.json
```

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   NEXT_PUBLIC_APIVAULT_URL=https://www.apivault.it.com
   
   # GitHub OAuth (for private repo scanning - optional)
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXT_PUBLIC_GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
   ```
   
   See [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md) for detailed setup instructions.

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 🔍 How It Works

1. User enters GitHub repo URL on landing page
2. Scanner automatically detects if repository is private
3. If private: User connects GitHub account via OAuth (one-time)
4. Frontend calls `/api/scan` endpoint with access token (if private)
5. Backend uses GitHub API to fetch repository files
6. Each file is scanned using regex patterns
7. Results are returned with findings, severity, and context
8. Results page displays findings with CTA to APIVault

## 🎨 Secret Detection Patterns (25+ Patterns)

The scanner detects:
- **AWS**: Access Key IDs, Secret Access Keys
- **Stripe**: Live secret keys, publishable keys
- **Database URLs**: PostgreSQL, MongoDB, MySQL connection strings
- **OAuth Tokens**: GitHub tokens, Google API keys, Firebase
- **JWT Secrets**: Signing secrets
- **SSH Keys**: Private key files
- **Slack**: Webhook URLs, Bot tokens
- **Twilio**: API keys, Auth tokens
- **SendGrid**: API keys
- **Heroku**: API keys
- **Mailgun**: API keys
- **Square**: Access tokens, OAuth secrets
- **PayPal**: Client IDs
- **Generic**: API keys, passwords, secrets, bearer tokens

## 🔒 Security & Privacy

- **No Secret Storage**: Only metadata (file paths, line numbers) is stored
- **Rate Limiting**: IP-based rate limiting (10 scans/hour per IP)
- **Request Timeout**: 30-second timeout to prevent long-running scans
- **Input Validation**: Validates repository names and URLs
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Minimal Permissions**: GitHub OAuth uses minimal scopes (when implemented)

## 📊 Deployment

### Subdomain Setup
Deploy to: `scan.apivault.it.com` or `leak-checker.apivault.it.com`

### Vercel Deployment
1. Connect GitHub repository
2. Set environment variables
3. Deploy to subdomain

### Render Deployment
1. Create new static site
2. Point to `secret-scanner/` directory
3. Configure subdomain

## 🚧 Future Enhancements

- [ ] Private repo scanning with GitHub OAuth
- [ ] Scan history with user accounts
- [ ] Email notifications for new leaks
- [ ] Batch scanning (multiple repos)
- [ ] GitLab/Bitbucket support
- [ ] CI/CD integration warnings
- [ ] Database storage for scan results
- [ ] Advanced rate limiting with Redis

## 📝 License

Part of the APIVault project.
