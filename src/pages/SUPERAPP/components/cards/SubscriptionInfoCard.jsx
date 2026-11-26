import React from 'react';
import { 
  FaCrown, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaFileAlt,
  FaCreditCard
} from 'react-icons/fa';
import { 
  formatCurrency, 
  formatDate, 
  formatPlanName 
} from '../../../../utils/billingFormatter';

const SubscriptionInfoCard = ({ subscription, plan }) => {
  if (!subscription) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FaCrown className="text-purple-600 text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-montserrat">Subscription Information</h3>
            <p className="text-sm text-gray-500 font-montserrat">No Active Subscription</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 font-montserrat text-center py-4">
            This billing is not associated with any subscription
          </p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'expired':
        return <FaTimesCircle className="text-red-500" />;
      case 'cancelled':
        return <FaTimesCircle className="text-gray-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'expired':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'cancelled':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="p-2 bg-purple-100 rounded-lg">
          <FaCrown className="text-purple-600 text-lg" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-montserrat">Subscription Information</h3>
          <p className="text-sm text-gray-500 font-montserrat">Plan & Billing Details</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Plan Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCrown className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Plan Name</span>
          </div>
          <span className="text-sm font-bold text-gray-900 font-montserrat">
            {plan ? formatPlanName(plan.name) : 'N/A'}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span className="text-sm font-medium text-gray-600 font-montserrat">Status</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(subscription.status)}`}>
            {getStatusIcon(subscription.status)}
            {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Price</span>
          </div>
          <span className="text-sm font-bold text-gray-900 font-montserrat">
            {formatCurrency(subscription.price)}
          </span>
        </div>

        {/* Final Price */}
        {subscription.final_price && subscription.final_price !== subscription.price && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaDollarSign className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Final Price</span>
            </div>
            <span className="text-sm font-bold text-gray-900 font-montserrat">
              {formatCurrency(subscription.final_price)}
            </span>
          </div>
        )}

        {/* Discount */}
        {subscription.discount_amount && parseFloat(subscription.discount_amount) > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaDollarSign className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Discount</span>
            </div>
            <span className="text-sm font-bold text-red-600 font-montserrat">
              -{formatCurrency(subscription.discount_amount)}
            </span>
          </div>
        )}

        {/* Start Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Start Date</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            {formatDate(subscription.start_date, { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {/* End Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">End Date</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            {formatDate(subscription.end_date, { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {/* Duration */}
        {plan && plan.duration_days && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Duration</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 font-montserrat">
              {plan.duration_days} days
            </span>
          </div>
        )}

        {/* Auto Renew */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaSync className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Auto Renew</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            subscription.auto_renew 
              ? 'text-green-700 bg-green-100 border border-green-200' 
              : 'text-gray-700 bg-gray-100 border border-gray-200'
          }`}>
            {subscription.auto_renew ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Payment Method */}
        {subscription.payment_method && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCreditCard className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Payment Method</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 font-montserrat">
              {subscription.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        )}

        {/* Notes */}
        {subscription.notes && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <FaFileAlt className="text-gray-400 text-sm mt-1" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-600 font-montserrat block mb-1">Notes</span>
                <p className="text-sm text-gray-900 font-montserrat bg-gray-50 p-2 rounded-lg">
                  {subscription.notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionInfoCard;
