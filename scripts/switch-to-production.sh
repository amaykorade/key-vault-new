#!/bin/bash

# Switch to Production API Configuration (Local Frontend + Production Backend)
echo "🔄 Switching to PRODUCTION API configuration..."

# Check if backend URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your production backend URL"
    echo ""
    echo "Usage: ./scripts/switch-to-production.sh https://your-backend.onrender.com"
    exit 1
fi

BACKEND_URL="$1"

# Remove trailing slash if present
BACKEND_URL="${BACKEND_URL%/}"

# Frontend
cd "$(dirname "$0")/../frontend" || exit 1
cat > .env.local << EOF
# Production Backend Configuration
# Local frontend will connect to production backend
VITE_API_URL=${BACKEND_URL}/api
EOF

echo "✅ Frontend configured for PRODUCTION backend (${BACKEND_URL}/api)"
echo ""
echo "⚠️  WARNING: You are now connecting to production data!"
echo ""
echo "✨ Start your frontend:"
echo "   cd frontend && npm run dev"

