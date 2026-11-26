import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { getAccountSummary, getDailyTransactions, getBranches } from './api/financeApi';
import { getUserProfile } from '../../utils/userProfileHelper';

const FinanceTransactions = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('income');
  const [userData, setUserData] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [accountSummary, setAccountSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState('2025-08');

  // Load user data
  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);
      setSelectedBranchId(profile.branch_id);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load branches
  const fetchBranches = async () => {
    if (!userData?.tenant_id) return;
    
    setLoadingBranches(true);
    try {
      const branchesData = await getBranches(userData.tenant_id);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Load account summary - only for income tab
  const fetchAccountSummary = async () => {
    if (!userData || !selectedBranchId || activeTab !== 'income') {
      setAccountSummary([]);
      return;
    }

    setLoading(true);
    try {
      const params = {
        type: 'income', // Always fetch income data for account summary
        period: selectedPeriod,
        date: selectedDate,
        tenant_id: userData.tenant_id,
        branch_id: selectedBranchId
      };

      const summaryData = await getAccountSummary(params);
      setAccountSummary(summaryData.account_summary || []);
    } catch (error) {
      console.error('Error fetching account summary:', error);
      setAccountSummary([]);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions
  const fetchTransactions = async () => {
    if (!userData || !selectedBranchId) return;

    try {
      const params = {
        type: activeTab,
        period: selectedPeriod,
        date: selectedDate,
        page: 1,
        limit: 10,
        tenant_id: userData.tenant_id,
        branch_id: selectedBranchId
      };

      const transactionsData = await getDailyTransactions(params);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get account type icon
  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'bank':
        return '🏦';
      case 'cash':
        return '💵';
      case 'qris':
        return '📱';
      default:
        return '💰';
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

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchBranches();
    }
  }, [userData]);

  useEffect(() => {
    if (userData && selectedBranchId) {
      // Only fetch account summary for income tab
      if (activeTab === 'income') {
        fetchAccountSummary();
      } else {
        setAccountSummary([]);
      }
      fetchTransactions();
    }
  }, [userData, selectedBranchId, activeTab, selectedPeriod, selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBerandaOwner 
        title="Transaksi" 
        showBackButton={true}
        backPath="/berandaowner"
        showLogout={true}
        showUserMenu={true}
      />

      <div className="p-4 md:p-6">
        {/* Branch Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Cabang
          </label>
          <select
            value={selectedBranchId || ''}
            onChange={(e) => setSelectedBranchId(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingBranches}
          >
            <option value="">Pilih Cabang</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Period Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Periode
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
            <input
              type={selectedPeriod === 'monthly' ? 'month' : 'date'}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'income'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Income
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Expense
              </div>
            </button>
          </div>
        </div>

        {/* Account Summary Cards - Only show in Income tab */}
        {activeTab === 'income' && (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Ringkasan per Account - Income
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accountSummary.map((account) => (
                    <div
                      key={account.account_id}
                      className={`p-4 rounded-lg border-2 ${getAccountTypeColor(account.account_type)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{getAccountTypeIcon(account.account_type)}</span>
                          <div>
                            <h4 className="font-semibold">{account.account_name}</h4>
                            <p className="text-sm opacity-75 capitalize">{account.account_type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Income:</span>
                          <span className="font-bold text-lg text-green-600">
                            {formatCurrency(account.total_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Transaksi:</span>
                          <span className="font-semibold">{account.transaction_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {accountSummary.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada data income untuk periode ini</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Transactions List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Daftar Transaksi
          </h3>
          <div className="bg-white rounded-lg shadow-sm">
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>{transaction.account_name}</span>
                          <span className="mx-2">•</span>
                          <span>{transaction.category_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada transaksi untuk periode ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceTransactions;
