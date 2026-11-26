import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardMetricsGrid from "../../components/SuperAppAdmin/DashboardMetricsGrid";
import ExpenseModal from "../../components/SuperAppAdmin/ExpenseModal";
import instance from "../../config/api";
import { Plus } from 'lucide-react';
import {
  saveFilterToStorage,
  getFilterFromStorage,
  clearFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES,
  testEncryption,
  debugLocalStorage
} from "../../utils/filterStorage";

const SuperAppSuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    new_tenants: 0,
    active_tenants: 0,
    total_users: 0,
    total_revenue: 0,
    paid_payments: 0,
    pending_payments: 0
  });
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start_date: null,
    end_date: null,
    preset: ''
  });

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Fetch statistics from API
  const fetchStatistics = async (startDate = null, endDate = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const queryString = params.toString();
      const url = `/superapp-admin/statistics${queryString ? `?${queryString}` : ''}`;

      console.log('📊 Fetching statistics:', url);

      const response = await instance.get(url);

      if (response.data.success) {
        setStats(response.data.data);
        console.log('✅ Statistics loaded:', response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      alert('Gagal memuat data statistik. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    try {
      const { data } = await instance.get('/superapp/expenses/categories');
      if (data.success) {
        setExpenseCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching expense categories:', error);
    }
  };

  // Handle expense submission
  const handleSubmitExpense = async (formData) => {
    try {
      const { data } = await instance.post('/superapp/expenses', formData);
      if (data.success) {
        alert('Pengeluaran berhasil ditambahkan!');
        // Optionally refresh dashboard stats here
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      throw new Error(error.response?.data?.message || 'Gagal menyimpan pengeluaran');
    }
  };

  // Load statistics and saved filter on component mount
  useEffect(() => {
    // Test encryption first
    console.log('🔐 Testing encryption...');
    const encryptionWorks = testEncryption();
    console.log('🔐 Encryption works:', encryptionWorks);

    // Debug localStorage
    debugLocalStorage();

    // Load saved filter from localStorage
    const savedFilter = getFilterFromStorage(COMPONENT_NAMES.SUPERAPP_DASHBOARD, FILTER_TYPES.DATE_FILTER);
    console.log('📋 Saved filter loaded:', savedFilter);

    if (savedFilter) {
      setDateFilter(savedFilter);
      fetchStatistics(savedFilter.start_date, savedFilter.end_date);
    } else {
      fetchStatistics();
    }

    // Fetch expense categories
    fetchExpenseCategories();
  }, []);

  // Handle date filter application
  const handleApplyDateFilter = (filter) => {
    setDateFilter(filter);

    console.log('💾 Saving filter to storage:', filter);

    // Save filter to localStorage
    const saveSuccess = saveFilterToStorage(
      COMPONENT_NAMES.SUPERAPP_DASHBOARD,
      FILTER_TYPES.DATE_FILTER,
      filter,
      24 // 24 hours expiration
    );

    console.log('💾 Save success:', saveSuccess);

    fetchStatistics(filter.start_date, filter.end_date);
  };

  // Handle clear filter
  const handleClearFilter = () => {
    setDateFilter({
      start_date: null,
      end_date: null,
      preset: ''
    });

    // Clear saved filter from localStorage
    clearFilterFromStorage(COMPONENT_NAMES.SUPERAPP_DASHBOARD, FILTER_TYPES.DATE_FILTER);

    fetchStatistics();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const menuItems = [
    {
      title: "Subscription Plans",
      description: "Kelola paket langganan untuk tenant",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
      onClick: () => navigate('/subscription-plans'),
      color: "bg-indigo-500"
    },
    {
      title: "Billing Management",
      description: "Kelola tagihan dan pembayaran tenant",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      onClick: () => navigate('/billing-management'),
      color: "bg-green-500"
    },
    {
      title: "Tenant Management",
      description: "Kelola semua bisnis laundry",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l-1.5 18h-12L4.5 3zM9 9h6m-6 4h6m-6 4h6" />
        </svg>
      ),
      onClick: () => navigate('/tenant-list'),
      color: "bg-blue-500"
    },
    {
      title: "Top Tenant Omzet",
      description: "Ranking tenant berdasarkan omzet bulanan",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      onClick: () => navigate('/top-tenant-omzet'),
      color: "bg-teal-500"
    },
    // {
    //   title: "Payment Management",
    //   description: "Kelola pembayaran tenant dan aktivasi subscription",
    //   icon: (
    //     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    //     </svg>
    //   ),
    //   onClick: () => navigate('/payment-management'),
    //   color: "bg-emerald-500"
    // },
    {
      title: "Payment Method Management",
      description: "Kelola metode pembayaran sistem",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      onClick: () => navigate('/payment-method-management'),
      color: "bg-yellow-500"
    },
    // {
    //   title: "WhatsApp Setup",
    //   description: "Konfigurasi WhatsApp untuk SuperApp Admin",
    //   icon: (
    //     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    //     </svg>
    //   ),
    //   onClick: () => navigate('/superapp-wa-setup'),
    //   color: "bg-purple-500"
    // },
    {
      title: "Feedback Management",
      description: "Kelola feedback dari semua tenant",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      onClick: () => navigate('/superapp-feedback'),
      color: "bg-cyan-500"
    },
    {
      title: "Bug Reports",
      description: "Kelola laporan bug dari semua tenant",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      onClick: () => navigate('/superapp-bug-reports'),
      color: "bg-red-500"
    },
    {
      title: "SuperApp Expenses",
      description: "Kelola pengeluaran operasional sistem",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      onClick: () => navigate('/superapp-expenses'),
      color: "bg-orange-500"
    },
    {
      title: "App Version Management",
      description: "Kelola versi aplikasi mobile dan web",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => navigate('/app-versions'),
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold font-montserrat text-gray-900">Super App Dashboard</h1>
              <p className="text-sm text-gray-600 font-montserrat">Kelola semua bisnis laundry</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <button
                onClick={() => {
                  // Clear localStorage and redirect to login
                  localStorage.clear();
                  navigate('/login');
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-8">

          {/* Dashboard Metrics */}
          <DashboardMetricsGrid
            filter={dateFilter.preset || 'month'}
            customDateRange={{
              start_date: dateFilter.start_date,
              end_date: dateFilter.end_date
            }}
            onFilterChange={(filterType, customDateFilter) => {
              if (filterType === 'custom' && customDateFilter) {
                // Handle custom date range from modal
                handleApplyDateFilter(customDateFilter);
              } else if (filterType === 'all') {
                // Handle "Semua" filter - no date range
                handleApplyDateFilter({
                  start_date: null,
                  end_date: null,
                  preset: 'all'
                });
              } else {
                // Handle preset filters (today, month, last_month) - generate date range
                const today = new Date();
                const formatDate = (date) => date.toISOString().split('T')[0];

                let start_date, end_date;

                if (filterType === 'today') {
                  start_date = formatDate(today);
                  end_date = formatDate(today);
                } else if (filterType === 'month') {
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  start_date = formatDate(startOfMonth);
                  end_date = formatDate(today);
                } else if (filterType === 'last_month') {
                  // Bulan lalu: tanggal 1 bulan lalu s/d tanggal terakhir bulan lalu
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  start_date = formatDate(lastMonth);
                  end_date = formatDate(endOfLastMonth);
                }

                handleApplyDateFilter({
                  start_date,
                  end_date,
                  preset: filterType
                });
              }
            }}
          />

          {/* Button Tambah Pengeluaran - Simple & Minimal */}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="w-full bg-white hover:bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-orange-300 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 group-hover:bg-orange-100 rounded-lg flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 font-montserrat transition-colors">
                Tambah Pengeluaran
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Menu Items */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 font-montserrat">Menu Utama</h2>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 text-left"
              >
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-white`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 font-montserrat">{item.title}</h3>
                  <p className="text-sm text-gray-500 font-montserrat">{item.description}</p>
                </div>
                <div className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          {/* <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 font-montserrat">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              <AnimatedButton
                onClick={() => navigate('/subscription-plans/create')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold"
                variant="indigo"
              >
                Tambah Paket
              </AnimatedButton>
              <AnimatedButton
                onClick={() => navigate('/subscription-plans')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold"
                variant="outline"
              >
                Kelola Paket
              </AnimatedButton>
              <AnimatedButton
                onClick={() => navigate('/billing-management')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold"
                variant="green"
              >
                Kelola Billing
              </AnimatedButton>
              <AnimatedButton
                onClick={() => navigate('/tenant-list')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold"
                variant="outline"
              >
                Kelola Tenant
              </AnimatedButton>
              <AnimatedButton
                onClick={() => navigate('/payment-management')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold"
                variant="emerald"
              >
                Kelola Payment
              </AnimatedButton>
              <AnimatedButton
                onClick={() => navigate('/superapp-wa-setup')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold"
                variant="purple"
              >
                Setup WhatsApp
              </AnimatedButton>
            </div>
          </div> */}
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={handleSubmitExpense}
        expense={null}
        categories={expenseCategories}
        mode="create"
      />
    </div>
  );
};

export default SuperAppSuperAdminDashboard;
