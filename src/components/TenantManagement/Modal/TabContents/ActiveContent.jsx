import React from 'react';
import { FaCheckCircle, FaCreditCard, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { formatDate } from '../../../../utils/dateUtils';
import { formatCurrency } from '../../../../utils/labelFormatter';

const ActiveContent = ({ tenant, data, onAction }) => {
  // Use real data from API response
  const tenantData = data || {};
  const subscription = tenantData.subscription || tenantData.subscriptions?.[0];
  const nextBillingDate = subscription?.end_date ? new Date(subscription.end_date) : null;
  const isAutoRenewal = subscription?.auto_renew || false;

  return (
    <div className="space-y-4">
      {/* Active Status */}
      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
        <FaCheckCircle className="text-green-500" />
        <div>
          <p className="text-sm font-medium text-green-800">Active Subscription</p>
          <p className="text-xs text-green-600">Full access to all features</p>
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
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">This Month</span>
            <span className="text-xs font-medium text-green-700">
              {formatCurrency(data.analytics.business_metrics.revenue_this_month || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {data?.analytics?.performance_metrics && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Engagement Score</span>
            <span className="text-sm font-semibold text-blue-800">
              {data.analytics.performance_metrics.engagement_score || 0}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Activity Level</span>
            <span className="text-xs font-medium text-blue-700 capitalize">
              {data.analytics.performance_metrics.activity_level || 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* WhatsApp Info */}
      {data?.analytics?.whatsapp_info && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">WA Sessions</span>
            <span className="font-medium">
              {data.analytics.whatsapp_info.active_wa_sessions || 0} / {data.analytics.whatsapp_info.wa_sessions_count || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last WA Activity</span>
            <span className="font-medium">
              {data.analytics.whatsapp_info.last_wa_activity ? 
                formatDate(new Date(data.analytics.whatsapp_info.last_wa_activity)) : 'Never'
              }
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActiveContent;
