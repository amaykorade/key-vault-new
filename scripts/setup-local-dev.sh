#!/bin/bash

# Complete Local Development Setup Script
echo "🚀 Setting up Key Vault for local development..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo -e "${RED}❌ Error: Please run this script from the Key Vault root directory${NC}"
    exit 1
fi

# Backend Setup
echo "📦 Setting up Backend..."
cd Backend || exit 1

if [ ! -f ".env" ]; then
    echo "Creating Backend/.env from template..."
    cp env.example .env
    
    # Generate random secrets
    echo "🔐 Generating secure secrets..."
    JWT_ACCESS=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_REFRESH=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/change_me_access_secret/${JWT_ACCESS}/" .env
        sed -i '' "s/change_me_refresh_secret/${JWT_REFRESH}/" .env
        sed -i '' "s/change_me_encryption_key_32bytes_min/${ENCRYPTION_KEY}/" .env
    else
        # Linux
        sed -i "s/change_me_access_secret/${JWT_ACCESS}/" .env
        sed -i "s/change_me_refresh_secret/${JWT_REFRESH}/" .env
        sed -i "s/change_me_encryption_key_32bytes_min/${ENCRYPTION_KEY}/" .env
    fi
    
    echo -e "${GREEN}✅ Backend .env created with secure secrets${NC}"
else
    echo -e "${YELLOW}⚠️  Backend/.env already exists, skipping...${NC}"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Frontend Setup
echo "📦 Setting up Frontend..."
cd ../frontend || exit 1

# Create frontend .env.local
cat > .env.local << EOF
# Local Development Configuration
VITE_API_URL=http://localhost:4000/api
EOF

echo -e "${GREEN}✅ Frontend .env.local created${NC}"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Database Setup Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Setup Required"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Using Docker (Recommended)"
echo "  Run from root directory:"
echo "  $ docker-compose up -d"
echo ""
echo "Option 2: Local PostgreSQL"
echo "  1. Install PostgreSQL"
echo "  2. Create database:"
echo "     $ psql -U postgres"
echo "     postgres=# CREATE DATABASE keyvault;"
echo "     postgres=# CREATE USER keyvault WITH PASSWORD 'keyvault';"
echo "     postgres=# GRANT ALL PRIVILEGES ON DATABASE keyvault TO keyvault;"
echo ""
echo "Then run migrations:"
echo "  $ cd Backend"
echo "  $ npx prisma migrate dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Next Steps
echo "✨ Setup Complete! Next steps:"
echo ""
echo "1. Start PostgreSQL database (if not already running)"
echo "   $ docker-compose up -d"
echo ""
echo "2. Run database migrations"
echo "   $ cd Backend && npx prisma migrate dev"
echo ""
echo "3. Start Backend (Terminal 1)"
echo "   $ cd Backend && npm run dev"
echo ""
echo "4. Start Frontend (Terminal 2)"
echo "   $ cd frontend && npm run dev"
echo ""
echo "5. Visit http://localhost:5173"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"

