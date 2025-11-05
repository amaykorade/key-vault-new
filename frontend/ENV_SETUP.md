# Frontend Environment Configuration

## Environment Variables

Create `.env` files in the frontend root directory based on your environment:

### Local Development (`.env.local`)
```bash
VITE_API_URL=http://localhost:4000/api
```

### Production (`.env.production`)
```bash
# Replace with your actual Render backend URL
VITE_API_URL=https://your-backend-app.onrender.com/api
```

### General `.env`
```bash
# This will be used if no environment-specific file exists
VITE_API_URL=http://localhost:4000/api
```

## How It Works

- Vite automatically loads `.env.[mode]` files based on the build mode
- `npm run dev` uses `.env.local` or `.env`
- `npm run build` uses `.env.production` or `.env`
- The API URL is accessed via `import.meta.env.VITE_API_URL`

## Quick Setup

### For Local Development:
1. Create `.env.local` file
2. Add: `VITE_API_URL=http://localhost:4000/api`
3. Run: `npm run dev`

### For Production (Vercel):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend-app.onrender.com/api`
3. Redeploy your application

## Testing Different Environments

```bash
# Test with production API locally
VITE_API_URL=https://your-backend-app.onrender.com/api npm run dev

# Build for production
npm run build
```

