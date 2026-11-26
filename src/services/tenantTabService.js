import instance from '../config/api';

const tenantTabService = {
    // Get unverified tenants
    getUnverifiedTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/unverified', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get active trial tenants
    getActiveTrialTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/active-trial', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get expired trial tenants
    getExpiredTrialTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/expired-trial', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get active tenants
    getActiveTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/active', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get expired tenants
    getExpiredTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/expired-tenant', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get last access trial tenants
    getLastAccessTrialTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/last-access-trial', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get last access subscription tenants
    getLastAccessSubscriptionTenants: async (params = {}) => {
        try {
            const response = await instance.get('/tenants/last-access-subscription', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default tenantTabService;
