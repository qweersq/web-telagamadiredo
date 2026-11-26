import instance from '../../../config/api';

// Get daily summary
export const getDailySummary = async (params) => {
  try {
    const requestParams = {
      date: params.date,
      period: params.period,
      is_active: true
    };

    // Add tenant_id and branch_id if provided
    if (params.tenant_id) {
      requestParams.tenant_id = params.tenant_id;
    }
    if (params.branch_id) {
      requestParams.branch_id = params.branch_id;
    }

    const response = await instance.get('/finance/daily-summary', {
      params: requestParams
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    throw error;
  }
};

// Get daily transactions with pagination
export const getDailyTransactions = async (params) => {
  try {
    const requestParams = {
      type: params.type,
      period: params.period,
      page: params.page || 1,
      limit: params.limit || 10
    };

    // Add date parameters based on period
    if (params.period === 'daily') {
      requestParams.date = params.date;
    } else if (params.period === 'weekly') {
      requestParams.start_date = params.startDate;
      requestParams.end_date = params.endDate;
    } else if (params.period === 'monthly') {
      requestParams.date = params.date; // Format: YYYY-MM
    }

    // Add tenant_id and branch_id if provided
    if (params.tenant_id) {
      requestParams.tenant_id = params.tenant_id;
    }
    if (params.branch_id) {
      requestParams.branch_id = params.branch_id;
    }

    const response = await instance.get('/finance/daily-transactions', {
      params: requestParams
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching daily transactions:', error);
    throw error;
  }
};

// Get transaction detail
export const getTransactionDetail = async (transactionId) => {
  try {
    const response = await instance.get(`/finance/transaction/${transactionId}/detail`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching transaction detail:', error);
    throw error;
  }
};

// Get periods
export const getPeriods = async () => {
  try {
    const response = await instance.get('/finance/periods');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching periods:', error);
    throw error;
  }
};

// Add expense
export const addExpense = async (expenseData) => {
  try {
    const response = await instance.post('/expenses', expenseData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Get finance accounts
// Note: tenant_id is automatically taken from JWT token on backend for security
export const getFinanceAccounts = async (branchId = null, isActive = true) => {
  try {
    const requestParams = {
      is_active: isActive
    };
    
    // Add branch_id jika tersedia
    if (branchId) {
      requestParams.branch_id = branchId;
    }

    const response = await instance.get('/finance-accounts', {
      params: requestParams
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get finance categories (with optional type filter)
// Note: tenant_id is automatically taken from JWT token on backend for security
export const getFinanceCategories = async (type = null) => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const queryString = params.toString();
    const url = `/finance-categories${queryString ? `?${queryString}` : ''}`;
    const response = await instance.get(url);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Add external income
export const addExternalIncome = async (incomeData) => {
  try {
    const response = await instance.post('/income-outside-orders', incomeData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding external income:', error);
    throw error;
  }
};

// Transfer cash to bank
export const transferCashToBank = async (transferData) => {
  try {
    const response = await instance.post('/cash-to-bank', transferData);
    return response.data.data;
  } catch (error) {
    console.error('Error transferring cash to bank:', error);
    throw error;
  }
};

// Get branches
// Note: tenant_id is automatically taken from JWT token on backend for regular users
export const getBranches = async () => {
  try {
    const response = await instance.get('/branches');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get account summary
export const getAccountSummary = async (params) => {
  try {
    const requestParams = {
      type: params.type || 'all',
      period: params.period || 'daily'
    };

    // Add date parameters based on period
    if (params.period === 'daily') {
      requestParams.date = params.date;
    } else if (params.period === 'weekly') {
      requestParams.start_date = params.startDate;
      requestParams.end_date = params.endDate;
    } else if (params.period === 'monthly') {
      requestParams.date = params.date; // Format: YYYY-MM
    }

    // Add tenant_id and branch_id if provided
    if (params.tenant_id) {
      requestParams.tenant_id = params.tenant_id;
    }
    if (params.branch_id) {
      requestParams.branch_id = params.branch_id;
    }

    const response = await instance.get('/finance/account-summary', {
      params: requestParams
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching account summary:', error);
    throw error;
  }
};

// Get financial report
export const getFinancialReport = async (params) => {
  try {
    const requestParams = {
      month: params.month,
      year: params.year
    };

    // Add tenant_id and branch_id if provided
    if (params.tenant_id) {
      requestParams.tenant_id = params.tenant_id;
    }
    if (params.branch_id) {
      requestParams.branch_id = params.branch_id;
    }

    const response = await instance.get('/finance/financial-report', {
      params: requestParams
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching financial report:', error);
    throw error;
  }
};

// Create transfer between accounts
export const createTransfer = async (transferData) => {
  try {
    const response = await instance.post('/finance/transfer', transferData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating transfer:', error);
    throw error;
  }
};

// Get transfer history
export const getTransferHistory = async (params = {}) => {
  try {
    const requestParams = {
      page: params.page || 1,
      limit: params.limit || 10
    };

    if (params.from_account_id) {
      requestParams.from_account_id = params.from_account_id;
    }
    if (params.to_account_id) {
      requestParams.to_account_id = params.to_account_id;
    }

    const response = await instance.get('/finance/transfer/history', {
      params: requestParams
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    throw error;
  }
};

// Export transactions list as PDF
export const exportTransactionsPDF = async (params) => {
  try {
    const requestParams = {
      period: params.period || 'daily',
      type: params.type || 'all',
    };

    if (params.period === 'daily' || params.period === 'monthly') {
      requestParams.date = params.date;
    } else if (params.period === 'weekly') {
      requestParams.start_date = params.startDate;
      requestParams.end_date = params.endDate;
    }

    if (params.tenant_id) {
      requestParams.tenant_id = params.tenant_id;
    }
    if (params.branch_id) {
      requestParams.branch_id = params.branch_id;
    }

    const response = await instance.get('/finance/transactions/pdf', {
      params: requestParams,
      responseType: 'blob'
    });

    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `Daftar-Transaksi-${params.date || 'semua'}.pdf`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting transactions PDF:', error);
    throw error;
  }
};

