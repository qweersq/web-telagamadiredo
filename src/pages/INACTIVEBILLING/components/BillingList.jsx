import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Clock, CheckCircle, AlertCircle, RefreshCw, Calendar, Settings } from 'lucide-react';
import { inactiveBillingService } from '../services/inactiveBillingService';

const BillingList = ({ unpaidBills, pendingBills, tenantStatus, onPayBilling, onTripayPayment, onCheckStatus }) => {
  const navigate = useNavigate();
  const [generatingCode, setGeneratingCode] = useState(null);
  const [error, setError] = useState(null);

  const handlePayBilling = async (billing) => {
    try {
      setGeneratingCode(billing.id);
      setError(null);
      
      // Generate payment code first
      const response = await inactiveBillingService.generatePaymentCode(billing.id);
      
      if (response.success) {
        // Pass the updated billing data to parent
        const updatedBilling = {
          ...billing,
          amount: response.data.final_amount,
          payment_code: response.data.payment_code,
          formatted_amount: response.data.formatted_amount
        };
        
        onPayBilling(updatedBilling);
      } else {
        setError(response.message || 'Gagal generate kode pembayaran');
      }
    } catch (error) {
      console.error('Error generating payment code:', error);
      
      // Check if it's authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setError('Terjadi kesalahan saat generate kode pembayaran');
    } finally {
      setGeneratingCode(null);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unpaid':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'unpaid':
        return 'Belum Bayar';
      case 'pending':
        return 'Menunggu Verifikasi';
      case 'paid':
        return 'Lunas';
      default:
        return 'Unknown';
    }
  };

  // Filter bills berdasarkan status
  const unpaidBillsList = unpaidBills.filter(bill => bill.status === 'unpaid');
  const pendingBillsList = unpaidBills.filter(bill => bill.status === 'pending');
  const allBills = [...unpaidBillsList, ...pendingBillsList];

  // Show billing for expired tenants (both trial and active expired)
  const shouldShowBilling = (tenantStatus === 'expired' || tenantStatus === 'trial') && allBills.length > 0;

  if (!shouldShowBilling) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {(tenantStatus === 'expired' || tenantStatus === 'trial') && !unpaidBills?.length ? 'Pilih Plan Terlebih Dahulu' : 'Tidak Ada Tagihan'}
          </h3>
          <p className="text-gray-500 mb-6">
            {(tenantStatus === 'expired' || tenantStatus === 'trial') && !unpaidBills?.length 
              ? 'Silakan pilih plan untuk melanjutkan' 
              : 'Tidak ada tagihan yang perlu dibayar'
            }
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tagihan</h2>
        <div className="text-sm text-gray-500">
          {unpaidBillsList.length + pendingBillsList.length} total
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Billing Cards */}
      <div className="space-y-4">
        {allBills.map((billing) => (
          <div key={billing.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{billing.subscription_plan?.name || 'Plan'}</h3>
                  <p className="text-sm text-gray-500">{formatDate(billing.due_date)}</p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(billing.status)}`}>
                {getStatusIcon(billing.status)}
                <span>{getStatusText(billing.status)}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jumlah</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {billing.formatted_amount || formatCurrency(billing.amount)}
                  </div>
                  {billing.payment_code && (
                    <div className="text-xs text-gray-500 mt-1">
                      Kode unik: {billing.payment_code}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col space-y-2">
              {billing.status === 'unpaid' && (
                <button
                  onClick={() => onTripayPayment(billing)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar via Tripay</span>
                </button>
              )}
              
              {billing.status === 'pending' && (
                <button
                  onClick={() => onCheckStatus(billing)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Cek Status</span>
                </button>
              )}
              
              {billing.status === 'paid' && (
                <div className="bg-green-100 text-green-800 font-medium py-2.5 px-6 rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Sudah Lunas</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingList;
