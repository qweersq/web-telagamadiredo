import api from '../config/api';

const tenantStatsService = {
  // Get tab counts for tenant management
  getTabCounts: async () => {
    try {
      const response = await api.get('/tenants/stats/tab-counts');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get detailed tenant statistics
  getDetailedStats: async () => {
    try {
      const response = await api.get('/tenants/stats/detailed');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default tenantStatsService;
