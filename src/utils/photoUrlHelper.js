/**
 * Utility function to handle photo URLs
 * Checks if URL already has protocol, if not, prepends the API base URL
 * Uses the same logic as api.js for consistency
 * 
 * @param {string} photoUrl - The photo URL from API
 * @returns {string} - Complete photo URL with protocol
 */
export const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return '';
  
  // Fix malformed URLs dengan double https:// (e.g., https://api.notasepatu.id/https://nos.wjv-1.neo.id/...)
  // Extract URL yang sebenarnya (yang kedua)
  if (photoUrl.includes('https://https://') || photoUrl.match(/https:\/\/[^/]+\/https:\/\//)) {
    // Extract URL setelah https:// yang kedua
    const match = photoUrl.match(/https:\/\/[^/]+\/(https:\/\/.+)/);
    if (match && match[1]) {
      photoUrl = match[1];
    }
  }
  
  // If URL already has protocol (http/https), return as is
  if (photoUrl.startsWith('http')) {
    // Kalau URL dari CDN / R2 / domain eksternal, kembalikan apa adanya
    if (photoUrl.includes('cloudinary.com') ||
        photoUrl.includes('imagekit.io') ||
        photoUrl.includes('neo.id') ||
        photoUrl.includes('notasepatu.id') ||
        photoUrl.includes('qweersq.my.id') ||
        photoUrl.includes('imgnotasepatu')) {
      return photoUrl;
    }
    // URL dari server lokal — ganti host dengan API host saat ini
    try {
      const parsed = new URL(photoUrl);
      const HOST = import.meta.env.VITE_API_HOST;
      const PORT = parseInt(import.meta.env.VITE_API_PORT);
      const apiBase = HOST?.includes('localhost') ? `${HOST}:${PORT}` : HOST;
      return `${apiBase}${parsed.pathname}`;
    } catch {
      return photoUrl;
    }
  }
  
  // Use the same logic as api.js for consistency
  const HOST = import.meta.env.VITE_API_HOST;
  const PORT = parseInt(import.meta.env.VITE_API_PORT);
  const API_URL = HOST?.includes('localhost') ? `${HOST}:${PORT}` : HOST;
  
  return `${API_URL}/${photoUrl}`;
};

/**
 * Transform array of photos to include complete URLs
 * 
 * @param {Array} photos - Array of photo objects
 * @param {string} urlField - Field name containing the URL (default: 'photo_url')
 * @returns {Array} - Array of photos with complete URLs
 */
export const transformPhotoUrls = (photos, urlField = 'photo_url') => {
  if (!photos || !Array.isArray(photos)) return [];
  
  return photos.map(photo => ({
    ...photo,
    [urlField]: getPhotoUrl(photo[urlField])
  }));
};

/**
 * Transform single photo object to include complete URL
 * 
 * @param {Object} photo - Photo object
 * @param {string} urlField - Field name containing the URL (default: 'photo_url')
 * @returns {Object} - Photo object with complete URL
 */
export const transformSinglePhotoUrl = (photo, urlField = 'photo_url') => {
  if (!photo) return null;
  
  return {
    ...photo,
    [urlField]: getPhotoUrl(photo[urlField])
  };
};
