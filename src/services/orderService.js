const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
import { getUserProfile } from '../utils/userProfileHelper';

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
    console.error('[ERROR] orderService - Failed to get userData from API:', error);
    return null;
  }
}

// Customer Service
export const customerService = {
  // Get all customers
  getCustomers: async () => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/customers?${queryString}` : `${API_BASE_URL}/customers`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (searchTerm) => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const response = await fetch(`${API_BASE_URL}/customers/search?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    try {
      const userData = await getUserData();
      
      // Add tenant_id and branch_id to customerData
      const dataWithTenant = {
        ...customerData,
        tenant_id: userData?.tenant_id || null,
        branch_id: userData?.branch_id || null
      };
      
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithTenant),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },
};

// Item Service
export const itemService = {
  // Get all items
  getItems: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/items`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Search items
  searchItems: async (searchTerm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  },

  // Create new item
  createItem: async (itemData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Upload item photos
  uploadPhotos: async (orderDetailId, photos) => {
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append('photos', photo.file);
      });

      const response = await fetch(`${API_BASE_URL}/order-details/${orderDetailId}/photos`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    }
  },
};

// Treatment Service
export const treatmentService = {
  // Get all treatments
  getTreatments: async () => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/treatments?${queryString}` : `${API_BASE_URL}/treatments`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching treatments:', error);
      throw error;
    }
  },

  // Get treatments by type
  getTreatmentsByType: async (typeItem) => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      params.append('type_item', typeItem);
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const response = await fetch(`${API_BASE_URL}/treatments?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching treatments by type:', error);
      throw error;
    }
  },
};

// Order Service
export const orderService = {
  // Get all orders
  getOrders: async () => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/orders?${queryString}` : `${API_BASE_URL}/orders`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/orders/${orderId}?${queryString}` : `${API_BASE_URL}/orders/${orderId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      const userData = await getUserData();
      
      // Add tenant_id and branch_id to orderData
      const dataWithTenant = {
        ...orderData,
        tenant_id: userData?.tenant_id || null,
        branch_id: userData?.branch_id || null
      };
      
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithTenant),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Create order with details
  createOrderWithDetails: async (orderData) => {
    try {
      const userData = await getUserData();
      
      // Step 1: Create order
      const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: orderData.customer.id,
          branch_id: userData?.branch_id || 1, // Use user's branch_id or default
          tenant_id: userData?.tenant_id || null, // Add tenant_id
          entry_date: orderData.entryDate,
          quantity: orderData.items.length,
          order_type: orderData.orderType,
        }),
      });
      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.data.id;

      // Step 2: Create order details for each item
      const orderDetailsPromises = orderData.items.map(async (item) => {
        // Create item if it doesn't exist
        let itemId = item.id;
        if (!item.existing) {
          const itemResponse = await fetch(`${API_BASE_URL}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: item.name,
              brand: item.brand,
              color: item.color,
              material: item.material,
            }),
          });
          const itemResult = await itemResponse.json();
          itemId = itemResult.data.id;
        }

        // Create order details for each treatment
        const treatmentPromises = (item.treatments || []).map(async (treatment) => {
          // Get userData untuk employee_id
          const userData = await getUserData();
          const employeeId = userData?.id || 1; // Fallback ke 1 jika tidak ada userData
          
          const orderDetailResponse = await fetch(`${API_BASE_URL}/order-details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order_id: orderId,
              employee_id: employeeId, // Gunakan employee_id dari userData
              treatment_id: treatment.treatment.id,
              item_id: itemId,
              price: treatment.price,
              discount_id: 1, // Default discount
              process_time: treatment.process_time,
              process_time_cost: treatment.process_time_cost,
              final_price: treatment.final_price,
              status: 'pending',
              due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next day
              description: treatment.description || '',
            }),
          });
          const orderDetailResult = await orderDetailResponse.json();

          // Upload photos if any
          if (item.photos && item.photos.length > 0) {
            await itemService.uploadPhotos(orderDetailResult.data.id, item.photos);
          }

          return orderDetailResult;
        });

        return Promise.all(treatmentPromises);
      });

      await Promise.all(orderDetailsPromises);

      return orderResult;
    } catch (error) {
      console.error('Error creating order with details:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
};

// Payment Service
export const paymentService = {
  // Create payment
  createPayment: async (paymentData) => {
    try {
      const userData = await getUserData();
      
      // Add tenant_id and branch_id to paymentData
      const dataWithTenant = {
        ...paymentData,
        tenant_id: userData?.tenant_id || null,
        branch_id: userData?.branch_id || null
      };
      
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithTenant),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment status
  updatePaymentStatus: async (paymentId, status) => {
    try {
      const userData = await getUserData();
      const params = new URLSearchParams();
      
      if (userData?.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      if (userData?.branch_id) {
        params.append('branch_id', userData.branch_id);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/payments/${paymentId}/status?${queryString}` : `${API_BASE_URL}/payments/${paymentId}/status`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },
};

export default {
  customerService,
  itemService,
  treatmentService,
  orderService,
  paymentService,
}; 