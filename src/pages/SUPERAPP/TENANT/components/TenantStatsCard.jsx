import React from 'react';

/**
 * Modern Tenant Stats Card - No Icons, Clean Design
 */
const TenantStatsCard = ({ number, label, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-white',
      border: 'border-blue-200',
      text: 'text-blue-600',
      badge: 'bg-blue-500',
      hover: 'hover:border-blue-400 hover:shadow-md'
    },
    orange: {
      bg: 'bg-white',
      border: 'border-orange-200',
      text: 'text-orange-600',
      badge: 'bg-orange-500',
      hover: 'hover:border-orange-400 hover:shadow-md'
    },
    green: {
      bg: 'bg-white',
      border: 'border-green-200',
      text: 'text-green-600',
      badge: 'bg-green-500',
      hover: 'hover:border-green-400 hover:shadow-md'
    },
    gray: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-600',
      badge: 'bg-gray-500',
      hover: 'hover:border-gray-400 hover:shadow-md'
    }
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div
      onClick={onClick}
      className={`
        ${colors.bg}
        ${colors.border}
        ${onClick ? `${colors.hover} cursor-pointer` : ''}
        rounded-lg border-l-4 border-t border-r border-b
        p-6 transition-all duration-200
        flex flex-col
        min-h-[120px]
      `}
    >
      {/* Number - Large and Bold */}
      <div className={`text-4xl font-bold ${colors.text} mb-2`}>
        {number.toLocaleString()}
      </div>

      {/* Label - Clean Typography */}
      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        {label}
      </div>

      {/* Small colored indicator at bottom */}
      <div className={`mt-auto pt-3`}>
        <div className={`h-1 w-12 ${colors.badge} rounded-full`}></div>
      </div>
    </div>
  );
};

export default TenantStatsCard;
