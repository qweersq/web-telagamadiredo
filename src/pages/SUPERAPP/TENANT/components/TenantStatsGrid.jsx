import React from 'react';
import TenantStatsCard from './TenantStatsCard';
import { TENANT_TABS } from '../config/tabConfig';

/**
 * Tenant Stats Grid - Modern Clean Design
 */
const TenantStatsGrid = ({ stats, loading, onCardClick }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border-l-4 border-gray-200 p-6 min-h-[120px] animate-pulse">
            <div className="h-10 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-1 w-12 bg-gray-200 rounded-full mt-auto pt-3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {TENANT_TABS.map(tab => (
        <TenantStatsCard
          key={tab.key}
          number={stats[tab.key] || 0}
          label={tab.label}
          color={tab.color}
          onClick={() => onCardClick && onCardClick(tab.key)}
        />
      ))}
    </div>
  );
};

export default TenantStatsGrid;

