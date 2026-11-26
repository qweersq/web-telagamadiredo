import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import billingService from '../../services/billingService';
import axiosInstance from '../../config/api';
import { fetchBillingsByTab, fetchAllTabStats } from '../../services/billingTabService';
import DashboardStatsService from '../../services/dashboardStatsService';
import { formatCurrency } from '../../utils/labelFormatter';
import { 
  formatBillingStatus, 
  formatPaymentMethod, 
  formatDate, 
  formatDateShort, 
  formatInvoiceNumber,
  formatPhoneNumber,
  formatBusinessName,
  formatOwnerName,
  formatEmail,
  formatPercentage,
  formatCollectionRate,
  formatGrowthRate,
  getStatusColorClasses
} from '../../utils/billingFormatter';
import AnimatedButton from '../../components/Design/AnimatedButton';
import BillingDetailModal from './components/modals/BillingDetailModal';
import GenerateBillingModal from './components/modals/GenerateBillingModal';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaDollarSign,
  FaCalendarAlt,
  FaReceipt,
  FaBuilding,
  FaUser,
  FaChartBar,
  FaTimes,
  FaEdit,
  FaSync
} from 'react-icons/fa';

const SuperAppBillingManagement = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Tab-specific caching state
  const [tabData, setTabData] = useState({
    unpaid: { data: [], lastFetch: null, loading: false },
    failed: { data: [], lastFetch: null, loading: false },
    pending: { data: [], lastFetch: null, loading: false },
    paid: { data: [], lastFetch: null, loading: false },
    cancelled: { data: [], lastFetch: null, loading: false },
    refunded: { data: [], lastFetch: null, loading: false }
  });
  
  // Stats caching state
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Fetch billings when tab changes or other params change
  useEffect(() => {
    fetchBillings();
  }, [activeTab, currentPage, sortField, sortDirection, searchTerm, refreshTrigger]);

  // Fetch stats only once on mount and when refreshTrigger changes
  useEffect(() => {
    if (!statsLoaded || refreshTrigger > 0) {
      fetchStats();
    }
  }, [refreshTrigger, statsLoaded]);

  // Simple tab switching - no preloading

  const fetchBillings = async () => {
    try {
      setLoading(true);
      
      // Check if tab data already exists and is not expired
      const currentTabData = tabData[activeTab];
      const isDataFresh = currentTabData.lastFetch && 
        (Date.now() - currentTabData.lastFetch) < 5 * 60 * 1000; // 5 minutes
      
      // If data exists and is fresh, use it without fetching
      if (currentTabData.data.length > 0 && isDataFresh && !refreshTrigger) {
        setBillings(currentTabData.data);
        setLoading(false);
        console.log(`📋 Using cached data for ${activeTab} tab`);
        return;
      }
      
      // Only fetch if data doesn't exist or is expired
      console.log(`🔄 Fetching fresh data for ${activeTab} tab`);
      
      // Use dedicated API per tab
      const result = await fetchBillingsByTab(activeTab, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sort_by: sortField,
        sort_order: sortDirection
      });
      
      if (result.success) {
        setBillings(result.data);
        
        // Update tab data state
        setTabData(prev => ({
          ...prev,
          [activeTab]: {
            data: result.data,
            lastFetch: Date.now(),
            loading: false
          }
        }));
        
        console.log(`✅ Successfully fetched ${result.data.length} records for ${activeTab} tab`);
      } else {
        console.error('Error fetching billings:', result.error);
        alert('Gagal memuat data billing');
      }
    } catch (error) {
      console.error('Error fetching billings:', error);
      alert('Gagal memuat data billing');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 SuperAppBillingManagement - Fetching optimized dashboard stats');
      
      // Use new optimized dashboard stats API (single call)
      const result = await DashboardStatsService.getDashboardStats();
      
      if (result.success) {
        // Transform dashboard stats to match expected format
        const dashboardData = result.data;
        const transformedStats = {
          // Overview data
          total_billings: dashboardData.overview.total_billings,
          total_amount: dashboardData.overview.total_amount,
          active_tenants: dashboardData.overview.active_tenants,
          growth_rate: dashboardData.overview.growth_rate,
          
          // Billing breakdown
          paid_billings: dashboardData.billing_breakdown.paid.count,
          paid_amount: dashboardData.billing_breakdown.paid.total_amount,
          pending_billings: dashboardData.billing_breakdown.pending.count,
          pending_amount: dashboardData.billing_breakdown.pending.total_amount,
          unpaid_billings: dashboardData.billing_breakdown.unpaid.count,
          unpaid_amount: dashboardData.billing_breakdown.unpaid.total_amount,
          failed_billings: dashboardData.billing_breakdown.failed.count,
          failed_amount: dashboardData.billing_breakdown.failed.total_amount,
          cancelled_billings: dashboardData.billing_breakdown.cancelled.count,
          cancelled_amount: dashboardData.billing_breakdown.cancelled.total_amount,
          refunded_billings: dashboardData.billing_breakdown.refunded.count,
          refunded_amount: dashboardData.billing_breakdown.refunded.total_amount,
          
          // Performance metrics
          collection_rate: dashboardData.performance_metrics.collection_rate,
          avg_per_item: dashboardData.performance_metrics.avg_per_item
        };
        
        setStats(transformedStats);
        setStatsLoaded(true);
        console.log('✅ Dashboard stats loaded successfully:', transformedStats);
      } else {
        // Fallback to old API if new one fails
        console.log('⚠️ Dashboard stats failed, using fallback API');
        const response = await axiosInstance.get('/superapp/billings/stats');
        setStats(response.data.data);
        setStatsLoaded(true);
        console.log('✅ Stats loaded via fallback API');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Fallback to old API
      try {
        const response = await axiosInstance.get('/superapp/billings/stats');
        setStats(response.data.data);
        setStatsLoaded(true);
        console.log('✅ Stats loaded via fallback API');
      } catch (fallbackError) {
        console.error('❌ Fallback stats API also failed:', fallbackError);
        // Fallback to empty stats
        setStats({
          total_billings: 0,
          total_amount: 0,
          paid_billings: 0,
          paid_amount: 0,
          pending_billings: 0,
          pending_amount: 0,
          unpaid_billings: 0,
          unpaid_amount: 0,
          failed_billings: 0,
          failed_amount: 0,
          cancelled_billings: 0,
          cancelled_amount: 0,
          refunded_billings: 0,
          refunded_amount: 0,
          collection_rate: 0,
          avg_per_item: 0,
          active_tenants: 0,
          growth_rate: 0
        });
        setStatsLoaded(true);
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate('/superapp-dashboard');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to search page with search term
      // Note: This page doesn't filter data based on search input
      // All filtering is done on the dedicated search page
      navigate(`/billing-search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleGenerateBilling = () => {
    setShowGenerateModal(true);
  };

  const handleGenerateManualBilling = async (formData) => {
    try {
      const response = await axiosInstance.post('/superapp/billings/generate-manual', formData);
      
      if (response.data.success) {
        alert('Manual billing berhasil dibuat!');
        setShowGenerateModal(false);
        // Clear cache for all tabs since new billing affects stats
        clearTabCache();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error generating manual billing:', error);
      alert('Gagal membuat manual billing: ' + (error.response?.data?.message || error.message));
    }
  };

  // Get available actions based on active tab
  const getAvailableActions = (tab) => {
    const actions = {
      'unpaid': ['failed', 'pending', 'paid', 'cancelled'],
      'failed': ['paid', 'cancelled'], // Can mark as paid or cancel
      'pending': ['unpaid', 'paid', 'failed', 'cancelled'],
      'paid': ['refunded'], // Can only refund paid billings
      'cancelled': [], // No actions for cancelled
      'refunded': [] // No actions for refunded
    };
    return actions[tab] || [];
  };

  // Handle view billing details
  const handleViewBilling = (billing) => {
    setSelectedBilling(billing);
    setShowDetailModal(true);
  };

  // Handle billing action (update status)
  const handleBillingAction = async (billingId, action) => {
    try {
      setIsModalLoading(true);
      
      let response;
      
      // Use specific API for paid status to activate tenant
      if (action === 'paid') {
        response = await axiosInstance.patch(`/superapp/billings/${billingId}/mark-paid`, {
          amount: null, // Use existing amount
          payment_method: 'admin_confirmed',
          payment_reference: `ADMIN-${Date.now()}`,
          paid_at: new Date().toISOString(),
          extend_days: 30
        });
      } else {
        // Use general status update for other actions
        response = await axiosInstance.patch(`/superapp/billings/${billingId}/status`, {
          status: action
        });
      }
      
      if (response.data.success) {
        // Close modal first
        setShowDetailModal(false);
        setSelectedBilling(null);
        
        // Clear cache for all tabs since status change affects multiple tabs
        clearTabCache();
        
        // Trigger refresh by updating refreshTrigger
        setRefreshTrigger(prev => prev + 1);
        
        // Show success message
        if (action === 'paid') {
          console.log(`Billing ${billingId} marked as paid and tenant activated successfully`);
        } else {
          console.log(`Billing ${billingId} updated to ${action} successfully`);
        }
      }
    } catch (error) {
      console.error('Error updating billing status:', error);
      alert('Gagal mengupdate status billing: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleRecordPayment = (billing) => {
    setSelectedBilling(billing);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (billingId) => {
    try {
      await axiosInstance.patch(`/superapp/billings/${billingId}/confirm`, {
        admin_notes: 'Payment confirmed by admin'
      });
      alert('Payment berhasil dikonfirmasi');
      // Clear cache for all tabs since payment confirmation affects multiple tabs
      clearTabCache();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Gagal mengkonfirmasi payment');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await axiosInstance.get('/superapp/subscriptions');
      setSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      alert('Gagal memuat data subscription');
    }
  };

  // Clear cache for specific tab or all tabs
  const clearTabCache = (tabKey = null) => {
    if (tabKey) {
      setTabData(prev => ({
        ...prev,
        [tabKey]: { data: [], lastFetch: null, loading: false }
      }));
    } else {
      setTabData({
        unpaid: { data: [], lastFetch: null, loading: false },
        failed: { data: [], lastFetch: null, loading: false },
        pending: { data: [], lastFetch: null, loading: false },
        paid: { data: [], lastFetch: null, loading: false },
        cancelled: { data: [], lastFetch: null, loading: false },
        refunded: { data: [], lastFetch: null, loading: false }
      });
      // Reset stats flag when clearing all cache
      setStatsLoaded(false);
    }
  };

  // Preload function removed - using simple tab switching

  const handleGenerateBillingSubmit = async () => {
    if (!selectedSubscription || !billingAmount) {
      alert('Harap pilih subscription dan masukkan jumlah billing');
      return;
    }

    try {
      const response = await axiosInstance.post('/superapp/billings/generate', {
        subscription_id: selectedSubscription,
        amount: parseFloat(billingAmount),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        notes: 'Manual billing generated by SuperApp admin'
      });

      if (response.data.success) {
        alert('Billing berhasil dibuat!');
        setShowGenerateModal(false);
        setSelectedSubscription('');
        setBillingAmount('');
        // Clear cache for all tabs since new billing affects stats
        clearTabCache();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error generating billing:', error);
      alert('Gagal membuat billing: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!selectedBilling || !paymentAmount || !paymentMethod) {
      alert('Harap lengkapi data pembayaran');
      return;
    }

    try {
      const response = await axiosInstance.patch(`/superapp/billings/${selectedBilling.id}/mark-paid`, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        paid_at: new Date().toISOString(),
        extend_days: extendDays
      });

      if (response.data.success) {
        alert('Pembayaran berhasil dicatat!');
        setShowPaymentModal(false);
        setSelectedBilling(null);
        setPaymentAmount('');
        setPaymentMethod(''); 
        setPaymentReference('');
        setExtendDays(30);
        // Clear cache for all tabs since payment affects multiple tabs
        clearTabCache();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Gagal mencatat pembayaran: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'paid':
        return <FaCheckCircle className="text-green-500" />;
      case 'failed':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'cancelled':
        return <FaTimes className="text-gray-500" />;
      case 'refunded':
        return <FaReceipt className="text-blue-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Tab configuration
  const BILLING_TABS = {
    unpaid: {
      key: 'unpaid',
      label: 'Unpaid Billings',
      statuses: ['unpaid'], // Only truly unpaid billings
      color: 'red',
      icon: FaExclamationTriangle
    },
    failed: {
      key: 'failed',
      label: 'Failed Billings',
      statuses: ['failed'], // Failed payment attempts
      color: 'orange',
      icon: FaTimesCircle
    },
    pending: {
      key: 'pending', 
      label: 'Pending Payments',
      statuses: ['pending'], // Payments awaiting verification
      color: 'yellow',
      icon: FaClock
    },
    paid: {
      key: 'paid',
      label: 'Paid Billings', 
      statuses: ['paid'],
      color: 'green',
      icon: FaCheckCircle
    },
    cancelled: {
      key: 'cancelled',
      label: 'Cancelled Billings',
      statuses: ['cancelled'],
      color: 'gray',
      icon: FaTimes
    },
    refunded: {
      key: 'refunded',
      label: 'Refunded Billings',
      statuses: ['refunded'],
      color: 'blue',
      icon: FaReceipt
    }
  };

  // Get filtered billings based on active tab (no search filtering here)
  const getFilteredBillingsByTab = (tabKey) => {
    const tab = BILLING_TABS[tabKey];
    if (!tab) return [];
    
    return billings.filter(billing => {
      const matchesTabStatus = tab.statuses.includes(billing.status);
      return matchesTabStatus;
    });
  };

  // Sort billings
  const sortBillings = (billings) => {
    return [...billings].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested properties
      if (sortField === 'tenant_name') {
        aValue = a.tenant?.business_name || '';
        bValue = b.tenant?.business_name || '';
      }
      
      if (sortField === 'owner_name') {
        aValue = a.tenant?.owner_name || '';
        bValue = b.tenant?.owner_name || '';
      }

      // Handle date fields
      if (sortField === 'due_date' || sortField === 'paid_at' || sortField === 'created_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      // Handle numeric fields
      if (sortField === 'amount') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Paginate billings
  const paginateBillings = (billings) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return billings.slice(startIndex, endIndex);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Get stats for active tab
  const getTabStats = (tabKey) => {
    const tabBillings = getFilteredBillingsByTab(tabKey);
    const totalAmount = tabBillings.reduce((sum, billing) => sum + (billing.amount || 0), 0);
    
    return {
      count: tabBillings.length,
      total_amount: totalAmount // Changed to match API response format
    };
  };

  // Helper functions for consistent styling
  const getActiveTabStyles = (color) => {
    const styles = {
      red: 'border-b-2 border-red-500 bg-red-50',
      yellow: 'border-b-2 border-yellow-500 bg-yellow-50',
      green: 'border-b-2 border-green-500 bg-green-50',
      gray: 'border-b-2 border-gray-500 bg-gray-50',
      blue: 'border-b-2 border-blue-500 bg-blue-50',
      orange: 'border-b-2 border-orange-500 bg-orange-50'
    };
    return styles[color] || 'border-b-2 border-gray-500 bg-gray-50';
  };

  const getTextColorStyles = (color, isActive = false) => {
    if (!isActive) return 'text-gray-400';
    
    const styles = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600', 
      green: 'text-green-600',
      gray: 'text-gray-600',
      blue: 'text-blue-600'
    };
    return styles[color] || 'text-gray-600';
  };

  const getTextColorStylesLabel = (color, isActive = false) => {
    if (!isActive) return 'text-gray-600';
    
    const styles = {
      red: 'text-red-700',
      orange: 'text-orange-700',
      yellow: 'text-yellow-700',
      green: 'text-green-700',
      gray: 'text-gray-700',
      blue: 'text-blue-700'
    };
    return styles[color] || 'text-gray-700';
  };

  const getBgColorStyles = (color) => {
    const styles = {
      red: 'bg-red-100',
      orange: 'bg-orange-100',
      yellow: 'bg-yellow-100',
      green: 'bg-green-100',
      gray: 'bg-gray-100',
      blue: 'bg-blue-100'
    };
    return styles[color] || 'bg-gray-100';
  };

  const getIconColorStyles = (color) => {
    const styles = {
      red: 'text-red-500',
      orange: 'text-orange-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      gray: 'text-gray-500',
      blue: 'text-blue-500'
    };
    return styles[color] || 'text-gray-500';
  };

  // Use tab-based filtering instead of old filtering
  const filteredBillings = getFilteredBillingsByTab(activeTab);
  const sortedBillings = sortBillings(filteredBillings);
  const currentTabBillings = paginateBillings(sortedBillings);
  // Get current tab stats from API data
  const getCurrentTabStats = (tabKey) => {
    switch (tabKey) {
      case 'unpaid':
        return stats?.unpaid_billings ? { count: stats.unpaid_billings, total_amount: stats.unpaid_amount } : getTabStats('unpaid');
      case 'pending':
        return stats?.pending_billings ? { count: stats.pending_billings, total_amount: stats.pending_amount } : getTabStats('pending');
      case 'paid':
        return stats?.paid_billings ? { count: stats.paid_billings, total_amount: stats.paid_amount } : getTabStats('paid');
      case 'failed':
        return stats?.failed_billings ? { count: stats.failed_billings, total_amount: stats.failed_amount } : getTabStats('failed');
      case 'cancelled':
        return stats?.cancelled_billings ? { count: stats.cancelled_billings, total_amount: stats.cancelled_amount } : getTabStats('cancelled');
      case 'refunded':
        return stats?.refunded_billings ? { count: stats.refunded_billings, total_amount: stats.refunded_amount } : getTabStats('refunded');
      default:
        return getTabStats(tabKey);
    }
  };
  
  const currentTabStats = getCurrentTabStats(activeTab);
  
  // Pagination info
  const totalPages = Math.ceil(filteredBillings.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredBillings.length);
  

  // Enhanced stats for all tabs - use API data if available, fallback to calculated
  const unpaidStats = stats?.unpaid_billings ? { count: stats.unpaid_billings, total_amount: stats.unpaid_amount } : getTabStats('unpaid');
  const pendingStats = stats?.pending_billings ? { count: stats.pending_billings, total_amount: stats.pending_amount } : getTabStats('pending');
  const paidStats = stats?.paid_billings ? { count: stats.paid_billings, total_amount: stats.paid_amount } : getTabStats('paid');
  const failedStats = stats?.failed_billings ? { count: stats.failed_billings, total_amount: stats.failed_amount } : getTabStats('failed');
  const cancelledStats = stats?.cancelled_billings ? { count: stats.cancelled_billings, total_amount: stats.cancelled_amount } : getTabStats('cancelled');
  const refundedStats = stats?.refunded_billings ? { count: stats.refunded_billings, total_amount: stats.refunded_amount } : getTabStats('refunded');
  const totalCount = stats?.total_billings || billings.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Memuat data billing...</p>
          <p className="mt-2 text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 font-montserrat flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Billing Management</h1>
                <p className="text-sm text-gray-600 font-montserrat">Kelola tagihan dan pembayaran tenant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
          {/* Enhanced Analytics Overview - General Stats (Fixed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Paid Billings Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <FaDollarSign className="text-white text-lg" />
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                  +{stats?.growth_rate || 0}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-green-800 font-montserrat mb-1">
                {formatCurrency(stats?.paid_amount || 0)}
              </h3>
              <p className="text-sm text-green-600 font-montserrat">Total Paid Billings</p>
            </div>


            {/* Active Tenants Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <FaBuilding className="text-white text-lg" />
                </div>
                <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <h3 className="text-2xl font-bold text-orange-800 font-montserrat mb-1">
                {stats?.active_tenants || 0}
              </h3>
              <p className="text-sm text-orange-600 font-montserrat">Tenants</p>
            </div>

            {/* Pending Payments Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <FaClock className="text-white text-lg" />
                </div>
                <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                  {stats?.pending_billings || 0}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-yellow-800 font-montserrat mb-1">
                {formatCurrency(stats?.pending_amount || 0)}
              </h3>
              <p className="text-sm text-yellow-600 font-montserrat">Pending Payments</p>
            </div>

            {/* Unpaid Billings Card */}
            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <FaExclamationTriangle className="text-white text-lg" />
                </div>
                <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">
                  {stats?.unpaid_billings || 0}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-red-800 font-montserrat mb-1">
                {formatCurrency(stats?.unpaid_amount || 0)}
              </h3>
              <p className="text-sm text-red-600 font-montserrat">Unpaid Billings</p>
            </div>
          </div>

          {/* Search Filter with Generate Billing Button */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type to search... (will open search page)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-montserrat"
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <AnimatedButton
                  type="submit"
                  variant="blue"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <FaSearch className="text-sm" />
                  Search
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => {
                    // Clear cache and refresh all data
                    clearTabCache();
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  variant="gray"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <FaSync className="text-sm" />
                  Refresh
                </AnimatedButton>
                <AnimatedButton
                  onClick={handleGenerateBilling}
                  variant="green"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <FaPlus className="text-sm" />
                  Generate Billing
                </AnimatedButton>
              </div>
            </form>
          </div>

          {/* Simplified Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-wrap">
              {Object.values(BILLING_TABS).map((tab) => {
                const tabStats = getCurrentTabStats(tab.key);
                const isActive = activeTab === tab.key;
                const IconComponent = tab.icon;
                const hasCachedData = tabData[tab.key]?.data?.length > 0;
                const isDataFresh = tabData[tab.key]?.lastFetch && 
                  (Date.now() - tabData[tab.key].lastFetch) < 5 * 60 * 1000;
                
                // Debug log for tab stats
                console.log(`🔍 Tab ${tab.key} stats:`, tabStats);
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 min-w-[120px] px-4 py-3 text-center transition-all duration-200 relative ${
                      isActive 
                        ? getActiveTabStyles(tab.color)
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <IconComponent className={`text-lg ${getTextColorStyles(tab.color, isActive)}`} />
                      <span className={`font-semibold text-sm font-montserrat ${getTextColorStylesLabel(tab.color, isActive)}`}>
                        {tab.label}
                      </span>
                      <span className={`text-xs font-bold font-montserrat ${getTextColorStyles(tab.color, isActive)} bg-opacity-20 px-2 py-1 rounded-full`}>
                      {tabStats.count}
                      </span>
                      {/* Cache indicator */}
                      {hasCachedData && isDataFresh && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" title="Data cached"></div>
                      )}
                    </div>
                    {isActive && (
                      <div className={`absolute bottom-0 left-0 right-0 h-1 ${getBgColorStyles(tab.color)}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Billings List - Responsive Table/Card View */}
          <div className="space-y-3">
            {currentTabBillings.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                <div className={`${getBgColorStyles(BILLING_TABS[activeTab].color)} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4`}>
                  {React.createElement(BILLING_TABS[activeTab].icon, {
                    className: `text-2xl font-semibold ${getIconColorStyles(BILLING_TABS[activeTab].color)}`
                  })}
                </div>
                <h3 className="text-xl font-montserrat text-gray-900 mb-2">
                  Tidak ada {BILLING_TABS[activeTab].label.toLowerCase()}
                </h3>
                <p className="text-sm text-gray-500 mb-4 font-montserrat">
                  {activeTab === 'unpaid' && 'Belum ada billing yang belum dibayar'}
                  {activeTab === 'pending' && 'Belum ada pembayaran yang menunggu verifikasi'}
                  {activeTab === 'paid' && 'Belum ada billing yang sudah dibayar'}
                </p>
                {activeTab === 'unpaid' && (
                  <AnimatedButton
                    onClick={handleGenerateBilling}
                    variant="green"
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold mx-auto"
                  >
                    <FaPlus className="text-sm" />
                    Generate Billing Pertama
                  </AnimatedButton>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('invoice_number')}
                          >
                            <div className="flex items-center gap-2">
                              Invoice
                              <span className="text-gray-400">{getSortIcon('invoice_number')}</span>
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('tenant_name')}
                          >
                            <div className="flex items-center gap-2">
                              Tenant
                              <span className="text-gray-400">{getSortIcon('tenant_name')}</span>
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('owner_name')}
                          >
                            <div className="flex items-center gap-2">
                              Owner
                              <span className="text-gray-400">{getSortIcon('owner_name')}</span>
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('amount')}
                          >
                            <div className="flex items-center gap-2">
                              Amount
                              <span className="text-gray-400">{getSortIcon('amount')}</span>
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              <span className="text-gray-400">{getSortIcon('status')}</span>
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('due_date')}
                          >
                            <div className="flex items-center gap-2">
                              Due Date
                              <span className="text-gray-400">{getSortIcon('due_date')}</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                            Payment Method
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => handleSort('paid_at')}
                          >
                            <div className="flex items-center gap-2">
                              Paid Date
                              <span className="text-gray-400">{getSortIcon('paid_at')}</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTabBillings.map((billing) => (
                          <tr key={billing.id} className="hover:bg-gray-50 transition-colors duration-200">
                            {/* Invoice */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${getBgColorStyles(BILLING_TABS[activeTab].color)} mr-3`}>
                                  <FaReceipt className={`text-sm ${getIconColorStyles(BILLING_TABS[activeTab].color)}`} />
                      </div>
                      <div>
                                  <div className="text-sm font-bold text-gray-900 font-montserrat">
                                    {formatInvoiceNumber(billing.invoice_number)}
                                  </div>
                                  <div className="text-xs text-gray-500 font-montserrat">
                                    ID: {billing.tenant_id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Tenant */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 font-montserrat">
                          {formatBusinessName(billing.tenant?.business_name) || 'Tenant tidak ditemukan'}
                      </div>
                            </td>

                            {/* Owner */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 font-montserrat">
                                {formatOwnerName(billing.tenant?.owner_name)}
                              </div>
                              <div className="text-xs text-gray-500 font-montserrat">
                                {formatEmail(billing.tenant?.email)}
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900 font-montserrat">
                                {formatCurrency(billing.amount)}
                    </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const statusInfo = formatBillingStatus(billing.status);
                                return (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border w-fit ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                                    <span>{statusInfo.icon}</span>
                                    {statusInfo.text}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Due Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 font-montserrat">
                                {formatDate(billing.due_date)}
                              </div>
                            </td>

                            {/* Payment Method */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 font-montserrat">
                                {formatPaymentMethod(billing.payment_method)}
                              </div>
                              {billing.payment_reference && (
                                <div className="text-xs text-gray-500 font-montserrat">
                                  Ref: {billing.payment_reference}
                                </div>
                              )}
                            </td>

                            {/* Paid Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 font-montserrat">
                                {billing.paid_at ? formatDate(billing.paid_at) : '-'}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleViewBilling(billing)}
                                  className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                                  title="View Details"
                                >
                                  <FaEye className="text-sm" />
                                  <span className="text-xs font-medium">Detail</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-700 font-montserrat">
                        <span>
                          Showing {startItem} to {endItem} of {filteredBillings.length} results
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            const isActive = pageNum === currentPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                  isActive
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          {totalPages > 5 && (
                            <>
                              <span className="px-2 text-gray-500">...</span>
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                  currentPage === totalPages
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                    </div>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                      </div>

                {/* Mobile Card View */}
                <div className="lg:hidden grid grid-cols-1 gap-4">
                  {currentTabBillings.map((billing) => (
                    <div key={billing.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 group">
                      {/* Enhanced Header */}
                      <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${getBgColorStyles(BILLING_TABS[activeTab].color)}`}>
                              <FaReceipt className={`text-xl ${getIconColorStyles(BILLING_TABS[activeTab].color)}`} />
                      </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold font-montserrat text-gray-900 truncate">
                                {formatInvoiceNumber(billing.invoice_number)}
                              </h3>
                              <p className="text-sm text-gray-600 font-montserrat truncate">
                                {formatBusinessName(billing.tenant?.business_name) || 'Tenant tidak ditemukan'}
                              </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                                Owner: {formatOwnerName(billing.tenant?.owner_name)}
                              </p>
                              <p className="text-xs text-gray-500 font-montserrat">
                                ID: {billing.tenant_id}
                        </p>
                      </div>
                    </div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleViewBilling(billing)}
                        className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        title="View Details"
                      >
                        <FaEye className="text-sm" />
                        <span className="text-xs font-medium">Detail</span>
                      </button>
                    </div>
                  </div>

                        {/* Status Badge */}
                    <div className="flex items-center justify-between">
                          {(() => {
                            const statusInfo = formatBillingStatus(billing.status);
                            return (
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                                <span>{statusInfo.icon}</span>
                                {statusInfo.text}
                              </span>
                            );
                          })()}
                        {billing.paid_at && (
                            <span className="text-xs text-gray-500 font-montserrat bg-gray-100 px-2 py-1 rounded-full">
                            Paid: {formatDate(billing.paid_at)}
                          </span>
                        )}
                      </div>
                    </div>

                      {/* Enhanced Details Grid */}
                      <div className="p-4 space-y-3">
                        {/* Amount - Prominent Display */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaDollarSign className="text-green-600 text-lg" />
                              <span className="text-sm font-semibold text-green-700 font-montserrat">Amount</span>
                            </div>
                            <span className="text-xl font-bold text-green-800 font-montserrat">
                              {formatCurrency(billing.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <FaCalendarAlt className="text-blue-500 text-sm" />
                        <span className="text-xs font-semibold text-gray-700 font-montserrat">Due Date</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 font-montserrat">{formatDate(billing.due_date)}</p>
                    </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                              <FaUser className="text-purple-500 text-sm" />
                              <span className="text-xs font-semibold text-gray-700 font-montserrat">Method</span>
                      </div>
                            <p className="text-sm font-bold text-gray-900 font-montserrat truncate">
                              {formatPaymentMethod(billing.payment_method)}
                            </p>
                    </div>
                        </div>

                        {/* Reference if exists */}
                        {billing.payment_reference && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                              <FaReceipt className="text-blue-500 text-sm" />
                              <span className="text-xs font-semibold text-blue-700 font-montserrat">Reference</span>
                      </div>
                            <p className="text-sm font-bold text-blue-800 font-montserrat truncate">
                              {billing.payment_reference}
                            </p>
                    </div>
                        )}
                      </div>

                      {/* Enhanced Actions */}
                      <div className="p-4 pt-0">
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={() => handleViewBilling(billing)}
                            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold"
                          variant="outline"
                        >
                          <FaEye className="mr-1" />
                          Detail
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Generate Manual Billing Modal */}
      <GenerateBillingModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateManualBilling}
        isLoading={false}
      />

      {/* Record Payment Modal */}
      {showPaymentModal && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 font-montserrat">
                Record Payment
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBilling(null);
                  setPaymentAmount('');
                  setPaymentMethod('');
                  setPaymentReference('');
                  setExtendDays(30);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 font-montserrat mb-2">Billing Details</h4>
                <p className="text-sm text-gray-600 font-montserrat">
                  <strong>Tenant:</strong> {selectedBilling.tenant?.business_name}
                </p>
                <p className="text-sm text-gray-600 font-montserrat">
                  <strong>Amount:</strong> {formatCurrency(selectedBilling.amount)}
                </p>
                <p className="text-sm text-gray-600 font-montserrat">
                  <strong>Due Date:</strong> {new Date(selectedBilling.due_date).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Jumlah Pembayaran
                </label>
                <input
                  type="number"
                  placeholder="Masukkan jumlah pembayaran..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat text-sm"
                >
                  <option value="">Pilih metode pembayaran...</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="e_wallet">E-Wallet</option>
                  <option value="cash">Cash</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Referensi Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Masukkan referensi pembayaran..."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Perpanjang Subscription (Hari)
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat text-sm"
                />
                <p className="text-xs text-gray-500 mt-1 font-montserrat">
                  Subscription akan diperpanjang selama {extendDays} hari dari hari ini
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <AnimatedButton
                onClick={handleRecordPaymentSubmit}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold"
                variant="green"
              >
                Record Payment
              </AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBilling(null);
                  setPaymentAmount('');
                  setPaymentMethod('');
                  setPaymentReference('');
                  setExtendDays(30);
                }}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold"
                variant="grey"
              >
                Batal
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Billing Detail Modal */}
      <BillingDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBilling(null);
        }}
        billing={selectedBilling}
        availableActions={getAvailableActions(activeTab)}
        onAction={handleBillingAction}
        isLoading={isModalLoading}
        title="Billing Details"
      />
    </div>
  );
};

export default SuperAppBillingManagement;