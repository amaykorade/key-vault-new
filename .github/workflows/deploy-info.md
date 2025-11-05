# CI/CD Deployment Information

## Current Setup

The project uses automatic deployments:

### Frontend (Vercel)
- ✅ Automatic deployments on push to `main` branch
- ✅ Preview deployments for pull requests
- ✅ Environment variables configured in Vercel dashboard

### Backend (Render)
- ✅ Automatic deployments on push to `main` branch
- ✅ Automatic database migrations on deploy
- ✅ Environment variables configured in Render dashboard

## Manual Deployment

### Trigger Deployment Manually

**Vercel:**
```bash
git push origin main
# Or use Vercel CLI
npx vercel --prod
```

**Render:**
```bash
git push origin main
# Or trigger manual deploy in Render dashboard
```

## Future CI/CD Enhancements

Consider adding GitHub Actions for:
- ✨ Automated testing before deployment
- ✨ Linting and type checking
- ✨ Security scanning
- ✨ Database backup before migrations
- ✨ Smoke tests after deployment

### Example GitHub Action (Future)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd Backend && npm ci && npm test
      - run: cd frontend && npm ci && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployments handled by Render and Vercel"
```

