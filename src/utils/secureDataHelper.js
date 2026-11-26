import CryptoJS from 'crypto-js';

// Secret key untuk signature (harus sama dengan backend)
// 64 karakter untuk keamanan optimal (512 bit)
const SIGNATURE_SECRET = import.meta.env.VITE_SIGNATURE_SECRET || 'notaapp5740-secure-signature-2024-ultra-secure-key-for-hmac-sha256-encryption';

/**
 * Generate signature untuk data
 * @param {object} data - Data yang akan di-sign
 * @returns {string} - Signature
 */
const generateSignature = (data) => {
  const dataString = JSON.stringify(data);
  return CryptoJS.HmacSHA256(dataString, SIGNATURE_SECRET).toString();
};

/**
 * Verify signature
 * @param {object} data - Data yang akan di-verify
 * @param {string} signature - Signature yang diberikan
 * @returns {boolean} - True jika signature valid
 */
const verifySignature = (data, signature) => {
  try {
    const expectedSignature = generateSignature(data);
    return expectedSignature === signature;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
};

/**
 * Encrypt data dengan signature
 * @param {object} data - Data yang akan di-encrypt
 * @returns {string} - Encrypted data dengan signature
 */
export const encryptSecureData = (data) => {
  try {
    // Generate signature
    const signature = generateSignature(data);
    
    // Tambahkan signature ke data
    const dataWithSignature = {
      ...data,
      signature: signature,
      timestamp: Date.now()
    };
    
    // Encrypt data dengan signature menggunakan format yang sama dengan backend
    const dataString = JSON.stringify(dataWithSignature);
    // Use same key generation as backend: SHA256 hash of SIGNATURE_SECRET
    const key = CryptoJS.SHA256(SIGNATURE_SECRET);
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(dataString, key, { 
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // Convert to URL-safe Base64 untuk menghindari masalah URL
    let encryptedString = encrypted.toString();
    encryptedString = encryptedString.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    // Combine IV and encrypted data (format: iv|encrypted untuk menghindari konflik dengan Base64)
    const result = iv.toString(CryptoJS.enc.Hex) + '|' + encryptedString;
    
    console.log('🔐 Data encrypted with signature:', {
      originalData: data,
      signature: signature,
      encrypted: result.substring(0, 50) + '...'
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data dan verify signature
 * @param {string} encryptedData - Encrypted data
 * @returns {object|null} - Decrypted data jika valid, null jika tidak valid
 */
export const decryptSecureData = (encryptedData) => {
  try {
    console.log('🔍 Decrypting data:', encryptedData.substring(0, 50) + '...');
    
    // Decrypt data menggunakan format yang sama dengan backend
    const key = CryptoJS.SHA256(SIGNATURE_SECRET);
    const parts = encryptedData.split('|');
    
    if (parts.length !== 2) {
      console.error('❌ Invalid encrypted data format');
      return null;
    }
    
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    let encrypted = parts[1];
    
    // Convert from URL-safe Base64 back to regular Base64
    encrypted = encrypted.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (encrypted.length % 4) {
      encrypted += '=';
    }
    
    console.log('🔍 IV:', parts[0]);
    console.log('🔍 Encrypted length:', encrypted.length);
    
    const bytes = CryptoJS.AES.decrypt(encrypted, key, { 
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      console.error('❌ Failed to decrypt data - empty result');
      return null;
    }
    
    console.log('✅ Decrypted string length:', decryptedString.length);
    
    const dataWithSignature = JSON.parse(decryptedString);
    
    // Extract signature dan data
    const { signature, timestamp, ...originalData } = dataWithSignature;
    
    // Verify signature
    if (!verifySignature(originalData, signature)) {
      console.error('❌ Invalid signature');
      return null;
    }
    
    // Check timestamp (optional: expire after 1 hour)
    const now = Date.now();
    const dataAge = now - timestamp;
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    if (dataAge > maxAge) {
      console.error('❌ Data expired');
      return null;
    }
    
    console.log('✅ Data decrypted and verified:', {
      originalData: originalData,
      signature: signature,
      timestamp: new Date(timestamp).toISOString(),
      age: Math.round(dataAge / 1000) + ' seconds'
    });
    
    return originalData;
  } catch (error) {
    console.error('❌ Error decrypting data:', error);
    return null;
  }
};

/**
 * Generate secure URL parameter
 * @param {object} data - Data yang akan di-encrypt
 * @returns {string} - Encrypted data untuk URL
 */
export const generateSecureUrlParam = (data) => {
  const encrypted = encryptSecureData(data);
  // Encode untuk URL safety
  return encodeURIComponent(encrypted);
};

/**
 * Parse secure URL parameter
 * @param {string} encryptedParam - Encrypted parameter dari URL
 * @returns {object|null} - Decrypted data jika valid
 */
export const parseSecureUrlParam = (encryptedParam) => {
  try {
    // Decode dari URL
    const decoded = decodeURIComponent(encryptedParam);
    return decryptSecureData(decoded);
  } catch (error) {
    console.error('❌ Error parsing secure URL param:', error);
    return null;
  }
};

export default {
  encryptSecureData,
  decryptSecureData,
  generateSecureUrlParam,
  parseSecureUrlParam,
  verifySignature
};
