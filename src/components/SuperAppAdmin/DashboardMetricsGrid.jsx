import { useState, useEffect } from 'react';
import DashboardMetricsCard from './DashboardMetricsCard';
import CustomDateModal from './CustomDateModal';
import instance from '../../config/api';

/**
 * Dashboard Metrics Grid - Compact & Simple
 */
const DashboardMetricsGrid = ({ filter = 'month', onFilterChange, customDateRange = null }) => {
  const [activeFilter, setActiveFilter] = useState(filter);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Sync with parent filter
  useEffect(() => {
    setActiveFilter(filter);
  }, [filter]);

  // Fetch metrics data when filter or date range changes
  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customDateRange?.start_date, customDateRange?.end_date]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (customDateRange?.start_date) {
        params.append('start_date', customDateRange.start_date);
      }
      if (customDateRange?.end_date) {
        params.append('end_date', customDateRange.end_date);
      }

      const queryString = params.toString();
      const url = `/superapp-admin/statistics${queryString ? `?${queryString}` : ''}`;
      
      const response = await instance.get(url);
      
      if (response.data.success) {
        const data = response.data.data;
        setMetrics(formatMetrics(data));
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMetrics = (data) => {
    // Format currency
    const formatCurrency = (amount) => {
      if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)} Jt`;
      } else if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(0)} Rb`;
      }
      return `Rp ${amount}`;
    };

    // Priority order: Most important metrics first
    return {
      // TOP PRIORITY (Always visible)
      mrr: {
        label: 'Pendapatan Bulanan',
        value: formatCurrency(data.mrr || 0),
        subtitle: `${data.mrr_breakdown?.active_subscriptions || 0} langganan aktif`,
        priority: 1
      },
      totalRevenue: {
        label: 'Total Pendapatan',
        value: formatCurrency(data.total_revenue || 0),
        subtitle: `${data.paid_payments || 0} transaksi sukses`,
        priority: 2
      },
      totalExpenses: {
        label: 'Total Pengeluaran',
        value: formatCurrency(data.total_expenses || 0),
        subtitle: `${data.total_expense_items || 0} items pengeluaran`,
        priority: 3
      },
      activeTenants: {
        label: 'Tenant Aktif',
        value: String(data.active_tenants || 0),
        subtitle: `${data.active_tenants_breakdown?.trial || 0} trial, ${data.active_tenants_breakdown?.paid || 0} berbayar`,
        priority: 4
      },
      conversionRate: {
        label: 'Tingkat Konversi',
        value: `${data.conversion_rate || 0}%`,
        subtitle: `${data.conversion_breakdown?.converted_tenants || 0} dari ${data.conversion_breakdown?.trial_tenants || 0} tenant`,
        priority: 5
      },
      newSignups: {
        label: 'Pendaftar Baru',
        value: String(data.new_tenants || 0),
        subtitle: 'Periode ini',
        priority: 6
      },
      expiring: {
        label: 'Segera Berakhir',
        value: String(data.expiring_soon || 0),
        subtitle: `H-1: ${data.expiring_soon_breakdown?.trial_h1 || 0}, H-7: ${data.expiring_soon_breakdown?.subscription_h7 || 0}`,
        priority: 7
      },
      
      // SECONDARY (Show on "Show All")
      arpu: {
        label: 'Rata-rata/Tenant',
        value: formatCurrency(data.arpu || 0),
        subtitle: `${data.arpu_breakdown?.paying_tenants || 0} tenant bayar`,
        priority: 8
      },
      growth: {
        label: 'Pertumbuhan',
        value: `${data.growth_rate >= 0 ? '+' : ''}${data.growth_rate || 0}%`,
        subtitle: `${data.growth_breakdown?.current_period || 0} vs ${data.growth_breakdown?.previous_period || 0} sebelumnya`,
        priority: 9
      },
      payments: {
        label: 'Detail Pembayaran',
        value: `${data.paid_payments || 0} Lunas`,
        subtitle: `${data.pending_payments || 0} pending, ${data.failed_payments || 0} gagal`,
        priority: 10
      },
      totalUsers: {
        label: 'Total Pengguna',
        value: String(data.total_users || 0),
        subtitle: 'Semua akun user',
        priority: 11
      },
      transactions: {
        label: 'Total Transaksi',
        value: String(data.total_transactions || 0),
        subtitle: `${data.cancelled_payments || 0} dibatalkan`,
        priority: 12
      },
      bugReports: {
        label: 'Bug Reports',
        value: String(data.bug_reports || 0),
        subtitle: 'Laporan bug masuk',
        priority: 13
      },
      feedback: {
        label: 'Feedback',
        value: String(data.feedback || 0),
        subtitle: 'Feedback dari user',
        priority: 14
      }
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleFilterClick = (filterType) => {
    if (filterType === 'custom') {
      // Open custom date modal
      setShowCustomModal(true);
    } else {
      // Handle preset filters (today, month)
      setActiveFilter(filterType);
      if (onFilterChange) {
        onFilterChange(filterType);
      }
    }
  };

  const handleCustomDateApply = (dateFilter) => {
    setActiveFilter('custom');
    if (onFilterChange) {
      onFilterChange('custom', dateFilter);
    }
    setShowCustomModal(false);
    // Data will be refetched via useEffect when customDateRange changes
  };

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterClick('today')}
            className={`px-4 py-2 rounded-lg text-sm font-montserrat font-medium transition-all ${
              activeFilter === 'today'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => handleFilterClick('month')}
            className={`px-4 py-2 rounded-lg text-sm font-montserrat font-medium transition-all ${
              activeFilter === 'month'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => handleFilterClick('last_month')}
            className={`px-4 py-2 rounded-lg text-sm font-montserrat font-medium transition-all ${
              activeFilter === 'last_month'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Bulan Lalu
          </button>
          <button
            onClick={() => handleFilterClick('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-montserrat font-medium transition-all ${
              activeFilter === 'custom'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => handleFilterClick('all')}
            className={`px-4 py-2 rounded-lg text-sm font-montserrat font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Semua
          </button>
        </div>

        {/* Custom Date Range Info */}
        {activeFilter === 'custom' && customDateRange && (customDateRange.start_date || customDateRange.end_date) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-xs font-montserrat text-blue-700">
              {customDateRange.start_date && formatDate(customDateRange.start_date)}
              {customDateRange.start_date && customDateRange.end_date && ' - '}
              {customDateRange.end_date && formatDate(customDateRange.end_date)}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Grid - 3 columns */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-gray-50 p-3 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <div className="space-y-4">
          {/* REAL-TIME METRICS (No Period Filter) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
              <span className="text-xs font-montserrat font-semibold text-gray-700">
                Real-time
              </span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-montserrat rounded">
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <DashboardMetricsCard {...metrics.mrr} color="blue" />
              <DashboardMetricsCard {...metrics.expiring} color="red" />
            </div>
          </div>

          {/* PERIOD-BASED METRICS */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
              <span className="text-xs font-montserrat font-semibold text-gray-700">
                Berdasarkan Periode
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-montserrat rounded">
                Filtered
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <DashboardMetricsCard {...metrics.totalRevenue} color="green" />
              <DashboardMetricsCard {...metrics.totalExpenses} color="red" />
              <DashboardMetricsCard {...metrics.activeTenants} color="purple" />
              <DashboardMetricsCard {...metrics.conversionRate} color="orange" />
              <DashboardMetricsCard {...metrics.newSignups} color="blue" />
            </div>

            {/* Show All Toggle Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 rounded-lg text-sm font-montserrat font-medium text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm"
              >
                {showAll ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    Tampilkan Semua ({Object.keys(metrics).length} total)
                  </>
                )}
              </button>
            </div>

            {/* Show More Period Metrics */}
            {showAll && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                <DashboardMetricsCard {...metrics.arpu} color="green" />
                <DashboardMetricsCard {...metrics.growth} color="purple" />
                <DashboardMetricsCard {...metrics.payments} color="orange" />
                <DashboardMetricsCard {...metrics.totalUsers} color="blue" />
                <DashboardMetricsCard {...metrics.transactions} color="gray" />
                <DashboardMetricsCard {...metrics.bugReports} color="red" />
                <DashboardMetricsCard {...metrics.feedback} color="yellow" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Gagal memuat data. Silakan refresh.</p>
        </div>
      )}

      {/* Custom Date Modal */}
      <CustomDateModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onApply={handleCustomDateApply}
        currentFilter={customDateRange}
      />
    </div>
  );
};

export default DashboardMetricsGrid;

