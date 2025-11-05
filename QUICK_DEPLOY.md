# ⚡ Quick Deploy Guide

**Get Key Vault deployed in 15 minutes!**

---

## 🎯 TL;DR

1. **Render**: Deploy Backend + PostgreSQL
2. **Vercel**: Deploy Frontend
3. Update CORS settings
4. Done! 🎉

---

## 🔧 Render (Backend)

### 1. Create Database
```
New + → PostgreSQL
Name: keyvault-db
Plan: Free
```

### 2. Create Web Service
```
New + → Web Service
Repository: Your GitHub repo
Root Directory: Backend
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
```

### 3. Environment Variables

**Copy this template** and update:

```bash
# Essential
NODE_ENV=production
PORT=10000
DATABASE_URL=<from-database-internal-url>

# Generate these (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=<generate-32-char-secret>
JWT_REFRESH_SECRET=<generate-32-char-secret>
ENCRYPTION_KEY=<generate-32-char-secret>

# Will update after Vercel
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app

# Optional
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

### 4. Deploy & Note URL
```
Your backend: https://keyvault-backend.onrender.com
```

---

## 🌐 Vercel (Frontend)

### 1. Import Project
```
Add New → Project
Repository: Your GitHub repo
Root Directory: frontend
Framework: Vite
```

### 2. Environment Variable
```bash
VITE_API_URL=https://keyvault-backend.onrender.com/api
```

### 3. Deploy & Note URL
```
Your frontend: https://your-app.vercel.app
```

---

## 🔄 Update Backend CORS

Go back to Render → Environment → Update:

```bash
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Save (will redeploy automatically)

---

## ✅ Verify

1. **Backend Health**: Visit `https://keyvault-backend.onrender.com/health`
   - Should return: `{"status":"ok","database":"connected"}`

2. **Frontend**: Visit `https://your-app.vercel.app`
   - Should load login page

3. **Sign Up**: Create your first user and test!

---

## 🎉 Done!

**Your Key Vault is now live in production!**

For detailed configuration (Google OAuth, Email, etc.), see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🆘 Having Issues?

### Backend won't start
- Check DATABASE_URL is correct
- Verify all env vars are set
- Check Render logs

### Frontend can't reach backend
- Verify VITE_API_URL has `/api` at the end
- Check CORS_ORIGIN matches frontend URL exactly
- No trailing slashes!

### Database connection failed
- Check DATABASE_URL uses Internal URL from Render
- Wait 30s for database to wake up (free tier)

---

## 📝 Environment Switching (Local Dev)

### Use Production API Locally
```bash
# frontend/.env.local
VITE_API_URL=https://keyvault-backend.onrender.com/api
```

### Use Local API
```bash
# frontend/.env.local
VITE_API_URL=http://localhost:4000/api
```

---

**Need more help?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

