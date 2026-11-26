import React from 'react';
import { FaTimesCircle, FaClock, FaUser, FaChartLine } from 'react-icons/fa';
import { formatDate, formatDaysSince } from '../../../../utils/dateUtils';
import { formatCurrency } from '../../../../utils/labelFormatter';

const ExpiredTrialContent = ({ tenant, data, onAction }) => {
  // Use real data from API response
  const tenantData = data || {};
  const trialEndDate = tenant.trial_end_date ? new Date(tenant.trial_end_date) : null;
  const daysSinceExpired = trialEndDate ? formatDaysSince(trialEndDate) : null;

  return (
    <div className="space-y-4">
      {/* Expired Status */}
      <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
        <FaTimesCircle className="text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Trial Expired</p>
          <p className="text-xs text-red-600">
            {trialEndDate ? `Expired on ${formatDate(trialEndDate)}` : 'Trial period ended'}
          </p>
        </div>
      </div>

      {/* Expiration Info */}
      {trialEndDate && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Days Since Expired</span>
            <span className="text-sm font-medium text-red-600">
              {daysSinceExpired || 'Unknown'}
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

      {/* Performance Metrics */}
      {data?.analytics?.performance_metrics && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Final Engagement</span>
            <span className="text-sm font-semibold text-gray-800">
              {data.analytics.performance_metrics.engagement_score || 0}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Activity Level</span>
            <span className="text-xs font-medium text-gray-700 capitalize">
              {data.analytics.performance_metrics.activity_level || 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Recovery Options */}
      <div className="p-3 bg-yellow-50 rounded-lg">
        <div className="text-sm font-medium text-yellow-800 mb-2">Recovery Options</div>
        <div className="space-y-1 text-xs text-yellow-700">
          <div>• Send re-engagement email with special offer</div>
          <div>• Offer extended trial if they were engaged</div>
          <div>• Provide direct contact for personal assistance</div>
        </div>
      </div>

    </div>
  );
};

export default ExpiredTrialContent;
