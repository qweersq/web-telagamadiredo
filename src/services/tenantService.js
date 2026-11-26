import instance from '../config/api';

const tenantService = {
  // Get all tenants
  getAllTenants: async (params = {}) => {
    try {
      const response = await instance.get('/tenants', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tenant by ID
  getTenantById: async (id) => {
    try {
      const response = await instance.get(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new tenant
  createTenant: async (tenantData) => {
    try {
      const response = await instance.post('/tenants', tenantData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update tenant
  updateTenant: async (id, tenantData) => {
    try {
      const response = await instance.put(`/tenants/${id}`, tenantData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete tenant
  deleteTenant: async (id) => {
    try {
      const response = await instance.delete(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tenant dashboard
  getTenantDashboard: async (id) => {
    try {
      const response = await instance.get(`/tenants/${id}/dashboard`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tenant stats
  getTenantStats: async (id) => {
    try {
      const response = await instance.get(`/tenants/${id}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get trial tenants
  getTrialTenants: async () => {
    try {
      const response = await instance.get('/tenants/trial/expired');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get expired subscriptions
  getExpiredSubscriptions: async () => {
    try {
      const response = await instance.get('/tenants/subscriptions/expired');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update subscription status
  updateSubscriptionStatus: async (id, status) => {
    try {
      const response = await instance.put(`/tenants/${id}/subscription-status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Activate tenant
  activateTenant: async (id) => {
    try {
      const response = await instance.put(`/tenants/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Suspend tenant
  suspendTenant: async (id, reason = '') => {
    try {
      const response = await instance.put(`/tenants/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Extend trial
  extendTrial: async (id, days = 7) => {
    try {
      const response = await instance.put(`/tenants/${id}/extend-trial`, { days });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generate verification link for tenant
  generateVerificationLink: async (tenantId) => {
    try {
      const response = await instance.post(`/tenants/${tenantId}/generate-verification-link`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tab counts for SuperApp tenant list
  getTabCounts: async () => {
    try {
      const response = await instance.get('/tenants/stats/tab-counts');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default tenantService;
