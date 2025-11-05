#!/bin/bash

# Production Migration Script for Render
# This script should be run manually if needed, or set as a pre-deploy command

echo "🚀 Starting production database migration..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Verify migration
echo "✅ Verifying migration status..."
npx prisma migrate status

echo "✨ Migration completed successfully!"

