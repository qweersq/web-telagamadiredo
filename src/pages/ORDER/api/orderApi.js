import instance from '../../../config/api';
import { getUserProfile } from '../../../utils/userProfileHelper';

// Helper function untuk mendapatkan userData dari API
async function getUserData() {
  try {
    const profile = await getUserProfile();
    if (!profile) return null;
    
    return {
      id: profile.user?.id,
      name: profile.user?.name,
      email: profile.user?.email,
      role: profile.user?.role,
      branch_id: profile.branch?.id,
      branch_name: profile.branch?.name,
      tenant_id: profile.tenant?.id,
      tenant_name: profile.tenant?.business_name
    };
  } catch (error) {
    console.error('[ERROR] orderApi - Failed to get userData from API:', error);
    return null;
  }
}

// Get orders list
export const getOrders = async (params) => {
  try {
    const userData = await getUserData();
    
    // Build API params - gunakan filter yang sudah dibuat di useOrderDashboardData
    const apiParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 10, // Default ke 10 untuk infinite scroll
    };

    // Add tenant_id and branch_id for data isolation
    if (userData?.tenant_id) {
      apiParams.tenant_id = userData.tenant_id;
    }
    if (userData?.branch_id) {
      apiParams.branch_id = userData.branch_id;
    }

    // Jika ada filter yang sudah dibuat, gunakan itu
    if (params.filter) {
      apiParams.filter = params.filter;
    } else {
      // Fallback: build filter object untuk backward compatibility
    const filter = {};
    // Search
    if (params.search) filter.search = params.search;
    // Date filter
    const dateFilterType = params.dateFilterType || 'entry_date';
    const startDate = params.startDate || '';
    const endDate = params.endDate || '';
    if (startDate && endDate) {
      filter[dateFilterType] = { gte: startDate, lte: endDate };
    } else if (startDate) {
      filter[dateFilterType] = startDate;
    }
    // Status filter (optional, for future extensibility)
    if (params.status && params.status !== 'all') {
      filter["order_details.status"] = params.status;
    }
    // Payment status filter (optional)
    if (params.paymentStatus && params.paymentStatus !== 'all') {
      filter["payment.status"] = params.paymentStatus;
    }
      apiParams.filter = JSON.stringify(filter);
    }
    
    // Endpoint baru sesuai dokumentasi
    const response = await instance.get('/orders-new-raw', { params: apiParams });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const userData = await getUserData();
    const params = {};
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    if (userData?.branch_id) {
      params.branch_id = userData.branch_id;
    }
    
    const response = await instance.get(`/orders/${orderId}`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Update order
export const updateOrder = async (orderId, orderData) => {
  try {
    const userData = await getUserData();
    
    // Add tenant_id and branch_id to orderData
    const dataWithTenant = {
      ...orderData,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null
    };
    
    const response = await instance.put(`/orders/${orderId}`, dataWithTenant);
    return response.data.data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// Get treatments
export const getTreatments = async () => {
  try {
    const userData = await getUserData();
    const params = {
      pageSize: 1000,
      is_active: true
    };

    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }

    const response = await instance.get(`/treatments`, { params });
    return response.data.data.treatments;
  } catch (error) {
    console.error('Error fetching treatments:', error);
    throw error;
  }
};

// Get discounts
export const getDiscounts = async () => {
  try {
    const userData = await getUserData();
    const params = {};
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    
    const response = await instance.get(`/discounts`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
};

// Search items
export const searchItems = async (searchTerm) => {
  try {
    const userData = await getUserData();
    const params = {
      search: searchTerm
    };
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    
    const response = await instance.get(`/items-search`, { params });
    // ✅ Fix: Extract items array from response.data.data
    return response.data.data.items || [];
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
};

// Create item
export const createItem = async (itemData) => {
  try {
    const userData = await getUserData();
    
    // Add tenant_id and branch_id to itemData
    const dataWithTenant = {
      ...itemData,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null
    };
    
    const response = await instance.post(`/items`, dataWithTenant);
    return response.data.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

// Delete order
export const deleteOrder = async (orderId) => {
  try {
    const response = await instance.delete(`/orders/${orderId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Create order
export const createOrder = async (orderData) => {
  try {
    const userData = await getUserData();
    
    // Add tenant_id and branch_id to orderData
    const dataWithTenant = {
      ...orderData,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null
    };
    
    const response = await instance.post(`/orders`, dataWithTenant);
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get customers
export const getCustomers = async () => {
  try {
    const userData = await getUserData();
    const params = {};
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    
    const response = await instance.get('/customers', { params });
    
    // Handle response format: bisa array langsung atau object dengan customers array
    let result = response.data.data;
    if (result && typeof result === 'object' && result.customers) {
      // Format dengan pagination: { customers: [...], pagination: {...} }
      return result.customers;
    } else if (Array.isArray(result)) {
      // Format array langsung
      return result;
    } else {
      // Fallback: return empty array
      return [];
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Search customers
export const searchCustomers = async (searchTerm) => {
  try {
    const userData = await getUserData();
    const params = {
      search: searchTerm
    };
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    
    const response = await instance.get('/customers/search', { params });
    // Backend returns array directly
    return response.data.data || [];
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

// Check customer by phone (for referral)
export const checkCustomerByPhone = async (phone) => {
  try {
    const userData = await getUserData();
    const params = {
      search: phone
    };
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    
    const response = await instance.get('/customers/search', { params });
    
    // Handle response format: bisa array langsung atau object dengan customers array
    let customers = [];
    if (Array.isArray(response.data.data)) {
      customers = response.data.data;
    } else if (response.data.data?.customers) {
      customers = response.data.data.customers;
    } else if (response.data.data && typeof response.data.data === 'object') {
      // Fallback: jika object tapi bukan array, coba ambil values
      customers = Object.values(response.data.data).filter(item => Array.isArray(item) ? item : false).flat();
    }
    
    // Find customer by exact phone match (with normalized formats)
    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    const foundCustomer = customers.find(c => {
      if (!c || !c.phone) return false;
      const customerPhone = String(c.phone).replace(/[^0-9]/g, '');
      // Check exact match or normalized formats (08XX, 628XX)
      return customerPhone === normalizedPhone || 
             customerPhone === normalizedPhone.replace(/^0/, '62') ||
             customerPhone === normalizedPhone.replace(/^62/, '0') ||
             customerPhone === normalizedPhone.replace(/^62/, '8') ||
             customerPhone.replace(/^0/, '62') === normalizedPhone ||
             customerPhone.replace(/^62/, '0') === normalizedPhone ||
             customerPhone.replace(/^62/, '8') === normalizedPhone;
    });
    
    return foundCustomer || null;
  } catch (error) {
    console.error('Error checking customer by phone:', error);
    // Return null instead of throw error untuk UX yang lebih baik
    return null;
  }
};

// Get customer referral stats
export const getCustomerReferralStats = async (customerId) => {
  try {
    const response = await instance.get(`/customers/${customerId}/referral-stats`);
    return response.data.data || { total_referrals: 0, total_revenue: 0, last_referral_date: null };
  } catch (error) {
    console.error('Error fetching customer referral stats:', error);
    return { total_referrals: 0, total_revenue: 0, last_referral_date: null };
  }
};

// Create customer
// Pelanggan default "Pelanggan Umum" untuk transaksi walk-in (tiket tanpa data pelanggan).
// Dibuat otomatis oleh backend jika belum ada, lalu di-cache per sesi.
let walkInCustomerCache = null;

export const getWalkInCustomer = async (forceRefresh = false) => {
  if (walkInCustomerCache && !forceRefresh) return walkInCustomerCache;

  try {
    const response = await instance.get('/customers/walk-in');
    const data = response.data.data;
    walkInCustomerCache = data || null;
    return walkInCustomerCache;
  } catch (error) {
    console.error('Error getting walk-in customer:', error);
    return null;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const userData = await getUserData();
    
    // Add tenant_id and branch_id to customerData
    const dataWithTenant = {
      ...customerData,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null
    };
    
    const response = await instance.post('/customers', dataWithTenant);
    return response.data.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update customer
export const updateCustomer = async (customerId, customerData) => {
  try {
    const userData = await getUserData();
    
    // Add tenant_id and branch_id to customerData
    const dataWithTenant = {
      ...customerData,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null
    };
    
    const response = await instance.put(`/customers/${customerId}`, dataWithTenant);
    return response.data.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const getOrderDetailStatusHistory = async (orderDetailId) => {
  try {
    const userData = await getUserData();
    const params = {};
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    
    const response = await instance.get(`/order-detail-status-log/${orderDetailId}/history`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching order detail status history:', error);
    throw error;
  }
};
