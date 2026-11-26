import React from 'react';
import { 
  FaBuilding, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { formatDate, formatPhoneNumber } from '../../../../utils/billingFormatter';

const TenantInfoPreview = ({ tenant, subscription }) => {
  if (!tenant) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <FaBuilding className="text-sm" />
          <span className="text-sm font-medium">Select a tenant to view details</span>
        </div>
      </div>
    );
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'No Subscription', color: 'text-gray-500', icon: FaTimesCircle };
    
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const isActive = subscription.status === 'active' && endDate > now;
    
    if (isActive) {
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return { 
        status: `Active (${daysLeft} days left)`, 
        color: 'text-green-600', 
        icon: FaCheckCircle 
      };
    }
    
    return { 
      status: subscription.status === 'active' ? 'Expired' : subscription.status, 
      color: 'text-red-500', 
      icon: FaTimesCircle 
    };
  };

  const statusInfo = getSubscriptionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <FaBuilding className="text-blue-600 text-sm" />
        <h4 className="font-semibold text-blue-900 text-sm">Tenant Information</h4>
      </div>
      
      <div className="space-y-2">
        {/* Business Name */}
        <div className="flex items-center gap-2">
          <FaBuilding className="text-gray-500 text-xs flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {tenant.business_name || 'N/A'}
          </span>
        </div>

        {/* Owner Name */}
        <div className="flex items-center gap-2">
          <FaUser className="text-gray-500 text-xs flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">
            {tenant.owner_name || 'N/A'}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2">
          <FaEnvelope className="text-gray-500 text-xs flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">
            {tenant.email || 'N/A'}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <FaPhone className="text-gray-500 text-xs flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">
            {tenant.phone ? formatPhoneNumber(tenant.phone) : 'N/A'}
          </span>
        </div>

        {/* Subscription Status */}
        <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
          <StatusIcon className={`text-xs flex-shrink-0 ${statusInfo.color}`} />
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.status}
          </span>
        </div>

        {/* Last Payment */}
        {subscription && subscription.last_payment_date && (
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-500 text-xs flex-shrink-0" />
            <span className="text-xs text-gray-600">
              Last payment: {formatDate(subscription.last_payment_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantInfoPreview;
