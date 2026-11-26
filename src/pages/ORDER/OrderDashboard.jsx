import React, { useState, useEffect, useRef } from "react";
import {useNavigate, useLocation} from 'react-router-dom';
import {Plus, Search, Filter, Clock, CheckCircle, AlertCircle, DollarSign, ChevronRight, ChevronLeft, X, ArrowLeft, RefreshCw, Receipt, Ticket, Users, TrendingUp, BarChart3, Wallet, QrCode, Banknote, CreditCard, Award} from 'lucide-react';
import QuickOrderPrintReceipt from "../../components/QuickInput/QuickOrderPrintReceipt";
import OrderSearchFilterBar from "./components/OrderSearchFilterBar";
import OrderList from "./components/OrderList";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import dayjs from "dayjs"; // pastikan sudah install: npm i dayjs
import { useOrderDashboardData } from "./hooks/useOrderDashboardData";
import { transformOrderListNew } from "./utils/orderTransformNew";
import {useShift} from '../../contexts/ShiftContext';
import {useCurrentUserRole} from '../../utils/roleValidator';
import { saveFilterToStorage, getFilterFromStorage, clearFilterFromStorage, FILTER_TYPES, COMPONENT_NAMES } from "../../utils/filterStorage";
import PaymentDetailModal from '../../components/Modal/PaymentDetailModal';
import ServiceDetailModal from '../../components/Modal/ServiceDetailModal';
import {getPaymentStatusOrders, getServiceStatusOrders, buildQueryParams} from './api/orderModalApi';
import AnimatedButton from "../../components/Design/AnimatedButton";
import ConfirmationModal from "../../components/Modal/ConfirmationModal";
import OpenShiftModal from '../BERANDA/SHIFT/OpenShiftModal';
import instance from '../../config/api';

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

// Status layanan yang relevan untuk Telaga (istilah laundry dibuang)
const SERVICE_STATUS_META = {
  not_yet: { label: "Menunggu", tone: "bg-amber-50 text-amber-700 border-amber-100" },
  antrian: { label: "Antrian", tone: "bg-senja-50 text-senja-700 border-senja-100" },
  on_progress: { label: "Dilayani", tone: "bg-blue-50 text-blue-700 border-blue-100" },
  siap: { label: "Siap", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  siap_diambil: { label: "Siap", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  siap_dikirim: { label: "Siap", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  done: { label: "Selesai", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  selesai: { label: "Selesai", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  cancelled: { label: "Dibatalkan", tone: "bg-rose-50 text-rose-700 border-rose-100" },
};

const PAYMENT_STATUS_META = {
  paid: { label: "Lunas", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  dp: { label: "Bayar Sebagian", tone: "bg-senja-50 text-senja-700 border-senja-100" },
  unpaid: { label: "Belum Bayar", tone: "bg-rose-50 text-rose-700 border-rose-100" },
};

// Telaga: tiket langsung berstatus selesai, panel ini tidak informatif
const SHOW_SERVICE_STATUS = false;

const PAYMENT_METHOD_META = {
  qris: { label: "QRIS", tone: "bg-telaga-50 text-telaga-700 border-telaga-100" },
  cash: { label: "Tunai", tone: "bg-senja-50 text-senja-700 border-senja-100" },
  tunai: { label: "Tunai", tone: "bg-senja-50 text-senja-700 border-senja-100" },
  transfer: { label: "Transfer", tone: "bg-blue-50 text-blue-700 border-blue-100" },
  bank_transfer: { label: "Transfer", tone: "bg-blue-50 text-blue-700 border-blue-100" },
  debit: { label: "Kartu", tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  credit_card: { label: "Kartu", tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
};

const OrderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Logic untuk menyimpan dan memulihkan filter terakhir
  const FILTER_STORAGE_KEY = 'orderDashboard_lastFilter'; // Keep for migration
  const isInitialized = useRef(false);
  const isFilterRestored = useRef(false);
  const [filterReady, setFilterReady] = useState(false);

  // State untuk filter yang aktif (yang digunakan untuk API call)
  const [searchTerm, setSearchTerm] = useState("");

  const todayStr = dayjs().format("YYYY-MM-DD");
  const [activeStartDate, setActiveStartDate] = useState(todayStr); // ✅ FIX: Default hari ini (bukan kemarin)
  const [activeEndDate, setActiveEndDate] = useState(todayStr); // ✅ FIX: Default hari ini
  const [activeDateFilterType, setActiveDateFilterType] = useState("entry_date");
  const [orderDetailStatus, setOrderDetailStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');

  // State untuk Payment Detail Modal
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [filteredOrdersByStatus, setFilteredOrdersByStatus] = useState([]);

  // State untuk Service Detail Modal
  const [showServiceDetailModal, setShowServiceDetailModal] = useState(false);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState('');
  const [filteredOrdersByServiceStatus, setFilteredOrdersByServiceStatus] = useState([]);

  // State untuk Modal API
  const [modalOrders, setModalOrders] = useState([]);
  const [modalPagination, setModalPagination] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Migration function untuk data filter lama
  const migrateOldFilterData = () => {
    try {
      const oldFilterData = localStorage.getItem(FILTER_STORAGE_KEY);

      if (oldFilterData) {
        const parsedData = JSON.parse(oldFilterData);

        // Cek apakah data masih valid (tidak lebih dari 24 jam)
        const isExpired = Date.now() - parsedData.timestamp > 24 * 60 * 60 * 1000;

        if (!isExpired) {
          // Migrate ke new encrypted format
          const todayDefault = dayjs().format("YYYY-MM-DD");
          const newFilterData = {
            searchTerm: parsedData.searchTerm || '',
            activeStartDate: parsedData.activeStartDate || todayDefault, // ✅ FIX: Default hari ini (bukan kemarin)
            activeEndDate: parsedData.activeEndDate || todayDefault, // ✅ FIX: Default hari ini
            activeDateFilterType: parsedData.activeDateFilterType || 'entry_date',
            orderDetailStatus: parsedData.orderDetailStatus || 'all',
            paymentStatus: parsedData.paymentStatus || 'all'
          };

          // Save ke new encrypted storage
          saveFilterToStorage(COMPONENT_NAMES.ORDER_DASHBOARD, FILTER_TYPES.COMPLEX_FILTER, newFilterData, 24);
        } else {
        }

        // Hapus data lama
        localStorage.removeItem(FILTER_STORAGE_KEY);
      } else {
        // Hapus data lama
        localStorage.removeItem(FILTER_STORAGE_KEY);
      }
    } catch (error) {
      localStorage.removeItem(FILTER_STORAGE_KEY);
    }
  };

  // Fungsi untuk menyimpan filter ke localStorage (NEW ENCRYPTED VERSION)
  const saveFilterToStorageNew = () => {
    const filterData = {
      searchTerm,
      activeStartDate,
      activeEndDate,
      activeDateFilterType,
      orderDetailStatus,
      paymentStatus
    };
    saveFilterToStorage(COMPONENT_NAMES.ORDER_DASHBOARD, FILTER_TYPES.COMPLEX_FILTER, filterData, 24);
  };

  // Fungsi untuk memulihkan filter dari localStorage (NEW ENCRYPTED VERSION)
  const loadFilterFromStorageNew = () => {
    try {
      // First, try to migrate old data
      migrateOldFilterData();

      // Then load from new encrypted storage
      const filterData = getFilterFromStorage(COMPONENT_NAMES.ORDER_DASHBOARD, FILTER_TYPES.COMPLEX_FILTER);

      if (filterData) {
        // Set active filter values
        setSearchTerm(filterData.searchTerm || '');
        setActiveStartDate(filterData.activeStartDate || todayStr);
        setActiveEndDate(filterData.activeEndDate || todayStr);
        setActiveDateFilterType(filterData.activeDateFilterType || 'entry_date');
        setOrderDetailStatus(filterData.orderDetailStatus || 'all');
        setPaymentStatus(filterData.paymentStatus || 'all');
      }

      // Set flag bahwa filter sudah di-restore (baik ada data atau tidak)
      isFilterRestored.current = true;
      setFilterReady(true); // Trigger re-render
    } catch (error) {
      isFilterRestored.current = true; // Set flag meskipun error
      setFilterReady(true); // Trigger re-render meskipun error
    }
  };

  // Load filter saat component mount
  useEffect(() => {
    if (!isInitialized.current) {

      loadFilterFromStorageNew();
      isInitialized.current = true;
    }
  }, []);

  // Check if explanation modal should be shown

  // Save filter setiap kali ada perubahan pada active filter
  useEffect(() => {
    if (isInitialized.current) {
      saveFilterToStorageNew();
    }
  }, [searchTerm, activeStartDate, activeEndDate, activeDateFilterType, orderDetailStatus, paymentStatus]);

  // State untuk trigger reset
  const [resetTrigger, setResetTrigger] = useState(0);

  // Removed searchTimeout - no more debounce needed

  // State untuk expandable statistics
  const [showQuickStats, setShowQuickStats] = useState(false);

  // Get current user role for conditional rendering
  const { userRole: currentUserRole } = useCurrentUserRole();
  const isSuperAdmin = currentUserRole === 'superadmin';

  // Note: Revenue Summary is only visible to superadmin
  // Other statistics (transactions, payment status, service status) are visible to all roles

  // Function untuk menentukan route kembali berdasarkan dari mana user datang
  const getBackRoute = () => {
    // Cek dari state navigation (jika ada)
    if (location.state?.from) {
      return location.state.from;
    }

    // Cek dari referrer atau default berdasarkan role
    const referrer = document.referrer;

    if (referrer.includes('/berandaowner')) {
      return '/berandaowner';
    } else if (referrer.includes('/berandakasir')) {
      return '/berandakasir';
    }

    // Default berdasarkan role user
    if (isSuperAdmin) {
      return '/berandaowner';
    } else {
      return '/berandakasir';
    }
  };

  // Function untuk reset filter
  const handleResetFilter = () => {
    const defaultDate = dayjs().format("YYYY-MM-DD");

    // Reset active filter (untuk API call)
    setSearchTerm("");
    setActiveStartDate(defaultDate);
    setActiveEndDate(defaultDate);
    setActiveDateFilterType("entry_date");
    setOrderDetailStatus('all');
    setPaymentStatus('all');

    // Hapus filter dari encrypted storage
    clearFilterFromStorage(COMPONENT_NAMES.ORDER_DASHBOARD, FILTER_TYPES.COMPLEX_FILTER);

    // Trigger reset untuk OrderSearchFilterBar
    setResetTrigger(prev => prev + 1);
  };

  // Function untuk handle payment detail modal
  const handleShowPaymentDetail = async (status) => {
    setSelectedPaymentStatus(status);
    setModalLoading(true);
    setModalError(null);

    try {
      const filterState = {
        startDate: activeStartDate,
        endDate: activeEndDate,
        searchTerm: searchTerm
      };

      const queryParams = buildQueryParams(filterState, 1, 50);
      const response = await getPaymentStatusOrders(status, queryParams);

      if (response.success) {
        setModalOrders(response.data.orders || []);
        setModalPagination(response.data.pagination || null);
        setShowPaymentDetailModal(true);
      } else {
        setModalError('Gagal memuat data payment status');
      }
    } catch (error) {
      console.error('Error fetching payment status orders:', error);
      setModalError('Gagal memuat data payment status');
    } finally {
      setModalLoading(false);
    }
  };

  // Function untuk handle order click dari modal
  const handleOrderClick = (orderId) => {
    setShowPaymentDetailModal(false);
    navigate(`/order-detail/${orderId}`, { state: { from: '/orders' } });
  };

  // Function untuk handle service detail modal
  const handleShowServiceDetail = async (status) => {
    setSelectedServiceStatus(status);
    setModalLoading(true);
    setModalError(null);

    try {
      const filterState = {
        startDate: activeStartDate,
        endDate: activeEndDate,
        searchTerm: searchTerm
      };

      const queryParams = buildQueryParams(filterState, 1, 50);
      const response = await getServiceStatusOrders(status, queryParams);

      if (response.success) {
        setModalOrders(response.data.orders || []);
        setModalPagination(response.data.pagination || null);
        setShowServiceDetailModal(true);
      } else {
        setModalError('Gagal memuat data service status');
      }
    } catch (error) {
      console.error('Error fetching service status orders:', error);
      setModalError('Gagal memuat data service status');
    } finally {
      setModalLoading(false);
    }
  };

  // Function untuk handle order click dari service modal
  const handleServiceOrderClick = (orderId) => {
    setShowServiceDetailModal(false);
    navigate(`/order-detail/${orderId}`, { state: { from: '/orders' } });
  };

  // Function untuk handle modal load more
  const handleModalLoadMore = async () => {
    if (!modalPagination || !modalPagination?.hasNextPage || modalLoading) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const filterState = {
        startDate: activeStartDate,
        endDate: activeEndDate,
        searchTerm: searchTerm
      };

      const nextPage = (modalPagination?.currentPage || 0) + 1;
      const queryParams = buildQueryParams(filterState, nextPage, modalPagination?.pageSize || 50);

      let response;
      if (showPaymentDetailModal) {
        response = await getPaymentStatusOrders(selectedPaymentStatus, queryParams);
      } else if (showServiceDetailModal) {
        response = await getServiceStatusOrders(selectedServiceStatus, queryParams);
      }

      if (response && response.success) {
        // Append new orders to existing ones
        setModalOrders(prevOrders => [...prevOrders, ...(response.data.orders || [])]);
        setModalPagination(response.data.pagination || null);
      } else {
        setModalError('Gagal memuat data tambahan');
      }
    } catch (error) {
      console.error('Error loading more orders for modal:', error);
      setModalError('Gagal memuat data tambahan');
    } finally {
      setModalLoading(false);
    }
  };

  // Pakai custom hook untuk fetch data dengan state provider
  const {
    orders,
    statistics,
    loading,
    error,
    addOrder,
    hasMore,
    isLoadingMore,
    loadMore,
    totalItems,
    totalPages,
    currentPage,
    refreshOrders
  } = useOrderDashboardData({
    page: 1,
    pageSize: 10, // Set ke 10 untuk infinite scroll
    search: searchTerm,
    startDate: activeStartDate,
    endDate: activeEndDate,
    dateFilterType: activeDateFilterType,
    status: orderDetailStatus,
    paymentStatus: paymentStatus,
    // Tambahkan flag untuk menunda fetch sampai filter ter-restore
    shouldFetch: filterReady
  });

  // Fix Bug 1 - Race Condition & Navigation back from quick-order
  // Dipindahkan ke sini agar refreshOrders sudah terdefinisi
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Berikan delay kecil untuk memastikan backend sudah selesai persist
        setTimeout(() => {
          refreshOrders();
        }, 300);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshOrders]);

  const { shift, fetchProfileAndShift } = useShift();

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrderData, setPrintOrderData] = useState(null);
  const [showShiftValidationModal, setShowShiftValidationModal] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);

  // Removed searchTimeout cleanup - no more debounce needed

  // Auto-collapse statistics saat scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showQuickStats) {
        setShowQuickStats(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showQuickStats]);

  // ===== Ringkasan terhitung (Telaga) =====
  const stats = statistics || {};
  const statsPayment = stats.payment_details || {};
  const revenue = Number(stats.sum_revenue || 0);
  // Fallback: backend lama belum punya total_paid/total_outstanding
  const moneyIn =
    statsPayment.total_paid != null
      ? Number(statsPayment.total_paid)
      : Number(statsPayment.total_order_paid || 0) + Number(statsPayment.total_dp_paid || 0);
  const moneyOutstanding =
    statsPayment.total_outstanding != null
      ? Number(statsPayment.total_outstanding)
      : Number(statsPayment.total_order_unpaid || 0) + Number(statsPayment.total_dp_remaining || 0);
  const moneyInPercent = revenue > 0 ? Math.min(100, Math.round((moneyIn / revenue) * 100)) : 0;
  const percentOfRevenue = (value) =>
    revenue > 0 ? Math.round((Number(value || 0) / revenue) * 100) : 0;
  const visibleServiceStatus = Object.entries(stats.service_status || {}).filter(
    ([status, count]) => count > 0 && SERVICE_STATUS_META[status]
  );
  // Telaga tidak memakai pembayaran DP → "Bayar Sebagian" disembunyikan
  const visiblePaymentStatus = Object.entries(stats.payment_status || {}).filter(
    ([status]) => status !== "dp"
  );
  const topServices = (stats.service_breakdown || []).slice(0, 5);
  const maxServiceQty = topServices.reduce((max, item) => Math.max(max, item.qty), 0);

  return (
    <div className="min-h-screen bg-krem relative">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-telaga-700 via-telaga-600 to-senja-500 rounded-b-[28px] shadow-lg shadow-telaga-900/10">
        {/* Ornamen dekoratif */}
        <div className="pointer-events-none absolute -right-12 -top-16 w-44 h-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-4 top-20 w-24 h-24 rounded-full bg-senja-300/20" />

        <div className="relative flex items-start justify-between gap-3 px-4 pt-4 pb-5">
          {/* Left Side: Back Button + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(getBackRoute())}
              className="w-10 h-10 flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/25 text-white rounded-xl backdrop-blur-sm transition-all duration-200 active:scale-95"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold font-montserrat text-white tracking-wide leading-tight truncate">
                Pesanan
              </h1>
            </div>
          </div>
          {/* Right Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick Order Button */}
            <button
              onClick={async () => {
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

                const { shift: latestShift } = await fetchProfileAndShift();
                if (!latestShift || !latestShift.id || latestShift.end_time) {
                  setShowShiftValidationModal(true);
                } else {
                  navigate('/quick-order');
                }
              }}
              className="flex items-center gap-1.5 h-10 px-3.5 bg-white text-telaga-700 rounded-xl shadow-md shadow-telaga-900/20 hover:bg-telaga-50 transition-all duration-200 active:scale-95 font-montserrat text-xs font-bold"
              aria-label="Quick Order"
              title="Quick Order"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Redesigned Search & Filter Bar - Inline & Always Visible */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 mx-2 mt-2 rounded-xl shadow-lg p-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <OrderSearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={activeStartDate}
          setStartDate={setActiveStartDate}
          endDate={activeEndDate}
          setEndDate={setActiveEndDate}
          dateFilterType={activeDateFilterType}
          setDateFilterType={setActiveDateFilterType}
          orderDetailStatus={orderDetailStatus}
          setOrderDetailStatus={setOrderDetailStatus}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          onReset={resetTrigger}
          onResetFilter={handleResetFilter}
          showQuickStats={showQuickStats}
          setShowQuickStats={setShowQuickStats}
          refreshOrders={refreshOrders}
          loading={loading}
        />
      </div>

      {/* Statistics Section */}
      {loading && (
        <div className="mx-2 mt-2 sm:mx-3">
          <div className="rounded-2xl border border-telaga-100 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 w-40 animate-pulse rounded-full bg-telaga-100" />
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-telaga-200 border-t-telaga-600" />
            </div>
          </div>
        </div>
      )}

      {statistics && !loading && showQuickStats && (
        <div className="mx-2 mt-2 space-y-2.5 sm:mx-3">
          {/* ===== Hero: Total Pendapatan (super admin) ===== */}
          {isSuperAdmin && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-telaga-700 via-telaga-600 to-senja-500 p-4 shadow-lg shadow-telaga-900/10">
              <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-14 -left-8 h-28 w-28 rounded-full bg-senja-300/20" />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-telaga-100">
                      <Wallet className="h-3.5 w-3.5" />
                      Total Pendapatan
                    </div>
                    <div className="mt-1 font-montserrat text-2xl font-bold text-white">
                      {formatRupiah(revenue)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/15 px-2.5 py-1.5 text-center backdrop-blur-sm">
                    <div className="font-montserrat text-sm font-bold leading-none text-white">
                      {stats.count_transaction || 0}
                    </div>
                    <div className="mt-0.5 text-[10px] text-telaga-100">transaksi</div>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${moneyInPercent}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-telaga-50">
                  <span>Uang masuk {formatRupiah(moneyIn)}</span>
                  <span className="font-semibold text-white">{moneyInPercent}%</span>
                </div>

                {moneyOutstanding > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-500/25 px-2 py-1 text-[11px] font-medium text-white">
                    <AlertCircle className="h-3 w-3" />
                    Belum tertagih {formatRupiah(moneyOutstanding)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== Metrik utama ===== */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-telaga-50 text-telaga-600">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="font-montserrat text-lg font-bold leading-none text-telaga-900">
                {stats.count_transaction || 0}
              </div>
              <div className="mt-1 text-[11px] text-telaga-500">Transaksi</div>
            </div>

            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-senja-50 text-senja-600">
                <Ticket className="h-4 w-4" />
              </div>
              <div className="font-montserrat text-lg font-bold leading-none text-telaga-900">
                {stats.count_services || 0}
              </div>
              <div className="mt-1 text-[11px] text-telaga-500">Tiket Terjual</div>
            </div>

            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div className="font-montserrat text-lg font-bold leading-none text-telaga-900">
                {stats.count_visitors || 0}
              </div>
              <div className="mt-1 text-[11px] text-telaga-500">Pengunjung</div>
            </div>

            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="font-montserrat text-lg font-bold leading-none text-telaga-900">
                {formatRupiah(stats.avg_transaction)}
              </div>
              <div className="mt-1 text-[11px] text-telaga-500">Rata-rata / Transaksi</div>
            </div>
          </div>

          {/* ===== Status Pembayaran ===== */}
          <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-montserrat text-xs font-semibold text-telaga-900">Status Pembayaran</h4>
              <span className="text-[11px] text-telaga-400">
                Menampilkan {orders.length} dari {totalItems} order
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {visiblePaymentStatus.map(([status, count]) => {
                const meta =
                  PAYMENT_STATUS_META[status] || {
                    label: status,
                    tone: "bg-gray-50 text-gray-700 border-gray-100",
                  };
                const amount =
                  status === "paid"
                    ? Number(statsPayment.total_order_paid || 0)
                    : Number(statsPayment.total_order_unpaid || 0);

                return (
                  <div key={status} className={`rounded-xl border p-2 text-center ${meta.tone}`}>
                    <div className="font-montserrat text-base font-bold leading-none">{count}</div>
                    <div className="mt-1 text-[11px] font-medium leading-tight">{meta.label}</div>
                    {amount > 0 && (
                      <div className="mt-1 text-[10px] opacity-80">{formatRupiah(amount)}</div>
                    )}
                    {count > 0 && (
                      <button
                        onClick={() => handleShowPaymentDetail(status)}
                        className="mt-1 text-[10px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                      >
                        detail
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ===== Metode Pembayaran ===== */}
            {Array.isArray(statsPayment.methods) && statsPayment.methods.length > 0 && (
              <div className="mt-3 border-t border-telaga-50 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="font-montserrat text-[11px] font-semibold uppercase tracking-wide text-telaga-500">
                    Metode Pembayaran
                  </h5>
                  <span className="text-[11px] text-telaga-400">
                    Total {formatRupiah(moneyIn)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {statsPayment.methods.map((method, index) => {
                    const meta =
                      PAYMENT_METHOD_META[(method.code || "").toLowerCase()] || {
                        label: method.name || method.code || "Lainnya",
                        tone: "bg-gray-50 text-gray-600 border-gray-100",
                      };
                    const MethodIcon =
                      (method.code || "").toLowerCase() === "qris"
                        ? QrCode
                        : ["cash", "tunai"].includes((method.code || "").toLowerCase())
                        ? Banknote
                        : CreditCard;
                    const methodPercent = moneyIn
                      ? Math.round((method.amount / moneyIn) * 100)
                      : 0;

                    return (
                      <div key={method.code || index} className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.tone}`}>
                          <MethodIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[11px] font-medium text-telaga-900">
                              {meta.label}
                            </span>
                            <span className="shrink-0 text-[11px] font-semibold text-telaga-700">
                              {formatRupiah(method.amount)}
                            </span>
                          </div>
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-telaga-50">
                            <div
                              className="h-full rounded-full bg-telaga-500"
                              style={{ width: `${methodPercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-10 shrink-0 text-right text-[10px] text-telaga-400">
                          {method.count}x · {methodPercent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== Layanan Terlaris ===== */}
          {topServices.length > 0 && (
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-senja-500" />
                <h4 className="font-montserrat text-xs font-semibold text-telaga-900">Layanan Terjual</h4>
              </div>
              <div className="space-y-1.5">
                {topServices.map((service, index) => {
                  const barPercent = maxServiceQty > 0 ? Math.round((service.qty / maxServiceQty) * 100) : 0;
                  return (
                    <div key={`${service.treatment_id}-${index}`} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-telaga-50 font-montserrat text-[10px] font-bold text-telaga-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[11px] font-medium text-telaga-900">
                            {service.name}
                          </span>
                          <span className="shrink-0 text-[11px] font-semibold text-telaga-700">
                            {formatRupiah(service.amount)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-telaga-50">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-telaga-500 to-senja-400"
                              style={{ width: `${barPercent}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] text-telaga-400">{service.qty} terjual</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== Status Layanan ===== */}
          {SHOW_SERVICE_STATUS && visibleServiceStatus.length > 0 && (
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-telaga-500" />
                <h4 className="font-montserrat text-xs font-semibold text-telaga-900">Status Layanan</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleServiceStatus.map(([status, count]) => {
                  const meta = SERVICE_STATUS_META[status];
                  return (
                    <div
                      key={status}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${meta.tone}`}
                    >
                      <span className="font-montserrat text-sm font-bold leading-none">{count}</span>
                      <span className="text-[11px] font-medium">{meta.label}</span>
                      <button
                        onClick={() => handleShowServiceDetail(status)}
                        className="text-[10px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                      >
                        detail
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading & Error State */}
      {loading && !isLoadingMore && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading orders...</div>
        </div>
      )}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Gagal memuat data order</div>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Coba lagi
          </button>
        </div>
      )}
      {/* Order List */}
      {!loading && !error && (
        <OrderList
          orders={orders}
          loading={loading}
          orderDetailStatusFilter={orderDetailStatus}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
      {showPrintModal && printOrderData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <QuickOrderPrintReceipt
            order={printOrderData}
            onClose={() => {
              setShowPrintModal(false);
              setPrintOrderData(null);
            }}
          />
        </div>
      )}

      {/* Payment Detail Modal */}
      {showPaymentDetailModal && (
        <PaymentDetailModal
          status={selectedPaymentStatus}
          orders={modalOrders}
          onClose={() => setShowPaymentDetailModal(false)}
          onOrderClick={handleOrderClick}
          onLoadMore={handleModalLoadMore}
          hasMore={modalPagination?.hasNextPage || false}
          isLoadingMore={modalLoading}
          totalCount={modalPagination?.totalItems || modalOrders?.length || 0}
          error={modalError}
        />
      )}

      {/* Service Detail Modal */}
      {showServiceDetailModal && (
        <ServiceDetailModal
          status={selectedServiceStatus}
          orders={modalOrders}
          onClose={() => setShowServiceDetailModal(false)}
          onOrderClick={handleServiceOrderClick}
          onLoadMore={handleModalLoadMore}
          hasMore={modalPagination?.hasNextPage || false}
          isLoadingMore={modalLoading}
          totalCount={modalPagination?.totalItems || modalOrders?.length || 0}
          error={modalError}
        />
      )}

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

      {/* Open Shift Modal */}
      <OpenShiftModal open={showFabModal} onClose={() => setShowFabModal(false)} />
    </div>
  );
};

export default OrderDashboard;