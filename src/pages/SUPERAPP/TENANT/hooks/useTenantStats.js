import { useState, useEffect } from 'react';
import tenantService from '../services/tenantService';

/**
 * Custom hook to fetch tenant statistics
 */
export const useTenantStats = () => {
  const [stats, setStats] = useState({
    active_trial: 0,
    expired_trial: 0,
    active: 0,
    expired_tenant: 0,
    // Plan-based stats
    notafree: 0,
    notalite: 0,
    notapro: 0,
    notabusiness: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tenantService.getStats();
      
      if (response.success) {
        // API V2 returns: { success: true, data: { active_trial: 0, expired_trial: 0, active: 0, expired_tenant: 0 } }
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

