import { useState, useEffect } from 'react';
import tenantService from '../services/tenantService';

/**
 * Custom hook to fetch tenant list by tab
 */
export const useTenantList = (activeTab) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchTenants = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tenantService.getTenantsByTab(activeTab, page, pagination.limit);
      
      if (response.success) {
        // API V2 returns: { success: true, data: { tenants: [...], pagination: {...} } }
        const data = response.data;
        setTenants(data.tenants || []);
        setPagination({
          ...pagination,
          page: data.pagination?.current_page || page,
          total: data.pagination?.total_items || 0,
          totalPages: data.pagination?.total_pages || 0
        });
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(err.message || 'Failed to fetch tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab) {
      fetchTenants(1);
    }
  }, [activeTab]);

  const goToPage = (page) => {
    fetchTenants(page);
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchTenants(pagination.page + 1);
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      fetchTenants(pagination.page - 1);
    }
  };

  return {
    tenants,
    loading,
    error,
    pagination,
    refetch: () => fetchTenants(pagination.page),
    goToPage,
    nextPage,
    prevPage
  };
};

