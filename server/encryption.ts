import crypto from 'crypto';

// Encryption key MUST be set via environment variable
// Generate with: openssl rand -hex 32
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16; // GCM authentication tag length

// Validate encryption key on module load - fail fast if invalid
if (!ENCRYPTION_KEY) {
  console.error('CRITICAL: ENCRYPTION_KEY environment variable is not set. Encryption operations will fail.');
  console.error('Generate one with: openssl rand -hex 32');
  // Don't fail startup in development, but log prominently
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }
}

if (ENCRYPTION_KEY && ENCRYPTION_KEY.length !== 64) {
  const errorMsg = `CRITICAL: ENCRYPTION_KEY must be 64 hex characters (32 bytes). Current length: ${ENCRYPTION_KEY.length}. Generate with: openssl rand -hex 32`;
  console.error(errorMsg);
  // Fail fast if key is present but malformed
  throw new Error(errorMsg);
}

/**
 * Get validated encryption key as Buffer
 * @throws Error if ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Cannot perform encryption.');
  }
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error(`ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32`);
  }
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypt sensitive text using AES-256-GCM (authenticated encryption)
 * @param text The plaintext to encrypt
 * @returns Encrypted text in format: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV + authTag + encrypted data (format: iv:authTag:data)
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt text encrypted with the encrypt function
 * @param text The encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected format: iv:authTag:data');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if a string appears to be encrypted (has the iv:authTag:data format)
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text) return false;
  const parts = text.split(':');
  return parts.length === 3 && 
         parts[0].length === IV_LENGTH * 2 && 
         parts[1].length === AUTH_TAG_LENGTH * 2;
}
