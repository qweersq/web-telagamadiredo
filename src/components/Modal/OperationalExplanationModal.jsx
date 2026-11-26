import { useState, useEffect } from 'react';
import { X, BarChart3, Users, Package, Gift, Award, TrendingUp, Activity, PieChart, Calendar, Filter, Eye, AlertTriangle, CheckCircle, DollarSign, Clock } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const OperationalExplanationModal = ({ isOpen, onClose }) => {
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if user has seen this explanation before
      const hasSeen = localStorage.getItem('operational_explanation_seen');
      setHasSeenBefore(!!hasSeen);
    }
  }, [isOpen]);

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem('operational_explanation_seen', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
      style={{ 
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Laporan Operasional
                </h2>
                <p className="text-sm text-gray-600">
                  Analisis performa layanan dan operasional bisnis
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="px-6 py-6 overflow-y-auto flex-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Apa itu Laporan Operasional?
                  </h3>
                  <p className="text-sm text-blue-800">
                    Laporan operasional memberikan analisis mendalam tentang performa layanan, 
                    customer behavior, dan efisiensi operasional bisnis laundry Anda. 
                    Data ini membantu Anda memahami tren bisnis dan membuat keputusan strategis.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Summary Cards */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Ringkasan Operasional</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>6 Metrik Utama:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• Total Layanan - Jumlah layanan tersedia</li>
                  <li>• Customer Aktif - Customer yang bertransaksi</li>
                  <li>• Customer Baru - Customer baru dalam periode</li>
                  <li>• Total Diskon - Diskon yang diberikan</li>
                  <li>• Item Dirawat - Item yang dirawat</li>
                  <li>• Membership Aktif - Member aktif</li>
                </ul>
              </div>

              {/* Charts Analysis */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Analisis Visual</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>4 Chart Utama:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• Layanan Terbanyak - Bar chart layanan populer</li>
                  <li>• Customer Terbanyak - Bar chart customer aktif</li>
                  <li>• Analisa Diskon - Pie chart penggunaan diskon</li>
                  <li>• Item Terbanyak - Bar chart item yang sering dirawat</li>
                </ul>
              </div>

              {/* Top Services */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Top Layanan</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tabel detail layanan paling populer dengan informasi:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 mt-2">
                  <li>• Nama layanan</li>
                  <li>• Jumlah order</li>
                  <li>• Total revenue</li>
                  <li>• Rata-rata harga</li>
                </ul>
              </div>

              {/* Top Customers */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Top Customer</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tabel customer paling aktif dengan informasi:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 mt-2">
                  <li>• Nama customer</li>
                  <li>• No. telepon</li>
                  <li>• Total order</li>
                  <li>• Total spent</li>
                  <li>• Last order</li>
                </ul>
              </div>
            </div>

            {/* Data Source Info */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Sumber Data
                  </h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    Laporan operasional menggunakan data dari:
                  </p>
                  <ul className="text-xs text-yellow-800 space-y-1 ml-4">
                    <li>• <strong>Order Details</strong> - Data layanan individual</li>
                    <li>• <strong>Orders</strong> - Data transaksi order</li>
                    <li>• <strong>Customers</strong> - Data customer</li>
                    <li>• <strong>Discounts</strong> - Data diskon yang digunakan</li>
                    <li>• <strong>Items</strong> - Data item yang dirawat</li>
                    <li>• <strong>Memberships</strong> - Data membership</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Filter Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Filter & Periode
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Anda dapat memfilter laporan berdasarkan:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4">
                    <li>• <strong>Cabang</strong> - Pilih cabang tertentu atau semua cabang</li>
                    <li>• <strong>Bulan</strong> - Pilih bulan laporan</li>
                    <li>• <strong>Tahun</strong> - Pilih tahun laporan</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">
                    Export PDF
                  </h3>
                  <p className="text-sm text-green-800">
                    Laporan dapat diekspor ke PDF dengan semua data dan chart yang ditampilkan. 
                    File PDF akan berisi ringkasan lengkap, tabel detail, dan analisis operasional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {hasSeenBefore ? 'Anda sudah melihat panduan ini sebelumnya' : 'Panduan pertama kali'}
            </div>
            <AnimatedButton
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              Mengerti
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalExplanationModal;
