import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, CheckCircle, AlertCircle } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { createTransfer, getFinanceAccounts } from '../api/financeApi';
import { formatNumberInput, parseNumberInput } from '../../../utils/numberInputHelper';
import instance from '../../../config/api';

const FinanceTransferModal = ({ isOpen, onClose, accounts, onSuccess }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [freshAccounts, setFreshAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [branches, setBranches] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: ''
  });
  const [displayAmount, setDisplayAmount] = useState('');

  // Fetch fresh accounts data when modal opens
  const fetchFreshAccounts = async () => {
    try {
      setLoadingAccounts(true);
      
      // tenant_id is automatically taken from JWT token on backend
      const accountsData = await getFinanceAccounts(null, true); // branchId, isActive
      
      // Map the data to match the expected format
      const mappedAccounts = accountsData.map(acc => ({
        account_id: acc.id,
        account_name: acc.name,
        payment_method_name: acc.payment_method?.name || 'Unknown',
        total_amount: parseFloat(acc.balance),
        transaction_count: 0,
        is_global: acc.is_global,
        branch_id: acc.branch_id
      }));
      
      // Sort accounts: Global accounts first, then branch-specific accounts
      // Within each group, sort by name alphabetically
      const sortedAccounts = [...mappedAccounts].sort((a, b) => {
        // First, sort by global status (global accounts first)
        if (a.is_global && !b.is_global) return -1;
        if (!a.is_global && b.is_global) return 1;
        
        // If both are same type (both global or both branch-specific), sort by name
        return a.account_name.localeCompare(b.account_name);
      });
      
      setFreshAccounts(sortedAccounts);
    } catch (error) {
      // Fallback to original accounts if fetch fails
      setFreshAccounts(accounts || []);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch branches for name resolution
  const fetchBranches = async () => {
    try {
      const { data } = await instance.get('/branches');
      setBranches(data.data || []);
    } catch (error) {
      setBranches([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      
      // Fetch fresh accounts and branches when modal opens
      fetchFreshAccounts();
      fetchBranches();
      
      setTimeout(() => {
        setShowModal(true);
      }, 100);
    } else {
      setShowModal(false);
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setShowOverlay(false);
        setError(null);
        setFormData({
          from_account_id: '',
          to_account_id: '',
          amount: '',
          description: ''
        });
        setDisplayAmount('');
        setFreshAccounts([]);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Handle amount input with thousand separator formatting
      const formattedValue = formatNumberInput(value);
      const numericValue = parseNumberInput(formattedValue);
      
      setDisplayAmount(formattedValue);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getAccountName = (accountId) => {
    const account = freshAccounts.find(acc => acc.account_id === parseInt(accountId));
    return account ? account.account_name : 'Unknown Account';
  };

  const getAccountBalance = (accountId) => {
    const account = freshAccounts.find(acc => acc.account_id === parseInt(accountId));
    return account ? account.total_amount : 0;
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.from_account_id || !formData.to_account_id || !formData.amount) {
      setError('Semua field wajib diisi');
      return;
    }

    if (formData.from_account_id === formData.to_account_id) {
      setError('Akun sumber dan tujuan tidak boleh sama');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    const fromBalance = getAccountBalance(formData.from_account_id);
    if (parseFloat(formData.amount) > fromBalance) {
      setError(`Saldo tidak mencukupi. Saldo tersedia: ${formatCurrency(fromBalance)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const transferPayload = {
        from_account_id: parseInt(formData.from_account_id),
        to_account_id: parseInt(formData.to_account_id),
        amount: parseFloat(formData.amount),
        description: formData.description || `Transfer dari ${getAccountName(formData.from_account_id)} ke ${getAccountName(formData.to_account_id)}`
      };

      const result = await createTransfer(transferPayload);

      setTransferResult(result);
      setShowSuccessModal(true);
      
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal melakukan transfer. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess(transferResult);
    }
    onClose();
  };

  if (!showOverlay) return null;

  return (
    <>
      {/* Transfer Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}
      >
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            showModal ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        
        <div 
          className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] transition-all duration-300 ${
            showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Header - Modern */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 font-montserrat">Transfer Saldo</h2>
                <p className="text-sm text-gray-600">Transfer dana antar akun keuangan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Content - Modern */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div 
              className="p-6 space-y-6 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
            {/* From Account */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                Dari Akun *
              </label>
              <select
                name="from_account_id"
                value={formData.from_account_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200"
                required
              >
                <option value="">Pilih akun sumber</option>
                {loadingAccounts ? (
                  <option disabled>Loading accounts...</option>
                ) : (
                  freshAccounts.map((account) => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.account_name} - {formatCurrency(account.total_amount)}
                      {account.is_global ? ' (Global)' : account.branch_id ? ` (${getBranchName(account.branch_id)})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                Ke Akun *
              </label>
              <select
                name="to_account_id"
                value={formData.to_account_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200"
                required
              >
                <option value="">Pilih akun tujuan</option>
                {loadingAccounts ? (
                  <option disabled>Loading accounts...</option>
                ) : (
                  freshAccounts
                    .filter(account => account.account_id !== parseInt(formData.from_account_id))
                    .map((account) => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.account_name} - {formatCurrency(account.total_amount)}
                        {account.is_global ? ' (Global)' : account.branch_id ? ` (${getBranchName(account.branch_id)})` : ''}
                      </option>
                    ))
                )}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                Nominal *
              </label>
              <input
                type="text"
                name="amount"
                value={displayAmount}
                onChange={handleInputChange}
                placeholder="Masukkan nominal transfer"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200"
                required
              />
              {formData.from_account_id && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    Saldo tersedia: {formatCurrency(getAccountBalance(formData.from_account_id))}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Keterangan transfer (opsional)"
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700 font-medium font-montserrat">{error}</p>
                </div>
              </div>
            )}
            </div>

            {/* Footer - Modern */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <AnimatedButton
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                disabled={loading}
                className={`flex-1 px-8 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  'Transfer'
                )}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && transferResult && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(2rem, env(safe-area-inset-left))',
            paddingRight: 'max(2rem, env(safe-area-inset-right))'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleSuccessClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 font-montserrat">Transfer Berhasil!</h3>
                <p className="text-sm text-gray-600 mt-1">Transfer dana telah berhasil dilakukan</p>
              </div>
            </div>
            
            {/* Content */}
            <div 
              className="p-6 space-y-4 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Dari Akun</span>
                  <span className="text-sm font-semibold text-gray-800">{transferResult.from_account.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Ke Akun</span>
                  <span className="text-sm font-semibold text-gray-800">{transferResult.to_account.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Nominal</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(transferResult.amount)}</span>
                </div>
                {transferResult.description && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">Deskripsi</span>
                    <span className="text-sm text-gray-800 text-right max-w-48">{transferResult.description}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <AnimatedButton
                onClick={handleSuccessClose}
                className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-semibold shadow-lg hover:shadow-xl"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinanceTransferModal;
