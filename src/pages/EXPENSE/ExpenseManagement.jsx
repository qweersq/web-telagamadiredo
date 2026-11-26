import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, Calendar, MapPin, Trash2, Edit, Eye, Search } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import ExpenseCreateModal from './components/ExpenseCreateModal';
import ExpenseEditModal from './components/ExpenseEditModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import ExpenseDeleteModal from './components/ExpenseDeleteModal';
import { getExpenses, deleteExpense, getBranches, getFinanceAccounts } from './api/expenseApi';
import { getUserProfile } from '../../utils/userProfileHelper';
import { formatCurrency, formatDate } from '../../utils/labelFormatter';

const ExpenseManagement = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showFilters, setShowFilters] = useState(false);
  
  // Statistics
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // State untuk explanation modal

  const fetchExpenses = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filters = {
        tenant_id: userData?.tenant_id,
        branch_id: selectedBranch || userData?.branch_id,
        startDate: selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-01` : null,
        endDate: selectedYear && selectedMonth ? (() => {
          // Get last day of the month
          const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
          return `${selectedYear}-${selectedMonth.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        })() : null,
        page: page,
        pageSize: 10, // Default page size
      };
      const response = await getExpenses(filters);
      console.log('API Response:', response);
      
      // Response structure: response.data.data (from ResponseHelper.successResponse)
      const responseData = response.data?.data || response.data;
      
      if (append) {
        // Append new expenses to existing list
        setExpenses(prev => [...prev, ...(responseData?.expenses || [])]);
      } else {
        // Replace expenses with new data
        setExpenses(responseData?.expenses || []);
      }
      
      // Update pagination info
      if (responseData?.pagination) {
        setPagination(responseData.pagination);
        setCurrentPage(responseData.pagination.current_page);
      }
      
      // Use statistics from backend (not calculated from paginated expenses)
      if (responseData?.statistics) {
        setTotalExpenses(responseData.statistics.total_amount || 0);
        setExpenseCount(responseData.statistics.count_expense || 0);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      if (!append) {
        setExpenses([]); // Set empty array on error
        setTotalExpenses(0);
        setExpenseCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userData, selectedBranch, selectedMonth, selectedYear]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await getBranches();
      console.log('Branches Response:', response);
      const branchesData = response.data || [];
      setBranches(branchesData);
      
      // Set default branch to first branch if no branch is selected
      if (branchesData.length > 0 && !selectedBranch) {
        setSelectedBranch(branchesData[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]); // Set empty array on error
    }
  }, [selectedBranch]);

  const fetchFinanceAccounts = useCallback(async (branchId) => {
    try {
      const response = await getFinanceAccounts(branchId);
      console.log('Finance Accounts Response:', response);
      setFinanceAccounts(response.data || []);
    } catch (error) {
      console.error('Error fetching finance accounts:', error);
      setFinanceAccounts([]); // Set empty array on error
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Check if explanation modal should be shown

  // Handle explanation modal

  useEffect(() => {
    if (userData) {
      fetchBranches();
    }
  }, [userData, fetchBranches]);

  useEffect(() => {
    if (userData && selectedBranch) {
      // Reset to page 1 when filters change
      setCurrentPage(1);
      fetchExpenses(1, false);
    }
  }, [userData, selectedBranch, selectedMonth, selectedYear, fetchExpenses]);

  // Load more function
  const loadMore = useCallback(() => {
    if (pagination.has_next && !loadingMore) {
      const nextPage = currentPage + 1;
      fetchExpenses(nextPage, true);
    }
  }, [pagination.has_next, currentPage, loadingMore, fetchExpenses]);

  const fetchUserData = async () => {
    try {
      const profileData = await getUserProfile();
      if (profileData) {
        setUserData(profileData.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Statistics are now set directly from backend response in fetchExpenses
  // No need to calculate from expenses array (which is paginated)

  const handleCreateExpense = () => {
    setShowCreateModal(true);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  };

  const handleDeleteExpense = (expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  const confirmDeleteExpense = async () => {
    try {
      await deleteExpense(selectedExpense.id);
      // Reset to page 1 and reload
      setCurrentPage(1);
      await fetchExpenses(1, false);
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleExpenseCreated = () => {
    // Reset to page 1 and reload
    setCurrentPage(1);
    fetchExpenses(1, false);
    setShowCreateModal(false);
  };

  const handleExpenseUpdated = () => {
    // Reset to page 1 and reload
    setCurrentPage(1);
    fetchExpenses(1, false);
    setShowEditModal(false);
    setSelectedExpense(null);
  };

  const clearFilters = () => {
    // Set to current month and year instead of clearing
    setSelectedMonth((new Date().getMonth() + 1).toString());
    setSelectedYear(new Date().getFullYear().toString());
    // Keep selectedBranch as is, don't clear it
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense =>
    expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    getBranchName(expense.branch_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-montserrat">
      {/* Header */}
      <HeaderBerandaOwner
        title="Manajemen Pengeluaran"
        description="Kelola pengeluaran bisnis Anda"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-[40px]">
        <div className="mx-auto px-4 md:px-10 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[30px]">
            
            {/* Search Bar - Tokopedia Style */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari pengeluaran, deskripsi, atau cabang..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-white shadow-sm transition-all duration-200 hover:border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Search suggestions or results count */}
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-10 mt-1">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    {filteredExpenses.length} pengeluaran ditemukan
                  </div>
                </div>
              )}
            </div>

            {/* Add Button - Tokopedia Style */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={handleCreateExpense}
                className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-montserrat text-sm font-semibold shadow-sm hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 group"
              >
                <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <span>Tambah Pengeluaran</span>
              </button>
              
            </div>

            {/* Statistics Cards - Tokopedia Style */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  {/* <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-red-600 text-xl">📉</span>
                  </div> */}
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Jumlah Transaksi</p>
                    <p className="text-2xl font-bold text-gray-800">{expenseCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-600 text-xl">📊</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters - Tokopedia Style */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Filter Pengeluaran</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Filter size={16} />
                  Filter
                </button>
              </div>

              {showFilters && (
                <div className="space-y-4">
                  {/* Branch Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-2" />
                      Cabang
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                    >
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={16} className="inline mr-2" />
                        Bulan
                      </label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                        required
                      >
                        <option value="">Pilih Bulan</option>
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={16} className="inline mr-2" />
                        Tahun
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                        required
                      >
                        <option value="">Pilih Tahun</option>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Reset Filters */}
                  <div className="flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors font-semibold"
                    >
                      Reset ke Bulan Ini
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Expenses List - Tokopedia Style */}
            <div className="space-y-4">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-3xl">📉</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm 
                      ? 'Pengeluaran tidak ditemukan' 
                      : 'Belum ada pengeluaran'
                    }
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm 
                      ? 'Coba kata kunci lain' 
                      : 'Tambahkan pengeluaran pertama Anda'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {filteredExpenses.map(expense => (
                    <div key={expense.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {expense.name}
                            </h3>
                            {/* <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              {expense.status}
                            </span> */}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-gray-600">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 text-sm">💰</span>
                              </div>
                              <span className="text-lg font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleViewExpense(expense)}
                            className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Lihat
                          </button>
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense)}
                            className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          {expense.date ? new Date(expense.date).toLocaleDateString('id-ID') : new Date(expense.createdAt).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: #{expense.id}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button - Only show when no search term (search is client-side) */}
                  {!searchTerm && pagination.has_next && filteredExpenses.length > 0 && (
                    <div className="pt-4 pb-6 space-y-3">
                      {/* Statistics - Simple Text */}
                      <div className="text-center text-sm text-gray-600">
                        <span>Menampilkan {filteredExpenses.length} dari {pagination.total || 0} data</span>
                      </div>
                      
                      {/* Load More Button */}
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="w-full py-3 px-4 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <span>Muat Data Lainnya</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Modals */}
      <ExpenseCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleExpenseCreated}
        branches={branches}
        onBranchChange={fetchFinanceAccounts}
        financeAccounts={financeAccounts}
        userData={userData}
      />

      <ExpenseEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleExpenseUpdated}
        expense={selectedExpense}
        branches={branches}
        onBranchChange={fetchFinanceAccounts}
        financeAccounts={financeAccounts}
        userData={userData}
      />

      <ExpenseDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        expense={selectedExpense}
        branchName={selectedExpense ? getBranchName(selectedExpense.branch_id) : ''}
      />

      <ExpenseDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteExpense}
        expense={selectedExpense}
      />

    </div>
  );
};

export default ExpenseManagement;
