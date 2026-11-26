import React, { useState, useEffect } from 'react';
import { X, CreditCard, QrCode, Building2, CheckCircle, Camera, Trash2 } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';
import { getFinanceAccounts } from '../../pages/FINANCE/api/financeApi';
import { getUserProfile } from '../../utils/userProfileHelper';
import { getPaymentMethodIcon } from '../../utils/labelFormatter';
import { uploadPaymentProof } from '../../utils/uploadHelper';
import { getPhotoUrl } from '../../utils/photoUrlHelper';

const AddPaymentModal = ({ isOpen, onClose, onAddPayment, total = 0, paid = 0 }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [moneyReceived, setMoneyReceived] = useState(''); // ✅ NEW: For cash payments
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [userData, setUserData] = useState(null);

  // ✅ Bukti pembayaran (QRIS / transfer)
  const [proofPhoto, setProofPhoto] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  // Load user data and finance accounts
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      try {
        setLoading(true);

        // Load user data
        const profile = await getUserProfile();
        setUserData(profile);

        // Extract tenant_id and branch_id from profile
        const tenantId = profile?.tenant?.id;
        const branchId = profile?.branch?.id;

        console.log('🔍 AddPaymentModal - Profile data:', {
          tenantId,
          branchId,
          user: profile?.user,
          branch: profile?.branch,
          tenant: profile?.tenant
        });

        // Load finance accounts with branch_id (tenant_id handled by JWT on backend)
        const accounts = await getFinanceAccounts(branchId, true);
        console.log('🔍 AddPaymentModal - Raw accounts response:', accounts);
        console.log('🔍 AddPaymentModal - Accounts type:', typeof accounts);
        console.log('🔍 AddPaymentModal - Accounts length:', accounts?.length);

        const activeAccounts = accounts.filter(account => account.is_active);
        console.log('🔍 AddPaymentModal - Active accounts:', activeAccounts);
        console.log('🔍 AddPaymentModal - Active accounts count:', activeAccounts.length);

        setFinanceAccounts(activeAccounts);

        console.log('✅ AddPaymentModal - Final financeAccounts state:', activeAccounts);
      } catch (error) {
        console.error('❌ AddPaymentModal - Error loading data:', error);
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
      setMoneyReceived('');
      setError('');
      setProofPhoto('');
      setProofPreview('');
      setUploadingProof(false);
    }
  }, [isOpen]);

  // Auto-fill amount when account selected (for cash: auto = sisa bayar)
  useEffect(() => {
    if (selectedAccount) {
      const sisaBayar = (total || 0) - (paid || 0);
      setAmount(formatNumber(sisaBayar.toString()));
      setMoneyReceived(''); // Reset money received
      setError('');
      setProofPhoto('');
      setProofPreview('');
    }
  }, [selectedAccount, total, paid]);

  // Helper function untuk format angka dengan titik
  const formatNumber = (value) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function untuk parse angka dari format yang sudah diformat
  const parseNumber = (formattedValue) => {
    return parseInt(formattedValue.replace(/\./g, ''), 10) || 0;
  };

  // Check if selected account is cash
  const isCashMethod = () => {
    const paymentMethodCode = selectedAccount?.payment_method?.code?.toLowerCase();
    const accountType = selectedAccount?.type?.toLowerCase();
    return paymentMethodCode === 'cash' || accountType === 'cash';
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

  // ✅ Akun ini mewajibkan foto bukti pembayaran?
  const requiresProof = () => !!selectedAccount?.requires_payment_proof;

  const handleProofSelected = async (e) => {
    const file = e.target.files?.[0];
    // reset supaya file yang sama bisa dipilih ulang
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploadingProof(true);
    try {
      const url = await uploadPaymentProof(file);
      setProofPhoto(url);
      setProofPreview(getPhotoUrl(url));
    } catch (err) {
      setError(err.message || 'Gagal upload bukti pembayaran');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setProofPhoto('');
    setProofPreview('');
  };

  // Handle add payment
  const handleAddPayment = () => {
    const numericAmount = parseNumber(amount);
    const numericMoneyReceived = parseNumber(moneyReceived);
    const isCash = isCashMethod();

    console.log('🔍 AddPaymentModal - handleAddPayment called');
    console.log('🔍 AddPaymentModal - selectedAccount:', selectedAccount);
    console.log('🔍 AddPaymentModal - isCash:', isCash);
    console.log('🔍 AddPaymentModal - amount:', amount, 'numeric:', numericAmount);
    console.log('🔍 AddPaymentModal - moneyReceived:', moneyReceived, 'numeric:', numericMoneyReceived);

    if (!selectedAccount) {
      setError('Pilih akun keuangan');
      return;
    }

    if (!amount || numericAmount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    // ✅ Validation for cash: money received required and must be >= amount
    if (isCash) {
      if (!moneyReceived || numericMoneyReceived <= 0) {
        setError('Uang diterima harus diisi');
        return;
      }
      if (numericMoneyReceived < numericAmount) {
        setError('Uang diterima harus lebih besar atau sama dengan total bayar');
        return;
      }
    }

    // ✅ Akun wajib bukti bayar: foto harus sudah diupload
    if (requiresProof() && !proofPhoto) {
      setError('Bukti pembayaran wajib diupload untuk metode ini');
      return;
    }

    // ✅ For cash: calculate change, for non-cash: no change
    const changeAmount = isCash ? numericMoneyReceived - numericAmount : 0;

    const paymentData = {
      account: {
        ...selectedAccount,
        payment_method_id: selectedAccount.payment_method_id || selectedAccount.payment_method?.id || null,
      },
      amount: numericAmount, // ✅ Exact amount to pay
      money_received: isCash ? numericMoneyReceived : null, // ✅ NEW: Money received from customer (cash only)
      change_amount: isCash ? changeAmount : null, // ✅ NEW: Change given to customer (cash only)
      evidence_photo: proofPhoto || '', // ✅ Bukti bayar (QRIS / transfer)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('🔍 AddPaymentModal - Sending paymentData:', paymentData);

    // Add payment
    onAddPayment(paymentData);

    // Close modal
    onClose();
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 font-montserrat">Tambah Pembayaran</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
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
          <div className="space-y-6">
            {/* Total Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-600 font-montserrat">Total Tagihan</span>
                <span className="font-bold text-lg  font-montserrat">Rp {((total || 0)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-600 font-montserrat">Sudah Dibayar</span>
                <span className="font-bold text-lg text-green-700 font-montserrat">Rp {((paid || 0)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600 font-montserrat">Sisa Bayar</span>
                <span className="font-bold text-lg text-red-700 font-montserrat">Rp {((total || 0) - (paid || 0)).toLocaleString('id-ID')}</span>
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
                  {financeAccounts.map((account, idx) => {
                    console.log(`🔍 AddPaymentModal - Rendering account ${idx}:`, account);
                    return (
                      <button
                        key={account.id}
                        onClick={() => {
                          console.log('🔍 AddPaymentModal - Account clicked:', account);
                          setSelectedAccount(account);
                        }}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedAccount?.id === account.id
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
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
                            {account.requires_payment_proof && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                                <Camera className="w-3 h-3" />
                                wajib bukti
                              </span>
                            )}
                          </div>
                          {selectedAccount?.id === account.id && (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {financeAccounts.length === 0 && !loading && (
                <div className="text-center py-6 text-gray-500">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-montserrat">Tidak ada akun keuangan tersedia</p>
                </div>
              )}
            </div>

            {/* Amount Input - Conditional for Cash/Non-Cash */}
            {selectedAccount && isCashMethod() ? (
              // ✅ CASH METHOD: Two inputs (Total Bayar + Uang Diterima)
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1 font-montserrat">
                    Total Bayar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(amount)}
                      onChange={(e) => {
                        const formattedValue = formatNumber(e.target.value);
                        setAmount(formattedValue);
                        setError('');
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                      placeholder="Total yang harus dibayar"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const sisaBayar = (total || 0) - (paid || 0);
                        setAmount(formatNumber(sisaBayar.toString()));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
                    >
                      Penuhi
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-montserrat">
                    Sisa tagihan yang perlu dibayar
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 font-montserrat text-green-700">
                    Uang Diterima 💵
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumber(moneyReceived)}
                    onChange={(e) => {
                      const formattedValue = formatNumber(e.target.value);
                      setMoneyReceived(formattedValue);
                      setError('');
                    }}
                    className="w-full border-2 border-green-200 rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Masukkan uang dari customer"
                  />
                  {moneyReceived && (() => {
                    const numericAmount = parseNumber(amount);
                    const numericMoneyReceived = parseNumber(moneyReceived);
                    const kembalian = Math.max(0, numericMoneyReceived - numericAmount);

                    if (numericMoneyReceived < numericAmount) {
                      return (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-700 text-sm font-semibold font-montserrat">
                            ⚠️ Uang kurang Rp {(numericAmount - numericMoneyReceived).toLocaleString()}
                          </p>
                        </div>
                      );
                    }

                    if (kembalian > 0) {
                      return (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 text-sm font-semibold font-montserrat mb-1">
                            💰 Kembalian: Rp {kembalian.toLocaleString('id-ID')}
                          </p>
                          <p className="text-green-700 text-xs font-montserrat">
                            Berikan kembalian kepada customer
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-blue-700 text-xs font-montserrat">
                          ✅ Uang pas
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : selectedAccount ? (
              // ✅ NON-CASH METHOD: Single input (exact amount)
              <div>
                <label className="block text-sm font-semibold mb-1 font-montserrat">
                  Nominal Pembayaran
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumber(amount)}
                    onChange={(e) => {
                      const formattedValue = formatNumber(e.target.value);
                      setAmount(formattedValue);
                      setError('');
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Masukkan nominal"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sisaBayar = (total || 0) - (paid || 0);
                      setAmount(formatNumber(sisaBayar.toString()));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
                  >
                    Penuhi
                  </button>
                </div>
                {amount && (() => {
                  const numericAmount = parseNumber(amount);
                  const sisaBayar = (total || 0) - (paid || 0);
                  const sisaSetelahInput = Math.max(0, sisaBayar - numericAmount);

                  return (
                    <p className="text-sm text-gray-600 mt-2 font-montserrat">
                      Sisa bayar: Rp {sisaSetelahInput.toLocaleString()}
                    </p>
                  );
                })()}
              </div>
            ) : null}

            {/* Bukti Pembayaran - wajib untuk akun tertentu (QRIS / transfer) */}
            {selectedAccount && requiresProof() && (
              <div>
                <label className="block text-sm font-semibold mb-2 font-montserrat text-amber-700">
                  Bukti Pembayaran *
                </label>

                {proofPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-amber-200">
                    <img
                      src={proofPreview}
                      alt="Bukti pembayaran"
                      className="w-full max-h-56 object-contain bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow hover:bg-white transition-colors"
                      title="Hapus bukti"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                      uploadingProof
                        ? 'border-gray-300 bg-gray-50 cursor-wait'
                        : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofSelected}
                      className="hidden"
                      disabled={uploadingProof}
                    />
                    {uploadingProof ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                        <span className="text-xs text-gray-600 font-montserrat">Mengupload foto...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Camera className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-sm font-semibold text-amber-800 font-montserrat">
                          Upload Bukti Pembayaran
                        </span>
                        <span className="text-xs text-amber-700/80 font-montserrat text-center px-4">
                          Foto / screenshot bukti transfer atau QRIS
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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
            >
              Batal
            </AnimatedButton>
            <AnimatedButton
              variant="blue"
              className="flex-1 py-3 text-sm font-semibold"
              onClick={handleAddPayment}
              disabled={!selectedAccount || !amount || loading || uploadingProof || (selectedAccount?.requires_payment_proof && !proofPhoto)}
            >
              Tambah Pembayaran
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;
