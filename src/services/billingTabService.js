import api from '../config/api';

/**
 * Service untuk API billing per tab
 * Menggunakan dedicated endpoints untuk performa yang lebih baik
 */

// Mapping tab ke endpoint
const TAB_ENDPOINTS = {
  unpaid: '/superapp/billings/unpaid',
  failed: '/superapp/billings/failed', 
  pending: '/superapp/billings/pending',
  paid: '/superapp/billings/paid',
  cancelled: '/superapp/billings/cancelled',
  refunded: '/superapp/billings/refunded'
};

/**
 * Fetch billings untuk tab tertentu
 * @param {string} tabKey - Key tab (unpaid, failed, pending, paid, cancelled, refunded)
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Response data
 */
export const fetchBillingsByTab = async (tabKey, params = {}) => {
  try {
    const endpoint = TAB_ENDPOINTS[tabKey];
    if (!endpoint) {
      throw new Error(`Invalid tab key: ${tabKey}`);
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      sort_by = 'createdAt',
      sort_order = 'DESC',
      start_date = '',
      end_date = ''
    } = params;

    const response = await api.get(endpoint, {
      params: {
        page,
        limit,
        search,
        sort_by,
        sort_order,
        start_date,
        end_date
      }
    });

    return {
      success: true,
      data: response.data.data || [],
      pagination: response.data.pagination || {},
      stats: response.data.stats || {}
    };
  } catch (error) {
    console.error(`Error fetching ${tabKey} billings:`, error);
    return {
      success: false,
      data: [],
      pagination: {},
      stats: {},
      error: error.message
    };
  }
};

/**
 * Fetch semua tab stats sekaligus untuk performa yang lebih baik
 * @returns {Promise<object>} Stats untuk semua tab
 */
export const fetchAllTabStats = async () => {
  try {
    const promises = Object.keys(TAB_ENDPOINTS).map(tabKey => 
      fetchBillingsByTab(tabKey, { page: 1, limit: 1 })
    );

    const results = await Promise.all(promises);
    
    const stats = {};
    Object.keys(TAB_ENDPOINTS).forEach((tabKey, index) => {
      const result = results[index];
      stats[tabKey] = {
        count: result.stats.count || 0,
        total_amount: result.stats.total_amount || 0
      };
    });

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error fetching all tab stats:', error);
    return {
      success: false,
      stats: {},
      error: error.message
    };
  }
};

// Cache management removed - using component state instead
