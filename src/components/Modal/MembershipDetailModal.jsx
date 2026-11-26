import React, { useState, useEffect } from 'react';
import { FaCrown, FaUsers, FaDollarSign, FaCalendarAlt, FaSearch, FaFilter, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import instance from '../../config/api';
import { formatCurrency, formatNumber } from '../../utils/labelFormatter';

const MembershipDetailModal = ({ isOpen, onClose, membershipId }) => {
  const [membershipDetails, setMembershipDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Fetch membership details
  const fetchMembershipDetails = async (page = 1, newFilters = filters) => {
    if (!membershipId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...newFilters
      });
      
      const response = await instance.get(`/memberships/${membershipId}/details?${params}`);
      setMembershipDetails(response.data.data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching membership details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && membershipId) {
      fetchMembershipDetails();
    }
  }, [isOpen, membershipId]);

  const handlePageChange = (page) => {
    fetchMembershipDetails(page, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchMembershipDetails(1, newFilters);
  };

  const handleClose = () => {
    setMembershipDetails(null);
    setCurrentPage(1);
    setFilters({ status: '', search: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCrown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Detail Membership
              </h2>
              <p className="text-sm text-gray-600">
                Informasi Membership
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <FaTimes className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : membershipDetails ? (
            <div className="space-y-6">
              {/* Membership Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Membership</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nama Membership</label>
                    <p className="font-semibold text-gray-800">{membershipDetails.membership.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Deskripsi</label>
                    <p className="font-semibold text-gray-800">{membershipDetails.membership.description}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Diskon</label>
                    <p className="font-semibold text-blue-600">{membershipDetails.membership.discount_percentage}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Harga</label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(membershipDetails.membership.price)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Durasi</label>
                    <p className="font-semibold text-gray-800">{membershipDetails.membership.duration_days} hari</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      membershipDetails.membership.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {membershipDetails.membership.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FaUsers className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{membershipDetails.statistics.total_customers}</p>
                    <p className="text-sm text-gray-600">Total Customer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FaUsers className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{membershipDetails.statistics.active_customers}</p>
                    <p className="text-sm text-gray-600">Aktif</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FaUsers className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{membershipDetails.statistics.expired_customers}</p>
                    <p className="text-sm text-gray-600">Expired</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FaDollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(membershipDetails.statistics.total_revenue)}
                    </p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Cari customer..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Semua Status</option>
                      <option value="active">Aktif</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer List */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Daftar Customer</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {membershipDetails.customers.length > 0 ? (
                    membershipDetails.customers.map((customerMembership) => (
                      <div key={customerMembership.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-800">{customerMembership.customer.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                customerMembership.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : customerMembership.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {customerMembership.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>📞 {customerMembership.customer.phone}</span>
                              {customerMembership.customer.email && (
                                <span>📧 {customerMembership.customer.email}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              <div>Mulai: {new Date(customerMembership.start_date).toLocaleDateString('id-ID')}</div>
                              <div>
                                Berakhir: {
                                  customerMembership.end_date 
                                    ? new Date(customerMembership.end_date).toLocaleDateString('id-ID')
                                    : '(Permanen)'
                                }
                              </div>
                              <div className="font-semibold text-blue-600">
                                {customerMembership.membership_type === 'tier-based' ? (
                                  <span className="text-green-600">Aktif Permanen</span>
                                ) : customerMembership.days_remaining !== null && customerMembership.days_remaining > 0 ? (
                                  `${customerMembership.days_remaining} hari tersisa`
                                ) : customerMembership.membership_type === 'expired' ? (
                                  <span className="text-red-600">Expired</span>
                                ) : (
                                  'Aktif'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Tidak ada customer ditemukan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {membershipDetails.pagination && membershipDetails.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Halaman {membershipDetails.pagination.current_page} dari {membershipDetails.pagination.total_pages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!membershipDetails.pagination.has_prev_page}
                      className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, membershipDetails.pagination.total_pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded-lg ${
                            page === currentPage 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!membershipDetails.pagination.has_next_page}
                      className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaCrown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Gagal memuat data membership</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipDetailModal;
