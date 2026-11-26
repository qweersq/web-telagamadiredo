import { useState, useEffect } from 'react';
import instance from '../../../config/api';
import { getUserProfile } from '../../../utils/userProfileHelper';
import { formatCurrency } from '../../../utils/labelFormatter';

export const useInvoiceTemplate = (order) => {
  const [previewMessage, setPreviewMessage] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [availableVariables, setAvailableVariables] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch available variables
  const fetchAvailableVariables = async () => {
    try {
      const response = await instance.get('/invoice-templates/variables');
      if (response.data.success) {
        setAvailableVariables(response.data.data.variables);
      }
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  // Fetch current template
  const fetchTemplate = async (category) => {
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      
      const response = await instance.get(`/invoice-templates/template/${branchId}/${category}`);
      if (response.data.success) {
        setTemplateContent(response.data.data.template.template_content);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  // Save template
  const saveTemplate = async (content) => {
    setIsSaving(true);
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      
      // ✅ FIX: Determine category based on finalTotal (after discounts), not subtotal
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = order.summaryOrderDetails?.total || 0;
      
      // Calculate final total from payment.final_price (after all discounts)
      let finalTotal = subtotal;
      if (order.payment?.final_price != null) {
        finalTotal = Number(order.payment.final_price);
      } else {
        // Fallback: calculate from discounts if final_price not available
        let totalDiscount = 0;
        if (order.payment?.total_discount != null) {
          totalDiscount = Number(order.payment.total_discount);
        } else {
          // Calculate from individual discounts
          if (order.payment?.discount && order.payment.discount.type) {
            const paymentDiscount = order.payment.discount;
            const discVal = paymentDiscount.discount != null 
              ? Number(paymentDiscount.discount) 
              : Number(paymentDiscount.value) || 0;
            
            if (paymentDiscount.type === 'percent') {
              totalDiscount += Math.round(subtotal * (discVal / 100));
            } else if (paymentDiscount.type === 'nominal') {
              totalDiscount += discVal;
            }
          }
          if (order.payment?.membership_discount) {
            totalDiscount += Number(order.payment.membership_discount);
          }
          if (order.payment?.points_discount) {
            totalDiscount += Number(order.payment.points_discount);
          }
        }
        finalTotal = Math.max(0, subtotal - totalDiscount);
      }
      
      let category = 'invoice_unpaid';
      if (finalTotal === 0) {
        category = 'invoice_paid'; // Free service or fully discounted
      } else if (totalPaid >= finalTotal) {
        category = 'invoice_paid';
      } else if (totalPaid > 0) {
        category = 'invoice_dp';
      }
      
      const response = await instance.post(`/invoice-templates/branch/${branchId}`, {
        category: category,
        title: `Template ${category} - Branch ${branchId}`,
        description: `Template untuk ${category} branch ${branchId}`,
        template_content: content,
        variables: extractVariables(content),
        is_active: true
      });
      
      if (response.data.success) {
        alert('Template berhasil disimpan!');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Gagal menyimpan template: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview template
  const previewTemplate = async (content) => {
    try {
      const profile = await getUserProfile();
      // ✅ FIX: Calculate finalTotal (after discounts) instead of subtotal
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = order.summaryOrderDetails?.total || 0;
      
      // Calculate final total from payment.final_price (after all discounts)
      let finalTotal = subtotal;
      if (order.payment?.final_price != null) {
        finalTotal = Number(order.payment.final_price);
      } else {
        // Fallback: calculate from discounts if final_price not available
        let totalDiscount = 0;
        if (order.payment?.total_discount != null) {
          totalDiscount = Number(order.payment.total_discount);
        } else {
          // Calculate from individual discounts
          if (order.payment?.discount && order.payment.discount.type) {
            const paymentDiscount = order.payment.discount;
            const discVal = paymentDiscount.discount != null 
              ? Number(paymentDiscount.discount) 
              : Number(paymentDiscount.value) || 0;
            
            if (paymentDiscount.type === 'percent') {
              totalDiscount += Math.round(subtotal * (discVal / 100));
            } else if (paymentDiscount.type === 'nominal') {
              totalDiscount += discVal;
            }
          }
          if (order.payment?.membership_discount) {
            totalDiscount += Number(order.payment.membership_discount);
          }
          if (order.payment?.points_discount) {
            totalDiscount += Number(order.payment.points_discount);
          }
        }
        finalTotal = Math.max(0, subtotal - totalDiscount);
      }
      
      const remainingAmount = Math.max(0, finalTotal - totalPaid);
      
      const response = await instance.post('/invoice-templates/preview', {
        template_content: content,
        variables: {
          customer_name: order.customer?.name || '',
          tenant_name: profile?.tenant?.business_name || 'NotaSepatu',
          order_number: order.payment?.code || order.id || '',
          total_amount: formatCurrency(finalTotal), // ✅ Use finalTotal, not subtotal
          paid_amount: formatCurrency(totalPaid),
          remaining_amount: formatCurrency(remainingAmount), // ✅ Based on finalTotal
          total_payment: formatCurrency(totalPaid || finalTotal), // ✅ Use finalTotal
          invoice_url: order.invoiceUrl || '',
          greeting: getGreeting()
        }
      });
      
      if (response.data.success) {
        setPreviewMessage(response.data.data.processed_content);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  // Send invoice
  const sendInvoice = async () => {
    setIsSending(true);
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      
      const response = await instance.post('/send-by-order-id', {
        order_id: order.id,
        branch_id: branchId
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        alert('Invoice berhasil dikirim via WhatsApp!');
      } else {
        alert('Gagal mengirim invoice via WhatsApp');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Terjadi kesalahan saat mengirim invoice via WhatsApp');
    } finally {
      setIsSending(false);
    }
  };

  // Helper functions
  const extractVariables = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  useEffect(() => {
    fetchAvailableVariables();
  }, []);

  return {
    previewMessage,
    templateContent,
    availableVariables,
    editMode,
    setEditMode,
    fetchTemplate,
    saveTemplate,
    previewTemplate,
    sendInvoice,
    isSaving,
    isSending
  };
};
