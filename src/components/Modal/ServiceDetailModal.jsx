import React from 'react';
import { X, Eye, Phone, Calendar, DollarSign, Package } from 'lucide-react';
import { formatOrderDetailStatus, formatCurrency, formatDate } from '../../utils/labelFormatter';

const ServiceDetailModal = ({ 
  status, 
  orders, 
  onClose, 
  onOrderClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
  totalCount,
  error
}) => {
  // Helper function untuk format status (menggunakan formatter baru)
  const formatStatus = (status) => {
    return formatOrderDetailStatus(status);
  };

  // Helper function untuk format currency (menggunakan formatter baru)
  const formatCurrencyAmount = (amount) => {
    return formatCurrency(amount);
  };

  // Helper function untuk format date (menggunakan formatter baru)
  const formatDateString = (dateString) => {
    return formatDate(dateString);
  };

  // Helper function untuk mendapatkan treatment names
  const getTreatmentNames = (orderDetails) => {
    if (!orderDetails || !Array.isArray(orderDetails)) return '-';
    const treatments = orderDetails.map(detail => detail.treatment?.name).filter(Boolean);
    return treatments.length > 0 ? treatments.join(', ') : '-';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-4 relative animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-lg text-gray-900 font-montserrat">
              Pesanan dengan status {formatStatus(status)}
            </h3>
            {/* <p className="text-sm text-gray-600 font-montserrat">
              Menampilkan {orders.length} dari {totalCount || orders.length} order
            </p> */}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="font-montserrat text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {orders.length === 0 && !error ? (
            <div className="text-center py-8 text-gray-500 font-montserrat">
              <div className="text-4xl mb-2">📋</div>
              <div>No orders found</div>
            </div>
          ) : (
            orders.map(order => (
              <div 
                key={order.id}
                onClick={() => onOrderClick(order.id)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Order ID & Customer */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-600 font-montserrat text-lg">
                        #{order.id}
                      </span>
                      <span className="text-gray-600 font-montserrat text-sm">
                        {order.customer?.name || '-'}
                      </span>
                    </div>
                    
                    {/* Order Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Package className="w-3 h-3" />
                        <span className="font-montserrat">
                          {getTreatmentNames(order.order_details)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-montserrat font-semibold">
                          {order.payment?.paid_amount && order.payment?.remaining_amount ? 
                            formatCurrencyAmount(
                              (parseFloat(order.payment.paid_amount) + 
                               parseFloat(order.payment.remaining_amount))
                            ) : 
                            '-'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span className="font-montserrat">
                          {formatDateString(order.entry_date)}
                        </span>
                      </div>
                      
                      {order.customer?.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span className="font-montserrat">
                            {order.customer.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Icon */}
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                
                {/* Service Status Info */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-montserrat">Status:</span>
                    <span className={`font-semibold font-montserrat ${
                      status === 'done' || status === 'selesai' ? 'text-green-600' :
                      status === 'cancelled' ? 'text-red-600' :
                      status === 'on_progress' || status === 'pengeringan' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {formatStatus(status)}
                    </span>
                  </div>
                  {order.order_details && order.order_details.length > 0 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-600 font-montserrat">Items:</span>
                      <span className="font-semibold text-gray-800 font-montserrat">
                        {order.order_details.length} item{order.order_details.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Load More Button */}
          {hasMore && orders.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors font-montserrat font-medium flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Orders
                    <span className="text-xs opacity-75">
                      ({totalCount ? totalCount - orders.length : 0} remaining)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-montserrat font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
