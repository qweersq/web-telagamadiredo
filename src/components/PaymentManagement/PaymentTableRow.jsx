import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaEye, FaSpinner, FaBuilding } from 'react-icons/fa';

const PaymentTableRow = ({ 
  payment, 
  selectedPayments, 
  onSelectPayment, 
  onApprovePayment, 
  onRejectPayment, 
  actionLoading,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon 
}) => {
  return (
    <tr key={payment.id} className="hover:bg-gray-50">
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        {payment.status === 'pending' && (
          <input
            type="checkbox"
            checked={selectedPayments.includes(payment.id)}
            onChange={() => onSelectPayment(payment.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        )}
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 font-montserrat">
          <span className="hidden sm:inline">{payment.payment_reference || `PAY-${payment.id}`}</span>
          <span className="sm:hidden text-xs">#{payment.id}</span>
        </div>
        <div className="text-sm text-gray-500 font-montserrat hidden sm:block">
          ID: {payment.id}
        </div>
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 hidden md:block">
            <FaBuilding className="text-blue-500 text-sm" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 font-montserrat">
              <span className="hidden md:inline">{payment.tenant?.business_name || 'Unknown'}</span>
              <span className="md:hidden text-xs">{payment.tenant?.business_name?.substring(0, 10) || 'Unknown'}</span>
            </div>
            <div className="text-sm text-gray-500 font-montserrat hidden md:block">
              {payment.tenant?.owner_name || 'Unknown Owner'}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 font-montserrat">
          <span className="hidden sm:inline">{formatCurrency(payment.amount)}</span>
          <span className="sm:hidden text-xs">{formatCurrency(payment.amount).replace('Rp', '')}</span>
        </div>
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {getStatusIcon(payment.status)}
          <span className="ml-1 font-montserrat hidden sm:inline">{payment.status}</span>
          <span className="ml-1 font-montserrat sm:hidden">{payment.status.charAt(0).toUpperCase()}</span>
        </span>
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-montserrat">
        <span className="hidden lg:inline">{payment.payment_method || 'N/A'}</span>
        <span className="lg:hidden text-xs">{payment.payment_method?.substring(0, 3) || 'N/A'}</span>
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-montserrat">
        <span className="hidden md:inline">{formatDate(payment.createdAt)}</span>
        <span className="md:hidden text-xs">{formatDate(payment.createdAt).substring(0, 5)}</span>
      </td>
      
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => alert('View payment details - Coming soon!')}
            className="p-1 sm:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-montserrat"
            title="View Details"
          >
            <FaEye className="text-sm sm:text-lg" />
          </button>
          
          {payment.status === 'pending' && (
            <>
              <button
                onClick={() => onApprovePayment(payment.id)}
                disabled={actionLoading[payment.id] === 'approving'}
                className={`p-1 sm:p-2 rounded-lg transition-colors duration-200 font-montserrat ${
                  actionLoading[payment.id] === 'approving'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                }`}
                title="Approve Payment"
              >
                {actionLoading[payment.id] === 'approving' ? (
                  <FaSpinner className="text-sm sm:text-lg animate-spin" />
                ) : (
                  <FaCheckCircle className="text-sm sm:text-lg" />
                )}
              </button>
              <button
                onClick={() => onRejectPayment(payment.id)}
                disabled={actionLoading[payment.id] === 'rejecting'}
                className={`p-1 sm:p-2 rounded-lg transition-colors duration-200 font-montserrat ${
                  actionLoading[payment.id] === 'rejecting'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                }`}
                title="Reject Payment"
              >
                {actionLoading[payment.id] === 'rejecting' ? (
                  <FaSpinner className="text-sm sm:text-lg animate-spin" />
                ) : (
                  <FaTimesCircle className="text-sm sm:text-lg" />
                )}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PaymentTableRow;
