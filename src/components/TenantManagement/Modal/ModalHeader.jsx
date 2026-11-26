import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { TAB_CONFIGS, PRIORITY_COLORS } from '../TabConfigs';

const ModalHeader = ({ tenant, activeTab, onClose, loading }) => {
  const tabConfig = TAB_CONFIGS[activeTab];
  
  if (!tenant || !tabConfig) return null;

  // Get header colors based on tab priority
  const getHeaderColors = (priority) => {
    const colorMap = {
      verification: 'bg-red-600 text-white',
      conversion: 'bg-yellow-600 text-white',
      urgent: 'bg-orange-600 text-white',
      recovery: 'bg-orange-600 text-white',
      management: 'bg-green-600 text-white',
      retention: 'bg-blue-600 text-white',
      churn: 'bg-gray-600 text-white'
    };
    return colorMap[priority] || 'bg-gray-600 text-white';
  };

  return (
    <div className={`px-6 py-4 border-b ${getHeaderColors(tabConfig.priority)} rounded-t-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {tenant.business_name?.charAt(0) || 'T'}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-white truncate">
                {tenant.business_name || 'Unknown Business'}
              </h2>
              <p className="text-white text-opacity-90 text-sm truncate">
                {tenant.owner_name} • {tabConfig.label}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {loading && (
            <FaSpinner className="animate-spin text-white text-sm" />
          )}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHeader;
