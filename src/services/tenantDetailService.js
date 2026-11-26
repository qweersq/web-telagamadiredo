import api from '../config/api';

const tenantDetailService = {
  // Fetch detailed tenant information based on tab
  fetchTenantDetail: async (tenantId, activeTab) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/detail`, {
        params: { tab: activeTab }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant detail:', error);
      throw error;
    }
  },

  // Get tab-specific data for tenant
  getTabSpecificData: async (tenantId, activeTab) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/tab-data`, {
        params: { tab: activeTab }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tab-specific data:', error);
      throw error;
    }
  },

  // Get tenant usage statistics
  getUsageStats: async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/usage-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  },

  // Get tenant activity history
  getActivityHistory: async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/activity-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity history:', error);
      throw error;
    }
  }
};

// Export the main function for the modal
export const fetchTenantDetail = async (tenantId, activeTab) => {
  try {
    // Use new analytics API endpoint for comprehensive tenant details
    const response = await api.get(`/tenants/${tenantId}/analytics`);
    
    if (response.data.success) {
      const tenantData = response.data.data;
      
      // Format data for modal based on active tab
      const formattedData = {
        success: true,
        data: {
          // Basic tenant info
          id: tenantData.id,
          business_name: tenantData.business_name,
          owner_name: tenantData.owner_name,
          email: tenantData.email,
          phone: tenantData.phone,
          address: tenantData.address,
          city: tenantData.city,
          status: tenantData.status,
          subscription_status: tenantData.subscription_status,
          trial_end_date: tenantData.trial_end_date,
          is_verified: tenantData.is_verified,
          verified_at: tenantData.verified_at,
          created_at: tenantData.created_at,
          updated_at: tenantData.updated_at,
          
          // Relations
          branches: tenantData.branches,
          users: tenantData.users,
          subscriptions: tenantData.subscriptions,
          
          // Analytics data
          analytics: tenantData.analytics,
          
          // Tab-specific data based on activeTab
          ...getTabSpecificData(tenantData, activeTab)
        }
      };
      
      return formattedData;
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to fetch tenant details'
      };
    }
  } catch (error) {
    console.error('Error in fetchTenantDetail:', error);
    return {
      success: false,
      message: 'Failed to fetch tenant details'
    };
  }
};

// Helper function to get tab-specific data
const getTabSpecificData = (tenantData, activeTab) => {
  const analytics = tenantData.analytics || {};
  
  const baseData = {
    // Common data for all tabs
    created_at: tenantData.created_at,
    updated_at: tenantData.updated_at,
    analytics: analytics
  };

  switch (activeTab) {
    case 'unverified':
      return {
        ...baseData,
        verification_status: {
          is_verified: tenantData.is_verified,
          verified_at: tenantData.verified_at
        },
        onboarding_info: analytics.onboarding_info || {}
      };
      
    case 'active_trial':
      return {
        ...baseData,
        trial_info: {
          trial_end_date: tenantData.trial_end_date,
          days_remaining: tenantData.trial_end_date ? 
            Math.ceil((new Date(tenantData.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0
        },
        business_metrics: analytics.business_metrics || {},
        user_activity: analytics.user_activity || {},
        recent_activity: analytics.recent_activity || {}
      };
      
    case 'active':
      return {
        ...baseData,
        subscription_info: analytics.subscription_info || {},
        business_metrics: analytics.business_metrics || {},
        performance_metrics: analytics.performance_metrics || {},
        recent_activity: analytics.recent_activity || {}
      };
      
    case 'expired_trial':
      return {
        ...baseData,
        expiration_info: {
          trial_end_date: tenantData.trial_end_date,
          days_since_expired: tenantData.trial_end_date ? 
            Math.floor((new Date() - new Date(tenantData.trial_end_date)) / (1000 * 60 * 60 * 24)) : 0
        },
        business_metrics: analytics.business_metrics || {},
        recent_activity: analytics.recent_activity || {}
      };
      
    case 'expired_tenant':
      return {
        ...baseData,
        churn_info: {
          last_active: tenantData.updated_at,
          days_since_active: Math.floor((new Date() - new Date(tenantData.updated_at)) / (1000 * 60 * 60 * 24))
        },
        business_metrics: analytics.business_metrics || {},
        recent_activity: analytics.recent_activity || {}
      };
      
    default:
      return baseData;
  }
};

export default tenantDetailService;
