import { useEffect, useCallback } from 'react';
import { useOrderDetail } from '../context/OrderDetailContext';
import { transformApiToFETemplate, transformFETemplateToApi, calculateFinalPrice } from '../utils/orderTransformNew';
import { getOrderById, updateOrder } from '../api/orderApi';

export const useOrderDetailData = (orderId) => {
  const { state, actions, dispatch } = useOrderDetail();

  // Fetch order data
  const fetchOrderData = useCallback(async (force = false) => {
    if (!orderId) return;
    
    // Skip fetch if data already exists in state (unless forced)
    if (!force && state.id && state.id.toString() === orderId.toString()) {
      return;
    }
    
    try {
      actions.setLoading(true);
      actions.setError(null);
      
      const apiOrder = await getOrderById(orderId);
      
      if (apiOrder) {
        const feTemplate = transformApiToFETemplate(apiOrder);
        if (feTemplate) {
          actions.setOrderData(feTemplate);
        }
      }
    } catch (error) {
      console.error('[ERROR] useOrderDetailData - Failed to fetch order:', error);
      actions.setError(error.message || 'Gagal mengambil data order. Silakan coba lagi.');
    } finally {
      actions.setLoading(false);
    }
  }, [orderId, state.id, actions]);

  // Submit order data
  const submitOrderData = useCallback(async (orderDataToSubmit = null, silent = false) => {
    try {
      // Only set loading for non-silent saves (like main submit button)
      if (!silent) {
        actions.setLoading(true);
        actions.setError(null);
      }
      
      // Use provided data or fallback to state
      const dataToSubmit = orderDataToSubmit || state;
      
      const apiPayload = await transformFETemplateToApi(dataToSubmit);
      
      if (apiPayload) {
        const result = await updateOrder(dataToSubmit.id, apiPayload);

        // ✅ Sinkronkan state dengan data terbaru dari server.
        // PENTING: backend membuat baris order_detail BARU kalau payload masih
        // mengirim `id: 0` (item belum punya id). Kalau state tidak disinkronkan
        // setelah auto-save, item yang baru disimpan akan dikirim lagi dengan id 0
        // pada save berikutnya → backend membuat baris duplikat dan baris sebelumnya
        // di-soft-delete (nomor antrian tag ikut terbuang).
        if (result) {
          const refreshedData = transformApiToFETemplate(result);
          if (refreshedData) {
            // Pertahankan stepper yang sedang aktif (template selalu currentStep: 1)
            actions.setOrderData({
              ...refreshedData,
              currentStep: state.currentStep,
            });
          }
        }

        return result;
      } else {
        console.error('[DEBUG] useOrderDetailData - No API payload generated');
      }
    } catch (error) {
      console.error('[ERROR] useOrderDetailData - Failed to submit order:', error);
      if (!silent) {
        actions.setError(error.message || 'Gagal menyimpan order. Silakan coba lagi.');
      }
      throw error;
    } finally {
      // Only set loading false for non-silent saves
      if (!silent) {
        actions.setLoading(false);
      }
    }
  }, [state, actions]);

  // Calculate total from order details
  const calculateTotal = useCallback(() => {
    return state.order_details.reduce((total, group) => {
      const groupTotal = group.items.reduce((sum, item) => {
        // ✅ Always calculate manually using calculateFinalPrice for consistency
        const finalPrice = calculateFinalPrice(
          group.treatment?.price,
          group.discount,
          group.custom_price
        );
        
        return sum + finalPrice;
      }, 0);
      
      return total + groupTotal;
    }, 0);
  }, [state.order_details]);

  // Get grouped order details
  const groupedOrderDetails = state.order_details;

  // Get payment details
  const paymentDetails = state.payment?.payment_details || [];

  // Calculate payment totals
  const totalPaid = paymentDetails.reduce((sum, pd) => sum + Number(pd.amount), 0);
  const total = calculateTotal();
  const remaining = total - totalPaid;
  const isLunas = totalPaid >= total;
  const minDP = Math.ceil(total * 0.5);
  const isDPValid = totalPaid >= minDP;

  // Load data on mount
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Set loading to false if data already exists
  useEffect(() => {
    if (state.id && state.loading) {
      actions.setLoading(false);
    }
  }, [state.id, state.loading, actions]);

  return {
    // State
    orderData: state,
    loading: state.loading,
    error: state.error,
    currentStep: state.currentStep,
    
    // Calculated values
    total,
    totalPaid,
    remaining,
    isLunas,
    isDPValid,
    minDP,
    groupedOrderDetails,
    paymentDetails,
    
    // Actions
    actions,
    
    // Functions
    fetchOrderData,
    submitOrderData,
    calculateTotal
  };
}; 