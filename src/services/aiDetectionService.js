import instance from '../config/api';

class AiDetectionService {
  /**
   * Detect items + recommended treatments from photos
   * @param {string[]} photos - Array of photo URLs
   * @param {Array<{id: number, name: string, price: number}>} treatments - Available treatments
   * @param {string} [userPrompt] - Optional user prompt for AI context
   * @returns {Promise<{items: Array, total_items: number}>}
   */
  static async detectItems(photos, treatments, userPrompt = '') {
    try {
      console.log('📡 AiDetectionService - detectItems:', {
        photosCount: photos?.length,
        firstPhoto: photos?.[0]?.substring(0, 80),
        treatmentsCount: treatments?.length,
      });

      const payload = { photos, treatments, user_prompt: userPrompt };
      const response = await instance.post('/ai/detect-items', payload);
      const { data } = response;

      if (data && data.success) {
        return data.data;
      }

      throw new Error(data?.error?.message || 'Invalid response format');
    } catch (error) {
      console.error('❌ AiDetectionService - detectItems error:',
        error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Detect item details only (no treatments) — for filling in existing order items
   * @param {string[]} photos - Array of photo URLs
   * @param {string} [userPrompt] - Optional user prompt
   * @returns {Promise<{items: Array, total_items: number}>}
   */
  static async detectItemDetails(photos, userPrompt = '') {
    try {
      console.log('📡 AiDetectionService - detectItemDetails:', {
        photosCount: photos?.length,
        firstPhoto: photos?.[0]?.substring(0, 80),
      });

      const payload = { photos, user_prompt: userPrompt };
      const response = await instance.post('/ai/detect-item-details', payload);
      const { data } = response;

      if (data && data.success) {
        return data.data;
      }

      throw new Error(data?.error?.message || 'Invalid response format');
    } catch (error) {
      console.error('❌ AiDetectionService - detectItemDetails error:',
        error.response?.data || error.message);
      throw error;
    }
  }
}

export default AiDetectionService;
