import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;
  
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // If it's a hex string, convert it
  if (keyString.length === 64) {
    return Buffer.from(keyString, 'hex');
  }
  
  // Otherwise, derive key from string using PBKDF2
  return crypto.pbkdf2Sync(keyString, 'key-vault-salt', 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts a plaintext string using AES-256-CBC
 * @param plaintext - The text to encrypt
 * @returns Object containing encrypted data and IV
 */
export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypts an encrypted string using AES-256-CBC
 * @param encrypted - The encrypted hex string
 * @param iv - The initialization vector as hex string
 * @returns The decrypted plaintext
 */
export function decrypt(encrypted: string, iv: string): string {
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypts a secret value and returns the encrypted data as a single string
 * Format: iv:encrypted
 */
export function encryptSecret(plaintext: string): string {
  const { encrypted, iv } = encrypt(plaintext);
  return `${iv}:${encrypted}`;
}

/**
 * Decrypts a secret value from the encrypted string format
 * Format: iv:encrypted
 */
export function decryptSecret(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [iv, encrypted] = parts;
  return decrypt(encrypted, iv);
}

/**
 * Generates a secure random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Masks a secret value for display purposes
 * Shows first 4 and last 4 characters, masks the middle
 */
export function maskSecret(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }
  
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const middle = '*'.repeat(Math.max(4, value.length - visibleChars * 2));
  
  return `${start}${middle}${end}`;
}
