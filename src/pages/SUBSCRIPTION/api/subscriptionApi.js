import instance from '../../../config/api';

export const subscriptionApi = {
  // Get current user's subscription status
  getMySubscriptionStatus: async () => {
    try {
      const response = await instance.get('/subscriptions/my-status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get available subscription plans
  getAvailablePlans: async () => {
    try {
      const response = await instance.get('/subscription-plans/available');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Submit payment proof
  submitPayment: async (paymentData) => {
    try {
      const formData = new FormData();
      formData.append('plan_id', paymentData.plan_id);
      formData.append('payment_method', paymentData.payment_method);
      formData.append('bank_name', paymentData.bank_name);
      formData.append('account_number', paymentData.account_number);
      formData.append('account_holder', paymentData.account_holder);
      formData.append('amount', paymentData.amount);
      formData.append('payment_proof', paymentData.payment_proof);
      formData.append('notes', paymentData.notes);

      const response = await instance.post('/auth/subscriptions/submit-payment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get subscription history
  getSubscriptionHistory: async () => {
    try {
      const response = await instance.get('/subscriptions/my-history');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user has pending payment
  checkPendingPayment: async () => {
    try {
      // Use route without middleware validation for suspended tenants
      const response = await instance.get('/subscriptions/check-pending-payment');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check pending payment simple - no authentication required
  checkPendingPaymentSimple: async (tenant_id) => {
    try {
      const response = await instance.get(`/auth/subscriptions/check-pending-simple?tenant_id=${tenant_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default subscriptionApi;
