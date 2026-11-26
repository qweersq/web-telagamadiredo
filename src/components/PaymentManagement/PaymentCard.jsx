import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaBuilding, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const PaymentCard = ({
  payment,
  selectedPayments,
  onSelectPayment,
  onApprovePayment,
  onRejectPayment,
  onViewPayment,
  actionLoading,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon
}) => {
  const isSelected = selectedPayments.includes(payment.id);
  const isPending = payment.status === 'pending';

  const handleCardClick = (e) => {
    // Prevent click if clicking on checkbox or action buttons
    if (e.target.type === 'checkbox' || e.target.closest('button')) {
      return;
    }
    onViewPayment(payment.id);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
      }`}
      onClick={handleCardClick}
    >
      {/* Mobile Layout - Compact */}
      <div className="sm:hidden">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isPending && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectPayment(payment.id)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}
              <span className="text-xs font-bold text-gray-900 font-montserrat">#{payment.id}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-sm font-bold ${getStatusColor(payment.status)}`}>
              {payment.status.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 font-montserrat truncate flex-1 mr-2">
              {payment.tenant?.business_name?.substring(0, 12) || 'Unknown'}
            </span>
            <span className="text-md font-bold text-gray-900 font-montserrat">
              {formatCurrency(payment.amount).replace('Rp', '')}
            </span>
          </div>
          
          {isPending && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onApprovePayment(payment.id)}
                disabled={actionLoading[payment.id] === 'approving'}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
                  actionLoading[payment.id] === 'approving'
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                }`}
              >
                {actionLoading[payment.id] === 'approving' ? (
                  <FaSpinner className="inline mr-1 animate-spin" />
                ) : (
                  <FaCheckCircle className="inline mr-1" />
                )}
                Approve
              </button>
              <button
                onClick={() => onRejectPayment(payment.id)}
                disabled={actionLoading[payment.id] === 'rejecting'}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
                  actionLoading[payment.id] === 'rejecting'
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                }`}
              >
                {actionLoading[payment.id] === 'rejecting' ? (
                  <FaSpinner className="inline mr-1 animate-spin" />
                ) : (
                  <FaTimesCircle className="inline mr-1" />
                )}
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Table-like */}
      <div className="hidden sm:block">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {isPending && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectPayment(payment.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 font-montserrat">
                  {payment.payment_reference || `PAY-${payment.id}`}
                </h3>
                <p className="text-xs text-gray-500 font-montserrat">ID: {payment.id}</p>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-gray-400 text-sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-montserrat">
                      {payment.tenant?.business_name || 'Unknown Business'}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {payment.tenant?.owner_name || 'Unknown Owner'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 font-montserrat">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-gray-500 font-montserrat">
                  {payment.payment_method || 'N/A'}
                </p>
              </div>
              
              <div className="text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                  <span className="ml-1 font-montserrat">{payment.status.toUpperCase()}</span>
                </span>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  {formatDate(payment.createdAt)}
                </p>
              </div>
            </div>
            
            {isPending && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onApprovePayment(payment.id)}
                  disabled={actionLoading[payment.id] === 'approving'}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    actionLoading[payment.id] === 'approving'
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                  }`}
                  title="Approve Payment"
                >
                  {actionLoading[payment.id] === 'approving' ? (
                    <FaSpinner className="text-sm animate-spin" />
                  ) : (
                    <FaCheckCircle className="text-sm" />
                  )}
                </button>
                <button
                  onClick={() => onRejectPayment(payment.id)}
                  disabled={actionLoading[payment.id] === 'rejecting'}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    actionLoading[payment.id] === 'rejecting'
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                  }`}
                  title="Reject Payment"
                >
                  {actionLoading[payment.id] === 'rejecting' ? (
                    <FaSpinner className="text-sm animate-spin" />
                  ) : (
                    <FaTimesCircle className="text-sm" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PaymentCard;
