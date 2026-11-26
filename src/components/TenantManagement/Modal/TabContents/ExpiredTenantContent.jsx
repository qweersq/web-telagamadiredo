import React from 'react';
import { FaTimesCircle, FaClock, FaUser, FaChartLine } from 'react-icons/fa';
import { formatDate, formatDaysSince } from '../../../../utils/dateUtils';
import { formatCurrency } from '../../../../utils/labelFormatter';

const ExpiredTenantContent = ({ tenant, data, onAction }) => {
  // Use real data from API response
  const tenantData = data || {};
  const expirationDate = tenantData.churn_info?.last_active ? new Date(tenantData.churn_info.last_active) : null;
  const daysSinceExpired = expirationDate ? formatDaysSince(expirationDate) : null;
  const churnReason = 'Account expired or cancelled';

  return (
    <div className="space-y-4">
      {/* Expired Status */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <FaTimesCircle className="text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-800">Account Expired</p>
          <p className="text-xs text-gray-600">
            {expirationDate ? `Expired on ${formatDate(expirationDate)}` : 'Account no longer active'}
          </p>
        </div>
      </div>

      {/* Expiration Info */}
      {expirationDate && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Days Since Expired</span>
            <span className="text-sm font-medium text-gray-800">
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

      {/* Final Revenue */}
      {data?.analytics?.business_metrics && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Final Revenue</span>
            <span className="text-sm font-semibold text-gray-800">
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

      {/* Recovery Strategy */}
      <div className="p-3 bg-yellow-50 rounded-lg">
        <div className="text-sm font-medium text-yellow-800 mb-2">Recovery Strategy</div>
        <div className="space-y-1 text-xs text-yellow-700">
          <div>• Send win-back email with special offer</div>
          <div>• Highlight new features since they left</div>
          <div>• Offer free trial extension</div>
          <div>• Provide direct contact for personal assistance</div>
        </div>
      </div>

    </div>
  );
};

export default ExpiredTenantContent;
