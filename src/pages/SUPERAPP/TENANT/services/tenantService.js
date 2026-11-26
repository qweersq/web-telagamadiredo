import api from '../../../../config/api';

/**
 * Tenant Service - API calls for tenant management
 */

class TenantService {
  /**
   * Get tenant statistics for all tabs
   */
  async getStats() {
    try {
      const response = await api.get('/superapp/tenants/v2/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      throw error;
    }
  }

  /**
   * Get tenants by tab with pagination
   * @param {string} tab - Tab key (active_trial, expired_trial, active, expired_tenant)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  async getTenantsByTab(tab, page = 1, limit = 20) {
    try {
      const response = await api.get('/superapp/tenants/v2', {
        params: { tab, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  }

  /**
   * Get tenant detail by ID
   */
  async getTenantDetail(tenantId) {
    try {
      const response = await api.get(`/superapp/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant detail:', error);
      throw error;
    }
  }

  /**
   * Get tenant analytics
   */
  async getTenantAnalytics(tenantId) {
    try {
      const response = await api.get(`/tenants/${tenantId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant analytics:', error);
      throw error;
    }
  }

  /**
   * Extend trial period
   */
  async extendTrial(tenantId, days) {
    try {
      const response = await api.post(`/superapp/tenants/${tenantId}/extend-trial`, { days });
      return response.data;
    } catch (error) {
      console.error('Error extending trial:', error);
      throw error;
    }
  }

  /**
   * Recover expired tenant
   */
  async recoverTenant(tenantId) {
    try {
      const response = await api.post(`/superapp/tenants/${tenantId}/recover`);
      return response.data;
    } catch (error) {
      console.error('Error recovering tenant:', error);
      throw error;
    }
  }

  /**
   * Generate billing for tenant
   */
  async generateBilling(tenantId) {
    try {
      const response = await api.post(`/superapp/tenants/${tenantId}/generate-billing`);
      return response.data;
    } catch (error) {
      console.error('Error generating billing:', error);
      throw error;
    }
  }

  /**
   * Convert to paid subscription
   */
  async convertToPaid(tenantId, planId) {
    try {
      const response = await api.post(`/superapp/tenants/${tenantId}/convert-to-paid`, { plan_id: planId });
      return response.data;
    } catch (error) {
      console.error('Error converting to paid:', error);
      throw error;
    }
  }

  /**
   * Get latest billing for tenant (1 billing terakhir)
   */
  async getLatestBilling(tenantId) {
    try {
      const response = await api.get(`/tenant-payments/tenant/${tenantId}`, {
        params: { limit: 1, sort: 'desc' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching latest billing:', error);
      throw error;
    }
  }

  /**
   * Get all billings for tenant (history)
   */
  async getAllBillings(tenantId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/tenant-payments/tenant/${tenantId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  }

  /**
   * Validate billing for tenant (trigger auto-billing generation)
   */
  async validateBilling(tenantId) {
    try {
      const response = await api.post(`/billing/validate/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error validating billing:', error);
      throw error;
    }
  }

  /**
   * Get all subscription plans (for dropdown manual fix)
   */
  async getSubscriptionPlans() {
    try {
      const response = await api.get('/superapp/subscription-plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * Manual fix: Update active subscription (plan_id, end_date, price, final_price, notes)
   */
  async updateSubscription(subscriptionId, data) {
    try {
      const response = await api.put(`/superapp/subscriptions/${subscriptionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Manual fix: Update payment (status, paid_at)
   */
  async updatePayment(paymentId, data) {
    try {
      const response = await api.put(`/superapp/tenant-payments/${paymentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }
}

export default new TenantService();

