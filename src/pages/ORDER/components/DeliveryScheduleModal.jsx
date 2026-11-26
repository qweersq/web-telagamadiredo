import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { toLocalDateString, normalizeTimeString } from '../../../utils/dateUtils';

const DeliveryScheduleModal = ({ isOpen, onClose, onSchedule, orderDetail, customer, loading, isBatchMode = false, batchCount = 0 }) => {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  if (!isOpen) return null;

  // Tanggal hari ini menurut zona waktu LOKAL (bukan UTC)
  const today = toLocalDateString(new Date());

  const handleSubmit = () => {
    if (!deliveryDate || !deliveryTime) {
      alert('Mohon isi tanggal dan waktu pengiriman');
      return;
    }

    onSchedule({
      delivery_date: deliveryDate,
      delivery_time: normalizeTimeString(deliveryTime),
      pickup_method: 'delivery'
    });
  };

  const handleClose = () => {
    setDeliveryDate('');
    setDeliveryTime('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-xl border-2 border-[#DBEAFE]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">
                {isBatchMode ? `Jadwalkan Pengiriman (${batchCount} item)` : 'Jadwalkan Pengiriman'}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Customer Info */}
          {!isBatchMode && orderDetail && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="text-sm font-semibold text-gray-800 mb-1 font-montserrat">
                {orderDetail?.treatment?.name || 'Treatment'}
              </div>
              <div className="text-xs text-gray-600 font-montserrat">
                Customer: {customer?.name || 'Unknown'}
              </div>
              {customer?.address && (
                <div className="text-xs text-gray-600 font-montserrat mt-1">
                  Alamat: {customer.address}
                </div>
              )}
            </div>
          )}

          {/* Batch Mode Info */}
          {isBatchMode && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-800 mb-1 font-montserrat">
                Batch Update: {batchCount} Item
              </div>
              <div className="text-xs text-blue-600 font-montserrat">
                Customer: {customer?.name || 'Unknown'}
              </div>
              <div className="text-xs text-blue-600 font-montserrat mt-1">
                Semua item akan dijadwalkan dengan tanggal dan waktu yang sama
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Tanggal Pengiriman */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tanggal Pengiriman
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-montserrat transition-all"
                required
              />
            </div>

            {/* Waktu Pengiriman */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                <Clock className="w-4 h-4 inline mr-1" />
                Waktu Pengiriman
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-montserrat transition-all bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold font-montserrat text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all font-semibold font-montserrat text-sm shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {loading 
                ? (isBatchMode ? `Memproses ${batchCount} item...` : 'Menyimpan...') 
                : (isBatchMode ? `Jadwalkan ${batchCount} Item` : 'Jadwalkan Pengiriman')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryScheduleModal;
