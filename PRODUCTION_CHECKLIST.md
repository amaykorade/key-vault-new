# ✅ Production Deployment Checklist

Use this checklist to ensure your Key Vault deployment is production-ready.

---

## 🔐 Security Configuration

### Backend Security
- [ ] All environment variables are set with strong, random values
- [ ] `JWT_ACCESS_SECRET` is at least 32 characters (randomly generated)
- [ ] `JWT_REFRESH_SECRET` is at least 32 characters (randomly generated)
- [ ] `ENCRYPTION_KEY` is at least 32 characters (randomly generated)
- [ ] Different secrets used for dev vs production
- [ ] `NODE_ENV=production` is set
- [ ] `CORS_ORIGIN` is set to your frontend URL (not `*`)
- [ ] Database connection uses SSL (Render provides this automatically)
- [ ] No `.env` files committed to Git

### Frontend Security
- [ ] `VITE_API_URL` points to production backend
- [ ] No sensitive data in frontend code
- [ ] HTTPS is enabled (Vercel provides this automatically)

---

## 🗄️ Database

- [ ] PostgreSQL database created on Render
- [ ] Database migrations have been applied successfully
- [ ] Database connection string is using internal URL (faster)
- [ ] Database backups are configured (Render automatic backups)
- [ ] Database is not publicly accessible
- [ ] Database credentials are secure

**Verify Database:**
```bash
# Check migrations status in Render shell
npx prisma migrate status
```

---

## 🌐 Backend (Render)

- [ ] Service is deployed and running
- [ ] Health check endpoint returns 200 OK
  ```
  https://your-backend.onrender.com/health
  ```
- [ ] Health check shows `"database": "connected"`
- [ ] Build command is correct: `npm install && npx prisma generate && npm run build`
- [ ] Start command is correct: `npm start`
- [ ] Port is set to `10000` (or Render default)
- [ ] All required environment variables are set
- [ ] Logs show no errors
- [ ] Can create a user account via API
- [ ] OAuth callbacks are configured (if using Google OAuth)

**Test Backend:**
```bash
# Health check
curl https://your-backend.onrender.com/health

# API test (after creating account)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.onrender.com/api/me
```

---

## 💻 Frontend (Vercel)

- [ ] Project is deployed successfully
- [ ] Environment variable `VITE_API_URL` is set correctly
- [ ] Frontend loads without console errors
- [ ] Can access login page
- [ ] Can sign up for new account
- [ ] Can log in with credentials
- [ ] All pages are accessible
- [ ] API calls are working (check Network tab)
- [ ] No CORS errors in console

**Test Frontend:**
1. Visit your Vercel URL
2. Open browser DevTools (F12)
3. Check Console for errors
4. Check Network tab for API calls
5. Sign up and create test organization

---

## 🔗 Integration Configuration

### CORS Setup
- [ ] Backend `CORS_ORIGIN` matches frontend URL exactly
- [ ] Frontend URL has no trailing slash
- [ ] Backend URL has no trailing slash
- [ ] Test cross-origin requests work

### Google OAuth (if enabled)
- [ ] Google Cloud Console OAuth app configured
- [ ] Authorized redirect URIs include:
  ```
  https://your-backend.onrender.com/api/auth/google/callback
  ```
- [ ] Authorized JavaScript origins include:
  ```
  https://your-app.vercel.app
  https://your-backend.onrender.com
  ```
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- [ ] `GOOGLE_CALLBACK_URL` is correct
- [ ] Can sign in with Google successfully

### Email Configuration (if enabled)
- [ ] SMTP credentials are valid
- [ ] Test email can be sent
- [ ] Invitation emails are being delivered
- [ ] Email links work correctly
- [ ] `FRONTEND_URL` is set for email links

---

## 🧪 Functionality Testing

### Authentication
- [ ] Sign up creates new user
- [ ] Login works with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] JWT tokens are being issued
- [ ] Protected routes require authentication
- [ ] Logout clears session

### Organizations & Projects
- [ ] Can create organization
- [ ] Can create project in organization
- [ ] Can invite team members
- [ ] Team member receives invitation email
- [ ] Can accept invitation
- [ ] Permissions are enforced

### Secrets Management
- [ ] Can create secret in different environments
- [ ] Can edit secret inline
- [ ] Can reveal secret value (logs audit)
- [ ] Can delete secret
- [ ] Secrets are encrypted in database
- [ ] Folder organization works

### Access Tokens
- [ ] Can create personal access token
- [ ] Token is shown once after creation
- [ ] Can configure token scopes
- [ ] Can set token expiration
- [ ] Can revoke token
- [ ] API endpoint works with token:
  ```bash
  curl -H "Authorization: Bearer kvt_..." \
    https://your-backend.onrender.com/api/v1/TEST_SECRET
  ```

### Audit Logging
- [ ] Actions are being logged
- [ ] Can view audit logs
- [ ] Can filter logs by date
- [ ] Can filter logs by resource type
- [ ] Logs show correct user and timestamp
- [ ] Secret reveals are logged

---

## 📊 Monitoring & Performance

- [ ] Backend health check is responding
- [ ] Response times are acceptable (<500ms for most requests)
- [ ] Database queries are performant
- [ ] No memory leaks in backend logs
- [ ] Frontend loads quickly (<3s)
- [ ] No console errors in production

**Monitor:**
- Render Dashboard → Logs (real-time monitoring)
- Vercel Dashboard → Analytics (traffic and performance)

---

## 🔄 Deployment Pipeline

- [ ] Changes to `main` branch auto-deploy to Render
- [ ] Changes to `main` branch auto-deploy to Vercel
- [ ] Database migrations run automatically on deploy
- [ ] Failed deployments roll back automatically
- [ ] Can trigger manual deployment if needed

---

## 📝 Documentation

- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Deployment process documented
- [ ] Team members know how to access logs
- [ ] Emergency procedures documented
- [ ] Backup and recovery plan exists

---

## 🚨 Emergency Procedures

### Backend Down
1. Check Render dashboard for service status
2. Check logs for errors
3. Verify DATABASE_URL is valid
4. Restart service if needed
5. Check recent deployments for issues

### Database Issues
1. Check database status in Render
2. Verify connection string is correct
3. Check for disk space issues
4. Run migrations manually if needed:
   ```bash
   npx prisma migrate deploy
   ```

### Frontend Issues
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Check that backend is accessible
4. Redeploy if needed

### Secret Compromised
1. Regenerate the compromised secret
2. Update in Render environment variables
3. Redeploy backend
4. Rotate database credentials if needed
5. Review audit logs for unauthorized access

---

## 🎉 Post-Launch Tasks

### Immediate (Day 1)
- [ ] Send test invitation email
- [ ] Create first production secrets
- [ ] Test API token access
- [ ] Monitor logs for errors
- [ ] Set up status page (optional)

### Week 1
- [ ] Review audit logs
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix any issues discovered
- [ ] Document common problems

### Month 1
- [ ] Rotate secrets and credentials
- [ ] Review security settings
- [ ] Plan for scaling if needed
- [ ] Backup critical data
- [ ] Review access logs

---

## 🔧 Optimization Checklist

### Performance
- [ ] Enable caching where appropriate
- [ ] Optimize database queries
- [ ] Use connection pooling (Prisma handles this)
- [ ] Compress responses (gzip)
- [ ] CDN for frontend assets (Vercel provides)

### Security
- [ ] Enable rate limiting (consider implementing)
- [ ] Add request logging
- [ ] Monitor for suspicious activity
- [ ] Set up security alerts
- [ ] Regular security audits

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring
- [ ] Create alerting for critical issues
- [ ] Dashboard for key metrics

---

## 📈 Scaling Considerations

When you need to scale:

1. **Database**: Upgrade Render PostgreSQL plan
2. **Backend**: Upgrade Render service plan, consider horizontal scaling
3. **Frontend**: Vercel scales automatically
4. **Caching**: Add Redis for session/token caching
5. **CDN**: Already provided by Vercel
6. **Load Balancing**: Render handles this on higher plans

---

## ✅ Final Verification

Run through this quick test:

1. Visit frontend URL → ✅ Loads correctly
2. Sign up with test account → ✅ Creates account
3. Create organization → ✅ Works
4. Create project → ✅ Works
5. Create secret → ✅ Encrypted and stored
6. Reveal secret → ✅ Shows value, audit logged
7. Create API token → ✅ Token generated
8. Test API endpoint → ✅ Returns secret value
9. Check audit logs → ✅ All actions logged
10. Revoke token → ✅ API calls fail

**If all checks pass: 🎉 Your Key Vault is production-ready!**

---

## 📞 Need Help?

If you encounter issues:

1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
2. Review Render and Vercel logs
3. Verify all environment variables
4. Check backend health endpoint
5. Test database connection

---

**Last Updated:** [Add date after deployment]
**Deployed By:** [Your name]
**Production URL:** [Your Vercel URL]
**Backend URL:** [Your Render URL]

