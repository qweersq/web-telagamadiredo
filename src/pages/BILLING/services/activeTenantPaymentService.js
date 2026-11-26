import api from '../../../config/api';

const activeTenantPaymentService = {
  // Generate payment code for billing
  generatePaymentCode: async (billingId) => {
    try {
      const response = await api.post('/active-tenant-payment/generate-payment-code', {
        billing_id: billingId
      });
      return response.data;
    } catch (error) {
      console.error('Error generating payment code:', error);
      throw error;
    }
  },

  // Submit payment
  submitPayment: async (paymentData) => {
    try {
      const response = await api.post('/tenant-payments/submit-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  },

  // Get subscription status
  getSubscriptionStatus: async (tenantId) => {
    try {
      const response = await api.get(`/active-tenant-payment/status/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  },

  // Get upcoming billings
  getUpcomingBillings: async (tenantId) => {
    try {
      const response = await api.get(`/active-tenant-payment/upcoming/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming billings:', error);
      throw error;
    }
  },

  // Get subscription plans
  getSubscriptionPlans: async () => {
    try {
      const response = await api.get('/active-tenant-payment/subscription-plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  },

  // Check payment status
  checkPaymentStatus: async (tenantId, billingId) => {
    try {
      const response = await api.get(`/active-tenant-payment/check-payment/${tenantId}/${billingId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  // Get billing history
  getBillingHistory: async (tenantId) => {
    try {
      const response = await api.get(`/active-tenant-payment/history/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  }
};

export default activeTenantPaymentService;
