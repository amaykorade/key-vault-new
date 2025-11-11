# 🔐 Key Vault - Modern Secrets Management Platform

A comprehensive, enterprise-grade secrets management platform built with modern web technologies. Securely store, manage, and distribute secrets across your organization with fine-grained access control and comprehensive audit logging.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)

---

## ✨ Features

### 🔐 Core Security
- **AES-256 Encryption** - All secrets encrypted at rest
- **Fine-grained Access Control** - Folder-scoped personal access tokens
- **Comprehensive Audit Logging** - Track every action with full context
- **Reveal-on-demand** - Secrets are hidden by default, audit logged on reveal

### 🏢 Multi-tenancy
- **Organizations** - Isolated workspaces for different entities
- **Projects** - Organize secrets by application or service
- **Teams** - Collaborate with team members
- **Role-based Permissions** - Admin, Write, Read access levels

### 📁 Secret Organization
- **Environments** - Development, Staging, Production
- **Folders** - Organize secrets into logical groups
- **Inline Editing** - Edit secret name, value, and type directly
- **Multiple Secret Types** - String, Number, JSON, and more

### 🎫 Access Management
- **Personal Access Tokens** - API access with scoped permissions
- **Read/Write Permissions** - Granular token scopes
- **IP Allowlisting** - Restrict token usage by IP
- **Optional Expiration** - Time-limited tokens

### 🌐 REST API
- **Ultra-simple Endpoint** - `GET /api/v1/{secretName}`
- **Bearer Token Auth** - Secure API access
- **Auto-context Detection** - Token determines project/env/folder
- **Multi-format Response** - Plain text and JSON

### 📊 Audit & Compliance
- **Complete Audit Trail** - All actions logged with user, IP, timestamp
- **Filterable Logs** - By date, resource type, action
- **Detailed Metadata** - Environment, folder, secret context
- **Security Events** - Track sensitive operations

### 🔗 Integrations
- **Vercel** - Sync secrets to Vercel projects (coming soon)
- **Google OAuth** - Sign in with Google
- **Email Invitations** - Invite team members via email

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Automated Setup (Recommended)

```bash
# Run the setup script
./scripts/setup-local-dev.sh

# Start database
docker-compose up -d

# Run migrations
cd Backend && npx prisma migrate dev

# Start backend (Terminal 1)
cd Backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

Visit: http://localhost:5173

### Manual Setup

1. **Clone the repository**
   ```bash
git clone <your-repo-url>
cd Key\ Vault
   ```

2. **Setup Backend**
   ```bash
   cd Backend
cp env.example .env
# Edit .env with your configuration (or use setup script)
   npm install
npx prisma generate
npx prisma migrate dev
npm run dev
   ```

3. **Setup Frontend**
   ```bash
cd frontend
echo "VITE_API_URL=http://localhost:4000/api" > .env.local
   npm install
npm run dev
   ```

4. **Visit the app**
```
http://localhost:5173
```

### Quick Environment Switching

   ```bash
# Switch to local development
./scripts/switch-to-local.sh

# Switch to production API (for testing)
./scripts/switch-to-production.sh https://your-backend.onrender.com
```

---

### Install the CLI (Optional)

Once you have backend access, install the global CLI published to npm:

```bash
npm install -g @keyvault/cli

# Verify
keyvault --version
```

Follow the [CLI Guide](./CLI_GUIDE.md) or the in-app docs to authenticate with the device-code flow and inject secrets into any command.

---

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Passport.js (JWT + Google OAuth)
- **Encryption**: Node crypto (AES-256-GCM)
- **Validation**: Zod

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **HTTP Client**: Fetch API
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Hosting**: Render (Backend) + Vercel (Frontend)
- **Database**: Render PostgreSQL
- **Deployment**: Automatic on push to main

---

## 📖 Documentation

- **[CLI Guide](./CLI_GUIDE.md)** – Install, authenticate, and run the published CLI (`@keyvault/cli`)
- **[Backend Environment Setup](./Backend/ENV_SETUP.md)** – Backend variables & local configuration
- **[Frontend Environment Setup](./frontend/ENV_SETUP.md)** – Frontend variables & local configuration
- **API Docs in-app** – Visit the **Docs → API** tab for REST and CLI walkthroughs

---

## 🔧 Configuration

### Backend Environment Variables

```bash
# Essential
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/keyvault
JWT_ACCESS_SECRET=your_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_secret_here_min_32_chars
ENCRYPTION_KEY=your_key_here_min_32_chars

# CORS
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Optional
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
```

### Frontend Environment Variables

```bash
VITE_API_URL=http://localhost:4000/api
```

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete configuration guide.

---

## 🏗️ Project Structure

```
Key Vault/
├── Backend/                 # Express.js backend
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, audit, etc.
│   │   └── lib/            # Utilities (encryption, db, etc.)
│   └── scripts/            # Deployment scripts
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # Route components
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API service layer
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
│
└── docs/                   # Documentation
```

---

## 🎯 Key Features in Detail

### Secrets Management

- **Inline Editing**: Click to edit secret name, value, or type
- **Reveal on Demand**: Secrets hidden by default, click to reveal (logged)
- **Unique Names**: Automatic generation of unique secret names
- **Environment Columns**: Drag-and-drop between Dev/Staging/Production
- **Folder Organization**: Group related secrets together
- **Bulk Operations**: Select and manage multiple secrets

### Access Control

- **Token Scoping**: Limit tokens to specific projects, environments, folders
- **Permission Levels**: Read-only or read-write access
- **IP Allowlisting**: Restrict token usage to specific IPs
- **Expiration**: Optional time-based token expiration
- **One-time View**: Token shown once after creation
- **Revocation**: Instantly revoke compromised tokens

### Audit Logging

- **Comprehensive Tracking**: Every action logged with context
- **User Attribution**: Track who performed each action
- **IP Logging**: Record source IP for security events
- **Metadata**: Environment, folder, secret details
- **Filtering**: By date range, resource type, action type
- **Expandable Details**: Click logs for full information

---

## 🔐 Security

- ✅ **Encryption at Rest**: All secrets encrypted with AES-256-GCM
- ✅ **Secure Transport**: HTTPS enforced in production
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Password Hashing**: bcrypt with salt
- ✅ **CORS Protection**: Configured for your frontend only
- ✅ **Audit Logging**: Complete audit trail
- ✅ **Input Validation**: Zod schemas on all inputs
- ✅ **SQL Injection Protection**: Prisma ORM
- ✅ **XSS Protection**: React escaping + Helmet.js
- ✅ **CSRF Protection**: SameSite cookies

---

## 📊 API Documentation

### Authentication

All API requests require a Bearer token:

   ```bash
Authorization: Bearer your_token_here
```

### Get Secret

```bash
GET /api/v1/{secretName}
```

**Example:**
```bash
curl -H "Authorization: Bearer kvt_..." \
  https://your-api.com/api/v1/DATABASE_URL
```

**Response:**
```
postgresql://user:pass@host:5432/db
```

See full API documentation in the app at `/api-docs` (coming soon).

---

## 🚢 Deployment

### Quick Deploy

1. **Deploy Backend to Render**
   - Create PostgreSQL database
   - Create Web Service
   - Set environment variables
   - Deploy

2. **Deploy Frontend to Vercel**
   - Import GitHub repository
   - Set `VITE_API_URL`
   - Deploy

3. **Update CORS**
   - Set `CORS_ORIGIN` in Render to Vercel URL

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for step-by-step instructions.

---

## 🧪 Testing

```bash
# Backend tests (coming soon)
cd Backend
npm test

# Frontend tests (coming soon)
cd frontend
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by modern DevOps practices

---

## 📞 Support

- 📧 Email: support@keyvault.com (update with your email)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Docs: See documentation files in the repository

---

## 🗺️ Roadmap

- [ ] Vercel integration (auto-sync secrets)
- [ ] AWS Secrets Manager integration
- [ ] Google Cloud Secret Manager integration
- [ ] Secret versioning and rollback
- [ ] Secret templates
- [x] CLI tool for secret management
- [ ] Terraform provider
- [ ] Kubernetes operator
- [ ] Secret rotation policies
- [ ] Multi-factor authentication
- [ ] SSO integration (Okta, Auth0)
- [ ] Advanced audit analytics
- [ ] Secret sharing with expiration
- [ ] Mobile app
- [ ] Browser extension

---

**Built with ❤️ for secure secrets management**
