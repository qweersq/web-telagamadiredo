import React from 'react';
import { FaExclamationTriangle, FaClock, FaEnvelope, FaPhone } from 'react-icons/fa';
import { formatDate, formatDaysRemaining } from '../../../../utils/dateUtils';
import { formatPhoneNumber } from '../../../../utils/labelFormatter';

const UnverifiedContent = ({ tenant, data, onAction }) => {
  // Use real data from API response
  const tenantData = data || {};
  const trialEndDate = tenant.trial_end_date ? new Date(tenant.trial_end_date) : null;
  const daysRemaining = trialEndDate ? formatDaysRemaining(trialEndDate) : null;
  const isUrgent = daysRemaining && daysRemaining <= 3;

  return (
    <div className="space-y-4">
      {/* Status Alert */}
      <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
        <FaExclamationTriangle className="text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Email Verification Pending</p>
          <p className="text-xs text-red-600">Account needs email verification to activate</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <FaEnvelope className="text-gray-400 w-4" />
          <span className="text-sm text-gray-600">{tenant.email}</span>
        </div>
        <div className="flex items-center space-x-3">
          <FaPhone className="text-gray-400 w-4" />
          <span className="text-sm text-gray-600">{formatPhoneNumber(tenant.phone)}</span>
        </div>
      </div>

      {/* Trial Info */}
      {trialEndDate && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Trial Period</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{formatDate(trialEndDate)}</span>
              {daysRemaining > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isUrgent ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {daysRemaining} days left
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Data */}
      {data?.analytics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-gray-900">
              {data.analytics.business_metrics?.customers_count || 0}
            </div>
            <div className="text-xs text-gray-600">Customers</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-gray-900">
              {data.analytics.business_metrics?.orders_count || 0}
            </div>
            <div className="text-xs text-gray-600">Orders</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UnverifiedContent;
