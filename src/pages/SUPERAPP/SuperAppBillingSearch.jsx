import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../config/api';
import { formatCurrency } from '../../utils/labelFormatter';
import { 
  formatBillingStatus, 
  formatPaymentMethod, 
  formatDate, 
  formatDateShort, 
  formatInvoiceNumber,
  formatPhoneNumber,
  formatBusinessName,
  formatOwnerName,
  formatEmail,
  getStatusColorClasses
} from '../../utils/billingFormatter';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaEye, 
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaDollarSign,
  FaCalendarAlt,
  FaReceipt,
  FaBuilding,
  FaTimes,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';

const SuperAppBillingSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Get search term from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchTerm(query);
      searchBillings(query);
    }
  }, [location.search]);

  // Re-search when sort or page changes
  useEffect(() => {
    if (searchTerm.trim()) {
      searchBillings(searchTerm);
    }
  }, [sortField, sortDirection, currentPage]);

  const searchBillings = async (query = searchTerm) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get('/superapp/billings', {
        params: {
          search: query,
          page: currentPage,
          limit: itemsPerPage,
          sort_by: sortField,
          sort_order: sortDirection
        }
      });
      
      if (response.data.success) {
        setBillings(response.data.data);
        setTotalItems(response.data.pagination?.total_items || 0);
      }
    } catch (error) {
      console.error('Error searching billings:', error);
      setBillings([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Update URL with search term
      const newUrl = `/billing-search?q=${encodeURIComponent(searchTerm.trim())}`;
      navigate(newUrl);
      searchBillings(searchTerm.trim());
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('ASC');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === 'ASC' ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'unpaid':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'failed':
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/billing-management')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-montserrat">
                  Search Billings
                </h1>
                <p className="text-sm text-gray-600 font-montserrat">
                  {totalItems > 0 ? `Found ${totalItems} results` : 'No results found'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Search Form */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by invoice code, tenant name, owner name, email, phone, amount, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-montserrat"
                />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}
            </div>
            <AnimatedButton
              type="submit"
              variant="blue"
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold"
              disabled={loading || !searchTerm.trim()}
            >
              <FaSearch className="text-sm" />
              {loading ? 'Searching...' : 'Search'}
            </AnimatedButton>
          </form>
        </div>

        {/* Results */}
        {billings.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      <button
                        onClick={() => handleSort('invoice_number')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Invoice
                        {getSortIcon('invoice_number')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      <button
                        onClick={() => handleSort('tenant.business_name')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Tenant
                        {getSortIcon('tenant.business_name')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      <button
                        onClick={() => handleSort('tenant.owner_name')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Owner
                        {getSortIcon('tenant.owner_name')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Amount
                        {getSortIcon('amount')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      <button
                        onClick={() => handleSort('due_date')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Due Date
                        {getSortIcon('due_date')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billings.map((billing) => (
                    <tr key={billing.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-montserrat">
                          {formatInvoiceNumber(billing.invoice_number)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-montserrat">
                          {formatBusinessName(billing.tenant?.business_name)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-montserrat">
                          {formatOwnerName(billing.tenant?.owner_name)}
                        </div>
                        <div className="text-xs text-gray-500 font-montserrat">
                          {formatEmail(billing.tenant?.email)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 font-montserrat">
                          {formatCurrency(billing.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusInfo = formatBillingStatus(billing.status);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                              <span>{statusInfo.icon}</span>
                              {statusInfo.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                        {formatDate(billing.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/superapp/billing-management?view=${billing.id}`)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <FaEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {billings.map((billing) => (
                <div key={billing.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 font-montserrat">
                        {formatInvoiceNumber(billing.invoice_number)}
                      </h3>
                      <p className="text-xs text-gray-600 font-montserrat">
                        {formatBusinessName(billing.tenant?.business_name)}
                      </p>
                      <p className="text-xs text-gray-500 font-montserrat">
                        Owner: {formatOwnerName(billing.tenant?.owner_name)}
                      </p>
                    </div>
                    {(() => {
                      const statusInfo = formatBillingStatus(billing.status);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                          <span>{statusInfo.icon}</span>
                          {statusInfo.text}
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-montserrat">Amount:</span>
                      <span className="text-sm font-semibold text-gray-900 font-montserrat">
                        {formatCurrency(billing.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-montserrat">Due Date:</span>
                      <span className="text-xs text-gray-600 font-montserrat">
                        {formatDate(billing.due_date)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/superapp/billing-management?view=${billing.id}`)}
                      className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-900 transition-colors duration-200 text-sm font-medium"
                    >
                      <FaEye className="text-sm" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 font-montserrat">
                        Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && billings.length === 0 && searchTerm && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <FaSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 font-montserrat mb-2">
              No results found
            </h3>
            <p className="text-gray-500 font-montserrat">
              Try searching with different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-montserrat">Searching...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAppBillingSearch;
