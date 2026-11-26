import instance from '../../../config/api';

// Create membership payment
export const createMembershipPayment = async (paymentData) => {
  try {
    console.log('🔍 createMembershipPayment - Sending data:', paymentData);
    
    const response = await instance.post('/membership-payments', paymentData);
    
    console.log('✅ createMembershipPayment - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ createMembershipPayment - Error:', error);
    throw error;
  }
};

// Get all membership payments
export const getMembershipPayments = async (params = {}) => {
  try {
    console.log('🔍 getMembershipPayments - Params:', params);
    
    const response = await instance.get('/membership-payments', { params });
    
    console.log('✅ getMembershipPayments - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getMembershipPayments - Error:', error);
    throw error;
  }
};

// Get membership payment by ID
export const getMembershipPaymentById = async (id) => {
  try {
    console.log('🔍 getMembershipPaymentById - ID:', id);
    
    const response = await instance.get(`/membership-payments/${id}`);
    
    console.log('✅ getMembershipPaymentById - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getMembershipPaymentById - Error:', error);
    throw error;
  }
};
