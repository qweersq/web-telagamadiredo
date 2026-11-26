import React from 'react';
import { RefreshCw, Settings } from 'lucide-react';

const StatusAlert = ({ tenantInfo, tenantStatus, onRefresh, onChangePlan }) => {
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

  // Determine status message and button text
  const isTrialExpired = tenantStatus === 'expired' && !tenantInfo?.subscription;
  const isActiveExpired = tenantStatus === 'expired' && tenantInfo?.subscription;
  
  const statusTitle = isTrialExpired ? 'Trial Berakhir' : 'Langganan Berakhir';
  const statusMessage = isTrialExpired 
    ? 'Masa trial telah berakhir, silakan pilih paket untuk melanjutkan'
    : 'Langganan telah berakhir, silakan lakukan pembayaran untuk melanjutkan';
  const buttonText = isTrialExpired ? 'Pilih Paket' : 'Ganti Paket';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {statusTitle}
        </h2>
        <p className="text-gray-600">
          {statusMessage}
        </p>
      </div>
      
      {tenantInfo && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Bisnis</span>
              <p className="font-semibold text-gray-900">
                {tenantInfo.tenant?.business_name || tenantInfo.business_name || 'Tidak diketahui'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Paket</span>
              <p className="font-semibold text-gray-900">
                {tenantInfo.subscription?.plan?.name || 'Tidak ada'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <p className="font-semibold text-gray-900">
                {tenantInfo.tenant?.status || tenantInfo.status || 'Suspended'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Berakhir</span>
              <p className="font-semibold text-gray-900">
                {formatDate(tenantInfo.subscription?.end_date || tenantInfo.tenant?.trial_end_date)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-center space-x-2">
        <button
          onClick={onChangePlan}
          className="flex items-center space-x-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{buttonText}</span>
        </button>
        
        <button
          onClick={onRefresh}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Perbarui</span>
        </button>
      </div>
    </div>
  );
};

export default StatusAlert;
