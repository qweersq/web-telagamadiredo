import React from 'react';
import { 
  FaFileAlt, 
  FaBuilding, 
  FaDollarSign, 
  FaCalendarAlt,
  FaCreditCard,
  FaCheckCircle
} from 'react-icons/fa';
import { formatCurrency, formatDate, formatPaymentMethod } from '../../../../utils/billingFormatter';

const BillingPreview = ({ formData, tenant, selectedPlan }) => {
  if (!formData || !tenant) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <FaFileAlt className="text-sm" />
          <span className="text-sm font-medium">Complete the form to see preview</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <div className="flex items-center gap-2 mb-4">
        <FaCheckCircle className="text-green-600 text-lg" />
        <h3 className="text-lg font-semibold text-green-900 font-montserrat">
          Billing Preview
        </h3>
      </div>

      <div className="space-y-3">
        {/* Invoice Number */}
        <div className="flex items-center justify-between py-2 border-b border-green-200">
          <div className="flex items-center gap-2">
            <FaFileAlt className="text-gray-500 text-sm" />
            <span className="text-sm font-medium text-gray-700">Invoice Number</span>
          </div>
          <span className="text-sm font-mono font-semibold text-gray-900">
            {formData.invoice_number || 'INV-XXXX-XXX'}
          </span>
        </div>

        {/* Tenant */}
        <div className="flex items-center justify-between py-2 border-b border-green-200">
          <div className="flex items-center gap-2">
            <FaBuilding className="text-gray-500 text-sm" />
            <span className="text-sm font-medium text-gray-700">Tenant</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {tenant.business_name || 'N/A'}
          </span>
        </div>

        {/* Plan */}
        {selectedPlan && (
          <div className="flex items-center justify-between py-2 border-b border-green-200">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-700">Plan</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {selectedPlan.name}
            </span>
          </div>
        )}

        {/* Amount */}
        <div className="flex items-center justify-between py-2 border-b border-green-200">
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-gray-500 text-sm" />
            <span className="text-sm font-medium text-gray-700">Amount</span>
          </div>
          <span className="text-sm font-bold text-green-600">
            {formatCurrency(formData.amount || 0)}
          </span>
        </div>

        {/* Payment Method */}
        {formData.payment_method && (
          <div className="flex items-center justify-between py-2 border-b border-green-200">
            <div className="flex items-center gap-2">
              <FaCreditCard className="text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-700">Payment Method</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatPaymentMethod(formData.payment_method)}
            </span>
          </div>
        )}

        {/* Due Date */}
        {formData.due_date && (
          <div className="flex items-center justify-between py-2 border-b border-green-200">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-700">Due Date</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(formData.due_date)}
            </span>
          </div>
        )}

        {/* Billing Period */}
        {formData.billing_period && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-700">Billing Period</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formData.billing_period}
            </span>
          </div>
        )}

        {/* Notes */}
        {formData.notes && (
          <div className="pt-3 border-t border-green-200">
            <div className="flex items-start gap-2">
              <FaFileAlt className="text-gray-500 text-sm mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-gray-700 block mb-1">Notes</span>
                <p className="text-sm text-gray-600 italic">
                  "{formData.notes}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPreview;
