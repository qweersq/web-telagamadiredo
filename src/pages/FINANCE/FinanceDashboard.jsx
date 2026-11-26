import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, Filter, Calendar, MapPin, Search } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import FinancePeriodSelector from './components/FinancePeriodSelector';
import FinanceStatisticsCards from './components/FinanceStatisticsCards';
import FinanceTransactionTabs from './components/FinanceTransactionTabs';
import FinanceIncomeSubTabs from './components/FinanceIncomeSubTabs';
import FinanceTransactionList from './components/FinanceTransactionList';
import FinanceTransactionDetailModal from './components/FinanceTransactionDetailModal';
import FinanceTransactionDetailViewModal from './components/FinanceTransactionDetailViewModal';
import FinanceAddExpenseModal from './components/FinanceAddExpenseModal';
import FinanceAddExternalIncomeModal from './components/FinanceAddExternalIncomeModal';
import FinanceCashToBankModal from './components/FinanceCashToBankModal';
import FinanceAccountSummaryCards from './components/FinanceAccountSummaryCards';
import FinanceDashboardExplanationModal from '../../components/Modal/FinanceDashboardExplanationModal';
import { getDailySummary, getDailyTransactions, addExpense, addExternalIncome, transferCashToBank, getBranches, getAccountSummary } from './api/financeApi';
import { getUserProfile } from '../../utils/userProfileHelper';
import { FaFilter, FaTimes, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';

const FinanceDashboard = () => {
  const navigate = useNavigate();

  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const savedPeriod = localStorage.getItem('finance_selected_period');
      const savedDate = localStorage.getItem('finance_selected_date');
      const savedTab = localStorage.getItem('finance_active_tab');

      // Default to monthly period with current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      return {
        period: savedPeriod || 'monthly',
        date: savedDate || currentMonth,
        tab: savedTab || 'all'
      };
    } catch (error) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return {
        period: 'monthly',
        date: currentMonth,
        tab: 'all'
      };
    }
  };

  // Save state to localStorage
  const saveState = (period, date, tab) => {
    try {
      localStorage.setItem('finance_selected_period', period);
      localStorage.setItem('finance_selected_date', date);
      if (tab) {
        localStorage.setItem('finance_active_tab', tab);
      }
    } catch (error) {
    }
  };

  // Initialize state from localStorage
  const savedState = loadSavedState();

  // State untuk period selector
  const [selectedPeriod, setSelectedPeriod] = useState(savedState.period);
  const [selectedDate, setSelectedDate] = useState(savedState.date);

  // State untuk statistics
  const [summary, setSummary] = useState(null);

  // State untuk transactions
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState(savedState.tab);

  // State untuk income sub-tabs
  const [activeIncomeSubTab, setActiveIncomeSubTab] = useState('all');

  // State untuk pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // State untuk modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExternalIncomeModal, setShowExternalIncomeModal] = useState(false);
  const [showCashToBankModal, setShowCashToBankModal] = useState(false);
  const [showTransactionDetailModal, setShowTransactionDetailModal] = useState(false);
  const [showTransactionDetailViewModal, setShowTransactionDetailViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // State untuk loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State untuk userData dan branch filter
  const [userData, setUserData] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // State untuk account summary
  const [accountSummary, setAccountSummary] = useState([]);
  const [loadingAccountSummary, setLoadingAccountSummary] = useState(false);
  const [expenseSummary, setExpenseSummary] = useState([]);
  const [loadingExpenseSummary, setLoadingExpenseSummary] = useState(false);
  const [profitSummary, setProfitSummary] = useState([]);
  const [loadingProfitSummary, setLoadingProfitSummary] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);

  // State untuk filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State untuk search
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Load userData
  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);

      // Fetch branches after userData is loaded
      if (profile?.tenant?.id) {
        await fetchBranches(profile.tenant.id);
      }
    } catch (error) {
    }
  };

  // Fetch branches by tenant_id
  const fetchBranches = async (tenantId) => {
    try {
      setLoadingBranches(true);

      const branchesData = await getBranches(tenantId);

      setBranches(branchesData || []);
    } catch (error) {
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Fetch account summary for different types
  const fetchAccountSummary = async (type = 'income') => {
    if (!userData) {
      setAccountSummary([]);
      setExpenseSummary([]);
      setProfitSummary([]);
      return;
    }

    const setLoadingState = type === 'income' ? setLoadingAccountSummary :
      type === 'expense' ? setLoadingExpenseSummary : setLoadingProfitSummary;
    const setSummaryState = type === 'income' ? setAccountSummary :
      type === 'expense' ? setExpenseSummary : setProfitSummary;

    setLoadingState(true);

    try {
      const params = {
        type: type,
        period: selectedPeriod,
        date: selectedDate,
        tenant_id: userData.tenant.id,
        branch_id: selectedBranchId // null = semua cabang
      };

      // Adjust date format based on period
      if (selectedPeriod === 'weekly') {
        const date = new Date(selectedDate);
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else if (selectedPeriod === 'monthly') {
        params.date = selectedDate.substring(0, 7);
      }

      const summaryData = await getAccountSummary(params);
      const accountSummaryData = summaryData.account_summary || [];
      setSummaryState(accountSummaryData);
    } catch (error) {
      setSummaryState([]);
    } finally {
      setLoadingState(false);
    }
  };

  // Calculate profit summary from income and expense
  const calculateProfitSummary = (incomeSummary, expenseSummary) => {
    const profitMap = {};

    // Add income amounts
    incomeSummary.forEach(account => {
      const key = account.account_id;
      if (!profitMap[key]) {
        profitMap[key] = {
          account_id: account.account_id,
          account_name: account.account_name,
          payment_method_name: account.payment_method_name,
          total_amount: 0,
          transaction_count: 0
        };
      }
      profitMap[key].total_amount += account.total_amount;
      profitMap[key].transaction_count += account.transaction_count;
    });

    // Subtract expense amounts
    expenseSummary.forEach(account => {
      const key = account.account_id;
      if (!profitMap[key]) {
        profitMap[key] = {
          account_id: account.account_id,
          account_name: account.account_name,
          payment_method_name: account.payment_method_name,
          total_amount: 0,
          transaction_count: 0
        };
      }
      profitMap[key].total_amount -= account.total_amount;
      profitMap[key].transaction_count += account.transaction_count;
    });

    // Convert to array and filter out zero amounts
    return Object.values(profitMap).filter(account => account.total_amount !== 0);
  };

  // Fetch all summaries
  const fetchAllSummaries = async () => {
    if (!userData || !selectedBranchId) {
      return;
    }

    // Fetch income summary
    await fetchAccountSummary('income');

    // Fetch expense summary
    await fetchAccountSummary('expense');
  };

  // Effect to calculate profit when income or expense summaries change
  useEffect(() => {
    if (accountSummary.length > 0 || expenseSummary.length > 0) {
      const profitData = calculateProfitSummary(accountSummary, expenseSummary);
      setProfitSummary(profitData);
      setLoadingProfitSummary(false);
    }
  }, [accountSummary, expenseSummary]);

  // Fetch daily summary data
  const fetchDailySummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        date: selectedDate,
        period: selectedPeriod
      };

      // Add tenant_id and branch_id if available
      if (userData?.tenant?.id) {
        params.tenant_id = userData.tenant.id;
      }
      if (selectedBranchId) {
        params.branch_id = selectedBranchId;
      }

      const summaryData = await getDailySummary(params);
      setSummary(summaryData);

      // Set finance accounts from daily summary
      if (summaryData.finance_accounts) {
        setFinanceAccounts(summaryData.finance_accounts);
      }

    } catch (err) {
      if (err.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login ulang.');
      } else if (err.response?.status === 403) {
        setError('Anda tidak memiliki akses ke fitur ini.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal memuat data ringkasan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily transactions with pagination
  const fetchDailyTransactions = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Prepare parameters based on period
      const params = {
        type: activeTab,
        period: selectedPeriod,
        page: page,
        limit: 10
      };

      if (selectedPeriod === 'daily') {
        params.date = selectedDate;
      } else if (selectedPeriod === 'weekly') {
        // Calculate start and end date for weekly
        const date = new Date(selectedDate);
        // selectedDate should already be the start of week (Monday)
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday

        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else if (selectedPeriod === 'monthly') {
        params.date = selectedDate.substring(0, 7); // YYYY-MM format
      }

      // Add tenant_id and branch_id if available
      if (userData?.tenant?.id) {
        params.tenant_id = userData.tenant.id;
      }
      if (selectedBranchId) {
        params.branch_id = selectedBranchId;
      }

      const transactionsData = await getDailyTransactions(params);

      // Validate received transactions against current period filter
      const validateTransactions = (transactions) => {
        if (!transactions || transactions.length === 0) {
          return transactions;
        }

        // For now, let's skip validation and return all transactions
        // This will help us see if the issue is with validation or something else
        return transactions;

        // TODO: Re-enable validation after debugging
        /*
        // Use backend date if available, otherwise use frontend selectedDate
        const validationDate = transactionsData.date || selectedDate;
        
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.created_at || transaction.date);
          
          // Debug logging for each transaction
          if (selectedPeriod === 'daily') {
            const selectedDateObj = new Date(validationDate);
            // Compare using local date strings to avoid timezone issues
            const transactionDateStr = transactionDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            const selectedDateStr = selectedDateObj.toLocaleDateString('en-CA');
            const isValid = transactionDateStr === selectedDateStr;
            return isValid;
          } else if (selectedPeriod === 'weekly') {
            const weekStart = new Date(validationDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            // Convert to local date strings for comparison
            const transactionDateStr = transactionDate.toLocaleDateString('en-CA');
            const weekStartStr = weekStart.toLocaleDateString('en-CA');
            const weekEndStr = weekEnd.toLocaleDateString('en-CA');
            
            const isValid = transactionDateStr >= weekStartStr && transactionDateStr <= weekEndStr;
            return isValid;
          } else if (selectedPeriod === 'monthly') {
            const [year, month] = validationDate.split('-');
            const isValid = transactionDate.getFullYear() === parseInt(year) && 
                   transactionDate.getMonth() === parseInt(month) - 1;
            return isValid;
          }
          
          return true;
        });
        */
      };

      const validatedTransactions = validateTransactions(transactionsData.transactions || []);


      if (append) {
        setTransactions(prev => [...prev, ...validatedTransactions]);
      } else {
        setTransactions(validatedTransactions);
      }

      // Update pagination state
      if (transactionsData.pagination) {
        // Use pagination from backend directly
        setPagination(transactionsData.pagination);
      }

    } catch (err) {
      if (err.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login ulang.');
      } else if (err.response?.status === 403) {
        setError('Anda tidak memiliki akses ke fitur ini.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal memuat data transaksi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle period change
  const handlePeriodChange = (period, date) => {
    setSelectedPeriod(period);
    setSelectedDate(date);

    // Reset pagination and transactions when period changes
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
    setTransactions([]);

    // Save to localStorage
    saveState(period, date, activeTab);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset income sub-tab when switching tabs
    if (tab !== 'income') {
      setActiveIncomeSubTab('all');
    }

    // Reset pagination and transactions when tab changes
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
    setTransactions([]);

    // Save to localStorage
    saveState(selectedPeriod, selectedDate, tab);
  };

  // Handle income sub-tab change
  const handleIncomeSubTabChange = (subTab) => {
    setActiveIncomeSubTab(subTab);
  };

  // Filter transactions based on active tab and sub-tab
  const getFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // First filter by main tab (all, income, expense)
    let filteredTransactions = transactions;

    if (activeTab === 'income') {
      filteredTransactions = transactions.filter(transaction =>
        transaction.type === 'income'
      );

      // Then filter by income sub-tab using dynamic payment method filtering
      if (activeIncomeSubTab !== 'all') {
        filteredTransactions = filteredTransactions.filter(transaction => {
          // Get payment method from account summary data
          const accountSummaryItem = accountSummary.find(account =>
            account.account_name === transaction.account_name
          );

          if (accountSummaryItem) {
            const methodName = accountSummaryItem.payment_method_name || 'Unknown';
            const methodKey = methodName.toLowerCase().replace(/\s+/g, '_');
            return methodKey === activeIncomeSubTab;
          }

          // Fallback to old logic if account summary not available
          const accountName = transaction.account_name?.toLowerCase() || '';
          const paymentMethod = transaction.source?.payment_method?.toLowerCase() || '';

          switch (activeIncomeSubTab) {
            case 'qris':
              return accountName.includes('qris') || paymentMethod.includes('qris');
            case 'bank':
            case 'bank_transfer':
              return accountName.includes('bank') || accountName.includes('bca') ||
                accountName.includes('mandiri') || paymentMethod.includes('bank');
            case 'cash':
              return accountName.includes('cash') || paymentMethod.includes('cash');
            default:
              return true;
          }
        });
      }
    } else if (activeTab === 'expense') {
      filteredTransactions = transactions.filter(transaction =>
        transaction.type === 'expense'
      );
    }

    // Debug logging for filtering
    return filteredTransactions;
  };


  // Load more transactions (button click)
  const loadMoreTransactions = async () => {
    if (pagination.hasNext && !loadingMore) {
      await fetchDailyTransactions(pagination.page + 1, true);
    } else {
    }
  };

  // Handle transaction click
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  // Handle transaction click from list modal
  const handleTransactionClickFromList = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetailViewModal(true);
  };

  // Handle view transaction details
  const handleViewTransactionDetails = () => {
    setShowTransactionDetailModal(true);
  };

  // Handle add expense
  const handleAddExpense = () => {
    setShowExpenseModal(true);
  };

  // Handle add external income
  const handleAddExternalIncome = () => {
    setShowExternalIncomeModal(true);
  };

  // Handle cash to bank
  const handleCashToBank = () => {
    setShowCashToBankModal(true);
  };

  // Handle expense submit
  const handleExpenseSubmit = async (expenseData) => {
    try {
      await addExpense(expenseData);

      // Refresh data after adding expense
      await fetchDailySummary();
      await fetchDailyTransactions(1, false); // Reset to page 1

      setShowExpenseModal(false);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesi Anda telah berakhir. Silakan login ulang.');
      } else if (err.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk menambah pengeluaran.');
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Gagal menambah pengeluaran. Silakan coba lagi.');
      }
    }
  };

  // Handle external income submit
  const handleExternalIncomeSubmit = async (incomeData) => {
    try {
      await addExternalIncome(incomeData);

      // Refresh data after adding income
      await fetchDailySummary();
      await fetchDailyTransactions(1, false); // Reset to page 1

      setShowExternalIncomeModal(false);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesi Anda telah berakhir. Silakan login ulang.');
      } else if (err.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk menambah pendapatan.');
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Gagal menambah pendapatan. Silakan coba lagi.');
      }
    }
  };

  // Handle cash to bank submit
  const handleCashToBankSubmit = async (transferData) => {
    try {
      await transferCashToBank(transferData);

      // Refresh data after transfer
      await fetchDailySummary();
      await fetchDailyTransactions(1, false); // Reset to page 1

      setShowCashToBankModal(false);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesi Anda telah berakhir. Silakan login ulang.');
      } else if (err.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk transfer.');
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Gagal melakukan transfer. Silakan coba lagi.');
      }
    }
  };

  // Handle transfer success
  const handleTransferSuccess = async (transferResult) => {
    try {

      // Refresh data after transfer
      await fetchDailySummary();
      await fetchDailyTransactions(1, false); // Reset to page 1

      // Show success message
      alert(`Transfer berhasil! ${transferResult.from_account.name} → ${transferResult.to_account.name} sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transferResult.amount)}`);

    } catch (err) {
    }
  };


  // Get account type color
  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'bank':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cash':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'qris':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Load userData on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Check if explanation modal should be shown
  useEffect(() => {
    const hasSeenExplanation = localStorage.getItem('finance-dashboard-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  // Handle explanation modal
  const handleExplanationConfirm = () => {
    localStorage.setItem('finance-dashboard-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };

  // Restore state from localStorage on component mount
  useEffect(() => {
    const savedState = loadSavedState();
    if (savedState.period !== selectedPeriod || savedState.date !== selectedDate || savedState.tab !== activeTab) {
      setSelectedPeriod(savedState.period);
      setSelectedDate(savedState.date);
      setActiveTab(savedState.tab);
    }
  }, []);

  // Fetch data when period, date, tab, or branch changes
  useEffect(() => {
    if (userData) {
      fetchDailySummary();
      fetchDailyTransactions(1, false); // Reset to page 1

      // Fetch all summaries (income, expense, profit)
      fetchAllSummaries();
    }
  }, [selectedPeriod, selectedDate, selectedBranchId, userData]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      {/* Header */}
      <HeaderBerandaOwner
        title="Transaksi Keuangan"
        description="Kelola transaksi dan laporan finance"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-6 pt-16 pb-4">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-4">

            {/* Back Button */}
            {/* <div className="mb-6">
              <AnimatedButton
                onClick={() => navigate('/berandaowner')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                variant="grey"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </AnimatedButton>
            </div> */}

            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari transaksi, akun, atau deskripsi..."
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
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-10 mt-1">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    {transactions.filter(t =>
                      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      t.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      t.type?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length} transaksi ditemukan
                  </div>
                </div>
              )}
            </div>

            {/* Filter Button */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-montserrat text-sm font-semibold shadow-sm hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 group"
              >
                <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                <span>Filter Data Finance</span>
              </button>

              {/* Help Button */}
              <button
                onClick={() => setShowExplanationModal(true)}
                className="px-3 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                title="Bantuan & Panduan Transaksi Keuangan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Selected Filter Info */}
            <div className="mb-6 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Filter Aktif</h3>
                {(selectedBranchId || selectedPeriod !== 'monthly' || selectedDate !== new Date().toISOString().slice(0, 7)) && (
                  <button
                    onClick={() => {
                      setSelectedBranchId(null);
                      setSelectedPeriod('monthly');
                      setSelectedDate(new Date().toISOString().slice(0, 7));
                    }}
                    className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hapus Filter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Cabang Filter */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cabang</p>
                    <p className="text-sm text-gray-600">
                      {selectedBranchId
                        ? (branches.find(branch => branch.id === selectedBranchId)?.name || 'Cabang Terpilih')
                        : 'Semua Cabang'
                      }
                    </p>
                  </div>
                </div>

                {/* Periode Filter */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Periode</p>
                    <p className="text-sm text-gray-600">
                      {selectedPeriod === 'daily' ? 'Harian' : selectedPeriod === 'weekly' ? 'Mingguan' : 'Bulanan'} - {
                        selectedPeriod === 'monthly'
                          ? new Date(selectedDate + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                          : selectedDate
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <FinanceStatisticsCards
              summary={summary}
              loading={loading}
              onViewDetails={handleViewTransactionDetails}
            />

            {/* Account Summary Cards - Show for all tabs */}
            <FinanceAccountSummaryCards
              accountSummary={financeAccounts.map(acc => ({
                account_id: acc.id,
                account_name: acc.name,
                payment_method_name: acc.payment_method?.name || 'Unknown',
                total_amount: acc.balance,
                transaction_count: 0,
                is_global: acc.is_global
              }))}
              loading={loading}
              type="income"
              title="Saldo Akun"
              filterInfo={summary?.filter_info}
              onTransferSuccess={handleTransferSuccess}
            />


            {/* Transaction Tabs */}
            {/* <FinanceTransactionTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
            /> */}

            {/* Income Sub-Tabs - Only show when income tab is active */}
            {/* {activeTab === 'income' && (
              <FinanceIncomeSubTabs
                activeSubTab={activeIncomeSubTab}
                onSubTabChange={handleIncomeSubTabChange}
                transactions={transactions.filter(t => t.type === 'income')}
                loading={loading}
                accountSummary={accountSummary}
              />
            )} */}

            {/* Transaction List */}
            {/* <FinanceTransactionList
              transactions={getFilteredTransactions()}
              loading={loading}
              error={error}
              onTransactionClick={handleTransactionClick}
              onLoadMore={loadMoreTransactions}
              loadingMore={loadingMore}
              hasNext={pagination.hasNext}
            /> */}

          </div>
        </div>
      </main>


      {/* Transaction Detail Modal */}
      <FinanceTransactionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        transaction={selectedTransaction}
      />

      {/* Add Expense Modal */}
      <FinanceAddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={handleExpenseSubmit}
        selectedDate={selectedDate}
      />

      {/* Add External Income Modal */}
      <FinanceAddExternalIncomeModal
        isOpen={showExternalIncomeModal}
        onClose={() => setShowExternalIncomeModal(false)}
        onSubmit={handleExternalIncomeSubmit}
        selectedDate={selectedDate}
      />

      {/* Cash to Bank Modal */}
      <FinanceCashToBankModal
        isOpen={showCashToBankModal}
        onClose={() => setShowCashToBankModal(false)}
        onSubmit={handleCashToBankSubmit}
        selectedDate={selectedDate}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(2rem, env(safe-area-inset-left))',
            paddingRight: 'max(2rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800 font-montserrat">
                  Filter Data Finance
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sesuaikan periode dan cabang untuk melihat data
                </p>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div
              className="p-6 space-y-6 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {/* Period Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Periode
                </label>
                <FinancePeriodSelector
                  selectedPeriod={selectedPeriod}
                  selectedDate={selectedDate}
                  onPeriodChange={handlePeriodChange}
                />
              </div>

              {/* Branch Filter */}
              {userData && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Filter Cabang
                  </label>
                  {loadingBranches ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600 text-sm">Memuat cabang...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedBranchId || ''}
                        onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                      >
                        <option value="">Semua Cabang</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} - {branch.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <AnimatedButton
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
                variant="grey"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  setShowFilterModal(false);
                  // Filter will be applied automatically via useEffect
                }}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
                variant="blue"
              >
                Terapkan Filter
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <FinanceTransactionDetailModal
        isOpen={showTransactionDetailModal}
        onClose={() => setShowTransactionDetailModal(false)}
        selectedPeriod={selectedPeriod}
        selectedDate={selectedDate}
        selectedBranchId={selectedBranchId}
        userData={userData}
        onTransactionClick={handleTransactionClickFromList}
      />

      {/* Transaction Detail View Modal */}
      <FinanceTransactionDetailViewModal
        isOpen={showTransactionDetailViewModal}
        onClose={() => setShowTransactionDetailViewModal(false)}
        transaction={selectedTransaction}
      />

      {/* Finance Dashboard Explanation Modal */}
      <FinanceDashboardExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />
    </div>
  );
};

export default FinanceDashboard;
