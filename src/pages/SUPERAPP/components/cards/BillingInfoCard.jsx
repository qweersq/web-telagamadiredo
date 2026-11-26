import React from 'react';
import { 
  FaReceipt, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaCreditCard,
  FaFileAlt,
  FaClock
} from 'react-icons/fa';
import { 
  formatCurrency, 
  formatBillingStatus, 
  formatPaymentMethod, 
  formatDate, 
  formatInvoiceNumber 
} from '../../../../utils/billingFormatter';

const BillingInfoCard = ({ billing }) => {
  if (!billing) return null;

  const statusInfo = formatBillingStatus(billing.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FaReceipt className="text-blue-600 text-lg" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-montserrat">Billing Information</h3>
          <p className="text-sm text-gray-500 font-montserrat">Invoice & Payment Details</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Invoice Number */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFileAlt className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Invoice Number</span>
          </div>
          <span className="text-sm font-bold text-gray-900 font-montserrat">
            {formatInvoiceNumber(billing.invoice_number)}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Amount</span>
          </div>
          <span className="text-lg font-bold text-gray-900 font-montserrat">
            {formatCurrency(billing.amount)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusInfo.bgColor.replace('bg-', 'bg-')}`}></div>
            <span className="text-sm font-medium text-gray-600 font-montserrat">Status</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            {statusInfo.icon} {statusInfo.text}
          </span>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Due Date</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            {formatDate(billing.due_date, { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {/* Payment Method */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCreditCard className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Payment Method</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            {formatPaymentMethod(billing.payment_method)}
          </span>
        </div>

        {/* Payment Reference */}
        {billing.payment_reference && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaFileAlt className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Reference</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 font-montserrat">
              {billing.payment_reference}
            </span>
          </div>
        )}

        {/* Paid At */}
        {billing.paid_at && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Paid At</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 font-montserrat">
              {formatDate(billing.paid_at, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {/* Notes */}
        {billing.notes && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <FaFileAlt className="text-gray-400 text-sm mt-1" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-600 font-montserrat block mb-1">Notes</span>
                <p className="text-sm text-gray-900 font-montserrat bg-gray-50 p-2 rounded-lg">
                  {billing.notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingInfoCard;
