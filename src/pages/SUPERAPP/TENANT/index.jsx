import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSync, FaSearch, FaArrowLeft } from 'react-icons/fa';
import TenantTabNavigation from './components/TenantTabNavigation';
import TenantTable from './components/TenantTable';
import { useTenantStats } from './hooks/useTenantStats';
import { useTenantList } from './hooks/useTenantList';
import { TENANT_TABS } from './config/tabConfig';
import api from '../../../config/api';

/**
 * Tenant Management - Main Page
 * Simple 4 Tab System: Trial Active, Trial Expired, Active, Expired
 */
const TenantManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active_trial');
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  
  // Fetch stats for cards
  const { stats, loading: statsLoading, refetch: refetchStats } = useTenantStats();
  
  // Fetch tenants for current tab
  const { 
    tenants, 
    loading: tenantsLoading, 
    pagination,
    refetch: refetchTenants,
    goToPage
  } = useTenantList(activeTab);

  // Handle tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchStats();
    refetchTenants();
  };

  // Handle search click - navigate to search page
  const handleSearchClick = () => {
    navigate('/tenant-search');
  };

  // Fetch subscription plans for dynamic tabs
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/superapp/subscription-plans');
        if (response.data.success) {
          setSubscriptionPlans(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    };
    fetchPlans();
  }, []);

  // Generate dynamic plan tabs based on subscription plans
  const dynamicPlanTabs = useMemo(() => {
    const tabs = [];
    
    // Group plans by name, then create tabs for each unique duration
    const planGroups = {};
    if (subscriptionPlans && subscriptionPlans.length > 0) {
      subscriptionPlans.forEach(plan => {
        if (!planGroups[plan.name]) {
          planGroups[plan.name] = [];
        }
        planGroups[plan.name].push(plan);
      });
    }
    
    // Always create NotaFree tab first (backend supports it in stats with key 'notafree')
    // NotaFree should use key 'notafree' (without duration) to match backend stats
    const notaFreeColors = { color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-500', badgeColor: 'bg-gray-500' };
    tabs.push({
      key: 'notafree',
      label: 'NotaFree (Gratis)',
      color: notaFreeColors.color,
      bgColor: notaFreeColors.bgColor,
      textColor: notaFreeColors.textColor,
      borderColor: notaFreeColors.borderColor,
      badgeColor: notaFreeColors.badgeColor,
      hoverColor: 'hover:bg-gray-100',
      description: 'Tenants with NotaFree plan',
      type: 'plan',
      planName: 'NotaFree',
      durationDays: null, // NotaFree doesn't have specific duration
      filter: {
        plan_name: 'NotaFree'
      },
      columns: ['business_name', 'owner_name', 'plan_name', 'subscription_end_date', 'days_left', 'actions'],
      actions: ['view', 'view_billing', 'change_plan']
    });
    
    // Generate tabs for each plan name + duration combination
    Object.keys(planGroups).forEach(planName => {
      const plans = planGroups[planName];
      
      plans.forEach(plan => {
        // Skip all NotaFree plans (already created above with key 'notafree')
        if (plan.name === 'NotaFree') {
          return;
        }
        
        // Generate key: plan_name_duration (e.g., "notalite_90", "notapro_365")
        const key = `${planName.toLowerCase()}_${plan.duration_days}`;
        
        // Format duration label dynamically
        let durationLabel = '';
        if (plan.price === 0 || plan.duration_days === 9999) {
          durationLabel = 'Gratis';
        } else {
          // Convert days to readable format
          const days = plan.duration_days;
          if (days === 30) {
            durationLabel = '1 Bulan';
          } else if (days === 90) {
            durationLabel = '3 Bulan';
          } else if (days === 365) {
            durationLabel = '1 Tahun';
          } else if (days < 30) {
            durationLabel = `${days} Hari`;
          } else if (days < 365) {
            const months = Math.round(days / 30);
            durationLabel = `${months} Bulan`;
          } else {
            const years = Math.floor(days / 365);
            const remainingMonths = Math.round((days % 365) / 30);
            if (remainingMonths === 0) {
              durationLabel = `${years} Tahun`;
            } else {
              durationLabel = `${years} Tahun ${remainingMonths} Bulan`;
            }
          }
        }
        
        // Get color based on plan name
        const colorMap = {
          'NotaFree': { color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-500', badgeColor: 'bg-gray-500' },
          'NotaLite': { color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-500', badgeColor: 'bg-blue-500' },
          'NotaPro': { color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-500', badgeColor: 'bg-purple-500' },
          'NotaBusiness': { color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-500', badgeColor: 'bg-yellow-500' }
        };
        
        const colors = colorMap[plan.name] || colorMap['NotaFree'];
        
        tabs.push({
          key: key,
          label: `${plan.name} (${durationLabel})`,
          color: colors.color,
          bgColor: colors.bgColor,
          textColor: colors.textColor,
          borderColor: colors.borderColor,
          badgeColor: colors.badgeColor,
          hoverColor: `hover:bg-${colors.color}-100`,
          description: `Tenants with ${plan.name} ${durationLabel} plan`,
          type: 'plan',
          planName: plan.name,
          durationDays: plan.duration_days,
          filter: {
            plan_name: plan.name,
            duration_days: plan.duration_days
          },
          columns: ['business_name', 'owner_name', 'plan_name', 'subscription_end_date', 'days_left', 'actions'],
          actions: ['view', 'view_billing', 'change_plan']
        });
      });
    });
    
    // Sort: NotaFree first, then by plan name (NotaLite, NotaPro, NotaBusiness), then by duration (30, 90, 365)
    tabs.sort((a, b) => {
      // NotaFree always first
      if (a.planName === 'NotaFree' && b.planName !== 'NotaFree') return -1;
      if (a.planName !== 'NotaFree' && b.planName === 'NotaFree') return 1;
      
      // If both are NotaFree, sort by duration (handle null)
      if (a.planName === 'NotaFree' && b.planName === 'NotaFree') {
        const aDur = a.durationDays || 0;
        const bDur = b.durationDays || 0;
        return aDur - bDur;
      }
      
      // Define plan order: NotaLite, NotaPro, NotaBusiness
      const planOrder = {
        'NotaLite': 1,
        'NotaPro': 2,
        'NotaBusiness': 3
      };
      
      // For other plans, sort by plan order first
      const aOrder = planOrder[a.planName] || 999;
      const bOrder = planOrder[b.planName] || 999;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Same plan name, sort by duration (30, 90, 365)
      const aDur = a.durationDays || 0;
      const bDur = b.durationDays || 0;
      return aDur - bDur;
    });
    
    return tabs;
  }, [subscriptionPlans]);

  // Combine static status tabs with dynamic plan tabs
  const allTabs = useMemo(() => {
    const statusTabs = TENANT_TABS.filter(tab => !tab.type || tab.type !== 'plan');
    
    // Sort dynamic plan tabs to ensure NotaFree is first
    const sortedPlanTabs = [...dynamicPlanTabs].sort((a, b) => {
      // NotaFree always first
      if (a.planName === 'NotaFree' && b.planName !== 'NotaFree') return -1;
      if (a.planName !== 'NotaFree' && b.planName === 'NotaFree') return 1;
      
      // If both are NotaFree, sort by duration (handle null)
      if (a.planName === 'NotaFree' && b.planName === 'NotaFree') {
        const aDur = a.durationDays || 0;
        const bDur = b.durationDays || 0;
        return aDur - bDur;
      }
      
      // Define plan order: NotaLite, NotaPro, NotaBusiness
      const planOrder = {
        'NotaLite': 1,
        'NotaPro': 2,
        'NotaBusiness': 3
      };
      
      // For other plans, sort by plan order first
      const aOrder = planOrder[a.planName] || 999;
      const bOrder = planOrder[b.planName] || 999;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Same plan name, sort by duration (30, 90, 365)
      const aDur = a.durationDays || 0;
      const bDur = b.durationDays || 0;
      return aDur - bDur;
    });
    
    return [...statusTabs, ...sortedPlanTabs];
  }, [dynamicPlanTabs]);

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header - Modern Clean */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button & Title Section */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => navigate('/superapp-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tenant Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage tenants across different subscription statuses
                </p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              {/* Search Field */}
              <div
                onClick={handleSearchClick}
                className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-100 cursor-pointer transition-all group min-w-[300px]"
              >
                <FaSearch className="text-gray-400 text-sm group-hover:text-gray-600 transition-colors" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Search tenant ...
                </span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={statsLoading || tenantsLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm whitespace-nowrap"
              >
                <FaSync className={`text-sm ${(statsLoading || tenantsLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <TenantTabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          stats={stats}
          subscriptionPlans={subscriptionPlans}
          tabs={allTabs}
        />

        {/* Tenant Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {tenantsLoading ? 'Loading...' : (
                <>
                  Showing <span className="font-semibold text-gray-900">{pagination.total}</span> tenants
                </>
              )}
            </p>
            <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full font-medium">
              {activeTab.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <TenantTable
            tenants={tenants}
            loading={tenantsLoading}
            pagination={pagination}
            onPageChange={goToPage}
            activeTab={activeTab}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;

