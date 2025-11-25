/**
 * Quick diagnostic script to check Razorpay setup
 * Run with: node scripts/check-razorpay-setup.js
 */

require('dotenv').config({ path: '.env' });

const checks = {
  credentials: false,
  database: false,
  razorpayConnection: false,
};

console.log('🔍 Checking Razorpay Setup...\n');

// Check 1: Environment Variables
console.log('1. Checking environment variables...');
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.log('   ❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env');
  console.log('   📝 Add them to Backend/.env:');
  console.log('      RAZORPAY_KEY_ID=rzp_test_xxxxx');
  console.log('      RAZORPAY_KEY_SECRET=your_secret');
} else {
  console.log('   ✅ Razorpay credentials found');
  console.log(`   📋 Key ID: ${keyId.substring(0, 10)}...`);
  checks.credentials = true;
  
  // Check if it's test mode
  if (keyId.startsWith('rzp_test_')) {
    console.log('   ✅ Using TEST mode credentials');
  } else if (keyId.startsWith('rzp_live_')) {
    console.log('   ⚠️  Using LIVE mode credentials');
  } else {
    console.log('   ⚠️  Key ID format looks incorrect');
  }
}

// Check 2: Database Migration
console.log('\n2. Checking database migration...');
try {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  
  // Try to access subscription model
  db.$queryRaw`SELECT 1 FROM "Subscription" LIMIT 1`
    .then(() => {
      console.log('   ✅ Subscription table exists');
      checks.database = true;
      db.$disconnect();
    })
    .catch((error) => {
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01') {
        console.log('   ❌ Subscription table does not exist');
        console.log('   📝 Run migration: npx prisma migrate dev --name add_subscription_model');
      } else {
        console.log('   ⚠️  Could not check database:', error.message);
      }
      db.$disconnect();
    });
} catch (error) {
  console.log('   ⚠️  Could not connect to database:', error.message);
  console.log('   📝 Make sure DATABASE_URL is set in .env');
}

// Check 3: Razorpay Connection
console.log('\n3. Testing Razorpay connection...');
if (checks.credentials) {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    
    // Try to fetch account details (lightweight API call)
    razorpay.accounts.fetch()
      .then(() => {
        console.log('   ✅ Razorpay connection successful');
        checks.razorpayConnection = true;
      })
      .catch((error) => {
        console.log('   ❌ Razorpay connection failed');
        if (error.statusCode === 401) {
          console.log('   📝 Invalid credentials. Check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
        } else {
          console.log('   📝 Error:', error.message || error.error?.description);
        }
      });
  } catch (error) {
    console.log('   ❌ Could not initialize Razorpay:', error.message);
  }
} else {
  console.log('   ⏭️  Skipped (credentials not set)');
}

// Summary
console.log('\n📊 Summary:');
console.log(`   Credentials: ${checks.credentials ? '✅' : '❌'}`);
console.log(`   Database: ${checks.database ? '✅' : '❌'}`);
console.log(`   Razorpay Connection: ${checks.razorpayConnection ? '✅' : '❌'}`);

if (checks.credentials && checks.database && checks.razorpayConnection) {
  console.log('\n🎉 All checks passed! Payment integration should work.');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.');
}

