import React, { useState, useEffect, useCallback } from 'react';
import { Zap, ArrowLeft, CreditCard, Sparkles, Wallet, X } from 'lucide-react';
import AiCreditService from '../services/aiCreditService';
import { clearUserProfileCache } from '../utils/userProfileHelper';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const AICreditPage = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState([]);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [balanceData, packagesData] = await Promise.all([
        AiCreditService.getBalance(),
        AiCreditService.getPackages('TRIPAY'),
      ]);

      setBalance(balanceData?.balance || 0);
      setPackages(packagesData || []);

      clearUserProfileCache();
    } catch (error) {
      console.error('❌ AICreditPage - Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectPackage = async (pkg) => {
    setSelectedPackage(pkg);
    setCheckoutUrl(null);
    setCheckoutLoading(true);
    setShowPaymentModal(true);

    try {
      const result = await AiCreditService.createTripayInvoice(
        pkg.id,
        'QRIS2'
      );

      if (result?.checkout_url) {
        setCheckoutUrl(result.checkout_url);
      }
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message || 'Gagal membuat transaksi';
      alert(msg);
      setShowPaymentModal(false);
      setSelectedPackage(null);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPackage(null);
    setCheckoutUrl(null);
    setCheckoutLoading(false);
  };

  const handleDone = () => {
    clearUserProfileCache();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-montserrat">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-300 to-blue-400 px-6 pt-4 pb-1">
        <div className="flex items-center justify-between mb-1">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold text-white font-montserrat">AI Credit</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 -mt-3">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl px-6 py-8 shadow-lg mb-6 mt-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-blue-100" />
            <p className="text-sm text-blue-100 font-montserrat">Saldo AI Credit</p>
          </div>
          <p className="text-5xl font-extrabold text-white text-center font-montserrat">
            {balance.toLocaleString('id-ID')}
          </p>
          <p className="text-sm text-blue-100 text-center mt-1 font-montserrat">Credit</p>
        </div>

        {/* Daftar Paket */}
        <h2 className="text-base font-bold text-gray-800 font-montserrat mb-1">Pilih Paket</h2>
        <p className="text-xs text-gray-500 font-montserrat mb-4">
          Setiap 1 credit dapat digunakan untuk 1 kali deteksi AI
        </p>

        {packages.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-montserrat">Belum ada paket tersedia</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handleSelectPackage(pkg)}
              className="w-full bg-white rounded-xl p-4 mb-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Zap className={`w-6 h-6 ${pkg.credits === -1 ? 'text-amber-500' : 'text-blue-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 font-montserrat">
                  {pkg.credits.toLocaleString('id-ID')} Credit
                </p>
              </div>
              <p className="text-base font-bold text-blue-500 font-montserrat shrink-0">
                {formatCurrency(pkg.price)}
              </p>
            </button>
          ))
        )}

        <div className="h-10" />
      </div>

      {/* Payment Confirmation Modal — seperti billing active payment */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 font-montserrat">Konfirmasi Pembayaran</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Ringkasan Paket */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600 font-montserrat">Paket</span>
                  <span className="text-sm font-semibold text-gray-800 font-montserrat">
                    {selectedPackage.credits.toLocaleString('id-ID')} Credit
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600 font-montserrat">Total</span>
                  <span className="text-base font-bold text-blue-500 font-montserrat">
                    {formatCurrency(selectedPackage.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600 font-montserrat">Pembayaran</span>
                  <span className="text-sm font-semibold text-gray-700 font-montserrat">
                    QRIS
                  </span>
                </div>
              </div>

              {/* Bayar Sekarang Button — link checkout langsung, anti popup block */}
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-white font-montserrat transition-all bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-md hover:shadow-lg"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Sekarang</span>
                </a>
              ) : (
                <div className="flex flex-col items-center py-6">
                  <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-500 font-montserrat">Menyiapkan pembayaran QRIS...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICreditPage;
