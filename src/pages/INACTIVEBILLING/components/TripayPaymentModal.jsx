import React, { useState, useEffect } from 'react';
import { inactiveBillingService } from '../services/inactiveBillingService';
import api from '../../../config/api';
import { 
  CreditCard, 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

const TripayPaymentModal = ({ billing, onClose, onSuccess, onCloseCallback, isActiveTenant = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [tripayTransaction, setTripayTransaction] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [statusPolling, setStatusPolling] = useState(null);
  const [showManualLink, setShowManualLink] = useState(false);

  // Load payment channels on mount and when billing changes
  useEffect(() => {
    if (billing) {
      loadPaymentChannels();
    }
  }, [billing, isActiveTenant]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  // Reset states when modal closes
  useEffect(() => {
    if (!billing) {
      setSelectedChannel(null);
      setTripayTransaction(null);
      setPaymentStatus('pending');
      setShowManualLink(false);
      if (statusPolling) {
        clearInterval(statusPolling);
        setStatusPolling(null);
      }
    }
  }, [billing, statusPolling]);

  const loadPaymentChannels = async () => {
    try {
      setLoading(true);
      let response;
      
      if (isActiveTenant) {
        // Use active tenant API
        response = await api.get('/tripay/channels');
        if (response.data.success) {
          setPaymentChannels(response.data.data);
        } else {
          throw new Error('Failed to load payment channels');
        }
      } else {
        // Use inactive tenant API
        response = await inactiveBillingService.getPaymentChannels();
        if (response.success) {
          setPaymentChannels(response.data);
        } else {
          throw new Error('Failed to load payment channels');
        }
      }
    } catch (error) {
      console.error('Error loading payment channels:', error);
      setError('Gagal memuat metode pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedChannel || !billing) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (isActiveTenant) {
        // Use active tenant API
        response = await api.post('/tripay/create-transaction', {
          billing_id: billing.id,
          payment_method: selectedChannel.code
        });
        
        if (response.data.success) {
          setTripayTransaction(response.data.data);
          setPaymentStatus('pending');
          startStatusPolling(response.data.data.reference);
        } else {
          throw new Error(response.data.message || 'Failed to create transaction');
        }
      } else {
        // Use inactive tenant API
        response = await inactiveBillingService.createTransaction({
          billing_id: billing.id,
          payment_method: selectedChannel.code
        });
        
        if (response.success) {
          setTripayTransaction(response.data);
          setPaymentStatus('pending');
          startStatusPolling(response.data.reference);
        } else {
          throw new Error(response.message || 'Failed to create transaction');
        }
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('Gagal membuat transaksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (reference) => {
    const pollInterval = setInterval(async () => {
      try {
        let response;
        
        if (isActiveTenant) {
          // Use active tenant API
          response = await api.post(`/tripay/check-status/${billing.id}`);
          if (response.data.success) {
            const { tripay_status, new_status, updated } = response.data.data;
            setPaymentStatus(tripay_status);
            
            if (tripay_status === 'PAID') {
              clearInterval(pollInterval);
              setStatusPolling(null);
              // Show success message first
              alert('Pembayaran berhasil! Status billing telah diperbarui.');
              // Redirect to login for fresh data
              window.location.href = '/login';
            } else if (tripay_status === 'FAILED' || tripay_status === 'CANCELLED') {
              clearInterval(pollInterval);
              setStatusPolling(null);
              setError('Pembayaran gagal atau dibatalkan. Silakan coba lagi.');
            }
          }
        } else {
          // Use inactive tenant API
          response = await inactiveBillingService.manualCheckStatus(billing.id);
          if (response.success) {
            const { tripay_status, new_status, updated } = response.data;
            setPaymentStatus(tripay_status);
            
            if (tripay_status === 'PAID') {
              clearInterval(pollInterval);
              setStatusPolling(null);
              // Show success message first
              alert('Pembayaran berhasil! Status billing telah diperbarui.');
              // Redirect to login for fresh data
              window.location.href = '/login';
            } else if (tripay_status === 'FAILED' || tripay_status === 'CANCELLED') {
              clearInterval(pollInterval);
              setStatusPolling(null);
              setError('Pembayaran gagal atau dibatalkan. Silakan coba lagi.');
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    setStatusPolling(pollInterval);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !tripayTransaction) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                Pilih Metode Pembayaran
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Pilih metode pembayaran yang paling nyaman untuk Anda
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onCloseCallback) {
                  onCloseCallback();
                }
                if (statusPolling) {
                  clearInterval(statusPolling);
                  setStatusPolling(null);
                }
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!tripayTransaction ? (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 font-montserrat">
                  Pilih Metode Pembayaran
                </h3>
                <div className="space-y-3">
                  {paymentChannels.map((channel) => (
                    <button
                      key={channel.code}
                      onClick={() => setSelectedChannel(channel)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                        selectedChannel?.code === channel.code
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Payment Icon */}
                        <div className="flex-shrink-0">
                          {channel.icon_url ? (
                            <img
                              src={channel.icon_url}
                              alt={channel.name}
                              className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-2"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg"
                            style={{ display: channel.icon_url ? 'none' : 'flex' }}
                          >
                            {channel.name.charAt(0)}
                          </div>
                        </div>
                        
                        {/* Payment Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 font-montserrat text-base">
                            {channel.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {channel.group || channel.type}
                          </div>
                          {/* {channel.fee_customer && (
                            <div className="text-xs text-gray-500">
                              Biaya: {channel.fee_customer.flat > 0 ? 
                                `Rp ${channel.fee_customer.flat.toLocaleString()}` : 
                                'Gratis'
                              }
                            </div>
                          )} */}
                        </div>
                        
                        {/* Selection Indicator */}
                        <div className="flex-shrink-0">
                          {selectedChannel?.code === channel.code ? (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors font-montserrat"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateTransaction}
                  disabled={!selectedChannel || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-montserrat flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                  Menunggu Pembayaran
                </h3>
                <p className="text-sm text-gray-600 font-montserrat">
                  Klik <strong>Bayar Sekarang</strong> untuk membuka halaman pembayaran
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 font-montserrat">Jumlah Pembayaran</div>
                  <div className="text-xl font-bold text-gray-900 font-montserrat">
                    {formatCurrency(billing.amount)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 font-montserrat">Metode Pembayaran</div>
                  <div className="flex items-center space-x-3">
                    {/* Selected Payment Channel Icon */}
                    <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                      {selectedChannel?.icon_url ? (
                        <img
                          src={selectedChannel.icon_url}
                          alt={selectedChannel.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs font-medium"
                        style={{ display: selectedChannel?.icon_url ? 'none' : 'flex' }}
                      >
                        {selectedChannel?.name?.charAt(0)}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900 font-montserrat">
                      {selectedChannel?.name}
                    </div>
                  </div>
                </div>

                {tripayTransaction.checkout_url && (
                  <div className="space-y-3">
                    <div
                      onClick={() => {
                        const payWindow = window.open(tripayTransaction.checkout_url, '_blank', 'noopener,noreferrer');
                        if (!payWindow) {
                          // Fallback if popup blocked: show manual link
                          setShowManualLink(true);
                        }
                      }}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-lg transition-colors font-montserrat text-center cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5 inline mr-2" />
                      Bayar Sekarang
                    </div>
                    {showManualLink && (
                      <a
                        href={tripayTransaction.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gray-100 hover:bg-gray-200 text-blue-600 font-medium py-3 px-4 rounded-lg transition-colors font-montserrat text-center"
                      >
                        🔗 Klik jika tidak otomatis terbuka
                      </a>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 font-montserrat">
                      Status: Menunggu Pembayaran
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 font-montserrat">
                    Sistem akan otomatis mendeteksi pembayaran Anda
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    onClose();
                    if (onCloseCallback) {
                      onCloseCallback();
                    }
                    if (statusPolling) {
                      clearInterval(statusPolling);
                      setStatusPolling(null);
                    }
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors font-montserrat"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripayPaymentModal;
