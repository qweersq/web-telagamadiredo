import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Info, X, HelpCircle, Clock, Loader2, CheckCircle, Package } from "lucide-react";
import instance from "../../config/api";
import { getUserProfile, getActiveShiftId, invalidateUserProfileCache } from "../../utils/userProfileHelper";
import Header from "../../components/Com Header/Header";
import ConfirmationModal from "../../components/Modal/ConfirmationModal";
import InfoModal from "../../components/Modal/InfoModal";
import AnimatedButton from "../../components/Design/AnimatedButton";
import DateRangePickerV2 from "../../components/DateRangePicker/DateRangePickerV2";
import OpenShiftModal from './SHIFT/OpenShiftModal';
import ItemDoneTemplateModal from "../../components/QuickInput/ItemDoneTemplateModal";
import CalendarExplanationModal from "../../components/Modal/CalendarExplanationModal";
import PhotoGalleryModal from '../../components/Modal/PhotoGalleryModal';
import {
  saveFilterToStorage,
  getFilterFromStorage,
  clearFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES
} from "../../utils/filterStorage";
import { getPhotoUrl } from '../../utils/photoUrlHelper';
import OperationPanelModal from '../../components/Modal/OperationPanelModal';

const BerandaKasir = () => {
  const navigate = useNavigate();
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [topTreatments, setTopTreatments] = useState([]);
  const [totalAntrian, setTotalAntrian] = useState(0);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [displayedTreatments, setDisplayedTreatments] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    // Load saved date range from filter storage
    const savedRange = getFilterFromStorage(COMPONENT_NAMES.BERANDA_KASIR, FILTER_TYPES.DATE_FILTER);
    if (savedRange) {
      return savedRange;
    }
    // Fallback to localStorage for backward compatibility
    const localSavedRange = localStorage.getItem("dateRange");
    if (localSavedRange) {
      return JSON.parse(localSavedRange);
    }
    const today = new Date().toISOString().split("T")[0];
    return {
      startDate: today,
      endDate: today,
    };
  });
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchRoleModal, setShowSwitchRoleModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );
  const [isFromPresent, setIsFromPresent] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);
  const [showShiftValidationModal, setShowShiftValidationModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showOperationPanel, setShowOperationPanel] = useState(false);
  const [operationPanelStatus, setOperationPanelStatus] = useState(null);

  // Admin Dashboard States
  const [adminOrders, setAdminOrders] = useState([]);
  const [notYetCount, setNotYetCount] = useState(0);
  const [penjemputanCount, setPenjemputanCount] = useState(0);
  const [antrianCount, setAntrianCount] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  const [pengeringanCount, setPengeringanCount] = useState(0);
  const [lainnyaCount, setLainnyaCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('antrian');
  const [modalCounts, setModalCounts] = useState({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loadingMessageTemplate, setLoadingMessageTemplate] = useState(false);
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showItemDoneTemplateModal, setShowItemDoneTemplateModal] = useState(false);

  // State untuk NotaFree dan Pro Feature Modal
  const [isNotaFree, setIsNotaFree] = useState(false);
  const [showProFeatureModal, setShowProFeatureModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');
  const [showCalendarExplanationModal, setShowCalendarExplanationModal] = useState(false);

  // State untuk Admin Notes
  const [pendingNotesCount, setPendingNotesCount] = useState(0);

  // Gallery States
  const [showGallery, setShowGallery] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Fungsi untuk memformat tanggal ke format database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Helper function untuk mendapatkan userData dari API
  const getUserData = async () => {
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
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };

      return userData;
    } catch (error) {
      console.error('[ERROR] BerandaKasir - Failed to get userData from API:', error);
      return null;
    }
  };

  // Fungsi untuk mengambil data antrian dari API dan menghitung jumlahnya
  const fetchAntrianCounts = async (range) => {
    try {
      const userData = await getUserData();

      // Format tanggal ke YYYY-MM-DD
      const startDate = formatDateForDB(range.startDate);
      const endDate = formatDateForDB(range.endDate);

      // Build filterObj sesuai backend (range pakai gte/lte, single pakai string)
      let filterObj = {};
      if (startDate === endDate) {
        filterObj.entry_date = startDate;
      } else {
        filterObj.entry_date = { gte: startDate, lte: endDate };
      }
      // Status untuk kasir: 
      // 1. PILIHAN LOLOS/TIDAK LOLOS: pengeringan
      // 2. PILIHAN DIANTAR/DIAMBIL DITOKO: siap
      // 3. SUDAH DIAMBIL: siap_diambil
      filterObj["order_details.status"] = ["pengeringan", "siap", "siap_diambil"];

      const params = {
        page: 1,
        pageSize: 1000,
        filter: JSON.stringify(filterObj),
      };

      // Add tenant_id and branch_id for data isolation
      if (userData?.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }
      if (userData?.branch_id) {
        params.branch_id = userData.branch_id;
      }

      const response = await instance.get('/orders-new-raw', { params });

      if (response.data && response.data.data && Array.isArray(response.data.data.orders)) {
        const ordersArray = response.data.data.orders;
        setFetchedOrders(ordersArray);
      } else {
        setFetchedOrders([]);
        setAntrianData({ regular: 0, same_day: 0, next_day: 0 });
      }
    } catch (error) {
      console.error("Error fetching cashier orders:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      setFetchedOrders([]);
      setAntrianData({ regular: 0, same_day: 0, next_day: 0 });
    }
  };

  // Handle perubahan input tanggal
  const handleDateInputChange = async (e) => {
    const { name, value } = e.target;
    const formattedValue = formatDateForDB(value);

    const newRange = {
      ...dateRange,
      [name]: formattedValue,
    };

    if (name === "startDate" && formattedValue > dateRange.endDate) {
      newRange.endDate = formattedValue;
    } else if (name === "endDate" && formattedValue < dateRange.startDate) {
      newRange.startDate = formattedValue;
    }

    setDateRange(newRange);

    // Save to filter storage
    saveFilterToStorage(
      COMPONENT_NAMES.BERANDA_KASIR,
      FILTER_TYPES.DATE_FILTER,
      newRange,
      24 // 24 hours expiration
    );

    // Also save to localStorage for backward compatibility
    localStorage.setItem("dateRange", JSON.stringify(newRange));
    fetchAntrianCounts(newRange); // Panggil fetchAntrianCounts saat tanggal berubah
  };

  useEffect(() => {
    // Check if user has NotaFree plan
    const checkSubscription = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          const planId = profile?.subscription?.plan?.id;
          setIsNotaFree(planId === 4);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, []);

  useEffect(() => {
    // Panggil fetchAntrianCounts saat komponen pertama kali dimuat atau dateRange berubah
    fetchAntrianCounts(dateRange);

    // Fetch admin counts only (not orders) for dashboard
    fetchAdminCountsOnly(dateRange);

    // Fetch pending notes count
    fetchPendingNotesCount();

    // Fetch modal counts for filter buttons
    const fetchInitialModalCounts = async () => {
      try {
        const userData = await getUserData();
        const startDate = formatDateForDB(dateRange.startDate);
        const endDate = formatDateForDB(dateRange.endDate);
        await fetchModalCounts(startDate, endDate, userData);
      } catch (error) {
        console.error('❌ BerandaKasir - Error fetching initial modal counts:', error);
      }
    };

    if (dateRange.startDate && dateRange.endDate) {
      fetchInitialModalCounts();
    }

    // Cek present seperti sebelumnya
    const fromPresent = sessionStorage.getItem("fromPresent");
    if (fromPresent === "true") setIsFromPresent(true);
  }, [dateRange]); // Tambahkan dateRange sebagai dependency

  // New useEffect to process fetchedOrders and update counts
  useEffect(() => {
    if (fetchedOrders.length > 0) {
      const allTreatments = fetchedOrders.flatMap((order) => {
        const orderDetails = Array.isArray(order?.order_details)
          ? order.order_details
          : [];
        return orderDetails.map((detail) => ({ ...detail, order: order }));
      });

      // Hitung jumlah per treatment
      const treatmentCounts = {};
      allTreatments.forEach((item) => {
        const treatmentName = item.treatment?.name || 'Unknown Treatment';
        if (treatmentCounts[treatmentName]) {
          treatmentCounts[treatmentName]++;
        } else {
          treatmentCounts[treatmentName] = 1;
        }
      });

      // Convert ke array dan sort berdasarkan jumlah (descending)
      const sortedTreatments = Object.entries(treatmentCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setTopTreatments(sortedTreatments);
      setTotalAntrian(allTreatments.length);
    } else {
      setTopTreatments([]);
      setTotalAntrian(0);
    }
  }, [fetchedOrders]); // Depend on fetchedOrders to re-calculate counts

  // Update displayed treatments based on showAllTreatments state
  useEffect(() => {
    if (showAllTreatments) {
      setDisplayedTreatments(topTreatments);
    } else {
      setDisplayedTreatments(topTreatments.slice(0, 5));
    }
  }, [topTreatments, showAllTreatments]);

  const handleLogoutConfirm = () => {
    // Implementasi log out
  };

  const handleSwitchRoleConfirm = () => {
    // Implementasi switch role
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Clear existing filter first to ensure clean state
      clearFilterFromStorage(COMPONENT_NAMES.ORDER_DASHBOARD, FILTER_TYPES.COMPLEX_FILTER);

      // Save search query to localStorage filter for OrderDashboard
      // When searching, clear date filters to search all data
      const filterData = {
        searchTerm: searchQuery.trim(),
        activeStartDate: '', // Empty for search all dates
        activeEndDate: '',   // Empty for search all dates
        activeDateFilterType: '', // Empty to prevent default date filter
        orderDetailStatus: 'all',
        paymentStatus: 'all'
      };

      // Save to encrypted storage (same as OrderDashboard uses)
      saveFilterToStorage(
        COMPONENT_NAMES.ORDER_DASHBOARD,
        FILTER_TYPES.COMPLEX_FILTER,
        filterData,
        24 // 24 hours expiration
      );


      // Close modal and navigate
      setShowSearchModal(false);
      navigate('/orders', { state: { from: '/berandakasir' } });
    }
  };

  // Reset search query when modal closes
  const handleSearchModalClose = () => {
    setShowSearchModal(false);
    setSearchQuery('');
  };

  // Validasi shift sebelum navigasi ke quick order
  const handleTambahPesananClick = async () => {
    try {
      // Check order limit first
      try {
        const limitResponse = await instance.get('/subscriptions/check-order-limit');
        if (limitResponse.data.success && !limitResponse.data.data.canCreate) {
          alert(`Batas maksimal order per bulan telah tercapai (${limitResponse.data.data.current}/${limitResponse.data.data.max}). Silakan upgrade paket untuk menambah order.`);
          return;
        }
      } catch (error) {
        console.error('Error checking order limit:', error);
      }

      // ✅ Invalidate cache untuk memastikan data fresh
      invalidateUserProfileCache();

      const activeShiftId = await getActiveShiftId();

      if (!activeShiftId) {
        setShowShiftValidationModal(true);
        return;
      }
      // Jika shift aktif, lanjutkan navigasi
      navigate('/quick-order');
    } catch (error) {
      console.error('❌ BerandaKasir - Error checking active shift:', error);
      setShowShiftValidationModal(true);
    }
  };

  const handleOpenQueue = (treatmentName) => {
    // Gunakan treatmentName sebagai filter untuk navigasi
    const treatmentFormat = treatmentName.toLowerCase().replace(/\s+/g, '_');

    navigate(`/berandakasir/antriankasir/${treatmentFormat}`, {
      state: {
        dateRange,
        treatment: treatmentFormat,
      },
    });
  };

  // Admin Dashboard Functions
  const fetchAdminData = async (range) => {
    try {
      const userData = await getUserData();

      // Format tanggal ke YYYY-MM-DD
      const startDate = formatDateForDB(range.startDate);
      const endDate = formatDateForDB(range.endDate);

      // Fetch counts
      await fetchCounts(startDate, endDate, userData);

      // Fetch orders based on current filter
      await fetchOrders(startDate, endDate, userData, selectedFilter);

    } catch (error) {
      console.error("Admin Dashboard - Error fetching data:", error);
      setAdminOrders([]);
      setNotYetCount(0);
      setAntrianCount(0);
      setProgressCount(0);
      setLainnyaCount(0);
    }
  };

  // Fetch only counts, not orders (for useEffect)
  const fetchAdminCountsOnly = async (range) => {
    try {
      const userData = await getUserData();

      // Format tanggal ke YYYY-MM-DD
      const startDate = formatDateForDB(range.startDate);
      const endDate = formatDateForDB(range.endDate);

      // Fetch counts only
      await fetchCounts(startDate, endDate, userData);

    } catch (error) {
      console.error("Admin Dashboard - Error fetching counts:", error);
      setNotYetCount(0);
      setAntrianCount(0);
      setProgressCount(0);
      setLainnyaCount(0);
    }
  };

  const fetchCounts = async (startDate, endDate, userData) => {
    try {
      const params = {
        startDate,
        endDate,
        tenant_id: userData?.tenant_id,
        branch_id: userData?.branch_id
      };


      const response = await instance.get('/beranda-kasir/counts', { params });

      if (response.data && response.data.success) {
        const { not_yet, antrian, progress, pengeringan, lainnya, penjemputan } = response.data.data;
        setNotYetCount(not_yet);
        setPenjemputanCount(penjemputan || 0);
        setAntrianCount(antrian);
        setProgressCount(progress);
        setPengeringanCount(pengeringan);
        setLainnyaCount(lainnya);
      }
    } catch (error) {
      console.error('❌ BerandaKasir - Error fetching counts:', error);
    }
  };

  const fetchOrders = async (startDate, endDate, userData, filter = 'antrian') => {
    try {
      const params = {
        filter,
        startDate,
        endDate,
        page: 1,
        limit: 50,
        tenant_id: userData?.tenant_id,
        branch_id: userData?.branch_id
      };


      const response = await instance.get('/beranda-kasir/orders', { params });

      if (response.data && response.data.success) {
        const ordersArray = response.data.data.orders;
        setAdminOrders(ordersArray);
      } else {
        setAdminOrders([]);
      }
    } catch (error) {
      console.error('❌ BerandaKasir - Error fetching orders:', error);
      setAdminOrders([]);
    }
  };

  const fetchModalCounts = async (startDate, endDate, userData) => {
    try {
      const params = {
        startDate,
        endDate,
        tenant_id: userData?.tenant_id,
        branch_id: userData?.branch_id
      };

      // Use the counts API instead of orders API
      const response = await instance.get('/beranda-kasir/counts', { params });

      if (response.data && response.data.success) {
        const data = response.data.data;
        const counts = {
          // Order status counts
          siap_diambil: data.siap_diambil || 0, // Gabungan siap + siap_diambil
          siap_dikirim: data.siap_dikirim || 0,
          done: data.done || 0,
          cancelled: data.cancelled || 0,
          not_ready: data.not_ready || 0,

          // Payment status counts
          belum_bayar: data.belum_bayar || 0,
          dp_dibayar: data.dp_dibayar || 0,
          lunas: data.lunas || 0,
          siap_belum_lunas: data.siap_belum_lunas || 0,

          // Service type counts
          penjemputan: data.penjemputan || 0,
          pengantaran: data.pengantaran || 0,
          pengeringan: data.pengeringan || 0
        };

        setModalCounts(counts);
      } else {
        setModalCounts({});
      }

    } catch (error) {
      console.error('❌ BerandaKasir - Error fetching modal counts:', error);
      setModalCounts({});
    }
  };

  // Remove calculateOrderCounts as counts are now fetched from API

  // Remove getFilteredOrders as orders are now pre-filtered by API
  const getFilteredOrders = () => {
    return adminOrders; // Orders are already filtered by API
  };

  // Fetch pending notes count
  const fetchPendingNotesCount = async () => {
    try {
      const userData = await getUserData();
      if (!userData?.branch_id) return;

      const response = await instance.get('/admin-notes/pending-count', {
        params: {
          branch_id: userData.branch_id
        }
      });

      if (response.data && response.data.success) {
        setPendingNotesCount(response.data.data.count || 0);
      }
    } catch (error) {
      console.error('❌ BerandaKasir - Error fetching pending notes count:', error);
      setPendingNotesCount(0);
    }
  };

  // Function to handle filter button click and open order modal
  const handleFilterClick = async (filter) => {
    setSelectedFilter(filter);
    const paymentFilters = ['belum_bayar', 'dp_dibayar', 'lunas', 'siap_belum_lunas'];
    if (paymentFilters.includes(filter)) { 
      setShowOrderModal(true); // modal lama tetap untuk payment
      // Fetch orders untuk payment filter
      try {
        const userData = await getUserData();
        const startDate = formatDateForDB(dateRange.startDate);
        const endDate = formatDateForDB(dateRange.endDate);
        await fetchOrders(startDate, endDate, userData, filter);
      } catch (error) {
        console.error('❌ BerandaKasir - Error fetching payment orders:', error);
      }
    } else {
      setOperationPanelStatus(filter);
      setShowOperationPanel(true); // modal baru untuk status order
    } 
  };


  const getStatusColor = (status) => {
    const statusColors = {
      'not_yet': 'bg-senja-100 text-senja-800',
      'antrian': 'bg-telaga-100 text-telaga-800',
      'on_progress': 'bg-senja-100 text-senja-800',
      'pengeringan': 'bg-senja-100 text-senja-800',
      'siap': 'bg-telaga-100 text-telaga-800',
      'siap_diambil': 'bg-telaga-100 text-telaga-800',
      'siap_dikirim': 'bg-telaga-100 text-telaga-800',
      'done': 'bg-telaga-100 text-telaga-950',
      'selesai': 'bg-telaga-100 text-telaga-950',
      'cancelled': 'bg-red-100 text-red-800',
      'not_ready': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-telaga-100 text-telaga-950';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'not_yet': 'Menunggu Penjemputan',
      'antrian': 'Antrian',
      'on_progress': 'Proses',
      'pengeringan': 'Sedang Dikeringkan',
      'siap': 'Siap Disajikan',
      'siap_diambil': 'Siap Disajikan',
      'siap_dikirim': 'Siap Dikirim',
      'done': 'Selesai',
      'selesai': 'Selesai',
      'cancelled': 'Dibatalkan',
      'not_ready': 'Tidak Lolos QC'
    };
    return statusLabels[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper: Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  // Helper: Process template dengan variables
  const processTemplateSync = (content, variables) => {
    let processed = content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    return processed;
  };

  // Generate message template dengan fetch dari DB
  const generateMessageTemplate = async (order) => {
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      const tenantId = profile?.tenant?.id;

      if (!branchId || !tenantId) {
        return generateDefaultMessageTemplate(order);
      }

      // Coba fetch template dari database (dengan cache busting untuk mendapatkan template terbaru)
      try {
        const response = await instance.get(`/whatsapp-templates/available/item_done`, {
          params: {
            _t: Date.now() // Cache busting untuk mendapatkan template terbaru
          }
        });

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // Sort berdasarkan updated_at terbaru, lalu ambil yang pertama
          const sortedTemplates = [...response.data.data].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0);
            const dateB = new Date(b.updated_at || b.created_at || 0);
            return dateB - dateA; // Descending (terbaru di atas)
          });
          const template = sortedTemplates[0];

          if (template.template_content) {
            // Fix: Hapus "Selamat " di awal sebelum {{greeting}} untuk menghindari double "Selamat"
            let templateContent = template.template_content;
            templateContent = templateContent.replace(/^Selamat\s+\{\{greeting\}\}/i, '{{greeting}}');
            templateContent = templateContent.replace(/Selamat\s+\{\{greeting\}\}/g, '{{greeting}}');
            // Prepare variables
            const orderDetails = order.order_details || [];
            const descriptions = orderDetails.map(detail => {
              const treatmentName = detail.treatment?.name || 'Item';
              const itemName = detail.item?.name;
              const itemBrand = detail.item?.brand;

              if (itemName) {
                const itemDesc = itemBrand ? `${itemBrand} ${itemName}` : itemName;
                return `${treatmentName} (${itemDesc})`;
              }
              return treatmentName;
            });
            const uniqueDesc = [...new Set(descriptions)].join(', ');

            const firstDetail = orderDetails[0];
            const itemName = firstDetail?.item?.name || '';
            const itemBrand = firstDetail?.item?.brand || '';
            const fullItemName = itemBrand ? `${itemBrand} ${itemName}` : itemName;
            const treatmentName = firstDetail?.treatment?.name || '';

            const variables = {
              greeting: getGreeting(),
              customer_name: order.customer?.name || '',
              tenant_name: profile?.tenant?.business_name || 'NotaSepatu',
              order_number: order.id || order.payment?.code || '',
              order_id: order.id || order.payment?.code || '', // Alias untuk order_id
              item_name: fullItemName,
              treatment_name: treatmentName,
              item_description: uniqueDesc,
              completion_time: new Date().toLocaleString('id-ID'), // Waktu selesai saat ini
              item_status: 'Selesai' // Status default
            };

            let processed = processTemplateSync(templateContent, variables);

            // Hapus variabel yang tidak ter-process (biarkan kosong atau hapus)
            processed = processed.replace(/\{\{[\w_]+\}\}/g, '');

            return processed;
          }
        } else {
          return generateDefaultMessageTemplate(order);
        }
      } catch (templateError) {
        console.log('Template not found, using default:', templateError);
        return generateDefaultMessageTemplate(order);
      }
    } catch (error) {
      console.error('Error generating message template:', error);
      return generateDefaultMessageTemplate(order);
    }
  };

  // Generate default message template (fallback)
  const generateDefaultMessageTemplate = (order) => {
    const customerName = order.customer?.name || 'Kaka';
    const orderDetails = order.order_details || [];

    // Build treatment & item descriptions
    const descriptions = orderDetails.map(detail => {
      const treatmentName = detail.treatment?.name || 'Item';
      const itemName = detail.item?.name;
      const itemBrand = detail.item?.brand;

      if (itemName) {
        const itemDesc = itemBrand ? `${itemBrand} ${itemName}` : itemName;
        return `${treatmentName} (${itemDesc})`;
      }
      return treatmentName;
    });

    // Get unique descriptions
    const uniqueDesc = [...new Set(descriptions)].join(', ');

    return `Halo Kak ${customerName}, item kakak yang ${uniqueDesc} sudah selesai, terima kasih 🙏`;
  };

  // Open message modal
  const handleOpenMessageModal = async (order) => {
    setSelectedOrderForMessage(order);
    setMessageText('');
    setLoadingMessageTemplate(true);
    setShowMessageModal(true);
    setCopySuccess(false);
    const template = await generateMessageTemplate(order);
    setMessageText(template);
    setLoadingMessageTemplate(false);
  };

  // Copy to clipboard
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Gagal menyalin pesan');
    }
  };

  // Open WhatsApp
  const handleOpenWhatsApp = () => {
    const phone = selectedOrderForMessage?.customer?.phone;
    if (!phone) {
      alert('Nomor WhatsApp tidak tersedia');
      return;
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`;

    window.open(waUrl, '_blank');

    // Auto-mark sebagai sudah dihubungi
    if (selectedOrderForMessage?.id) {
      handleMarkNotified(selectedOrderForMessage.id);
    }
    setShowMessageModal(false);
  };

  const handleMarkNotified = async (orderId) => {
    try {
      await instance.patch(`/orders/${orderId}/mark-notified`);
      // Update local state tanpa refetch
      setFetchedOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, is_notified: true, notified_at: new Date().toISOString() } : o)
      );
      setAdminOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, is_notified: true, notified_at: new Date().toISOString() } : o)
      );
    } catch (err) {
      console.error('Gagal mark notified:', err);
    }
  };

  // Check if filter is payment-related
  const isPaymentFilter = (filter) => {
    return ['belum_bayar', 'dp_dibayar', 'lunas', 'siap_belum_lunas'].includes(filter);
  };

  // Group order_details by treatment with items
  const groupTreatmentsWithItems = (orderDetails) => {
    const grouped = {};
    orderDetails.forEach(detail => {
      const treatmentId = detail.treatment?.id || detail.treatment_id;
      const treatmentName = detail.treatment?.name || 'Unknown';

      if (!grouped[treatmentId]) {
        grouped[treatmentId] = {
          name: treatmentName,
          count: 0,
          items: []
        };
      }

      // Count all order_details for this treatment (regardless of item)
      grouped[treatmentId].count += 1;

      // Add item info only if item exists
      if (detail.item) {
        grouped[treatmentId].items.push({
          name: detail.item.name,
          brand: detail.item.brand,
          type: detail.item.type,
          color: detail.item.color
        });
      }
    });

    return Object.values(grouped);
  };


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat bg-krem">
      <Header
        // title="CASHIER DASHBOARD"
        showLogoutButton={true}
        onLogoutClick={() => setShowLogoutModal(true)}
        showSwitchRole={true}
        onSwitchRoleClick={() => setShowSwitchRoleModal(true)}
        currentTime={currentTime}
      />

      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Action Menu */}
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-3">
                <AnimatedButton
                  onClick={() => navigate('/orders', { state: { from: '/berandakasir' } })}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-telaga-100 font-montserrat"
                >
                  <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-telaga-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-telaga-900 font-montserrat">Pesanan</span>
                </AnimatedButton>

                <AnimatedButton
                  onClick={() => setShowFabModal(true)}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-telaga-100 font-montserrat"
                >
                  <div className="w-8 h-8 bg-senja-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-senja-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-telaga-900 font-montserrat">Shift</span>
                </AnimatedButton>

                <AnimatedButton
                  onClick={() => navigate('/pengaturan-admin')}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-telaga-100 font-montserrat"
                >
                  <div className="w-8 h-8 bg-senja-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-senja-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-telaga-900 font-montserrat">Lainnya</span>
                </AnimatedButton>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-3">
                {/* Tambah Pesanan Button */}
                <AnimatedButton
                  variant={"telaga"}
                  onClick={handleTambahPesananClick}
                  className="w-full h-[45px] flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Tambah Pesanan</span>
                  </div>
                </AnimatedButton>

                {/* Cari Pesanan Button */}
                <AnimatedButton
                  variant={"default"}
                  onClick={() => setShowSearchModal(true)}
                  className="w-full h-[45px] flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all border-2 border-telaga-200 text-telaga-900 hover:border-telaga-300 hover:bg-telaga-50/40 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Cari Pesanan</span>
                  </div>
                </AnimatedButton>

                {/* Calendar Button — disembunyikan sementara */}
                {false && (
                <div className="flex items-center gap-2 w-full">
                  <AnimatedButton
                    variant={"default"}
                    onClick={() => {
                      if (isNotaFree) {
                        setProFeatureName('Calendar');
                        setShowProFeatureModal(true);
                      } else {
                        navigate('/calendar');
                      }
                    }}
                    className="flex-1 h-[45px] flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all border-2 border-telaga-300 text-telaga-700 hover:border-telaga-400 hover:bg-telaga-50 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Calendar</span>
                      <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold text-white bg-gradient-to-r from-senja-500 to-senja-600 shadow-sm">
                        PRO
                      </span>
                    </div>
                  </AnimatedButton>
                  {false && (
                    <button
                      onClick={() => setShowCalendarExplanationModal(true)}
                      className="w-[45px] h-[45px] flex items-center justify-center rounded-xl bg-telaga-100 hover:bg-telaga-200 text-telaga-900/70 hover:text-telaga-900 transition-colors border-2 border-telaga-200 hover:border-telaga-300 shadow-sm hover:shadow-md"
                      title="Penjelasan Calendar"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
                )}

                {/* Catatan Admin Button */}
                <AnimatedButton
                  variant={"default"}
                  onClick={() => navigate('/admin-notes')}
                  className="w-full h-[45px] flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all border-2 border-telaga-300 text-telaga-700 hover:border-telaga-400 hover:bg-telaga-50 shadow-sm hover:shadow-md transform hover:scale-[1.02] relative"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Catatan Admin</span>
                  </div>
                  {pendingNotesCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-senja-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                      {pendingNotesCount > 99 ? '99+' : pendingNotesCount}
                    </span>
                  )}
                </AnimatedButton>
              </div>
            </div>

            <DateRangePickerV2
              dateRange={dateRange}
              setDateRange={setDateRange}
              onDateChange={(newRange) => {
                setDateRange(newRange);

                // Save to filter storage
                saveFilterToStorage(
                  COMPONENT_NAMES.BERANDA_KASIR,
                  FILTER_TYPES.DATE_FILTER,
                  newRange,
                  24 // 24 hours expiration
                );

                // Also save to localStorage for backward compatibility
                localStorage.setItem("dateRange", JSON.stringify(newRange));
              }}
            />

            {/* Admin Dashboard Section */}
            <div className="mb-6">
              {/* Filter Buttons Grid */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-telaga-100 mb-4">


                {/* Order Status Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-telaga-900 mb-3 font-montserrat">Status Pesanan</h4>
                  <div className="space-y-2">
                    {/* Antrian */}
                    <button
                      onClick={() => handleFilterClick('antrian')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${selectedFilter === 'antrian'
                        ? 'border-telaga-500 bg-telaga-50'
                        : 'border-telaga-100 bg-telaga-50/40 hover:border-telaga-300 hover:bg-telaga-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFilter === 'antrian' ? 'bg-telaga-200' : 'bg-telaga-100'}`}>
                            <Clock className="w-4 h-4 text-telaga-600" />
                          </div>
                          <span className={`text-sm font-medium font-montserrat ${selectedFilter === 'antrian' ? 'text-telaga-800' : 'text-telaga-900'}`}>
                            Antrian
                          </span>
                        </div>
                        <span className="text-xs bg-telaga-200 text-telaga-600 px-2 py-1 rounded-full font-medium">
                          {antrianCount}
                        </span>
                      </div>
                    </button>

                    {/* Proses */}
                    <button
                      onClick={() => handleFilterClick('progress')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${selectedFilter === 'progress'
                        ? 'border-senja-500 bg-senja-50'
                        : 'border-telaga-100 bg-telaga-50/40 hover:border-senja-300 hover:bg-senja-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFilter === 'progress' ? 'bg-senja-200' : 'bg-senja-100'}`}>
                            <Loader2 className="w-4 h-4 text-senja-600" />
                          </div>
                          <span className={`text-sm font-medium font-montserrat ${selectedFilter === 'progress' ? 'text-senja-800' : 'text-telaga-900'}`}>
                            Proses
                          </span>
                        </div>
                        <span className="text-xs bg-senja-200 text-senja-600 px-2 py-1 rounded-full font-medium">
                          {progressCount}
                        </span>
                      </div>
                    </button>

                    {/* Siap Disajikan */}
                    <button
                      onClick={() => handleFilterClick('siap_diambil')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${selectedFilter === 'siap_diambil'
                        ? 'border-telaga-500 bg-telaga-50'
                        : 'border-telaga-100 bg-telaga-50/40 hover:border-telaga-300 hover:bg-telaga-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFilter === 'siap_diambil' ? 'bg-telaga-200' : 'bg-telaga-100'}`}>
                            <Package className="w-4 h-4 text-telaga-600" />
                          </div>
                          <span className={`text-sm font-medium font-montserrat ${selectedFilter === 'siap_diambil' ? 'text-telaga-800' : 'text-telaga-900'}`}>
                            Siap Disajikan
                          </span>
                        </div>
                        <span className="text-xs bg-telaga-200 text-telaga-600 px-2 py-1 rounded-full font-medium">
                          {modalCounts.siap_diambil || 0}
                        </span>
                      </div>
                    </button>

                    {/* Selesai */}
                    <button
                      onClick={() => handleFilterClick('done')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${selectedFilter === 'done'
                        ? 'border-telaga-400 bg-telaga-100'
                        : 'border-telaga-100 bg-telaga-50/40 hover:border-telaga-300 hover:bg-telaga-100'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFilter === 'done' ? 'bg-telaga-300' : 'bg-telaga-200'}`}>
                            <CheckCircle className="w-4 h-4 text-telaga-900/70" />
                          </div>
                          <span className={`text-sm font-medium font-montserrat ${selectedFilter === 'done' ? 'text-telaga-950' : 'text-telaga-900'}`}>
                            Selesai
                          </span>
                        </div>
                        <span className="text-xs bg-telaga-200 text-telaga-900/70 px-2 py-1 rounded-full font-medium">
                          {modalCounts.done || 0}
                        </span>
                      </div>
                    </button>

                    {/* ===== Status lain disembunyikan (khusus Telaga) =====
                        Menunggu Penjemputan, Sedang Dikeringkan, Siap Dikirim,
                        Dibatalkan, Tidak Lolos QC
                    */}
                  </div>
                </div>

                {/* Payment Status Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-telaga-900 mb-3 font-montserrat">Status Pembayaran</h4>
                  {/* DP Dibayar & Siap Belum Lunas disembunyikan (khusus Telaga) */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleFilterClick('belum_bayar')}
                      className={`p-3 text-left rounded-xl border-2 transition-all ${selectedFilter === 'belum_bayar'
                        ? 'border-senja-500 bg-senja-50 text-senja-800'
                        : 'border-telaga-100 bg-telaga-50/40 text-telaga-900 hover:border-senja-300 hover:bg-senja-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium font-montserrat">Belum Bayar</div>
                        <span className="text-xs bg-senja-200 text-senja-600 px-2 py-1 rounded-full font-medium">
                          {modalCounts.belum_bayar || 0}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleFilterClick('lunas')}
                      className={`p-3 text-left rounded-xl border-2 transition-all ${selectedFilter === 'lunas'
                        ? 'border-telaga-500 bg-telaga-50 text-telaga-800'
                        : 'border-telaga-100 bg-telaga-50/40 text-telaga-900 hover:border-telaga-300 hover:bg-telaga-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium font-montserrat">Lunas</div>
                        <span className="text-xs bg-telaga-200 text-telaga-600 px-2 py-1 rounded-full font-medium">
                          {modalCounts.lunas || 0}
                        </span>
                      </div>
                    </button>

                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Keluar"
        message="Yakin ingin keluar? Sebaiknya keluar setelah jam kerja selesai."
        confirmText="Keluar"
      />

      <ConfirmationModal
        isOpen={showSwitchRoleModal}
        onClose={() => setShowSwitchRoleModal(false)}
        onConfirm={handleSwitchRoleConfirm}
        title="Konfirmasi Ganti Peran"
        message="Yakin ingin berpindah ke halaman peran lain?"
        confirmText="Ganti Peran"
      />

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Item yang Perlu Dicek"
        items={[
          {
            title: "Status Pengeringan",
            description: "Item yang sudah selesai dicuci dan masih dalam proses pengeringan",
            bgColor: "bg-senja-50",
            dotColor: "bg-senja-500",
            titleColor: "text-senja-700"
          },
          {
            title: "Status Siap",
            description: "Item yang sudah siap diambil atau diantar",
            bgColor: "bg-telaga-50",
            dotColor: "bg-telaga-500",
            titleColor: "text-telaga-700"
          },
          {
            title: "Status Siap Diambil/Diantar",
            description: "Item yang sudah siap diambil atau diantar",
            bgColor: "bg-telaga-50",
            dotColor: "bg-telaga-500",
            titleColor: "text-telaga-700"
          }
        ]}
        footerInfo={{
          text: "Antrian ini menampilkan item dari status pengeringan ke siap dan bisa dijadwalkan pengantaran (siap_dikirim) atau (siap_diambil)"
        }}
      />

      {/* Modal yang dibuka dari FABMenu */}
      <OpenShiftModal open={showFabModal} onClose={() => setShowFabModal(false)} />

      {/* Shift Validation Modal */}
      <ConfirmationModal
        isOpen={showShiftValidationModal}
        onClose={() => setShowShiftValidationModal(false)}
        onConfirm={() => {
          setShowShiftValidationModal(false);
          setShowFabModal(true);
        }}
        title="Shift Belum Dibuka"
        message="Shift adalah pencatatan kas & transaksi selama jam kerja Anda.

Buka shift dulu sebelum menambah pesanan agar semua pembayaran tercatat dengan benar dalam laporan shift Anda.

Buka shift sekarang?"
        confirmText="Buka Shift"
        cancelText="Nanti Saja"
      />

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="pt-6 px-6 border-b border-telaga-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-telaga-950 font-montserrat">Cari Pesanan</h3>
                <button
                  onClick={handleSearchModalClose}
                  className="p-2 hover:bg-telaga-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-telaga-900/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div>
                {/* Search Input */}
                <div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Masukkan nama pelanggan atau nomor HP"
                    className="w-full px-4 py-3 border border-telaga-200 rounded-xl focus:ring-2 focus:ring-telaga-500 focus:border-telaga-500 font-montserrat text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSearchModalClose}
                  className="flex-1 px-4 py-3 text-telaga-900 bg-telaga-100 hover:bg-telaga-200 rounded-xl font-montserrat font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSearchSubmit}
                  disabled={!searchQuery.trim()}
                  className="flex-1 px-4 py-3 bg-telaga-600 text-white hover:bg-telaga-700 disabled:bg-telaga-300 disabled:cursor-not-allowed rounded-xl font-montserrat font-medium transition-colors"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order List Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
            {/* Header - Fixed */}
            <div className="px-6 py-4 border-b-2 border-telaga-100 flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-telaga-950 font-montserrat">Daftar Pesanan</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-telaga-900/60 font-montserrat">Filter:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium font-montserrat ${selectedFilter === 'penjemputan' ? 'bg-senja-100 text-senja-800' :
                      selectedFilter === 'antrian' ? 'bg-telaga-100 text-telaga-800' :
                        selectedFilter === 'progress' ? 'bg-senja-100 text-senja-800' :
                          selectedFilter === 'pengeringan' ? 'bg-senja-100 text-senja-800' :
                            selectedFilter === 'siap_diambil' ? 'bg-telaga-100 text-telaga-800' :
                              selectedFilter === 'siap_dikirim' ? 'bg-telaga-100 text-telaga-800' :
                                selectedFilter === 'done' ? 'bg-telaga-100 text-telaga-950' :
                                  selectedFilter === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    selectedFilter === 'not_ready' ? 'bg-red-100 text-red-800' :
                                      selectedFilter === 'belum_bayar' ? 'bg-senja-100 text-senja-800' :
                                        selectedFilter === 'dp_dibayar' ? 'bg-telaga-100 text-telaga-800' :
                                          selectedFilter === 'lunas' ? 'bg-telaga-100 text-telaga-800' :
                                            selectedFilter === 'siap_belum_lunas' ? 'bg-senja-100 text-senja-800' :
                                              selectedFilter === 'penjemputan' ? 'bg-senja-100 text-senja-800' :
                                                selectedFilter === 'pengantaran' ? 'bg-telaga-100 text-telaga-800' :
                                                  'bg-telaga-100 text-telaga-950'
                      }`}>
                      {selectedFilter === 'penjemputan' ? 'Menunggu Penjemputan' :
                        selectedFilter === 'antrian' ? 'Antrian' :
                          selectedFilter === 'progress' ? 'Proses' :
                            selectedFilter === 'pengeringan' ? 'Sedang Dikeringkan' :
                              selectedFilter === 'siap_diambil' ? 'Siap Disajikan' :
                                selectedFilter === 'siap_dikirim' ? 'Siap Dikirim' :
                                  selectedFilter === 'done' ? 'Selesai' :
                                    selectedFilter === 'cancelled' ? 'Dibatalkan' :
                                      selectedFilter === 'not_ready' ? 'Tidak Lolos QC' :
                                        selectedFilter === 'belum_bayar' ? 'Belum Bayar' :
                                          selectedFilter === 'dp_dibayar' ? 'DP Dibayar' :
                                            selectedFilter === 'lunas' ? 'Lunas' :
                                              selectedFilter === 'siap_belum_lunas' ? 'Siap & Belum Lunas' :
                                                selectedFilter === 'penjemputan' ? 'Penjemputan' :
                                                  selectedFilter === 'pengantaran' ? 'Pengantaran' :
                                                    'Semua Order'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const userData = await getUserData();
                        const startDate = formatDateForDB(dateRange.startDate);
                        const endDate = formatDateForDB(dateRange.endDate);
                        await fetchOrders(startDate, endDate, userData, selectedFilter);
                      } catch (error) {
                        console.error('❌ BerandaKasir - Error refreshing orders:', error);
                      }
                    }}
                    className="p-1.5 text-telaga-900/60 hover:text-telaga-900 hover:bg-telaga-100 rounded-lg transition-colors"
                    title="Refresh Data"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-1.5 hover:bg-telaga-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-telaga-900/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 rounded-b-2xl" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              {adminOrders.length > 0 ? (
                <div className="space-y-3">
                  {adminOrders.map((order) => {
                    const treatmentsWithItems = groupTreatmentsWithItems(order.order_details || []);
                    const totalItems = order.order_details?.length || 0;
                    const payment = order.payment || {};
                    const isPaidFully = Number(payment.paid_amount || 0) >= Number(payment.final_price || 0);
                    const isPaymentView = isPaymentFilter(selectedFilter);

                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setShowOrderModal(false);
                          navigate(`/order-detail/${order.id}`, { state: { from: '/berandakasir' } });
                        }}
                        className="bg-white rounded-2xl border border-telaga-100 shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden"
                      >
                        {/* Droppoint Badge */}
                        {order.branch?.branch_type === 'mitra' && order.branch?.name && (
                          <div className="px-4 pt-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-senja-600 border border-senja-200 rounded-full bg-senja-50">
                              📍 {order.branch.name}
                            </span>
                          </div>
                        )}

                        {/* Header: Nama + Status + Meta */}
                        <div className="px-4 pt-3 pb-2">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-semibold text-sm text-telaga-950 font-montserrat truncate flex-1">
                              {order.customer?.name || 'Unknown'}
                            </span>
                            {order.is_notified && (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-telaga-100 text-telaga-700 text-[10px] font-semibold font-montserrat">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Sudah Dihubungi
                                  {order.notified_at && (
                                    <span className="text-telaga-500 font-normal ml-1">
                                      · {new Date(order.notified_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {!isPaymentView && (
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold font-montserrat ${getStatusColor(order.order_details?.[0]?.status || 'unknown')}`}>
                                {getStatusLabel(order.order_details?.[0]?.status || 'unknown')}
                              </span>
                            )}
                          </div>

                          {/* ID + Date chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-telaga-400 font-montserrat">#{order.id}</span>
                            {order.entry_date && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-telaga-50/40 border border-telaga-100 rounded-full">
                                <span className="text-[9px] text-telaga-400 font-montserrat">Masuk</span>
                                <span className="text-[10px] text-telaga-900 font-montserrat font-bold">
                                  {dayjs(order.entry_date).format('D MMM YYYY')}
                                </span>
                              </span>
                            )}
                            {order.order_details?.[0]?.due_date && (
                              <>
                                <span className="text-telaga-300 text-[10px]">→</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${dayjs(order.order_details[0].due_date).isBefore(dayjs(), 'day')
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-telaga-50 border-telaga-200'
                                  }`}>
                                  <span className="text-[9px] text-telaga-400 font-montserrat">Selesai</span>
                                  <span className={`text-[10px] font-montserrat font-bold ${dayjs(order.order_details[0].due_date).isBefore(dayjs(), 'day')
                                      ? 'text-red-500' : 'text-telaga-600'
                                    }`}>
                                    {dayjs(order.order_details[0].due_date).format('D MMM YYYY')}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-4 border-t border-telaga-100" />

                        {/* Content */}
                        <div className="px-4 py-2.5">
                          {isPaymentView ? (
                            /* Payment View */
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-telaga-900/60 font-montserrat">Total</span>
                                <span className="text-sm font-bold text-telaga-950 font-montserrat">{formatCurrency(payment.final_price || 0)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-telaga-900/60 font-montserrat">Terbayar</span>
                                <span className="text-xs font-semibold text-telaga-600 font-montserrat">{formatCurrency(payment.paid_amount || 0)}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-telaga-100">
                                <span className="text-xs text-telaga-900/60 font-montserrat">Sisa</span>
                                <span className={`text-sm font-bold font-montserrat ${Number(payment.remaining_amount || 0) > 0 ? 'text-red-500' : 'text-telaga-600'}`}>
                                  {formatCurrency(payment.remaining_amount || 0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-telaga-400 font-montserrat">{totalItems} item</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-montserrat ${isPaidFully ? 'bg-telaga-100 text-telaga-700' : 'bg-senja-100 text-senja-700'}`}>
                                  {isPaidFully ? '✓ Lunas' : '⚠ Belum Lunas'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Order Status View */
                            <div className="space-y-1.5">
                              {treatmentsWithItems.map((treatment, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="flex-shrink-0 px-2 py-0.5 bg-telaga-50 text-telaga-700 text-[10px] font-semibold font-montserrat rounded-full border border-telaga-100">
                                    {treatment.name} ×{treatment.count}
                                  </span>
                                  {treatment.items.length > 0 && (
                                    <span className="text-[10px] text-telaga-900/60 font-montserrat pt-0.5 truncate">
                                      {treatment.items.map(i => `${i.name}${i.brand ? ` (${i.brand})` : ''}`).join(', ')}
                                    </span>
                                  )}
                                </div>
                              ))}
                              <div className="text-[10px] text-telaga-400 font-montserrat pt-1">
                                {totalItems} item total
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Photo Strip */}
                        {(() => {
                          const allPhotos = (order.order_details || [])
                            .flatMap(d => Array.isArray(d.shoes_photos) ? d.shoes_photos : [])
                            .filter(p => p?.url_photo)
                            .map(p => ({ ...p, url_photo: getPhotoUrl(p.url_photo) }));
                          if (allPhotos.length === 0) return null;
                          return (
                            <div
                              className="px-4 pb-3 flex items-center gap-1.5 flex-wrap border-t border-telaga-100 pt-2.5 mt-1"
                              onClick={e => e.stopPropagation()}
                            >
                              {allPhotos.slice(0, 4).map((photo, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setGalleryPhotos(allPhotos);
                                    setGalleryInitialIndex(pIdx);
                                    setShowGallery(true);
                                  }}
                                  className="w-11 h-11 rounded-lg overflow-hidden border border-telaga-100 hover:border-telaga-300 hover:scale-105 transition-all flex-shrink-0"
                                >
                                  <img src={photo.url_photo} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                              {allPhotos.length > 4 && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setGalleryPhotos(allPhotos);
                                    setGalleryInitialIndex(4);
                                    setShowGallery(true);
                                  }}
                                  className="w-11 h-11 rounded-lg bg-telaga-100 border border-telaga-100 flex items-center justify-center text-[10px] font-bold text-telaga-900/60 hover:bg-telaga-200 transition-all flex-shrink-0"
                                >
                                  +{allPhotos.length - 4}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* WA Button */}
                        {selectedFilter === 'siap_diambil' && order.customer?.phone && (
                          <div className="px-4 pb-3 mt-1 space-y-2">
                            {selectedFilter === 'siap_diambil' && !order.is_notified && (
                              <button
                                onClick={e => { e.stopPropagation(); handleMarkNotified(order.id); }}
                                className="w-full py-1.5 border border-telaga-300 text-telaga-600 rounded-xl text-xs font-semibold font-montserrat hover:bg-telaga-50 transition-all flex items-center justify-center gap-2"
                              >
                                ✓ Tandai Sudah Dihubungi
                              </button>
                            )}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenMessageModal(order);
                              }}
                              className={`w-full py-2 rounded-xl transition-all flex items-center justify-center gap-2 font-montserrat text-xs font-semibold ${order.is_notified
                                  ? "bg-telaga-50 text-telaga-600 border border-telaga-200 hover:bg-telaga-100"
                                  : "bg-telaga-500 text-white hover:bg-telaga-600"
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                              </svg>
                              Kirim Pesan
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-telaga-400 mb-2">
                    <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-telaga-900/60 font-montserrat">Tidak ada order ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Pro Feature Modal */}
      {showProFeatureModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-telaga-950/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-telaga-500 to-telaga-600 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-telaga-950 font-montserrat">
                    Fitur {proFeatureName}
                  </h3>
                  <p className="text-sm text-telaga-900/60 font-montserrat">
                    Hanya untuk paket berbayar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProFeatureModal(false)}
                className="p-2 rounded-full bg-telaga-100 hover:bg-telaga-200 text-telaga-900/70 transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="bg-senja-50 border border-senja-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-senja-800 font-montserrat font-medium mb-2">
                  Fitur ini memungkinkan Anda untuk:
                </p>
                <ul className="space-y-2 text-sm text-senja-700 font-montserrat">
                  {proFeatureName === 'Calendar' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Melihat kalender item jatuh tempo dan pembayaran jatuh tempo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengidentifikasi item yang sudah selesai atau belum</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengidentifikasi pembayaran yang sudah lunas atau belum</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Melihat detail pesanan per tanggal dengan mudah</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengelola deadline dengan lebih efisien</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <p className="text-sm text-telaga-900/70 font-montserrat text-center">
                Upgrade ke paket berbayar untuk mengakses fitur ini dan fitur premium lainnya.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <AnimatedButton
                variant="default"
                onClick={() => setShowProFeatureModal(false)}
                className="flex-1 px-4 py-2 text-sm font-montserrat border-2 border-telaga-200 text-telaga-900 hover:bg-telaga-50 rounded-xl"
              >
                Tutup
              </AnimatedButton>
              <AnimatedButton
                variant="telaga"
                onClick={() => {
                  setShowProFeatureModal(false);
                  navigate('/billing-active-tenant-payment');
                }}
                className="flex-1 px-4 py-2 text-sm font-montserrat"
              >
                Lihat Paket
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Explanation Modal */}
      <CalendarExplanationModal
        isOpen={showCalendarExplanationModal}
        onClose={() => setShowCalendarExplanationModal(false)}
      />

      <PhotoGalleryModal
        isOpen={showGallery}
        onClose={() => {
          setShowGallery(false);
          setGalleryPhotos([]);
        }}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />

      {showOperationPanel && (
        <OperationPanelModal 
          isOpen={showOperationPanel}
          initialStatus={operationPanelStatus}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onClose={async () => {
            setShowOperationPanel(false);
            const startDate = formatDateForDB(dateRange.startDate);
            const endDate = formatDateForDB(dateRange.endDate);
            const userData = await getUserData();
            await Promise.all([
              fetchCounts(startDate, endDate, userData),
              fetchModalCounts(startDate, endDate, userData),
            ]);
          }}
          onOpenMessageModal={handleOpenMessageModal}
          onMarkNotified={handleMarkNotified}
          onRefreshCounts={async () => {
            const startDate = formatDateForDB(dateRange.startDate);
            const endDate = formatDateForDB(dateRange.endDate);
            const userData = await getUserData();
            await Promise.all([
              fetchCounts(startDate, endDate, userData),
              fetchModalCounts(startDate, endDate, userData),
            ]);
          }}
        />
      )}

      {/* Message Modal — di-render setelah OperationPanelModal agar z-index lebih tinggi */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-telaga-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-telaga-950 font-montserrat">Kirim Pesan WhatsApp</h3>
                <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-telaga-100 rounded-lg">
                  <svg className="w-5 h-5 text-telaga-900/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-sm text-telaga-900/70 font-montserrat">
                📱 {selectedOrderForMessage?.customer?.phone || '-'}
              </div>
            </div>

            <div className="p-6">
              {loadingMessageTemplate ? (
                <div className="w-full min-h-[200px] border border-telaga-100 rounded-xl bg-telaga-50/40 p-4 flex flex-col gap-3 animate-pulse">
                  <div className="h-3 bg-telaga-200 rounded w-3/4" />
                  <div className="h-3 bg-telaga-200 rounded w-full" />
                  <div className="h-3 bg-telaga-200 rounded w-5/6" />
                  <div className="h-3 bg-telaga-200 rounded w-2/3" />
                  <div className="h-3 bg-telaga-200 rounded w-full" />
                  <div className="h-3 bg-telaga-200 rounded w-4/5" />
                </div>
              ) : (
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-telaga-200 rounded-xl focus:ring-2 focus:ring-telaga-500 focus:border-telaga-500 font-montserrat text-sm resize-none min-h-[200px]"
                />
              )}

              {/* Custom Template Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowItemDoneTemplateModal(true);
                }}
                className="mt-3 w-full px-4 py-2.5 bg-telaga-50/40 hover:bg-telaga-100 border border-telaga-100 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm text-telaga-900 font-montserrat"
              >
                <svg className="w-4 h-4 text-telaga-900/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Sesuaikan Template
              </button>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCopyMessage}
                  className="flex-1 px-4 py-3 bg-telaga-100 hover:bg-telaga-200 text-telaga-900 rounded-xl font-montserrat font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Salin
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenWhatsApp}
                  className="flex-1 px-4 py-3 bg-telaga-500 hover:bg-telaga-600 text-white rounded-xl font-montserrat font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Buka WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Done Template Modal — di-render paling akhir agar di atas semua modal */}
      <ItemDoneTemplateModal
        show={showItemDoneTemplateModal}
        onClose={() => setShowItemDoneTemplateModal(false)}
        order={selectedOrderForMessage}
        onTemplateUpdated={async () => {
          if (selectedOrderForMessage) {
            const template = await generateMessageTemplate(selectedOrderForMessage);
            setMessageText(template);
            setShowItemDoneTemplateModal(false);
          }
        }}
      />
    </div>
  );
};

export default BerandaKasir;
