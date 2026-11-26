import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Building2, Trash2, Plus, Tag, FileText, Coins, X, Info, AlertCircle } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';
import AddPaymentModal from './AddPaymentModal';
import PointsExplanationModal from '../Modal/PointsExplanationModal';
import { getPaymentMethodIcon, calculatePaymentStatus, formatPaymentStatus, getPaymentStatusColors, formatNumber, formatCurrency } from '../../utils/labelFormatter';
import instance from '../../config/api';

// Format tanggal Indonesia dengan hari
const formatPaymentDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

const QuickOrderPaymentInput = ({
  payments = [],
  setPayments,
  total = 0,
  paid = 0,
  change = 0,
  minDP = 0,
  onValidationChange,
  subtotal = 0,
  paymentDiscountAmount = 0,
  paymentDiscount = null,
  notes = '',
  onDiscountClick = null,
  onRemoveDiscount = null,
  onNotesClick = null,
  customerPoints = 0,
  pointsToRedeem = 0,
  pointsDiscountAmount = 0,
  onPointsRedeemChange = null,
  customer = null, // Customer object untuk cek total_orders
  referredByPhone = null, // Referral phone untuk cek bonus referral
  referralBonusNewCustomer = 0, // Bonus referral untuk customer baru (dari points settings)
  firstOrderBonus = 0, // Bonus untuk order pertama tanpa referral (dari points settings)
  firstOrderBonusEnabled = true // Flag enable/disable first order bonus (dari points settings)
}) => {
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [showPointsExplanation, setShowPointsExplanation] = useState(false);
  const [pointsSettings, setPointsSettings] = useState({ enabled: false, redeem_rate: 50, min_redeem: 100, earn_rate: 1000 }); // Default: disabled, 50 (100 poin = Rp 5.000), min_redeem: 100, earn_rate: 1000

  // Reset checkbox jika pointsToRedeem di-reset dari luar (misal customer berubah)
  React.useEffect(() => {
    if (pointsToRedeem === 0) {
      setUsePoints(false);
    }
  }, [pointsToRedeem]);

  // Fetch points settings
  useEffect(() => {
    const fetchPointsSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/points-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const apiData = response.data.data;
          setPointsSettings({
            enabled: apiData.enabled !== undefined ? Boolean(apiData.enabled) : false,
            redeem_rate: apiData.redeem_rate !== undefined ? apiData.redeem_rate : 50,
            min_redeem: apiData.min_redeem !== undefined ? Number(apiData.min_redeem) : 100,
            earn_rate: apiData.earn_rate !== undefined ? Number(apiData.earn_rate) : 1000,
            referral_bonus_new_customer: apiData.referral_bonus_new_customer !== undefined ? Number(apiData.referral_bonus_new_customer) : 0,
            first_order_bonus: apiData.first_order_bonus !== undefined ? Number(apiData.first_order_bonus) : (apiData.referral_bonus_new_customer !== undefined ? Number(apiData.referral_bonus_new_customer) : 0), // Backward compatibility
            first_order_bonus_enabled: apiData.first_order_bonus_enabled !== undefined ? Boolean(apiData.first_order_bonus_enabled) : true
          });
        }
      } catch (error) {
        console.error('Error fetching points settings:', error);
        // Keep default value
      }
    };

    fetchPointsSettings();
  }, []);

  // Debug logs untuk melihat props yang diterima
  console.log('🔍 QuickOrderPaymentInput - Props received:', {
    payments,
    paymentsLength: payments.length,
    total,
    paid,
    change,
    minDP
  });

  const isLunas = paid >= total;
  const isDPValid = paid >= minDP;

  // Status pembayaran menggunakan labelFormatter
  const paymentStatus = calculatePaymentStatus(paid, total);
  const statusLabel = formatPaymentStatus(paymentStatus);
  const statusColors = getPaymentStatusColors(paymentStatus);

  // Validasi dan info cerdas
  let infoMsg = '';
  let warningMsg = '';
  if (!isLunas && paid < total) {
    infoMsg = `Kurang Rp ${(total - paid).toLocaleString()} untuk lunas`;
  }
  if (!isDPValid) {
    warningMsg = `Kurang Rp ${(minDP - paid).toLocaleString()} untuk mencapai minimal DP 50%`;
  }
  if (paid > total) {
    warningMsg = `Pembayaran melebihi total order, akan ada kembalian`;
  }

  // Handle add payment from modal
  const handleAddPaymentFromModal = (paymentData) => {
    console.log('🔍 QuickOrderPaymentInput - Received paymentData:', paymentData);
    console.log('🔍 QuickOrderPaymentInput - Current payments:', payments);
    console.log('🔍 QuickOrderPaymentInput - PaymentData type:', typeof paymentData);
    console.log('🔍 QuickOrderPaymentInput - PaymentData keys:', Object.keys(paymentData));

    // Transform data dari AddPaymentModal ke format yang diharapkan
    const transformedPayment = {
      method: paymentData.account?.payment_method?.code || 'cash', // ✅ Use payment_method.code
      amount: paymentData.amount,
      account_id: paymentData.account?.id || null,
      account_name: paymentData.account?.name || 'Unknown',
      account_type: paymentData.account?.payment_method?.name || 'General Account', // ✅ Use payment_method.name
      payment_method_id: paymentData.account?.payment_method_id || paymentData.account?.payment_method?.id || null,
      money_received: paymentData.money_received || null, // ✅ NEW: Cash change tracking
      change_amount: paymentData.change_amount || null, // ✅ NEW: Cash change tracking
      evidence_photo: paymentData.evidence_photo || '', // ✅ Bukti bayar (QRIS / transfer)
      // Preserve original data untuk debugging
      account: paymentData.account,
      createdAt: paymentData.createdAt,
      updatedAt: paymentData.updatedAt,
    };

    console.log('🔍 QuickOrderPaymentInput - Transformed payment:', transformedPayment);

    const newPayments = [...payments, transformedPayment];
    console.log('🔍 QuickOrderPaymentInput - New payments array:', newPayments);

    setPayments(newPayments);
  };

  // Hapus histori pembayaran
  const handleRemovePayment = (idx) => {
    setPayments(payments.filter((_, i) => i !== idx));
  };

  // Helper function untuk mendapatkan icon berdasarkan method - simplified without dollar icon
  const getPaymentIcon = (method) => {
    const iconName = getPaymentMethodIcon(method);
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

  // Helper function untuk mendapatkan label berdasarkan method
  const getPaymentLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'qris':
        return 'QRIS';
      case 'bank':
      case 'transfer':
        return 'Transfer';
      default:
        return method;
    }
  };

  // Validasi ke parent — fleksibel seperti mobile (tidak blokir submit)
  React.useEffect(() => {
    if (onValidationChange) {
      const isValid = true; // ✅ FIX: Selalu valid, tidak wajib lunas (bisa DP atau unpaid)
      const errors = {};
      const warnings = {};
      if (paid > total) warnings.overpayment = 'Pembayaran melebihi total order, akan ada kembalian';
      onValidationChange(isValid, errors, warnings);
    }
  }, [paid, total, payments, onValidationChange]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-bold font-montserrat mb-4">Pembayaran</h2>

        {/* Total Tagihan dengan breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-telaga-900/70 font-montserrat">Subtotal</span>
            <span className="font-montserrat">Rp {subtotal.toLocaleString()}</span>
          </div>
          {paymentDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-telaga-900/70 font-montserrat">
                Potongan Diskon
              </span>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-montserrat font-semibold">- Rp {paymentDiscountAmount.toLocaleString()}</span>
                {onRemoveDiscount && (
                  <button
                    type="button"
                    onClick={onRemoveDiscount}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Hapus Diskon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
          {pointsDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-telaga-900/70 font-montserrat">
                Potongan Poin
              </span>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-montserrat font-semibold">- Rp {pointsDiscountAmount.toLocaleString()}</span>
                {onPointsRedeemChange && (
                  <button
                    type="button"
                    onClick={() => onPointsRedeemChange(0)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Hapus Potongan Poin"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Catatan Pembayaran */}
          {notes && (
            <div className="pt-2 border-t border-telaga-100">
              <div className="flex items-start gap-2">
                {/* <FileText className="w-3.5 h-3.5 text-telaga-900/70 mt-0.5 flex-shrink-0" /> */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-telaga-900/70 mb-1 font-montserrat">Catatan</p>
                  <p className="text-xs text-telaga-900 font-montserrat whitespace-pre-wrap">{notes}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-telaga-100">
            <span className="font-semibold text-telaga-900/70 font-montserrat">Total Tagihan</span>
            <span className="font-bold text-lg font-montserrat">Rp {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Poin yang akan didapat - Tampilkan jika points enabled */}
        {pointsSettings.enabled && (() => {
          // Hitung finalTotal (setelah semua diskon)
          const finalTotal = Math.max(0, subtotal - paymentDiscountAmount - pointsDiscountAmount);
          const earnRate = pointsSettings.earn_rate || 1000;

          // ✅ FIX: Selaraskan dengan mobile — "Poin Didapat" hanya saat lunas (paid >= total)
          // Saat DP atau belum bayar → "Poin Menunggu" dari finalTotal
          let pointsEarned = 0;
          let pointsLabel = '';
          const isFullyPaid = paid >= total && total > 0;
          if (isFullyPaid && paid > 0) {
            pointsEarned = Math.floor(paid / earnRate);
            pointsLabel = 'Poin Didapat';
          } else if (finalTotal > 0) {
            pointsEarned = Math.floor(finalTotal / earnRate);
            pointsLabel = 'Poin Menunggu';
          }

          // Cek bonus poin
          const isNewCustomer = customer?.total_orders === 0 || customer?.total_orders === undefined;
          const hasReferral = referredByPhone != null && referredByPhone !== '';

          // ✅ First Order Bonus: selalu diberikan jika customer baru dan enabled (baik ada referral maupun tidak)
          const firstOrderBonusAmount = (isNewCustomer && firstOrderBonusEnabled)
            ? (pointsSettings.first_order_bonus !== undefined ? pointsSettings.first_order_bonus : (firstOrderBonus || 0))
            : 0;

          // ✅ Referral Bonus: hanya jika customer baru dan ada referral (bisa dapat bersamaan dengan First Order Bonus)
          const referralBonusAmount = (isNewCustomer && hasReferral)
            ? (pointsSettings.referral_bonus_new_customer !== undefined ? pointsSettings.referral_bonus_new_customer : (referralBonusNewCustomer || 0))
            : 0;

          // Total poin yang akan didapat
          const totalPointsEarned = pointsEarned + firstOrderBonusAmount + referralBonusAmount;

          // Debug log (bisa dihapus setelah fix)
          console.log('🔍 QuickOrderPaymentInput - Bonus Calculation:', {
            isNewCustomer,
            hasReferral,
            firstOrderBonusEnabled,
            earnRate,
            finalTotal,
            paid,
            pointsEarned,
            pointsLabel,
            pointsSettings_first_order_bonus: pointsSettings.first_order_bonus,
            firstOrderBonus_prop: firstOrderBonus,
            firstOrderBonusAmount,
            pointsSettings_referral_bonus_new_customer: pointsSettings.referral_bonus_new_customer,
            referralBonusNewCustomer_prop: referralBonusNewCustomer,
            referralBonusAmount,
            totalPointsEarned,
            willShowPointsEarned: pointsEarned > 0,
            willShowFirstOrderBonus: firstOrderBonusAmount > 0,
            willShowReferralBonus: referralBonusAmount > 0
          });

          // Hanya tampilkan jika ada poin yang akan didapat
          if (totalPointsEarned > 0) {
            return (
              <div className="mb-3 pt-3 border-t border-telaga-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Coins className="w-3.5 h-3.5 text-telaga-900/60" />
                  <span className="text-xs font-medium text-telaga-900/70 font-montserrat">
                    Poin yang akan didapat
                  </span>
                </div>
                <div className="space-y-1.5 pl-5">
                  {/* Poin dari pembayaran */}
                  {pointsEarned > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-telaga-900/60 font-montserrat">{pointsLabel}</span>
                      <span className="text-xs font-semibold text-telaga-900 font-montserrat">
                        +{formatNumber(pointsEarned)}
                      </span>
                    </div>
                  )}

                  {/* Bonus Order Pertama */}
                  {firstOrderBonusAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-telaga-900/60 font-montserrat">Bonus Order Pertama</span>
                      <span className="text-xs font-semibold text-telaga-900 font-montserrat">
                        +{formatNumber(firstOrderBonusAmount)}
                      </span>
                    </div>
                  )}

                  {/* Bonus Referral */}
                  {referralBonusAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-telaga-900/60 font-montserrat">Bonus Referral</span>
                      <span className="text-xs font-semibold text-telaga-900 font-montserrat">
                        +{formatNumber(referralBonusAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Total sudah dibayar */}
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-telaga-900/70 font-montserrat">Total Dibayar</span>
          <span className="font-bold text-lg text-telaga-700 font-montserrat">Rp {paid.toLocaleString()}</span>
        </div>
        {/* Sisa bayar */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-telaga-900/70 font-montserrat">Sisa Bayar</span>
          <span className={`font-bold text-lg px-3 py-1 rounded-full font-montserrat ${total - paid <= 0 ? 'bg-telaga-100 text-telaga-700' : 'bg-red-100 text-red-700'}`}>Rp {(total - paid > 0 ? (total - paid).toLocaleString() : '0')}</span>
        </div>

        {/* Button Tambah Diskon dan Catatan */}
        {!isLunas && (
          <div className="flex gap-2 mb-4">
            {onDiscountClick && (
              <button
                type="button"
                onClick={onDiscountClick}
                className="flex-1 px-3 py-2 text-xs font-semibold text-telaga-700 bg-telaga-50 hover:bg-telaga-100 rounded-lg transition-colors font-montserrat flex items-center justify-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                {paymentDiscount ? 'Edit Diskon' : '+ Diskon'}
              </button>
            )}
            {onNotesClick && (
              <button
                type="button"
                onClick={onNotesClick}
                className="flex-1 px-3 py-2 text-xs font-semibold text-telaga-700 bg-telaga-50 hover:bg-telaga-100 rounded-lg transition-colors font-montserrat flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                {notes ? 'Edit Catatan' : '+ Catatan'}
              </button>
            )}
          </div>
        )}

        {/* Points Redeem Checkbox & Section */}
        {customerPoints > 0 && onPointsRedeemChange && (
          <>
            {!pointsSettings.enabled ? (
              <div className="mb-6 bg-telaga-50/40 border border-telaga-100 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-telaga-900/40 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-telaga-900/70 font-montserrat font-semibold mb-2">
                      SISTEM POIN BELUM DI AKTIFKAN
                    </p>
                    <p className="text-xs text-telaga-900/60 font-montserrat">
                      Silakan setting di menu owner
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Checkbox untuk enable/disable redeem poin - Redesigned */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={usePoints}
                          onChange={(e) => {
                            setUsePoints(e.target.checked);
                            if (!e.target.checked) {
                              // Reset poin jika checkbox di-uncheck
                              onPointsRedeemChange(0);
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${usePoints
                          ? 'bg-senja-600 border-2 border-senja-600 shadow-md'
                          : 'bg-white border-2 border-telaga-600 group-hover:border-senja-500'
                          }`}>
                          {usePoints && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className={`w-4 h-4 transition-colors ${usePoints ? 'text-senja-600' : 'text-telaga-900/40'}`} />
                        <span className={`text-sm font-semibold font-montserrat transition-colors ${usePoints ? 'text-senja-700' : 'text-telaga-900/70'
                          }`}>
                          Bayar dengan Poin
                        </span>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPointsExplanation(true)}
                      className="p-1.5 text-telaga-900/40 hover:text-senja-600 hover:bg-senja-50 rounded-lg transition-colors"
                      title="Penjelasan Sistem Poin"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Redeem Poin - hanya muncul jika checkbox checked */}
                {usePoints && (() => {
                  // Calculate max points that can be used based on total BEFORE points discount
                  // Use subtotal - paymentDiscountAmount (not total, because total already has points discount)
                  // Max discount from points = totalBeforePointsDiscount (can't exceed this)
                  // Max points = (totalBeforePointsDiscount / (redeem_rate * 100)) * 100 (tidak perlu kelipatan 100)
                  const totalBeforePointsDiscount = subtotal - paymentDiscountAmount; // Total after payment discount, before points discount
                  const maxDiscountFromPoints = totalBeforePointsDiscount; // Can't exceed total before points discount
                  const redeemRateValue = pointsSettings.redeem_rate * 100; // Convert to rupiah per 100 points
                  const maxPointsByTotal = Math.floor((maxDiscountFromPoints / redeemRateValue) * 100); // Max points by total (integer, tidak perlu kelipatan 100)

                  // Max points is minimum of: customerPoints and maxPointsByTotal
                  const minRedeem = pointsSettings.min_redeem || 100;
                  const maxPointsAllowed = Math.min(
                    customerPoints, // Available points (tidak perlu dibulatkan)
                    maxPointsByTotal >= minRedeem ? maxPointsByTotal : 0 // Max by total, min min_redeem
                  );

                  const handleUseAllPoints = () => {
                    if (maxPointsAllowed >= minRedeem) {
                      onPointsRedeemChange(maxPointsAllowed);
                    }
                  };

                  // Calculate remaining points after redeem
                  const remainingPoints = Math.max(0, customerPoints - pointsToRedeem);

                  return (
                    <div className="mb-4 p-3 bg-senja-50 border border-senja-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-senja-600" />
                          <span className="text-sm font-semibold text-telaga-900 font-montserrat">
                            Poin Tersedia: <span className="text-senja-600">{formatNumber(remainingPoints)}</span>
                          </span>
                        </div>
                        {maxPointsAllowed >= (pointsSettings.min_redeem || 100) && pointsToRedeem !== maxPointsAllowed && (
                          <button
                            type="button"
                            onClick={handleUseAllPoints}
                            className="text-xs text-senja-600 hover:text-senja-700 underline font-montserrat"
                          >
                            Pakai Semua
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-telaga-900 font-montserrat">
                          Gunakan Poin (min {formatNumber(pointsSettings.min_redeem || 100)})
                        </label>
                        <input
                          type="number"
                          min={pointsSettings.min_redeem || 100}
                          max={maxPointsAllowed}
                          step="1"
                          value={pointsToRedeem || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;

                            if (inputValue === '' || inputValue === '0') {
                              onPointsRedeemChange(0);
                              return;
                            }

                            // Parse as integer (tidak boleh desimal)
                            const value = parseInt(inputValue) || 0;

                            // ✅ Allow free typing, only cap at max value
                            if (value > maxPointsAllowed) {
                              // If more than allowed, cap to maxPointsAllowed
                              onPointsRedeemChange(maxPointsAllowed);
                            } else {
                              // Accept any value - validation warning shown below
                              onPointsRedeemChange(value);
                            }
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-senja-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-senja-500 focus:border-senja-500"
                        />
                        {pointsToRedeem > 0 && (
                          <div className="text-xs text-telaga-900/70 font-montserrat">
                            <span className="font-semibold">{formatNumber(pointsToRedeem)} poin</span> = potongan{' '}
                            <span className="font-semibold text-senja-600">{formatCurrency(pointsDiscountAmount)}</span>
                          </div>
                        )}
                        {pointsToRedeem > 0 && pointsToRedeem < (pointsSettings.min_redeem || 100) && (
                          <p className="text-xs text-red-600 font-montserrat">Minimum redeem adalah {formatNumber(pointsSettings.min_redeem || 100)} poin</p>
                        )}
                        {pointsToRedeem > maxPointsAllowed && (
                          <p className="text-xs text-red-600 font-montserrat">
                            Maksimal {formatNumber(maxPointsAllowed)} poin (sesuai total pesanan)
                          </p>
                        )}
                        {maxPointsAllowed < customerPoints && (
                          <p className="text-xs text-telaga-900/60 font-montserrat italic">
                            * Maksimal poin dibatasi sesuai total pesanan ({formatCurrency(totalBeforePointsDiscount)})
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* Button untuk menambah pembayaran */}
        {!isLunas && (
          <div className="space-y-4">
            <AnimatedButton
              variant="blue"
              className="w-full py-4 flex items-center justify-center gap-2"
              onClick={() => setShowAddPaymentModal(true)}
            >
              <Plus className="w-5 h-5" />
              <span className="font-montserrat  font-bold">Tambah Pembayaran</span>
            </AnimatedButton>

            {/* Validasi cerdas */}
            {infoMsg && (
              <div className="text-xs  font-montserrat bg-telaga-50 p-3 rounded-lg">{infoMsg}</div>
            )}
            {warningMsg && (
              <div className="text-xs text-senja-700 font-montserrat bg-senja-50 p-3 rounded-lg">{warningMsg}</div>
            )}
          </div>
        )}
        {/* Pesan jika sudah lunas */}
        {isLunas && (
          <div className="bg-telaga-50 border border-telaga-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-telaga-600 font-montserrat">✓</span>
              <div>
                <p className="text-sm font-semibold text-telaga-800 font-montserrat">
                  Order sudah lunas
                </p>
                <p className="text-xs text-telaga-700 font-montserrat">
                  Tidak bisa menambah pembayaran lagi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Payment History */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="font-semibold   mb-2 font-montserrat">Histori Pembayaran</div>
        {payments.length === 0 && <div className="text-xs text-telaga-900/40 font-montserrat">Belum ada pembayaran</div>}
        <div className="space-y-2">
          {payments.map((p, idx) => {
            // console.log(`🔍 QuickOrderPaymentInput - Rendering payment ${idx}:`, p);
            // console.log(`🔍 QuickOrderPaymentInput - Payment ${idx} method:`, p.method);
            // console.log(`🔍 QuickOrderPaymentInput - Payment ${idx} account_name:`, p.account_name);
            // console.log(`🔍 QuickOrderPaymentInput - Payment ${idx} account:`, p.account);

            return (
              <div key={p.id || idx} className="flex items-center justify-between bg-telaga-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getPaymentIcon(p.method)}
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* Tanggal Bayar */}
                    <span className="text-[10px] text-telaga-900/60 font-montserrat">
                      {formatPaymentDate(p.createdAt)}
                    </span>
                    {/* Badge & Amount */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-telaga-100 text-xs font-semibold font-montserrat capitalize">
                        {p.account_name || getPaymentLabel(p.method)}
                      </span>
                      <span className="font-bold text-telaga-800 font-montserrat text-sm">Rp {p.amount.toLocaleString()}</span>
                    </div>
                    {/* ✅ Display money_received and change for cash payments */}
                    {p.money_received && p.money_received > 0 && (
                      <div className="flex flex-col gap-0.5 text-[10px] font-montserrat ml-0.5">
                        <span className="text-telaga-900/60">
                          Diterima: Rp {p.money_received.toLocaleString()}
                        </span>
                        {p.change_amount && p.change_amount > 0 && (
                          <span className="text-telaga-600 font-semibold">
                            Kembalian: Rp {p.change_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                  title="Hapus Pembayaran"
                  onClick={() => handleRemovePayment(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* DP & Status */}
      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <span className="font-semibold text-telaga-900/70 font-montserrat">Total Dibayar</span>
          <span className="font-bold text-lg  font-montserrat">Rp {paid.toLocaleString()}</span>
        </div>
        <div className={`rounded-xl shadow p-4 flex justify-between items-center font-montserrat ${statusColors}`}>
          <span className="font-semibold text-telaga-900/70 font-montserrat">Status</span>
          <span className={`font-bold text-lg px-3 py-1 rounded-full ${statusColors} font-montserrat`}>{statusLabel}</span>
        </div>
        {/* <div className="flex items-center gap-2 justify-end text-xs text-telaga-900/60 font-montserrat">
          <span className="font-montserrat">Minimal DP: </span>
          <span className="px-2 py-1 rounded-full bg-telaga-100  font-semibold font-montserrat">Rp {minDP.toLocaleString()}</span>
        </div> */}
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onAddPayment={handleAddPaymentFromModal}
        total={total || 0}
        paid={paid || 0}
      />

      {/* Points Explanation Modal */}
      <PointsExplanationModal
        isOpen={showPointsExplanation}
        onClose={() => setShowPointsExplanation(false)}
      />
    </div>
  );
};

export default QuickOrderPaymentInput; 