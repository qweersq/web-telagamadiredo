import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Minus, X, Search, User, Calendar, DollarSign, QrCode, CreditCard, AlertCircle, AlertTriangle, ArrowLeft, Info, Coins, Utensils, MessageSquare} from 'lucide-react';
import QuickOrderCustomerSelect, {isWalkInCustomer} from '../../components/QuickInput/QuickOrderCustomerSelect';
import QuickOrderTreatmentSelect from '../../components/QuickInput/QuickOrderTreatmentSelect';
import QuickOrderPaymentInput from '../../components/QuickInput/QuickOrderPaymentInput';
import QuickOrderCustomerSearchModal from '../../components/QuickInput/QuickOrderCustomerSearchModal';
import QuickOrderDiscountModal from '../../components/QuickInput/QuickOrderDiscountModal';
import QuickOrderPrintReceipt from '../../components/QuickInput/QuickOrderPrintReceipt';
import AIDetectionModal from '../../components/QuickInput/AIDetectionModal';
// Chip "cabang aktif" — komponen yang sama dengan yang dipakai di header beranda
// (`components/Com Header/BranchActiveChip.jsx`). Dipasang juga di atas judul
// "Input Data Pesanan" supaya user tahu pesanan ini masuk ke cabang mana.
import BranchActiveChip from '../../components/Com Header/BranchActiveChip';
import {getCustomers, searchCustomers, getTreatments, getDiscounts, createOrder, createCustomer, checkCustomerByPhone, getWalkInCustomer} from './api/orderApi';
import {groupOrderDetailsForFE} from './utils/orderTransformNew';
import AnimatedButton from '../../components/Design/AnimatedButton';
import {useShift} from '../../contexts/ShiftContext';
import {getUserProfile, getActiveShiftId, invalidateUserProfileCache} from '../../utils/userProfileHelper';
import {formatNumber, formatOrderType, ORDER_TYPE} from '../../utils/labelFormatter';
import {isFnbTreatment, isKitchenTreatment, filterTreatmentsForOutlet, ORDER_MODE} from '../../utils/treatmentHelper';
import instance from '../../config/api';

// Helper function untuk mendapatkan userData dari API
async function getUserData() {
  try {
    const profile = await getUserProfile();
    if (!profile) return null;

    // Extract data yang dibutuhkan dari profile
    const userData = {
      id: profile.user?.id,
      name: profile.user?.name,
      email: profile.user?.email,
      role: profile.user?.role,
      branch_id: profile.branch?.id,
      branch_name: profile.branch?.name,
      branch_address: profile.branch?.address,
      branch_order_mode: profile.branch?.order_mode || 'loket',
      tenant_id: profile.tenant?.id,
      tenant_name: profile.tenant?.business_name
    };

    console.log('✅ QuickOrder - getUserData from API:', userData);
    return userData;
  } catch (error) {
    console.error('[ERROR] QuickOrder - Failed to get userData from API:', error);
    return null;
  }
}

const masterDiscounts = [
  { id: 1, name: 'Diskon Member', type: 'percent', value: 10 },
  { id: 2, name: 'Promo Akhir Bulan', type: 'nominal', value: 15000 },
  { id: 3, name: 'Tanpa Diskon', type: 'nominal', value: 0 },
];

const steps = [
  { label: 'Input Data', key: 'input' },
  { label: 'Pembayaran', key: 'payment' },
];

const initialOrderData = {
  customer: null,
  order_details: [],
  payment: {
    payment_details: [],
    discount_id: null, // Payment-level discount
    notes: '', // Payment notes
    points_to_redeem: 0 // Points to redeem for discount
  },
  entry_date: null, // ✅ Set ke null, akan di-set saat submit
  quantity: 0,
  order_type: 'dine-in', // Dine-in / takeaway (Agrowisata Telaga)
  customer_name: '', // Nama pemesan walk-in (tanpa member)
  table_number: '', // Nomor meja, wajib untuk dine-in
  customer_note: '', // Catatan bebas customer untuk keseluruhan pesanan
  total: 0,
  isDP: false,
  shift_id: null, // ✅ Add shift_id
  referred_by_phone: null, // Referral phone number
};

const QuickOrder = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(initialOrderData);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customers, setCustomers] = useState([]);
  // Pelanggan default "Pelanggan Umum" (walk-in) — dipakai otomatis kalau kasir
  // tidak memilih member, supaya transaksi tiket tetap cepat.
  const [guestCustomer, setGuestCustomer] = useState(null);
  // Mode operasional cabang: 'cafe' butuh nama pemesan + no meja, 'loket' tidak
  const [branchOrderMode, setBranchOrderMode] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [step, setStep] = useState(0); // step wizard
  const [paymentValidation, setPaymentValidation] = useState({ isValid: false, errors: {}, warnings: {} });
  const [requestPickup, setRequestPickup] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pickupTime, setPickupTime] = useState('14:00');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrderData, setPrintOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guard sinkron: state React belum tentu ter-update saat double-click,
  // jadi pakai ref supaya submit kedua langsung ditolak.
  const submitLockRef = useRef(false);
  // === DEBUG double-submit ===
  const renderCountRef = useRef(0);
  const clickCountRef = useRef(0);
  renderCountRef.current += 1;
  const [submitError, setSubmitError] = useState('');
  const [orderLimit, setOrderLimit] = useState(null);
  const [referralCheckResult, setReferralCheckResult] = useState(null); // { found: boolean, customer: null | object, loading: boolean }
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pointsSettings, setPointsSettings] = useState({ enabled: false, redeem_rate: 50, referral_bonus_referrer: 10, referral_bonus_new_customer: 10, first_order_bonus: 10, first_order_bonus_enabled: true }); // Default: disabled, 50 (100 poin = Rp 5.000)
  const [showAIDetectionModal, setShowAIDetectionModal] = useState(false);
  const { user, shift, fetchProfileAndShift } = useShift();

  // Mode operasional: loket (tiket), cafe (F&B), mixed (keduanya).
  // Data tamu & meja hanya relevan untuk pesanan yang berisi produk F&B.
  const isCafeMode = branchOrderMode === ORDER_MODE.CAFE;
  const isMixedMode = branchOrderMode === ORDER_MODE.MIXED;
  const cartHasFnb = (orderData.order_details || []).some((item) =>
    isFnbTreatment(item?.treatment || item)
  );
  const needsGuestFields = isCafeMode || (isMixedMode && cartHasFnb);

  // Katalog Quick Order mengikuti outlet cabang aktif: kategori produk yang
  // punya `order_mode` hanya tampil di outlet yang cocok, sisanya tampil di semua.
  const visibleTreatments = useMemo(
    () => filterTreatmentsForOutlet(treatments, branchOrderMode),
    [treatments, branchOrderMode]
  );

  // Penyajian punya default di level order (dropdown → orders.order_type).
  // Item di keranjang boleh menimpanya sendiri, dan backend akan meringkas
  // hasil akhirnya menjadi 'dine-in' / 'takeaway' / 'mixed'.
  const branchDefaultServeMode = needsGuestFields ? ORDER_TYPE.DINE_IN : ORDER_TYPE.TAKEAWAY;
  const orderServeMode = [ORDER_TYPE.DINE_IN, ORDER_TYPE.TAKEAWAY].includes(orderData.order_type)
    ? orderData.order_type
    : null;
  const defaultServeMode = orderServeMode || branchDefaultServeMode;
  const resolveServeMode = (item) => item?.serve_mode || defaultServeMode;
  const orderItemCount = (orderData.order_details || []).length;
  const hasDineInItem = (orderData.order_details || []).some(
    (item) => resolveServeMode(item) === ORDER_TYPE.DINE_IN
  );
  // Nomor meja wajib kalau order-nya dine-in/campur atau ada item dine-in.
  const needsTableNumber = needsGuestFields && (
    orderData.order_type === ORDER_TYPE.DINE_IN ||
    orderData.order_type === ORDER_TYPE.MIXED ||
    hasDineInItem
  );

  const handleValidationChange = useCallback((isValid, errors, warnings) => {
    setPaymentValidation({ isValid, errors, warnings });
  }, []);

  // Check if user has seen the explanation modal before

  // Load order limit data
  useEffect(() => {
    const loadOrderLimit = async () => {
      try {
        const response = await instance.get('/subscriptions/check-order-limit');
        if (response.data.success) {
          setOrderLimit(response.data.data);
        }
      } catch (error) {
        console.error('Error loading order limit:', error);
      }
    };
    loadOrderLimit();
  }, []);

  // Mode cabang menentukan field tamu yang perlu diisi kasir
  useEffect(() => {
    const loadBranchMode = async () => {
      try {
        const profile = await getUserProfile();
        // Mode tak diketahui → 'mixed' supaya katalog tidak terpotong tanpa sengaja.
        setBranchOrderMode(profile?.branch?.order_mode || ORDER_MODE.MIXED);
      } catch (error) {
        console.error('Error loading branch order mode:', error);
        setBranchOrderMode(ORDER_MODE.MIXED);
      }
    };
    loadBranchMode();
  }, []);

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
            referral_bonus_referrer: apiData.referral_bonus_referrer !== undefined ? Number(apiData.referral_bonus_referrer) : 10,
            referral_bonus_new_customer: apiData.referral_bonus_new_customer !== undefined ? Number(apiData.referral_bonus_new_customer) : 10,
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

  useEffect(() => {
    const fetchData = async () => {
      setLoadingCustomers(true);
      try {
        const cust = await getCustomers();
        // Pastikan customers adalah array
        setCustomers(Array.isArray(cust) ? cust : []);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }

      // Pelanggan Umum (walk-in) otomatis terpilih supaya kasir bisa langsung
      // menambah item tanpa mengisi data pelanggan.
      try {
        const walkIn = await getWalkInCustomer();
        if (walkIn) {
          setGuestCustomer(walkIn);
          setOrderData((prev) => (prev.customer ? prev : { ...prev, customer: walkIn }));
        }
      } catch (err) {
        console.error('Error fetching walk-in customer:', err);
      }
      try {
        const treat = await getTreatments();
        setTreatments(Array.isArray(treat) ? treat : []);
      } catch (err) {
        console.error('Error fetching treatments:', err);
        setTreatments([]);
      }
      try {
        const disc = await getDiscounts();
        setDiscounts(Array.isArray(disc) ? disc : []);
      } catch (err) {
        console.error('Error fetching discounts:', err);
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
      setCustomers(Array.isArray(data) ? data : []);
    } else {
      const data = await searchCustomers(term);
      setCustomers(Array.isArray(data) ? data : []);
    }
  };

  // Handler untuk update customer data setelah membership ditambahkan
  const handleCustomerUpdate = async (customer) => {
    try {
      // Fetch customer data terbaru dari API
      const response = await searchCustomers(customer.name);
      if (response && response.length > 0) {
        const updatedCustomer = response.find(c => c.id === customer.id);
        if (updatedCustomer) {
          setOrderData(prev => ({ ...prev, customer: updatedCustomer }));
        }
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
    }
  };

  // Handler pilih customer (untuk QuickOrderCustomerSelect dan QuickOrderCustomerSearchModal)
  const handleCustomerSelect = async (customer) => {
    // Jika customer baru (tidak ada id atau id temporary), create dulu
    if (!customer.id || customer.id.toString().length > 10) {
      try {
        const newCustomer = await createCustomer({
          name: customer.name,
          phone: customer.phone
        });

        // Update customer dengan data dari API
        const customerWithId = {
          ...customer,
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          total_orders: 0 // Customer baru pasti total_orders = 0
        };

        // Update customers list
        setCustomers(prev => [customerWithId, ...prev]);

        // Set customer yang sudah ada ID
        setOrderData(prev => ({ ...prev, customer: customerWithId }));
      } catch (error) {
        console.error('[ERROR] QuickOrder - Failed to create customer:', error);
        // Extract error message from backend response
        const errorMessage = error.response?.data?.error?.message
          || error.response?.data?.message
          || 'Gagal membuat customer baru. Silakan coba lagi.';
        alert(errorMessage);
        return;
      }
    } else {
      // Customer sudah ada, langsung set
      // Reset referral, discount, notes jika customer bukan baru (total_orders > 0)
      if (customer.total_orders > 0) {
        setOrderData(prev => ({
          ...prev,
          customer,
          referred_by_phone: null,
          payment: {
            ...prev.payment,
            discount_id: null,
            notes: '',
            points_to_redeem: 0 // Reset points redeem when customer changes
          }
        }));
        setReferralCheckResult(null);
      } else {
        setOrderData(prev => ({
          ...prev,
          customer,
          payment: {
            ...prev.payment,
            points_to_redeem: 0 // Reset points redeem when customer changes
          }
        }));
      }
    }
  };

  // Handler update treatments/order_details (untuk QuickOrderTreatmentSelect)
  const handleUpdateOrderDetails = (order_details) => {
    setOrderData(prev => ({ ...prev, order_details }));
  };

  // Handler hasil AI Detection — merge items tanpa duplikasi id
  const handleAIResult = (groupedItems) => {
    setOrderData(prev => {
      const existing = prev.order_details || [];
      const existingIds = new Set(existing.map(d => d.id));
      const newDetails = groupedItems.filter(g => !existingIds.has(g.id));
      return { ...prev, order_details: [...existing, ...newDetails] };
    });
    setShowAIDetectionModal(false);
  };

  // Kalkulasi subtotal per treatment (termasuk custom_price, diskon per treatment, dan qty)
  const subtotal = orderData.order_details.reduce((sum, t) => {
    const basePrice = t.treatment?.price ? Number(t.treatment.price) : 0;
    const effectivePrice = t.custom_price != null ? Number(t.custom_price) : basePrice; // ← Custom price priority (termasuk 0)
    const disc = t.discount ? (t.discount.type === 'percent' ? effectivePrice * (t.discount.value / 100) : t.discount.value) : 0;
    const perItem = Math.max(effectivePrice - disc, 0);
    const qty = t.qty && t.qty > 0 ? t.qty : 1;
    return sum + perItem * qty;
  }, 0);

  // Helper: hitung total order (mirip context OrderDetail)
  function getOrderTotal(order_details) {
    if (!Array.isArray(order_details)) return 0;
    return order_details.reduce((sum, t) => {
      const basePrice = t.treatment?.price ? Number(t.treatment.price) : 0;
      const effectivePrice = t.custom_price != null ? Number(t.custom_price) : basePrice; // ← Custom price priority (termasuk 0)
      let disc = 0;
      if (t.discount) {
        const discVal = (t.discount.discount != null) ? Number(t.discount.discount) : Number(t.discount.value) || 0;
        if (t.discount.type === 'percent') {
          disc = effectivePrice * (discVal / 100); // ← Apply discount to effectivePrice
        } else if (t.discount.type === 'nominal') {
          disc = discVal;
        }
      }
      const perItem = Math.max(effectivePrice - disc, 0);
      const qty = t.qty && t.qty > 0 ? t.qty : 1;
      return sum + perItem * qty;
    }, 0);
  }

  // Update total di orderData dan orderData.payment setiap kali order_details, payment discount, atau points redeem berubah
  useEffect(() => {
    const subtotal = getOrderTotal(orderData.order_details);

    // Apply payment-level discount jika ada
    let totalAfterPaymentDiscount = subtotal;
    if (orderData.payment.discount_id) {
      // ✅ FIX: Gunakan Number() agar tidak gagal saat ID tersimpan sebagai string vs integer
      const paymentDiscount = discounts.find(d => Number(d.id) === Number(orderData.payment.discount_id));
      if (paymentDiscount) {
        const discVal = paymentDiscount.discount != null ? Number(paymentDiscount.discount) : Number(paymentDiscount.value) || 0;
        // ✅ FIX: Support 'percent' dan 'percentage' sebagai alias yang sama
        if (paymentDiscount.type === 'percent' || paymentDiscount.type === 'percentage') {
          totalAfterPaymentDiscount = subtotal - (subtotal * discVal / 100);
        } else if (paymentDiscount.type === 'nominal') {
          totalAfterPaymentDiscount = subtotal - discVal;
        }
        totalAfterPaymentDiscount = Math.max(0, totalAfterPaymentDiscount);
      }
    }

    // Apply points discount jika ada
    // Points discount dibatasi maksimal sampai totalAfterPaymentDiscount (tidak bisa melebihi total)
    const pointsToRedeem = orderData.payment.points_to_redeem || 0;
    let pointsDiscountAmount = 0;
    if (pointsToRedeem > 0) {
      const calculatedDiscount = Math.floor((pointsToRedeem / 100) * (pointsSettings.redeem_rate * 100));
      pointsDiscountAmount = Math.min(calculatedDiscount, totalAfterPaymentDiscount);
    }

    const finalTotal = Math.max(0, totalAfterPaymentDiscount - pointsDiscountAmount);

    setOrderData(prev => ({
      ...prev,
      total: finalTotal,
      payment: {
        ...prev.payment,
        total_price: finalTotal
      }
    }));
  }, [orderData.order_details, orderData.payment.discount_id, orderData.payment.points_to_redeem, discounts, pointsSettings.redeem_rate]);

  // Update payment_details di orderData.payment
  const handleUpdatePaymentDetails = (payment_details) => {
    setOrderData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        payment_details
      }
    }));
  };

  // Ambil pesan error dari response backend, jangan ditelan jadi pesan generik
  const getApiErrorMessage = (error) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'Gagal membuat order. Silakan coba lagi.';

  // Submit order
  const handleSubmit = async () => {
    // === DEBUG double-submit ===
    const tag = `[TambahPesanan ${new Date().toISOString().slice(11, 23)}]`;
    console.log(`${tag} 1. handler dipanggil`, {
      lock: submitLockRef.current,
      isSubmitting,
      itemCount: orderData.order_details.length,
      renderCount: renderCountRef.current,
    });
    if (submitLockRef.current || isSubmitting) {
      console.warn(`${tag} DIBLOKIR oleh guard (lock=${submitLockRef.current}, isSubmitting=${isSubmitting})`);
      return;
    }
    console.log(`${tag} 2. lolos guard, kunci diambil`);
    setSubmitError('');
    const activeCustomer = orderData.customer || guestCustomer;
    if (!activeCustomer || orderData.order_details.length === 0) {
      alert('Tambahkan produk atau paket terlebih dahulu!');
      return;
    }
    if (orderData.order_type === 'online' && requestPickup && (!pickupDate || !pickupTime)) {
      alert('Tanggal dan jam pickup wajib diisi!');
      return;
    }

    // Telaga: walk-in wajib punya nama pemesan, dine-in wajib punya nomor meja
    const isOrderWalkIn = isWalkInCustomer(activeCustomer);
    const guestName = (orderData.customer_name || '').trim();
    const tableNumber = (orderData.table_number || '').trim();

    if (needsGuestFields && isOrderWalkIn && guestName.length < 2) {
      alert('Nama pemesan wajib diisi (minimal 2 huruf).');
      return;
    }
    if (needsTableNumber && !tableNumber) {
      alert('Nomor meja wajib diisi karena ada item yang dimakan di tempat (Dine-in).');
      return;
    }

    // ✅ Validate points_to_redeem before submit
    const pointsToRedeem = orderData.payment?.points_to_redeem || 0;
    const minRedeem = pointsSettings?.min_redeem || 100;
    if (pointsToRedeem > 0 && pointsToRedeem < minRedeem) {
      alert(`Poin Tidak Valid: Minimum redeem adalah ${minRedeem} poin. Anda memasukkan ${pointsToRedeem} poin. Silakan ubah jumlah poin atau hapus penggunaan poin.`);
      return;
    }

    // Kunci dikunci SEBELUM await pertama, supaya klik beruntun tidak lolos.
    submitLockRef.current = true;
    setIsSubmitting(true);
    console.log(`${tag} 3. validasi lokal lolos, mulai cek order limit`);
    try {
      // Check order limit before submit
      try {
        const limitResponse = await instance.get('/subscriptions/check-order-limit');
        console.log(`${tag} 4. order limit selesai`, limitResponse?.data?.data);
        if (limitResponse.data.success && !limitResponse.data.data.canCreate) {
          alert(`Batas maksimal order per bulan telah tercapai (${limitResponse.data.data.current}/${limitResponse.data.data.max}). Silakan upgrade paket untuk menambah order.`);
          return;
        }
      } catch (error) {
        console.error('Error checking order limit:', error);
      }
      // ✅ Invalidate cache untuk memastikan data fresh
      console.log('🔄 Invalidating cache before getting fresh shift data...');
      invalidateUserProfileCache();

      // Ambil data shift & user terbaru langsung dari API (mengatasi masalah timing context)
      const latestShiftId = await getActiveShiftId(); // ✅ Gunakan helper yang reliable
      const userData = await getUserData();

      console.log('API data:', {
        shiftId: latestShiftId,
        userId: userData?.id,
        branchId: userData?.branch_id
      });
      console.log('Final values:', {
        shift_id: latestShiftId, // ✅ Sekarang akan ada nilai
        created_by: userData?.id || 1,
        branch_id: userData?.branch_id || 1
      });

      // ✅ Validasi shift_id sebelum lanjut
      if (!latestShiftId) {
        alert('Shift belum dibuka. Silakan buka shift terlebih dahulu.');
        return;
      }

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
      const defaultDueDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().slice(0, 10);
      };
      const todayIso = new Date().toISOString().slice(0, 10);

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
        // Walk-in: biarkan backend membuat customer dari nama pemesan
        customer_id: isOrderWalkIn ? null : activeCustomer.id,
        customer_name: isOrderWalkIn && guestName ? guestName : null,
        branch_id: userData?.branch_id || 1, // Gunakan branch_id dari userData atau default
        entry_date: new Date().toISOString().slice(0, 10), // ✅ Set entry_date saat submit (waktu sebenarnya order dibuat)
        quantity: orderData.quantity || fallbackQuantity,
        order_type: needsGuestFields
          ? (orderData.order_type || ORDER_TYPE.DINE_IN)
          : ORDER_TYPE.TAKEAWAY,
        table_number: needsTableNumber ? tableNumber : null,
        customer_note: (orderData.customer_note || '').trim() || null,
        shift_id: latestShiftId, // ✅ Gunakan shift_id dari helper yang reliable
        created_by: userData?.id || 1, // Gunakan userData yang sudah diambil
        tenant_id: userData?.tenant_id || 1, // Tambahkan tenant_id dari userData
        referred_by_phone: orderData.referred_by_phone || null, // Referral phone number
        order_details: expandedOrderDetails.map((t, idx) => {
          // Gunakan userData yang sudah diambil sebelumnya
          const employeeId = userData?.id || 1; // Fallback ke 1 jika tidak ada userData

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

          // ✅ Calculate final_price based on custom_price (if exists), price, and discount
          const basePrice = Number(t.treatment?.price || t.price || 0);
          const effectivePrice = t.custom_price != null ? Number(t.custom_price) : basePrice; // ← Custom price priority (termasuk 0)
          let discountAmount = 0;

          if (t.discount) {
            // Prioritas: discount.discount > discount.value
            const discVal = (t.discount.discount != null)
              ? Number(t.discount.discount)
              : Number(t.discount.value) || 0;

            if (t.discount.type === 'percent') {
              discountAmount = effectivePrice * (discVal / 100); // ← Apply to effectivePrice
            } else if (t.discount.type === 'nominal') {
              discountAmount = discVal;
            }
          }

          const finalPrice = Math.max(effectivePrice - discountAmount, 0);
          const isProduct = t.requires_tracking === false || t.treatment?.requires_tracking === false;
          const detailDueDate = t.due_date || t.dueDate || (isProduct ? todayIso : defaultDueDate());
          // Item dapur (makanan/minuman/snack) harus mulai dari antrian supaya masuk
          // flow dapur: antrian -> on_progress -> done. Item lain (tiket, souvenir)
          // tidak perlu disiapkan jadi langsung done.
          const detailStatus = isKitchenTreatment(t.treatment || t)
            ? 'antrian'
            : (isProduct ? 'done' : (requestPickup ? 'not_yet' : 'antrian'));

          return {
            employee_id: employeeId, // Gunakan employee_id dari userData
            treatment_id: t.treatment?.id || t.id,
            item_id: itemId, // ✅ Map item_id dari items data
            discount_id: t.discount?.id || null,
            process_time: 'regular', // Default value
            process_time_cost: 0, // Process time cost dihilangkan
            due_date: detailDueDate,
            price: basePrice,
            custom_price: t.custom_price != null ? t.custom_price : null, // ✅ Send custom_price to backend (termasuk 0)
            custom_price_reason: t.custom_price_reason || null, // ✅ Send custom_price_reason
            final_price: finalPrice, // ✅ Now calculated with custom_price
            status: detailStatus,
            // Dine-in / bawa pulang per item (satu order boleh campur)
            serve_mode: resolveServeMode(t),
            options_json: t.options && Object.keys(t.options).length > 0 ? t.options : null,
            description: itemNotes || t.note || t.description || '', // ✅ Map description dari catatan item
            shoes_photos: shoesPhotos, // ✅ Map shoes_photos dari item photos
            ...(orderData.order_type === 'online' && requestPickup ? {
              pickup_method: 'pickup',
              delivery_status: isProduct ? 'done' : 'scheduled',
              delivery_date: pickupDate,
              delivery_time: pickupTime
            } : {
              pickup_method: null,
              delivery_status: isProduct ? 'done' : 'not_yet',
              delivery_date: null,
              delivery_time: null
            })
          };
        }),
        payment: (() => {
          // ✅ Calculate subtotal from order_details (sum of final_price from each order_detail)
          const calculatedSubtotal = expandedOrderDetails.reduce((sum, t) => {
            const basePrice = Number(t.treatment?.price || t.price || 0);
            const effectivePrice = t.custom_price != null ? Number(t.custom_price) : basePrice;
            let discountAmount = 0;

            if (t.discount) {
              const discVal = (t.discount.discount != null)
                ? Number(t.discount.discount)
                : Number(t.discount.value) || 0;

              if (t.discount.type === 'percent') {
                discountAmount = effectivePrice * (discVal / 100);
              } else if (t.discount.type === 'nominal') {
                discountAmount = discVal;
              }
            }

            const finalPrice = Math.max(effectivePrice - discountAmount, 0);
            return sum + finalPrice;
          }, 0);

          // ✅ Calculate payment-level discount if exists
          let paymentDiscountAmount = 0;
          if (orderData.payment.discount_id) {
            // ✅ FIX: Gunakan Number() agar tidak gagal saat ID tersimpan sebagai string vs integer
            const paymentDiscount = discounts.find(d => Number(d.id) === Number(orderData.payment.discount_id));
            if (paymentDiscount) {
              const discVal = paymentDiscount.discount != null
                ? Number(paymentDiscount.discount)
                : Number(paymentDiscount.value) || 0;

              // ✅ FIX: Support 'percent' dan 'percentage' sebagai alias yang sama
              if (paymentDiscount.type === 'percent' || paymentDiscount.type === 'percentage') {
                paymentDiscountAmount = Math.round(calculatedSubtotal * (discVal / 100));
              } else if (paymentDiscount.type === 'nominal') {
                paymentDiscountAmount = Math.round(discVal);
              }
            }
          }

          // ✅ Calculate points discount if exists
          // Note: Backend akan auto-adjust jika points discount melebihi subtotal
          const pointsToRedeem = orderData.payment.points_to_redeem || 0;
          const pointsDiscountAmount = pointsToRedeem > 0 ? Math.floor((pointsToRedeem / 100) * (pointsSettings.redeem_rate * 100)) : 0;

          // ✅ Calculate final_price after payment discount and points discount
          // Note: Backend akan recalculate, ini hanya untuk preview
          const calculatedFinalPrice = Math.max(0, Math.round(calculatedSubtotal - paymentDiscountAmount - pointsDiscountAmount));

          // ✅ Recalculate paid and remaining based on calculatedFinalPrice
          const calculatedPaid = orderData.payment.payment_details.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const calculatedRemaining = Math.max(0, calculatedFinalPrice - calculatedPaid);
          const calculatedChange = calculatedPaid > calculatedFinalPrice ? calculatedPaid - calculatedFinalPrice : 0;

          // ✅ Calculate payment status based on calculatedFinalPrice and calculatedPaid
          let calculatedPaymentStatus = 'unpaid';
          if (calculatedFinalPrice === 0) {
            calculatedPaymentStatus = 'paid'; // Free service
          } else if (calculatedPaid === 0) {
            calculatedPaymentStatus = 'unpaid';
          } else if (calculatedPaid > 0 && calculatedPaid < calculatedFinalPrice) {
            calculatedPaymentStatus = 'dp';
          } else if (calculatedPaid >= calculatedFinalPrice) {
            calculatedPaymentStatus = 'paid';
          }

          return {
            status: calculatedPaymentStatus,
            method: orderData.payment.payment_details[0]?.method || 'cash',
            // ✅ Jangan kirim total_discount dan final_price, biarkan backend yang menghitung
            // total_discount: paymentDiscountAmount, // ❌ Removed - backend will calculate
            // final_price: calculatedFinalPrice, // ❌ Removed - backend will calculate
            subtotal: Math.round(calculatedSubtotal), // ✅ Subtotal from order_details (required by backend)
            total_service: Math.round(calculatedSubtotal), // ✅ Total service = subtotal
            paid_amount: calculatedPaid,
            remaining_amount: calculatedRemaining, // ✅ Recalculated based on final_price (for preview only)
            additional_cost: 0,
            due_date: null,
            notes: orderData.payment.notes || '', // Payment notes
            discount_id: orderData.payment.discount_id || null, // Payment-level discount
            points_to_redeem: pointsToRedeem > 0 ? pointsToRedeem : null, // ✅ Points to redeem (backend will validate & adjust)
            total_price: Math.round(calculatedSubtotal), // ✅ Total price = subtotal (before discount)
            total_process_time_cost: 0,
            date: new Date().toISOString().slice(0, 10),
            money: calculatedPaid,
            change: calculatedChange, // ✅ Recalculated based on final_price (for preview only)
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
                shift_id: latestShiftId, // ✅ Gunakan shift_id dari helper yang reliable
                payment_method_id: p.payment_method_id || p.payment_method?.id || null, // ✅ Use payment_method_id from finance account
                money_received: p.money_received || null, // ✅ NEW: Cash change tracking
                change_amount: p.change_amount || null, // ✅ NEW: Cash change tracking
                date: new Date().toISOString().slice(0, 10),
                notes: ""
              }))
          };
        })()
      };

      // Call API
      console.log(`${tag} 5. KIRIM POST /orders`, {
        items: apiPayload.order_details?.length,
        table_number: apiPayload.table_number,
        customer_name: apiPayload.customer_name,
      });
      const sentAt = Date.now();
      const result = await createOrder(apiPayload);
      console.log(`${tag} 6. POST /orders SELESAI (${Date.now() - sentAt}ms) → order id`, result?.id);

      // Refresh order limit after successful creation
      try {
        const limitResponse = await instance.get('/subscriptions/check-order-limit');
        if (limitResponse.data.success) {
          setOrderLimit(limitResponse.data.data);
        }
      } catch (error) {
        console.error('Error refreshing order limit:', error);
      }

      // Set data order untuk print modal dan tampilkan langsung
      const transformedData = {
        ...result,
        order_details: groupOrderDetailsForFE(result.order_details || [])
      };
      setPrintOrderData(transformedData);
      setShowPrintModal(true);

      // Reset state setelah order berhasil dibuat
      setOrderData({
        ...initialOrderData,
        payment: {
          ...initialOrderData.payment,
          points_to_redeem: 0
        }
      });
      setReferralCheckResult(null);

    } catch (error) {
      console.error(`${tag} GAGAL saat create order:`, error?.response?.data || error?.message || error);
      setSubmitError(getApiErrorMessage(error));
    } finally {
      console.log(`${tag} 7. selesai, kunci dilepas`);
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Total pembayaran, paid, minDP, change
  const total = orderData.payment.total_price || 0;
  const paid = orderData.payment.payment_details.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const minDP = Math.ceil(total * 0.5);
  const change = paid > total ? paid - total : 0;

  // Stepper progress
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200
            ${idx < step ? 'bg-telaga-500 text-white' : idx === step ? 'bg-telaga-700 text-white scale-110 shadow-lg' : 'bg-telaga-100 text-telaga-900/40'}`}>{idx + 1}</div>
          {idx < steps.length - 1 && <div className={`w-8 h-1 ${idx < step ? 'bg-telaga-500' : 'bg-telaga-100'} rounded-full`}></div>}
        </div>
      ))}
    </div>
  );

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0: {
        // Data pelanggan + detail pesanan — kolom kanan pada layout split.
        const customerPanel = (
          <>
            <QuickOrderCustomerSelect
              selectedCustomer={orderData.customer || guestCustomer}
              setShowCustomerSearch={setShowCustomerSearch}
              onRemove={() => setOrderData(prev => ({ ...prev, customer: guestCustomer }))}
              onCustomerUpdate={handleCustomerUpdate}
              pointsSettings={pointsSettings}
              hideLabel={false}
              displayName={
                isWalkInCustomer(orderData.customer || guestCustomer)
                  ? (orderData.customer_name || '').trim() || null
                  : null
              }
            />
            {/* Detail kunjungan: nama pemesan + tipe pesanan + nomor meja (khusus cabang cafe) */}
            {needsGuestFields && (
            <div className="mt-3 rounded-xl border border-telaga-100 bg-white px-2.5 py-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-telaga-600" />
                <h3 className="text-xs font-semibold font-montserrat tracking-wide text-telaga-900">
                  Detail Kunjungan
                </h3>
              </div>

              <div className="space-y-2">
                {/* Nama pemesan */}
                <div>
                  <label className="mb-0.5 block text-[11px] font-semibold font-montserrat text-telaga-900/60">
                    Nama Pemesan <span className="text-senja-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderData.customer_name || ''}
                    onChange={(e) => setOrderData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Contoh: Bu Sari"
                    className="w-full rounded-lg border border-telaga-100 bg-krem px-2.5 py-2 text-sm font-montserrat text-telaga-950 placeholder-telaga-900/35 focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  />
                  {!isWalkInCustomer(orderData.customer || guestCustomer) && (
                    <p className="mt-0.5 text-[10px] font-montserrat text-telaga-900/45">
                      Member terpilih: {orderData.customer?.name}
                    </p>
                  )}
                </div>

                {/* Penyajian (orders.order_type) + No. Meja sejajar supaya ringkas */}
                <div className={`grid gap-2 ${needsTableNumber ? 'grid-cols-[minmax(0,1fr)_4.75rem]' : 'grid-cols-1'}`}>
                  <div className="min-w-0">
                    <label
                      htmlFor="order-serve-mode"
                      className="mb-0.5 block text-[11px] font-semibold font-montserrat text-telaga-900/60"
                    >
                      Penyajian <span className="text-senja-500">*</span>
                    </label>
                    <select
                      id="order-serve-mode"
                      value={orderData.order_type || ORDER_TYPE.DINE_IN}
                      onChange={(e) =>
                        setOrderData(prev => ({ ...prev, order_type: e.target.value }))
                      }
                      className="w-full appearance-none rounded-lg border border-telaga-100 bg-krem px-2.5 py-2 text-sm font-montserrat text-telaga-950 focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                    >
                      <option value={ORDER_TYPE.DINE_IN}>Dine In</option>
                      <option value={ORDER_TYPE.TAKEAWAY}>Bawa Pulang</option>
                      <option value={ORDER_TYPE.MIXED}>Campur</option>
                    </select>
                  </div>

                  {needsTableNumber && (
                    <div>
                      <label className="mb-0.5 block text-[11px] font-semibold font-montserrat text-telaga-900/60">
                        No. Meja <span className="text-senja-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orderData.table_number || ''}
                        onChange={(e) => setOrderData(prev => ({ ...prev, table_number: e.target.value }))}
                        placeholder="05"
                        className="w-full rounded-lg border border-telaga-100 bg-krem px-2.5 py-2 text-center text-sm font-montserrat text-telaga-950 placeholder-telaga-900/35 focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                      />
                    </div>
                  )}
                </div>

                {/* Catatan customer untuk keseluruhan pesanan */}
                <div>
                  <label className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold font-montserrat text-telaga-900/60">
                    <MessageSquare className="h-3 w-3" />
                    Catatan
                  </label>
                  <textarea
                    value={orderData.customer_note || ''}
                    onChange={(e) => setOrderData(prev => ({ ...prev, customer_note: e.target.value }))}
                    rows={2}
                    maxLength={500}
                    placeholder="Mis. duduk di tengah kolam, minta 2 gelas tambahan"
                    className="w-full resize-none rounded-lg border border-telaga-100 bg-krem px-2.5 py-2 text-sm font-montserrat text-telaga-950 placeholder-telaga-900/35 focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  />
                </div>
              </div>
            </div>
            )}
            {/* Qty Pengunjung & Jenis Kunjungan disembunyikan — jumlah dihitung
                otomatis dari layanan, order_type default 'offline'. */}

            {/* Referral Phone Field - Hanya untuk customer baru (total_orders === 0) */}
            {orderData.customer && !isWalkInCustomer(orderData.customer) && (orderData.customer.total_orders === 0 || !orderData.customer.total_orders) && (
              <div className="mt-4">
                {!pointsSettings.enabled ? (
                  <div className="bg-telaga-50/40 border border-telaga-100 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-telaga-900/40 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-telaga-900/70 font-montserrat font-semibold mb-2">
                          SISTEM REFERAL BELUM DI AKTIFKAN
                        </p>
                        <p className="text-xs text-telaga-900/60 font-montserrat">
                          Silakan setting di menu owner
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-xs font-semibold text-telaga-900/70 font-montserrat">
                        Nomor HP Referral (Opsional)
                      </label>
                    </div>

                    {/* Show input field jika belum ada hasil atau customer tidak ditemukan */}
                    {(!referralCheckResult || !referralCheckResult.found) && (
                      <>
                        <div className="flex flex-row gap-2">
                          <input
                            type="text"
                            placeholder="081234567890 atau 6281234567890"
                            value={orderData.referred_by_phone || ''}
                            onChange={e => {
                              setOrderData(prev => ({ ...prev, referred_by_phone: e.target.value.trim() || null }));
                              // Reset check result when phone changes
                              if (referralCheckResult) setReferralCheckResult(null);
                            }}
                            className="flex-1 min-w-0 p-2 h-14 border border-telaga-100 rounded-lg text-sm font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!orderData.referred_by_phone?.trim()) {
                                alert('Masukkan nomor HP referral terlebih dahulu');
                                return;
                              }

                              setReferralCheckResult({ loading: true, found: false, customer: null });
                              try {
                                const customer = await checkCustomerByPhone(orderData.referred_by_phone);
                                setReferralCheckResult({
                                  loading: false,
                                  found: !!customer,
                                  customer: customer
                                });

                                if (customer) {
                                  console.log('✅ Referral customer found:', customer.name);
                                }
                              } catch (error) {
                                console.error('Error checking referral customer:', error);
                                setReferralCheckResult({
                                  loading: false,
                                  found: false,
                                  customer: null,
                                  error: error.message
                                });
                              }
                            }}
                            disabled={referralCheckResult?.loading || !orderData.referred_by_phone?.trim()}
                            className="flex-shrink-0 px-3 sm:px-4 py-2 h-14 bg-telaga-500 text-white rounded-lg font-montserrat font-semibold text-sm hover:bg-telaga-600 disabled:bg-telaga-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[60px] sm:min-w-[80px]"
                          >
                            {referralCheckResult?.loading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Cek'
                            )}
                          </button>
                        </div>

                        {/* Check Result Display - hanya untuk not found */}
                        {referralCheckResult && !referralCheckResult.loading && !referralCheckResult.found && (
                          <div className="mt-2 p-3 rounded-lg text-sm font-montserrat bg-red-50 border border-red-200 text-red-700">
                            <div className="flex items-center gap-2">
                              <span className="text-red-600">✗</span>
                              <span>
                                Customer tidak ditemukan.
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Show card info jika customer ditemukan */}
                    {referralCheckResult && referralCheckResult.found && referralCheckResult.customer && (
                      <div className="bg-telaga-50 border border-telaga-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-telaga-600 text-lg">✓</span>
                            <div>
                              <p className="text-sm font-semibold text-telaga-800 font-montserrat">
                                Referral Valid
                              </p>
                              <p className="text-xs text-telaga-700 font-montserrat">
                                {referralCheckResult.customer.name} ({orderData.referred_by_phone})
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Reset check result saja, biarkan nomor HP tetap ada untuk edit
                              setReferralCheckResult(null);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-telaga-700 bg-telaga-100 hover:bg-telaga-200 rounded-lg transition-colors font-montserrat"
                          >
                            Cari Ulang
                          </button>
                        </div>

                        {/* Bonus Poin Info */}
                        <div className="pt-2 border-t border-telaga-200">
                          <p className="text-xs font-semibold text-telaga-800 font-montserrat mb-1.5">
                            Bonus Poin:
                          </p>
                          <div className="space-y-1">
                            {pointsSettings.referral_bonus_referrer > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-telaga-600 flex-shrink-0" />
                                <span className="text-xs text-telaga-700 font-montserrat">
                                  +{formatNumber(pointsSettings.referral_bonus_referrer)} poin untuk <span className="font-semibold">{referralCheckResult.customer.name}</span>
                                </span>
                              </div>
                            )}
                            {pointsSettings.referral_bonus_new_customer > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-telaga-600 flex-shrink-0" />
                                <span className="text-xs text-telaga-700 font-montserrat">
                                  +{formatNumber(pointsSettings.referral_bonus_new_customer)} poin untuk customer baru
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Request Kurir - hanya muncul jika order type online */}
            {orderData.order_type === 'online' && (
              <div className="mt-4 p-4 rounded-xl bg-telaga-50 border-2 border-telaga-200 flex flex-col gap-2 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-telaga-100 text-telaga-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h3m4 0V7a2 2 0 00-2-2h-7.5a2 2 0 00-2 2v2" /></svg>
                  </span>
                  <span className="font-bold text-telaga-700 text-base font-montserrat">Request Pickup oleh Kurir</span>
                  <input
                    type="checkbox"
                    checked={requestPickup}
                    onChange={e => setRequestPickup(e.target.checked)}
                    className="ml-auto w-5 h-5 accent-telaga-500 font-montserrat"
                  />
                </label>
                <span className="text-[12px] text-telaga-500 font-montserrat mt-0.5 leading-tight">Jika dicentang, order akan muncul di list antrian penjemputan peran kurir</span>

                {requestPickup && (
                  <div className="grid grid-cols-2 gap-3 mt-2 font-montserrat">
                    <div className="flex flex-col">
                      <label className="text-xs text-telaga-700 font-semibold mb-1 font-montserrat">Tanggal Pickup</label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={e => setPickupDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-telaga-400 w-full"
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-telaga-700 font-semibold mb-1 font-montserrat">Jam Pickup</label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={e => setPickupTime(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-telaga-400 w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        );

        return (
          <div>
            {/* Cabang aktif — pill kecil di ATAS judul, parity dengan mobile
                (`mobile-notasepatu/screens/order/QuickOrderScreen.js`). Sumber teks
                tetap `getCurrentBranchLabel()` di dalam komponennya (cache profil
                5 menit) → tidak ada request tambahan & teksnya tak pernah beda
                dengan modal "Ganti Cabang". */}
            <div className="mb-2">
              <BranchActiveChip />
            </div>
            <h3 className="font-bold text-lg mb-4 font-montserrat tracking-wide">Input Data Pesanan</h3>
            <QuickOrderTreatmentSelect
              layout="split"
              customerSlot={customerPanel}
              treatments={visibleTreatments}
              discounts={discounts}
              selectedTreatments={orderData.order_details}
              setSelectedTreatments={order_details => handleUpdateOrderDetails(order_details)}
              updateTreatmentDetail={(id, field, value) => {
                handleUpdateOrderDetails(orderData.order_details.map(t => t.id === id ? { ...t, [field]: value } : t));
              }}
              customerId={orderData?.customer?.id || null}
              onOpenAIDetection={() => setShowAIDetectionModal(true)}
              isCafeMode={needsGuestFields}
              outletMode={branchOrderMode}
              onContinue={() => setStep(1)}
              canContinue={true}
              continueLabel="Lanjut ke Pembayaran"
            />
          </div>
        );
      }
      case 1:
        // Calculate subtotal and payment discount
        const subtotal = getOrderTotal(orderData.order_details);
        // ✅ FIX: Gunakan Number() agar tidak gagal saat ID tersimpan sebagai string vs integer
        const paymentDiscountObj = orderData.payment.discount_id
          ? discounts.find(d => Number(d.id) === Number(orderData.payment.discount_id))
          : null;
        let paymentDiscountAmount = 0;
        if (paymentDiscountObj) {
          const discVal = paymentDiscountObj.discount != null ? Number(paymentDiscountObj.discount) : Number(paymentDiscountObj.value) || 0;
          // ✅ FIX: Support 'percent' dan 'percentage' sebagai alias yang sama
          if (paymentDiscountObj.type === 'percent' || paymentDiscountObj.type === 'percentage') {
            paymentDiscountAmount = subtotal * discVal / 100;
          } else if (paymentDiscountObj.type === 'nominal') {
            paymentDiscountAmount = discVal;
          }
        }

        // Calculate points discount
        const pointsToRedeem = orderData.payment.points_to_redeem || 0;

        // Calculate total after payment discount (before points discount)
        const totalAfterPaymentDiscount = subtotal - paymentDiscountAmount;

        // Points discount calculation
        // But limited by totalAfterPaymentDiscount (can't exceed total)
        let pointsDiscountAmount = 0;
        if (pointsToRedeem > 0) {
          const calculatedDiscount = Math.floor((pointsToRedeem / 100) * (pointsSettings.redeem_rate * 100));
          pointsDiscountAmount = Math.min(calculatedDiscount, totalAfterPaymentDiscount);
        }

        // Get customer points (from customer object)
        const customerPoints = orderData.customer?.points ?? 0;

        return (
          <div>
            <QuickOrderPaymentInput
              payments={orderData.payment.payment_details}
              setPayments={handleUpdatePaymentDetails}
              minDP={minDP}
              total={total}
              paid={paid}
              change={change}
              onValidationChange={handleValidationChange}
              subtotal={subtotal}
              paymentDiscountAmount={paymentDiscountAmount}
              paymentDiscount={paymentDiscountObj}
              notes={orderData.payment.notes}
              onDiscountClick={() => setShowDiscountModal(true)}
              onRemoveDiscount={() => {
                setOrderData(prev => ({
                  ...prev,
                  payment: {
                    ...prev.payment,
                    discount_id: null
                  }
                }));
              }}
              onNotesClick={() => setShowNotesModal(true)}
              customerPoints={customerPoints}
              pointsToRedeem={pointsToRedeem}
              pointsDiscountAmount={pointsDiscountAmount}
              onPointsRedeemChange={(points) => {
                setOrderData(prev => ({
                  ...prev,
                  payment: {
                    ...prev.payment,
                    points_to_redeem: points
                  }
                }));
              }}
              customer={orderData.customer}
              referredByPhone={orderData.referred_by_phone}
              referralBonusNewCustomer={pointsSettings.referral_bonus_new_customer || 0}
              firstOrderBonus={pointsSettings.first_order_bonus || 0}
              firstOrderBonusEnabled={pointsSettings.first_order_bonus_enabled !== undefined ? pointsSettings.first_order_bonus_enabled : true}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-telaga-50/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-telaga-600 to-senja-500 shadow-sm rounded-b-3xl">
        <div className="flex items-center justify-between px-4 py-4 relative">
          {/* Back Button */}
          <button
            onClick={() => navigate('/orders')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow border border-telaga-100"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-telaga-600" />
          </button>
          <div className="flex-1 flex items-center text-center justify-center">
            <h1 className="text-lg font-semibold sm:text-3xl font-montserrat text-center font-normal text-white tracking-wide drop-shadow-md">Tambah Pesanan</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`mx-auto px-4 py-6 ${step === 0 ? 'max-w-2xl lg:max-w-[1440px] lg:px-6 pb-28 lg:pb-6' : 'max-w-2xl'}`}>
        {/* Order Limit Info Card */}
        {orderLimit && orderLimit.max !== null && (
          <div className="bg-white border border-telaga-100 rounded-lg p-3 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-telaga-900 font-montserrat">
                  Batasan Order: {orderLimit.current} dari {orderLimit.max} order/bulan
                </span>
                {orderLimit.percentage >= 80 && (
                  <span className="text-xs text-senja-600 mt-1 font-montserrat">
                    {orderLimit.percentage >= 100
                      ? 'Batas maksimal telah tercapai'
                      : 'Mendekati batas maksimal'}
                  </span>
                )}
              </div>
            </div>
            {orderLimit.percentage >= 80 && (
              <div className="mt-3 p-2 rounded-lg bg-senja-50 border border-senja-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-senja-600" />
                  <span className="text-xs text-senja-800 font-montserrat">
                    {orderLimit.percentage >= 100
                      ? `Anda telah mencapai batas maksimal ${orderLimit.max} order per bulan. Upgrade paket untuk menambah order.`
                      : `Anda hampir mencapai batas maksimal ${orderLimit.max} order per bulan (${orderLimit.percentage}% terpakai).`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-telaga-100">
          {/* Progress */}
          <div className="px-4 pt-4 sm:px-6 sm:pt-6">
            {renderProgress()}
          </div>

          {/* Step Content */}
          <div className="px-3 pb-4 sm:px-6 sm:pb-6">
            {renderStep()}
          </div>

          {/* Footer */}
          <div className={`px-4 py-4 border-t border-telaga-100 sm:px-6 ${step === 0 ? 'hidden lg:block' : ''}`}>
            {/* Error dari backend saat submit order */}
            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
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
              <div className="mb-4 space-y-2">
                {/* Warnings */}
                {Object.keys(paymentValidation.warnings).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(paymentValidation.warnings).map(([key, message]) => (
                      <div key={key} className="bg-senja-50 border border-senja-200 text-senja-700 px-3 py-2 rounded-lg">
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
                  onClick={() => {
                    clickCountRef.current += 1;
                    console.log(
                      `[TambahPesanan ${new Date().toISOString().slice(11, 23)}] 0. TOMBOL DIKLIK ke-${clickCountRef.current}`,
                      { renderCount: renderCountRef.current, disabled: orderData.order_details.length === 0 || isSubmitting }
                    );
                    handleSubmit();
                  }}
                  disabled={orderData.order_details.length === 0 || isSubmitting}
                  className="flex-1 py-3"
                >
                  {isSubmitting ? 'Memproses...' : 'Tambah Pesanan'}
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <QuickOrderCustomerSearchModal
          customers={customers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSelect={handleCustomerSelect}
          onClose={() => setShowCustomerSearch(false)}
          loading={loadingCustomers}
          onSearch={handleCustomerSearch}
        />
      )}

      {/* Notification Modal */}
      {notification.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-telaga-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs text-center">
            <div className="text-telaga-600 font-bold text-lg mb-2 flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Berhasil
            </div>
            <div className="text-telaga-900 mb-4 font-montserrat text-sm">{notification.message}</div>
            <button
              onClick={() => {
                setNotification({ show: false, message: '' });
                navigate('/orders');
              }}
              className="px-4 py-2 bg-telaga-500 text-white rounded-lg text-sm font-semibold hover:bg-telaga-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && printOrderData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-telaga-950/60 backdrop-blur-sm p-4">
          <QuickOrderPrintReceipt
            order={printOrderData}
            hideCloseButton={true}
            onClose={() => {
              setShowPrintModal(false);
              setPrintOrderData(null);
              // Redirect ke order dashboard setelah print modal ditutup
              navigate('/orders');
            }}
          />
        </div>
      )}

      {/* AI Detection Modal */}
      <AIDetectionModal
        open={showAIDetectionModal}
        onClose={() => setShowAIDetectionModal(false)}
        onResult={handleAIResult}
        treatments={visibleTreatments}
        customerId={orderData?.customer?.id || null}
      />

      {/* Discount Modal */}
      {showDiscountModal && (() => {
        // Calculate subtotal untuk modal
        const subtotalForModal = getOrderTotal(orderData.order_details);
        return (
          <QuickOrderDiscountModal
            discounts={discounts}
            subtotal={subtotalForModal}
            activeDiscountId={orderData.payment.discount_id}
            onSelect={(discount) => {
              // ✅ OPTIMISTIC UPDATE: Tambahkan diskon ke array lokal jika belum ada
              // Ini adalah safety net — jika onRefreshDiscounts lambat, diskon
              // tetap bisa ditemukan oleh discounts.find() saat React re-render
              setDiscounts(prev => {
                const exists = prev.some(d => Number(d.id) === Number(discount.id));
                if (!exists) {
                  return [...prev, discount];
                }
                return prev;
              });
              setOrderData(prev => ({
                ...prev,
                payment: {
                  ...prev.payment,
                  discount_id: discount.id
                }
              }));
              setShowDiscountModal(false);
            }}
            onClose={() => setShowDiscountModal(false)}
            onRefreshDiscounts={async () => {
              try {
                const disc = await getDiscounts();
                setDiscounts(Array.isArray(disc) ? disc : []);
              } catch (err) {
                console.error('Error refreshing discounts:', err);
              }
            }}
          />
        );
      })()}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-telaga-950 font-montserrat">Catatan</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-1 hover:bg-telaga-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-telaga-900/70" />
              </button>
            </div>
            <textarea
              placeholder="Tambahkan catatan untuk pembayaran ini..."
              value={orderData.payment.notes || ''}
              onChange={e => setOrderData(prev => ({
                ...prev,
                payment: {
                  ...prev.payment,
                  notes: e.target.value
                }
              }))}
              rows={4}
              className="w-full p-3 border border-telaga-100 rounded-lg text-sm font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-sm font-semibold text-telaga-900 bg-telaga-50 hover:bg-telaga-100 rounded-lg transition-colors font-montserrat"
              >
                Batal
              </button>
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-telaga-500 hover:bg-telaga-600 rounded-lg transition-colors font-montserrat"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickOrder;
