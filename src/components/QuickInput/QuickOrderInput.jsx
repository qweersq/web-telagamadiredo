import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, X, Search, User, Calendar, DollarSign, QrCode, CreditCard, AlertCircle, AlertTriangle } from 'lucide-react';
import QuickOrderCustomerSelect from './QuickOrderCustomerSelect';
import QuickOrderTreatmentSelect from './QuickOrderTreatmentSelect';
import QuickOrderPaymentInput from './QuickOrderPaymentInput';
import QuickOrderCustomerSearchModal from './QuickOrderCustomerSearchModal';
import { getCustomers, searchCustomers, getTreatments, getDiscounts, createOrder, createCustomer } from '../../pages/ORDER/api/orderApi';
import QuantityInput from '../Design/QuantityInput';
import AnimatedButton from '../Design/AnimatedButton';
import { useShift } from '../../contexts/ShiftContext';
import { getUserProfile, getActiveShiftId } from '../../utils/userProfileHelper';

// Get local date string (YYYY-MM-DD) in local timezone, prevents UTC timezone shift bug
const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
    console.error('[ERROR] QuickOrderInput - Failed to get userData from API:', error);
    return null;
  }
}

const masterDiscounts = [
  { id: 1, name: 'Diskon Member', type: 'percent', value: 10 },
  { id: 2, name: 'Promo Akhir Bulan', type: 'nominal', value: 15000 },
  { id: 3, name: 'Tanpa Diskon', type: 'nominal', value: 0 },
];

const processTimeOptions = [
  { value: 'regular', label: 'Regular', extra: 0 },
  { value: 'next_day', label: 'Next Day', extra: 10000 },
  { value: 'same_day', label: 'Same Day', extra: 20000 },
];

const steps = [
  { label: 'Input Data', key: 'input' },
  { label: 'Pembayaran', key: 'payment' },
];

const initialOrderData = {
  customer: null,
  order_details: [],
  payment: { payment_details: [] },
  // Use local date to prevent UTC timezone shift
  entry_date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
  quantity: 0,
  order_type: 'offline',
  total: 0,
  isDP: false,
  shift_id: null, // ✅ Add shift_id
};

const QuickOrderInput = ({ onSubmit, onCancel }) => {
  const [orderData, setOrderData] = useState(initialOrderData);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(0); // step wizard
  const [paymentValidation, setPaymentValidation] = useState({ isValid: false, errors: {}, warnings: {} });
  const [requestPickup, setRequestPickup] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [submitError, setSubmitError] = useState('');
  const [pickupDate, setPickupDate] = useState(() => getLocalDate());
  const [pickupTime, setPickupTime] = useState('14:00');
  const { user, shift, fetchProfileAndShift } = useShift();

  const handleValidationChange = useCallback((isValid, errors, warnings) => {
    setPaymentValidation({ isValid, errors, warnings });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cust = await getCustomers();
        setCustomers(cust || []);
      } catch (err) {
        setCustomers([]);
      }
      try {
        const treat = await getTreatments();
        setTreatments(treat || []);
      } catch (err) {
        setTreatments([]);
      }
      try {
        const disc = await getDiscounts();
        setDiscounts(disc || []);
      } catch (err) {
        setDiscounts([]);
      }
    };
    fetchData();
  }, []);

  // Search customer dari API
  const handleCustomerSearch = async (term) => {
    setSearchTerm(term);
    if (!term) {
      // Jika kosong, fetch all
      const data = await getCustomers();
      setCustomers(data || []);
    } else {
      const data = await searchCustomers(term);
      setCustomers(data || []);
    }
  };

  // Handler pilih customer (untuk QuickOrderCustomerSelect dan QuickOrderCustomerSearchModal)
  const handleCustomerSelect = async (customer) => {
    // Jika customer baru (tidak ada id atau id temporary), create dulu
    if (!customer.id || customer.id.toString().length > 10) {
      try {
        const newCustomer = await createCustomer({
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
          gmaps: customer.gmaps || ''
        });

        // Update customer dengan data dari API
        const customerWithId = {
          ...customer,
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          address: newCustomer.address,
          gmaps: newCustomer.gmaps
        };

        // Update customers list
        setCustomers(prev => [customerWithId, ...prev]);

        // Set customer yang sudah ada ID
        setOrderData(prev => ({ ...prev, customer: customerWithId }));
      } catch (error) {
        console.error('[ERROR] QuickOrder - Failed to create customer:', error);
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Gagal membuat customer baru. Silakan coba lagi.';
        alert(`Error: ${errorMessage}`);
        return;
      }
    } else {
      // Customer sudah ada, langsung set
      setOrderData(prev => ({ ...prev, customer }));
    }
  };

  // Handler update treatments/order_details (untuk QuickOrderTreatmentSelect)
  const handleUpdateOrderDetails = (order_details) => {
    setOrderData(prev => ({ ...prev, order_details }));
  };

  // Kalkulasi subtotal per treatment (termasuk processTime extra, diskon per treatment, dan qty)
  const subtotal = orderData.order_details.reduce((sum, t) => {
    const basePrice = t.treatment?.price ? Number(t.treatment.price) : 0;
    let processExtra = 0;
    if (t.process_time === 'next_day' || t.processTime === 'next_day') {
      processExtra = 0.5 * basePrice;
    } else if (t.process_time === 'same_day' || t.processTime === 'same_day') {
      processExtra = 1 * basePrice;
    }
    const beforeDisc = basePrice + processExtra;
    const disc = t.discount ? (t.discount.type === 'percent' ? beforeDisc * (t.discount.value / 100) : t.discount.value) : 0;
    const perItem = Math.max(beforeDisc - disc, 0);
    const qty = t.qty && t.qty > 0 ? t.qty : 1;
    return sum + perItem * qty;
  }, 0);

  // Helper: hitung total order (mirip context OrderDetail)
  function getOrderTotal(order_details) {
    if (!Array.isArray(order_details)) return 0;
    return order_details.reduce((sum, t) => {
      const basePrice = t.treatment?.price ? Number(t.treatment.price) : 0;
      let processExtra = 0;
      if (t.process_time === 'next_day' || t.processTime === 'next_day') {
        processExtra = 0.5 * basePrice;
      } else if (t.process_time === 'same_day' || t.processTime === 'same_day') {
        processExtra = 1 * basePrice;
      }
      const base = basePrice + processExtra;
      let disc = 0;
      if (t.discount) {
        const discVal = (t.discount.discount != null) ? Number(t.discount.discount) : Number(t.discount.value) || 0;
        if (t.discount.type === 'percent') {
          disc = base * (discVal / 100);
        } else if (t.discount.type === 'nominal') {
          disc = discVal;
        }
      }
      const perItem = Math.max(base - disc, 0);
      const qty = t.qty && t.qty > 0 ? t.qty : 1;
      return sum + perItem * qty;
    }, 0);
  }

  // Update total di orderData dan orderData.payment setiap kali order_details berubah
  useEffect(() => {
    const newTotal = getOrderTotal(orderData.order_details);
    setOrderData(prev => ({
      ...prev,
      total: newTotal,
      payment: {
        ...prev.payment,
        total_price: newTotal
      }
    }));
  }, [orderData.order_details]);

  // Update payment_details di orderData.payment
  const handleUpdatePaymentDetails = (payment_details) => {
    console.log('🔍 QuickOrderInput - handleUpdatePaymentDetails called with:', payment_details);
    setOrderData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        payment_details
      }
    }));
  };

  // Handler pembayaran (update field di payment_details)
  const handlePaymentChange = (idx, field, value) => {
    setOrderData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        payment_details: prev.payment.payment_details.map((p, i) => i === idx ? { ...p, [field]: value } : p)
      }
    }));
  };

  // Handler method change: update method & account_id (remove hardcoded mapping)
  const handlePaymentMethodChange = (idx, method) => {
    setOrderData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        payment_details: prev.payment.payment_details.map((p, i) => i === idx ? { ...p, method } : p)
      }
    }));
  };

  // Handler add/remove payment
  const addPayment = () => setOrderData(prev => ({
    ...prev,
    payment: {
      ...prev.payment,
      payment_details: [...prev.payment.payment_details, { method: '', amount: 0, account_id: '' }]
    }
  }));
  const removePayment = idx => setOrderData(prev => ({
    ...prev,
    payment: {
      ...prev.payment,
      payment_details: prev.payment.payment_details.filter((_, i) => i !== idx)
    }
  }));

  // Submit order
  const handleSubmit = async () => {
    setSubmitError('');
    if (!orderData.customer || orderData.order_details.length === 0) {
      alert('Lengkapi data utama order!');
      return;
    }
    if (orderData.order_type === 'online' && requestPickup && (!pickupDate || !pickupTime)) {
      alert('Tanggal dan jam pickup wajib diisi!');
      return;
    }
    // Hapus validasi DP

    try {
      // Ambil data shift & user terbaru langsung dari API (mengatasi masalah timing context)
      const latestShiftId = await getActiveShiftId(); // ✅ Gunakan helper yang reliable
      const userData = await getUserData();

      // Transform order_details: expand qty > 1 menjadi beberapa order_detail qty=1
      const expandedOrderDetails = orderData.order_details.flatMap((t) => {
        const qty = t.qty || 1;
        const items = t.items || []; // Preserve items array
        return Array.from({ length: qty }).map((_, itemIndex) => ({
          ...t,
          qty: 1,
          items: items, // Preserve items array untuk mapping
          itemIndex: itemIndex, // Track index item dalam group ini
          order_detail_ids: [],
        }));
      });

      // Transform data untuk API
      let paymentStatus = 'unpaid';
      if (paid === 0) {
        paymentStatus = 'unpaid';
      } else if (paid > 0 && paid < total) {
        paymentStatus = 'dp';
      } else if (paid >= total) {
        paymentStatus = 'paid';
      }
      const defaultDueDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      // Get employee_id dari userData yang sudah diambil sebelumnya
      const employeeId = userData?.id || 1; // Fallback ke 1 jika tidak ada userData

      // Hitung unique item_id sebagai fallback quantity
      const uniqueItemIds = new Set(
        expandedOrderDetails.map(t => {
          const itemIndex = t.itemIndex || 0;
          const itemData = t.items && Array.isArray(t.items) && t.items[itemIndex] ? t.items[itemIndex] : null;
          return itemData?.item?.id || null;
        }).filter(id => id != null)
      );
      const fallbackQuantity = uniqueItemIds.size > 0 ? uniqueItemIds.size : expandedOrderDetails.length;

      const apiPayload = {
        customer_id: orderData.customer.id,
        branch_id: 1, // Default branch
        entry_date: orderData.entry_date || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        quantity: orderData.quantity || fallbackQuantity,
        order_type: orderData.order_type || 'offline',
        shift_id: latestShiftId, // ✅ Gunakan shift_id dari helper yang reliable
        created_by: userData?.id || 1, // Gunakan userData yang sudah diambil
        order_details: expandedOrderDetails.map((t, idx) => {
          // ✅ Get item data dari items array berdasarkan itemIndex
          const itemIndex = t.itemIndex || 0;
          const itemData = t.items && Array.isArray(t.items) && t.items[itemIndex] ? t.items[itemIndex] : null;

          // ✅ Map item_id, description, dan shoes_photos dari itemData
          const itemId = itemData?.item?.id || null;
          const itemNotes = itemData?.notes || '';
          const itemPhotos = itemData?.photos || [];

          // ✅ Format shoes_photos untuk backend: array of { url_photo }
          const shoesPhotos = itemPhotos.map(photo => {
            // Handle both object format { url_photo: "..." } and string format
            if (typeof photo === 'string') {
              return { url_photo: photo };
            } else if (photo?.url_photo) {
              return { url_photo: photo.url_photo };
            } else if (photo?.url) {
              return { url_photo: photo.url };
            }
            return null;
          }).filter(Boolean); // Remove null entries

          return {
            employee_id: employeeId, // Gunakan employee_id dari userData
            treatment_id: t.treatment?.id || t.id,
            item_id: itemId, // ✅ Map item_id dari items data
            discount_id: t.discount?.id || null,
            process_time: t.process_time || t.processTime || 'regular',
            process_time_cost: t.process_time_cost || 0,
            due_date: t.due_date || t.dueDate || defaultDueDate(),
            price: t.treatment?.price || t.price || 0,
            final_price: t.final_price || 0,
            status: orderData.order_type === 'online' ? 'not_yet' : 'antrian',
            description: itemNotes || t.description || '', // ✅ Map description dari item notes
            shoes_photos: shoesPhotos, // ✅ Map shoes_photos dari item photos
            ...(orderData.order_type === 'online' && requestPickup ? {
              pickup_method: 'pickup',
              delivery_status: 'scheduled',
              delivery_date: pickupDate,
              delivery_time: pickupTime
            } : {
              pickup_method: null,
              delivery_status: 'not_yet',
              delivery_date: null,
              delivery_time: null
            })
          };
        }),
        payment: {
          status: paymentStatus,
          method: orderData.payment.payment_details[0]?.method || 'cash',
          total_discount: 0,
          final_price: total,
          subtotal: total,
          total_service: total,
          paid_amount: paid,
          remaining_amount: total - paid,
          additional_cost: 0,
          due_date: null,
          notes: '',
          total_price: total,
          total_process_time_cost: 0,
          date: getLocalDate(),
          money: paid,
          change: change,
          evidence_photo: '',
          payment_details: orderData.payment.payment_details
            .filter(p => p.method && p.amount > 0) // Filter payment yang valid (ada method dan amount > 0)
            .map((p, i) => ({
              transaction_id: null,
              method: p.method,
              amount: Number(p.amount || 0),
              fee: "0.00",
              interest: "0.00",
              final_amount: Number(p.amount || 0),
              evidence_photo: p.evidence_photo || "",
              account_id: p.account_id, // ✅ Use account_id from payment detail (no hardcoded mapping)
              finance_category_id: 1, // ✅ Payment always uses income category (same as backend)
              shift_id: latestShiftId, // ✅ Gunakan shift_id dari helper yang reliable // ✅ Add shift_id
              payment_method_id: p.payment_method_id || p.payment_method?.id || null, // ✅ Use payment_method_id from finance account
              money_received: p.money_received || null, // ✅ NEW: Cash change tracking
              change_amount: p.change_amount || null, // ✅ NEW: Cash change tracking
              date: getLocalDate(),
              notes: ""
            }))
        }
      };
      // Debug: cek due_date sebelum submit
      console.log('🔍 QuickOrderInput - orderData.payment.payment_details before submit:', orderData.payment.payment_details);
      console.log('🔍 QuickOrderInput - apiPayload.payment.payment_details:', apiPayload.payment.payment_details);

      // Call API
      const result = await createOrder(apiPayload);

      // Tampilkan notifikasi singkat dan tutup modal
      setNotification({ show: true, message: 'Order berhasil dibuat!' });
      if (onSubmit) onSubmit(result);
      // Tutup modal setelah 1.5 detik
      setTimeout(() => {
        setNotification({ show: false, message: '' });
        if (onCancel) onCancel();
      }, 1500);

    } catch (error) {
      console.error('[ERROR] QuickOrder - Failed to create order:', error);
      setSubmitError(
        error?.response?.data?.error?.message
        || error?.response?.data?.message
        || error?.message
        || 'Gagal membuat order. Silakan coba lagi.'
      );
    }
  };



  // Total pembayaran, paid, minDP, change
  const total = orderData.payment.total_price || 0;
  const paid = orderData.payment.payment_details.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const minDP = Math.ceil(total * 0.5);
  const change = paid > total ? paid - total : 0;

  // Stepper progress
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200
            ${idx < step ? 'bg-blue-500 text-white' : idx === step ? 'bg-blue-700 text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-400'}`}>{idx + 1}</div>
          {idx < steps.length - 1 && <div className={`w-8 h-1 ${idx < step ? 'bg-blue-500' : 'bg-gray-200'} rounded-full`}></div>}
        </div>
      ))}
    </div>
  );

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h3 className="font-semibold text-lg mb-2 text-blue-700 font-montserrat tracking-wide">Input Data Order</h3>
            <QuickOrderCustomerSelect
              selectedCustomer={orderData.customer}
              setShowCustomerSearch={setShowCustomerSearch}
              onRemove={() => setOrderData(prev => ({ ...prev, customer: null }))}
            />
            {/* Tambahan: Qty Item & Order Type */}
            <div className="flex flex-row gap-4 mt-4 flex-wrap">
              <div className="flex flex-col flex-1 min-w-[140px]">
                <QuantityInput
                  value={orderData.quantity || 0}
                  onChange={(value) => setOrderData(prev => ({ ...prev, quantity: value }))}
                  label="Jumlah Item"
                  size="default"
                />
              </div>
              <div className="flex flex-col flex-1 min-w-[140px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-montserrat">Order Type</label>
                <select
                  value={orderData.order_type || 'offline'}
                  onChange={e => setOrderData(prev => ({ ...prev, order_type: e.target.value }))}
                  className="w-full p-2 h-14 border border-gray-200 rounded-lg text-sm font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  style={{ WebkitAppearance: 'none', backgroundColor: 'white' }}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            {/* Request Kurir - hanya muncul jika order type online */}
            {orderData.order_type === 'online' && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200 flex flex-col gap-2 shadow-sm">
                <label className="flex items-center cursor-pointer">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500 mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h3m4 0V7a2 2 0 00-2-2h-7.5a2 2 0 00-2 2v2" /></svg>
                  </span>
                  <div className="flex flex-col flex-1 mr-2">
                    <span className="font-bold text-blue-700 text-base font-montserrat">Request Pickup oleh Kurir</span>
                    <span className="text-[10px] text-blue-500 font-montserrat mt-0.5 leading-tight">Jika dicentang, order akan muncul di peran kurir</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requestPickup}
                    onChange={e => setRequestPickup(e.target.checked)}
                    className="w-5 h-5 accent-blue-500 font-montserrat flex-shrink-0"
                  />
                </label>
                {requestPickup && (
                  <div className="grid grid-cols-2 gap-3 mt-2 font-montserrat">
                    <div className="flex flex-col">
                      <label className="text-xs text-blue-700 font-semibold mb-1 font-montserrat">Tanggal Pickup</label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={e => setPickupDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-blue-400 w-full"
                        min={getLocalDate()}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-blue-700 font-semibold mb-1 font-montserrat">Jam Pickup</label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={e => setPickupTime(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-blue-400 w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <QuickOrderTreatmentSelect
                treatments={treatments}
                discounts={discounts}
                selectedTreatments={orderData.order_details}
                setSelectedTreatments={order_details => handleUpdateOrderDetails(order_details)}
                updateTreatmentDetail={(id, field, value) => {
                  handleUpdateOrderDetails(orderData.order_details.map(t => t.id === id ? { ...t, [field]: value } : t));
                }}
                processTimeOptions={processTimeOptions}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h3 className="font-semibold text-lg mb-2 text-blue-700 font-montserrat tracking-wide">Pembayaran</h3>

            <QuickOrderPaymentInput
              payments={orderData.payment.payment_details}
              setPayments={handleUpdatePaymentDetails}
              handlePaymentChange={handlePaymentChange}
              handlePaymentMethodChange={handlePaymentMethodChange}
              addPayment={addPayment}
              removePayment={removePayment}
              isDP={orderData.isDP}
              setIsDP={val => setOrderData(prev => ({ ...prev, isDP: val }))}
              minDP={minDP}
              total={total}
              paid={paid}
              change={change}
              onValidationChange={handleValidationChange}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[9999]">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl border border-blue-100">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg font-semibold text-white tracking-wide font-montserrat">Quick Order</h2>
          <AnimatedButton
            variant="grey"
            onClick={onCancel}
            className="p-2 hover:bg-blue-100 rounded-lg"
          >
            <X className="w-5 h-5 text-blue" />
          </AnimatedButton>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {renderProgress()}
          {renderStep()}
        </div>

        {/* Footer - Fixed */}
        <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
          {/* Error dari backend saat submit order */}
          {submitError && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-sm font-montserrat flex-1 whitespace-pre-line">{submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError('')}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Tutup pesan error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {(Object.keys(paymentValidation.errors).length > 0 || Object.keys(paymentValidation.warnings).length > 0) && (
            <div className="mb-3 space-y-2">
              {/* Warnings */}
              {Object.keys(paymentValidation.warnings).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(paymentValidation.warnings).map(([key, message]) => (
                    <div key={key} className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-montserrat">{message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <AnimatedButton
                variant="grey"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3"
              >
                Kembali
              </AnimatedButton>
            )}

            {step < steps.length - 1 && (
              <AnimatedButton
                variant="blue"
                onClick={() => setStep(step + 1)}
                disabled={orderData.order_details.length === 0}
                className="flex-1 py-3"
              >
                Lanjut
              </AnimatedButton>
            )}

            {step === steps.length - 1 && (
              <AnimatedButton
                variant="green"
                onClick={handleSubmit}
                disabled={orderData.order_details.length === 0}
                className="flex-1 py-3"
              >
                Tambah Pesanan
              </AnimatedButton>
            )}
          </div>
        </div>

        {showCustomerSearch && (
          <QuickOrderCustomerSearchModal
            customers={customers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSelect={handleCustomerSelect}
            onClose={() => setShowCustomerSearch(false)}
            onSearch={handleCustomerSearch}
            loading={false}
          />
        )}





        {/* Notification Modal */}
        {notification.show && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs text-center">
              <div className="text-green-600 font-bold text-lg mb-2 flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Berhasil
              </div>
              <div className="text-gray-700 mb-4 font-montserrat text-sm">{notification.message}</div>
              <button
                onClick={() => {
                  setNotification({ show: false, message: '' });
                  if (onCancel) onCancel();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickOrderInput; 