#!/bin/bash
# Quick test script for CLI setup

echo "🔍 Checking CLI Setup..."
echo ""

# Check if CLI is installed
if command -v keyvault &> /dev/null; then
    echo "✅ CLI is installed"
    keyvault --version
else
    echo "❌ CLI is not installed"
    echo "   Run: cd cli && npm link"
fi

# Check backend
echo ""
echo "🔍 Checking backend..."
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running"
    echo "   Run: cd Backend && npm run dev"
fi

# Check frontend
echo ""
echo "🔍 Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running"
    echo "   Run: cd frontend && npm run dev"
fi

# Check environment variable
echo ""
echo "🔍 Checking environment..."
if [ -z "$KEYVAULT_API_URL" ]; then
    echo "⚠️  KEYVAULT_API_URL is not set"
    echo "   Run: export KEYVAULT_API_URL=http://localhost:4000"
else
    echo "✅ KEYVAULT_API_URL is set to: $KEYVAULT_API_URL"
fi

echo ""
echo "📝 Next steps:"
echo "1. Make sure backend and frontend are running"
echo "2. Set KEYVAULT_API_URL=http://localhost:4000"
echo "3. Run: keyvault login"
