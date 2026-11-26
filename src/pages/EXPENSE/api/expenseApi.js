import instance from '../../../config/api';

// Get all expenses
export const getExpenses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.tenant_id) params.append('tenant_id', filters.tenant_id);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.pageSize) params.append('pageSize', filters.pageSize);
    if (filters.limit) params.append('limit', filters.limit); // Backward compatibility
    
    const response = await instance.get(`/expenses?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// Get expense by ID
export const getExpenseById = async (id) => {
  try {
    const response = await instance.get(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

// Create expense
export const createExpense = async (expenseData) => {
  try {
    const response = await instance.post('/expenses', expenseData);
    return response.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

// Update expense
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await instance.put(`/expenses/${id}`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (id) => {
  try {
    const response = await instance.delete(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting expense:', error);
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

// Get finance categories (with optional type filter)
export const getFinanceCategories = async (type = null, tenantId = null) => {
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

// Get expense statistics
export const getExpenseStatistics = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await instance.get(`/expenses/statistics?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense statistics:', error);
    throw error;
  }
};
