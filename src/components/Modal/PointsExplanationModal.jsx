import React, { useState, useEffect } from 'react';
import { X, Coins, TrendingUp, Gift, Clock, Award } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';
import instance from '../../config/api';

const PointsExplanationModal = ({ isOpen, onClose }) => {
  const [pointsSettings, setPointsSettings] = useState({ 
    redeem_rate: 50, 
    referral_bonus_referrer: 10, 
    referral_bonus_new_customer: 10,
    earn_rate: 1000,
    first_order_bonus: 10,
    first_order_bonus_enabled: true,
    min_redeem: 100
  }); // Default values

  // Fetch points settings
  useEffect(() => {
    if (!isOpen) return;

    const fetchPointsSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await instance.get('/points-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const apiData = response.data.data;
          setPointsSettings({
            redeem_rate: apiData.redeem_rate !== undefined ? apiData.redeem_rate : 50,
            referral_bonus_referrer: apiData.referral_bonus_referrer !== undefined ? Number(apiData.referral_bonus_referrer) : 10,
            referral_bonus_new_customer: apiData.referral_bonus_new_customer !== undefined ? Number(apiData.referral_bonus_new_customer) : 10,
            earn_rate: apiData.earn_rate !== undefined ? Number(apiData.earn_rate) : 1000,
            first_order_bonus: apiData.first_order_bonus !== undefined ? Number(apiData.first_order_bonus) : 10,
            first_order_bonus_enabled: apiData.first_order_bonus_enabled !== undefined ? Boolean(apiData.first_order_bonus_enabled) : true,
            min_redeem: apiData.min_redeem !== undefined ? Number(apiData.min_redeem) : 100
          });
        }
      } catch (error) {
        console.error('Error fetching points settings:', error);
        // Keep default value
      }
    };

    fetchPointsSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('points_explanation_seen', 'true');
    onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('points_explanation_seen', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-montserrat mb-1">
                  Penjelasan Sistem Poin
                </h2>
                <p className="text-sm text-orange-100 font-montserrat leading-relaxed">
                  Cara mendapatkan dan menggunakan poin reward
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white" />
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
          <div className="space-y-5">
            {/* Cara Mendapatkan Poin */}
            <div>
              <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Cara Mendapatkan Poin
              </h3>
              
              <div className="space-y-3">
                {/* Earning dari Order */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                    Poin dari Order yang Lunas
                  </h4>
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                    Setiap order yang sudah lunas (status: paid) akan memberikan poin berdasarkan total pembayaran.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Konversi:</strong> 1 poin = Rp {pointsSettings.earn_rate?.toLocaleString('id-ID')} dari total pembayaran
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Contoh:</strong> Order Rp 50.000 yang sudah lunas = {Math.floor(50000 / pointsSettings.earn_rate)} poin (Rp 50.000 ÷ Rp {pointsSettings.earn_rate?.toLocaleString('id-ID')})
                    </p>
                  </div>
                </div>

                {/* Bonus Order Pertama */}
                {pointsSettings.first_order_bonus_enabled && pointsSettings.first_order_bonus > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                      Bonus Order Pertama
                    </h4>
                    <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                      Customer baru yang melakukan order pertama dan sudah lunas akan mendapatkan bonus poin.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-gray-600 font-montserrat">
                        <strong>Bonus:</strong> +{pointsSettings.first_order_bonus} poin (sekali seumur hidup, hanya saat order pertama lunas)
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat mt-1">
                        <strong>Contoh:</strong> Order pertama Rp 30.000 lunas = {Math.floor(30000 / pointsSettings.earn_rate)} poin (dari order) + {pointsSettings.first_order_bonus} poin (bonus) = {Math.floor(30000 / pointsSettings.earn_rate) + pointsSettings.first_order_bonus} poin total
                      </p>
                    </div>
                  </div>
                )}

                {/* Bonus Referral */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                    Bonus Referral
                  </h4>
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                    Jika customer baru menggunakan kode referral saat order pertama, baik referrer maupun customer baru akan mendapatkan bonus.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Bonus untuk Referrer:</strong> +{pointsSettings.referral_bonus_referrer} poin (langsung saat order dibuat)
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Bonus untuk Customer Baru:</strong> +{pointsSettings.referral_bonus_new_customer} poin (langsung saat order dibuat)
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Contoh:</strong> Customer A refer Customer B. Saat B order pertama (belum lunas), A dapat +{pointsSettings.referral_bonus_referrer} poin, B dapat +{pointsSettings.referral_bonus_new_customer} poin. Saat B lunas, B dapat poin dari order + bonus order pertama.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Menggunakan Poin */}
            <div>
              <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                <Coins className="w-5 h-5 text-orange-600" />
                Cara Menggunakan Poin
              </h3>
              
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                  Redeem Poin untuk Diskon
                </h4>
                <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-3">
                  Poin bisa digunakan untuk mendapatkan diskon saat checkout. Poin bisa dikombinasikan dengan diskon membership atau promo lainnya.
                </p>
                
                <div className="bg-white rounded-lg p-3 border border-orange-100 space-y-2">
                  <p className="text-xs text-gray-600 font-montserrat">
                    <strong>Konversi:</strong> 100 poin = Rp {(pointsSettings.redeem_rate * 100)?.toLocaleString('id-ID')} diskon (1 poin = Rp {pointsSettings.redeem_rate?.toLocaleString('id-ID')})
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat">
                    <strong>Minimum:</strong> {pointsSettings.min_redeem} poin (bisa pakai berapa saja asal minimal {pointsSettings.min_redeem}, tidak harus kelipatan {pointsSettings.min_redeem})
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat">
                    <strong>Maksimal:</strong> Sesuai total pesanan (tidak bisa melebihi total)
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-orange-100 mt-3">
                  <p className="text-xs font-semibold text-gray-700 font-montserrat mb-2">
                    Study Case:
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mb-1">
                    • Total pesanan: Rp 40.000
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mb-1">
                    • Customer punya: 500 poin terkumpul
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mb-1">
                    • Maksimal poin yang bisa dipakai: {Math.floor(40000 / (pointsSettings.redeem_rate * 100)) * 100} poin (karena {Math.floor(40000 / (pointsSettings.redeem_rate * 100)) * 100} poin = Rp 40.000, tidak bisa melebihi total)
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mb-1">
                    • Contoh pakai {pointsSettings.min_redeem > 150 ? pointsSettings.min_redeem : 150} poin: {pointsSettings.min_redeem > 150 ? pointsSettings.min_redeem : 150} poin = Rp {Math.floor(((pointsSettings.min_redeem > 150 ? pointsSettings.min_redeem : 150) / 100) * (pointsSettings.redeem_rate * 100))?.toLocaleString('id-ID')} diskon
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat">
                    • Total setelah diskon poin: Rp 40.000 - Rp {Math.floor(((pointsSettings.min_redeem > 150 ? pointsSettings.min_redeem : 150) / 100) * (pointsSettings.redeem_rate * 100))?.toLocaleString('id-ID')} = Rp {(40000 - Math.floor(((pointsSettings.min_redeem > 150 ? pointsSettings.min_redeem : 150) / 100) * (pointsSettings.redeem_rate * 100)))?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Points vs Lifetime Points */}
            <div>
              <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Points vs Lifetime Points
              </h3>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                    Points (Poin Terkumpul yang Bisa Digunakan)
                  </h4>
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                    Poin terkumpul yang tersedia untuk digunakan sebagai diskon. Poin ini akan berkurang saat digunakan (redeem).
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Contoh:</strong> Punya 500 poin terkumpul, pakai 200 poin untuk diskon, sisa 300 poin
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                    Lifetime Points (Total Poin Seumur Hidup)
                  </h4>
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                    Total poin yang pernah didapat customer sejak pertama kali order. Lifetime points tidak pernah berkurang, bahkan saat poin digunakan atau expire.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Fungsi:</strong> Digunakan untuk menentukan tier membership (Bronze, Silver, Gold, dll)
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Contoh:</strong> Total pernah dapat 1.000 poin, pakai 300 poin, lifetime tetap 1.000 poin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Poin Expire */}
            <div>
              <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Poin Expire
              </h3>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                  Poin yang didapat dari order (bukan bonus) akan expire setelah 1 tahun dari tanggal earning.
                </p>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-gray-600 font-montserrat">
                    <strong>Poin yang Expire:</strong> Hanya poin dari order (type: earn)
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mt-1">
                    <strong>Poin yang Tidak Expire:</strong> Bonus order pertama, bonus referral
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mt-1">
                    <strong>Contoh:</strong> Dapat 100 poin dari order tanggal 1 Januari 2024, poin akan expire tanggal 1 Januari 2025
                  </p>
                </div>
              </div>
            </div>

            {/* Membership Tier */}
            <div>
              <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Membership Tier
              </h3>
              
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                  Tier membership otomatis naik berdasarkan lifetime points. Setiap tier memiliki minimum lifetime points dan diskon persentase.
                </p>
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs text-gray-600 font-montserrat">
                    <strong>Upgrade Otomatis:</strong> Tier naik otomatis saat lifetime points mencapai minimum tier berikutnya
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mt-1">
                    <strong>Tidak Bisa Downgrade:</strong> Tier tidak akan turun meskipun poin digunakan atau expire
                  </p>
                  <p className="text-xs text-gray-600 font-montserrat mt-1">
                    <strong>Contoh:</strong> Bronze (0 poin), Silver (500 poin), Gold (1.000 poin). Customer dengan 600 lifetime points = Silver tier
                  </p>
                </div>
              </div>
            </div>

            {/* Tips Penting */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-900 font-montserrat text-sm mb-2">
                    Tips Penting
                  </h3>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                      • Poin hanya didapat dari order yang sudah <strong>lunas (paid)</strong>, bukan dari order unpaid atau DP
                    </li>
                    <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                      • Bonus referral diberikan langsung saat order dibuat, tidak perlu tunggu lunas
                    </li>
                    <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                      • Poin bisa dikombinasikan dengan diskon membership atau promo lainnya
                    </li>
                    <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                      • Maksimal poin yang bisa dipakai dibatasi sesuai total pesanan setelah diskon lainnya
                    </li>
                    <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                      • Lifetime points tidak terpengaruh expire atau penggunaan poin
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleDontShowAgain}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm font-montserrat transition-colors"
            >
              Jangan Tampilkan Lagi
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm font-montserrat transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsExplanationModal;
