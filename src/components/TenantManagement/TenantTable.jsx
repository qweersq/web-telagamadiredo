import React from 'react';
import { TAB_CONFIGS, COLUMN_LABELS, PRIORITY_COLORS } from './TabConfigs';
import { COLUMN_RENDERERS } from './ColumnRenderers';
import { ACTION_COMPONENTS } from './ActionComponents';
import SkeletonLoader from './SkeletonLoader';

const TenantTable = ({ 
  activeTab, 
  tenants, 
  loading, 
  onAction,
  searchTerm,
  onSearchChange,
  pagination,
  onLoadMore
}) => {
  const tabConfig = TAB_CONFIGS[activeTab];
  
  if (!tabConfig) {
    return <div>Invalid tab configuration</div>;
  }

  const getColumnsForTab = () => {
    return tabConfig.columns.map(col => ({
      key: col,
      label: COLUMN_LABELS[col],
      render: COLUMN_RENDERERS[col],
      width: getColumnWidth(col)
    }));
  };

  const getColumnWidth = (columnKey) => {
    const widthMap = {
      'business': 'flex-1 min-w-0',           // Flexible width
      'owner': 'w-28 flex-shrink-0',         // Fixed width
      'contact': 'w-36 flex-shrink-0',        // Wider for contact
      'registration': 'w-32 flex-shrink-0',  // Fixed width
      'verification': 'w-28 flex-shrink-0',   // Fixed width
      'trialStart': 'w-28 flex-shrink-0',
      'trialEnd': 'w-28 flex-shrink-0',
      'daysRemaining': 'w-24 flex-shrink-0',
      'lastLogin': 'w-28 flex-shrink-0',
      'trialUsage': 'w-24 flex-shrink-0',
      'daysSinceExpired': 'w-32 flex-shrink-0',
      'subscriptionPlan': 'w-32 flex-shrink-0',
      'subscriptionStart': 'w-32 flex-shrink-0',
      'subscriptionEnd': 'w-32 flex-shrink-0',
      'renewalDate': 'w-28 flex-shrink-0',
      'paymentStatus': 'w-28 flex-shrink-0',
      'renewalReminder': 'w-32 flex-shrink-0',
      'usageStats': 'w-28 flex-shrink-0',
      'lastActiveDate': 'w-32 flex-shrink-0',
      'expiredDate': 'w-28 flex-shrink-0',
      'previousPlan': 'w-32 flex-shrink-0',
      'churnReason': 'w-36 flex-shrink-0'
    };
    return widthMap[columnKey] || 'w-32 flex-shrink-0';
  };

  const getActionsForTab = (tenant) => {
    return tabConfig.actions.map(action => ({
      key: action,
      component: ACTION_COMPONENTS[action],
      props: { tenant, onAction }
    }));
  };

  const columns = getColumnsForTab();

  if (loading) {
    return <SkeletonLoader rows={5} />;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tab Header */}
      <div className={`px-4 md:px-6 py-4 border-b ${PRIORITY_COLORS[tabConfig.priority]}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{tabConfig.label}</h3>
            <p className="text-sm opacity-75">{tabConfig.description}</p>
          </div>
          <div className="text-sm font-medium">
            {tenants.length} tenants
          </div>
        </div>
      </div>


      {/* Table Header */}
      <div className="bg-gray-50 px-4 md:px-6 py-4 border-b">
        {/* Desktop Header */}
        <div className="hidden md:flex gap-2 text-sm font-medium text-gray-700">
          {columns.map((column) => (
            <div 
              key={column.key}
              className={column.width}
            >
              {column.label}
            </div>
          ))}
          <div className="w-16 flex-shrink-0">Actions</div>
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
          <div className="col-span-5">Business</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Info</div>
          <div className="col-span-1">•••</div>
        </div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {tenants.length === 0 ? (
          <div className="px-4 md:px-6 py-12 text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No tenants found</div>
            <div className="text-sm">Try adjusting your search or filters</div>
          </div>
        ) : (
          tenants.map((tenant) => (
            <div key={tenant.id} className="px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors">
              {/* Desktop View */}
              <div className="hidden md:flex gap-2 items-center min-w-0">
                {columns.map((column) => (
                  <div 
                    key={column.key}
                    className={column.width}
                  >
                    {column.render(tenant)}
                  </div>
                ))}
                
                {/* Actions */}
                <div className="w-16 flex-shrink-0">
                  <div className="flex space-x-1 justify-end">
                    {getActionsForTab(tenant).map((action) => (
                      <action.component
                        key={action.key}
                        {...action.props}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <div className="font-semibold text-gray-900 truncate" title={tenant.business_name}>
                    {tenant.business_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate" title={tenant.owner_name}>
                    {tenant.owner_name}
                  </div>
                </div>
                
                <div className="col-span-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                    tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tenant.status}
                  </span>
                </div>
                
                <div className="col-span-3">
                  <div className="text-sm text-gray-900">
                    {tenant.subscription_status}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <div className="flex space-x-1">
                    {getActionsForTab(tenant).slice(0, 2).map((action) => (
                      <action.component
                        key={action.key}
                        {...action.props}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Load More Button */}
      {pagination && pagination.hasMore && (
        <div className="px-4 md:px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Load More ({pagination.total - tenants.length} remaining)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantTable;
