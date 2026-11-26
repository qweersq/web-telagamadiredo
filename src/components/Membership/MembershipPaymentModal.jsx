import React, { useState, useEffect } from 'react';
import { X, CreditCard, QrCode, Building2, CheckCircle } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';
import { getFinanceAccounts } from '../../pages/FINANCE/api/financeApi';
import { getUserProfile, getActiveShiftId } from '../../utils/userProfileHelper';
import { createMembershipPayment } from '../../pages/MEMBERSHIP/api/membershipApi';
import { formatCurrency, formatNumber, getPaymentMethodIcon } from '../../utils/labelFormatter';

const MembershipPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError,
  membership, 
  customer,
  membershipPrice 
}) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user data and finance accounts
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        
        // Load user data
        const profile = await getUserProfile();
        setUserData(profile);
        
        // Load finance accounts (only active ones)
        const accounts = await getFinanceAccounts();
        const activeAccounts = accounts.filter(account => account.is_active);
        setFinanceAccounts(activeAccounts);
        
        console.log('✅ MembershipPaymentModal - Data loaded:', {
          userData: profile,
          accounts: activeAccounts.length
        });
      } catch (error) {
        console.error('❌ MembershipPaymentModal - Error loading data:', error);
        setError('Gagal memuat data akun keuangan');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAccount(null);
      setAmount('');
      setNotes('');
      setError('');
      setIsSubmitting(false);
    } else if (membershipPrice) {
      // Set amount to membership price by default
      const numericPrice = typeof membershipPrice === 'number' ? membershipPrice : parseFloat(membershipPrice) || 0;
      setAmount(formatNumberInput(numericPrice.toString()));
    }
  }, [isOpen, membershipPrice]);

  // Helper function untuk format angka dengan titik untuk input
  const formatNumberInput = (value) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function untuk parse angka dari format yang sudah diformat
  const parseNumber = (formattedValue) => {
    return parseInt(formattedValue.replace(/\./g, ''), 10) || 0;
  };

  // Get account type icon - simplified without dollar icon
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
        return <CreditCard className="w-4 h-4" />; // Default to credit card instead of dollar
    }
  };

  // Get account type color
  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'bank':
        return 'border-blue-200 bg-blue-50 ';
      case 'cash':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'qris':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  // Handle membership payment
  const handleMembershipPayment = async () => {
    const numericAmount = parseNumber(amount);
    
    console.log('🔍 MembershipPaymentModal - handleMembershipPayment called');
    console.log('🔍 MembershipPaymentModal - membership:', membership);
    console.log('🔍 MembershipPaymentModal - customer:', customer);
    console.log('🔍 MembershipPaymentModal - selectedAccount:', selectedAccount);
    console.log('🔍 MembershipPaymentModal - amount:', numericAmount);
    
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
      console.error('❌ MembershipPaymentModal - Error getting active shift:', error);
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

      // Get active shift ID and user profile for branch_id (already validated above)
      const activeShiftId = await getActiveShiftId();
      const profile = await getUserProfile();

      // Prepare payment data sesuai dengan API
      const paymentData = {
        customer_id: customer.id,
        membership_id: membership.id,
        payment_method_id: selectedAccount.payment_method_id || selectedAccount.payment_method?.id || 1,
        finance_account_id: selectedAccount.id,
        finance_category_id: 1, // Default income category
        shift_id: activeShiftId,
        branch_id: profile.branch?.id || null, // Add branch_id from user profile
        amount: numericAmount,
        notes: notes || `Membership ${membership.name} - ${customer.name}`
      };

      console.log('🔍 MembershipPaymentModal - Sending payment data:', paymentData);

      // Call API
      const result = await createMembershipPayment(paymentData);
      
      console.log('✅ MembershipPaymentModal - Payment successful:', result);

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Close modal
      onClose();

    } catch (error) {
      console.error('❌ MembershipPaymentModal - Payment failed:', error);
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 font-montserrat">Pembayaran Membership</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="px-6 py-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-4">
          {/* Membership Info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-600 font-montserrat">Pelanggan</span>
              <span className="font-semibold  font-montserrat">{customer?.name}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-600 font-montserrat">Membership</span>
              <span className="font-semibold  font-montserrat">{membership?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 font-montserrat">Harga</span>
              <span className="font-bold  font-montserrat">
                {formatCurrency(membershipPrice || 0)}
              </span>
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
                    onClick={() => {
                      console.log('🔍 MembershipPaymentModal - Account clicked:', account);
                      setSelectedAccount(account);
                    }}
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
                          <div className="text-sm font-semibold font-montserrat flex-1">
                            {account.payment_method?.type.toUpperCase()}
                          </div>
                          <div className="text-xs font-montserrat flex-1">
                            {account.name}
                          </div>
                        </div>
                      {selectedAccount?.id === account.id && (
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {financeAccounts.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold font-montserrat">Tidak ada akun keuangan tersedia</p>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold  mb-1 font-montserrat">
              Nominal Pembayaran
            </label>
            <input
              type="text"
              value={formatNumberInput(amount)}
              onChange={(e) => {
                const formattedValue = formatNumberInput(e.target.value);
                setAmount(formattedValue);
                setError(''); // Clear error when user types
              }}
              disabled={isSubmitting}
              className="w-full border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
              placeholder="Masukkan nominal"
            />
            <div className="mt-1 space-y-1">
              <p className="text-xs text-gray-600 font-montserrat">
                Harga membership: {formatCurrency(membershipPrice || 0)}
              </p>
              {amount && (
                <div className="text-xs font-montserrat">
                  {(() => {
                    const numericAmount = parseNumber(amount);
                    const membershipPrice = parseFloat(membership.price) || 0;
                    const difference = numericAmount - membershipPrice;
                    
                    if (numericAmount === membershipPrice) {
                      return <span className="text-green-600">✓ Nominal sesuai harga membership</span>;
                    } else if (numericAmount < membershipPrice) {
                      return <span className="text-red-600">⚠ Kurang {formatCurrency(Math.abs(difference))}</span>;
                    } else {
                      return <span className="text-red-600">⚠ Lebih {formatCurrency(difference)} (tidak diperbolehkan)</span>;
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-montserrat">{error}</p>
            </div>
          )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
          <div className="flex gap-3">
            <AnimatedButton
              variant="grey"
              className="flex-1 py-3 text-sm font-semibold"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </AnimatedButton>
            <AnimatedButton
              variant="blue"
              className="flex-1 py-3 text-sm font-semibold"
              onClick={handleMembershipPayment}
              disabled={!selectedAccount || !amount || loading || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Bayar Membership'
              )}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPaymentModal;
