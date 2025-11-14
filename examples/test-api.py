#!/usr/bin/env python3
"""
APIVault API Access Test Script

Usage:
    export VAULT_TOKEN="your-api-key-token-here"
    python test-api.py

Or set it in a .env file and use python-dotenv
"""

import os
import sys
import requests
from typing import Optional, Dict

# Configuration
token = os.getenv('VAULT_TOKEN')
api_url = os.getenv('VAULT_API_URL', 'https://key-vault-new.onrender.com/api/v1')

if not token:
    print('❌ Error: VAULT_TOKEN environment variable is required', file=sys.stderr)
    print('   Set it with: export VAULT_TOKEN="your-api-key-token-here"', file=sys.stderr)
    sys.exit(1)


def get_secret(name: str) -> Optional[str]:
    """Fetch a secret from the vault."""
    try:
        response = requests.get(
            f"{api_url}/{name}",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "APIVault-Test-Script/1.0"
            }
        )
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        if hasattr(e, 'response') and e.response is not None:
            print(f'❌ Error fetching {name}: {e.response.status_code} {e.response.text}', file=sys.stderr)
        else:
            print(f'❌ Error fetching {name}: {e}', file=sys.stderr)
        return None


def get_secret_with_metadata(name: str) -> Optional[Dict]:
    """Fetch a secret with metadata (JSON format)."""
    try:
        response = requests.get(
            f"{api_url}/{name}?format=json",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "APIVault-Test-Script/1.0"
            }
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if hasattr(e, 'response') and e.response is not None:
            print(f'❌ Error fetching {name}: {e.response.status_code} {e.response.text}', file=sys.stderr)
        else:
            print(f'❌ Error fetching {name}: {e}', file=sys.stderr)
        return None


def main():
    print('🧪 Testing APIVault API Access\n')
    print(f'API URL: {api_url}')
    print(f'Token: {token[:8]}...{token[-4:]}\n')

    # List of secrets to test (modify based on your project)
    secrets_to_test = [
        'DATABASE_URL',
        'API_KEY',
        'JWT_SECRET',
    ]

    results = {}

    # Test fetching secrets
    for secret_name in secrets_to_test:
        print(f'📦 Fetching {secret_name}...')
        value = get_secret(secret_name)
        results[secret_name] = value
        if value:
            print(f'   ✅ Success: {value[:20]}...\n')
        else:
            print(f'   ❌ Failed\n')

    # Test fetching with metadata
    print('📦 Fetching DATABASE_URL with metadata...')
    metadata = get_secret_with_metadata('DATABASE_URL')
    if metadata:
        print('   ✅ Success:', metadata, '\n')
    else:
        print('   ❌ Failed\n')

    # Summary
    print('📊 Test Summary:')
    print('-' * 50)
    success_count = sum(1 for v in results.values() if v is not None)
    total_count = len(results)
    print(f'✅ Successful: {success_count}/{total_count}')
    print(f'❌ Failed: {total_count - success_count}/{total_count}\n')

    # Use secrets in your app
    if success_count > 0:
        print('💡 You can now use these secrets in your application:')
        print('-' * 50)
        for name, value in results.items():
            if value:
                print(f"   os.environ['{name}'] = '{value}'")
        print('')

    # Exit with error if any test failed
    if success_count < total_count:
        print('❌ Some tests failed. Please check your configuration.', file=sys.stderr)
        sys.exit(1)
    else:
        print('✅ All tests passed!')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Test interrupted by user', file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f'❌ Test failed: {e}', file=sys.stderr)
        sys.exit(1)

