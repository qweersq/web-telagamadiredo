import CryptoJS from 'crypto-js';

// Secret key untuk encryption (bisa diubah sesuai kebutuhan)
const SECRET_KEY = 'katsikat-filter-storage-2025';

/**
 * Utility functions untuk menyimpan dan mengambil filter dari localStorage dengan hash encryption
 * Bisa digunakan secara dinamis di berbagai komponen
 */

/**
 * Encrypt data menggunakan AES encryption
 * @param {any} data - Data yang akan di-encrypt
 * @returns {string} - Encrypted string
 */
const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    
    if (!CryptoJS || !CryptoJS.AES) {
      console.error('❌ CryptoJS not available, using base64 fallback');
      return btoa(jsonString); // Fallback to base64
    }
    
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('❌ Error encrypting data:', error);
    // Fallback to base64 encoding
    try {
      const jsonString = JSON.stringify(data);
      return btoa(jsonString);
    } catch (fallbackError) {
      console.error('❌ Fallback encryption failed:', fallbackError);
      return null;
    }
  }
};

/**
 * Decrypt data menggunakan AES decryption
 * @param {string} encryptedData - Encrypted string
 * @returns {any} - Decrypted data
 */
const decryptData = (encryptedData) => {
  try {
    
    if (!CryptoJS || !CryptoJS.AES) {
      console.error('❌ CryptoJS not available, using base64 fallback');
      return JSON.parse(atob(encryptedData)); // Fallback to base64
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('❌ Error decrypting data:', error);
    // Fallback to base64 decoding
    try {
      return JSON.parse(atob(encryptedData));
    } catch (fallbackError) {
      console.error('❌ Fallback decryption failed:', fallbackError);
      return null;
    }
  }
};

/**
 * Generate hash key untuk filter storage
 * @param {string} componentName - Nama komponen (e.g., 'superapp-dashboard', 'payment-management')
 * @param {string} filterType - Tipe filter (e.g., 'date-filter', 'search-filter')
 * @returns {string} - Hash key
 */
const generateFilterKey = (componentName, filterType) => {
  const keyString = `${componentName}-${filterType}`;
  const hash = CryptoJS.SHA256(keyString).toString();
  return `filter_${hash.substring(0, 16)}`;
};

/**
 * Save filter data ke localStorage dengan encryption
 * @param {string} componentName - Nama komponen
 * @param {string} filterType - Tipe filter
 * @param {any} filterData - Data filter yang akan disimpan
 * @param {number} expirationHours - Expiration time dalam jam (default: 24 jam)
 * @returns {boolean} - Success status
 */
export const saveFilterToStorage = (componentName, filterType, filterData, expirationHours = 24) => {
  try {
    const key = generateFilterKey(componentName, filterType);
    const expirationTime = new Date().getTime() + (expirationHours * 60 * 60 * 1000);
    
    const dataToStore = {
      data: filterData,
      timestamp: new Date().getTime(),
      expiration: expirationTime,
      component: componentName,
      filterType: filterType
    };

    const encryptedData = encryptData(dataToStore);
    
    if (encryptedData) {
      localStorage.setItem(key, encryptedData);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error saving filter to storage:', error);
    return false;
  }
};

/**
 * Get filter data dari localStorage dengan decryption
 * @param {string} componentName - Nama komponen
 * @param {string} filterType - Tipe filter
 * @returns {any|null} - Filter data atau null jika tidak ada/expired
 */
export const getFilterFromStorage = (componentName, filterType) => {
  try {
    const key = generateFilterKey(componentName, filterType);
    const encryptedData = localStorage.getItem(key);
    
    if (!encryptedData) {
      return null;
    }

    const decryptedData = decryptData(encryptedData);
    
    if (!decryptedData) {
      return null;
    }

    // Check expiration
    const currentTime = new Date().getTime();
    if (currentTime > decryptedData.expiration) {
      localStorage.removeItem(key);
      return null;
    }

    return decryptedData.data;
  } catch (error) {
    console.error('❌ Error getting filter from storage:', error);
    return null;
  }
};

/**
 * Clear filter data dari localStorage
 * @param {string} componentName - Nama komponen
 * @param {string} filterType - Tipe filter
 * @returns {boolean} - Success status
 */
export const clearFilterFromStorage = (componentName, filterType) => {
  try {
    const key = generateFilterKey(componentName, filterType);
    localStorage.removeItem(key); 
    return true;
  } catch (error) {
    console.error('❌ Error clearing filter from storage:', error);
    return false;
  }
};

/**
 * Clear all filter data untuk komponen tertentu
 * @param {string} componentName - Nama komponen
 * @returns {boolean} - Success status
 */
export const clearAllFiltersForComponent = (componentName) => {
  try {
    const keys = Object.keys(localStorage);
    const componentKeys = keys.filter(key => key.startsWith('filter_'));
    
    let clearedCount = 0;
    componentKeys.forEach(key => {
      try {
        const encryptedData = localStorage.getItem(key);
        if (encryptedData) {
          const decryptedData = decryptData(encryptedData);
          if (decryptedData && decryptedData.component === componentName) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      } catch (error) {
        // Skip invalid keys
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing all filters for component:', error);
    return false;
  }
};

/**
 * Get all stored filters untuk komponen tertentu
 * @param {string} componentName - Nama komponen
 * @returns {Array} - Array of filter data
 */
export const getAllFiltersForComponent = (componentName) => {
  try {
    const keys = Object.keys(localStorage);
    const componentKeys = keys.filter(key => key.startsWith('filter_'));
    const filters = [];
    
    componentKeys.forEach(key => {
      try {
        const encryptedData = localStorage.getItem(key);
        if (encryptedData) {
          const decryptedData = decryptData(encryptedData);
          if (decryptedData && decryptedData.component === componentName) {
            // Check expiration
            const currentTime = new Date().getTime();
            if (currentTime <= decryptedData.expiration) {
              filters.push({
                filterType: decryptedData.filterType,
                data: decryptedData.data,
                timestamp: decryptedData.timestamp
              });
            } else {
              // Remove expired data
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        // Skip invalid keys
      }
    });
    
    return filters;
  } catch (error) {
    console.error('❌ Error getting all filters for component:', error);
    return [];
  }
};

/**
 * Check if filter data exists dan valid
 * @param {string} componentName - Nama komponen
 * @param {string} filterType - Tipe filter
 * @returns {boolean} - True jika filter exists dan valid
 */
export const hasValidFilter = (componentName, filterType) => {
  const filterData = getFilterFromStorage(componentName, filterType);
  return filterData !== null;
};

/**
 * Get filter data dengan default fallback
 * @param {string} componentName - Nama komponen
 * @param {string} filterType - Tipe filter
 * @param {any} defaultValue - Default value jika tidak ada filter
 * @returns {any} - Filter data atau default value
 */
export const getFilterWithDefault = (componentName, filterType, defaultValue) => {
  const filterData = getFilterFromStorage(componentName, filterType);
  return filterData !== null ? filterData : defaultValue;
};

// Export constants untuk easy access
export const FILTER_TYPES = {
  DATE_FILTER: 'date-filter',
  SEARCH_FILTER: 'search-filter',
  SEARCH: 'search',
  STATUS_FILTER: 'status-filter',
  PAYMENT_FILTER: 'payment-filter',
  CUSTOM_FILTER: 'custom-filter',
  COMPLEX_FILTER: 'complex-filter'
};

export const COMPONENT_NAMES = {
  SUPERAPP_DASHBOARD: 'superapp-dashboard',
  PAYMENT_MANAGEMENT: 'payment-management',
  TENANT_MANAGEMENT: 'tenant-management',
  USER_MANAGEMENT: 'user-management',
  SUBSCRIPTION_PLANS: 'subscription-plans',
  BERANDA_TEKNISI: 'beranda-teknisi',
  BERANDA_KURIR: 'beranda-kurir',
  BERANDA_KASIR: 'beranda-kasir',
  BERANDA_QC: 'beranda-qc',
  BERANDA_SUPERVISOR: 'beranda-supervisor',
  ANTRIAN_TEKNISI: 'antrian-teknisi',
  ANTRIAN_KASIR: 'antrian-kasir',
  ANTRIAN_KURIR: 'antrian-kurir',
  ORDER_DASHBOARD: 'order-dashboard'
};

/**
 * Test function untuk memastikan encryption berfungsi
 * @returns {boolean} - True jika encryption berfungsi
 */
export const testEncryption = () => {
  try {
    const testData = { test: 'data', number: 123 };
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    
    return JSON.stringify(testData) === JSON.stringify(decrypted);
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
};

/**
 * Debug function untuk melihat semua data di localStorage
 */
export const debugLocalStorage = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('filter_')) {
      const value = localStorage.getItem(key);
      try {
        const decrypted = decryptData(value);
      } catch (error) {
      }
    }
  });
};
