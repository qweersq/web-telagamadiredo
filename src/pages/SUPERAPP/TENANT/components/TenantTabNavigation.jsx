import React from 'react';
import { TENANT_TABS } from '../config/tabConfig';

/**
 * Modern Tab Navigation - No Icons, Clean Design
 * Supports both static tabs and dynamic plan tabs
 */
const TenantTabNavigation = ({ activeTab, onTabChange, stats = {}, subscriptionPlans = [], tabs = null }) => {
  // Use provided tabs or fallback to static tabs
  const displayTabs = tabs || TENANT_TABS;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {displayTabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const count = stats[tab.key] || 0;
          
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                flex-shrink-0 min-w-[200px] px-6 py-4 font-medium transition-all duration-200
                ${isActive 
                  ? `${tab.textColor} bg-gradient-to-b from-white to-${tab.color}-50 border-b-2 ${tab.borderColor}` 
                  : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent hover:border-gray-200'
                }
                ${index !== 0 ? 'border-l border-gray-200' : ''}
              `}
            >
              <div className="flex flex-col items-center gap-1">
                {/* Label */}
                <span className="text-sm font-semibold">
                  {tab.label}
                </span>
                
                {/* Count Badge */}
                <span className={`
                  text-xs font-bold px-2.5 py-0.5 rounded-full
                  ${isActive 
                    ? `${tab.badgeColor} text-white` 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TenantTabNavigation;
