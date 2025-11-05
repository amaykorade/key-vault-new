# 🔧 Environment Setup Guide

Complete guide for setting up environment variables for different deployment scenarios.

---

## 📁 File Structure

```
Key Vault/
├── Backend/
│   ├── .env                 # Your local backend config (git ignored)
│   └── env.example          # Template for backend env vars
├── frontend/
│   ├── .env.local          # Your local frontend config (git ignored)
│   ├── .env.production     # Production frontend config (git ignored)
│   └── ENV_SETUP.md        # Frontend env documentation
├── DEPLOYMENT_GUIDE.md     # Full deployment guide
└── QUICK_DEPLOY.md         # Quick deployment reference
```

---

## 🚀 Quick Start

### 1️⃣ Local Development (Both Frontend & Backend Local)

**Backend:** Create `Backend/.env`
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://keyvault:keyvault@localhost:5432/keyvault
JWT_ACCESS_SECRET=local_development_jwt_access_secret_min_32_chars
JWT_REFRESH_SECRET=local_development_jwt_refresh_secret_min_32_chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
ENCRYPTION_KEY=local_development_encryption_key_min_32_chars
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Frontend:** Create `frontend/.env.local`
```bash
VITE_API_URL=http://localhost:4000/api
```

**Start Development:**
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit: http://localhost:5173

---

### 2️⃣ Local Frontend + Production Backend

**Frontend:** Create `frontend/.env.local`
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

**Start:**
```bash
cd frontend
npm run dev
```

---

### 3️⃣ Production (Render + Vercel)

**Render (Backend):**

Set these in Render Dashboard → Environment:

```bash
# Essential
NODE_ENV=production
PORT=10000
DATABASE_URL=<provided-by-render-postgres>

# Security (Generate random 32+ char strings)
JWT_ACCESS_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
ENCRYPTION_KEY=<random-secret>

# CORS
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app

# Optional
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
FROM_EMAIL=<your-email>
FROM_NAME=Key Vault
```

**Vercel (Frontend):**

Set in Vercel Dashboard → Environment Variables:

```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🔐 Generating Secure Secrets

### Method 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: OpenSSL
```bash
openssl rand -hex 32
```

### Method 3: Python
```python
import secrets
print(secrets.token_hex(32))
```

### Method 4: Online
```
https://generate-secret.vercel.app/32
```

---

## 🔄 Switching Between Environments

### Development → Production API

```bash
# frontend/.env.local
VITE_API_URL=https://your-backend.onrender.com/api
```

### Production API → Development

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:4000/api
```

### Testing Production Build Locally

```bash
cd frontend
npm run build
npm run preview
```

---

## ✅ Environment Checklist

### Backend Ready
- [ ] `.env` file created from `env.example`
- [ ] `DATABASE_URL` connects successfully
- [ ] JWT secrets are at least 32 characters
- [ ] `ENCRYPTION_KEY` is at least 32 characters
- [ ] `CORS_ORIGIN` matches frontend URL
- [ ] Database is running (local or cloud)
- [ ] Migrations are applied

### Frontend Ready
- [ ] `.env.local` created (local) or Vercel env vars set (production)
- [ ] `VITE_API_URL` points to correct backend
- [ ] Backend health check passes
- [ ] Can successfully sign up/login
- [ ] CORS allows requests from frontend

---

## 🐛 Common Issues

### ❌ "Network Error" on API calls
**Solution:**
- Check `VITE_API_URL` has `/api` at the end
- Verify backend is running
- Check CORS_ORIGIN in backend

### ❌ "Database connection failed"
**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running
- For local: `docker-compose up -d` or start PostgreSQL

### ❌ "Invalid token" errors
**Solution:**
- Ensure JWT secrets are set
- Clear browser localStorage
- Check secrets are same between restarts

### ❌ CORS errors in browser
**Solution:**
- Update `CORS_ORIGIN` in backend to match frontend URL
- No trailing slashes in URLs
- Restart backend after changes

---

## 📊 Environment Variables Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `PORT` | Yes | 4000 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token secret (32+ chars) |
| `JWT_ACCESS_TTL` | No | 15m | Access token expiration |
| `JWT_REFRESH_TTL` | No | 7d | Refresh token expiration |
| `ENCRYPTION_KEY` | Yes | - | Secret encryption key (32+ chars) |
| `CORS_ORIGIN` | No | * | Allowed frontend origin |
| `FRONTEND_URL` | No | - | Frontend URL for emails |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | No | - | OAuth callback URL |
| `SMTP_HOST` | No | - | Email server host |
| `SMTP_PORT` | No | - | Email server port |
| `SMTP_SECURE` | No | false | Use TLS for email |
| `SMTP_USER` | No | - | Email username |
| `SMTP_PASS` | No | - | Email password |
| `FROM_EMAIL` | No | - | Sender email address |
| `FROM_NAME` | No | - | Sender name |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | http://localhost:4000/api | Backend API URL |

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files** - They're in `.gitignore`
2. ✅ **Use different secrets** for dev/prod
3. ✅ **Rotate secrets regularly** in production
4. ✅ **Use strong random secrets** (32+ characters)
5. ✅ **Limit CORS to your domain** in production
6. ✅ **Use HTTPS** in production (automatic on Render/Vercel)
7. ✅ **Don't share secrets** via chat/email
8. ✅ **Use environment variables** in CI/CD

---

## 📚 Additional Resources

- [Backend Environment Setup](Backend/ENV_SETUP.md)
- [Frontend Environment Setup](frontend/ENV_SETUP.md)
- [Full Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Quick Deploy Reference](QUICK_DEPLOY.md)

---

**Need Help?** Check the [Troubleshooting section](#common-issues) or refer to the full [Deployment Guide](DEPLOYMENT_GUIDE.md).

