/**
 * Dashboard Metrics Card - Simple & Compact
 */
const DashboardMetricsCard = ({ label, value, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-gray-200 bg-gray-50',
    yellow: 'border-yellow-200 bg-yellow-50'
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.blue}`}>
      {/* Label */}
      <div className="text-xs font-medium text-gray-600 mb-1">
        {label}
      </div>

      {/* Main Value */}
      <div className="text-xl font-bold text-gray-900">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs text-gray-600 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default DashboardMetricsCard;

