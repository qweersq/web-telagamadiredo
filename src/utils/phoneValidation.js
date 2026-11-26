/**
 * Phone Validation utilities
 */

/**
 * Validate a full phone string (output from PhoneInputWithCountry)
 * e.g. "+628123456789"
 */
export const validateFullPhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Nomor telepon wajib diisi';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return 'Nomor telepon terlalu pendek';
  return null; // valid
};

/**
 * Validate phone number - basic validation, no 08... allowed
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: 'Nomor telepon wajib diisi'
    };
  }

  // Remove spaces and special characters except +
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  // Check if empty after cleaning
  if (cleaned === '') {
    return {
      isValid: false,
      error: 'Format nomor telepon tidak valid'
    };
  }

  // Check if starts with 08 (not allowed)
  if (cleaned.startsWith('08')) {
    return {
      isValid: false,
      error: 'Gunakan format +628xxxxxxxxx atau 628xxxxxxxxx'
    };
  }

  // Check if starts with 8 (not allowed)
  if (cleaned.startsWith('8') && !cleaned.startsWith('+')) {
    return {
      isValid: false,
      error: 'Gunakan format +628xxxxxxxxx atau 628xxxxxxxxx'
    };
  }

  // Basic length check (minimum 7 digits)
  const digitsOnly = cleaned.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 7) {
    return {
      isValid: false,
      error: 'Nomor telepon terlalu pendek'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Get phone placeholder text
 */
export const getPhonePlaceholder = () => {
  return 'Contoh: +628123456789 atau 628123456789';
};

/**
 * Clean phone number to normalized format (62XXXXXXXXX)
 * @param {string} phone - Phone number to clean
 * @returns {string} - Cleaned phone number
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Convert to string and trim
  let cleaned = String(phone).trim();
  
  // Remove spaces, dashes, parentheses
  cleaned = cleaned.replace(/[\s\-\(\)]/g, '');
  
  // Handle +62 prefix before removing non-digits
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.replace('+', '');
  }
  
  // Remove all non-digit characters
  cleaned = cleaned.replace(/[^0-9]/g, '');
  
  // Normalize Indonesian phone number to 62XXXXXXXXX format
  if (cleaned.startsWith('08')) {
    // 08XX → 628XX
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8') && cleaned.length >= 9) {
    // 8XX → 628XX (if at least 9 digits)
    cleaned = '62' + cleaned;
  } else if (cleaned.startsWith('62')) {
    // Already in 62XX format, keep as is
  } else if (cleaned.length >= 9) {
    // If doesn't start with 0, 8, or 62 but has enough digits, assume it's missing country code
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
};
