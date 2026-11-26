import React from 'react';
import { FaCheckCircle, FaClock, FaChartLine, FaUser } from 'react-icons/fa';
import { formatDate, formatDaysRemaining } from '../../../../utils/dateUtils';
import { formatCurrency } from '../../../../utils/labelFormatter';

const ActiveTrialContent = ({ tenant, data, onAction }) => {
  const trialEndDate = tenant.trial_end_date ? new Date(tenant.trial_end_date) : null;
  const daysRemaining = trialEndDate ? formatDaysRemaining(trialEndDate) : null;
  const trialStartDate = tenant.trial_start_date ? new Date(tenant.trial_start_date) : null;
  const daysUsed = trialStartDate ? Math.ceil((new Date() - trialStartDate) / (1000 * 60 * 60 * 24)) : 0;
  const totalDays = trialStartDate && trialEndDate ? Math.ceil((trialEndDate - trialStartDate) / (1000 * 60 * 60 * 24)) : 0;
  const progressPercentage = totalDays > 0 ? Math.min((daysUsed / totalDays) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      {/* Trial Status */}
      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
        <FaCheckCircle className="text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-800">Active Trial</p>
          <p className="text-xs text-blue-600">
            {daysRemaining ? `${daysRemaining} days remaining` : 'Trial in progress'}
          </p>
        </div>
      </div>

      {/* Trial Progress */}
      {trialEndDate && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Trial Period</span>
            <span className="text-sm font-medium">{formatDate(trialEndDate)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
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
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <span className="text-sm font-semibold text-green-800">
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

    </div>
  );
};

export default ActiveTrialContent;
