import instance from '../config/api';

// Cache untuk menyimpan billing validation data
let billingValidationCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 menit (lebih pendek dari user profile)

/**
 * Trigger billing validation API
 * Menggunakan cache untuk menghindari multiple API calls
 */
export const triggerBillingValidation = async () => {
  try {
    const now = Date.now();
    
    if (billingValidationCache && (now - lastFetchTime) < CACHE_DURATION) {
      return billingValidationCache;
    }
    
    const response = await instance.post('/billing/validate');
    const validationData = response.data.data;

    // Update cache
    billingValidationCache = validationData;
    lastFetchTime = now;
    
    
    return validationData;
  } catch (error) {
    console.error('❌ Error triggering billing validation:', error);
    return null;
  }
};

/**
 * Clear cache (untuk refresh data)
 */
export const clearBillingValidationCache = () => {
  billingValidationCache = null;
  lastFetchTime = 0;      
};

/**
 * Invalidate cache - memaksa trigger ulang dari API
 */
export const invalidateBillingValidationCache = () => {
  billingValidationCache = null;
  lastFetchTime = 0;
};
