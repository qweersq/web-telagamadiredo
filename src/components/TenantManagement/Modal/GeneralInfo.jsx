import React from 'react';
import { FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate } from '../../../utils/dateUtils';
import { formatPhoneNumber, formatCurrency } from '../../../utils/labelFormatter';

const GeneralInfo = ({ tenant, data }) => {
  if (!tenant) return null;

  // Use real data from API response
  const tenantData = data || {};

  return (
    <div className="space-y-6">
      {/* Business Header */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaBuilding className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{tenant.business_name}</h3>
          <p className="text-sm text-gray-600">Owner: {tenant.owner_name}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <FaMapMarkerAlt className="text-gray-400 w-4" />
            <span className="text-sm text-gray-600">{tenant.city}</span>
          </div>
          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="text-gray-400 w-4" />
            <span className="text-sm text-gray-600">{formatDate(tenant.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Account</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              tenant.status === 'active' ? 'bg-green-100 text-green-800' : 
              tenant.status === 'trial' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {tenant.status || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subscription</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              tenant.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 
              tenant.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {tenant.subscription_status || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verification</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              tenant.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {tenant.is_verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfo;
