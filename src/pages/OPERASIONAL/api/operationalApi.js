import instance from '../../../config/api';

/**
 * Operational API client functions
 */

// Get comprehensive operational report
export const getOperationalReport = async (params) => {
  try {
    console.log('🔍 operationalApi.getOperationalReport - Params:', params);

    const response = await instance.get('/operational/report', { params });

    console.log('✅ operationalApi.getOperationalReport - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getOperationalReport - Error:', error);
    throw error;
  }
};

// Get operational summary only
export const getOperationalSummary = async (params) => {
  try {
    console.log('🔍 operationalApi.getOperationalSummary - Params:', params);

    const response = await instance.get('/operational/summary', { params });

    console.log('✅ operationalApi.getOperationalSummary - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getOperationalSummary - Error:', error);
    throw error;
  }
};

// Get top services
export const getTopServices = async (params) => {
  try {
    console.log('🔍 operationalApi.getTopServices - Params:', params);

    const response = await instance.get('/operational/top-services', { params });

    console.log('✅ operationalApi.getTopServices - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getTopServices - Error:', error);
    throw error;
  }
};

// Get top customers
export const getTopCustomers = async (params) => {
  try {
    console.log('🔍 operationalApi.getTopCustomers - Params:', params);

    const response = await instance.get('/operational/top-customers', { params });

    console.log('✅ operationalApi.getTopCustomers - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getTopCustomers - Error:', error);
    throw error;
  }
};

// Get discount analysis
export const getDiscountAnalysis = async (params) => {
  try {
    console.log('🔍 operationalApi.getDiscountAnalysis - Params:', params);

    const response = await instance.get('/operational/discount-analysis', { params });

    console.log('✅ operationalApi.getDiscountAnalysis - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getDiscountAnalysis - Error:', error);
    throw error;
  }
};

// Get item analysis
export const getItemAnalysis = async (params) => {
  try {
    console.log('🔍 operationalApi.getItemAnalysis - Params:', params);

    const response = await instance.get('/operational/item-analysis', { params });

    console.log('✅ operationalApi.getItemAnalysis - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getItemAnalysis - Error:', error);
    throw error;
  }
};

// Get membership analysis
export const getMembershipAnalysis = async (params) => {
  try {
    console.log('🔍 operationalApi.getMembershipAnalysis - Params:', params);

    const response = await instance.get('/operational/membership-analysis', { params });

    console.log('✅ operationalApi.getMembershipAnalysis - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getMembershipAnalysis - Error:', error);
    throw error;
  }
};

// Get operational trends
export const getOperationalTrends = async (params) => {
  try {
    console.log('🔍 operationalApi.getOperationalTrends - Params:', params);

    const response = await instance.get('/operational/trends', { params });

    console.log('✅ operationalApi.getOperationalTrends - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getOperationalTrends - Error:', error);
    throw error;
  }
};

// Get referral report
export const getReferralReport = async (params) => {
  try {
    console.log('🔍 operationalApi.getReferralReport - Params:', params);

    const response = await instance.get('/referral/report', { params });

    console.log('✅ operationalApi.getReferralReport - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getReferralReport - Error:', error);
    throw error;
  }
};

// Get point report
export const getPointReport = async (params) => {
  try {
    console.log('🔍 operationalApi.getPointReport - Params:', params);

    const response = await instance.get('/points/report', { params });

    console.log('✅ operationalApi.getPointReport - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getPointReport - Error:', error);
    throw error;
  }
};

// Get performance metrics per branch (beranda Supervisor "Top Cabang")
// Response: { success, data: { [branch_id]: { revenue, cashIn, treatments, items, orders, delta } } }
//   - revenue  = omzet, definisinya sama dengan "Laporan Operasional" owner
//   - cashIn   = uang masuk dari buku besar, sama dengan kartu "Uang Masuk" di "Laporan Keuangan" owner
//   - delta    = % omzet vs periode pembanding (rentang sama panjang sebelumnya), null kalau tidak ada pembanding
export const getBranchesPerformance = async (params) => {
  try {
    console.log('🔍 operationalApi.getBranchesPerformance - Params:', params);

    const response = await instance.get('/operational/branches-performance', { params });

    console.log('✅ operationalApi.getBranchesPerformance - Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ operationalApi.getBranchesPerformance - Error:', error);
    throw error;
  }
};