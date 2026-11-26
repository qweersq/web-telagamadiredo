import React, { useState } from 'react';
import { FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import TenantDetailModal from './TenantDetailModal';

/**
 * Tenant Table Component - Clean & Functional
 */
const TenantTable = ({ tenants, loading, pagination, onPageChange, activeTab, onRefresh }) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Calculate days left/ago
  const calculateDays = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get days badge
  const getDaysBadge = (days) => {
    if (days === null || days === undefined) return null;

    let bgColor, textColor, label;
    
    if (days > 5) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      label = `${days} days`;
    } else if (days >= 3) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      label = `${days} days`;
    } else if (days >= 1) {
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-700';
      label = `${days} days`;
    } else if (days === 0) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      label = 'Today';
    } else {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      label = `${Math.abs(days)} days ago`;
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  // Handle view detail
  const handleViewDetail = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedTenant(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-2"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">📋</div>
        <p className="text-gray-600 font-medium mb-2">No tenants found</p>
        <p className="text-gray-500 text-sm">This tab is currently empty</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Business Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {activeTab === 'active_trial' || activeTab === 'expired_trial' ? 'Email' : 'Plan Name'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {activeTab === 'active_trial' ? 'Trial Ends' : 
                 activeTab === 'expired_trial' ? 'Expired On' :
                 activeTab === 'active' ? 'Valid Until' : 'Expired On'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {activeTab === 'active_trial' || activeTab === 'active' ? 'Days Left' : 'Days Ago'}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(tenants) && tenants.map((tenant) => {
              // Determine date field based on tab
              let dateField;
              if (activeTab === 'active_trial' || activeTab === 'expired_trial') {
                dateField = tenant.trial_end_date;
              } else {
                // For active/expired, get from subscriptions.end_date
                dateField = tenant.subscriptions?.[0]?.end_date || tenant.trial_end_date;
              }
              
              const days = calculateDays(dateField);

              return (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  {/* Business Name */}
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">
                      {tenant.business_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tenant.city || '-'}
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {tenant.owner_name}
                  </td>

                  {/* Email or Plan Name */}
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {activeTab === 'active_trial' || activeTab === 'expired_trial' ? (
                      tenant.email
                    ) : (
                      tenant.subscriptions?.[0]?.plan?.name || '-'
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {formatDate(dateField)}
                  </td>

                  {/* Days Badge */}
                  <td className="px-4 py-4">
                    {getDaysBadge(days)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleViewDetail(tenant)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <FaEye className="text-xs" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft className="text-sm text-gray-600" />
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronRight className="text-sm text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          onClose={handleCloseModal}
          activeTab={activeTab}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};

export default TenantTable;

