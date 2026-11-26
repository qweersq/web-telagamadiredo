import React from 'react';
import { X, Star, Gift, Users, TrendingUp, Award } from 'lucide-react';

const PointReportModal = ({ isOpen, onClose, data, loading }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getTypeLabel = (type, bonusType) => {
    const labels = {
      'earn': 'Dapat Poin',
      'redeem': 'Tukar Poin',
      'bonus': getBonusTypeLabel(bonusType),
      'expire': 'Poin Kadaluarsa'
    };
    return labels[type] || type;
  };

  const getBonusTypeLabel = (bonusType) => {
    if (!bonusType) return 'Bonus Poin';
    const labels = {
      'first_order': 'Bonus Order Pertama',
      'referral_new_customer': 'Bonus Referral (Customer)',
      'referral_referrer': 'Bonus Referral (Referrer)'
    };
    return labels[bonusType] || 'Bonus Poin';
  };

  const getTypeColor = (type) => {
    const colors = {
      'earn': 'text-green-600 bg-green-50',
      'redeem': 'text-orange-600 bg-orange-50',
      'bonus': 'text-yellow-600 bg-yellow-50',
      'expire': 'text-red-600 bg-red-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-montserrat">
                Detail Laporan Poin
              </h2>
              <p className="text-sm text-yellow-100 font-montserrat">
                Data lengkap transaksi poin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-montserrat">Tidak ada data poin</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <p className="text-xs text-yellow-600 font-montserrat font-semibold">
                      Total Poin Diberikan
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 font-montserrat">
                    {formatNumber(data.summary?.total_points_given || 0)}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-orange-600" />
                    <p className="text-xs text-orange-600 font-montserrat font-semibold">
                      Total Poin Ditebus
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 font-montserrat">
                    {formatNumber(data.summary?.total_points_redeemed || 0)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <p className="text-xs text-green-600 font-montserrat font-semibold">
                      Customer Aktif
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 font-montserrat">
                    {formatNumber(data.summary?.total_active_customers || 0)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <p className="text-xs text-purple-600 font-montserrat font-semibold">
                      Conversion Rate
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 font-montserrat">
                    {data.summary?.conversion_rate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>

              {/* Top Customers Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    TOP 10 CUSTOMER POIN
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Nama Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          No HP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Poin Saat Ini
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Poin Diberikan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Poin Ditebus
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Last Transaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.top_customers && data.top_customers.length > 0 ? (
                        data.top_customers.map((customer, index) => (
                          <tr key={customer.customer_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 font-montserrat">
                              {customer.customer_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {customer.customer_phone}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat font-semibold">
                              {formatNumber(customer.current_points)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-montserrat">
                              +{formatNumber(customer.total_points_given)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-montserrat">
                              -{formatNumber(customer.total_points_redeemed)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {formatDate(customer.last_transaction_date)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500 font-montserrat">
                            Tidak ada data customer poin
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Point Transactions Breakdown */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    BREAKDOWN TRANSAKSI POIN
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Poin
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Deskripsi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Order ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.transactions && data.transactions.length > 0 ? (
                        data.transactions.map((transaction) => (
                          <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {formatDate(transaction.transaction_date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              <div>
                                <div className="font-medium">{transaction.customer_name}</div>
                                <div className="text-xs text-gray-500">{transaction.customer_phone}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold font-montserrat ${getTypeColor(transaction.type)}`}>
                                {getTypeLabel(transaction.type, transaction.bonus_type)}
                              </span>
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold font-montserrat ${
                              transaction.points > 0 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {transaction.points > 0 ? '+' : ''}{formatNumber(transaction.points)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat max-w-xs truncate" title={transaction.description}>
                              {transaction.description || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {transaction.order_id ? `#${transaction.order_id}` : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500 font-montserrat">
                            Tidak ada data transaksi poin
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 font-montserrat"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointReportModal;

