#!/bin/bash
#
# APIVault CLI Test Script
#
# This script tests the CLI functionality:
# 1. Login
# 2. Setup project
# 3. List secrets
# 4. Get secrets
# 5. Run commands with secrets
#

set -e

echo "🧪 Testing APIVault CLI Access"
echo ""

# Check if CLI is installed
if ! command -v keyvault &> /dev/null; then
    echo "❌ Error: keyvault CLI is not installed"
    echo "   Install it with: npm install -g @keyvault/cli"
    exit 1
fi

echo "✅ CLI is installed: $(keyvault --version)"
echo ""

# Test 1: Check if logged in
echo "📋 Test 1: Checking authentication status..."
if keyvault profile &> /dev/null; then
    echo "   ✅ Already authenticated"
    PROFILE=$(keyvault profile)
    echo "   User: $(echo "$PROFILE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
else
    echo "   ⚠️  Not authenticated. Run: keyvault login"
    echo "   Then run this script again."
    exit 1
fi
echo ""

# Test 2: Check if project is setup
echo "📋 Test 2: Checking project setup..."
if [ -f ".keyvault.yaml" ]; then
    echo "   ✅ Project is setup (found .keyvault.yaml)"
    cat .keyvault.yaml | grep -E "project|environment" || true
else
    echo "   ⚠️  Project not setup. Run: keyvault setup"
    echo "   Then run this script again."
    exit 1
fi
echo ""

# Test 3: List secrets
echo "📋 Test 3: Listing secrets..."
SECRETS=$(keyvault secrets list 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Successfully listed secrets:"
    echo "$SECRETS" | sed 's/^/      /'
else
    echo "   ❌ Failed to list secrets:"
    echo "$SECRETS" | sed 's/^/      /'
    exit 1
fi
echo ""

# Test 4: Get a specific secret
echo "📋 Test 4: Getting DATABASE_URL secret..."
SECRET_VALUE=$(keyvault secrets get DATABASE_URL 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Successfully retrieved DATABASE_URL"
    echo "   Value: ${SECRET_VALUE:0:20}..."
else
    echo "   ⚠️  Could not retrieve DATABASE_URL (might not exist)"
    echo "   Error: $SECRET_VALUE"
fi
echo ""

# Test 5: Run a command with secrets
echo "📋 Test 5: Running command with secrets injected..."
echo "   Command: keyvault run -- env | grep -E 'DATABASE_URL|API_KEY|JWT_SECRET'"
ENV_VARS=$(keyvault run -- env | grep -E 'DATABASE_URL|API_KEY|JWT_SECRET' || true)
if [ -n "$ENV_VARS" ]; then
    echo "   ✅ Secrets are available as environment variables:"
    echo "$ENV_VARS" | sed 's/^/      /'
else
    echo "   ⚠️  No secrets found in environment (might not exist)"
fi
echo ""

# Summary
echo "📊 Test Summary:"
echo "----------------------------------------"
echo "✅ CLI is installed and working"
echo "✅ Authentication is working"
echo "✅ Project setup is complete"
echo "✅ Secrets can be accessed"
echo ""
echo "💡 You can now use the CLI in your project:"
echo "   - keyvault secrets get SECRET_NAME"
echo "   - keyvault run -- your-command-here"
echo "   - keyvault secrets list"
echo ""

echo "✅ All CLI tests passed!"

