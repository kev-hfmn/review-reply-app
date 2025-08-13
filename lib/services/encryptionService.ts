import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encryption service for securely storing sensitive user credentials
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16; // GCM standard

/**
 * Get encryption key from environment variables
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY environment variable is required');
  }
  
  // Convert hex string to buffer, or create from string
  if (key.length === 64) {
    // Assume it's a hex string
    return Buffer.from(key, 'hex');
  } else {
    // Create a hash from the string to get consistent 32-byte key
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest();
  }
}

/**
 * Encrypt a string value
 * @param text - Plain text to encrypt
 * @returns Encrypted data as hex string (iv:tag:encryptedData)
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return format: iv:tag:encryptedData (all in hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string value
 * @param encryptedData - Encrypted data in format iv:tag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt multiple fields in an object
 * @param data - Object with string values to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with specified fields encrypted
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (typeof result[field] === 'string' && result[field]) {
      result[field] = encrypt(result[field] as string);
    }
  }
  
  return result;
}

/**
 * Decrypt multiple fields in an object
 * @param data - Object with encrypted string values
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @returns Object with specified fields decrypted
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...data };
  let hasDecryptionFailure = false;
  
  for (const field of fieldsToDecrypt) {
    if (typeof result[field] === 'string' && result[field]) {
      try {
        result[field] = decrypt(result[field] as string);
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        hasDecryptionFailure = true;
      }
    }
  }
  
  // If any field failed to decrypt, throw an error so caller can handle fallback
  if (hasDecryptionFailure) {
    throw new Error('One or more fields failed to decrypt');
  }
  
  return result;
}

/**
 * Generate a new encryption key (for initial setup)
 * @returns 32-byte hex string suitable for CREDENTIALS_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate that encryption/decryption works correctly
 * @returns true if encryption service is working
 */
export function validateEncryption(): boolean {
  try {
    const testText = 'test-encryption-' + Date.now();
    const encrypted = encrypt(testText);
    const decrypted = decrypt(encrypted);
    return testText === decrypted;
  } catch {
    return false;
  }
}