import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import FinanceAccountsExplanationModal from '../../components/Modal/FinanceAccountsExplanationModal';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { formatNumberInput, parseNumberInput, handleNumberInputChange } from '../../utils/numberInputHelper';
import { 
  Plus, 
  Edit, 
  Wallet, 
  CreditCard, 
  Banknote,
  QrCode,
  Search,
  ArrowLeft,
  Filter,
  MapPin,
  Camera
} from 'lucide-react';

const FinanceAccounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]); // Store all accounts for counter
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'inactive'
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    description: '',
    branch_id: null,
    is_active: true,
    payment_method_id: null,
    is_global: false,
    requires_payment_proof: false
  });
  const [displayBalance, setDisplayBalance] = useState('');


  useEffect(() => {
    loadUserData();
    
    // Check if user has seen the explanation modal
    const hasSeenExplanation = localStorage.getItem('finance-accounts-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  useEffect(() => {
    if (userData) {
      fetchBranches(); // Fetch branches first
      fetchAllAccounts(); // Fetch all accounts for counter
      fetchAccounts(); // Fetch accounts for current tab
      fetchPaymentMethods(); // Fetch payment methods
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      fetchAccounts(); // Fetch accounts for current tab
    }
  }, [activeTab, selectedBranchId]);

  useEffect(() => {
    filterAccounts();
  }, [searchTerm, accounts]);

  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);
    } catch (error) {
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await instance.get(`/branches?tenant_id=${userData.tenant.id}`);
      setBranches(data.data || []);
    } catch (error) {
      setBranches([]);
    }
  };

  const fetchAllAccounts = async () => {
    try {
      // tenant_id is automatically taken from JWT token on backend
      // Fetch both active and inactive accounts
      const [activeResponse, inactiveResponse] = await Promise.all([
        instance.get('/finance-accounts?is_active=true'),
        instance.get('/finance-accounts?is_active=false')
      ]);
      
      const allAccountsData = [
        ...(activeResponse.data.data || []),
        ...(inactiveResponse.data.data || [])
      ];
      
      setAllAccounts(allAccountsData);
    } catch (error) {
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data } = await instance.get('/payment-methods');
      setPaymentMethods(data.data || []);
    } catch (error) {
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      
      const isActive = activeTab === 'active';
      
      // tenant_id is automatically taken from JWT token on backend
      // Add branch filter if selected
      const branchParam = selectedBranchId ? `&branch_id=${selectedBranchId}` : '';
      
      const url = `/finance-accounts?is_active=${isActive}${branchParam}`;
      
      const { data } = await instance.get(url);
      
      setAccounts(data.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let accountsToFilter = accounts;
    
    if (searchTerm) {
      accountsToFilter = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort accounts: Global accounts first, then branch-specific accounts
    // Within each group, sort by name alphabetically
    const sortedAccounts = [...accountsToFilter].sort((a, b) => {
      // First, sort by global status (global accounts first)
      if (a.is_global && !b.is_global) return -1;
      if (!a.is_global && b.is_global) return 1;
      
      // If both are same type (both global or both branch-specific), sort by name
      return a.name.localeCompare(b.name);
    });
    
    setFilteredAccounts(sortedAccounts);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    
    // ✅ Validasi payment_method_id wajib
    if (!formData.payment_method_id) {
      setError('Payment Method harus dipilih untuk akun keuangan');
      setLoadingAction(false);
      return;
    }
    
    try {
      await instance.post('/finance-accounts', {
        ...formData,
        balance: parseNumberInput(formData.balance) || 0
      });
      setShowCreateModal(false);
      resetForm();
      fetchAllAccounts(); // Update counter
      fetchAccounts();
    } catch (error) {
      
      // Handle validation error from backend
      if (error.response?.data?.error?.message) {
        setError(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Terjadi kesalahan saat membuat akun keuangan');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    
    // ✅ Validasi payment_method_id wajib
    if (!formData.payment_method_id) {
      setError('Payment Method harus dipilih untuk akun keuangan');
      setLoadingAction(false);
      return;
    }
    
    try {
      await instance.put(`/finance-accounts/${selectedAccount.id}`, {
        ...formData,
        balance: parseNumberInput(formData.balance) || 0
      });
      setShowEditModal(false);
      resetForm();
      fetchAllAccounts(); // Update counter
      fetchAccounts();
    } catch (error) {
      
      // Handle validation error from backend
      if (error.response?.data?.error?.message) {
        setError(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Terjadi kesalahan saat mengupdate akun keuangan');
      }
    } finally {
      setLoadingAction(false);
    }
  };



  const handleBalanceChange = (e) => {
    handleNumberInputChange(e, 
      (numericValue) => setFormData(prev => ({ ...prev, balance: numericValue.toString() })),
      setDisplayBalance
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      balance: '',
      description: '',
      branch_id: null,
      is_active: true,
      payment_method_id: null,
      is_global: false,
      requires_payment_proof: false
    });
    setDisplayBalance('');
    setSelectedAccount(null);
    setError('');
  };

  const openEditModal = (account) => {
    setSelectedAccount(account);
    // Parse balance as integer to avoid decimal issues
    const balanceValue = Math.floor(parseFloat(account.balance) || 0);
    const balanceString = balanceValue.toString();
    
    setFormData({
      name: account.name,
      balance: balanceString,
      description: account.description || '',
      branch_id: account.branch_id,
      is_active: account.is_active,
      payment_method_id: account.payment_method_id || null,
      is_global: account.is_global,
      requires_payment_proof: !!account.requires_payment_proof
    });
    // Use the imported formatNumberInput function
    setDisplayBalance(formatNumberInput(balanceString));
    setError('');
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm(); // Reset form before opening create modal
    setShowCreateModal(true);
  };

  const handleToggleStatus = async (account) => {
    try {
      setLoadingAction(true);
      
      // Parse balance as integer to avoid decimal issues
      const balanceValue = Math.floor(parseFloat(account.balance) || 0);
      
      // Prepare payload with all account data, just toggle the is_active status
      const payload = {
        name: account.name,
        balance: balanceValue,
        description: account.description || '',
        branch_id: account.branch_id,
        is_active: !account.is_active, // Toggle the status
        payment_method_id: account.payment_method_id || null,
        is_global: account.is_global,
        requires_payment_proof: !!account.requires_payment_proof
      };
      
      await instance.put(`/finance-accounts/${account.id}`, payload);
      fetchAllAccounts(); // Update counter
      fetchAccounts(); // Refresh current list
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Gagal mengubah status akun';
      alert(errorMessage);
    } finally {
      setLoadingAction(false);
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle explanation modal confirmation
  const handleExplanationConfirm = () => {
    localStorage.setItem('finance-accounts-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  // Handle explanation modal close
  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBerandaOwner 
        title="Akun & Pembayaran"
        description="Kelola akun keuangan dan pembayaran"
        showBackButton={true}
        backPath="/berandaowner"
        showLogout={true}
        showUserMenu={true}
      />

      <div className="p-4 md:p-6 mt-[50px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* <div>
              <h1 className="text-lg font-semibold font-bold text-gray-800 mb-2">
                Akun Keuangan
              </h1>
              <p className="text-gray-600">
                Kelola akun keuangan dan saldo
              </p>
            </div> */}
            
          </div>
        </div>


        {/* Action Buttons - Tokopedia Style */}
        <div className="mb-6 flex gap-3">
          {/* Add Account Button - Primary */}
          <button
            onClick={openCreateModal}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </div>
            <span>Tambah Akun</span>
          </button>
          
          {/* Help Button - Secondary */}
          <button
            onClick={() => setShowExplanationModal(true)}
            className="px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center justify-center"
            title="Bantuan & Panduan Akun"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Summary Info - Tokopedia Style */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white font-montserrat" />
              </div>
              <div>
                <h3 className="font-semibold font-montserrat text-gray-800">Semua Akun Keuangan</h3>
                <p className="text-gray-600 font-montserrat text-sm">{allAccounts.length} akun tersedia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active/Inactive Tabs - Tokopedia Style */}
        <div className="mb-6">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  activeTab === 'active' ? 'bg-white' : 'bg-green-500'
                }`}></div>
                <span>Aktif</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'inactive'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  activeTab === 'inactive' ? 'bg-white' : 'bg-red-500'
                }`}></div>
                <span>Tidak Aktif</span>
              </div>
            </button>
          </div>
        </div>

        {/* Branch Filter - Tokopedia Style */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter Cabang
              </label>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
              >
                <option value="">Semua Cabang</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search - Tokopedia Style */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari akun keuangan, nama, atau metode pembayaran..."
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
                {filteredAccounts.length} akun ditemukan
              </div>
            </div>
          )}
        </div>

        {/* Accounts List - Tokopedia Style */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-3xl">⏳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Memuat Akun Keuangan
              </h3>
              <p className="text-gray-500 text-sm">
                Mohon tunggu sebentar...
              </p>
            </div>
          ) : filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => (
              <div key={account.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {account.name}
                    </h3>
                    {account.requires_payment_proof && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold font-montserrat">
                        <Camera className="w-3 h-3" />
                        Wajib Bukti
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    Rp {parseInt(account.balance || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(account)}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(account)}
                    disabled={loadingAction}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                      account.is_active
                        ? 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'
                        : 'text-green-600 bg-green-50 border border-green-200 hover:bg-green-100'
                    }`}
                    title={account.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {account.is_active ? (
                      <>
                        <span className="w-4 h-4 text-sm">❌</span>
                        Nonaktif
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 text-sm">✅</span>
                        Aktifkan
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-3xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'active' 
                  ? 'Belum ada akun aktif' 
                  : 'Belum ada akun tidak aktif'
                }
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {activeTab === 'active' 
                  ? 'Tambahkan akun keuangan pertama Anda' 
                  : 'Tidak ada akun yang dinonaktifkan'
                }
              </p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors duration-200"
              >
                Tambah Akun
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header - Modern */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 font-montserrat">Tambah Akun Keuangan</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Error Display - Modern */}
            {error && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">⚠</span>
                  </div>
                  <p className="text-sm text-red-700 font-medium font-montserrat">
                    {error}
                  </p>
                </div>
              </div>
            )}
            
            {/* Content - Modern */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Nama Pembayaran *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    placeholder="Contoh: QRIS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method_id || ''}
                    onChange={(e) => setFormData({...formData, payment_method_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    required
                  >
                    <option value="">Pilih Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} ({method.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_payment_proof}
                      onChange={(e) => setFormData({ ...formData, requires_payment_proof: e.target.checked })}
                      className="w-5 h-5 mt-0.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-left">
                      <span className="block text-sm font-semibold text-gray-700 font-montserrat">
                        Wajib Upload Bukti Pembayaran
                      </span>
                      <span className="block text-xs text-gray-500 mt-1 font-montserrat">
                        Kasir wajib melampirkan foto bukti transfer/QRIS sebelum pembayaran disimpan. Cocok untuk QRIS &amp; Transfer Bank.
                      </span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Jenis Akun
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="account_type"
                        checked={formData.is_global}
                        onChange={(e) => setFormData({...formData, is_global: true, branch_id: null})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 font-montserrat">
                        Global (untuk semua cabang)
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="account_type"
                        checked={!formData.is_global}
                        onChange={(e) => setFormData({...formData, is_global: false})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 font-montserrat">
                        Spesifik Cabang
                      </span>
                    </label>
                  </div>
                </div>

                {!formData.is_global && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                      Cabang *
                    </label>
                    <select
                      value={formData.branch_id || ''}
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                      required={!formData.is_global}
                    >
                      <option value="">Pilih Cabang</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Saldo Awal
                  </label>
                  <input
                    type="text"
                    value={displayBalance}
                    onChange={handleBalanceChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    placeholder="Deskripsi akun (opsional)"
                    rows="3"
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 font-montserrat">
                      Akun Aktif (dapat digunakan untuk transaksi)
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Footer - Modern */}
            <div className="flex items-center justify-between p-6 border-t-2 border-gray-100 bg-gray-50 flex-shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-sm text-gray-600 hover:text-gray-800 font-montserrat hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                disabled={loadingAction}
                className={`px-8 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 font-montserrat shadow-lg hover:shadow-xl transition-all duration-200 ${
                  loadingAction 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {loadingAction ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAccount && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header - Modern */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Edit Akun Keuangan</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Error Display - Modern */}
            {error && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">⚠</span>
                  </div>
                  <p className="text-sm text-red-700 font-medium font-montserrat">
                    {error}
                  </p>
                </div>
              </div>
            )}
            
            {/* Content - Modern */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <form onSubmit={handleEdit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Nama Akun *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    placeholder="Contoh: Kas Utama"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method_id || ''}
                    onChange={(e) => setFormData({...formData, payment_method_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    required
                  >
                    <option value="">Pilih Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} ({method.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_payment_proof}
                      onChange={(e) => setFormData({ ...formData, requires_payment_proof: e.target.checked })}
                      className="w-5 h-5 mt-0.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-left">
                      <span className="block text-sm font-semibold text-gray-700 font-montserrat">
                        Wajib Upload Bukti Pembayaran
                      </span>
                      <span className="block text-xs text-gray-500 mt-1 font-montserrat">
                        Kasir wajib melampirkan foto bukti transfer/QRIS sebelum pembayaran disimpan. Cocok untuk QRIS &amp; Transfer Bank.
                      </span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Jenis Akun
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="account_type_edit"
                        checked={formData.is_global}
                        onChange={(e) => setFormData({...formData, is_global: true, branch_id: null})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 font-montserrat">
                        Global (untuk semua cabang)
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="account_type_edit"
                        checked={!formData.is_global}
                        onChange={(e) => setFormData({...formData, is_global: false})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 font-montserrat">
                        Spesifik Cabang
                      </span>
                    </label>
                  </div>
                </div>

                {!formData.is_global && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                      Cabang *
                    </label>
                    <select
                      value={formData.branch_id || ''}
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                      required={!formData.is_global}
                    >
                      <option value="">Pilih Cabang</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Saldo
                  </label>
                  <input
                    type="text"
                    value={displayBalance}
                    onChange={handleBalanceChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium font-montserrat transition-all duration-200"
                    placeholder="Deskripsi akun (opsional)"
                    rows="3"
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 font-montserrat">
                      Akun Aktif (dapat digunakan untuk transaksi)
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Footer - Modern */}
            <div className="flex items-center justify-between p-6 border-t-2 border-gray-100 bg-gray-50 flex-shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 text-sm text-gray-600 hover:text-gray-800 font-montserrat hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleEdit}
                disabled={loadingAction}
                className={`px-8 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 font-montserrat shadow-lg hover:shadow-xl transition-all duration-200 ${
                  loadingAction 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {loadingAction ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengupdate...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <FinanceAccountsExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />
    </div>
  );
};

export default FinanceAccounts;
