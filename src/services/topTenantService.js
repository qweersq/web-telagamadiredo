import api from '../config/api';

const topTenantService = {
    /**
     * Get top tenants by omzet for a specific month/year
     * @param {Object} params - { month, year, limit }
     */
    getTopTenants: async (params = {}) => {
        try {
            const response = await api.get('/super-app/top-tenants', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get branch breakdown for a specific tenant
     * @param {number} tenantId - Tenant ID
     * @param {Object} params - { month, year }
     */
    getTenantBranches: async (tenantId, params = {}) => {
        try {
            const response = await api.get(`/super-app/top-tenants/${tenantId}/branches`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default topTenantService;
