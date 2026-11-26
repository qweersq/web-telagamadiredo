import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantTabService from '../../services/tenantTabService';
import tenantStatsService from '../../services/tenantStatsService';
import TabNavigation from './TabNavigation';
import TenantTable from './TenantTable';
import TenantDetailModal from './Modal/TenantDetailModal';
import { TAB_CONFIGS } from './TabConfigs';
import { FaArrowLeft, FaSearch, FaSync, FaTimes } from 'react-icons/fa';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unverified');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [tabCounts, setTabCounts] = useState({
    unverified: 0,
    active_trial: 0,
    last_access_trial: 0,
    expired_trial: 0,
    active: 0,
    last_access_subscription: 0,
    expired_tenant: 0
  });
  const [modalState, setModalState] = useState({
    isOpen: false,
    tenant: null,
    activeTab: null
  });
  
  const navigate = useNavigate();

  // Fetch tenants based on active tab
  const fetchTenants = async (page = 1, append = false) => {
    try {
      setTabLoading(true);
      const tabConfig = TAB_CONFIGS[activeTab];
      
      if (!tabConfig) {
        console.error('Invalid tab configuration');
        return;
      }

      const params = {
        page,
        limit: pagination.limit
      };

      let response;
      switch (activeTab) {
        case 'unverified':
          response = await tenantTabService.getUnverifiedTenants(params);
          break;
        case 'active_trial':
          response = await tenantTabService.getActiveTrialTenants(params);
          break;
        case 'last_access_trial':
          response = await tenantTabService.getLastAccessTrialTenants(params);
          break;
        case 'expired_trial':
          response = await tenantTabService.getExpiredTrialTenants(params);
          break;
        case 'active':
          response = await tenantTabService.getActiveTenants(params);
          break;
        case 'last_access_subscription':
          response = await tenantTabService.getLastAccessSubscriptionTenants(params);
          break;
        case 'expired_tenant':
          response = await tenantTabService.getExpiredTenants(params);
          break;
        default:
          console.error('Unknown tab:', activeTab);
          return;
      }

      if (response.success) {
        const tenantData = response.data.data || response.data;
        const paginationData = response.data.pagination;
        
        if (append) {
          setTenants(prevTenants => [...prevTenants, ...tenantData]);
        } else {
          setTenants(tenantData);
        }
        
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasMore: paginationData.page < paginationData.totalPages
        });
      } else {
        console.error('Failed to fetch tenants:', response.message);
        if (!append) {
          setTenants([]);
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      if (!append) {
        alert('Gagal memuat data tenant');
      }
    } finally {
      setTabLoading(false);
    }
  };

  // Fetch tab counts
  const fetchTabCounts = async () => {
    try {
      const response = await tenantStatsService.getTabCounts();
      if (response.success) {
        setTabCounts(response.data.counts);
      } else {
        console.error('Failed to fetch tab counts:', response.message);
        // Set default counts if API fails
        setTabCounts({
          unverified: 0,
          active_trial: 0,
          last_access_trial: 0,
          expired_trial: 0,
          active: 0,
          last_access_subscription: 0,
          expired_tenant: 0
        });
      }
    } catch (error) {
      console.error('Error fetching tab counts:', error);
      // Set default counts if API fails
      setTabCounts({
        unverified: 0,
        active_trial: 0,
        last_access_trial: 0,
        expired_trial: 0,
        active: 0,
        last_access_subscription: 0,
        expired_tenant: 0
      });
    }
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
  };

  // Handle search input change (no local filtering)
  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to SuperAppTenantSearch page with search term
      navigate(`/tenant-search?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // If no search term, navigate to search page without query
      navigate('/tenant-search');
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/superapp-dashboard');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchTenants(1, false);
    fetchTabCounts();
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.hasMore && !tabLoading) {
      fetchTenants(pagination.page + 1, true);
    }
  };

  // Handle actions
  const handleAction = (action, tenant) => {
    console.log('Action:', action, 'Tenant:', tenant);
    
    switch (action) {
      case 'view':
        setModalState({
          isOpen: true,
          tenant: tenant,
          activeTab: activeTab
        });
        break;
      case 'edit':
        navigate(`/superapp/tenants/${tenant.id}/edit`);
        break;
      // ✅ COMMENTED OUT: Copy verification link (not needed anymore)
      /*
      case 'copyLink':
        // Copy verification link logic
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`${window.location.origin}/verify/${tenant.verification_token}`);
          alert('Verification link copied to clipboard');
        }
        break;
      */
      case 'whatsapp':
        // Open WhatsApp
        const phoneNumber = tenant.phone?.replace(/\D/g, '');
        if (phoneNumber) {
          window.open(`https://wa.me/${phoneNumber}`, '_blank');
        }
        break;
      default:
        console.log('Action not implemented:', action);
        break;
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalState({
      isOpen: false,
      tenant: null,
      activeTab: null
    });
  };

  // Effects
  useEffect(() => {
    setPagination({
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
      hasMore: false
    });
    fetchTenants(1, false);
  }, [activeTab]);

  useEffect(() => {
    fetchTabCounts();
  }, []);

  // Remove full page loading - use skeleton loader in table instead

  return (
    <div className="h-screen bg-gray-50 font-montserrat flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Tenant Management</h1>
                <p className="text-sm text-gray-600 font-montserrat">Kelola dan pantau tenant Anda</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
          {/* Search Filter with Actions */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <form onSubmit={handleSearch} className="flex-1 flex gap-4 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Cari tenant berdasarkan nama, owner, email, atau phone..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-3 pl-12 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-montserrat"
                  />
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <FaSearch className="text-sm" />
                  Search
                </button>
              </form>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <FaSync className="text-sm" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabCounts={tabCounts}
            loading={tabLoading}
          />

          {/* Tenant Table */}
          <TenantTable
            activeTab={activeTab}
            tenants={tenants}
            loading={tabLoading}
            onAction={handleAction}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            pagination={pagination}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>

      {/* Tenant Detail Modal */}
      <TenantDetailModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        tenant={modalState.tenant}
        activeTab={modalState.activeTab}
      />
    </div>
  );
};

export default TenantManagement;
