import React from 'react';
import { TAB_CONFIGS, PRIORITY_COLORS } from './TabConfigs';

const TabNavigation = ({ 
  activeTab, 
  onTabChange, 
  tabCounts,
  loading = false
}) => {
  const tabs = Object.values(TAB_CONFIGS);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      
      <div className="px-4 md:px-6 py-4">
        {/* Desktop Tabs */}
        <div className="hidden md:flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? `${PRIORITY_COLORS[tab.priority]} border-2`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{tab.label}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-white bg-opacity-50'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {loading && activeTab === tab.id ? (
                    <div className="animate-pulse bg-gray-300 rounded w-4 h-3"></div>
                  ) : (
                    tabCounts[tab.id] || 0
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? `${PRIORITY_COLORS[tab.priority]} border-2`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  tab.color === 'red' ? 'bg-red-500' :
                  tab.color === 'yellow' ? 'bg-yellow-500' :
                  tab.color === 'orange' ? 'bg-orange-500' :
                  tab.color === 'green' ? 'bg-green-500' :
                  tab.color === 'blue' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === tab.id
                  ? 'bg-white bg-opacity-50'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tabCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
