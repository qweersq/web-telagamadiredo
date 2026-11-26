import React from 'react';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Eye,
  X
} from 'lucide-react';

const BillingCard = ({ 
  billing, 
  onDetail, 
  onTripayPayment, 
  onCheckPayment,
  generatingCode = false 
}) => {
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
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-800">{billing.invoice_number}</span>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(billing.status)}`}>
          {getStatusIcon(billing.status)}
          <span>{getStatusText(billing.status)}</span>
        </div>
      </div>
      
      {/* Billing Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Jumlah</span>
          <span className="font-semibold text-lg text-gray-800">
            {formatCurrency(billing.subscription?.plan?.price || billing.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Jatuh Tempo</span>
          <span className="text-gray-800">{formatDate(billing.due_date)}</span>
        </div>
        {billing.notes && (
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Catatan</span>
            <span className="text-gray-800 text-right text-sm">{billing.notes}</span>
          </div>
        )}
      </div>

      {/* Actions based on status */}
      <div className="space-y-2">
        {/* Detail Button - Always visible */}
        <button
          onClick={() => onDetail(billing)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>Detail Billing</span>
        </button>

        {/* Status-specific actions */}
        {billing.status === 'unpaid' && !hasTransaction && (
          <button
            onClick={() => onTripayPayment(billing)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Bayar via Tripay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {billing.status === 'pending' && hasTransaction && !isExpired && (
          <div className="space-y-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Transaksi Aktif</span>
              </div>
              <p className="text-xs text-yellow-700">
                Metode: {billing.payment_method === 'qris' ? 'QRIS' : 
                         billing.payment_method === 'virtual_account' ? 'Virtual Account' : 
                         billing.payment_method || 'N/A'} • 
                Expired: {billing.expired_at ? new Date(billing.expired_at).toLocaleString('id-ID') : 'N/A'}
              </p>
            </div>
            <a
              href={billing.payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {billing.status === 'pending' && !hasTransaction && (
          <div className="space-y-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Menunggu Verifikasi Admin</span>
              </div>
              <p className="text-xs text-yellow-700">
                Pembayaran Anda sedang diverifikasi oleh admin. Biasanya memakan waktu 1x24 jam.
              </p>
            </div>
            <button
              onClick={() => onCheckPayment(billing)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Cek Status Pembayaran</span>
            </button>
          </div>
        )}

        {hasTransaction && isExpired && (
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Transaksi Expired</span>
              </div>
              <p className="text-xs text-red-700">
                Transaksi sebelumnya sudah expired. Silakan buat transaksi baru.
              </p>
            </div>
            <button
              onClick={() => onTripayPayment(billing)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Buat Transaksi Baru</span>
            </button>
          </div>
        )}

        {billing.status === 'paid' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-600 font-medium">Pembayaran Berhasil!</p>
            <p className="text-sm text-gray-600 mt-1">
              Pembayaran Anda telah diverifikasi
            </p>
          </div>
        )}

        {billing.status === 'failed' && (
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Pembayaran Gagal</span>
              </div>
              <p className="text-xs text-red-700">
                Pembayaran Anda gagal. Silakan coba lagi dengan metode yang berbeda.
              </p>
            </div>
            <button
              onClick={() => onTripayPayment(billing)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {billing.status === 'cancelled' && (
          <div className="space-y-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <X className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Transaksi Dibatalkan</span>
              </div>
              <p className="text-xs text-gray-700">
                {billing.notes?.includes('Auto-cancelled due to expiration') ? 
                  'Transaksi dibatalkan karena expired. Silakan buat transaksi baru.' :
                  'Transaksi ini telah dibatalkan.'
                }
              </p>
            </div>
            <button
              onClick={() => onTripayPayment(billing)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Buat Transaksi Baru</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingCard;
