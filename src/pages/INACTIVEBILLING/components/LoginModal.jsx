import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { inactiveBillingService } from '../services/inactiveBillingService';

const LoginModal = ({ onClose, onSuccess, pendingBills }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckStatus = async () => {
    console.log('🔍 LoginModal.handleCheckStatus - pendingBills:', pendingBills);
    
    if (!pendingBills || pendingBills.length === 0) {
      console.log('❌ No pending bills found');
      setError('Tidak ada pembayaran yang perlu dicek.');
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Starting status checks for', pendingBills.length, 'bills');
      
      // Check status for all pending bills
      const statusChecks = pendingBills.map(billing => {
        console.log('📞 Calling API for billing ID:', billing.id);
        return inactiveBillingService.checkPaymentStatus(billing.id);
      });

      const results = await Promise.allSettled(statusChecks);
      console.log('📊 API Results:', results);
      
      // Check if any payment is confirmed
      let hasPaid = false;
      let allPending = true;
      let hasError = false;

      results.forEach((result, index) => {
        console.log(`📋 Result ${index}:`, result);
        if (result.status === 'fulfilled' && result.value.success) {
          const status = result.value.data.status;
          console.log(`✅ Billing ${index} status:`, status);
          if (status === 'paid') {
            hasPaid = true;
            allPending = false;
          } else if (status !== 'pending') {
            allPending = false;
          }
        } else {
          console.log(`❌ Billing ${index} error:`, result.reason);
          hasError = true;
        }
      });

      if (hasPaid) {
        setResult({
          type: 'success',
          message: 'Pembayaran berhasil dikonfirmasi! Akun Anda telah diaktifkan.',
          action: 'Berhasil'
        });
      } else if (allPending && !hasError) {
        setResult({
          type: 'pending',
          message: 'Pembayaran masih menunggu verifikasi admin.',
          action: 'Pending'
        });
      } else {
        setResult({
          type: 'failed',
          message: 'Pembayaran belum dikonfirmasi. Silakan coba lagi.',
          action: 'Gagal'
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      // Check if it's authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setError('Gagal mengecek status. Coba lagi.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSuccess = () => {
    // Clear encrypted data from localStorage
    localStorage.removeItem('inactiveBillingEncryptedData');
    
    // Navigate to login page
    window.location.href = '/login';
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'pending':
        return <RefreshCw className="w-8 h-8 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-500" />;
    }
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Cek Status Pembayaran</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="text-center">
            {!result && !error && (
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Cek Status Pembayaran
                </h4>
                <p className="text-gray-600 mb-6">
                  Admin akan memverifikasi pembayaran Anda dalam 24 jam.
                </p>
                
                <button
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengecek Status...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Cek Status</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Loading State */}
            {isChecking && (
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Mengecek Status...
                </h4>
                <p className="text-gray-600">
                  Sedang memeriksa status pembayaran.
                </p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getResultIcon(result.type)}
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {result.action}
                </h4>
                <p className="text-gray-600 mb-6">
                  {result.message}
                </p>
                
                <div className={`border rounded-lg p-4 mb-6 ${getResultColor(result.type)}`}>
                  <div className="flex items-center space-x-2">
                    {getResultIcon(result.type)}
                    <span className="font-medium">{result.action}</span>
                  </div>
                </div>

                {result.type === 'success' && (
                  <button
                    onClick={handleSuccess}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Lanjutkan
                  </button>
                )}

                {(result.type === 'pending' || result.type === 'failed') && (
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handleCheckStatus}
                      disabled={isChecking}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isChecking ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengecek...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Coba Lagi</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Error
                </h4>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleCheckStatus}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
