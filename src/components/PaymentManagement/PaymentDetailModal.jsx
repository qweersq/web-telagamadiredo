import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaMoneyBillWave, FaBuilding, FaUser, FaCalendar, FaFileImage, FaSpinner } from 'react-icons/fa';
import instance from '../../config/api';

const PaymentDetailModal = ({ 
  isOpen, 
  onClose, 
  paymentId, 
  onApprovePayment, 
  onRejectPayment, 
  actionLoading = {},
  onPaymentUpdated 
}) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPaymentDetail();
    }
  }, [isOpen, paymentId]);

  const fetchPaymentDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/admin/payments/${paymentId}`);
      if (response.data.success) {
        setPayment(response.data.data);
      } else {
        setError('Failed to fetch payment details');
      }
    } catch (err) {
      console.error('Error fetching payment detail:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'refunded': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'paid': return <FaCheckCircle className="text-green-500" />;
      case 'failed': return <FaTimesCircle className="text-red-500" />;
      case 'cancelled': return <FaTimesCircle className="text-gray-500" />;
      case 'refunded': return <FaMoneyBillWave className="text-blue-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await onApprovePayment(paymentId);
      // Refresh payment data after approval
      await fetchPaymentDetail();
      // Notify parent component to refresh payment list
      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      await onRejectPayment(paymentId);
      // Refresh payment data after rejection
      await fetchPaymentDetail();
      // Notify parent component to refresh payment list
      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold font-bold font-montserrat">Payment Details</h2>
              <p className="text-blue-100 font-montserrat">Payment ID: {paymentId}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Approval Buttons */}
              {payment && payment.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprovePayment(paymentId)}
                    disabled={actionLoading[paymentId] === 'approving'}
                    className={`px-4 py-2 rounded-lg font-montserrat font-medium transition-colors duration-200 ${
                      actionLoading[paymentId] === 'approving'
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {actionLoading[paymentId] === 'approving' ? (
                      <div className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        <span>Approving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FaCheckCircle />
                        <span>Approve</span>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectPayment(paymentId)}
                    disabled={actionLoading[paymentId] === 'rejecting'}
                    className={`px-4 py-2 rounded-lg font-montserrat font-medium transition-colors duration-200 ${
                      actionLoading[paymentId] === 'rejecting'
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {actionLoading[paymentId] === 'rejecting' ? (
                      <div className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        <span>Rejecting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FaTimesCircle />
                        <span>Reject</span>
                      </div>
                    )}
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <FaTimes className="text-lg font-semibold" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-montserrat text-lg">Loading payment details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaTimesCircle className="text-4xl text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-montserrat text-lg">{error}</p>
                <button
                  onClick={fetchPaymentDetail}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-montserrat"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : payment ? (
            <div className="space-y-6">
              {/* Payment Status */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 font-montserrat">Payment Status</h3>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="ml-2 font-montserrat">{payment.status.toUpperCase()}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-montserrat mb-1">Payment Reference</p>
                    <p className="text-lg font-bold text-gray-900 font-montserrat">{payment.payment_reference || `PAY-${payment.id}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-montserrat mb-1">Amount</p>
                    <p className="text-lg font-semibold font-bold text-green-600 font-montserrat">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-4">Tenant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaBuilding className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-montserrat">Business Name</p>
                      <p className="text-lg font-semibold text-gray-900 font-montserrat">{payment.tenant?.business_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-montserrat">Owner Name</p>
                      <p className="text-lg font-semibold text-gray-900 font-montserrat">{payment.tenant?.owner_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-4">Detail Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-montserrat mb-1">Metode Pembayaran</p>
                    <p className="text-lg font-semibold text-gray-900 font-montserrat">{payment.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-montserrat mb-1">Gateway Pembayaran</p>
                    <p className="text-lg font-semibold text-gray-900 font-montserrat">{payment.payment_gateway || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-montserrat mb-1">Tanggal Jatuh Tempo</p>
                    <p className="text-lg font-semibold text-gray-900 font-montserrat">{payment.due_date ? formatDate(payment.due_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-montserrat mb-1">Nomor Invoice</p>
                    <p className="text-lg font-semibold text-gray-900 font-montserrat">{payment.invoice_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              {payment.receipt_url && (
                <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-4">Payment Proof</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <FaFileImage className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-montserrat">Bukti Pembayaran</p>
                      <p className="text-lg font-semibold text-gray-900 font-montserrat">Uploaded</p>
                    </div>
                  </div>
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <img
                      src={`http://localhost:3002/${payment.receipt_url}`}
                      alt="Payment Proof"
                      className="w-full h-auto max-h-96 object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center py-8">
                      <FaFileImage className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-montserrat">Gambar tidak tersedia</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {payment.notes && (
                <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-4">Catatan</h3>
                  <p className="text-gray-700 font-montserrat leading-relaxed">{payment.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-4">Timestamp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaCalendar className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-montserrat">Dibuat pada</p>
                      <p className="text-lg font-semibold text-gray-900 font-montserrat">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaCalendar className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-montserrat">Diperbarui pada</p>
                      <p className="text-lg font-semibold text-gray-900 font-montserrat">{formatDate(payment.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-montserrat font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
