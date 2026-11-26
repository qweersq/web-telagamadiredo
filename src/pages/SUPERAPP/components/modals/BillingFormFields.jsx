import React from 'react';
import { 
  FaFileAlt, 
  FaDollarSign, 
  FaCreditCard, 
  FaCalendarAlt,
  FaEdit,
  FaCheck
} from 'react-icons/fa';
import { formatCurrency } from '../../../../utils/billingFormatter';

const BillingFormFields = ({ 
  formData, 
  onFieldChange, 
  isEditingAmount, 
  onToggleEditAmount,
  subscriptionPlans = [],
  selectedPlan
}) => {
  const generateInvoiceNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${dateStr}-${random}`;
  };

  const handleAmountChange = (e) => {
    // Remove all non-digit characters and convert to integer
    const value = e.target.value.replace(/[^\d]/g, '');
    const intValue = parseInt(value) || 0;
    onFieldChange('amount', intValue);
  };

  const handlePlanChange = (e) => {
    const planId = parseInt(e.target.value);
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (plan) {
      onFieldChange('subscription_plan_id', planId);
      // Convert price to integer to avoid decimal formatting issues
      onFieldChange('amount', parseInt(parseFloat(plan.price)));
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FaFileAlt className="text-blue-600 text-lg" />
        <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
          Billing Details
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-montserrat">
            Invoice Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.invoice_number || generateInvoiceNumber()}
              onChange={(e) => onFieldChange('invoice_number', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white hover:border-gray-400 transition-colors duration-200"
              placeholder="INV-YYYYMMDD-XXX"
            />
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-montserrat">
            Subscription Plan *
          </label>
          <select
            value={formData.subscription_plan_id || ''}
            onChange={handlePlanChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm bg-white hover:border-gray-400 transition-colors duration-200"
          >
            <option value="">Select a plan</option>
            {subscriptionPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {formatCurrency(plan.price)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-montserrat">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-600 text-sm font-semibold">Rp</span>
            </div>
            <input
              type="text"
              value={isEditingAmount ? formData.amount?.toLocaleString() || '' : (formData.amount || 0).toLocaleString()}
              onChange={handleAmountChange}
              onFocus={() => onToggleEditAmount(true)}
              onBlur={() => onToggleEditAmount(false)}
              className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm bg-white hover:border-gray-400 transition-colors duration-200"
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => onToggleEditAmount(!isEditingAmount)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-600 transition-colors duration-200"
            >
              {isEditingAmount ? (
                <FaCheck className="text-sm" />
              ) : (
                <FaEdit className="text-sm" />
              )}
            </button>
          </div>
          {formData.amount > 0 && (
            <div className="text-xs text-gray-500 font-montserrat">
              Total: {formatCurrency(formData.amount)}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-montserrat">
            Payment Method
          </label>
          <select
            value={formData.payment_method || ''}
            onChange={(e) => onFieldChange('payment_method', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm bg-white hover:border-gray-400 transition-colors duration-200"
          >
            <option value="">Select payment method</option>
            <option value="manual_bank_transfer">Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="e_wallet">E-Wallet</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-montserrat">
            Due Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => onFieldChange('due_date', e.target.value)}
              min={getMinDate()}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm bg-white hover:border-gray-400 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Billing Period */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-montserrat">
            Billing Period
          </label>
          <input
            type="month"
            value={formData.billing_period || new Date().toISOString().slice(0, 7)}
            onChange={(e) => onFieldChange('billing_period', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm bg-white hover:border-gray-400 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 font-montserrat">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-montserrat text-sm bg-white hover:border-gray-400 transition-colors duration-200"
          placeholder="Add any additional notes or context for this billing..."
        />
      </div>
    </div>
  );
};

export default BillingFormFields;
