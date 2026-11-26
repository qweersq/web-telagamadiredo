import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { inactiveBillingService } from '../services/inactiveBillingService';

const ChangePlanModal = ({ currentPlan, availablePlans, unpaidBills, tenantStatus, onClose, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null); // Default: Gratis (null = NotaFree)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('Harap pilih paket yang diinginkan');
      return;
    }

    setIsChanging(true);
    setError(null);

    try {
      const response = await inactiveBillingService.changePlan(selectedPlan.id);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Gagal mengubah paket');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      
      // Check if it's authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setError('Terjadi kesalahan saat mengubah paket');
    } finally {
      setIsChanging(false);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName?.toLowerCase()) {
      case 'notalite':
        return '⚡';
      case 'notapro':
        return '⭐';
      case 'notabusiness':
        return '👑';
      default:
        return '💳';
    }
  };

  const getPlanColor = (planName) => {
    switch (planName?.toLowerCase()) {
      case 'notalite':
        return 'from-blue-500 to-blue-600';
      case 'notapro':
        return 'from-purple-500 to-purple-600';
      case 'notabusiness':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Filter plans berdasarkan durasi yang dipilih
  const getFilteredPlans = () => {
    if (!availablePlans || availablePlans.length === 0) return [];
    
    // Jika selectedDuration null, tampilkan NotaFree
    if (selectedDuration === null) {
      return availablePlans.filter(plan => 
        plan.duration_days === 9999 || plan.name === 'NotaFree' || plan.id === 4
      );
    }
    
    // Filter berdasarkan duration_days, exclude NotaFree
    return availablePlans.filter(plan => {
      if (plan.duration_days === 9999 || plan.name === 'NotaFree' || plan.id === 4) return false;
      return plan.duration_days === selectedDuration;
    });
  };

  // Hitung diskon untuk display
  const getDiscountInfo = (plan) => {
    if (plan.duration_days === 30) return null;
    
    // Cari harga bulanan untuk perhitungan diskon
    const monthlyPlan = availablePlans?.find(p => 
      p.name === plan.name && p.duration_days === 30
    );
    
    if (!monthlyPlan) return null;
    
    const monthlyPrice = parseFloat(monthlyPlan.price);
    const totalMonthlyPrice = monthlyPrice * (plan.duration_days / 30);
    const saved = totalMonthlyPrice - parseFloat(plan.price);
    
    // Gunakan diskon tetap sesuai durasi (sesuai branding)
    let discount;
    if (plan.duration_days === 90) {
      discount = 20; // -20% untuk 3 bulan
    } else if (plan.duration_days === 365) {
      discount = 50; // -50% untuk 1 tahun
    } else {
      discount = Math.round(((totalMonthlyPrice - parseFloat(plan.price)) / totalMonthlyPrice) * 100);
    }
    
    return {
      discount: discount,
      saved: Math.round(saved),
      originalPrice: Math.round(totalMonthlyPrice),
      monthlyPrice: Math.round(monthlyPrice)
    };
  };

  // Hitung diskon untuk tab
  const getTabDiscount = (durationDays) => {
    if (durationDays === 30) return null;
    if (durationDays === 90) return 20; // -20%
    if (durationDays === 365) return 50; // -50%
    return null;
  };

  // Format durasi untuk display
  const getDurationLabel = (days) => {
    if (days === 30) return '1 Bulan';
    if (days === 90) return '3 Bulan';
    if (days === 365) return '1 Tahun';
    return `${days} hari`;
  };

  // Format harga per bulan (dibulatkan)
  const getMonthlyPrice = (plan) => {
    if (plan.name === 'NotaFree') return 0;
    const monthlyPrice = parseFloat(plan.price) / (plan.duration_days / 30);
    return Math.round(monthlyPrice);
  };

  const hasUnpaidBills = unpaidBills && unpaidBills.length > 0;
  const isTrialExpired = tenantStatus === 'expired' && !currentPlan;
  const filteredPlans = getFilteredPlans();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {isTrialExpired ? 'Pilih Paket Berlangganan' : 'Ganti Paket Berlangganan'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Current Plan Info - Only show if not trial expired */}
          {currentPlan && !isTrialExpired && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Paket Saat Ini</h4>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${getPlanColor(currentPlan.name)} rounded-lg flex items-center justify-center text-white text-lg`}>
                  {getPlanIcon(currentPlan.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{currentPlan.name}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(currentPlan.price)}/bulan</p>
                </div>
              </div>
            </div>
          )}

          {/* Unpaid Bills Warning */}
          {hasUnpaidBills && !isTrialExpired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Perhatian</h4>
                  <p className="text-sm text-yellow-700">
                    Anda memiliki {unpaidBills.length} tagihan yang belum dibayar. 
                    Jika mengubah paket, tagihan yang ada akan diupdate dengan paket baru.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Expired Info */}
          {isTrialExpired && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Trial Expired</h4>
                  <p className="text-sm text-blue-700">
                    Trial period Anda telah berakhir. Silakan pilih paket berlangganan untuk melanjutkan menggunakan layanan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Duration Tabs */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">
              Pilih Durasi Berlangganan
            </h4>
            <div className="flex gap-3 overflow-x-auto pb-2 pt-6 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => {
                  setSelectedDuration(null);
                  setSelectedPlan(null); // Reset selection when changing duration
                }}
                className={`relative flex-shrink-0 min-w-[140px] px-5 py-3 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === null
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Badge di atas tab */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold shadow-md border-2 ${
                    selectedDuration === null
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-white'
                  }`}>
                    GRATIS
                  </span>
                </div>
                <div className="text-sm font-semibold">Paket Gratis</div>
                <div className="text-xs mt-0.5 opacity-70">Selamanya</div>
              </button>
              <button
                onClick={() => {
                  setSelectedDuration(30);
                  setSelectedPlan(null); // Reset selection when changing duration
                }}
                className={`relative flex-shrink-0 min-w-[140px] px-5 py-3 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === 30
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="text-sm font-semibold">1 Bulan</div>
                <div className="text-xs mt-0.5 opacity-70">Harga Normal</div>
              </button>
              <button
                onClick={() => {
                  setSelectedDuration(90);
                  setSelectedPlan(null);
                }}
                className={`relative flex-shrink-0 min-w-[160px] px-5 py-3 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === 90
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Badge di atas tab */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md border-2 border-white">
                    -20%
                  </span>
                </div>
                <div className="text-sm font-semibold">3 Bulan</div>
                <div className="text-xs mt-0.5 opacity-70">Paket 3 Bulan</div>
              </button>
              <button
                onClick={() => {
                  setSelectedDuration(365);
                  setSelectedPlan(null);
                }}
                className={`relative flex-shrink-0 min-w-[160px] px-5 py-3 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === 365
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Badge di atas tab */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md border-2 border-white">
                    -50%
                  </span>
                </div>
                <div className="text-sm font-semibold">1 Tahun</div>
                <div className="text-xs mt-0.5 opacity-70">Paket 1 Tahun</div>
              </button>
            </div>
          </div>

          {/* Available Plans */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-800">
              {isTrialExpired ? 'Pilih Paket' : 'Pilih Paket Baru'}
            </h4>
            
            {filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Tidak ada paket tersedia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlans.map((plan) => {
                  const discountInfo = getDiscountInfo(plan);
                  const isLongTerm = plan.duration_days === 90 || plan.duration_days === 365;
                  const monthlyPrice = getMonthlyPrice(plan);
                  
                  return (
                  <div
                    key={plan.id}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                      {/* Discount Badge */}
                      {discountInfo && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg border-2 border-white">
                            Hemat {discountInfo.discount}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-10 h-10 bg-gradient-to-r ${getPlanColor(plan.name)} rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0`}>
                            {getPlanIcon(plan.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-800">{plan.name}</h5>
                              {discountInfo && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                  BEST VALUE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                            
                            {/* Price Display */}
                            {isLongTerm ? (
                              <div className="space-y-1">
                                {discountInfo && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 line-through font-montserrat">
                                      Rp {discountInfo.originalPrice.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xl font-bold text-blue-600 font-montserrat">
                                    Rp {monthlyPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-sm text-gray-600 font-montserrat">/bulan</span>
                                </div>
                                <div className="text-xs text-gray-500 font-montserrat">
                                  {formatCurrency(plan.price)} untuk {getDurationLabel(plan.duration_days)}
                                </div>
                                {discountInfo && (
                                  <div className="text-xs text-green-600 font-semibold font-montserrat">
                                    Hemat Rp {discountInfo.saved.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-blue-600 font-montserrat">
                              {formatCurrency(plan.price)}
                            </span>
                                <span className="text-sm text-gray-600 font-montserrat">/bulan</span>
                          </div>
                            )}
                        </div>
                      </div>
                      
                        <div className="flex items-center flex-shrink-0 ml-3">
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan?.id === plan.id}
                          onChange={() => handlePlanSelect(plan)}
                            className="w-5 h-5 text-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Plan Limits */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Limit:</h6>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">
                            Max {plan.max_users} User
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">
                            Max {plan.max_branches} Cabang
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              disabled={isChanging}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isChanging || !selectedPlan}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChanging ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isTrialExpired ? 'Memilih...' : 'Mengubah...'}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>{isTrialExpired ? 'Pilih Paket' : 'Ubah Paket'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePlanModal;
