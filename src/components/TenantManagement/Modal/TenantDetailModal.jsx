import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import ModalHeader from './ModalHeader';
import TabSpecificContent from './TabSpecificContent';
import GeneralInfo from './GeneralInfo';
import ActionButtons from './ActionButtons';
import { fetchTenantDetail } from '../../../services/tenantDetailService';

const TenantDetailModal = ({ 
  isOpen, 
  onClose, 
  tenant, 
  activeTab 
}) => {
  const [loading, setLoading] = useState(false);
  const [detailedData, setDetailedData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch detailed data when modal opens
  useEffect(() => {
    if (isOpen && tenant) {
      fetchDetailedData();
    }
  }, [isOpen, tenant, activeTab]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTenantDetail(tenant.id, activeTab);
      
      if (response.success) {
        setDetailedData(response.data);
      } else {
        setError(response.message || 'Failed to fetch tenant details');
      }
    } catch (err) {
      setError('An error occurred while fetching tenant details');
      console.error('Error fetching tenant details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action, data) => {
    console.log('Modal Action:', action, data);
    // Handle modal-specific actions
    switch (action) {
      case 'close':
        onClose();
        break;
      case 'refresh':
        fetchDetailedData();
        break;
      default:
        // Pass action to parent component
        if (tenant) {
          // You can emit custom events or call parent handlers here
          console.log('Action for tenant:', tenant.id, action, data);
        }
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-xl">
          {/* Header */}
          <ModalHeader 
            tenant={tenant} 
            activeTab={activeTab} 
            onClose={onClose}
            loading={loading}
          />
          
          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                <span className="ml-3 text-gray-600">Loading tenant details...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={fetchDetailedData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Tab-Specific Content */}
                <TabSpecificContent 
                  tenant={tenant} 
                  activeTab={activeTab} 
                  data={detailedData}
                  onAction={handleAction}
                />
                
                {/* General Information */}
                <GeneralInfo 
                  tenant={tenant} 
                  data={detailedData}
                />
              </>
            )}
          </div>
          
          {/* Footer Actions */}
          <ActionButtons 
            tenant={tenant} 
            activeTab={activeTab} 
            onAction={handleAction}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default TenantDetailModal;
