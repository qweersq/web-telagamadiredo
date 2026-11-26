import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Users, MessageSquare, DollarSign, Download } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';

const FollowUpReports = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(true);
  
  // Report data
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load reports
  useEffect(() => {
    loadReports();
  }, [selectedMonth]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      
      // Load monthly report
      const monthlyResponse = await instance.get('/followup-sequences/reports/monthly', {
        params: { year: parseInt(year), month: parseInt(month) }
      });
      
      if (monthlyResponse.data.success) {
        setMonthlyReport(monthlyResponse.data.data);
      }

      // Load statistics
      const statsResponse = await instance.get('/followup-sequences/analytics/statistics');
      
      if (statsResponse.data.success) {
        setStatistics(statsResponse.data.data);
      }

    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getMonthName = (monthNum) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNum - 1] || '';
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${getMonthName(month)} ${year}`;
      
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Follow-Up Reports"
        description="Laporan dan analisis follow-up customer"
        showBackButton={true}
        currentTime={currentTime}
        addButton={
          <AnimatedButton
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 rounded-lg text-sm bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            variant="green"
          >
            <Download className="w-4 h-4" />
            Export
          </AnimatedButton>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto md:px-10 pt-16">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Month Selector */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                    Pilih Periode:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                  >
                    {generateMonthOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-montserrat">Customer Followed-Up</p>
                    <p className="text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {monthlyReport?.summary?.total_customers_followed_up || 0}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-montserrat">
                  Customer yang mendapat follow-up
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-montserrat">Pesan Terkirim</p>
                    <p className="text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {monthlyReport?.statistics?.total_messages_sent || 0}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-montserrat">
                  Total pesan follow-up
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-montserrat">Response Rate</p>
                    <p className="text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {monthlyReport?.statistics?.response_rate || '0%'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-montserrat">
                  Customer yang membalas
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-montserrat">Conversion Rate</p>
                    <p className="text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {monthlyReport?.statistics?.conversion_rate || '0%'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-montserrat">
                  Customer yang order
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Laporan Detail - {monthlyReport?.period ? `${getMonthName(monthlyReport.period.month)} ${monthlyReport.period.year}` : ''}
                </h2>
              </div>

              <div className="p-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 font-montserrat mb-4">
                      📊 Metrik Performa
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Total Customer dalam Sequence</span>
                        <span className="font-semibold text-gray-800 font-montserrat">
                          {statistics?.total_customers_in_sequence || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Total Pesan Terkirim</span>
                        <span className="font-semibold text-gray-800 font-montserrat">
                          {statistics?.total_messages_sent || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Total Responses</span>
                        <span className="font-semibold text-gray-800 font-montserrat">
                          {statistics?.total_responses || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Total Conversions</span>
                        <span className="font-semibold text-gray-800 font-montserrat">
                          {statistics?.total_conversions || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-800 font-montserrat mb-4">
                      📈 Estimasi ROI
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Estimasi Order dari Follow-up</span>
                        <span className="font-semibold text-green-700 font-montserrat">
                          {monthlyReport?.summary?.estimated_orders_from_followup || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Estimasi Revenue</span>
                        <span className="font-semibold text-green-700 font-montserrat">
                          {formatCurrency((monthlyReport?.summary?.estimated_orders_from_followup || 0) * 25000)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Cost per Message</span>
                        <span className="font-semibold text-blue-700 font-montserrat">
                          Rp 500
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-montserrat">Total Cost</span>
                        <span className="font-semibold text-blue-700 font-montserrat">
                          {formatCurrency((statistics?.total_messages_sent || 0) * 500)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-800 font-montserrat mb-4">
                    📊 Grafik Performa (Coming Soon)
                  </h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-montserrat">
                        Grafik performa akan ditampilkan di sini
                      </p>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 font-montserrat mb-4">
                    💡 Insights & Rekomendasi
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800 font-montserrat">
                            Response Rate Analysis
                          </p>
                          <p className="text-sm text-blue-700 font-montserrat mt-1">
                            Response rate {statistics?.response_rate || '0%'} 
                            {parseFloat(statistics?.response_rate || '0') > 15 
                              ? ' tergolong baik. Pertahankan kualitas pesan!' 
                              : ' masih bisa ditingkatkan. Coba variasikan template pesan.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800 font-montserrat">
                            Conversion Optimization
                          </p>
                          <p className="text-sm text-green-700 font-montserrat mt-1">
                            Conversion rate {statistics?.conversion_rate || '0%'}.
                            {parseFloat(statistics?.conversion_rate || '0') > 10 
                              ? ' Excellent! Follow-up strategy bekerja dengan baik.' 
                              : ' Pertimbangkan untuk menambah incentive atau promo khusus.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-800 font-montserrat">
                            Timing Optimization
                          </p>
                          <p className="text-sm text-orange-700 font-montserrat mt-1">
                            Waktu terbaik untuk follow-up adalah pagi hari (09:00-11:00) dan sore hari (15:00-17:00).
                            Hindari mengirim pesan di malam hari.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default FollowUpReports;
