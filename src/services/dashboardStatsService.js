import api from '../config/api';

class DashboardStatsService {
  /**
   * Get optimized dashboard statistics (single API call)
   * Replaces multiple API calls with one efficient call
   */
  static async getDashboardStats() {
    try {
      console.log('🔍 DashboardStatsService.getDashboardStats - Fetching optimized dashboard stats');
      
      const response = await api.get('/superapp/billings/dashboard-stats');
      
      if (response.data.success) {
        console.log('✅ DashboardStatsService.getDashboardStats - Success:', response.data.data);
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.error('❌ DashboardStatsService.getDashboardStats - API Error:', response.data);
        return {
          success: false,
          error: response.data.message || 'Failed to fetch dashboard stats'
        };
      }
    } catch (error) {
      console.error('❌ DashboardStatsService.getDashboardStats - Network Error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error'
      };
    }
  }
}

export default DashboardStatsService;
