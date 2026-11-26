import instance from '../config/api';

class CustomerDetailApi {
  // Get customer detail summary
  static async getCustomerDetailSummary(customerId) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/detail`);
      return data;
    } catch (error) {
      console.error('Error fetching customer detail summary:', error);
      throw error;
    }
  }

  // Get customer payments with pagination
  static async getCustomerPayments(customerId, page = 1, limit = 10) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/payments`, {
        params: { page, limit }
      });
      return {
        data: {
          data: data.data.payments || [],
          pagination: data.data.pagination || {}
        }
      };
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      throw error;
    }
  }

  // Get customer orders with pagination
  static async getCustomerOrders(customerId, page = 1, limit = 10) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/orders`, {
        params: { page, limit }
      });
      return {
        data: {
          data: data.data.orders || [],
          pagination: data.data.pagination || {}
        }
      };
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  }

  // Get customer items and services with pagination
  static async getCustomerItemsServices(customerId, page = 1, limit = 20) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/items-services`, {
        params: { page, limit }
      });
      return {
        data: {
          data: data.data.items_services || [],
          pagination: data.data.pagination || {}
        }
      };
    } catch (error) {
      console.error('Error fetching customer items/services:', error);
      throw error;
    }
  }

  // Get customer follow-ups with pagination
  static async getCustomerFollowups(customerId, page = 1, limit = 10) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/follow-ups`, {
        params: { page, limit }
      });
      return {
        data: {
          data: data.data.follow_ups || [],
          pagination: data.data.pagination || {}
        }
      };
    } catch (error) {
      console.error('Error fetching customer follow-ups:', error);
      throw error;
    }
  }

  // Get customer shoe photos with pagination
  static async getCustomerShoesPhotos(customerId, page = 1, limit = 20) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/shoes-photos`, {
        params: { page, limit }
      });
      return {
        data: {
          data: data.data.photos || [],
          pagination: data.data.pagination || {}
        }
      };
    } catch (error) {
      console.error('Error fetching customer shoe photos:', error);
      throw error;
    }
  }

  // Get customer progress photos with pagination
  static async getCustomerProgressPhotos(customerId, page = 1, limit = 10) {
    try {
      const { data } = await instance.get(`/customers/${customerId}/progress-photos`, {
        params: { page, limit }
      });
      return {
        data: {
          data: data.data.order_details || [],
          pagination: data.data.pagination || {}
        }
      };
    } catch (error) {
      console.error('Error fetching customer progress photos:', error);
      throw error;
    }
  }
}

export default CustomerDetailApi;
