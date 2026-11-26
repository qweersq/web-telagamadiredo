import { useState, useEffect } from 'react';
import instance from '../config/api';
import { formatCurrency } from '../utils/labelFormatter';
import HelpTooltip from './WhatsAppTemplate/HelpTooltip';

const MonthlyPerformanceChart = ({ employeeId, isOpen, onClose }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('6_months');

  useEffect(() => {
    if (employeeId && isOpen) {
      fetchChartData();
    }
  }, [employeeId, period, isOpen]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await instance.get(`/employee-detail/${employeeId}/performance-chart`, {
        params: { period }
      });

      if (data.success) {
        setChartData(data.data);
      } else {
        setError('Gagal memuat data chart');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Gagal memuat data chart');
    } finally {
      setLoading(false);
    }
  };

  const getGrowthColor = (growth) => {
    if (growth > 5) return 'text-telaga-700';
    if (growth < -5) return 'text-red-600';
    return 'text-telaga-900/55';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 5) return '▲';
    if (growth < -5) return '▼';
    return '━';
  };

  const getGrowthLabel = (growth) => {
    if (growth > 5) return 'MENINGKAT';
    if (growth < -5) return 'MENURUN';
    return 'STABIL';
  };

  const getBarColor = (value, maxValue) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'bg-telaga-600';
    if (percentage >= 60) return 'bg-telaga-500';
    if (percentage >= 40) return 'bg-senja-400';
    return 'bg-red-400';
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const maxRevenue = chartData ? Math.max(...chartData.data.map(d => d.revenue), 1) : 1;
  const maxItems = chartData ? Math.max(...chartData.data.map(d => d.items), 1) : 1;

  return (
    <div
      className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm z-50 p-[max(1.5rem,env(safe-area-inset-top))] sm:p-8"
      style={{
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
      }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full h-full mx-auto flex flex-col max-h-[85vh]">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-telaga-100 rounded-t-2xl bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-telaga-950">Performa Bulanan</h3>
              <HelpTooltip
                title="Cara Baca Chart Performa"
                size="md"
                content={
                  <div className="space-y-3">
                    <p><strong>Chart ini menampilkan:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Revenue:</strong> Total penghasilan dari item yang diproses per bulan</li>
                      <li><strong>Item:</strong> Jumlah item/pesanan yang ditangani per bulan</li>
                      <li><strong>Growth %:</strong> Perbandingan bulan terakhir vs bulan sebelumnya</li>
                    </ul>
                    <p className="mt-3"><strong>Warna Bar:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><span className="text-telaga-600">●</span> Hijau = Performa terbaik (80-100%)</li>
                      <li><span className="text-telaga-500">●</span> Hijau muda = Performa bagus (60-80%)</li>
                      <li><span className="text-senja-500">●</span> Oranye = Performa standar (40-60%)</li>
                      <li><span className="text-red-600">●</span> Merah = Performa rendah (&lt;40%)</li>
                    </ul>
                  </div>
                }
              />
            </div>
            <button
              onClick={onClose}
              className="text-telaga-900/60 hover:bg-telaga-50 rounded-lg p-1.5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mt-3">
            {[
              { value: '6_months', label: '6 Bulan' },
              { value: '1_year', label: '1 Tahun' },
              { value: 'all_time', label: 'Semua' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === option.value
                    ? 'bg-telaga-700 text-white shadow-sm'
                    : 'bg-krem text-telaga-900/60 hover:bg-telaga-50'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-telaga-100 rounded w-48"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-telaga-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : error || !chartData ? (
            <div className="text-center py-8 text-telaga-900/55">
              <svg className="w-12 h-12 mx-auto mb-3 text-telaga-900/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">{error || 'Tidak ada data chart'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Revenue Section */}

              

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-telaga-950">Item Diproses</h4>
                  {/* <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                {chartData.summary.total_items} items
              </div>
              <div className={`text-xs font-semibold ${getGrowthColor(chartData.summary.items_growth)}`}>
                {getGrowthIcon(chartData.summary.items_growth)} {chartData.summary.items_growth > 0 ? '+' : ''}{chartData.summary.items_growth.toFixed(1)}% {getGrowthLabel(chartData.summary.items_growth)}
              </div>
            </div> */}
                </div>

                {/* Items Bars */}
                <div className="space-y-3">
                  {chartData.data.slice().reverse().map((month) => (
                    <div key={month.month}>
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-xs font-medium text-telaga-900/55 text-right flex-shrink-0">
                          {month.month_label}
                        </div>
                        <div className="flex-1 bg-telaga-50 rounded-lg h-8 relative overflow-hidden">
                          <div
                            className={`${getBarColor(month.items, maxItems)} h-full rounded-lg transition-all duration-500 flex items-center justify-end px-2`}
                            style={{ width: `${(month.items / maxItems) * 100}%` }}
                          >
                            <span className="text-xs font-semibold text-white">
                              {month.items}
                            </span>
                          </div>
                        </div>
                      </div>
                      {month.items_growth_pct !== null && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className={`text-xs font-semibold ${month.items_growth_pct > 0 ? 'text-telaga-700' : month.items_growth_pct < 0 ? 'text-red-600' : 'text-telaga-900/55'}`}>
                            {month.items_growth_pct > 0 ? '▲' : month.items_growth_pct < 0 ? '▼' : '━'} {month.items_growth_pct > 0 ? '+' : ''}{month.items_growth_pct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              {/* <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <h4 className="text-sm font-semibold text-blue-800">💡 Insights</h4>
                  <HelpTooltip
                    title="Apa itu Insights?"
                    size="sm"
                    content={
                      <div className="space-y-2">
                        <p><strong>Insights</strong> memberikan ringkasan otomatis performa karyawan:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                          <li><strong>Rata-rata:</strong> Pendapatan & item per bulan dalam periode ini</li>
                          <li><strong>Best month:</strong> Bulan dengan revenue tertinggi</li>
                          <li><strong>Status performa:</strong> Apakah naik, turun, atau stabil</li>
                        </ul>
                        <p className="bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded text-xs mt-2">
                          💡 Gunakan insights ini untuk evaluasi kinerja karyawan dan memberikan apresiasi atau coaching yang tepat.
                        </p>
                      </div>
                    }
                  />
                </div>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <p>• Rata-rata: {formatCurrency(chartData.summary.avg_monthly_revenue)}/bulan ({Math.round(chartData.summary.avg_monthly_items)} items)</p>

                  {chartData.data.length >= 2 && (() => {
                    // Find month with highest revenue
                    const bestMonth = chartData.data.reduce((max, month) =>
                      month.revenue > max.revenue ? month : max
                    );

                    return (
                      <>
                        <p>• Best month: {bestMonth.month_label} ({formatCurrency(bestMonth.revenue)})</p>

                        {chartData.summary.revenue_growth > 10 && (
                          <p className="text-green-700 font-semibold">✅ Performa meningkat {chartData.summary.revenue_growth.toFixed(0)}% dari bulan lalu</p>
                        )}

                        {chartData.summary.revenue_growth < -10 && (
                          <p className="text-red-700 font-semibold">⚠️ Performa menurun {Math.abs(chartData.summary.revenue_growth).toFixed(0)}% dari bulan lalu</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div> */}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-telaga-100 rounded-b-2xl bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-telaga-50 text-telaga-800 rounded-xl hover:bg-telaga-100 transition-colors text-sm font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPerformanceChart;

