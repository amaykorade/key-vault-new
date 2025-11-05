#!/bin/bash

# Switch to Local Development Configuration
echo "🔄 Switching to LOCAL development configuration..."

# Frontend
cd "$(dirname "$0")/../frontend" || exit 1
cat > .env.local << EOF
# Local Development Configuration
VITE_API_URL=http://localhost:4000/api
EOF

echo "✅ Frontend configured for LOCAL backend (http://localhost:4000/api)"

# Backend reminder
echo ""
echo "📝 Backend reminder:"
echo "   Make sure your Backend/.env has:"
echo "   DATABASE_URL=postgresql://keyvault:keyvault@localhost:5432/keyvault"
echo "   CORS_ORIGIN=http://localhost:5173"
echo ""

echo "✨ Configuration complete! Start your local servers:"
echo "   Terminal 1: cd Backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"

