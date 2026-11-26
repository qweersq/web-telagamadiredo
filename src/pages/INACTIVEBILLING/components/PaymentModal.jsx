import React, { useState } from 'react';
import { X, CreditCard, Copy, CheckCircle } from 'lucide-react';
import { inactiveBillingService } from '../services/inactiveBillingService';

const PaymentModal = ({ billing, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBank, setSelectedBank] = useState('bca');

  // Bank data
  const bankAccounts = {
    bca: {
      name: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'PT. NotaSepatu'
    },
    mandiri: {
      name: 'Bank Mandiri',
      accountNumber: '9876543210',
      accountHolder: 'PT. NotaSepatu'
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!billing.payment_code) {
      setError('Kode unik tidak ditemukan. Silakan coba lagi.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        billing_id: billing.id,
        bank_name: bankAccounts[selectedBank].name,
        account_number: bankAccounts[selectedBank].accountNumber,
        account_holder: bankAccounts[selectedBank].accountHolder,
        amount: billing.amount
      };

      const response = await inactiveBillingService.submitPayment(submitData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Gagal mengirim pembayaran');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      
      // Check if it's authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setError('Terjadi kesalahan saat mengirim pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Konfirmasi Pembayaran</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Transfer Amount with Unique Code */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-yellow-800 font-medium mb-2">
                Transfer dengan kode unik:
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {billing.formatted_amount || `(${parseFloat(billing.amount).toLocaleString('id-ID')})`}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Kode unik: {billing.payment_code}
              </div>
              <div className="text-xs text-yellow-600 mt-2 bg-yellow-100 rounded-lg p-2">
                💡 Kode unik ini untuk mempercepat proses verifikasi pembayaran Anda
              </div>
            </div>
          </div>

          {/* Bank Info - Multiple Options */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">Pilih Rekening Tujuan</h4>
            
            {/* Bank Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedBank('bca')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedBank === 'bca' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-gray-900">BCA</div>
                  <div className="text-xs text-gray-500">1234567890</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedBank('mandiri')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedBank === 'mandiri' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Mandiri</div>
                  <div className="text-xs text-gray-500">9876543210</div>
                </div>
              </button>
            </div>

            {/* Selected Bank Details */}
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900 mb-1">
                {bankAccounts[selectedBank].name}
              </div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-lg font-bold text-gray-900">
                  {bankAccounts[selectedBank].accountNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(bankAccounts[selectedBank].accountNumber)}
                  className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {bankAccounts[selectedBank].accountHolder}
              </div>
            </div>
          </div>

          {/* Instructions - Simplified */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-blue-800 space-y-1">
              <div>1. Transfer sesuai nominal + kode unik di atas</div>
              <div>2. Klik "Konfirmasi Pembayaran"</div>
              <div>3. Tim akan memverifikasi</div>
            </div>
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
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !billing.payment_code}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Konfirmasi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
