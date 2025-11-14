# Google OAuth Configuration Guide

## ⚠️ "Access blocked: This app's request is invalid" Error Fix

This error occurs when your Google Cloud Console OAuth settings don't match what your application is sending.

## 🔧 Required Google Cloud Console Settings

### For Production

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Select your OAuth 2.0 Client ID

2. **Authorized JavaScript origins** (add these):
   ```
   https://key-vault-new.vercel.app
   ```

3. **Authorized redirect URIs** (add this - MUST match exactly):
   ```
   https://key-vault-new.onrender.com/api/auth/google/callback
   ```
   ⚠️ **Important**: Must include `/api/auth/google/callback` - NOT just `/google/callback`

### For Local Development

1. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```

2. **Authorized redirect URIs**:
   ```
   http://localhost:4000/api/auth/google/callback
   http://127.0.0.1:4000/api/auth/google/callback
   ```

## 🔍 How to Verify Your Configuration

### Check Your Backend Environment Variables

Your backend should have:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://key-vault-new.onrender.com/api/auth/google/callback
CORS_ORIGIN=https://key-vault-new.vercel.app
```

### Check Your Frontend Environment Variables

Your frontend should have:
```env
VITE_API_URL=https://key-vault-new.onrender.com/api
```

## 🧪 Testing the Configuration

1. **Check callback URL in browser console:**
   - When you click "Sign in with Google", check the URL in the address bar
   - It should include: `redirect_uri=https://key-vault-new.onrender.com/api/auth/google/callback`

2. **Check backend logs:**
   - Look for any OAuth-related errors
   - Check if the callback URL matches

## ✅ Common Issues & Fixes

### Issue 1: Missing `/api` in redirect URI
**Error**: "Access blocked: This app's request is invalid"  
**Fix**: Ensure redirect URI includes `/api/auth/google/callback`, not just `/google/callback`

### Issue 2: Wrong JavaScript origin
**Error**: "redirect_uri_mismatch"  
**Fix**: JavaScript origin should be your frontend URL (Vercel), not backend URL (Render)

### Issue 3: Wrong callback URL in environment
**Fix**: Set `GOOGLE_CALLBACK_URL` in backend `.env` to match your Render URL:
```env
GOOGLE_CALLBACK_URL=https://key-vault-new.onrender.com/api/auth/google/callback
```

## 📋 Quick Checklist

- [ ] JavaScript origin in Google Console = Frontend URL (Vercel)
- [ ] Redirect URI in Google Console = Backend URL + `/api/auth/google/callback` (Render)
- [ ] `GOOGLE_CALLBACK_URL` in backend `.env` = Backend URL + `/api/auth/google/callback`
- [ ] `CORS_ORIGIN` in backend `.env` = Frontend URL (Vercel)
- [ ] `VITE_API_URL` in frontend `.env` = Backend URL + `/api` (Render)

## 🔗 Current Configuration (Based on Code)

- **Backend Route**: `/api/auth/google/callback`
- **Frontend Redirects to**: `${API_BASE_URL}/auth/google` = Backend URL + `/api/auth/google`
- **Backend Callback URL**: `https://key-vault-new.onrender.com/api/auth/google/callback`

Make sure these match exactly in Google Cloud Console!

