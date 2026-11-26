import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowLeft, Save, Trash2, X, Printer, AlertCircle, AlertTriangle, Edit2, Info, Phone, MapPin, Crown, HelpCircle, Sparkles } from 'lucide-react';
import { OrderDetailProvider, useOrderDetail } from './context/OrderDetailContext';
import { useOrderDetailData } from './hooks/useOrderDetailData';
import { getTreatments, getDiscounts, searchItems, getOrderDetailStatusHistory, deleteOrder, updateOrder } from './api/orderApi';
import { transformApiToFETemplate, transformFETemplateToApi } from './utils/orderTransformNew';
import { recalculateOrderQuantity, createPlaceholderItem } from './utils/orderCalculations';
import TreatmentCart from './components/OrderDetail/TreatmentCart';
import AddTreatmentModal from './components/OrderDetail/AddTreatmentModal';
import ItemDetailModal from './components/OrderDetail/ItemDetailModal';
import EditItemModal from './components/OrderDetail/EditItemModal';
import EditCustomerModal from './components/OrderDetail/EditCustomerModal';
import PaymentStep from './components/OrderDetail/PaymentStep';
import ServiceCard from './components/OrderDetail/ServiceCard';
import { groupOrderDetailsForFE } from './utils/orderTransformNew';
import StepperHeader from './components/OrderDetail/StepperHeader';
import AnimatedButton from '../../components/Design/AnimatedButton';
import QuickOrderPrintReceipt from '../../components/QuickInput/QuickOrderPrintReceipt';
import ValidationFloatingIcon from '../../components/OrderDetail/ValidationFloatingIcon';
import ValidationModal from '../../components/OrderDetail/ValidationModal';
import SuccessModal from '../../components/Modal/SuccessModal';
import StatusHistoryModal from './components/OrderDetail/StatusHistoryModal';
import PhotoGalleryModal from '../../components/Modal/PhotoGalleryModal';
import OrderDetailExplanationModal from '../../components/Modal/OrderDetailExplanationModal';
import AIItemDetailModal from '../../components/QuickInput/AIItemDetailModal';
import StepCustomerInfo from './sections/StepCustomerInfo';
import StepReview from './sections/StepReview';
import isEqual from 'lodash.isequal';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { getUserProfile } from '../../utils/userProfileHelper';
import { filterTreatmentsForOrderMode } from '../../utils/treatmentHelper';
import instance from '../../config/api';
import {
  formatOrderDetailStatus,
  getOrderDetailStatusColors,
  formatCurrency,
  formatDate,
  formatOrderType,
  formatPaymentStatus,
  formatDiscountDisplay,
  getMembershipBadgeColor,
  getMembershipDiscountDisplay,
  ORDER_DETAIL_STATUS,
  PAYMENT_STATUS,
  ORDER_TYPE,
  DELIVERY_STATUS,
  getTodayDateString,
  toInputDateString,
  toInputDateTimeString,
  isDateInPast,
  isOrderDetailStatusEditable,
  isOrderDetailStatusRemovable,
  isPaymentStatusEditable
} from '../../utils/labelFormatter';
import { normalizeTimeString } from '../../utils/dateUtils';

// Main OrderDetail component with provider
const OrderDetailWithProvider = () => {
  return (
    <OrderDetailProvider>
      <OrderDetailContent />
    </OrderDetailProvider>
  );
};

// OrderDetail content component
const OrderDetailContent = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useOrderDetail();
  const stepperRef = useRef(null);

  // Get order data from navigation state (from OrderCard)
  const orderFromState = location.state?.order;

  // Use custom hook for data management
  const {
    orderData,
    loading,
    error,
    currentStep,
    total,
    totalPaid,
    remaining,
    isLunas,
    isDPValid,
    minDP,
    groupedOrderDetails,
    paymentDetails,
    submitOrderData,
    fetchOrderData
  } = useOrderDetailData(orderId);

  // Local state for UI
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);

  // Request kurir state
  const [requestPickup, setRequestPickup] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => getTodayDateString());
  const [pickupTime, setPickupTime] = useState('14:00');

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  const [validationInfo, setValidationInfo] = useState({});

  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [treatments, setTreatments] = useState([]);
  // Mode operasional cabang: 'cafe' boleh jual menu F&B, 'loket' tidak.
  const [branchOrderMode, setBranchOrderMode] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  // Modal state
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [treatmentQty, setTreatmentQty] = useState(1);
  const [treatmentDiscount, setTreatmentDiscount] = useState(null);
  // Process time sudah dihilangkan
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingGroupIdx, setEditingGroupIdx] = useState(null); // index group yang sedang diedit
  const [showAddItemModal, setShowAddItemModal] = useState(false); // modal tambah item
  const [showAIDetailModal, setShowAIDetailModal] = useState(false); // modal AI detail item
  const [aiDetailGroupIdx, setAiDetailGroupIdx] = useState(null); // index group untuk AI detail
  const [searchItemInput, setSearchItemInput] = useState("");
  const [searchItemResults, setSearchItemResults] = useState([]);
  const [isSearchingItem, setIsSearchingItem] = useState(false);
  const [treatmentDueDate, setTreatmentDueDate] = useState('');
  // Dine-in / bawa pulang per grup produk
  const [treatmentServeMode, setTreatmentServeMode] = useState(null);
  // Catatan & opsi cepat per grup produk (mis. less sugar)
  const [treatmentNote, setTreatmentNote] = useState('');
  const [treatmentOptions, setTreatmentOptions] = useState({});

  // ✅ Custom Price State
  const [enableCustomPrice, setEnableCustomPrice] = useState(false);
  const [treatmentCustomPrice, setTreatmentCustomPrice] = useState(null);
  const [treatmentCustomPriceReason, setTreatmentCustomPriceReason] = useState('');

  // Status history modal state
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [statusHistoryLoading, setStatusHistoryLoading] = useState(false);
  const [statusHistoryError, setStatusHistoryError] = useState(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Tambahkan state lokal untuk modal validasi
  const [showValidationModal, setShowValidationModal] = useState(false);
  // State untuk modal sukses
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // State untuk modal validasi
  const [modalErrors, setModalErrors] = useState([]);
  const [modalWarnings, setModalWarnings] = useState([]);
  const [modalInfo, setModalInfo] = useState([]);

  // State untuk modal foto galeri
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // State untuk explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // State untuk submit loading and points settings
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsSettings, setPointsSettings] = useState({ enabled: false, min_redeem: 100 });


  // Function untuk menganalisis perubahan data

  // Check if user has seen the explanation modal before
  useEffect(() => {
    const hasSeenExplanation = localStorage.getItem('order_detail_explanation_seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  // Listener validasi quantity dan item kosong
  useEffect(() => {
    const errors = [];
    const warnings = [];
    if (orderData.quantity <= 0) {
      errors.push('Quantity item harus lebih dari 0');
    }
    // Validasi layanan kosong
    if (!orderData.order_details || orderData.order_details.length === 0) {
      errors.push('Order harus memiliki minimal 1 layanan');
    }
    // Validasi item kosong di order_details
    if (Array.isArray(orderData.order_details)) {
      orderData.order_details.forEach((group, idx) => {
        const isProductGroup = group.requires_tracking === false || group.treatment?.requires_tracking === false;

        if (!isProductGroup && (!group.items || group.items.length === 0)) {
          errors.push(`Layanan ke-${idx + 1} harus memiliki minimal 1 item`);
        }

        if (!isProductGroup && Array.isArray(group.items)) {
          group.items.forEach((item, i) => {
            if (!item.name || item.name.trim() === '') {
              warnings.push(`Item pada layanan ke-${idx + 1}, item ke-${i + 1}: Nama belum diisi`);
            }
            if (!item.brand || item.brand.trim() === '') {
              warnings.push(`Item pada layanan ke-${idx + 1}, item ke-${i + 1}: Brand belum diisi`);
            }
          });
        }
      });
    }
    // Validasi payment pakai total dan totalPaid dari useOrderDetailData
    if (typeof total === 'number' && typeof totalPaid === 'number' && total > 0) {
      if (totalPaid < 0.5 * total) {
        warnings.push('Pembayaran kurang dari 50% dari total order');
      }
      if (totalPaid > total) {
        warnings.push('Pembayaran melebihi total order, akan ada kembalian');
      }
    }
    setModalErrors(errors);
    setModalWarnings(warnings);
    setModalInfo([]);
  }, [orderData.quantity, orderData.order_details, orderData.payment, total, totalPaid]);

  // Memoized handlers for AddTreatmentModal to prevent infinite loops
  const handleSelectTreatment = useCallback((treatment) => {
    setSelectedTreatment(treatment);
  }, []);

  const handleQtyChange = useCallback((qty) => {
    setTreatmentQty(qty);
  }, []);

  const handleDiscountChange = useCallback((discount) => {
    setTreatmentDiscount(discount);
  }, []);


  const isGroupProduct = (group) => {
    if (!group) return false;
    const requires = group.requires_tracking;
    const treatmentRequires = group.treatment?.requires_tracking;
    return requires === false || requires === 0 || treatmentRequires === false || treatmentRequires === 0;
  };

  // Default penyajian mengikuti tipe order yang sedang dibuat/diedit
  const defaultServeMode = orderData.order_type === 'takeaway' ? 'takeaway' : 'dine-in';

  // Loket tidak menjual menu cafe (F&B) — sembunyikan dari pilihan produk.
  const visibleTreatments = filterTreatmentsForOrderMode(treatments, branchOrderMode);

  const handleAddTreatment = useCallback((treatment, options) => {
    // Add treatment to order details
    const treatmentRequiresTracking = options.requires_tracking !== undefined
      ? options.requires_tracking
      : treatment?.requires_tracking !== false;
    const isProduct = !treatmentRequiresTracking;
    const requestedQty = options.qty && options.qty > 0 ? Number(options.qty) : 1;

    const items = Array.from({ length: requestedQty }).map(() =>
      createPlaceholderItem({
        requiresTracking: treatmentRequiresTracking,
        status: treatmentRequiresTracking ? ORDER_DETAIL_STATUS.ANTRIAN : ORDER_DETAIL_STATUS.DONE,
      })
    );

    const newGroup = {
      treatment,
      discount: options.discount || null,
      discount_id: options.discount?.id || null, // ✅ Include discount_id for new groups
      // Process time sudah dihilangkan
      due_date: options.due_date,
      custom_price: options.custom_price,
      custom_price_reason: options.custom_price_reason,
      serve_mode: options.serve_mode || defaultServeMode,
      note: options.note || '',
      options: options.options || {},
      items,
      qty: isProduct ? requestedQty : items.length,
      requires_tracking: treatmentRequiresTracking,
      order_detail_ids: []
    };

    const newOrderDetails = [...groupedOrderDetails, newGroup];
    const updatedQuantity = recalculateOrderQuantity(newOrderDetails);
    actions.setOrderData({ ...orderData, order_details: newOrderDetails, quantity: updatedQuantity });
    setShowAddTreatmentModal(false);

    // Reset form
    setSelectedTreatment(null);
    setTreatmentQty(1);
    setTreatmentDiscount(null);
    setEnableCustomPrice(false);
    setTreatmentCustomPrice(null);
    setTreatmentCustomPriceReason('');
    setTreatmentDueDate('');
    setTreatmentServeMode(null);
    setTreatmentNote('');
    setTreatmentOptions({});
    // Process time sudah dihilangkan
  }, [groupedOrderDetails, orderData, actions, defaultServeMode]);

  const handleCloseAddTreatmentModal = useCallback(() => {
    setShowAddTreatmentModal(false);
    // Reset form
    setSelectedTreatment(null);
    setTreatmentQty(1);
    setTreatmentDiscount(null);
    setEnableCustomPrice(false);
    setTreatmentCustomPrice(null);
    setTreatmentCustomPriceReason('');
    setTreatmentDueDate('');
    setTreatmentServeMode(null);
    setTreatmentNote('');
    setTreatmentOptions({});
    // Process time sudah dihilangkan
  }, []);

  // Initialize tenant_id and branch_id from userData
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
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

          // ✅ Set userInfo untuk role check
          setUserInfo(userData);
          setBranchOrderMode(userData.branch_order_mode);

          // Update tenant_id and branch_id in state
          if (userData.tenant_id && !state.tenant_id) {
            actions.updateField('tenant_id', userData.tenant_id);
          }
          if (userData.branch_id && !state.branch_id) {
            actions.updateField('branch_id', userData.branch_id);
          }
        }
      } catch (error) {
        console.error('[ERROR] OrderDetailContent - Failed to get userData from API:', error);
      }
    };

    loadUserData();
  }, [actions, state.tenant_id, state.branch_id]);

  // Initialize state provider with data from navigation state
  useEffect(() => {

    if (orderFromState && !state.id) {

      // Transform order data to FE template format
      const feTemplate = transformApiToFETemplate(orderFromState);
      if (feTemplate) {
        actions.setOrderData(feTemplate);
      }
    } else if (orderFromState && state.id) {
    }
  }, [orderFromState, state.id, actions]);

  // Initialize request pickup state from existing data
  useEffect(() => {
    if (groupedOrderDetails && groupedOrderDetails.length > 0) {
      // Cek apakah ada item dengan pickup_method = 'pickup'
      const hasPickupRequest = groupedOrderDetails.some(group =>
        group.items.some(item => item.pickup_method === 'pickup')
      );

      if (hasPickupRequest) {
        // Ambil data pickup dari item pertama yang memiliki pickup_method
        const pickupItem = groupedOrderDetails.flatMap(group => group.items)
          .find(item => item.pickup_method === 'pickup');

        if (pickupItem) {
          setRequestPickup(true);
          setPickupDate(pickupItem.delivery_date || getTodayDateString());
          setPickupTime(normalizeTimeString(pickupItem.delivery_time) || '14:00');
        }
      }
    }
  }, [groupedOrderDetails]);

  // Auto scroll ke atas saat step berubah
  useEffect(() => {

    // Scroll langsung
    window.scrollTo(0, 0);

    // Scroll dengan smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (stepperRef.current) {
      stepperRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

  }, [currentStep]);

  // Scroll ke atas saat komponen pertama kali mount
  useEffect(() => {
    window.scrollTo(0, 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch treatments dan discounts dari API
  useEffect(() => {
    const fetchTreatments = async () => {
      setLoadingTreatments(true);
      try {
        const data = await getTreatments();
        setTreatments(data);
      } catch (error) {
        console.error('Error fetching treatments:', error);
      } finally {
        setLoadingTreatments(false);
      }
    };

    const fetchDiscounts = async () => {
      setLoadingDiscounts(true);
      try {
        const data = await getDiscounts();
        setDiscounts(data);
      } catch (error) {
        console.error('Error fetching discounts:', error);
      } finally {
        setLoadingDiscounts(false);
      }
    };

    fetchTreatments();
    fetchDiscounts();

    // Fetch points settings
    const fetchPointsSettings = async () => {
      try {
        const response = await instance.get('/points-settings');
        if (response.data.success) {
          setPointsSettings({
            enabled: Boolean(response.data.data?.enabled),
            min_redeem: Number(response.data.data?.min_redeem) || 100,
          });
        }
      } catch (error) {
        console.error('Error fetching points settings:', error);
      }
    };
    fetchPointsSettings();
  }, []);

  // Search item saat Enter atau button click
  const handleItemSearch = async (val, e) => {
    setSearchItemInput(val);
    // Support Enter key atau button click (synthetic event)
    const shouldSearch = (e && e.key === 'Enter' && val) || (e && !e.key && val);

    if (shouldSearch) {
      try {
        setIsSearchingItem(true);
        const results = await searchItems(val);
        setSearchItemResults(results || []);
      } catch (err) {
        setSearchItemResults([]);
      } finally {
        setIsSearchingItem(false);
      }
    }
    if (!val) {
      setSearchItemResults([]);
      setIsSearchingItem(false);
    }
  };

  // Navigation handlers
  const handleBack = () => {
    // Cek location.state (explicit dari caller)
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }

    // Default ke /orders jika tidak ada state
    navigate('/orders');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submit

    // ✅ Validate points_to_redeem before submit
    const pointsToRedeem = orderData.payment?.points_to_redeem || 0;
    const minRedeem = pointsSettings?.min_redeem || 100;
    if (pointsToRedeem > 0 && pointsToRedeem < minRedeem) {
      alert(`Poin Tidak Valid: Minimum redeem adalah ${minRedeem} poin. Anda memasukkan ${pointsToRedeem} poin. Silakan ubah jumlah poin atau hapus penggunaan poin.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Add request pickup data to order data if needed
      const orderDataWithPickup = {
        ...orderData,
        requestPickup: orderData.order_type === ORDER_TYPE.ONLINE ? requestPickup : false,
        pickupDate: orderData.order_type === ORDER_TYPE.ONLINE && requestPickup ? pickupDate : null,
        pickupTime: orderData.order_type === ORDER_TYPE.ONLINE && requestPickup ? pickupTime : null,
      };

      // Update order data in context with pickup info
      actions.setOrderData(orderDataWithPickup);

      // ✅ FIX: Pass updated data directly to submitOrderData to avoid stale state issues
      await submitOrderData(orderDataWithPickup);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Gagal menyimpan pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate('/orders');
  };

  const handleSuccessStay = async () => {
    setShowSuccessModal(false);
    // Force reload fresh data from backend
    await fetchOrderData(true);
  };

  // Handler untuk edit customer berhasil
  const handleEditCustomerSuccess = (updatedCustomer) => {
    // Update customer di order data
    actions.updateCustomer(updatedCustomer);
  };

  // Handler untuk update request pickup
  const handleRequestPickupChange = (checked) => {
    setRequestPickup(checked);

    // Update data di context untuk item dengan status not_yet, antrian, atau failed
    const updatedOrderDetails = groupedOrderDetails.map(group => ({
      ...group,
      items: group.items.map(item => {
        // Update item dengan status not_yet, antrian, failed, atau cancelled
        if (item.status === ORDER_DETAIL_STATUS.NOT_YET || item.status === ORDER_DETAIL_STATUS.ANTRIAN || item.delivery_status === DELIVERY_STATUS.FAILED || item.status === ORDER_DETAIL_STATUS.CANCELLED) {
          if (checked) {
            // Jika dicentang, set pickup data dan reset delivery_status ke scheduled
            return {
              ...item,
              status: item.status === ORDER_DETAIL_STATUS.CANCELLED ? ORDER_DETAIL_STATUS.NOT_YET : item.status, // Ubah cancelled jadi not_yet
              pickup_method: 'pickup',
              delivery_status: 'scheduled',
              delivery_time: pickupTime,
              delivery_date: pickupDate,
            };
          } else {
            // Jika tidak dicentang, hapus pickup data
            return {
              ...item,
              status: item.status === ORDER_DETAIL_STATUS.CANCELLED ? ORDER_DETAIL_STATUS.NOT_YET : item.status, // Ubah cancelled jadi not_yet
              pickup_method: null,
              delivery_status: null,
              delivery_time: null,
              delivery_date: null,
            };
          }
        } else {
          return {
            ...item,
            pickup_method: item.pickup_method,
            delivery_status: item.delivery_status,
            delivery_time: item.delivery_time,
            delivery_date: item.delivery_date,
          };
        }
      })
    }));

    // Update order data di context
    actions.setOrderData({
      ...orderData,
      order_details: updatedOrderDetails
    });
  };

  // Handler untuk update tanggal pickup
  const handlePickupDateChange = (date) => {
    setPickupDate(date);

    // Update data di context jika request pickup aktif
    if (requestPickup) {
      const updatedOrderDetails = groupedOrderDetails.map(group => ({
        ...group,
        items: group.items.map(item => {
          // Update item dengan status not_yet, antrian, failed, atau cancelled
          if (item.status === ORDER_DETAIL_STATUS.NOT_YET || item.status === ORDER_DETAIL_STATUS.ANTRIAN || item.delivery_status === DELIVERY_STATUS.FAILED || item.status === ORDER_DETAIL_STATUS.CANCELLED) {
            return {
              ...item,
              status: item.status === ORDER_DETAIL_STATUS.CANCELLED ? ORDER_DETAIL_STATUS.NOT_YET : item.status, // Ubah cancelled jadi not_yet
              delivery_date: date,
              // Reset delivery_status ke scheduled jika sebelumnya failed
              delivery_status: item.delivery_status === DELIVERY_STATUS.FAILED ? DELIVERY_STATUS.SCHEDULED : item.delivery_status,
            };
          }
          return item;
        })
      }));

      actions.setOrderData({
        ...orderData,
        order_details: updatedOrderDetails
      });
    }
  };

  // Handler untuk update waktu pickup
  const handlePickupTimeChange = (time) => {
    setPickupTime(time);

    // Update data di context jika request pickup aktif
    if (requestPickup) {
      const updatedOrderDetails = groupedOrderDetails.map(group => ({
        ...group,
        items: group.items.map(item => {
          // Update item dengan status not_yet, antrian, failed, atau cancelled
          if (item.status === ORDER_DETAIL_STATUS.NOT_YET || item.status === ORDER_DETAIL_STATUS.ANTRIAN || item.delivery_status === DELIVERY_STATUS.FAILED || item.status === ORDER_DETAIL_STATUS.CANCELLED) {
            return {
              ...item,
              status: item.status === ORDER_DETAIL_STATUS.CANCELLED ? ORDER_DETAIL_STATUS.NOT_YET : item.status, // Ubah cancelled jadi not_yet
              delivery_time: time,
              // Reset delivery_status ke scheduled jika sebelumnya failed
              delivery_status: item.delivery_status === DELIVERY_STATUS.FAILED ? DELIVERY_STATUS.SCHEDULED : item.delivery_status,
            };
          }
          return item;
        })
      }));

      actions.setOrderData({
        ...orderData,
        order_details: updatedOrderDetails
      });
    }
  };

  const handleShowStatusHistory = async (item) => {
    try {
      setSelectedItemForHistory(item);
      setShowStatusHistoryModal(true);
      setStatusHistoryLoading(true);
      setStatusHistoryError(null);

      const response = await getOrderDetailStatusHistory(item.order_detail_id);
      setStatusHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
      setStatusHistoryError('Gagal memuat riwayat status');
      setStatusHistory([]);
    } finally {
      setStatusHistoryLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      // ✅ Validasi role sebelum delete
      if (userInfo?.role !== 'superadmin' && userInfo?.role !== 'superapp-superadmin') {
        setShowDeleteModal(false);
        return;
      }

      if (!orderData.id) {
        console.error('Cannot delete order: No order ID');
        return;
      }

      await deleteOrder(orderData.id);

      setShowDeleteModal(false);

      // Navigate to orders page
      navigate('/orders');
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      // You can add error handling here if needed
    }
  };

  const handleCloseStatusHistory = () => {
    setShowStatusHistoryModal(false);
    setStatusHistory([]);
    setStatusHistoryError(null);
    setSelectedItemForHistory(null);
  };

  // Handler untuk membuka modal foto galeri
  const handleOpenPhotoGallery = (photos, initialIndex = 0) => {
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(initialIndex);
    setShowPhotoGallery(true);
  };

  const handleClosePhotoGallery = () => {
    setShowPhotoGallery(false);
    setSelectedPhotos([]);
    setSelectedPhotoIndex(0);
  };

  // Handle AI Detail result — merge items into existing group slots
  const handleAIDetailResult = useCallback(async ({ groupIdx, items: aiItems }) => {
    if (!orderData || groupIdx === null || !aiItems || aiItems.length === 0) return;

    console.log('🔍 [OrderDetail] handleAIDetailResult CALLED');
    console.log('🔍 [OrderDetail] groupIdx:', groupIdx);
    console.log('🔍 [OrderDetail] aiItems received:', aiItems.map(ai => ({
      name: ai.item?.name,
      photosCount: ai.photos?.length,
      photosType: typeof ai.photos?.[0],
      photosSample: ai.photos?.[0]?.substring?.(0, 60) || ai.photos?.[0],
      condition: ai.condition
    })));
    console.log('🔍 [OrderDetail] existing group items:', groupedOrderDetails[groupIdx]?.items?.map(it => ({
      id: it.id,
      name: it.name,
      photosCount: it.shoes_photos?.length,
      photosType: typeof it.shoes_photos?.[0]
    })));

    const updatedOrderDetails = [...groupedOrderDetails];
    const group = { ...updatedOrderDetails[groupIdx] };
    const existingItems = Array.isArray(group.items) ? [...group.items] : [];

    // Helper: normalize photos to { url_photo } format (AI returns string URLs)
    const normalizePhotos = (photos) => {
      if (!photos || !Array.isArray(photos)) return [];
      return photos.map(p => {
        if (typeof p === 'string') return { url_photo: p };
        if (p?.url_photo) return p;
        if (p?.url) return { url_photo: p.url };
        return p;
      });
    };

    // 1. Fill empty placeholder slots first, then APPEND the rest as new items
    const isEmptyPlaceholderItem = (item) =>
      !String(item?.name || '').trim() &&
      !String(item?.brand || '').trim() &&
      !String(item?.material || '').trim() &&
      !(Array.isArray(item?.shoes_photos) && item.shoes_photos.length > 0);

    const emptySlotIndexes = [];
    existingItems.forEach((item, idx) => {
      if (isEmptyPlaceholderItem(item)) emptySlotIndexes.push(idx);
    });

    const itemMasterPayloads = [];
    const itemMasterIndexes = [];
    const registeredItemIndexes = new Set();

    // Item name/brand/color come from the items table, so every AI item needs
    // a real item master row — otherwise it looks empty after reloading.
    const registerItemMaster = (itemIdx) => {
      if (registeredItemIndexes.has(itemIdx)) return;
      const item = existingItems[itemIdx];
      if (!item || item.id) return;
      registeredItemIndexes.add(itemIdx);
      itemMasterPayloads.push({
        name: item.name || '',
        brand: item.brand || '',
        color: item.color || '',
        material: item.material || '',
        type: item.type || 'Shoes',
      });
      itemMasterIndexes.push(itemIdx);
    };

    const itemSignature = (item) =>
      [item?.name, item?.brand, item?.color, item?.material]
        .map((value) => String(value || '').trim().toLowerCase())
        .join('|');

    const mergePhotos = (currentPhotos, newPhotos) => {
      const merged = [...(currentPhotos || []), ...(newPhotos || [])];
      const seen = new Set();
      return merged.filter((photo) => {
        const url = photo?.url_photo;
        if (!url || seen.has(url)) return false;
        seen.add(url);
        return true;
      });
    };

    aiItems.forEach((aiItem) => {
      const normalizedPhotos = normalizePhotos(aiItem.photos || []);
      const itemData = {
        name: aiItem.item?.name || '',
        brand: aiItem.item?.brand || '',
        color: aiItem.item?.color || '',
        material: aiItem.item?.material || '',
        type: aiItem.item?.type || 'Shoes',
        notes: aiItem.condition || '',
        shoes_photos: normalizedPhotos,
      };

      if (emptySlotIndexes.length > 0) {
        // Reuse an existing empty placeholder so it saves into the same order_detail row
        const slotIdx = emptySlotIndexes.shift();
        const slot = existingItems[slotIdx] || {};
        existingItems[slotIdx] = {
          ...slot,
          ...itemData,
          shoes_photos:
            normalizedPhotos.length > 0
              ? normalizedPhotos
              : normalizePhotos(slot.shoes_photos),
        };
        registerItemMaster(slotIdx);
        return;
      }

      // Same item already in this group (e.g. re-running detection) → merge photos only
      const signature = itemSignature(itemData);
      if (signature.replace(/\|/g, '').length > 0) {
        const dupIdx = existingItems.findIndex(
          (item) => itemSignature(item) === signature
        );
        if (dupIdx >= 0) {
          const dup = existingItems[dupIdx] || {};
          if (normalizedPhotos.length > 0) {
            existingItems[dupIdx] = {
              ...dup,
              notes: dup.notes || itemData.notes,
              shoes_photos: mergePhotos(dup.shoes_photos, normalizedPhotos),
            };
            registerItemMaster(dupIdx);
          }
          return;
        }
      }

      // No empty slot left → always APPEND a new item (never overwrite real items)
      existingItems.push({
        id: null,
        order_detail_id: 0,
        item_id: null,
        size: '',
        parfum: '',
        quantity: 1,
        pickup_method: null,
        delivery_status: group.requires_tracking !== false ? null : 'done',
        delivery_time: null,
        delivery_date: null,
        requires_tracking: group.requires_tracking !== false,
        ...itemData,
        status: group.requires_tracking !== false ? 'antrian' : 'done',
      });
      registerItemMaster(existingItems.length - 1);
    });

    // 2. Create item masters in DB to get real item IDs
    if (itemMasterPayloads.length > 0) {
      console.log('🔍 [OrderDetail] Creating new items in DB:', itemMasterPayloads);
      try {
        const response = await instance.post('/items/bulk-create', { items: itemMasterPayloads });
        const createdItems = response?.data?.data || [];
        console.log('🔍 [OrderDetail] bulk-create response:', createdItems);
        if (createdItems && Array.isArray(createdItems)) {
          createdItems.forEach((createdItem, idx) => {
            const itemIdx = itemMasterIndexes[idx];
            if (itemIdx === undefined || !existingItems[itemIdx] || !createdItem?.id) return;
            existingItems[itemIdx] = {
              ...existingItems[itemIdx],
              id: createdItem.id,
            };
          });
        }

        if (itemMasterIndexes.some((idx) => !existingItems[idx]?.id)) {
          throw new Error('Item master tidak lengkap');
        }
      } catch (error) {
        console.error('❌ AIItemDetail - Failed to create items in DB:', error);
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(
            'Gagal Menyimpan\n\nGagal menyimpan data item hasil AI. Silakan coba lagi.'
          );
        }
        return;
      }
    }

    // 3. Update group
    group.items = existingItems;
    group.qty = existingItems.length;

    if (!group.order_detail_ids) {
      group.order_detail_ids = [];
    }

    updatedOrderDetails[groupIdx] = group;
    const updatedQuantity = recalculateOrderQuantity(updatedOrderDetails);

    console.log('🔍 [OrderDetail] Final items before setOrderData:', existingItems.map(it => ({
      id: it.id,
      name: it.name,
      photosCount: it.shoes_photos?.length,
      photosType: typeof it.shoes_photos?.[0],
      photosSample: typeof it.shoes_photos?.[0] === 'string' ? it.shoes_photos?.[0]?.substring(0, 50) : it.shoes_photos?.[0]?.url_photo?.substring(0, 50)
    })));
    console.log('🔍 [OrderDetail] shoes_photos raw:', existingItems.map(it => it.shoes_photos));

    actions.setOrderData({
      ...orderData,
      order_details: updatedOrderDetails,
      quantity: updatedQuantity,
    });

    // 4. Auto-save
    try {
      await submitOrderData({
        ...orderData,
        order_details: updatedOrderDetails,
        quantity: updatedQuantity,
      }, true);
    } catch (error) {
      console.error('❌ Auto-save failed for AI detail:', error);
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Hasil AI deteksi gagal disimpan. Silakan coba lagi.';
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(`Gagal Menyimpan\n\n${message}`);
      }
    }

    setShowAIDetailModal(false);
    setAiDetailGroupIdx(null);
  }, [orderData, groupedOrderDetails, actions, submitOrderData]);

  // Fungsi untuk scroll ke atas dengan delay
  const scrollToTop = () => {

    // Scroll langsung ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Backup scroll dengan delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  // Fungsi validasi berdasarkan payment status
  const isOrderEditable = () => {
    const paymentStatus = orderData.payment?.status;

    // Jika status paid, tidak bisa edit
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      return false;
    }

    // Jika status unpaid atau dp, bisa edit
    if (paymentStatus === PAYMENT_STATUS.UNPAID || paymentStatus === PAYMENT_STATUS.DP) {
      return true;
    }

    // Default bisa edit jika status tidak valid
    return true;
  };

  // Fungsi validasi untuk request pickup berdasarkan status order detail
  const isRequestPickupEditable = () => {
    // Jika order tidak bisa diedit, request pickup juga tidak bisa diedit
    if (!isOrderEditable()) {
      return false;
    }

    // Cek apakah ada item dengan delivery_status delivered (tidak bisa diubah)
    if (groupedOrderDetails && groupedOrderDetails.length > 0) {
      for (const group of groupedOrderDetails) {
        if (group.items && group.items.length > 0) {
          for (const item of group.items) {
            // Jika ada item dengan delivery_status delivered, disable request pickup
            if (item.delivery_status && item.delivery_status === DELIVERY_STATUS.DELIVERED) {
              return false;
            }
          }
        }
      }
    }

    // Untuk status lain (scheduled, failed, cancelled, dll), biarkan user bisa edit
    // Validasi ketat hanya akan dilakukan saat update order
    return true;
  };

  // Fungsi untuk mendapatkan pesan warning request pickup
  const getRequestPickupWarningMessage = () => {
    // Jika order tidak bisa diedit
    if (!isOrderEditable()) {
      return "⚠️ Request pickup tidak bisa diubah karena order sudah lunas";
    }

    // Cek apakah ada item dengan delivery_status delivered
    if (groupedOrderDetails && groupedOrderDetails.length > 0) {
      for (const group of groupedOrderDetails) {
        if (group.items && group.items.length > 0) {
          for (const item of group.items) {
            if (item.delivery_status && item.delivery_status === DELIVERY_STATUS.DELIVERED) {
              return "⚠️ Request pickup tidak bisa diubah";
            }
            if (item.delivery_status && item.delivery_status === DELIVERY_STATUS.FAILED) {
              return "⚠️ Pickup gagal! Anda bisa mengubah tanggal dan waktu pickup untuk mencoba lagi";
            }
            if (item.delivery_status && item.delivery_status === DELIVERY_STATUS.SCHEDULED) {
              return "⚠️ Pickup sudah dijadwalkan. Perubahan akan diterapkan saat update order.";
            }
          }
        }
      }
    }

    return "";
  };

  // Fungsi validasi untuk item yang bisa diedit
  const isItemEditable = (item) => {
    // Item selalu bisa diedit, bahkan jika order sudah paid
    // Tapi jika item status done, tidak bisa diedit
    if (item.status === ORDER_DETAIL_STATUS.DONE) {
      return false;
    }

    return true;
  };

  // Fungsi validasi untuk item yang bisa dihapus
  const isItemRemovable = (item) => {
    // Jika order tidak bisa diedit (paid), item tidak bisa dihapus
    if (!isOrderEditable()) {
      return false;
    }

    // Jika item status done, tidak bisa dihapus
    if (item.status === ORDER_DETAIL_STATUS.DONE) {
      return false;
    }

    return true;
  };

  // Fungsi validasi untuk layanan yang bisa dihapus
  const isTreatmentRemovable = (group) => {
    // Jika order tidak bisa diedit, layanan tidak bisa dihapus
    if (!isOrderEditable()) {
      return false;
    }

    const isProductGroup = group?.requires_tracking === false || group?.treatment?.requires_tracking === false;

    // Untuk layanan (butuh tracking), jangan boleh hapus jika ada item done
    if (!isProductGroup) {
      const hasDoneItems = group.items?.some(item => item.status === ORDER_DETAIL_STATUS.DONE);
      if (hasDoneItems) {
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      // Scroll dulu, baru ubah step
      scrollToTop();
      actions.setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      actions.setCurrentStep(currentStep - 1);
    }
  };

  // Validation functions per step
  const validateStep1 = () => {
    const errors = {};
    const warnings = {};
    const info = {};

    // Validate customer
    if (!orderData.customer) {
      errors.noCustomer = "Pilih Pelanggan untuk order ini";
    }

    // Validate order details - minimal 1 layanan
    if (!groupedOrderDetails || groupedOrderDetails.length === 0) {
      errors.noTreatment = "Order harus memiliki minimal 1 layanan";
    } else {
      // Validate each treatment group
      groupedOrderDetails.forEach((group, groupIndex) => {
        // Validate treatment exists
        if (!group.treatment) {
          errors[`noTreatment_${groupIndex}`] = "Pilih layanan untuk group ini";
        }

        // Validate quantity
        if (!group.qty || group.qty <= 0) {
          errors[`qty_${groupIndex}`] = "Quantity layanan harus lebih dari 0";
        }

        // Validate due date
        if (group.due_date) {
          if (isDateInPast(group.due_date)) {
            warnings[`pastDueDate_${groupIndex}`] = `Due date layanan "${group.treatment?.name || 'Unnamed'}" tidak boleh di masa lalu`;
          }
        }
      });
    }

    // Validate request pickup for online orders
    if (orderData.order_type === ORDER_TYPE.ONLINE && requestPickup) {
      if (!pickupDate) {
        errors.pickupDate = "Tanggal pickup wajib diisi";
      }
      if (!pickupTime) {
        errors.pickupTime = "Jam pickup wajib diisi";
      }
      if (pickupDate) {
        if (isDateInPast(pickupDate)) {
          errors.pickupDate = "Tanggal pickup tidak boleh di masa lalu";
        }
      }
    }

    return { errors, warnings, info };
  };

  const validateStep2 = () => {
    const errors = {};
    const warnings = {};
    const info = {};

    // Validate payment details
    if (!paymentDetails || paymentDetails.length === 0) {
      info.noPayment = "Belum ada metode pembayaran. Silakan tambahkan metode pembayaran untuk melengkapi order.";
    } else {
      paymentDetails.forEach((payment, index) => {
        if (!payment.method) {
          errors[`paymentMethod_${index}`] = "Pilih metode pembayaran";
        }
        if (!payment.amount || payment.amount <= 0) {
          errors[`paymentAmount_${index}`] = "Nominal pembayaran harus lebih dari 0";
        }
        if (payment.amount > total * 10) {
          warnings[`largeAmount_${index}`] = "Nominal pembayaran terlalu besar";
        }
      });

      // Validate total payment
      const totalPaid = paymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Check payment status based on order status
      if (isLunas) {
        warnings.paymentStatus = "Order sudah lunas. Perubahan layanan tidak mempengaruhi pembayaran.";
      } else if (isDPValid && totalPaid > 0) {
        // For DP orders, ensure total doesn't go below paid amount
        if (total < totalPaid) {
          errors.dpInsufficient = `Total order (${formatCurrency(total)}) tidak boleh kurang dari DP yang sudah dibayar (${formatCurrency(totalPaid)})`;
        }
      } else if (totalPaid === 0) {
        info.paymentStatus = "Order belum dibayar. Bisa edit layanan dan pembayaran.";
      }

      // Regular payment validation
      if (totalPaid < total) {
        errors.insufficientPayment = `Kurang bayar ${formatCurrency(total - totalPaid)}`;
      }
      if (totalPaid > total) {
        warnings.overpayment = `Pembayaran lebih ${formatCurrency(totalPaid - total)}. Akan ada kembalian.`;
      }
    }

    return { errors, warnings, info };
  };

  const validateStep3 = () => {
    const errors = {};
    const warnings = {};
    const info = {};

    // Validate order details completeness
    if (groupedOrderDetails && groupedOrderDetails.length > 0) {
      groupedOrderDetails.forEach((group, groupIndex) => {
        // Validate treatment exists
        if (!group.treatment) {
          errors[`treatment_${groupIndex}`] = "Pilih layanan untuk group ini";
        }

        const isProductGroup = group.requires_tracking === false || group.treatment?.requires_tracking === false;
        // Validate quantity
        if (!group.qty || group.qty <= 0) {
          errors[`qty_${groupIndex}`] = "Quantity harus lebih dari 0";
        }

        if (!isProductGroup) {
          // Validate items - setiap layanan harus punya minimal 1 item
          if (!group.items || group.items.length === 0) {
            errors[`noItems_${groupIndex}`] = `Layanan "${group.treatment?.name || 'Unnamed'}" harus memiliki minimal 1 item`;
          } else {
            // Validate each item
            group.items.forEach((item, itemIndex) => {
              if (!item.quantity || item.quantity <= 0) {
                errors[`itemQty_${groupIndex}_${itemIndex}`] = `Quantity item "${item.name}" harus lebih dari 0`;
              }
              if (!item.name) {
                errors[`itemName_${groupIndex}_${itemIndex}`] = "Nama item tidak boleh kosong";
              }
            });
          }
        }

        // Validate due date
        if (group.due_date) {
          if (isDateInPast(group.due_date)) {
            warnings[`pastDueDate_${groupIndex}`] = `Due date layanan "${group.treatment?.name || 'Unnamed'}" tidak boleh di masa lalu`;
          }
        }
      });
    }

    // Check order status for workflow warnings
    if (orderData.status === 'processing' || orderData.status === 'completed') {
      warnings.statusChange = "Order sudah diproses. Perubahan bisa mempengaruhi workflow.";
    }

    return { errors, warnings, info };
  };

  const validateStep4 = () => {
    const errors = {};
    const warnings = {};
    const info = {};

    // Final comprehensive validation
    if (!orderData.customer) {
      errors.customer = "Pelanggan harus dipilih";
    }

    if (!groupedOrderDetails || groupedOrderDetails.length === 0) {
      errors.orderDetails = "Order harus memiliki minimal satu layanan";
    } else {
      // Final check for items (hanya untuk layanan tracking)
      groupedOrderDetails.forEach((group, groupIndex) => {
        const isProductGroup = group.requires_tracking === false || group.treatment?.requires_tracking === false;
        if (!isProductGroup && (!group.items || group.items.length === 0)) {
          errors[`finalNoItems_${groupIndex}`] = `Layanan "${group.treatment?.name || 'Unnamed'}" harus memiliki minimal 1 item`;
        }
      });
    }

    // Final payment status check
    if (isLunas) {
      warnings.finalPaymentStatus = "Order sudah lunas. Perubahan tidak mempengaruhi pembayaran.";
    }

    return { errors, warnings, info };
  };

  // Get validation for current step
  const getCurrentStepValidation = () => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      default:
        return { errors: {}, warnings: {}, info: {} };
    }
  };

  // Update validation when step or data changes
  useEffect(() => {
    const { errors, warnings, info } = getCurrentStepValidation();
    setValidationErrors(errors);
    setValidationWarnings(warnings);
    setValidationInfo(info);
  }, [currentStep, orderData, groupedOrderDetails, paymentDetails, total, isLunas, isDPValid, requestPickup, pickupDate, pickupTime]);

  // Check if current step is valid for navigation (less strict)
  const isCurrentStepValid = () => {
    // For step 1: only require customer and at least one treatment
    if (currentStep === 1) {
      return orderData.customer && groupedOrderDetails && groupedOrderDetails.length > 0;
    }

    // For step 2: allow navigation even without payment (user might want to see payment step)
    if (currentStep === 2) {
      return true; // Always allow navigation to payment step
    }

    // For step 3: require basic treatment validation
    if (currentStep === 3) {
      return groupedOrderDetails && groupedOrderDetails.length > 0;
    }

    // For step 4: require all validations
    return Object.keys(validationErrors).length === 0;
  };

  // Helper functions menggunakan labelFormatter (centralized)
  const getStatusColor = (status) => getOrderDetailStatusColors(status);
  const getOrderDetailStatusLabel = (status) => formatOrderDetailStatus(status);



  // Render steps
  const renderStep1 = () => (
    <StepCustomerInfo
      orderData={orderData}
      customers={customers}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onSelectCustomer={(customer) => actions.updateCustomer(customer)}
      onAddCustomer={() => setShowCustomerModal(true)}
      onEditCustomer={() => setShowEditCustomerModal(true)}
      isOrderEditable={isOrderEditable}
      updateField={(field, value) => actions.updateField(field, value)}
      requestPickup={requestPickup}
      pickupDate={pickupDate}
      pickupTime={pickupTime}
      onRequestPickupChange={handleRequestPickupChange}
      onPickupDateChange={handlePickupDateChange}
      onPickupTimeChange={handlePickupTimeChange}
      isRequestPickupEditable={isRequestPickupEditable}
      getRequestPickupWarningMessage={getRequestPickupWarningMessage}
    />
  );

  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        {/* Status Payment Info */}
        {!isOrderEditable() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800 font-montserrat">
                  Pesanan sudah lunas (Status: {formatPaymentStatus(orderData.payment?.status)})
                </p>
                <p className="text-xs text-yellow-700 font-montserrat">
                  Layanan tidak bisa ditambah/diedit, tapi item masih bisa diedit (data, gambar, parfum, notes).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validasi step 2: minimal 1 layanan dan semua layanan ada item */}
        {groupedOrderDetails.length === 0 && (
          <div className="text-gray-400 text-center py-8">Tidak ada layanan</div>
        )}
        {groupedOrderDetails.map((group, idx) => {
          const isProductGroup = group.requires_tracking === false || group.treatment?.requires_tracking === false;
          const hasDoneItems = !isProductGroup && group.items?.some(item => item.status === ORDER_DETAIL_STATUS.DONE);

          return (
            <ServiceCard
              key={idx}
              group={group}
              idx={idx}
              groupedOrderDetails={groupedOrderDetails}
              orderData={orderData}
              hasDoneItems={hasDoneItems}
              isOrderEditable={isOrderEditable}
              isTreatmentRemovable={isTreatmentRemovable}
              onEditGroup={(groupData, idx) => {
                setEditingGroup(groupData);
                setEditingGroupIdx(idx);
                setSelectedTreatment(groupData.treatment);
                setTreatmentQty(groupData.qty);
                setTreatmentDiscount(groupData.discount || null);
                setTreatmentDueDate(groupData.due_date ? toInputDateString(groupData.due_date) : '');
                setTreatmentServeMode(groupData.serve_mode || defaultServeMode);
                setTreatmentNote(groupData.note || '');
                setTreatmentOptions(groupData.options || {});
                setEnableCustomPrice(groupData.custom_price != null);
                setTreatmentCustomPrice(groupData.custom_price);
                setTreatmentCustomPriceReason(groupData.custom_price_reason || '');
                setShowEditGroupModal(true);
              }}
              onRemoveGroup={(idx) => {
                const newOrderDetails = groupedOrderDetails.filter((_, i) => i !== idx);
                actions.setOrderData({ ...orderData, order_details: newOrderDetails });
              }}
              onAddItem={(idx) => {
                setEditingGroupIdx(idx);
                setShowAddItemModal(true);
              }}
              onAIDetectItem={(idx) => {
                setAiDetailGroupIdx(idx);
                setShowAIDetailModal(true);
              }}
              onShowStatusHistory={(item) => handleShowStatusHistory(item)}
              onEditItem={(groupIdx, itemIdx) => {
                setEditingGroupIdx(groupIdx);
                setEditingItemIdx(itemIdx);
                const item = groupedOrderDetails[groupIdx]?.items[itemIdx];
                if (item) {
                  setEditingItem({
                    ...item,
                    parfum: item.parfum || '',
                    notes: item.notes || '',
                  });
                  setShowEditItemModal(true);
                }
              }}
              onRemoveItem={(groupIdx, itemIdx) => {
                const newOrderDetails = [...groupedOrderDetails];
                const groupCopy = { ...newOrderDetails[groupIdx] };
                const itemToRemove = groupCopy.items[itemIdx];
                const orderDetailIdToRemove = itemToRemove?.order_detail_id;
                groupCopy.items = groupCopy.items.filter((_, index) => index !== itemIdx);
                if (orderDetailIdToRemove && groupCopy.order_detail_ids) {
                  groupCopy.order_detail_ids = groupCopy.order_detail_ids.filter(
                    id => id !== orderDetailIdToRemove
                  );
                }
                groupCopy.qty = groupCopy.items.length;
                newOrderDetails[groupIdx] = groupCopy;
                const totalQuantity = recalculateOrderQuantity(newOrderDetails);
                actions.setOrderData({
                  ...orderData,
                  order_details: newOrderDetails,
                  quantity: totalQuantity
                });
              }}
              isItemEditable={isItemEditable}
              isItemRemovable={isItemRemovable}
              getStatusColor={getStatusColor}
              getOrderDetailStatusLabel={getOrderDetailStatusLabel}
              onOpenPhotoGallery={handleOpenPhotoGallery}
            />
          );
        })}
        {/* Tombol tambah produk */}
        {isOrderEditable() && (
          <button
            onClick={() => setShowAddTreatmentModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-telaga-300 rounded-xl text-telaga-600 hover:bg-telaga-50 hover:border-telaga-400 transition-all font-montserrat text-base font-semibold"
          >
            <Plus className="w-6 h-6" />
            Tambah Produk
          </button>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <StepReview
        orderData={orderData}
        groupedOrderDetails={groupedOrderDetails}
        total={total}
        getStatusColor={getStatusColor}
        getOrderDetailStatusLabel={getOrderDetailStatusLabel}
        onOpenPhotoGallery={handleOpenPhotoGallery}
      />
    );
  };

  const renderStep4 = () => (
    <PaymentStep
      total={total}
      discounts={discounts}
      submitOrderData={submitOrderData}
      fetchOrderData={fetchOrderData}
    />
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pesanan data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-telaga-500 text-white rounded-lg hover:bg-telaga-600"
          >
            Kembali ke Pesanan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-krem">
      {/* Floating Validation Icon */}
      <ValidationFloatingIcon
        count={modalErrors.length + modalWarnings.length + modalInfo.length}
        onClick={() => setShowValidationModal(true)}
      />
      <ValidationModal
        open={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={modalErrors}
        warnings={modalWarnings}
        info={modalInfo}
      />
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 border-b border-telaga-900/10 shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-telaga-800 via-telaga-700 to-telaga-500">
          <div className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-senja-400/25 blur-2xl" />
          <div className="relative mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="rounded-xl p-2 text-white/90 transition-all hover:bg-white/15 hover:text-white active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bebas text-2xl tracking-wide text-white leading-none">Detail Pesanan</h1>
                <p className="mt-1 text-xs font-montserrat font-medium text-telaga-100">
                  Pesanan #{orderData.id || 'New'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowExplanationModal(true)}
                className="rounded-xl p-2 text-white/90 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                title="Panduan Detail Pesanan"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="rounded-xl p-2 text-white/90 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                title="Cetak Struk"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-xl p-2 text-white/90 transition-all hover:bg-red-500/30 hover:text-white active:scale-95"
                title="Hapus Pesanan"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          </div>
        </div>
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {/* Stepper Modern */}
        <div ref={stepperRef} className="mb-4">
          <StepperHeader currentStep={currentStep} totalSteps={4} />
        </div>

        {/* Droppoint Badge - Show only for mitra orders */}
        {orderData.branch_type === 'mitra' && orderData.branch_name && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-senja-200 bg-senja-50 px-3 py-1.5 font-montserrat text-xs font-semibold text-senja-700">
              📍 Order dari {orderData.branch_name}
            </span>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Floating Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-telaga-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Validation Messages */}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <AnimatedButton
                variant="grey"
                className="h-12 flex-1 px-4 font-semibold"
                onClick={handlePrevStep}
              >
                Kembali
              </AnimatedButton>
            )}
            {currentStep < 4 && (
              <AnimatedButton
                variant="telaga"
                className="h-12 flex-1 px-4 font-semibold"
                onClick={handleNextStep}
                disabled={!isCurrentStepValid()}
              >
                Lanjut
              </AnimatedButton>
            )}
            {currentStep === 4 && (
              <AnimatedButton
                variant="green"
                className="h-12 flex-1 px-4 font-semibold"
                onClick={handleSubmit}
                disabled={Object.keys(validationErrors).length > 0 || isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
              </AnimatedButton>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTreatmentModal
        open={showAddTreatmentModal}
        treatments={visibleTreatments}
        discounts={discounts}
        selectedTreatment={selectedTreatment}
        onSelectTreatment={handleSelectTreatment}
        qty={treatmentQty}
        onQtyChange={handleQtyChange}
        discount={treatmentDiscount}
        onDiscountChange={handleDiscountChange}
        dueDate={treatmentDueDate}
        onDueDateChange={setTreatmentDueDate}
        serveMode={treatmentServeMode}
        onServeModeChange={setTreatmentServeMode}
        defaultServeMode={defaultServeMode}
        note={treatmentNote}
        onNoteChange={setTreatmentNote}
        options={treatmentOptions}
        onOptionsChange={setTreatmentOptions}
        onAdd={handleAddTreatment}
        onClose={handleCloseAddTreatmentModal}
      />

      <EditItemModal
        open={showEditItemModal}
        item={editingItem}
        mode="edit"
        isSearching={isSearchingItem}
        customerId={orderData?.customer?.id || null}
        onSave={async (updatedItem) => {

          // Update item di group yang sesuai
          if (editingGroupIdx !== null && editingItemIdx !== null) {
            const newOrderDetails = [...groupedOrderDetails];
            const group = { ...newOrderDetails[editingGroupIdx] };
            const originalItem = group.items[editingItemIdx];


            group.items = group.items.map((it, idx) => idx === editingItemIdx ? {
              ...it, // Keep original item data
              ...updatedItem, // Override with updated data
              // Ensure critical fields are preserved
              order_detail_id: it.order_detail_id,
              treatment_id: it.treatment_id,
            } : it);


            newOrderDetails[editingGroupIdx] = group;
            const updatedOrderData = { ...orderData, order_details: newOrderDetails };
            actions.setOrderData(updatedOrderData);


            // Auto-save to server (silent) - pass data directly
            try {
              await submitOrderData(updatedOrderData, true); // silent = true
            } catch (error) {
              console.error('❌ Auto-save failed:', error);
            }

            setShowEditItemModal(false);
            setEditingItemIdx(null);
            setEditingGroupIdx(null);
            setEditingItem(null);
          }
        }}
        onClose={() => {
          setShowEditItemModal(false);
          setEditingItemIdx(null);
          setEditingGroupIdx(null);
          setEditingItem(null);
        }}
        itemOptions={searchItemResults}
        onItemSearch={handleItemSearch}
      />
      {/* Modal Tambah Item */}
      <EditItemModal
        open={showAddItemModal}
        item={null}
        mode="add"
        isSearching={isSearchingItem}
        customerId={orderData?.customer?.id || null}
        onSave={async (newItem) => {
          if (editingGroupIdx !== null) {
            // Tambahkan item ke group yang sesuai
            const newOrderDetails = [...groupedOrderDetails];
            const group = { ...newOrderDetails[editingGroupIdx] };

            // Generate order_detail_id baru jika belum ada
            const newOrderDetailId = newItem.order_detail_id || 0; // 0 untuk item baru agar transformFETemplateToApi mengenali sebagai item baru

            // Tambahkan item baru
            const newItemWithId = {
              ...newItem,
              parfum: newItem.parfum,
              description: newItem.notes,
              order_detail_id: newOrderDetailId,
              status: 'antrian', // ✅ Item baru langsung antrian (customer sudah bawa sepatu ke toko)
            };

            group.items = [...(group.items || []), newItemWithId];

            // Update qty berdasarkan jumlah items
            group.qty = group.items.length;

            // Update order_detail_ids
            if (!group.order_detail_ids) {
              group.order_detail_ids = [];
            }
            group.order_detail_ids.push(newOrderDetailId);

            newOrderDetails[editingGroupIdx] = group;

            // Update total quantity
            const totalQuantity = recalculateOrderQuantity(newOrderDetails);

            const updatedOrderData = {
              ...orderData,
              order_details: newOrderDetails,
              quantity: totalQuantity
            };

            actions.setOrderData(updatedOrderData);

            // Auto-save to server (silent) - pass data directly
            try {
              await submitOrderData(updatedOrderData, true); // silent = true
            } catch (error) {
              console.error('❌ Auto-save failed for new item:', error);
            }

            setShowAddItemModal(false);
            setEditingGroupIdx(null);
          }
        }}
        onClose={() => {
          setShowAddItemModal(false);
          setEditingGroupIdx(null);
        }}
        itemOptions={searchItemResults}
        onItemSearch={handleItemSearch}
      />
      {/* Modal Edit Group/Layanan */}
      <AddTreatmentModal
        open={showEditGroupModal}
        treatments={visibleTreatments}
        discounts={discounts}
        selectedTreatment={selectedTreatment}
        onSelectTreatment={handleSelectTreatment}
        qty={treatmentQty}
        onQtyChange={handleQtyChange}
        discount={treatmentDiscount}
        onDiscountChange={handleDiscountChange}
        dueDate={treatmentDueDate}
        onDueDateChange={setTreatmentDueDate}
        serveMode={treatmentServeMode}
        onServeModeChange={setTreatmentServeMode}
        defaultServeMode={defaultServeMode}
        note={treatmentNote}
        onNoteChange={setTreatmentNote}
        options={treatmentOptions}
        onOptionsChange={setTreatmentOptions}
        onAdd={(treatment, options) => {
          if (editingGroupIdx !== null) {
            const updatedOrderDetails = [...groupedOrderDetails];
            const existingGroup = updatedOrderDetails[editingGroupIdx] || {};

            const treatmentRequiresTracking = options.requires_tracking !== undefined
              ? options.requires_tracking
              : existingGroup?.treatment?.requires_tracking !== false;
            const isProduct = !treatmentRequiresTracking;
            const requestedQty = options.qty && options.qty > 0 ? Number(options.qty) : 1;

            let updatedItems = Array.isArray(existingGroup.items) ? [...existingGroup.items] : [];
            let updatedOrderDetailIds = Array.isArray(existingGroup.order_detail_ids)
              ? [...existingGroup.order_detail_ids]
              : [];

            const createGroupPlaceholder = () => createPlaceholderItem({
              requiresTracking: !isProduct,
              status: isProduct ? ORDER_DETAIL_STATUS.DONE : ORDER_DETAIL_STATUS.ANTRIAN,
            });

            if (requestedQty > updatedItems.length) {
              const toAdd = requestedQty - updatedItems.length;
              for (let i = 0; i < toAdd; i += 1) {
                updatedItems.push(createGroupPlaceholder());
                updatedOrderDetailIds.push(0);
              }
            } else if (requestedQty < updatedItems.length) {
              if (isProduct) {
                updatedItems = updatedItems.slice(0, requestedQty);
                updatedOrderDetailIds = updatedOrderDetailIds.slice(0, requestedQty);
              } else {
                const removableIndices = [];
                updatedItems.forEach((item, index) => {
                  if (item?.status !== ORDER_DETAIL_STATUS.DONE) {
                    removableIndices.push(index);
                  }
                });
                removableIndices.sort((a, b) => a - b);
                while (updatedItems.length > requestedQty && removableIndices.length > 0) {
                  const removeIndex = removableIndices.pop();
                  const [removedItem] = updatedItems.splice(removeIndex, 1);
                  if (removedItem?.order_detail_id) {
                    updatedOrderDetailIds = updatedOrderDetailIds.filter(id => id !== removedItem.order_detail_id);
                  }
                }
              }
            }

            const finalItems = updatedItems;
            const finalOrderDetailIds = updatedOrderDetailIds;
            const finalQty = isProduct ? Math.max(requestedQty, 1) : finalItems.length;

            const updatedGroup = {
              ...existingGroup,
              treatment,
              discount: options.discount || null,
              discount_id: options.discount?.id || null, // ✅ Update discount_id when discount changes
              due_date: options.due_date || treatmentDueDate || null,
              serve_mode: options.serve_mode || existingGroup?.serve_mode || defaultServeMode,
              note: options.note !== undefined ? options.note : (existingGroup?.note || ''),
              options: options.options || existingGroup?.options || {},
              requires_tracking: treatmentRequiresTracking,
              custom_price: options.custom_price !== undefined ? options.custom_price : null, // ✅ Use options.custom_price
              custom_price_reason: options.custom_price_reason || null, // ✅ Use options.custom_price_reason
              items: finalItems,
              order_detail_ids: finalOrderDetailIds,
              qty: finalQty,
            };

            updatedOrderDetails[editingGroupIdx] = updatedGroup;

            const updatedQuantity = recalculateOrderQuantity(updatedOrderDetails);
            const updatedOrderData = {
              ...orderData,
              order_details: updatedOrderDetails,
              quantity: updatedQuantity,
            };

            actions.setOrderData(updatedOrderData);
            setShowEditGroupModal(false);
            setEditingGroup(null);
            setEditingGroupIdx(null);
            setSelectedTreatment(null);
            setTreatmentQty(1);
            setTreatmentDiscount(null);
            setEnableCustomPrice(false);
            setTreatmentCustomPrice(null);
            setTreatmentCustomPriceReason('');
            // Process time sudah dihilangkan
            setTreatmentDueDate('');
            setTreatmentServeMode(null);
            setTreatmentNote('');
            setTreatmentOptions({});
          }
        }}
        onClose={() => {
          setShowEditGroupModal(false);
          setEditingGroup(null);
          setEditingGroupIdx(null);
          setSelectedTreatment(null);
          setTreatmentQty(1);
          setTreatmentDiscount(null);
          setEnableCustomPrice(false);
          setTreatmentCustomPrice(null);
          setTreatmentCustomPriceReason('');
          // Process time sudah dihilangkan
          setTreatmentDueDate('');
          setTreatmentServeMode(null);
          setTreatmentNote('');
          setTreatmentOptions({});
        }}
        title="Edit Produk/Paket"
        actionLabel="Edit Produk/Paket"
      />

      {/* AI Item Detail Modal */}
      <AIItemDetailModal
        open={showAIDetailModal}
        onClose={() => {
          setShowAIDetailModal(false);
          setAiDetailGroupIdx(null);
        }}
        onResult={handleAIDetailResult}
        groupIdx={aiDetailGroupIdx}
      />

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <QuickOrderPrintReceipt
            order={orderData}
            onClose={() => setShowPrintModal(false)}
          />
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Order Berhasil Diperbarui!"
        message="Data order telah berhasil disimpan dan diperbarui."
        onConfirm={handleSuccessConfirm}
        confirmText="Lihat Daftar Order"
        onSecondary={handleSuccessStay}
        secondaryText="Tinggal di Halaman Ini"
        variant="double"
      />

      {/* Status History Modal */}
      <StatusHistoryModal
        isOpen={showStatusHistoryModal}
        onClose={handleCloseStatusHistory}
        orderDetailId={selectedItemForHistory?.order_detail_id}
        statusHistory={statusHistory}
        loading={statusHistoryLoading}
        error={statusHistoryError}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={showEditCustomerModal}
        onClose={() => setShowEditCustomerModal(false)}
        customer={orderData.customer}
        onSuccess={handleEditCustomerSuccess}
      />


      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        onClose={handleClosePhotoGallery}
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                Hapus Order
              </h3>
              {(userInfo?.role === 'superadmin' || userInfo?.role === 'superapp-superadmin') ? (
                <p className="text-sm text-gray-500 font-montserrat mb-6">
                  Apakah Anda yakin ingin menghapus order #{orderData.id}? Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi laporan keuangan.
                </p>
              ) : (
                <p className="text-sm text-gray-500 font-montserrat mb-6">
                  Anda tidak diizinkan untuk hapus pesanan, silakan hubungi owner untuk menghapus pesanan.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-montserrat"
                >
                  {(userInfo?.role === 'superadmin' || userInfo?.role === 'superapp-superadmin') ? 'Batal' : 'Tutup'}
                </button>
                {(userInfo?.role === 'superadmin' || userInfo?.role === 'superapp-superadmin') && (
                  <button
                    onClick={handleDeleteOrder}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 font-montserrat"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <OrderDetailExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />
    </div>
  );
};

export default OrderDetailWithProvider; 