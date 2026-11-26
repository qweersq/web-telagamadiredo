import instance from '../../../config/api';

/**
 * API service untuk modal order list berdasarkan payment status dan service status
 */

/**
 * Get orders by payment status untuk modal
 * @param {string} status - Payment status (paid, unpaid, dp)
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Items per page (default: 50)
 * @param {string} params.search - Search term
 * @returns {Promise} API response
 */
export const getPaymentStatusOrders = async (status, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.search) queryParams.append('search', params.search);

    const url = `/orders/modal/payment-status/${status}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await instance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status orders:', error);
    throw error;
  }
};

/**
 * Get orders by service status untuk modal
 * @param {string} status - Service status (not_yet, antrian, on_progress, done, etc.)
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Items per page (default: 50)
 * @param {string} params.search - Search term
 * @returns {Promise} API response
 */
export const getServiceStatusOrders = async (status, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.search) queryParams.append('search', params.search);

    const url = `/orders/modal/service-status/${status}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await instance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching service status orders:', error);
    throw error;
  }
};

/**
 * Helper function untuk format date ke YYYY-MM-DD
 * @param {Date|string} date - Date object atau date string
 * @returns {string} Formatted date
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Helper function untuk build query parameters dari filter state
 * @param {Object} filterState - Current filter state
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Object} Query parameters
 */
export const buildQueryParams = (filterState, page = 1, pageSize = 50) => {
  const params = {
    page,
    pageSize
  };

  // Date range
  if (filterState.startDate) {
    params.startDate = formatDateForAPI(filterState.startDate);
  }
  if (filterState.endDate) {
    params.endDate = formatDateForAPI(filterState.endDate);
  }

  // Search term
  if (filterState.searchTerm && filterState.searchTerm.trim()) {
    params.search = filterState.searchTerm.trim();
  }

  return params;
};
