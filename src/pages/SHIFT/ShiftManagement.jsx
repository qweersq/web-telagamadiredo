import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import ShiftExplanationModal from '../../components/Modal/ShiftExplanationModal';
import instance from '../../config/api';
import { getTenantId } from '../../utils/userProfileHelper';
import { 
  Clock, 
  User, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Calendar,
  Users,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  AlertCircle,
  ChevronDown,
  MapPin,
  Filter,
  Info
} from 'lucide-react';
import { formatPaymentMethod, formatCurrency } from '../../utils/labelFormatter';
import TransactionDetailModal from '../../components/Modal/TransactionDetailModal';
import FilterModal from '../../components/Modal/FilterModal';

const ShiftManagement = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchBranches();
    
    // Check if user has seen explanation before
    const hasSeenExplanation = localStorage.getItem('shift_explanation_seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchShifts(1, true);
    }
  }, [selectedBranchId, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const { data } = await instance.get('/shifts/branches/active');
      setBranches(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedBranchId(data.data[0].id);
      }
    } catch (error) {
    }
  };

  const fetchShifts = async (page = 1, reset = false) => {
    if (!selectedBranchId) {
      return;
    }
    
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Get tenant_id from userProfileHelper
      const tenantId = await getTenantId();
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        branch_id: selectedBranchId.toString()
      });

      // Add tenant_id if available
      if (tenantId) {
        params.append('tenant_id', tenantId.toString());
      }

      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      const { data } = await instance.get(`/shifts?${params}`);
      
      if (reset) {
        setShifts(data.data.shifts || []);
      } else {
        // Prevent duplicate data by filtering out existing IDs
        const newShifts = data.data.shifts || [];
        setShifts(prev => {
          const existingIds = new Set(prev.map(shift => shift.id));
          const uniqueNewShifts = newShifts.filter(shift => !existingIds.has(shift.id));
          return [...prev, ...uniqueNewShifts];
        });
      }
      
      setPagination(data.data.pagination || {});
    } catch (error) {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasNextPage && !loadingMore) {
      fetchShifts(pagination.currentPage + 1, false);
    }
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranchId(branchId);
  };

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleApplyFilter = () => {
    fetchShifts(1, true);
  };

  const openDetailModal = async (shift) => {
    try {
      const { data } = await instance.get(`/shifts/${shift.id}`);
      setSelectedShift(data.data);
      setShowDetailModal(true);
    } catch (error) {
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'Sedang berlangsung';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}j ${minutes}m`;
  };

  const getShiftStatus = (shift) => {
    if (!shift.end_time) {
      return { text: 'Aktif', color: 'text-green-600', bg: 'bg-green-100' };
    }
    return { text: 'Selesai', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getDifferenceColor = (difference) => {
    if (difference > 0) return 'text-green-600';
    if (difference < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <div className="relative">
        <HeaderBerandaOwner 
          title="Manajemen Shift" 
          description="Kelola dan pantau data shift karyawan"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
        />
        {/* Info Button */}
        <button
          onClick={() => setShowExplanationModal(true)}
          className="absolute top-4 right-4 w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors duration-200 group"
          title="Informasi Manajemen Shift"
        >
          <Info className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto mt-[40px]">
        <div className="mx-auto px-4 md:px-10 pt-16 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Filter Button - Tokopedia Style */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-3 py-3 px-4 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter Shift</span>
                  {(selectedBranchId || (startDate && endDate)) && (
                    <div className="flex items-center gap-2">
                      {selectedBranchId && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          {branches.find(b => b.id === selectedBranchId)?.name}
                        </span>
                      )}
                      {startDate && endDate && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          {startDate} - {endDate}
                        </span>
                      )}
                    </div>
                  )}
                </button>
                
                {/* Info Tooltip Button */}
                <div className="relative group">
                  <button
                    onClick={() => setShowExplanationModal(true)}
                    className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                    title="Informasi Manajemen Shift"
                  >
                    <Info className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    <div className="font-semibold mb-1">💡 Tips Manajemen Shift</div>
                    <div className="text-gray-300">
                      Klik untuk melihat panduan lengkap cara mengelola dan memantau data shift karyawan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Info - Tokopedia Style */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Semua Shift</h3>
                    <p className="text-gray-600 text-sm">{pagination.totalItems || 0} shift tersedia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shifts List - Tokopedia Style */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data Shift</h3>
                  <p className="text-gray-500 text-sm">Data shift akan muncul setelah ada aktivitas</p>
                </div>
              ) : (
                shifts.map((shift) => {
                  const status = getShiftStatus(shift);
                  const difference = parseFloat(shift.difference || 0);
                  
                  return (
                    <div 
                      key={shift.id} 
                      className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => openDetailModal(shift)}
                    >
                      <div className="flex items-center justify-between">
                        {/* LEFT: Basic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-800 text-base">
                              {shift.employee?.name || shift.employee_shift?.name || 'Unknown'}
                            </h3>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Shift #{shift.id}
                          </div>
                        </div>

                        {/* RIGHT: Durasi & Action */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-gray-500 text-xs mb-1">Durasi</div>
                            <div className="font-bold text-gray-700 text-sm">
                              {formatDuration(shift.start_time, shift.end_time)}
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <div className="text-blue-500 group-hover:text-blue-600 transition-colors flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Load More Button - Tokopedia Style */}
              {pagination.hasNextPage && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                      loadingMore
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        Memuat...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Muat Lebih Banyak
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info - Tokopedia Style */}
              {shifts.length > 0 && (
                <div className="text-center text-gray-500 text-sm mt-6 bg-gray-50 rounded-xl p-4">
                  Menampilkan {shifts.length} dari {pagination.totalItems} shift
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal - Tokopedia Style */}
      {showDetailModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 font-montserrat">Detail Shift #{selectedShift.id}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Header Info - Tokopedia Style */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg font-montserrat">
                      {selectedShift.employee?.name || selectedShift.employee_shift?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Shift #{selectedShift.id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Durasi</div>
                  <div className="font-bold text-blue-600 text-md">
                    {formatDuration(selectedShift.start_time, selectedShift.end_time)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Mulai</div>
                  <div className="font-semibold text-gray-700 text-sm">
                    {formatDate(selectedShift.start_time, { includeTime: true })}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Selesai</div>
                  <div className="font-semibold text-gray-700 text-sm">
                    {selectedShift.end_time ? formatDate(selectedShift.end_time, { includeTime: true }) : 'Masih aktif'}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Kas Awal</div>
                  <div className="font-semibold text-gray-700 text-sm">
                    {formatCurrency(selectedShift.cash_initial || 0)}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Kas Akhir</div>
                  <div className="font-semibold text-gray-700 text-sm">
                    {formatCurrency(selectedShift.cash_actual || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary - Tokopedia Style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-green-800 text-sm">Total Revenue</span>
                </div>
                <div className="text-lg font-bold text-green-700 mb-1">
                  {formatCurrency(selectedShift.total_revenue || 0)}
                </div>
                <div className="text-xs text-green-600">
                  {selectedShift.transaction || 0} transaksi
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-blue-800 text-sm">Cash Inflow</span>
                </div>
                <div className="text-lg font-bold text-blue-700 mb-1">
                  {formatCurrency(selectedShift.cash_inflow || 0)}
                </div>
                <div className="text-xs text-blue-600">
                  Uang masuk cash
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-semibold text-red-800 text-sm">Cash Outflow</span>
                </div>
                <div className="text-lg font-bold text-red-700 mb-1">
                  {formatCurrency(selectedShift.cash_outflow || 0)}
                </div>
                <div className="text-xs text-red-600">
                  Uang keluar cash
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-semibold text-purple-800 text-sm">Cash Balance</span>
                </div>
                <div className="text-lg font-bold text-purple-700 mb-1">
                  {formatCurrency(selectedShift.cash_balance || 0)}
                </div>
                <div className="text-xs text-purple-600">
                  Saldo akhir cash
                </div>
              </div>
            </div>

            {/* Account Breakdown - Tokopedia Style */}
            {selectedShift.account_breakdown && Object.keys(selectedShift.account_breakdown).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg font-montserrat">Pembayaran</h3>
                </div>
                
                {/* Desktop Table View - Tokopedia Style */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Akun
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Masuk
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Keluar
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Net Flow
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Transaksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.values(selectedShift.account_breakdown).map((account, index) => (
                        <tr key={`account-${account.account_id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium text-gray-900 text-sm font-['Montserrat']">
                                  {account.account_name}
                                </div>
                                <div className="text-xs text-gray-500 font-['Montserrat'] capitalize">
                                  {formatPaymentMethod(account.payment_method_code)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-green-600 text-sm font-['Montserrat']">
                              {formatCurrency(account.inflow)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-red-600 text-sm font-['Montserrat']">
                              {formatCurrency(account.outflow)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold text-sm font-['Montserrat'] ${account.inflow - account.outflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(account.inflow - account.outflow)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-['Montserrat']">
                                {account.transactions?.length || 0}
                              </span>
                              {account.transactions && account.transactions.length > 0 && (
                                <AnimatedButton
                                  variant="blue"
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setShowTransactionModal(true);
                                  }}
                                  className="px-2 py-1 text-xs font-medium font-['Montserrat'] transition-colors flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Detail
                                </AnimatedButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Tokopedia Style */}
                <div className="space-y-4">
                  {Object.values(selectedShift.account_breakdown).map((account, index) => (
                    <div key={`account-mobile-${account.account_id}-${index}`} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">
                              {account.account_name}
                            </h4>
                            <p className="text-xs text-gray-500 capitalize">
                              {formatPaymentMethod(account.payment_method_code)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
                            {account.transactions?.length || 0}
                          </span>
                          {account.transactions && account.transactions.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowTransactionModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Detail
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Masuk</div>
                          <div className="font-bold text-green-600 text-sm">
                            {formatCurrency(account.inflow)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Keluar</div>
                          <div className="font-bold text-red-600 text-sm">
                            {formatCurrency(account.outflow)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Net Flow</div>
                          <div className={`font-bold text-sm ${account.inflow - account.outflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(account.inflow - account.outflow)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses & Other Details - Tokopedia Style */}
            <div className="space-y-6">

              {/* Expenses Details */}
              {selectedShift.expenses && selectedShift.expenses.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between p-5 border-b-2 border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg font-montserrat">Detail Pengeluaran</h3>
                    </div>
                    <span className="text-sm text-gray-500 font-montserrat bg-gray-100 px-3 py-1 rounded-lg">
                      {selectedShift.expenses.length} item
                    </span>
                  </div>
                  
                  <div className="p-5">
                    <div className="space-y-4">
                      {selectedShift.expenses.map(expense => (
                        <div key={expense.id} className="flex justify-between items-center bg-red-50 rounded-xl p-4 border-2 border-red-200">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm font-montserrat mb-2">
                              {expense.name}
                            </h4>
                            {expense.description && (
                              <p className="text-xs text-gray-600 font-montserrat mb-2">
                                {expense.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 font-montserrat">
                              {formatDate(expense.createdAt || expense.time, { includeTime: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600 text-lg font-montserrat">
                              {formatCurrency(expense.amount)}
                            </div>
                            {expense.receipt && (
                              <div className="text-xs text-blue-600 font-montserrat mt-1 bg-blue-100 px-2 py-1 rounded-lg">
                                Ada bukti
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Methods - Fallback untuk backward compatibility */}
            {selectedShift.payment_methods && (!selectedShift.account_breakdown || Object.keys(selectedShift.account_breakdown).length === 0) && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm font-['Montserrat']">Metode Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Banknote className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800 text-xs font-['Montserrat']">Cash</span>
                    </div>
                    <p className="text-lg font-bold text-green-800 font-['Montserrat']">
                      {formatCurrency(selectedShift.payment_methods.cash?.amount || 0)}
                    </p>
                    <p className="text-xs text-green-600 font-['Montserrat']">
                      {selectedShift.payment_methods.cash?.count || 0} transaksi
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800 text-xs font-['Montserrat']">Transfer Bank</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800 font-['Montserrat']">
                      {formatCurrency(selectedShift.payment_methods.bank_transfer?.amount || 0)}
                    </p>
                    <p className="text-xs text-blue-600 font-['Montserrat']">
                      {selectedShift.payment_methods.bank_transfer?.count || 0} transaksi
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <QrCode className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800 text-xs font-['Montserrat']">QRIS</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-800 font-['Montserrat']">
                      {formatCurrency(selectedShift.payment_methods.qris?.amount || 0)}
                    </p>
                    <p className="text-xs text-yellow-600 font-['Montserrat']">
                      {selectedShift.payment_methods.qris?.count || 0} transaksi
                    </p>
                  </div>
                </div>
              </div>
            )}


            <div className="flex justify-end mt-8">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm font-semibold font-montserrat"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        onApplyFilter={handleApplyFilter}
      />

      {/* Shift Explanation Modal */}
      <ShiftExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />
    </div>
  );
};

export default ShiftManagement;
