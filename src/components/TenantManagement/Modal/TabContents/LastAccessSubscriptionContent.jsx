import React from 'react';
import { FaExclamationTriangle, FaCreditCard, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { formatDate, formatDaysRemaining } from '../../../../utils/dateUtils';
import { formatCurrency } from '../../../../utils/labelFormatter';

const LastAccessSubscriptionContent = ({ tenant, data, onAction }) => {
  const subscription = data?.subscription || tenant.subscriptions?.[0];
  const subscriptionEndDate = subscription?.end_date ? new Date(subscription.end_date) : null;
  const daysRemaining = subscriptionEndDate ? formatDaysRemaining(subscriptionEndDate) : null;
  const isUrgent = daysRemaining && daysRemaining <= 3;

  return (
    <div className="space-y-4">
      {/* Expiration Alert */}
      <div className={`flex items-center space-x-3 p-3 rounded-lg ${
        isUrgent ? 'bg-red-50' : 'bg-orange-50'
      }`}>
        <FaExclamationTriangle className={isUrgent ? 'text-red-500' : 'text-orange-500'} />
        <div>
          <p className={`text-sm font-medium ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
            {isUrgent ? 'Subscription Expiring Soon!' : 'Subscription Ending'}
          </p>
          <p className={`text-xs ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
            {subscriptionEndDate ? `Ends on ${formatDate(subscriptionEndDate)}` : 'Subscription ending'}
          </p>
        </div>
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Plan</span>
            <span className="text-sm font-medium">{subscription.plan?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price</span>
            <span className="text-sm font-medium">
              {formatCurrency(subscription.final_price || subscription.price || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Days Remaining */}
      {subscriptionEndDate && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Days Remaining</span>
            <span className={`text-sm font-medium ${
              isUrgent ? 'text-red-600' : 'text-orange-600'
            }`}>
              {daysRemaining || 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Business Metrics */}
      {data?.analytics?.business_metrics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-gray-900">
              {data.analytics.business_metrics.customers_count || 0}
            </div>
            <div className="text-xs text-gray-600">Customers</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-gray-900">
              {data.analytics.business_metrics.orders_count || 0}
            </div>
            <div className="text-xs text-gray-600">Orders</div>
          </div>
        </div>
      )}

      {/* Revenue Info */}
      {data?.analytics?.business_metrics && (
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <span className="text-sm font-semibold text-orange-800">
              {formatCurrency(data.analytics.business_metrics.total_revenue || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">This Month</span>
            <span className="text-xs font-medium text-orange-700">
              {formatCurrency(data.analytics.business_metrics.revenue_this_month || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Auto Renewal Status */}
      {subscription && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Auto Renewal</span>
            <span className={`text-sm font-medium ${
              subscription.auto_renew ? 'text-green-600' : 'text-red-600'
            }`}>
              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      )}

      {/* Action Recommendations */}
      <div className="p-3 bg-yellow-50 rounded-lg">
        <div className="text-sm font-medium text-yellow-800 mb-2">Recommended Actions</div>
        <div className="space-y-1 text-xs text-yellow-700">
          {isUrgent ? (
            <>
              <div>• Send urgent renewal reminder</div>
              <div>• Check payment method validity</div>
              <div>• Offer payment assistance if needed</div>
              <div>• Prepare for potential churn</div>
            </>
          ) : (
            <>
              <div>• Send renewal reminder</div>
              <div>• Verify payment method</div>
              <div>• Offer upgrade incentives</div>
              <div>• Highlight value of continued service</div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default LastAccessSubscriptionContent;
