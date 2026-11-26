import React from 'react';
import { 
  FaBuilding, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaIdCard
} from 'react-icons/fa';
import { 
  formatBusinessName, 
  formatOwnerName, 
  formatEmail, 
  formatPhoneNumber 
} from '../../../../utils/billingFormatter';

const TenantInfoCard = ({ tenant }) => {
  if (!tenant) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="p-2 bg-green-100 rounded-lg">
          <FaBuilding className="text-green-600 text-lg" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-montserrat">Tenant Information</h3>
          <p className="text-sm text-gray-500 font-montserrat">Business & Owner Details</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Business Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBuilding className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Business Name</span>
          </div>
          <span className="text-sm font-bold text-gray-900 font-montserrat">
            {formatBusinessName(tenant.business_name)}
          </span>
        </div>

        {/* Owner Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaUser className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Owner Name</span>
          </div>
          <span className="text-sm font-bold text-gray-900 font-montserrat">
            {formatOwnerName(tenant.owner_name)}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Email</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            {formatEmail(tenant.email)}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaPhone className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Phone</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            {formatPhoneNumber(tenant.phone)}
          </span>
        </div>

        {/* Tenant ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaIdCard className="text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-600 font-montserrat">Tenant ID</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-montserrat">
            #{tenant.id}
          </span>
        </div>

        {/* Address */}
        {tenant.address && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-gray-400 text-sm mt-1" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-600 font-montserrat block mb-1">Address</span>
                <p className="text-sm text-gray-900 font-montserrat bg-gray-50 p-2 rounded-lg">
                  {tenant.address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Type */}
        {tenant.business_type && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaBuilding className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Business Type</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 font-montserrat">
              {tenant.business_type}
            </span>
          </div>
        )}

        {/* Registration Date */}
        {tenant.createdAt && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-600 font-montserrat">Registered</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 font-montserrat">
              {new Date(tenant.createdAt).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantInfoCard;
