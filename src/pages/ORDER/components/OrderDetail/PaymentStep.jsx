import React, { useState, useMemo, useEffect } from 'react';
import { X, CreditCard, DollarSign, QrCode, Trash2, Plus, Tag, FileText, Edit2, Coins, Info, AlertCircle, Calendar } from 'lucide-react';
import { useOrderDetail } from '../../context/OrderDetailContext';
import AnimatedButton from '../../../../components/Design/AnimatedButton';
import { useCurrentUserRole } from '../../../../utils/roleValidator';
import AddPaymentModal from '../../../../components/QuickInput/AddPaymentModal';
import QuickOrderDiscountModal from '../../../../components/QuickInput/QuickOrderDiscountModal';
import { getActiveShiftId } from '../../../../utils/userProfileHelper';
import { getDiscounts } from '../../api/orderApi';
import {
  formatCurrency,
  formatNumber,
  formatPaymentMethod,
  getPaymentMethodIcon,
  getPaymentMethodColors,
  formatPaymentStatus,
  calculatePaymentStatus,
  getPaymentStatusColors,
  PAYMENT_STATUS
} from '../../../../utils/labelFormatter';
import { calculateTotalWithPaymentDiscount } from '../../utils/orderTransformNew';
import instance from '../../../../config/api';

// Helper function untuk payment display menggunakan formatter
const getPaymentIconComponent = (accountType, method) => {
  // Gunakan accountType jika ada, fallback ke method
  const paymentMethod = accountType || method;
  const iconName = getPaymentMethodIcon(paymentMethod);
  switch (iconName) {
    case 'DollarSign':
      return <DollarSign className="w-4 h-4" />;
    case 'QrCode':
      return <QrCode className="w-4 h-4" />;
    case 'CreditCard':
      return <CreditCard className="w-4 h-4" />;
    default:
      return <DollarSign className="w-4 h-4" />;
  }
};

const getPaymentLabel = (paymentMethodName, accountName, accountType, method) => {
  // Debug logging untuk melihat data yang diterima
  console.log('[DEBUG] getPaymentLabel - paymentMethodName:', paymentMethodName, 'accountName:', accountName, 'accountType:', accountType, 'method:', method);

  // Priority 1: Jika ada payment method name dari database, gunakan itu
  if (paymentMethodName && paymentMethodName.trim() !== '') {
    console.log('[DEBUG] ✅ Using paymentMethodName:', paymentMethodName);
    return paymentMethodName;
  }

  // Priority 2: Jika ada account name yang spesifik dari database, gunakan itu
  if (accountName && accountName.trim() !== '') {
    console.log('[DEBUG] ✅ Using accountName:', accountName);
    return accountName;
  }

  // Priority 3: Jika ada account_type dari database, format menggunakan formatter
  if (accountType && accountType.trim() !== '') {
    const formattedMethod = formatPaymentMethod(accountType);
    console.log('[DEBUG] ✅ Using accountType:', accountType, 'formatted:', formattedMethod);
    return formattedMethod;
  }

  // Priority 4: Fallback ke method jika account_type tidak ada (untuk data lama)
  if (method && method.trim() !== '') {
    const formattedMethod = formatPaymentMethod(method);
    console.log('[DEBUG] ⚠️ Using method fallback:', method, 'formatted:', formattedMethod);
    return formattedMethod;
  }

  console.log('[DEBUG] ❌ All fields empty, returning "Tidak Diketahui"');
  return 'Tidak Diketahui';
};

// Format tanggal Indonesia dengan hari
const formatPaymentDate = (dateString) => {
  console.log('[DEBUG] formatPaymentDate - dateString:', dateString);
  if (!dateString) return '';

  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

const PaymentStep = ({ total, discounts = [], submitOrderData = null, fetchOrderData = null }) => {
  const { state, actions } = useOrderDetail();
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [paymentToEditDate, setPaymentToEditDate] = useState(null);
  const [newPaymentDate, setNewPaymentDate] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [localDiscounts, setLocalDiscounts] = useState(discounts);
  const [pointsSettings, setPointsSettings] = useState({ enabled: false, redeem_rate: 50, min_redeem: 100, earn_rate: 1000, referral_bonus_new_customer: 0, first_order_bonus: 10, first_order_bonus_enabled: true }); // Default: disabled, 50 (100 poin = Rp 5.000), min_redeem: 100, earn_rate: 1000
  const [bonusPointsFromTransactions, setBonusPointsFromTransactions] = useState({ firstOrder: 0, referral: 0 }); // ✅ Bonus points from actual transactions (for paid orders)

  // Get current user role
  const { userRole } = useCurrentUserRole();
  const isSuperAdmin = userRole === 'superadmin';

  // Get payment data from context
  const payment = state.payment;
  const paymentDetails = payment?.payment_details || [];
  const paymentDiscount = payment?.discount || null; // Payment-level discount
  const paymentNotes = payment?.notes || ''; // Payment notes
  const pointsToRedeemFromAPI = payment?.points_to_redeem || 0; // Points to redeem from API
  const pointsDiscountFromAPI = Number(payment?.points_discount || 0); // Points discount from API

  // Get customer points
  const customerPoints = state.customer?.points ?? 0;
  const customerLifetimePoints = state.customer?.lifetime_points ?? 0;

  // Get customer and referral data for points calculation
  const customer = state.customer;
  const referredByPhone = state.referred_by_phone;
  const referrer = state.referrer; // ✅ Referrer object (jika ada, berarti order pakai referral)

  // ✅ FIX: Calculate points_to_redeem from points_discount if points_discount > 0 but points_to_redeem = 0
  // This matches mobile logic and FE transform logic
  const pointsToRedeem = useMemo(() => {
    // Jika points_discount dari API > 0 tapi points_to_redeem = 0, hitung reverse
    if (pointsDiscountFromAPI > 0 && pointsToRedeemFromAPI === 0 && pointsSettings.redeem_rate > 0) {
      const redeemRateValue = pointsSettings.redeem_rate * 100; // Convert to rupiah per 100 points
      const calculatedPointsToRedeem = Math.round((pointsDiscountFromAPI / redeemRateValue) * 100);
      console.log('🔄 PaymentStep - Reverse calculating points_to_redeem:', {
        pointsDiscountFromAPI,
        redeemRateValue,
        calculatedPointsToRedeem,
      });
      return calculatedPointsToRedeem;
    }
    return pointsToRedeemFromAPI;
  }, [pointsToRedeemFromAPI, pointsDiscountFromAPI, pointsSettings.redeem_rate]);

  // ✅ FIX: Reset checkbox jika pointsToRedeem di-reset dari luar, atau set true jika ada points_discount dari API
  useEffect(() => {
    // Set usePoints to true if points_discount from API > 0 or pointsToRedeem > 0
    if (pointsDiscountFromAPI > 0 || pointsToRedeem > 0) {
      setUsePoints(true);
    } else if (pointsToRedeem === 0 && pointsDiscountFromAPI === 0) {
      setUsePoints(false);
    }
  }, [pointsToRedeem, pointsDiscountFromAPI]);

  // Fetch points settings
  useEffect(() => {
    const fetchPointsSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/points-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const apiData = response.data.data;
          setPointsSettings({
            enabled: apiData.enabled !== undefined ? Boolean(apiData.enabled) : false,
            redeem_rate: apiData.redeem_rate !== undefined ? apiData.redeem_rate : 50,
            min_redeem: apiData.min_redeem !== undefined ? Number(apiData.min_redeem) : 100,
            earn_rate: apiData.earn_rate !== undefined ? Number(apiData.earn_rate) : 1000,
            referral_bonus_new_customer: apiData.referral_bonus_new_customer !== undefined ? Number(apiData.referral_bonus_new_customer) : 0,
            first_order_bonus: apiData.first_order_bonus !== undefined ? Number(apiData.first_order_bonus) : (apiData.referral_bonus_new_customer !== undefined ? Number(apiData.referral_bonus_new_customer) : 10), // Backward compatibility
            first_order_bonus_enabled: apiData.first_order_bonus_enabled !== undefined ? Boolean(apiData.first_order_bonus_enabled) : true
          });
        }
      } catch (error) {
        console.error('Error fetching points settings:', error);
        // Keep default value
      }
    };

    fetchPointsSettings();
  }, []);

  // ✅ Fetch bonus points from transactions if order is paid (to show actual bonus received)
  useEffect(() => {
    const fetchBonusPointsFromTransactions = async () => {
      // Only fetch if order is paid and has customer + order id
      if (payment?.status !== 'paid' || !customer?.id || !state.id) {
        setBonusPointsFromTransactions({ firstOrder: 0, referral: 0 });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await instance.get(`/points/customers/${customer.id}/history?order_id=${state.id}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.data?.data) {
          // Filter bonus transactions for this order
          const bonusTransactions = response.data.data.data.filter(pt =>
            pt.order_id === state.id &&
            pt.type === 'bonus' &&
            pt.points > 0
          );

          let firstOrderBonus = 0;
          let referralBonus = 0;

          bonusTransactions.forEach(pt => {
            const bonusType = pt.bonus_type || '';

            if (bonusType === 'first_order') {
              firstOrderBonus += pt.points;
            } else if (bonusType === 'referral_new_customer') {
              referralBonus += pt.points;
            } else if (!bonusType) {
              // Fallback: check description
              const description = (pt.description || '').toLowerCase();
              if (description.includes('first order bonus')) {
                firstOrderBonus += pt.points;
              } else if (description.includes('referral bonus') && description.includes('new customer')) {
                referralBonus += pt.points;
              }
            }
          });

          setBonusPointsFromTransactions({ firstOrder: firstOrderBonus, referral: referralBonus });
          console.log('✅ PaymentStep - Bonus points from transactions:', { firstOrder: firstOrderBonus, referral: referralBonus });
        }
      } catch (error) {
        console.error('Error fetching bonus points from transactions:', error);
        setBonusPointsFromTransactions({ firstOrder: 0, referral: 0 });
      }
    };

    fetchBonusPointsFromTransactions();
  }, [payment?.status, customer?.id, state.id]);

  // Fetch discounts on mount
  React.useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const data = await getDiscounts();
        setLocalDiscounts(data);
      } catch (error) {
        console.error('Error fetching discounts:', error);
      }
    };
    fetchDiscounts();
  }, []);

  // Calculate total with payment discount
  const { subtotal, discountAmount, finalTotal } = useMemo(() => {
    return calculateTotalWithPaymentDiscount(state.order_details || [], paymentDiscount);
  }, [state.order_details, paymentDiscount]);

  // Calculate points discount (same as FE Invoice logic)
  // ✅ FIX: Prioritize points_discount from API if exists (like InvoiceContentPreview.jsx)
  const pointsDiscountAmount = useMemo(() => {
    // ✅ Priority 1: Use points_discount from API directly if exists (like InvoiceContentPreview.jsx line 371)
    if (pointsDiscountFromAPI > 0) {
      console.log('✅ PaymentStep - Using points_discount from API:', pointsDiscountFromAPI);
      return pointsDiscountFromAPI;
    }

    // ✅ Priority 2: Calculate from points_to_redeem (for new/editing orders)
    if (pointsToRedeem <= 0) return 0;
    const calculatedDiscount = Math.floor((pointsToRedeem / 100) * (pointsSettings.redeem_rate * 100));
    // Points discount tidak boleh melebihi total setelah payment discount
    const totalAfterPaymentDiscount = finalTotal;
    return Math.min(calculatedDiscount, totalAfterPaymentDiscount);
  }, [pointsDiscountFromAPI, pointsToRedeem, finalTotal, pointsSettings.redeem_rate]);

  // Calculate final total after payment discount and points discount
  const actualTotal = useMemo(() => {
    return Math.max(0, finalTotal - pointsDiscountAmount);
  }, [finalTotal, pointsDiscountAmount]);

  // Calculate points earned (same as Quick Order logic)
  const pointsEarnedData = useMemo(() => {
    if (!pointsSettings.enabled) return null;

    const finalTotalForPoints = actualTotal; // Final total setelah semua discount
    const earnRate = pointsSettings.earn_rate || 1000;

    // Calculate points: cek payment status untuk menentukan "Poin Didapat" vs "Poin Menunggu"
    let pointsEarned = 0;
    let pointsLabel = '';

    // Calculate totalPaid untuk points calculation
    const calculatedTotalPaid = paymentDetails.reduce((sum, p) => sum + Number(p.amount), 0);
    const paymentStatusFromState = payment?.status || 'unpaid';

    // ✅ FIX: Gunakan payment status untuk menentukan label
    // Jika status = "paid" → "Poin Didapat" dari paid_amount
    // Jika status = "dp" atau "unpaid" → "Poin Menunggu" dari final_price/actualTotal
    if (paymentStatusFromState === 'paid' && calculatedTotalPaid > 0) {
      pointsEarned = Math.floor(calculatedTotalPaid / earnRate);
      pointsLabel = 'Poin Didapat';
    } else if (actualTotal > 0) {
      pointsEarned = Math.floor(actualTotal / earnRate);
      pointsLabel = 'Poin Menunggu';
    }

    // Cek bonus poin
    // ✅ If order is paid, use actual bonus from transactions (already received)
    // ✅ If order is not paid, calculate expected bonus based on customer status
    let firstOrderBonus = 0;
    let referralBonus = 0;

    if (paymentStatusFromState === 'paid') {
      // ✅ Order already paid - use actual bonus from transactions
      firstOrderBonus = bonusPointsFromTransactions.firstOrder;
      referralBonus = bonusPointsFromTransactions.referral;
    } else {
      // ✅ Order not paid yet - calculate expected bonus
      // ✅ FIRST ORDER BONUS: Hanya untuk customer yang belum pernah dapat first order bonus
      const isNewCustomerForFirstOrderBonus = !customer?.has_received_first_order_bonus;
      firstOrderBonus = (isNewCustomerForFirstOrderBonus && pointsSettings.first_order_bonus_enabled)
        ? (pointsSettings.first_order_bonus || 0)
        : 0;

      // ✅ REFERRAL BONUS: Untuk unpaid orders, tampilkan expected bonus jika ada referral
      // ✅ Cek dari referrer object (jika ada, berarti order pakai referral)
      // Backend logic: Referral bonus diberikan untuk FIRST PAID ORDER yang pakai referral
      // Tapi untuk preview unpaid orders, kita tampilkan expected bonus jika ada referrer object
      const hasReferral = referrer != null || (referredByPhone != null && referredByPhone !== '') || (state.referred_by != null && state.referred_by !== null);

      // ✅ Tampilkan expected referral bonus jika ada referral (cek dari referrer object)
      if (hasReferral && pointsSettings.referral_bonus_new_customer > 0) {
        referralBonus = pointsSettings.referral_bonus_new_customer;
        console.log('✅ PaymentStep - Expected referral bonus for unpaid order:', {
          referralBonus,
          hasReferral,
          referrer: referrer,
          referredByPhone,
          referred_by: state.referred_by,
          customer_id: customer?.id,
          order_id: state.id
        });
      }
    }

    // Total poin yang akan didapat
    const totalPointsEarned = pointsEarned + firstOrderBonus + referralBonus;

    return {
      pointsEarned,
      pointsLabel,
      firstOrderBonus,
      referralBonus,
      totalPointsEarned
    };
  }, [pointsSettings.enabled, pointsSettings.earn_rate, pointsSettings.referral_bonus_new_customer, pointsSettings.first_order_bonus, pointsSettings.first_order_bonus_enabled, actualTotal, paymentDetails, payment?.status, customer?.has_received_first_order_bonus, customer?.total_orders, referredByPhone, state.referred_by, state.referrer, bonusPointsFromTransactions]);

  // Calculate totals
  const minDP = Math.ceil(actualTotal * 0.5);
  const totalPaid = paymentDetails.reduce((sum, p) => sum + Number(p.amount), 0);
  const isLunas = totalPaid >= actualTotal;
  const isDPValid = totalPaid >= minDP;

  // Status pembayaran menggunakan labelFormatter
  const paymentStatus = calculatePaymentStatus(totalPaid, actualTotal);
  const statusLabel = formatPaymentStatus(paymentStatus);
  const statusColors = getPaymentStatusColors(paymentStatus);

  const handleAddPayment = async (paymentData) => {
    // Use payment_method.code from the selected account instead of mapping account.type
    const getMethodFromPaymentMethod = (paymentMethod) => {
      if (!paymentMethod) return 'cash'; // fallback
      return paymentMethod.code || 'cash'; // Use payment_method.code directly
    };

    // Get active shift ID
    const activeShiftId = await getActiveShiftId();

    // Buat payment detail baru dengan ID = 0 untuk data baru
    const newPayment = {
      id: 0, // ID = 0 untuk data baru (akan di-insert di backend)
      method: getMethodFromPaymentMethod(paymentData.account.payment_method), // ✅ Use payment_method.code
      amount: paymentData.amount,
      transaction_id: null,
      payment_id: payment?.id || 0,
      fee: "0.00",
      interest: "0.00",
      final_amount: paymentData.amount,
      evidence_photo: paymentData.evidence_photo || "",
      account_id: paymentData.account.id, // ✅ Ensure account_id is always present
      account_name: paymentData.account.name,
      account_type: paymentData.account.payment_method?.name || 'General Account', // ✅ Use payment_method.name
      finance_category_id: 1, // ✅ Payment always uses income category (same as backend)
      shift_id: activeShiftId, // ✅ Use active shift ID from helper
      payment_method_id: paymentData.account.payment_method_id || paymentData.account.payment_method?.id || null, // ✅ Use payment_method_id from finance account
      money_received: paymentData.money_received || null, // ✅ NEW: Cash change tracking
      change_amount: paymentData.change_amount || null, // ✅ NEW: Cash change tracking
      date: new Date().toISOString().split('T')[0],
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add payment detail to context
    actions.addPaymentDetail(newPayment);

    // Update payment status
    const newTotalPaid = totalPaid + paymentData.amount;
    actions.updatePayment({
      paid_amount: newTotalPaid,
      remaining_amount: actualTotal - newTotalPaid,
      status: newTotalPaid >= actualTotal ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID,
      // ✅ FIX: Explicitly preserve points data to prevent reset during payment update
      points_to_redeem: payment?.points_to_redeem || 0,
      points_discount: payment?.points_discount || 0
    });

    setShowAddPaymentModal(false);
  };

  const handleDeletePayment = (paymentIndex) => {
    if (!isSuperAdmin) return;

    setPaymentToDelete(paymentIndex);
    setShowDeleteModal(true);
  };

  const confirmDeletePayment = async () => {
    if (paymentToDelete === null) {
      setShowDeleteModal(false);
      setPaymentToDelete(null);
      return;
    }

    try {
      // ✅ FIX: Hapus payment detail dari array dan buat orderData baru untuk submit
      // 1. Filter payment details (hapus yang akan dihapus)
      const updatedPaymentDetails = paymentDetails.filter((_, index) => index !== paymentToDelete);

      // 2. Recalculate payment totals
      const newTotalPaid = updatedPaymentDetails.reduce((sum, p) => sum + Number(p.amount || p.final_amount || 0), 0);
      const newRemaining = actualTotal - newTotalPaid;
      const newStatus = newRemaining <= 0 ? PAYMENT_STATUS.PAID : (newTotalPaid >= minDP ? PAYMENT_STATUS.DP : PAYMENT_STATUS.UNPAID);

      // 3. Buat payment update object dengan totals baru DAN hapus poin redeem jika ada
      const paymentUpdate = {
        paid_amount: newTotalPaid,
        remaining_amount: newRemaining,
        status: newStatus,
        payment_details: updatedPaymentDetails // ✅ Payment details yang sudah di-filter (tidak include yang dihapus)
      };

      // ✅ Hapus poin redeem jika ada (karena payment detail dihapus)
      if (pointsToRedeem > 0) {
        paymentUpdate.points_to_redeem = 0;
        paymentUpdate.points_discount = 0;
      }

      // 4. Update context dengan perubahan
      actions.removePaymentDetail(paymentToDelete);
      actions.updatePayment(paymentUpdate);

      // 5. Buat orderData baru untuk submit (dengan payment_details yang sudah di-update)
      const orderDataToSubmit = {
        ...state,
        payment: {
          ...state.payment,
          ...paymentUpdate
        }
      };

      // 6. Submit semua perubahan ke BE dengan orderData yang sudah di-update
      if (submitOrderData) {
        await submitOrderData(orderDataToSubmit, true); // ✅ Pass orderData yang sudah di-update, bukan null
      }

      // 7. Refresh data dari BE untuk mendapatkan data terbaru
      if (fetchOrderData) {
        await fetchOrderData(true); // force = true
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      // Tetap tutup modal meskipun error
    } finally {
      setShowDeleteModal(false);
      setPaymentToDelete(null);
    }
  };

  // Handle edit payment date
  const handleEditPaymentDate = (paymentDetail) => {
    if (!isSuperAdmin) return;
    setPaymentToEditDate(paymentDetail);
    // Set current date as default
    const d = paymentDetail.createdAt ? new Date(paymentDetail.createdAt) : new Date();
    const currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setNewPaymentDate(currentDate);
    setShowEditDateModal(true);
  };

  const confirmEditPaymentDate = async () => {
    if (!paymentToEditDate || !newPaymentDate) {
      setShowEditDateModal(false);
      return;
    }

    setIsEditingDate(true);
    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      const [year, month, day] = newPaymentDate.split('-');
      const combined = new Date(parseInt(year), parseInt(month) - 1, parseInt(day),
        now.getHours(), now.getMinutes(), now.getSeconds());
      const formattedDate = `${combined.getFullYear()}-${String(combined.getMonth() + 1).padStart(2, '0')}-${String(combined.getDate()).padStart(2, '0')} ${String(combined.getHours()).padStart(2, '0')}:${String(combined.getMinutes()).padStart(2, '0')}:${String(combined.getSeconds()).padStart(2, '0')}`;
      await instance.patch(`/payment-details/${paymentToEditDate.id}/date`,
        { new_date: formattedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh data from backend
      if (fetchOrderData) {
        await fetchOrderData(true);
      }
    } catch (error) {
      console.error('Error updating payment date:', error);
    } finally {
      setIsEditingDate(false);
      setShowEditDateModal(false);
      setPaymentToEditDate(null);
      setNewPaymentDate('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-telaga-600 to-telaga-400 rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-montserrat tracking-wide">
                Pembayaran
              </h3>
              <p className="text-xs text-telaga-600 font-montserrat font-medium">
                Detail Pembayaran
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3 mb-6">
            {/* Sub Total */}
            <div className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-telaga-200">
              <span className="font-semibold text-gray-700 font-montserrat">Sub Total</span>
              <span className="font-bold text-base text-gray-700 font-montserrat">{formatCurrency(subtotal)}</span>
            </div>
            {/* Payment Discount */}
            {discountAmount > 0 && paymentDiscount ? (
              <div className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 bg-green-50/50">
                <div className="flex items-center gap-2 flex-1">
                  <Tag className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-gray-700 font-montserrat">Potongan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-700 font-montserrat">-{formatCurrency(discountAmount)}</span>
                  {!isLunas && (
                    <button
                      onClick={() => {
                        actions.updatePayment({
                          discount_id: null,
                          discount: null
                        });
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Diskon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}
            {/* Points Discount Display */}
            {pointsDiscountAmount > 0 && (
              <div className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 bg-orange-50/50">
                <div className="flex items-center gap-2 flex-1">
                  <Coins className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-xs font-semibold text-gray-700 font-montserrat">Potongan Poin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-700 font-montserrat">-{formatCurrency(pointsDiscountAmount)}</span>
                  {!isLunas && (
                    <button
                      onClick={() => {
                        actions.updatePayment({
                          points_to_redeem: 0,
                          points_discount: 0 // ✅ FIX: Also reset points_discount
                        });
                        setUsePoints(false);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Potongan Poin"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Payment Notes - in breakdown */}
            {paymentNotes && paymentNotes.trim() ? (
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-telaga-200">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-telaga-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600 font-montserrat">Catatan</span>
                      {!isLunas && (
                        <button
                          onClick={() => setShowNotesModal(true)}
                          className="p-1 text-telaga-600 hover:bg-telaga-50 rounded transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-montserrat">{paymentNotes}</span>
                  </div>
                </div>
              </div>
            ) : null}
            {/* Total Tagihan */}
            <div className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-telaga-300">
              <span className="font-semibold text-gray-700 font-montserrat">Total Tagihan</span>
              <span className="font-bold text-lg text-telaga-700 font-montserrat">{formatCurrency(actualTotal)}</span>
            </div>

            {/* Poin yang akan didapat - Tampilkan jika points enabled */}
            {pointsEarnedData && pointsEarnedData.totalPointsEarned > 0 && (
              <div className="mb-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <Coins className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 font-montserrat">
                    Poin yang akan didapat
                  </span>
                </div>
                <div className="space-y-1.5 pl-5">
                  {/* Poin dari pembayaran */}
                  {pointsEarnedData.pointsEarned > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-montserrat">{pointsEarnedData.pointsLabel}</span>
                      <span className="text-xs font-semibold text-gray-700 font-montserrat">
                        +{formatNumber(pointsEarnedData.pointsEarned)}
                      </span>
                    </div>
                  )}

                  {/* Bonus Order Pertama */}
                  {pointsEarnedData.firstOrderBonus > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-montserrat">Bonus Order Pertama</span>
                      <span className="text-xs font-semibold text-gray-700 font-montserrat">
                        +{formatNumber(pointsEarnedData.firstOrderBonus)}
                      </span>
                    </div>
                  )}

                  {/* Bonus Referral */}
                  {pointsEarnedData.referralBonus > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-montserrat">Bonus Referral</span>
                      <span className="text-xs font-semibold text-gray-700 font-montserrat">
                        +{formatNumber(pointsEarnedData.referralBonus)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total sudah dibayar */}
            <div className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-telaga-200">
              <span className="font-semibold text-gray-700 font-montserrat">Total Dibayar</span>
              <span className="font-bold text-lg text-green-700 font-montserrat">{formatCurrency(totalPaid)}</span>
            </div>
            {/* Sisa bayar */}
            <div className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-telaga-200">
              <span className="font-semibold text-gray-700 font-montserrat">Sisa Bayar</span>
              <span className={`font-bold text-lg px-3 py-1 rounded-full font-montserrat ${actualTotal - totalPaid <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {formatCurrency(actualTotal - totalPaid > 0 ? actualTotal - totalPaid : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Button Tambah Diskon dan Catatan - setelah Sisa Bayar */}
        {!isLunas && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowDiscountModal(true)}
              className="flex-1 px-3 py-2 text-xs font-semibold text-telaga-700 bg-telaga-50 hover:bg-telaga-100 rounded-lg transition-colors font-montserrat flex items-center justify-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              {paymentDiscount ? 'Edit Diskon' : '+ Diskon'}
            </button>
            <button
              onClick={() => setShowNotesModal(true)}
              className="flex-1 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-montserrat flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {paymentNotes && paymentNotes.trim() ? 'Edit Catatan' : '+ Catatan'}
            </button>
          </div>
        )}

        {/* Points Redeem Section - setelah button Tambah Diskon/Catatan */}
        {customerPoints > 0 && !isLunas && pointsSettings.enabled && (
          <>
            {!pointsSettings.enabled ? (
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-montserrat font-semibold mb-2">
                      SISTEM POIN BELUM DI AKTIFKAN
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      Silakan setting di menu owner
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Checkbox untuk enable/disable redeem poin */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={usePoints}
                          onChange={(e) => {
                            setUsePoints(e.target.checked);
                            if (!e.target.checked) {
                              // Reset poin jika checkbox di-uncheck
                              actions.updatePayment({
                                points_to_redeem: 0
                              });
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${usePoints
                          ? 'bg-orange-600 border-2 border-orange-600 shadow-md'
                          : 'bg-white border-2 border-gray-600 group-hover:border-orange-500'
                          }`}>
                          {usePoints && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className={`w-4 h-4 transition-colors ${usePoints ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold font-montserrat transition-colors ${usePoints ? 'text-orange-700' : 'text-gray-600'
                          }`}>
                          Bayar dengan Poin
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Card Redeem Poin - hanya muncul jika checkbox checked */}
                {usePoints && (() => {
                  // Calculate max points that can be used based on total BEFORE points discount
                  // Use subtotal - paymentDiscountAmount (not total, because total already has points discount)
                  // Max discount from points = totalBeforePointsDiscount (can't exceed this)
                  // Max points = (totalBeforePointsDiscount / (redeem_rate * 100)) * 100 (integer, tidak perlu kelipatan 100)
                  const totalBeforePointsDiscount = finalTotal; // Total after payment discount, before points discount
                  const maxDiscountFromPoints = totalBeforePointsDiscount; // Can't exceed total before points discount
                  const redeemRateValue = pointsSettings.redeem_rate * 100; // Convert to rupiah per 100 points
                  const maxPointsByTotal = Math.floor((maxDiscountFromPoints / redeemRateValue) * 100); // Max points by total (integer, tidak perlu kelipatan 100)

                  // Max points is minimum of: customerPoints and maxPointsByTotal
                  const minRedeem = pointsSettings.min_redeem || 100;
                  const maxPointsAllowed = Math.min(
                    customerPoints, // Available points (tidak perlu dibulatkan)
                    maxPointsByTotal >= minRedeem ? maxPointsByTotal : 0 // Max by total, min min_redeem
                  );

                  const handleUseAllPoints = () => {
                    if (maxPointsAllowed >= minRedeem) {
                      actions.updatePayment({
                        points_to_redeem: maxPointsAllowed
                      });
                    }
                  };

                  // Calculate remaining points after redeem
                  const remainingPoints = Math.max(0, customerPoints - pointsToRedeem);

                  return (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-gray-700 font-montserrat">
                            Poin Tersedia: <span className="text-orange-600">{formatNumber(remainingPoints)}</span>
                          </span>
                        </div>
                        {maxPointsAllowed >= (pointsSettings.min_redeem || 100) && pointsToRedeem !== maxPointsAllowed && (
                          <button
                            type="button"
                            onClick={handleUseAllPoints}
                            className="text-xs text-orange-600 hover:text-orange-700 underline font-montserrat"
                          >
                            Pakai Semua
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 font-montserrat">
                          Gunakan Poin (min {formatNumber(pointsSettings.min_redeem || 100)})
                        </label>
                        <input
                          type="number"
                          min={pointsSettings.min_redeem || 100}
                          max={maxPointsAllowed}
                          step="1"
                          value={pointsToRedeem || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;

                            if (inputValue === '' || inputValue === '0') {
                              actions.updatePayment({
                                points_to_redeem: 0
                              });
                              return;
                            }

                            // Parse as integer (tidak boleh desimal)
                            const value = parseInt(inputValue) || 0;

                            // ✅ Allow free typing, only cap at max value
                            if (value > maxPointsAllowed) {
                              // If more than allowed, cap to maxPointsAllowed
                              actions.updatePayment({
                                points_to_redeem: maxPointsAllowed
                              });
                            } else {
                              // Accept any value - validation warning shown below
                              actions.updatePayment({
                                points_to_redeem: value
                              });
                            }
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        {pointsToRedeem > 0 && (
                          <div className="text-xs text-gray-600 font-montserrat">
                            <span className="font-semibold">{formatNumber(pointsToRedeem)} poin</span> = potongan{' '}
                            <span className="font-semibold text-orange-600">{formatCurrency(pointsDiscountAmount)}</span>
                          </div>
                        )}
                        {pointsToRedeem > 0 && pointsToRedeem < (pointsSettings.min_redeem || 100) && (
                          <p className="text-xs text-red-600 font-montserrat">Minimum redeem adalah {formatNumber(pointsSettings.min_redeem || 100)} poin</p>
                        )}
                        {pointsToRedeem > maxPointsAllowed && (
                          <p className="text-xs text-red-600 font-montserrat">
                            Maksimal {formatNumber(maxPointsAllowed)} poin (sesuai total pesanan)
                          </p>
                        )}
                        {maxPointsAllowed < customerPoints && (
                          <p className="text-xs text-gray-500 font-montserrat italic">
                            * Maksimal poin dibatasi sesuai total pesanan ({formatCurrency(totalBeforePointsDiscount)})
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* Form pembayaran hanya muncul jika belum lunas */}
        {!isLunas && (
          <>
            {/* Validasi cerdas */}
            {totalPaid < actualTotal && (
              <div className="text-xs text-telaga-700 font-montserrat mb-3">Kurang <span className="font-bold">{formatCurrency(actualTotal - totalPaid)}</span> untuk lunas</div>
            )}
            {totalPaid < minDP && (
              <div className="text-xs text-yellow-700 font-montserrat mb-3">Kurang <span className="font-bold">{formatCurrency(minDP - totalPaid)}</span> untuk mencapai minimal DP 50%</div>
            )}
            <AnimatedButton
              variant="telaga"
              className="w-full h-12 px-4 py-3 flex items-center justify-center gap-2"
              onClick={() => setShowAddPaymentModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">Tambah Pembayaran</span>
            </AnimatedButton>
          </>
        )}

        {/* Pesan jika sudah lunas */}
        {isLunas && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="text-sm font-semibold text-green-800 font-montserrat">
                  Order sudah lunas
                </p>
                <p className="text-xs text-green-700 font-montserrat">
                  Tidak bisa menambah pembayaran lagi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Payment History */}
      <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-telaga-600 to-telaga-400 rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-montserrat tracking-wide font-montserrat font-semibold">
                Riwayat Pembayaran
              </h3>
              {/* <p className="text-xs text-telaga-600 font-montserrat font-medium">
                Pembayaran sebelumnya
              </p> */}
            </div>
          </div>

          {/* Payment History List */}
          {paymentDetails.length === 0 && (
            <div className="text-center py-6">
              <div className="text-xs text-gray-400 font-montserrat">Belum ada pembayaran</div>
            </div>
          )}
          <div className="space-y-2">
            {paymentDetails.map((p, idx) => (
              <div key={p.id || idx} className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-telaga-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    {/* Tanggal Bayar */}
                    <span className="text-[10px] text-gray-500 font-montserrat">
                      {formatPaymentDate(p.createdAt)}
                    </span>
                    {/* Badge Payment Method */}
                    <div className="flex items-center gap-2">
                      {/* {getPaymentIconComponent(
                        p.transaction?.finance_account?.type || p.account_type, 
                        p.method
                      )} */}
                      <span className="px-3 py-1.5 rounded-full bg-telaga-100 text-telaga-700 text-xs font-semibold font-montserrat capitalize shadow-sm">
                        {getPaymentLabel(
                          p.payment_method_name || p.payment_method?.name,
                          p.transaction?.finance_account?.name || p.account_name,
                          p.transaction?.finance_account?.type || p.account_type,
                          p.method
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-telaga-800 font-montserrat">{formatCurrency(p.amount)}</span>
                    {/* ✅ Display money_received and change for cash payments */}
                    {p.money_received && p.money_received > 0 && (
                      <div className="flex flex-col items-end mt-1 text-[10px] font-montserrat">
                        <span className="text-gray-500">
                          Diterima: {formatCurrency(p.money_received)}
                        </span>
                        {p.change_amount && p.change_amount > 0 && (
                          <span className="text-green-600 font-semibold">
                            Kembalian: {formatCurrency(p.change_amount)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isSuperAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPaymentDate(p)}
                      className="p-2 text-telaga-500 hover:text-telaga-700 hover:bg-telaga-50 rounded-lg transition-colors duration-200"
                      title="Edit tanggal pembayaran"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePayment(idx)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Hapus pembayaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DP & Status */}
      <div className="space-y-4">
        {/* Total Dibayar */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-lg p-6 border border-green-200 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg font-montserrat tracking-wide">
                  Total Dibayar
                </h3>
              </div>
            </div>
            <span className="font-bold text-xl text-green-700 font-montserrat">{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        {/* Status */}
        <div className={`bg-gradient-to-br rounded-3xl shadow-lg p-6 border relative overflow-hidden ${paymentStatus === 'paid'
          ? 'from-green-50 to-emerald-50 border-green-200'
          : paymentStatus === 'dp'
            ? 'from-yellow-50 to-amber-50 border-yellow-200'
            : 'from-red-50 to-pink-50 border-red-200'
          }`}>
          {/* Background Pattern */}
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none ${paymentStatus === 'paid'
            ? 'bg-gradient-to-bl from-green-100/30 to-transparent'
            : paymentStatus === 'dp'
              ? 'bg-gradient-to-bl from-yellow-100/30 to-transparent'
              : 'bg-gradient-to-bl from-red-100/30 to-transparent'
            }`}></div>

          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${paymentStatus === 'paid'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : paymentStatus === 'dp'
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                  : 'bg-gradient-to-br from-red-500 to-pink-600'
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg font-montserrat tracking-wide">
                  Status
                </h3>
              </div>
            </div>
            <span className={`font-bold text-md px-4 py-2 rounded-full font-montserrat shadow-sm ${paymentStatus === 'paid'
              ? 'bg-green-500 text-white'
              : paymentStatus === 'dp'
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
              }`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Minimal DP Info */}
        {/* <div className="flex items-center gap-2 justify-end text-xs text-gray-500 font-montserrat">
            <span>Minimal DP: </span>
          <span className="px-3 py-1.5 rounded-full bg-telaga-100 text-telaga-700 font-semibold shadow-sm">Rp {minDP.toLocaleString('id-ID')}</span>
        </div> */}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                Hapus Pembayaran
              </h3>
              <p className="text-sm text-gray-500 font-montserrat mb-6">
                Apakah Anda yakin ingin menghapus pembayaran ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-montserrat"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeletePayment}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 font-montserrat"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Date Confirmation Modal */}
      {showEditDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-telaga-100 mb-4">
                <Calendar className="h-6 w-6 text-telaga-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                Edit Tanggal Pembayaran
              </h3>
              <p className="text-sm text-gray-500 font-montserrat mb-4">
                Mengubah tanggal akan menghapus data shift dari pembayaran ini.
              </p>
              <div className="mb-6">
                <input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-telaga-500 focus:border-telaga-500 font-montserrat"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditDateModal(false)}
                  disabled={isEditingDate}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-montserrat disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={confirmEditPaymentDate}
                  disabled={isEditingDate || !newPaymentDate}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-telaga-600 hover:bg-telaga-700 rounded-lg transition-colors duration-200 font-montserrat disabled:opacity-50"
                >
                  {isEditingDate ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <AddPaymentModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          onAddPayment={handleAddPayment}
          total={actualTotal}
          paid={totalPaid}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <QuickOrderDiscountModal
          discounts={localDiscounts}
          subtotal={subtotal}
          onSelect={(discount) => {
            actions.updatePayment({
              discount_id: discount.id,
              discount: discount
            });
          }}
          onClose={() => setShowDiscountModal(false)}
          onRefreshDiscounts={async () => {
            try {
              const data = await getDiscounts();
              setLocalDiscounts(data);
            } catch (error) {
              console.error('Error refreshing discounts:', error);
            }
          }}
        />
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <NotesModal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          notes={paymentNotes}
          onSave={(notes) => {
            actions.updatePayment({
              notes: notes
            });
          }}
        />
      )}

    </div>
  );
};

// Notes Modal Component
const NotesModal = ({ isOpen, onClose, notes = '', onSave }) => {
  const [localNotes, setLocalNotes] = useState(notes);

  React.useEffect(() => {
    if (isOpen) {
      setLocalNotes(notes);
    }
  }, [isOpen, notes]);

  const handleSave = () => {
    onSave(localNotes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-telaga-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-telaga-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Catatan Pembayaran
                </h2>
                <p className="text-sm text-gray-600 font-montserrat">
                  Tambah atau edit catatan untuk pembayaran ini
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Masukkan catatan pembayaran..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-telaga-500 focus:border-transparent font-montserrat text-sm resize-none"
            rows={6}
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-montserrat font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-telaga-700 to-telaga-500 text-white rounded-lg hover:from-telaga-800 hover:to-telaga-600 transition-all font-montserrat font-semibold"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep; 