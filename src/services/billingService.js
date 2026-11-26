import axiosInstance from '../config/api';

const billingService = {
  // Generate manual billing by admin
  generateManualBilling: async (billingData) => {
    try {
      const response = await axiosInstance.post('/billing/generate-manual', billingData);
      return response.data;
    } catch (error) {
      console.error('Error generating manual billing:', error);
      throw error;
    }
  },

  // Generate initial billing for new subscription
  generateInitialBilling: async (subscriptionId) => {
    try {
      const response = await axiosInstance.post('/billing/generate-initial', {
        subscription_id: subscriptionId
      });
      return response.data;
    } catch (error) {
      console.error('Error generating initial billing:', error);
      throw error;
    }
  },

  // Record payment from tenant
  recordPayment: async (billingId, paymentData) => {
    try {
      const response = await axiosInstance.post(`/billing/${billingId}/record-payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Admin confirm payment
  confirmPayment: async (billingId, adminNotes = null) => {
    try {
      const response = await axiosInstance.patch(`/billing/${billingId}/confirm-payment`, {
        admin_notes: adminNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Get billing statistics
  getBillingStats: async () => {
    try {
      const response = await axiosInstance.get('/billing/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      throw error;
    }
  },

  // Get tab statistics for billing management
  getTabStats: async () => {
    try {
      console.log('🔍 billingService.getTabStats - Fetching tab statistics');
      const response = await axiosInstance.get('/tenant-payments/stats/tabs');
      console.log('✅ billingService.getTabStats - Full Response:', response.data);
      console.log('✅ billingService.getTabStats - Data:', response.data.data);
      return response.data; // Return the full response, frontend will access .data
    } catch (error) {
      console.error('❌ Error fetching tab stats:', error);
      throw error;
    }
  },

  // Get reactivation info for suspended tenant
  getReactivationInfo: async () => {
    try {
      console.log('🔍 billingService.getReactivationInfo - Fetching reactivation info');
      const response = await axiosInstance.get('/reactivation/info');
      console.log('✅ billingService.getReactivationInfo - Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching reactivation info:', error);
      throw error;
    }
  },

  // Reactivate suspended tenant
  reactivateTenant: async (planId, paymentMethod) => {
    try {
      console.log('🔍 billingService.reactivateTenant - Reactivating tenant:', { planId, paymentMethod });
      const response = await axiosInstance.post('/reactivation/reactivate', {
        plan_id: planId,
        payment_method: paymentMethod
      });
      console.log('✅ billingService.reactivateTenant - Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error reactivating tenant:', error);
      throw error;
    }
  }
};

export default billingService;
