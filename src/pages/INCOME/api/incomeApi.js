import instance from '../../../config/api';

// Get all incomes
export const getIncomes = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.branch_id) params.append('branch_id', filters.branch_id);
        if (filters.tenant_id) params.append('tenant_id', filters.tenant_id);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', filters.page);
        if (filters.pageSize) params.append('pageSize', filters.pageSize);

        const response = await instance.get(`/incomes?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching incomes:', error);
        throw error;
    }
};

// Get income by ID
export const getIncomeById = async (id) => {
    try {
        const response = await instance.get(`/incomes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching income:', error);
        throw error;
    }
};

// Create income
export const createIncome = async (incomeData) => {
    try {
        const response = await instance.post('/incomes', incomeData);
        return response.data;
    } catch (error) {
        console.error('Error creating income:', error);
        throw error;
    }
};

// Update income
export const updateIncome = async (id, incomeData) => {
    try {
        const response = await instance.put(`/incomes/${id}`, incomeData);
        return response.data;
    } catch (error) {
        console.error('Error updating income:', error);
        throw error;
    }
};

// Delete income
export const deleteIncome = async (id) => {
    try {
        const response = await instance.delete(`/incomes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting income:', error);
        throw error;
    }
};

// Get branches
export const getBranches = async () => {
    try {
        const response = await instance.get('/branches');
        return response.data;
    } catch (error) {
        console.error('Error fetching branches:', error);
        throw error;
    }
};

// Get finance accounts by branch
export const getFinanceAccounts = async (branchId = null) => {
    try {
        const params = branchId ? `?branch_id=${branchId}` : '';
        const response = await instance.get(`/finance-accounts${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching finance accounts:', error);
        throw error;
    }
};

// Get finance categories (for income type = credit in DB)
export const getFinanceCategories = async (type = 'credit', tenantId = null) => {
    try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (tenantId) params.append('tenant_id', tenantId);

        const queryString = params.toString();
        const url = `/finance-categories${queryString ? `?${queryString}` : ''}`;
        const response = await instance.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching finance categories:', error);
        throw error;
    }
};
