import React from 'react';
import { X, UserPlus, Users, TrendingUp, Award, FileText } from 'lucide-react';

const ReferralReportModal = ({ isOpen, onClose, data, loading }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-montserrat">
                Detail Laporan Referral
              </h2>
              <p className="text-sm text-blue-100 font-montserrat">
                Data lengkap program referral
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-montserrat">Tidak ada data referral</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-blue-600 font-montserrat font-semibold">
                      Total Referral Orders
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 font-montserrat">
                    {formatNumber(data.summary?.total_referral_orders || 0)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <p className="text-xs text-green-600 font-montserrat font-semibold">
                      Total Referrers
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 font-montserrat">
                    {formatNumber(data.summary?.total_referrers || 0)}
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

                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-orange-600" />
                    <p className="text-xs text-orange-600 font-montserrat font-semibold">
                      Total Revenue
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 font-montserrat">
                    {formatCurrency(data.summary?.total_revenue_from_referral || 0)}
                  </p>
                </div>
              </div>

              {/* Top Referrers Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    TOP 10 REFERRERS
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
                          Nama Referrer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          No HP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Total Referral
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Total Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Last Referral
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.top_referrers && data.top_referrers.length > 0 ? (
                        data.top_referrers.map((referrer, index) => (
                          <tr key={referrer.customer_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 font-montserrat">
                              {referrer.customer_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {referrer.customer_phone}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              {formatNumber(referrer.total_referrals)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              {formatCurrency(referrer.total_revenue)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {formatDate(referrer.last_referral_date)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500 font-montserrat">
                            Tidak ada data referrer
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Referral Orders List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    DAFTAR ORDER REFERRAL
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Order Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Referrer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.referral_orders && data.referral_orders.length > 0 ? (
                        data.referral_orders.map((order) => (
                          <tr key={order.order_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 font-montserrat">
                              {order.order_code}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              {order.customer_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              <div>
                                <div className="font-medium">{order.referrer_name}</div>
                                <div className="text-xs text-gray-500">{order.referrer_phone}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-montserrat">
                              {formatCurrency(order.total_amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500 font-montserrat">
                            Tidak ada data order referral
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
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 font-montserrat"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralReportModal;

