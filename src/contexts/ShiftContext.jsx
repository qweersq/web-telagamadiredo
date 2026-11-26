import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import instance from '../config/api';
import { getUserProfile, invalidateUserProfileCache } from '../utils/userProfileHelper';

const ShiftContext = createContext();

export const useShift = () => useContext(ShiftContext);

// Helper function untuk mendapatkan userData dari API
async function getUserData() {
  try {
    const profile = await getUserProfile();
    if (!profile) return null;
    
    return {
      id: profile.user?.id,
      name: profile.user?.name,
      email: profile.user?.email,
      role: profile.user?.role,
      branch_id: profile.branch?.id,
      branch_name: profile.branch?.name,
      tenant_id: profile.tenant?.id,
      tenant_name: profile.tenant?.business_name
    };
  } catch (error) {
    return null;
  }
}

export const ShiftProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [cashAccount, setCashAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfileAndShift = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await instance.get('/get-profile');
      setUser(data.data.user);
      setShift(data.data.shifts);
      setLoading(false);
      if (data.data.shifts?.id) fetchExpenses(data.data.shifts.id);
      return { user: data.data.user, shift: data.data.shifts };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { user: null, shift: null };
    }
  }, []);

  const fetchCashAccount = useCallback(async () => {
    try {
      const userData = await getUserData();
      if (!userData?.tenant_id) return;
      
      const { data } = await instance.get('/finance-accounts', {
        params: { tenant_id: userData.tenant_id }
      });
      
      // Filter untuk mendapatkan account dengan type 'cash'
      const cashAccounts = data.data.filter(account => account.type === 'cash');
      
      if (cashAccounts.length > 0) {
        // Ambil yang pertama jika ada multiple cash accounts
        setCashAccount(cashAccounts[0]);
      } else {
        setCashAccount(null);
      }
    } catch (err) {
      setCashAccount(null);
    }
  }, []);

  const fetchExpenses = useCallback(async (shift_id) => {
    try {
      const userData = await getUserData();
      const params = { shift_id };
      
      if (userData?.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }
      if (userData?.branch_id) {
        params.branch_id = userData.branch_id;
      }
      
      const { data } = await instance.get('/expenses-shift', { params });
      setExpenses(data.data.expenses || []);
    } catch (err) {
      setExpenses([]);
    }
  }, []);

  const createExpense = async (payload) => {
    const userData = await getUserData();
    
    // Add tenant_id, branch_id to payload (finance_account_id sudah dari payload)
    const dataWithTenant = {
      ...payload,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null,
      // ✅ Use finance_account_id from payload (selectedAccountId from OpenShiftModal)
      finance_account_id: payload.finance_account_id || null
    };
    
    // ✅ Validate finance_account_id before sending
    if (!dataWithTenant.finance_account_id) {
      throw new Error('Finance account ID is required');
    }
    
    await instance.post('/expenses-shift', dataWithTenant);
    
    // ✅ Invalidate cache setelah create expense
    invalidateUserProfileCache();
    
    // ✅ Refresh expenses data
    if (shift?.id) fetchExpenses(shift.id);
  };

  const endShift = async (cash_actual) => {
    const userData = await getUserData();
    const params = {};
    
    if (userData?.tenant_id) {
      params.tenant_id = userData.tenant_id;
    }
    if (userData?.branch_id) {
      params.branch_id = userData.branch_id;
    }
    
    try {
      await instance.put(`/end-shifts/${shift.id}`, { cash_actual }, { params });
      fetchProfileAndShift();
    } catch (error) {
      // ✅ Pass error message dari BE ke component
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message;
      throw new Error(errorMessage || 'Gagal mengakhiri shift');
    }
  };

  const openShift = async (cash_initial) => {
    const userData = await getUserData();
    
    // Add tenant_id and branch_id to payload
    const dataWithTenant = {
      cash_initial,
      tenant_id: userData?.tenant_id || null,
      branch_id: userData?.branch_id || null
    };
    
    try {
      await instance.post('/shifts', dataWithTenant);
      
      // ✅ Invalidate cache setelah open shift
      invalidateUserProfileCache();
      
      // ✅ Fetch fresh data setelah invalidate cache
      await fetchProfileAndShift();
    } catch (error) {
      // ✅ Pass error message dari BE ke component
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message;
      throw new Error(errorMessage || 'Gagal membuka shift');
    }
  };

  // Fetch cash account when component mounts
  useEffect(() => {
    fetchCashAccount();
  }, [fetchCashAccount]);

  return (
    <ShiftContext.Provider value={{
      user, shift, expenses, cashAccount, loading, error,
      fetchProfileAndShift, fetchExpenses, fetchCashAccount, createExpense, endShift, openShift
    }}>
      {children}
    </ShiftContext.Provider>
  );
}; 