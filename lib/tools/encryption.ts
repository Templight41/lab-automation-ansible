import crypto from 'crypto';
import assert from 'assert';

const algorithm = 'aes-256-cbc';


// Key must be 32 bytes for aes-256
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  assert(key, 'ENCRYPTION_KEY environment variable must be set');
  return crypto.scryptSync(key, 'salt', 32);
};

/**
 * Encrypts data using AES-256
 * @param data - String data to encrypt
 * @returns Object containing encrypted data and initialization vector
 */
export const encrypt = (data: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  
  const encryptedData = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);

  return {
    iv: iv.toString('hex'),
    encryptedData: encryptedData.toString('hex')
  };
};

/**
 * Decrypts data using AES-256
 * @param encryptedData - Hex string of encrypted data
 * @param iv - Hex string of initialization vector
 * @returns Decrypted string
 */
export const decrypt = (encryptedData: string, iv: string) => {
  const decipher = crypto.createDecipheriv(
    algorithm, 
    getKey(),
    Buffer.from(iv, 'hex')
  );

  const decryptedData = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final()
  ]);

  return decryptedData.toString('utf8');
};
