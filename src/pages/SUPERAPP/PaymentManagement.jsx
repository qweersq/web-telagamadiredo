import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';

// Import komponen kecil
import PaymentStatsCard from '../../components/PaymentManagement/PaymentStatsCard';
import PaymentFilter from '../../components/PaymentManagement/PaymentFilter';
import PaymentList from '../../components/PaymentManagement/PaymentList';
import BulkActions from '../../components/PaymentManagement/BulkActions';
import LoadMoreButton from '../../components/PaymentManagement/LoadMoreButton';
import PaymentDetailModal from '../../components/PaymentManagement/PaymentDetailModal';
import FilterModal from '../../components/PaymentManagement/FilterModal';

const PaymentManagement = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    tenant_id: '',
    payment_method: '',
    start_date: '',
    end_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [stats, setStats] = useState({
    total: { total_count: 0, total_amount: 0 },
    by_status: []
  });
  const [actionLoading, setActionLoading] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  const handleBackToDashboard = () => {
    navigate('/superapp-dashboard');
  };

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      setSearchTerm(value);
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleClearFilters = () => {
    setFilters({ status: '', tenant_id: '', payment_method: '', start_date: '', end_date: '' });
    setSearchTerm('');
  };

  const handleSearch = () => {
    // Reset pagination when searching
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchPayments();
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    if (pagination.currentPage > 1) {
      fetchPayments(true);
    }
  }, [pagination.currentPage]);

  const fetchPayments = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: loadMore ? pagination.currentPage : 1,
        pageSize: 10,
        ...filters,
        search: searchTerm
      });

      const response = await instance.get(`/admin/payments?${params}`);
      if (response.data.success) {
        const newPayments = response.data.data.payments;
        if (loadMore) {
          setPayments(prev => [...prev, ...newPayments]);
        } else {
          setPayments(newPayments);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      alert('Gagal memuat data payment');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await instance.get('/admin/payments/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [paymentId]: 'approving' }));
      
      const adminNotes = prompt('Tambahkan catatan admin (opsional):');
      if (adminNotes === null) return; // User cancelled
      
      const response = await instance.patch(`/admin/payments/${paymentId}/approve`, {
        admin_notes: adminNotes
      });

      if (response.data.success) {
        alert('Payment berhasil disetujui!');
        fetchPayments();
        fetchStats();
      }
    } catch (error) {
      console.error('❌ Error approving payment:', error);
      alert('Gagal menyetujui payment');
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: null }));
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [paymentId]: 'rejecting' }));
      
      const rejectionReason = prompt('Alasan penolakan:');
      if (!rejectionReason) return;

      const response = await instance.patch(`/admin/payments/${paymentId}/reject`, {
        rejection_reason: rejectionReason
      });

      if (response.data.success) {
        alert('Payment berhasil ditolak!');
        fetchPayments();
        fetchStats();
      }
    } catch (error) {
      console.error('❌ Error rejecting payment:', error);
      alert('Gagal menolak payment');
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: null }));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayments.length === 0) {
      alert('Pilih payment yang akan disetujui');
      return;
    }

    if (!confirm(`Setujui ${selectedPayments.length} payment?`)) return;

    try {
      const adminNotes = prompt('Tambahkan catatan admin (opsional):');
      
      const response = await instance.post('/admin/payments/bulk-approve', {
        payment_ids: selectedPayments,
        admin_notes: adminNotes
      });

      if (response.data.success) {
        alert(`Bulk approval selesai! ${response.data.data.approved_count} disetujui, ${response.data.data.failed_count} gagal`);
        setSelectedPayments([]);
        fetchPayments();
        fetchStats();
      }
    } catch (error) {
      console.error('❌ Error bulk approving payments:', error);
      alert('Gagal melakukan bulk approval');
    }
  };

  const handleSelectPayment = (paymentId) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    const pendingPayments = payments.filter(p => p.status === 'pending').map(p => p.id);
    setSelectedPayments(prev => 
      prev.length === pendingPayments.length ? [] : pendingPayments
    );
  };

  const handleLoadMore = async () => {
    if (pagination.hasNextPage && !loadingMore) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'paid': return <FaCheckCircle className="text-green-500" />;
      case 'failed': return <FaTimesCircle className="text-red-500" />;
      case 'cancelled': return <FaTimesCircle className="text-gray-500" />;
      case 'refunded': return <FaMoneyBillWave className="text-blue-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const handleViewPayment = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentId(null);
  };

  const handleOpenFilterModal = () => {
    setShowFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    setShowFilterModal(false);
  };

  const handleToggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  const handlePaymentUpdated = () => {
    // Refresh payment list after approval/rejection
    fetchPayments();
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
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
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Payment Management</h1>
                <p className="text-sm text-gray-600 font-montserrat">Kelola pembayaran tenant dan aktivasi subscription</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Statistics Toggle and Filter Buttons */}
        <div className="flex items-center justify-between mb-6">
          <AnimatedButton
            onClick={handleToggleStatistics}
            className={`px-4 py-2 rounded-xl font-bold font-montserrat text-sm shadow-lg transition-all duration-200 ${
              showStatistics
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
            }`}
          >
            {showStatistics ? '📊 Hide Statistics' : '📊 Show Statistics'}
          </AnimatedButton>
          
          <AnimatedButton
            onClick={handleOpenFilterModal}
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-montserrat text-sm shadow-lg"
          >
            🔍 Filter
          </AnimatedButton>
        </div>

        {/* Stats Cards */}
        {showStatistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <PaymentStatsCard
              title="Total Payments"
              value={stats.total.total_count || 0}
              icon="money"
              color="text-gray-900"
              bgColor="bg-gradient-to-br from-blue-100 to-blue-200"
            />
            <PaymentStatsCard
              title="Total Revenue"
              value={formatCurrency(stats.total.total_amount || 0)}
              icon="check"
              color="text-green-600"
              bgColor="bg-gradient-to-br from-green-100 to-green-200"
            />
            <PaymentStatsCard
              title="Pending"
              value={stats.by_status.find(s => s.status === 'pending')?.count || 0}
              icon="clock"
              color="text-yellow-600"
              bgColor="bg-gradient-to-br from-yellow-100 to-yellow-200"
            />
            <PaymentStatsCard
              title="Paid"
              value={stats.by_status.find(s => s.status === 'paid')?.count || 0}
              icon="check"
              color="text-green-600"
              bgColor="bg-gradient-to-br from-green-100 to-green-200"
            />
          </div>
        )}


        {/* Bulk Actions */}
        <BulkActions
          selectedCount={selectedPayments.length}
          onBulkApprove={handleBulkApprove}
          onClearSelection={() => setSelectedPayments([])}
        />

        {/* Payment List Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Title and Count */}
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-gray-800 font-montserrat">
                📋 Payment List
              </h3>
              <span className="text-sm text-gray-600 font-montserrat bg-gray-100 px-3 py-1 rounded-full">
                {pagination.totalCount} total payments
              </span>
            </div>
            
            {/* Right Column - Actions */}
            <div className="flex items-center gap-3 justify-end">
              <AnimatedButton
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-montserrat text-sm shadow-lg"
              >
                Select All Pending
              </AnimatedButton>
            </div>
          </div>
        </div>

        {/* Payment Cards */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <PaymentList
            payments={payments}
            selectedPayments={selectedPayments}
            onSelectPayment={handleSelectPayment}
            onApprovePayment={handleApprovePayment}
            onRejectPayment={handleRejectPayment}
            onViewPayment={handleViewPayment}
            actionLoading={actionLoading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            loading={loading}
          />
        </div>

        {/* Load More Button */}
        <LoadMoreButton
          hasNextPage={pagination.hasNextPage}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          currentCount={payments.length}
          totalCount={pagination.totalCount}
        />
        </div>
      </div>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        paymentId={selectedPaymentId}
        onApprovePayment={handleApprovePayment}
        onRejectPayment={handleRejectPayment}
        actionLoading={actionLoading}
        onPaymentUpdated={handlePaymentUpdated}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={handleCloseFilterModal}
        filters={{ ...filters, search: searchTerm }}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default PaymentManagement;
