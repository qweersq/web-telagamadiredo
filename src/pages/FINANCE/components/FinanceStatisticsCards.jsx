import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Eye } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';

const FinanceStatisticsCards = ({ summary, loading, onViewDetails }) => {
  if (loading) {
    return (
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 animate-pulse">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-full mt-4"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center text-gray-400 py-8 font-montserrat">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Tidak ada data keuangan</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (percentage) => {
    return `${percentage || 0}%`;
  };

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Ringkasan Keuangan</h3>
            <p className="text-sm text-gray-500 font-montserrat">Pemasukan, pengeluaran, dan profit</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Income Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 font-montserrat">Pemasukan</h4>
                <p className="text-xs text-gray-500 font-montserrat">Total pendapatan</p>
              </div>
            </div>
            <div className="text-xl font-bold text-green-600 font-montserrat">
              {formatCurrency(summary.total_income)}
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 font-montserrat">Pengeluaran</h4>
                <p className="text-xs text-gray-500 font-montserrat">Total beban</p>
              </div>
            </div>
            <div className="text-xl font-bold text-red-600 font-montserrat">
              {formatCurrency(summary.total_expense)}
            </div>
          </div>

          {/* Profit Card */}
          <div className={`bg-gradient-to-br rounded-xl p-4 border hover:shadow-md transition-all duration-200 ${(summary.profit || 0) >= 0
              ? 'from-blue-50 to-blue-100 border-blue-200'
              : 'from-orange-50 to-orange-100 border-orange-200'
            }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(summary.profit || 0) >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 font-montserrat">Profit</h4>
                <p className="text-xs text-gray-500 font-montserrat">
                  {(summary.profit || 0) >= 0 ? 'Keuntungan' : 'Kerugian'}
                </p>
              </div>
            </div>
            <div className={`text-xl font-bold font-montserrat ${(summary.profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
              {formatCurrency(summary.profit)}
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <AnimatedButton
          onClick={onViewDetails}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 font-montserrat"
        >
          <Eye className="w-4 h-4" />
          Lihat Detail Transaksi
        </AnimatedButton>
      </div>
    </div>
  );
};

export default FinanceStatisticsCards;
