import instance from '../config/api';

class AiCreditService {
  /**
   * Get AI credit balance
   * @returns {Promise<{balance: number}>}
   */
  static async getBalance() {
    try {
      const { data } = await instance.get('/ai/credits/balance');
      if (data && data.success) {
        return data.data;
      }
      throw new Error(data?.error?.message || 'Failed to get balance');
    } catch (error) {
      console.error('❌ AiCreditService - Error getting balance:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get available credit packages
   * @param {string} [platform] - Optional: 'TRIPAY' | 'APP_STORE'
   * @returns {Promise<Array>}
   */
  static async getPackages(platform = null) {
    try {
      const params = {};
      if (platform) params.platform = platform;
      const { data } = await instance.get('/ai/credits/packages', { params });
      if (data && data.success) {
        return data.data;
      }
      throw new Error(data?.error?.message || 'Failed to get packages');
    } catch (error) {
      console.error('❌ AiCreditService - Error getting packages:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create Tripay invoice for AI credit purchase
   * @param {number} packageId - Package ID
   * @param {string} paymentMethod - Tripay payment method code
   * @returns {Promise<{checkout_url: string, reference: string, ...}>}
   */
  static async createTripayInvoice(packageId, paymentMethod) {
    try {
      const { data } = await instance.post('/ai/credits/tripay/invoice', {
        package_id: packageId,
        payment_method: paymentMethod,
      });
      if (data && data.success) {
        return data.data;
      }
      throw new Error(data?.error?.message || 'Failed to create invoice');
    } catch (error) {
      console.error('❌ AiCreditService - Error creating invoice:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get credit usage history
   * @returns {Promise<Array>}
   */
  static async getHistory() {
    try {
      const { data } = await instance.get('/ai/credits/transactions');
      if (data && data.success) {
        return data.data;
      }
      throw new Error(data?.error?.message || 'Failed to get history');
    } catch (error) {
      console.error('❌ AiCreditService - Error getting history:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default AiCreditService;
