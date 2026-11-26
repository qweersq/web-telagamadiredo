import axiosInstance from '../config/api';

const subscriptionPlanService = {
  // Get all subscription plans
  getAllPlans: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/subscription-plans', {
        params: {
          search: params.search || '',
          is_active: params.is_active || ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  },

  // Get active subscription plans (public endpoint)
  getActivePlans: async () => {
    try {
      const response = await axiosInstance.get('/subscription-plans/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active subscription plans:', error);
      throw error;
    }
  },

  // Get subscription plan by ID
  getPlanById: async (id) => {
    try {
      const response = await axiosInstance.get(`/subscription-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      throw error;
    }
  },

  // Create new subscription plan
  createPlan: async (planData) => {
    try {
      const response = await axiosInstance.post('/subscription-plans', planData);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      throw error;
    }
  },

  // Update subscription plan
  updatePlan: async (id, planData) => {
    try {
      const response = await axiosInstance.put(`/subscription-plans/${id}`, planData);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  },

  // Toggle subscription plan status
  togglePlanStatus: async (id, isActive) => {
    try {
      const response = await axiosInstance.patch(`/subscription-plans/${id}/toggle-status`, {
        is_active: isActive
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling subscription plan status:', error);
      throw error;
    }
  },

  // Delete subscription plan
  deletePlan: async (id) => {
    try {
      const response = await axiosInstance.delete(`/subscription-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      throw error;
    }
  },

  // Get subscription plan statistics
  getPlanStats: async (id) => {
    try {
      const response = await axiosInstance.get(`/subscription-plans/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plan stats:', error);
      throw error;
    }
  }
};

export default subscriptionPlanService;
