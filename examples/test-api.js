/**
 * APIVault API Access Test Script
 * 
 * Usage:
 *   export VAULT_TOKEN="your-api-key-token-here"
 *   node test-api.js
 * 
 * Or set it in a .env file and use dotenv
 */

const axios = require('axios');

// Configuration
const token = process.env.VAULT_TOKEN;
const apiUrl = process.env.VAULT_API_URL || 'https://key-vault-new.onrender.com/api/v1';

if (!token) {
  console.error('❌ Error: VAULT_TOKEN environment variable is required');
  console.error('   Set it with: export VAULT_TOKEN="your-api-key-token-here"');
  process.exit(1);
}

/**
 * Fetch a secret from the vault
 */
async function getSecret(name) {
  try {
    const response = await axios.get(`${apiUrl}/${name}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'APIVault-Test-Script/1.0'
      },
      // API returns plain text by default
      responseType: 'text'
    });
    // Response is plain text
    return response.data;
  } catch (error) {
    if (error.response) {
      let errorMsg;
      if (typeof error.response.data === 'string') {
        errorMsg = error.response.data;
      } else if (error.response.data?.error) {
        errorMsg = error.response.data.error;
      } else {
        errorMsg = JSON.stringify(error.response.data);
      }
      console.error(`❌ Error fetching ${name}:`, error.response.status, errorMsg);
    } else {
      console.error(`❌ Error fetching ${name}:`, error.message);
    }
    throw error;
  }
}

/**
 * Fetch a secret with metadata (JSON format)
 */
async function getSecretWithMetadata(name) {
  try {
    const response = await axios.get(`${apiUrl}/${name}?format=json`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'APIVault-Test-Script/1.0',
        'Accept': 'application/json'
      }
    });
    // Response is JSON when format=json
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorMsg = typeof error.response.data === 'string' 
        ? error.response.data 
        : error.response.data?.error || JSON.stringify(error.response.data);
      console.error(`❌ Error fetching ${name}:`, error.response.status, errorMsg);
    } else {
      console.error(`❌ Error fetching ${name}:`, error.message);
    }
    throw error;
  }
}

/**
 * Main test function
 */
async function test() {
  console.log('🧪 Testing APIVault API Access\n');
  console.log(`API URL: ${apiUrl}`);
  console.log(`Token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}\n`);

  // List of secrets to test (modify based on your project)
  const secretsToTest = [
    'DATABASE_URL',
    'API_KEY',
    'JWT_SECRET',
  ];

  const results = {};

  // Test fetching secrets
  for (const secretName of secretsToTest) {
    try {
      console.log(`📦 Fetching ${secretName}...`);
      const value = await getSecret(secretName);
      results[secretName] = value;
      const preview = value && value.length > 20 ? `${value.substring(0, 20)}...` : (value || '(empty)');
      console.log(`   ✅ Success: ${preview}\n`);
    } catch (error) {
      console.log(`   ❌ Failed\n`);
      results[secretName] = null;
    }
  }

  // Test fetching with metadata
  console.log('📦 Fetching DATABASE_URL with metadata...');
  try {
    const metadata = await getSecretWithMetadata('DATABASE_URL');
    console.log('   ✅ Success:', JSON.stringify(metadata, null, 2), '\n');
  } catch (error) {
    console.log('   ❌ Failed\n');
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log('-'.repeat(50));
  const successCount = Object.values(results).filter(v => v !== null).length;
  const totalCount = Object.keys(results).length;
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}\n`);

  // Use secrets in your app
  if (successCount > 0) {
    console.log('💡 You can now use these secrets in your application:');
    console.log('-'.repeat(50));
    Object.entries(results).forEach(([name, value]) => {
      if (value) {
        console.log(`   process.env.${name} = '${value}';`);
      }
    });
    console.log('');
  }

  // Exit with error if any test failed
  if (successCount < totalCount) {
    console.error('❌ Some tests failed. Please check your configuration.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

// Run tests
test().catch(error => {
  console.error('❌ Test failed:', error.message);
  if (error.response) {
    console.error('Response:', error.response.status, error.response.data);
  }
  process.exit(1);
});

