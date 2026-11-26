import api from '../../../config/api';

// Get encrypted data from localStorage
const getEncryptedData = () => {
  return localStorage.getItem('inactiveBillingEncryptedData');
};

// Create headers with encrypted data
const createHeaders = () => {
  const encryptedData = getEncryptedData();
  if (!encryptedData) {
    throw new Error('Encrypted data not found. Please login again.');
  }
  
  return {
    'Authorization': `Bearer ${encryptedData}`,
    'Content-Type': 'application/json'
  };
};

// Create headers for file upload
const createFileUploadHeaders = () => {
  const encryptedData = getEncryptedData();
  if (!encryptedData) {
    throw new Error('Encrypted data not found. Please login again.');
  }
  
  return {
    'Authorization': `Bearer ${encryptedData}`
  };
};

const inactiveBillingService = {
  /**
   * Get tenant status and subscription info
   * GET /inactive-tenants/status
   */
  getTenantStatus: async () => {
    try {
      const response = await api.get('/inactive-tenants/status', {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting tenant status:', error);
      throw error;
    }
  },

  /**
   * Get billing status and pending billings
   * GET /inactive-tenants/billing-status
   */
  getBillingStatus: async () => {
    try {
      const response = await api.get('/inactive-tenants/billing-status', {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting billing status:', error);
      throw error;
    }
  },

  /**
   * Get billing history with pagination
   * GET /inactive-tenants/billing-history
   */
  getBillingHistory: async (params = {}) => {
    try {
      const response = await api.get('/inactive-tenants/billing-history', {
        headers: createHeaders(),
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  },

  /**
   * Get available subscription plans
   * GET /inactive-tenants/subscription-plans
   */
  getSubscriptionPlans: async () => {
    try {
      const response = await api.get('/inactive-tenants/subscription-plans');
      return response.data;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      throw error;
    }
  },

  /**
   * Change subscription plan
   * POST /inactive-tenants/change-plan
   */
  changePlan: async (planId, notes = '') => {
    try {
      const response = await api.post('/inactive-tenants/change-plan', {
        plan_id: planId,
        notes: notes
      }, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  },

  /**
   * Generate unique payment code
   * POST /inactive-tenants/generate-payment-code
   */
  generatePaymentCode: async (billingId) => {
    try {
      const response = await api.post('/inactive-tenants/generate-payment-code', {
        billing_id: billingId
      }, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error generating payment code:', error);
      throw error;
    }
  },

  /**
   * Submit payment proof
   * POST /inactive-tenants/submit-payment
   */
  submitPayment: async (paymentData) => {
    try {
      const response = await api.post('/inactive-tenants/submit-payment', paymentData, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  },

  /**
   * Check payment status
   * GET /inactive-tenants/payment-status/:billing_id
   */
  checkPaymentStatus: async (billingId) => {
    try {
      const response = await api.get(`/inactive-tenants/payment-status/${billingId}`, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  /**
   * Refresh all data
   */
  refreshAllData: async () => {
    try {
      const [tenantStatus, billingStatus, plans] = await Promise.all([
        inactiveBillingService.getTenantStatus(),
        inactiveBillingService.getBillingStatus(),
        inactiveBillingService.getSubscriptionPlans()
      ]);

      return {
        tenantInfo: tenantStatus.data,
        unpaidBills: billingStatus.data.unpaid || [],
        pendingBills: billingStatus.data.pending || [],
        availablePlans: plans.data || []
      };
    } catch (error) {
      console.error('Error refreshing all data:', error);
      throw error;
    }
  },

  /**
   * Check if encrypted data is valid
   */
  isAuthenticated: () => {
    const encryptedData = getEncryptedData();
    return !!encryptedData;
  },

  /**
   * Clear encrypted data (logout)
   */
  logout: () => {
    localStorage.removeItem('inactiveBillingEncryptedData');
  },

  // ========================================
  // TRIPAY PAYMENT METHODS
  // ========================================

  /**
   * Get available payment channels
   * GET /inactive-tenants/tripay/channels
   */
  getPaymentChannels: async () => {
    try {
      const response = await api.get('/inactive-tenants/tripay/channels', {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payment channels:', error);
      throw error;
    }
  },

  /**
   * Create Tripay transaction
   * POST /inactive-tenants/tripay/create-transaction
   */
  createTransaction: async (transactionData) => {
    try {
      const response = await api.post('/inactive-tenants/tripay/create-transaction', transactionData, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  /**
   * Check transaction status
   * GET /inactive-tenants/tripay/status/:reference
   */
  checkTransactionStatus: async (reference) => {
    try {
      const response = await api.get(`/inactive-tenants/tripay/status/${reference}`, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  },

  /**
   * Manual check and update transaction status
   * POST /inactive-tenants/tripay/check-status/:billing_id
   */
  manualCheckStatus: async (billingId) => {
    try {
      const response = await api.post(`/inactive-tenants/tripay/check-status/${billingId}`, {}, {
        headers: createHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
};

export { inactiveBillingService };
