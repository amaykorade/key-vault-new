# 🚀 Deployment Guide - Key Vault

Complete guide to deploy Key Vault to production using **Render (Backend)** and **Vercel (Frontend)**.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Local Development with Production API](#local-development-with-production-api)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with your repository pushed
- ✅ Render account (https://render.com)
- ✅ Vercel account (https://vercel.com)
- ✅ Google OAuth credentials (if using OAuth)
- ✅ SMTP credentials (if using email invitations)

---

## 🔧 Backend Deployment (Render)

### Step 1: Create PostgreSQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `keyvault-db`
   - **Database**: `keyvault`
   - **User**: `keyvault`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or Starter for production)
4. Click **"Create Database"**
5. **Copy the Internal Database URL** (you'll need this)

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `keyvault-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `Backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for production)

### Step 3: Configure Environment Variables

Go to **Environment** tab and add these variables:

#### Essential Variables

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<paste-internal-database-url-from-step-1>
```

#### Generate Secure Secrets

Run these commands locally to generate secure secrets:

```bash
# Generate JWT Access Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated values:

```bash
JWT_ACCESS_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
ENCRYPTION_KEY=<generated-secret-3>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

#### CORS & Frontend (Update after Vercel deployment)

```bash
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

#### Google OAuth (Optional)

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://keyvault-backend.onrender.com/api/auth/google/callback
```

#### Email Configuration (Optional)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Key Vault
```

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Your backend will be available at: `https://keyvault-backend.onrender.com`

### Step 5: Verify Backend Health

Visit: `https://keyvault-backend.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T...",
  "environment": "production",
  "database": "connected"
}
```

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Import Project

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Configure Environment Variables

Click **"Environment Variables"** and add:

```bash
VITE_API_URL=https://keyvault-backend.onrender.com/api
```

**Note**: Replace `keyvault-backend` with your actual Render service name.

### Step 3: Deploy Frontend

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Your frontend will be available at: `https://your-app.vercel.app`

### Step 4: Update Backend CORS

Now that you have your Vercel URL, update your Render backend:

1. Go to Render Dashboard → Your Backend Service → Environment
2. Update these variables:
   ```bash
   CORS_ORIGIN=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Save changes (this will trigger a redeploy)

---

## 🔐 Environment Variables Setup

### Quick Reference

#### Backend (Render)
See `Backend/ENV_SETUP.md` for detailed documentation.

#### Frontend (Vercel)
See `frontend/ENV_SETUP.md` for detailed documentation.

---

## ⚙️ Post-Deployment Configuration

### 1. Setup Google OAuth (If Using)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   ```
   https://keyvault-backend.onrender.com/api/auth/google/callback
   ```
5. Add authorized JavaScript origins:
   ```
   https://your-app.vercel.app
   https://keyvault-backend.onrender.com
   ```

### 2. Test Email Invitations (If Using)

1. Create an organization
2. Invite a team member
3. Check if email is received

### 3. Create First Admin User

1. Visit your app: `https://your-app.vercel.app`
2. Sign up with your admin email
3. Create your first organization

---

## 🔄 Local Development with Production API

### Connect Local Frontend to Production Backend

```bash
cd frontend
echo "VITE_API_URL=https://keyvault-backend.onrender.com/api" > .env.local
npm run dev
```

### Connect Local Backend to Production Database

⚠️ **WARNING**: Be careful when pointing local backend to production database!

```bash
cd Backend
# Add to .env
DATABASE_URL=<production-database-url>
npm run dev
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Database Connection Failed
```bash
# Check DATABASE_URL is correctly set
# Verify database is running in Render dashboard
# Check logs in Render dashboard
```

#### CORS Errors
```bash
# Ensure CORS_ORIGIN matches your Vercel URL exactly (no trailing slash)
# Check that credentials: true is set in CORS config
```

#### Migrations Not Running
```bash
# Manually run migrations in Render shell:
npx prisma migrate deploy
```

### Frontend Issues

#### API Calls Failing
```bash
# Verify VITE_API_URL is set correctly in Vercel
# Check browser console for exact error
# Verify backend health endpoint works
```

#### Environment Variables Not Loading
```bash
# Redeploy after changing environment variables in Vercel
# Clear browser cache
# Check that variable names start with VITE_
```

### Common Errors

#### "Network Error" on API Calls
- ✅ Check CORS_ORIGIN in backend matches frontend URL
- ✅ Verify backend is running (check health endpoint)
- ✅ Check browser console for CORS errors

#### "Database Connection Timeout"
- ✅ Verify DATABASE_URL is correct
- ✅ Check if database is sleeping (free tier)
- ✅ Restart database in Render dashboard

#### "Invalid Token" Errors
- ✅ Ensure JWT secrets are set correctly
- ✅ Check token expiration settings
- ✅ Clear local storage and re-login

---

## 📊 Monitoring

### Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Real-time logs will show all API requests and errors

### Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on a deployment to see build and runtime logs

### Health Checks

- Backend: `https://keyvault-backend.onrender.com/health`
- Monitor database connection status
- Check for errors in logs

---

## 🔄 Updating Your Application

### Backend Updates

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will automatically deploy the changes.

### Frontend Updates

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel will automatically deploy the changes.

### Database Schema Changes

```bash
# 1. Create migration locally
cd Backend
npx prisma migrate dev --name describe_your_change

# 2. Commit and push
git add prisma/migrations
git commit -m "Add database migration"
git push origin main

# 3. Render will automatically run migrations on deploy
```

---

## 🎉 Success Checklist

- ✅ Backend deployed and health check passes
- ✅ Frontend deployed and accessible
- ✅ Can sign up and login
- ✅ Can create organizations and projects
- ✅ Can create and view secrets
- ✅ API tokens work correctly
- ✅ Audit logs are recording events
- ✅ (Optional) Google OAuth works
- ✅ (Optional) Email invitations work

---

## 🔒 Security Reminders

- ✅ All secrets are randomly generated and at least 32 characters
- ✅ HTTPS is enabled (automatic on Render and Vercel)
- ✅ Secure cookies are enabled in production
- ✅ CORS is configured to allow only your frontend
- ✅ Database is not publicly accessible
- ✅ Environment variables are not committed to Git

---

## 📞 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Render and Vercel logs
3. Verify all environment variables are set correctly
4. Check that backend health endpoint returns 200 OK

---

## 🚀 Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure production email service
3. Set up monitoring and alerts
4. Plan for database backups
5. Consider upgrading to paid plans for better performance
6. Implement CI/CD for automated testing

---

**Happy Deploying! 🎉**

