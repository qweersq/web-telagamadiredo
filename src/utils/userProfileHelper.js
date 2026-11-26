import instance from '../config/api';
import { checkVersionFromProfile } from './versionChecker';

// Cache untuk menyimpan user profile data
let userProfileCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

/**
 * Mendapatkan user profile dari API get-profile
 * Menggunakan cache untuk menghindari multiple API calls
 */
export const getUserProfile = async () => {
  try {
    const now = Date.now();
    
    // Jika cache masih valid, return cache
    if (userProfileCache && (now - lastFetchTime) < CACHE_DURATION) {
      // console.log('📋 Using cached user profile');
      return userProfileCache;
    }
    
    // console.log('👤 Fetching user profile from API...');
    const response = await instance.get('/get-profile');
    const profileData = response.data.data;
    
    // Update cache
    userProfileCache = profileData;
    lastFetchTime = now;

    // Check version update dari data get-profile (fire-and-forget, tidak blocking return)
    // Hanya check jika user sudah login (ada token)
    const token = localStorage.getItem('token');
    if (token) {
      // Langsung cek dari profile data yang sudah didapat
      try {
        const versionResult = checkVersionFromProfile(profileData);
        if (versionResult && versionResult.hasUpdate) {
          console.log('✅ Version update available:', versionResult);
          // Store update info in sessionStorage to pass to App component
          sessionStorage.setItem('app_version_update', JSON.stringify(versionResult));
          // Trigger custom event to notify App component
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('appVersionUpdate', { detail: versionResult }));
          }
        }
      } catch (versionError) {
        console.error('❌ Error checking version:', versionError);
        // Silent fail - jangan ganggu flow utama
      }
    }
    
    return profileData;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    
    // Fallback ke localStorage jika API gagal
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        // console.log('⚠️ Using localStorage fallback for user data');
        return {
          user: userData,
          branch: null,
          tenant: null
        };
      }
    } catch (localStorageError) {
      console.error('❌ Error parsing localStorage userData:', localStorageError);
    }
    
    return null;
  }
};

/**
 * Mendapatkan user data saja (untuk backward compatibility)
 */
export const getUserData = async () => {
  const profile = await getUserProfile();
  return profile?.user || null;
};

/**
 * Mendapatkan branch data
 */
export const getBranchData = async () => {
  const profile = await getUserProfile();
  return profile?.branch || null;
};

/**
 * Mendapatkan tenant data
 */
export const getTenantData = async () => {
  const profile = await getUserProfile();
  return profile?.tenant || null;
};

/**
 * Mendapatkan shift data
 */
export const getShiftData = async () => {
  const profile = await getUserProfile();
  return profile?.shifts || null;
};

/**
 * Clear cache (untuk logout atau refresh data)
 */
export const clearUserProfileCache = () => {
  userProfileCache = null;
  lastFetchTime = 0;
  // console.log('🗑️ User profile cache cleared');
};

/**
 * Helper untuk mendapatkan branch_id
 */
export const getBranchId = async () => {
  const branch = await getBranchData();
  return branch?.id || null;
};

/**
 * Helper untuk mendapatkan tenant_id
 */
export const getTenantId = async () => {
  const tenant = await getTenantData();
  return tenant?.id || null;
};

/**
 * Helper untuk mendapatkan branch_name
 */
export const getBranchName = async () => {
  const branch = await getBranchData();
  return branch?.name || null;
};

/**
 * Label cabang yang sedang aktif, sama persis dengan yang tampil di
 * modal "Ganti Cabang" (LogoutButton).
 * Urutan sumber: profile.branch.name -> localStorage.selectedBranchName -> "Pilih Cabang".
 * Dipakai beranda & header agar teksnya tidak pernah beda.
 */
export const getCurrentBranchLabel = async () => {
  const name = await getBranchName();
  if (name) return name;

  try {
    const stored = localStorage.getItem('selectedBranchName');
    if (stored) return stored;
  } catch (error) {
    // localStorage bisa gagal (private mode) -> abaikan, pakai fallback
  }

  return 'Pilih Cabang';
};

/**
 * Helper untuk mendapatkan tenant business_name
 */
export const getTenantBusinessName = async () => {
  const tenant = await getTenantData();
  return tenant?.business_name || null;
};

/**
 * Helper untuk mendapatkan shift_id
 */
export const getShiftId = async () => {
  const shift = await getShiftData();
  return shift?.id || null;
};

/**
 * Helper untuk mendapatkan active shift_id (hanya jika shift masih aktif)
 */
export const getActiveShiftId = async () => {
  const shift = await getShiftData();
  // Hanya return shift_id jika shift masih aktif (end_time = null)
  return (shift?.end_time === null) ? shift?.id : null;
};

/**
 * Mendapatkan shift detail lengkap dari API
 * @param {number} shiftId - ID shift yang akan diambil detailnya
 * @returns {Promise<Object|null>} Shift detail lengkap atau null jika error
 */
export const getShiftDetail = async (shiftId) => {
  try {
    // console.log('🔍 getShiftDetail - Fetching shift detail for ID:', shiftId);
    
    const response = await instance.get(`/shifts/${shiftId}/detail`);
    
    if (response.data.success) {
      // console.log('✅ getShiftDetail - Shift detail fetched successfully');
      return response.data.data;
    } else {
      console.error('❌ getShiftDetail - API returned error:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ getShiftDetail - Error:', error.message);
    return null;
  }
};

/**
 * Mendapatkan shift detail lengkap dengan expenses dan account breakdown
 * @param {number} shiftId - ID shift yang akan diambil detailnya
 * @returns {Promise<Object|null>} Shift detail lengkap atau null jika error
 */
export const getShiftDetailFull = async (shiftId) => {
  try {
    // console.log('🔍 getShiftDetailFull - Fetching full shift detail for ID:', shiftId);
    
    const response = await instance.get(`/shifts/${shiftId}`);
    
    if (response.data.success) {
      // console.log('✅ getShiftDetailFull - Full shift detail fetched successfully');
      return response.data.data;
    } else {
      console.error('❌ getShiftDetailFull - API returned error:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ getShiftDetailFull - Error:', error.message);
    return null;
  }
};

/**
 * Invalidate cache - memaksa fetch ulang dari API
 */
export const invalidateUserProfileCache = () => {
  userProfileCache = null;
  lastFetchTime = 0;
  // console.log('🗑️ User profile cache invalidated');
};

/**
 * Switch branch untuk superadmin
 */
export const switchBranch = async (branchId) => {
  try {
    // console.log('🔄 Switching branch to:', branchId);
    
    const response = await instance.post('/switch-branch', {
      branch_id: branchId
    });
    
    // Invalidate cache setelah switch branch
    invalidateUserProfileCache();
    
    // console.log('✅ Branch switched successfully:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error switching branch:', error);
    throw error;
  }
};
