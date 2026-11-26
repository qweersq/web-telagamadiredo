import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import TenantDetailModal from './TENANT/components/TenantDetailModal';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaEye, 
  FaCopy,
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle
} from 'react-icons/fa';

const SuperAppTenantSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [activeTab, setActiveTab] = useState('active_trial');

  // Get search term from URL params OR load all tenants on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchTerm(query);
      searchTenants(query);
    } else {
      // Auto-load all tenants on mount (empty search = all)
      searchTenants('');
    }
  }, [location.search]);

  // Re-search when sort or page changes
  useEffect(() => {
    // Always search (empty string = all tenants)
    searchTenants(searchTerm);
  }, [sortField, sortDirection, currentPage]);

  const searchTenants = async (query = searchTerm) => {
    // Allow empty query to fetch all tenants
    try {
      setLoading(true);
      const response = await tenantService.getAllTenants({
        search: query || '', // Empty search = all tenants
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        let tenantsData = response.data.data || response.data;
        
        // Client-side sorting since backend doesn't support sort parameters
        tenantsData = sortTenants(tenantsData);
        
        setTenants(tenantsData);
        setTotalItems(response.data.pagination?.total_items || tenantsData.length || 0);
      }
    } catch (error) {
      console.error('Error searching tenants:', error);
      setTenants([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const sortTenants = (tenants) => {
    return [...tenants].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested properties
      if (sortField === 'business_name') {
        aValue = a.business_name || '';
        bValue = b.business_name || '';
      }
      
      if (sortField === 'owner_name') {
        aValue = a.owner_name || '';
        bValue = b.owner_name || '';
      }

      if (sortField === 'email') {
        aValue = a.email || '';
        bValue = b.email || '';
      }

      // Handle date fields
      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'ASC' ? 1 : -1;
      return 0;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Allow empty search to show all tenants
    if (searchTerm.trim()) {
      // Update URL with search term
      const newUrl = `/tenant-search?q=${encodeURIComponent(searchTerm.trim())}`;
      navigate(newUrl);
    } else {
      // Clear URL query and show all tenants
      navigate('/tenant-search');
    }
    setCurrentPage(1); // Reset to page 1
    searchTenants(searchTerm.trim());
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Determine active tab based on tenant status (matched to new modal tabs)
  const determineActiveTab = (tenant) => {
    if (!tenant) return 'active_trial';
    
    // Check subscription status
    if (tenant.subscription_status === 'active') {
      return 'active';
    }
    
    // Check if trial is active
    if (tenant.status === 'trial' && tenant.trial_end_date) {
      const trialEndDate = new Date(tenant.trial_end_date);
      const now = new Date();
      
      if (trialEndDate > now) {
        return 'active_trial';
      } else {
        return 'expired_trial';
      }
    }
    
    // Check if subscription status is trial
    if (tenant.subscription_status === 'trial') {
      const trialEndDate = new Date(tenant.trial_end_date);
      const now = new Date();
      
      if (trialEndDate > now) {
        return 'active_trial';
      } else {
        return 'expired_trial';
      }
    }
    
    // Check if expired
    if (tenant.status === 'expired' || tenant.subscription_status === 'expired') {
      return 'expired_tenant';
    }
    
    // Default to active_trial
    return 'active_trial';
  };

  const handleViewTenant = (tenant) => {
    setSelectedTenant(tenant);
    const tab = determineActiveTab(tenant);
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
    setActiveTab('active_trial');
  };

  const handleRefresh = () => {
    if (searchTerm.trim()) {
      searchTenants(searchTerm);
    }
  };

  // ✅ COMMENTED OUT: Copy verification link (not needed anymore)
  /*
  const handleCopyVerificationLink = async (tenantId) => {
    try {
      const response = await tenantService.generateVerificationLink(tenantId);
      if (response.success) {
        await navigator.clipboard.writeText(response.data.whatsapp_message);
        alert('Link verifikasi berhasil disalin ke clipboard!');
      }
    } catch (error) {
      console.error('Error generating verification link:', error);
      alert('Gagal membuat link verifikasi. Silakan coba lagi.');
    }
  };
  */

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/tenant-list')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-montserrat">
                  {searchTerm.trim() ? 'Search Tenants' : 'All Tenants'}
                </h1>
                <p className="text-sm text-gray-600 font-montserrat">
                  {loading ? 'Loading...' : 
                   totalItems > 0 ? (searchTerm.trim() ? `Found ${totalItems} results` : `Showing ${totalItems} tenants`) : 
                   'No tenants found'}
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
          <form onSubmit={handleSearch} className="w-full">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by business name, owner name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-montserrat"
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
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
                disabled={loading}
              >
                <FaSearch className="text-sm" />
                {loading ? 'Loading...' : (searchTerm.trim() ? 'Search' : 'Show All')}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {tenants.length > 0 && (
          <div className="space-y-4">
            {/* Tenant List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {tenants.map((tenant) => (
                  <div 
                    key={tenant.id} 
                    className="p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {/* Business Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                              {tenant.business_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {tenant.owner_name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="hidden md:flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                          <FaEnvelope className="text-gray-400 flex-shrink-0" size={12} />
                          <span className="truncate">{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FaPhone className="text-gray-400 flex-shrink-0" size={12} />
                          <span>{tenant.phone}</span>
                        </div>
                      </div>

                      {/* Status & Location */}
                      <div className="hidden lg:flex items-center gap-3">
                        <div className="text-sm text-gray-600 min-w-[100px]">
                          <FaBuilding className="inline text-gray-400 mr-1" size={12} />
                          {tenant.city || '-'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            tenant.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                            tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                            tenant.status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tenant.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            tenant.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                            tenant.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            tenant.subscription_status === 'expired' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tenant.subscription_status}
                          </span>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="hidden xl:block text-sm text-gray-500 min-w-[120px] text-right">
                        <div>Created</div>
                        <div className="font-medium text-gray-700">{formatDate(tenant.createdAt)}</div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleViewTenant(tenant)}
                          className="p-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                          title="View Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Info */}
                    <div className="md:hidden mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FaEnvelope className="text-gray-400" size={12} />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FaPhone className="text-gray-400" size={12} />
                        <span>{tenant.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tenant.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                          tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                          tenant.status === 'expired' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tenant.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tenant.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                          tenant.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                          tenant.subscription_status === 'expired' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tenant.subscription_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalItems}</span> tenants
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              pageNum === currentPage
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && tenants.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <FaSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 font-montserrat mb-2">
              {searchTerm.trim() ? 'No results found' : 'No tenants found'}
            </h3>
            <p className="text-gray-500 font-montserrat">
              {searchTerm.trim() 
                ? 'Try searching with different keywords or check your spelling.'
                : 'No tenants registered in the system yet.'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-montserrat">
              {searchTerm.trim() ? 'Searching...' : 'Loading tenants...'}
            </p>
          </div>
        )}
      </div>

      {/* Tenant Detail Modal */}
      {isModalOpen && selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          onClose={handleCloseModal}
          activeTab={activeTab}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default SuperAppTenantSearch;
