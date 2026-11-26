import React from 'react';
import { FaExclamationTriangle, FaClock, FaUser, FaChartLine } from 'react-icons/fa';
import { formatDate, formatDaysRemaining, formatDaysSince } from '../../../../utils/dateUtils';
import { formatCurrency } from '../../../../utils/labelFormatter';

const LastAccessTrialContent = ({ tenant, data, onAction }) => {
  const trialEndDate = tenant.trial_end_date ? new Date(tenant.trial_end_date) : null;
  const daysRemaining = trialEndDate ? formatDaysRemaining(trialEndDate) : null;
  const lastLoginDate = data?.last_login ? new Date(data.last_login) : null;
  const daysSinceLogin = lastLoginDate ? formatDaysSince(lastLoginDate) : null;
  const isUrgent = daysRemaining && daysRemaining <= 1;

  return (
    <div className="space-y-4">
      {/* Urgency Alert */}
      <div className={`flex items-center space-x-3 p-3 rounded-lg ${
        isUrgent ? 'bg-red-50' : 'bg-orange-50'
      }`}>
        <FaExclamationTriangle className={isUrgent ? 'text-red-500' : 'text-orange-500'} />
        <div>
          <p className={`text-sm font-medium ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
            {isUrgent ? 'Trial Expiring Today!' : 'Trial Ending Soon'}
          </p>
          <p className={`text-xs ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
            {trialEndDate ? `Ends on ${formatDate(trialEndDate)}` : 'Trial period ending'}
          </p>
        </div>
      </div>

      {/* Trial Info */}
      {trialEndDate && (
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
            <span className="text-sm text-gray-600">Trial Revenue</span>
            <span className="text-sm font-semibold text-orange-800">
              {formatCurrency(data.analytics.business_metrics.total_revenue || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Activity Info */}
      {data?.analytics?.recent_activity && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Order</span>
            <span className="font-medium">
              {data.analytics.recent_activity.last_order_date ? 
                formatDate(new Date(data.analytics.recent_activity.last_order_date)) : 'Never'
              }
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Customer</span>
            <span className="font-medium">
              {data.analytics.recent_activity.last_customer_name || 'None'}
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
              <div>• Send immediate reminder via WhatsApp</div>
              <div>• Offer trial extension if engaged</div>
              <div>• Prepare for potential churn</div>
            </>
          ) : (
            <>
              <div>• Send gentle reminder about trial ending</div>
              <div>• Highlight key features they haven't used</div>
              <div>• Offer upgrade incentives</div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default LastAccessTrialContent;
