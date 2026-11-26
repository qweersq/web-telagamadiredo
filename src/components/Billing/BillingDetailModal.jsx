import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Copy,
  ExternalLink,
  FileText
} from 'lucide-react';
import TripayPaymentModal from '../../pages/INACTIVEBILLING/components/TripayPaymentModal';

const BillingDetailModal = ({ 
  isOpen, 
  onClose, 
  billing, 
  onTripayPayment, 
  onCheckPayment, 
  onRefreshStatus, 
  generatingCode = false, 
  isConfirmingPayment = false,
  isActiveTenant = false
}) => {
  const [showTripayModal, setShowTripayModal] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowTripayModal(false);
      setSelectedBilling(billing);
    }
  }, [isOpen, billing]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'refunded':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unpaid':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'unpaid':
        return 'Belum Dibayar';
      case 'pending':
        return 'Menunggu Verifikasi';
      case 'paid':
        return 'Sudah Dibayar';
      case 'failed':
        return 'Gagal';
      case 'cancelled':
        return 'Dibatalkan';
      case 'refunded':
        return 'Dikembalikan';
      default:
        return status;
    }
  };

  const hasTransaction = billing?.payment_reference && billing?.payment_url;
  const isExpired = billing?.expired_at && new Date(billing.expired_at) < new Date();
  const canPay = billing?.status === 'unpaid' || (billing?.status === 'unpaid' && !hasTransaction);
  const canChangeMethod = hasTransaction && !isExpired && billing?.status === 'unpaid';

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const handleTripayPayment = () => {
    setSelectedBilling(billing);
    setShowTripayModal(true);
    // Keep detail modal open, TripayModal will appear on top
  };

  const handleTripaySuccess = () => {
    setShowTripayModal(false);
    setSelectedBilling(null);
    // Call parent's onTripayPayment to refresh data
    if (onTripayPayment) {
      onTripayPayment(billing);
    }
    // Close detail modal after successful payment
    onClose();
  };

  if (!isOpen || !billing) return null;

  return (
    <>
      {/* Main Detail Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                Detail Billing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {billing.invoice_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Billing Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Informasi Billing
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Invoice:</span>
                  <div className="font-medium text-gray-800">{billing.invoice_number}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(billing.status)}`}>
                    {getStatusIcon(billing.status)}
                    <span>{getStatusText(billing.status)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Jumlah:</span>
                  <div className="font-medium text-gray-800">
                    {formatCurrency(billing.subscription?.plan?.price || billing.amount)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Jatuh Tempo:</span>
                  <div className="font-medium text-gray-800">{formatDate(billing.due_date)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Dibuat:</span>
                  <div className="font-medium text-gray-800">{formatDateTime(billing.createdAt)}</div>
                </div>
                {billing.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Catatan:</span>
                    <div className="font-medium text-gray-800">{billing.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info (if exists) */}
            {hasTransaction && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-blue-800 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Informasi Pembayaran
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600">Metode:</span>
                    <div className="font-medium text-blue-800">
                      {billing.payment_method === 'qris' ? 'QRIS' : 
                       billing.payment_method === 'virtual_account' ? 'Virtual Account' : 
                       billing.payment_method || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">Gateway:</span>
                    <div className="font-medium text-blue-800">{billing.payment_gateway || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-blue-600">Reference:</span>
                    <div className="font-medium text-blue-800 flex items-center space-x-2">
                      <span>{billing.payment_reference}</span>
                      {/* <button
                        onClick={() => handleCopyToClipboard(billing.payment_reference)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="w-3 h-3" />
                      </button> */}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">Expired:</span>
                    <div className={`font-medium ${isExpired ? 'text-red-600' : 'text-blue-800'}`}>
                      {billing.expired_at ? formatDateTime(billing.expired_at) : 'N/A'}
                    </div>
                  </div>
                  {billing.payment_url && (
                    <div className="col-span-2">
                      <span className="text-blue-600">Payment URL:</span>
                      <div className="font-medium text-blue-800 flex items-center space-x-2">
                        <a
                          href={billing.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <span>Buka Link Pembayaran</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleCopyToClipboard(billing.payment_url)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Status (if exists) */}
            {hasTransaction && (
              <div className={`rounded-lg p-4 ${
                isExpired ? 'bg-red-50 border border-red-200' : 
                billing.status === 'paid' ? 'bg-green-50 border border-green-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isExpired ? (
                    <>
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Transaksi Expired</span>
                    </>
                  ) : billing.status === 'paid' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Pembayaran Berhasil</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Menunggu Pembayaran</span>
                    </>
                  )}
                </div>
                <p className={`text-xs ${
                  isExpired ? 'text-red-700' : 
                  billing.status === 'paid' ? 'text-green-700' :
                  'text-yellow-700'
                }`}>
                  {isExpired ? 
                    'Transaksi sebelumnya sudah expired. Silakan buat transaksi baru.' :
                    billing.status === 'paid' ?
                    'Pembayaran Anda telah berhasil diverifikasi.' :
                    'Silakan lakukan pembayaran sebelum waktu expired.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {/* Case 1: Belum Create Transaction (unpaid) */}
              {billing.status === 'unpaid' && !hasTransaction && (
                <button
                  onClick={handleTripayPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar via Tripay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Case 2: Sudah Create Transaction (unpaid) */}
              {billing.status === 'unpaid' && hasTransaction && !isExpired && (
                <>
                  <a
                    href={billing.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleTripayPayment}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ganti Metode Pembayaran</span>
                  </button>
                  <button
                    onClick={() => onRefreshStatus(billing)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Status</span>
                  </button>
                </>
              )}

              {/* Case 3: Transaction Expired */}
              {hasTransaction && isExpired && (
                <button
                  onClick={() => onTripayPayment(billing)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Buat Transaksi Baru</span>
                </button>
              )}

              {/* Case 4: Payment Success */}
              {billing.status === 'paid' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-600 font-medium">Pembayaran Berhasil!</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Pembayaran Anda telah diverifikasi
                  </p>
                </div>
              )}

              {/* Case 5: Payment Failed */}
              {billing.status === 'failed' && (
                <>
                  <button
                    onClick={() => onTripayPayment(billing)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    onClick={() => onTripayPayment(billing)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ganti Metode</span>
                  </button>
                </>
              )}

              {/* Case 6: Unpaid without transaction - HIDE check payment button */}
              {/* No action needed - user should create transaction first */}

              {/* Case 7: Cancelled */}
              {billing.status === 'cancelled' && (
                <button
                  onClick={() => onTripayPayment(billing)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Buat Transaksi Baru</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tripay Payment Modal */}
      {showTripayModal && selectedBilling && (
        <TripayPaymentModal
          billing={selectedBilling}
          onClose={() => {
            setShowTripayModal(false);
          }}
          onCloseCallback={() => {
            // Trigger fetch ulang data saat modal ditutup
            if (onTripayPayment) {
              onTripayPayment(billing);
            }
          }}
          onSuccess={handleTripaySuccess}
          isActiveTenant={isActiveTenant}
        />
      )}

    </>
  );
};

export default BillingDetailModal;
