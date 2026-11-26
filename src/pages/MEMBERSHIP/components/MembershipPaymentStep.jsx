import React, { useState, useEffect } from 'react';
import { X, CreditCard, QrCode, Building2, AlertCircle } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getFinanceAccounts } from '../../FINANCE/api/financeApi';
import { getUserProfile, getActiveShiftId } from '../../../utils/userProfileHelper';
import { createMembershipPayment } from '../api/membershipApi';
import { formatCurrency, formatNumber, getPaymentMethodIcon } from '../../../utils/labelFormatter';

const MembershipPaymentStep = ({
  customer,
  membership,
  paymentData,
  setPaymentData,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting
}) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [userData, setUserData] = useState(null);

  // Load user data and finance accounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user data
        const profile = await getUserProfile();
        setUserData(profile);
        
        // Load finance accounts (only active ones)
        const accounts = await getFinanceAccounts();
        const activeAccounts = accounts.filter(account => account.is_active);
        setFinanceAccounts(activeAccounts);
        
        // Set selected account if paymentData has one
        if (paymentData.finance_account_id) {
          const account = activeAccounts.find(a => a.id === paymentData.finance_account_id);
          if (account) {
            setSelectedAccount(account);
          }
        }
      } catch (error) {
        console.error('❌ MembershipPaymentStep - Error loading data:', error);
        setError('Gagal memuat data akun keuangan');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set amount from membership price
  useEffect(() => {
    if (membership?.price) {
      const price = parseFloat(membership.price) || 0;
      setAmount(formatNumberInput(price.toString()));
      setPaymentData(prev => ({
        ...prev,
        amount: price.toString()
      }));
    }
  }, [membership]);

  // Helper function untuk format angka dengan titik untuk input
  const formatNumberInput = (value) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function untuk parse angka dari format yang sudah diformat
  const parseNumber = (formattedValue) => {
    return parseInt(formattedValue.replace(/\./g, ''), 10) || 0;
  };

  // Get account type icon
  const getAccountTypeIcon = (type) => {
    const iconName = getPaymentMethodIcon(type);
    switch (iconName) {
      case 'QrCode':
        return <QrCode className="w-4 h-4" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4" />;
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  // Get account type color
  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'bank':
        return 'border-blue-200 bg-blue-50';
      case 'cash':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'qris':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatNumberInput(value);
    setAmount(formatted);
    const numeric = parseNumber(formatted);
    setPaymentData(prev => ({
      ...prev,
      amount: numeric.toString()
    }));
  };

  // Handle account select
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setPaymentData(prev => ({
      ...prev,
      finance_account_id: account.id
    }));
  };

  // Handle submit payment
  const handleSubmit = async () => {
    const numericAmount = parseNumber(amount);
    
    if (!selectedAccount) {
      setError('Pilih akun keuangan');
      return;
    }
    
    if (!amount || numericAmount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    if (!membership || !customer) {
      setError('Data membership atau customer tidak valid');
      return;
    }

    // Validate shift is active
    try {
      const activeShiftId = await getActiveShiftId();
      if (!activeShiftId) {
        setError('Shift harus dibuka terlebih dahulu untuk melakukan pembayaran membership. Silakan buka shift di halaman beranda.');
        return;
      }
    } catch (error) {
      console.error('❌ MembershipPaymentStep - Error getting active shift:', error);
      setError('Gagal memvalidasi shift. Pastikan shift sudah dibuka.');
      return;
    }

    // Validate payment amount
    const membershipPrice = parseFloat(membership.price) || 0;
    
    if (numericAmount < membershipPrice) {
      setError(`Nominal pembayaran tidak boleh kurang dari harga membership (${formatCurrency(membershipPrice)})`);
      return;
    }
    
    if (numericAmount > membershipPrice) {
      setError(`Nominal pembayaran tidak boleh lebih dari harga membership (${formatCurrency(membershipPrice)}). Pembayaran lebih tidak diperbolehkan untuk membership.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Get active shift ID and user profile for branch_id
      const activeShiftId = await getActiveShiftId();
      const profile = await getUserProfile();

      // Prepare payment data
      const paymentPayload = {
        customer_id: customer.id,
        membership_id: membership.id,
        payment_method_id: selectedAccount.payment_method_id || selectedAccount.payment_method?.id || 1,
        finance_account_id: selectedAccount.id,
        finance_category_id: 1, // Default income category
        shift_id: activeShiftId,
        branch_id: profile.branch?.id || null,
        amount: numericAmount,
        notes: notes || `Membership ${membership.name} - ${customer.name}`
      };

      console.log('🔍 MembershipPaymentStep - Sending payment data:', paymentPayload);

      // Call API
      const result = await createMembershipPayment(paymentPayload);
      
      console.log('✅ MembershipPaymentStep - Payment successful:', result);

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error) {
      console.error('❌ MembershipPaymentStep - Payment failed:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Gagal memproses pembayaran membership';
      setError(errorMessage);
      
      // Call onError callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const membershipPrice = parseFloat(membership?.price) || 0;

  return (
    <div className="space-y-6">
      {/* Membership Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-8">
        <h3 className="font-semibold text-lg mb-4 text-blue-700 font-montserrat tracking-wide">
          Pembayaran Membership
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 font-montserrat">Pelanggan</span>
            <span className="font-semibold font-montserrat">{customer?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 font-montserrat">Membership</span>
            <span className="font-semibold font-montserrat">{membership?.name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-blue-200">
            <span className="text-sm font-medium text-gray-600 font-montserrat">Harga</span>
            <span className="font-bold text-lg font-montserrat">
              {formatCurrency(membershipPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Selection */}
      <div>
        <label className="block text-sm font-semibold mb-3 font-montserrat text-gray-700">
          Pilih Pembayaran
        </label>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {financeAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountSelect(account)}
                disabled={isSubmitting}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedAccount?.id === account.id
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getAccountTypeIcon(account.type)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm font-montserrat">
                      {account.name}
                    </span>
                    <span className="text-xs text-gray-500 font-montserrat">
                      {account.type === 'cash' ? 'Tunai' : account.type === 'bank' ? 'Bank' : 'QRIS'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-semibold mb-2 font-montserrat text-gray-700">
          Nominal Pembayaran
        </label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          disabled={isSubmitting}
          placeholder="Masukkan nominal"
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-montserrat disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1 font-montserrat">
          Harga membership: {formatCurrency(membershipPrice)}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-montserrat">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <AnimatedButton
        variant="blue"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedAccount || !amount}
        className="w-full py-3 rounded-xl font-semibold font-montserrat text-white"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Memproses...</span>
          </div>
        ) : (
          'Bayar Membership'
        )}
      </AnimatedButton>
    </div>
  );
};

export default MembershipPaymentStep;

