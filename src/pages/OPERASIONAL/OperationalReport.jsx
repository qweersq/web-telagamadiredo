import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import {
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Star,
  Gift,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  FileText,
  Info,
  Download,
  UserPlus,
  ArrowRight,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { getOperationalReport, getReferralReport, getPointReport } from './api/operationalApi';
import { getUserProfile } from '../../utils/userProfileHelper';
import OperationalExplanationModal from '../../components/Modal/OperationalExplanationModal';
import ReferralReportModal from '../../components/Modal/ReferralReportModal';
import PointReportModal from '../../components/Modal/PointReportModal';
import instance from '../../config/api';

const OperationalReport = () => {
  const navigate = useNavigate();

  // State untuk filter
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isExportingOrders, setIsExportingOrders] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [isNotaFree, setIsNotaFree] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [pointData, setPointData] = useState(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointsEnabled, setPointsEnabled] = useState(false);

  // API Data
  const [reportData, setReportData] = useState({
    summary: {
      total_services: 0,
      total_customers: 0,
      total_discounts: 0,
      total_items: 0,
      total_memberships: 0,
      total_revenue: 0,
      total_orders: 0
    },
    top_services: [],
    top_customers: [],
    discount_analysis: [],
    item_analysis: []
  });

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  // Options untuk dropdown
  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const years = [];
  for (let year = 2020; year <= new Date().getFullYear(); year++) {
    years.push(year);
  }

  // Load initial data
  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile?.tenant?.id) {
      console.log('🔍 OperationalReport - UserProfile loaded:', {
        tenant_id: userProfile.tenant?.id,
        branch_id: userProfile.branch?.id,
        tenant_name: userProfile.tenant?.business_name,
        branch_name: userProfile.branch?.name
      });
      loadBranches();
      // Set default branch to current user's branch
      setSelectedBranch(userProfile.branch?.id);
      // Fetch points settings
      fetchPointsSettings();
    }
  }, [userProfile]);

  // Fetch initial data after branches are loaded
  useEffect(() => {
    if (userProfile && selectedBranch !== null && branches.length > 0) {
      fetchOperationalReport();
      fetchReferralReport();
      // Only fetch point report if points are enabled
      if (pointsEnabled) {
        fetchPointReport();
      } else {
        // Clear point data if points are disabled
        setPointData(null);
      }
    }
  }, [userProfile, selectedBranch, branches, selectedMonth, selectedYear, pointsEnabled]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);

      // Check if user has NotaFree plan
      const planId = profile?.subscription?.plan?.id;
      setIsNotaFree(planId === 4);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Gagal memuat profil pengguna');
      setIsNotaFree(false);
    }
  };

  const loadBranches = async () => {
    try {
      if (!userProfile?.tenant?.id) {
        console.log('❌ No tenant.id available yet');
        return;
      }

      setBranchesLoading(true);
      console.log('🔄 Loading branches for tenant:', userProfile.tenant.id);
      const response = await instance.get(`/branches?tenant_id=${userProfile.tenant.id}`);

      if (response.data.success) {
        const branchesData = response.data.data.map(branch => ({
          id: branch.id,
          name: branch.name
        }));
        setBranches(branchesData);
        console.log('✅ Branches loaded:', branchesData);
      } else {
        console.error('❌ API returned error:', response.data.message);
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error loading branches:', error);
      // Fallback to mock data if API fails
      const mockBranches = [
        { id: 4, name: 'NotaSepatu Lawang' },
        { id: 5, name: 'NotaSepatu Malang' },
        { id: 6, name: 'NotaSepatu Surabaya' }
      ];
      setBranches(mockBranches);
      console.log('⚠️ Using fallback branches:', mockBranches);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Fetch points settings to check if points are enabled
  const fetchPointsSettings = async () => {
    try {
      const response = await instance.get('/points-settings');
      if (response.data.success && response.data.data) {
        const enabled = Boolean(response.data.data.enabled) || false;
        setPointsEnabled(enabled);
        console.log('✅ Points settings loaded - enabled:', enabled);
      } else {
        setPointsEnabled(false);
      }
    } catch (error) {
      console.error('❌ Error fetching points settings:', error);
      // Default to false if fetch fails
      setPointsEnabled(false);
    }
  };

  const fetchOperationalReport = async () => {
    if (!userProfile) return;

    setLoading(true);
    setError(null);
    setShowAllServices(false);

    try {
      const params = {
        tenant_id: userProfile.tenant.id,
        branch_id: selectedBranch,
        start_date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`,
        end_date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate().toString().padStart(2, '0')}`
      };

      console.log('🔄 Fetching operational report with params:', params);

      const response = await getOperationalReport(params);

      if (response.success) {
        setReportData(response.data);
        console.log('✅ Operational report loaded:', response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch operational report');
      }
    } catch (error) {
      console.error('❌ Error fetching operational report:', error);
      setError(`Gagal memuat laporan operasional: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralReport = async () => {
    if (!userProfile) return;

    setReferralLoading(true);

    try {
      const params = {
        tenant_id: userProfile.tenant.id,
        branch_id: selectedBranch,
        start_date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`,
        end_date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate().toString().padStart(2, '0')}`
      };

      console.log('🔄 Fetching referral report with params:', params);

      const response = await getReferralReport(params);

      if (response.success) {
        setReferralData(response.data);
        console.log('✅ Referral report loaded:', response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch referral report');
      }
    } catch (error) {
      console.error('❌ Error fetching referral report:', error);
      setReferralData(null);
    } finally {
      setReferralLoading(false);
    }
  };

  const fetchPointReport = async () => {
    if (!userProfile) return;

    setPointLoading(true);

    try {
      const params = {
        tenant_id: userProfile.tenant.id,
        branch_id: selectedBranch,
        start_date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`,
        end_date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate().toString().padStart(2, '0')}`
      };

      console.log('🔄 Fetching point report with params:', params);

      const response = await getPointReport(params);

      if (response.success) {
        setPointData(response.data);
        console.log('✅ Point report loaded:', response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch point report');
      }
    } catch (error) {
      console.error('❌ Error fetching point report:', error);
      setPointData(null);
    } finally {
      setPointLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchOperationalReport();
    fetchReferralReport();
    // Only fetch point report if points are enabled
    if (pointsEnabled) {
      fetchPointReport();
    }
    setShowFilterModal(false);
  };

  // Export to PDF function - Download from backend
  const exportToPDF = async () => {
    try {
      if (!userProfile) {
        alert('Data belum tersedia. Silakan tunggu sebentar.');
        return;
      }

      console.log('🔍 Starting operational PDF export from backend...');

      // Calculate start_date and end_date for the selected month
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const monthName = months.find(m => m.value === selectedMonth)?.label || 'Unknown';
      const filename = `Laporan_Operasional_${monthName}_${selectedYear}.pdf`;

      // Build API URL with query params
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (selectedBranch) {
        params.append('branch_id', selectedBranch.toString());
      }

      // Get API base URL
      const apiUrl = instance.defaults.baseURL || window.location.origin;
      const pdfUrl = `${apiUrl}/operational/report/pdf?${params.toString()}`;

      console.log('📥 OperationalReport - Downloading PDF from:', pdfUrl);

      // Download PDF file
      const response = await instance.get('/operational/report/pdf', {
        params: {
          start_date: startDate,
          end_date: endDate,
          branch_id: selectedBranch || undefined
        },
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Operational PDF downloaded: ${filename}`);
      alert(`Laporan operasional PDF berhasil diunduh: ${filename}`);

    } catch (error) {
      console.error('❌ Error downloading operational PDF:', error);
      let errorMessage = 'Gagal mengunduh PDF. Silakan coba lagi.';

      if (error.response?.data) {
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
          } catch (parseError) {
            // Fallback
          }
        } else if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      alert(`❌ ${errorMessage}`);
    }
  };

  // Export orders data to CSV
  const exportOrdersData = async () => {
    try {
      setIsExportingOrders(true);

      // Build query params berdasarkan filter yang dipilih
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      if (selectedBranch) {
        params.append('branch_id', selectedBranch);
      }

      console.log('🔍 Exporting orders data with params:', params.toString());

      const response = await instance.get(`/orders-new-raw/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      const filename = `data_pesanan_${today}.csv`;
      link.setAttribute('download', filename);

      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('✅ Data pesanan berhasil diunduh!');
    } catch (error) {
      console.error('❌ Error exporting orders data:', error);

      let errorMessage = 'Gagal mengunduh data pesanan';

      if (error.response && error.response.data) {
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // Fallback
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setIsExportingOrders(false);
    }
  };

  const getSelectedBranchName = () => {
    if (!selectedBranch) return 'Semua Cabang';
    const branch = branches.find(b => b.id === selectedBranch);
    return branch ? branch.name : 'Semua Cabang';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Laporan Operasional"
        description="Analisa layanan dan performa operasional"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
        hideLogout={true}
        hideUserMenu={true}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Filter Button */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-montserrat text-gray-700">Filter</span>
              </button>

              {/* Current Filter Info */}
              <div className="text-sm text-gray-600 font-montserrat">
                {getSelectedBranchName()} • {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </div>
            </div>

            {/* Export Button & Info */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {isNotaFree ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg w-full">
                  <Info className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-800 font-montserrat font-medium">
                      Ingin download laporan?
                    </p>
                    <p className="text-xs text-orange-600 font-montserrat">
                      Upgrade ke paket berbayar untuk mengakses fitur download laporan.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/billing-active-tenant-payment')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-montserrat font-semibold whitespace-nowrap"
                  >
                    Lihat Paket
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={exportToPDF}
                    disabled={loading || !reportData}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-montserrat font-semibold">Download Laporan PDF</span>
                  </button>

                  <button
                    onClick={exportOrdersData}
                    disabled={isExportingOrders || loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm font-montserrat font-semibold">
                      {isExportingOrders ? 'Mengunduh...' : 'Download Data Pesanan'}
                    </span>
                  </button>
                </>
              )}

              {/* Info Button - Hidden for NotaFree */}
              {!isNotaFree && (
                <button
                  onClick={() => setShowExplanationModal(true)}
                  className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                  title="Informasi Laporan Operasional"
                >
                  <Info className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                </button>
              )}

              {!isNotaFree && (
                <div className="text-xs text-gray-500 font-montserrat">
                  {loading ? 'Memuat data...' : reportData ? 'Siap download' : 'Belum ada data'}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 font-montserrat text-sm">{error}</p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Omzet / Pendapatan</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-emerald-600 font-montserrat">
                          {formatCurrency(reportData.summary?.total_revenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Total omzet periode ini
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Total Order</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-indigo-600 font-montserrat">
                          {formatNumber(reportData.summary?.total_orders || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Total order periode ini
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Total Layanan</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-blue-600 font-montserrat">
                          {formatNumber(reportData.summary?.total_services || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Layanan tersedia
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Total Customer</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-green-600 font-montserrat">
                          {formatNumber(reportData.summary?.total_customers || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Total customer bertransaksi
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Customer Baru</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-indigo-600 font-montserrat">
                          {formatNumber(reportData.summary?.total_new_customers || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Customer baru
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Total Diskon</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-yellow-600 font-montserrat">
                          {formatCurrency(reportData.summary?.total_discounts || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Diskon diberikan
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Item Dirawat</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-purple-600 font-montserrat">
                          {formatNumber(reportData.summary?.total_items || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Item dirawat
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Membership Aktif</p>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-orange-600 font-montserrat">
                          {formatNumber(reportData.summary?.total_memberships || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Member aktif
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </div>

            </div>

            {/* Referral Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Total Referral Orders</p>
                    {referralLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-blue-600 font-montserrat">
                          {formatNumber(referralData?.summary?.total_referral_orders || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Order dengan referral
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Total Referrers</p>
                    {referralLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-green-600 font-montserrat">
                          {formatNumber(referralData?.summary?.total_referrers || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Customer referrer
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Conversion Rate</p>
                    {referralLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-purple-600 font-montserrat">
                          {referralData?.summary?.conversion_rate?.toFixed(1) || 0}%
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          % dari total order
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-montserrat">Revenue dari Referral</p>
                    {referralLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-orange-600 font-montserrat">
                          {formatCurrency(referralData?.summary?.total_revenue_from_referral || 0)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Total revenue
                        </p>
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Laporan Referral Button */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={() => setShowReferralModal(true)}
                className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors font-montserrat py-2"
              >
                <span>Detail Laporan Referral</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Point Summary Cards - Only show if points enabled */}
            {pointsEnabled && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-montserrat">Total Poin Diberikan</p>
                        {pointLoading ? (
                          <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-yellow-600 font-montserrat">
                              {formatNumber(pointData?.summary?.total_points_given || 0)}
                            </p>
                            <p className="text-xs text-gray-500 font-montserrat">
                              Poin diberikan
                            </p>
                          </>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-montserrat">Total Poin Ditebus</p>
                        {pointLoading ? (
                          <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-orange-600 font-montserrat">
                              {formatNumber(pointData?.summary?.total_points_redeemed || 0)}
                            </p>
                            <p className="text-xs text-gray-500 font-montserrat">
                              Poin ditebus
                            </p>
                          </>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Gift className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-montserrat">Customer Aktif Poin</p>
                        {pointLoading ? (
                          <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-green-600 font-montserrat">
                              {formatNumber(pointData?.summary?.total_active_customers || 0)}
                            </p>
                            <p className="text-xs text-gray-500 font-montserrat">
                              Customer aktif
                            </p>
                          </>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-montserrat">Conversion Rate</p>
                        {pointLoading ? (
                          <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-purple-600 font-montserrat">
                              {pointData?.summary?.conversion_rate?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-gray-500 font-montserrat">
                              % poin ditebus
                            </p>
                          </>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detail Laporan Poin Button */}
                <div className="mb-6 flex justify-center">
                  <button
                    onClick={() => setShowPointModal(true)}
                    className="flex items-center justify-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold transition-colors font-montserrat py-2"
                  >
                    <span>Detail Laporan Poin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Services Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    LAYANAN TERBANYAK
                  </h3>
                </div>
                {loading ? (
                  <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.top_services?.slice(0, 6).map(service => ({
                        name: service.treatment_name,
                        orders: service.total_orders
                      })) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis fontSize={10} />
                        <Tooltip
                          formatter={(value) => [formatNumber(value), 'Jumlah Order']}
                          labelStyle={{ fontSize: '12px' }}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top Customers Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    CUSTOMER TERBANYAK
                  </h3>
                </div>
                {loading ? (
                  <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.top_customers?.map(customer => ({
                        name: customer.customer_name,
                        orders: customer.total_orders
                      })) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis fontSize={10} />
                        <Tooltip
                          formatter={(value) => [formatNumber(value), 'Total Order']}
                          labelStyle={{ fontSize: '12px' }}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Discount Analysis */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    ANALISA DISKON
                  </h3>
                </div>
                {loading ? (
                  <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          dataKey="usage_count"
                          data={reportData.discount_analysis?.map(discount => ({
                            name: discount.discount_name,
                            usage_count: discount.usage_count
                          })) || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelStyle={{ fontSize: '10px' }}
                        >
                          {(reportData.discount_analysis || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [formatNumber(value), 'Penggunaan']}
                          labelStyle={{ fontSize: '12px' }}
                          contentStyle={{ fontSize: '12px' }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Item Analysis */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    ITEM TERBANYAK
                  </h3>
                </div>
                {loading ? (
                  <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.item_analysis?.slice(0, 6).map(item => ({
                        name: item.item_name,
                        treatments: item.total_treatments
                      })) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis fontSize={10} />
                        <Tooltip
                          formatter={(value) => [formatNumber(value), 'Treatment']}
                          labelStyle={{ fontSize: '12px' }}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Bar dataKey="treatments" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Tables Section */}
            <div className="space-y-6">
              {/* Top Services Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    TOP LAYANAN
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Layanan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Jumlah Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Total Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Rata-rata Harga
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        (showAllServices ? reportData.top_services : reportData.top_services?.slice(0, 10) || []).map((service, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 font-montserrat">
                              {service.treatment_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {formatNumber(service.total_orders)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {formatCurrency(service.total_revenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {formatCurrency(service.avg_price)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {!loading && (reportData.top_services?.length || 0) > 10 && (
                  <div className="px-4 py-3 border-t border-gray-100 text-center">
                    <button
                      onClick={() => setShowAllServices(v => !v)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium font-montserrat"
                    >
                      {showAllServices
                        ? `Sembunyikan (tampilkan 10 teratas)`
                        : `Tampilkan semua (${reportData.top_services.length} layanan)`}
                    </button>
                  </div>
                )}
              </div>

              {/* Top Customers Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                    TOP CUSTOMER
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          No. Telepon
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Total Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Total Spent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                          Last Order
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        (reportData.top_customers || []).map((customer, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 font-montserrat">
                              {customer.customer_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {customer.phone}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {formatNumber(customer.total_orders)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {formatCurrency(customer.total_spent)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-montserrat">
                              {new Date(customer.last_order_date).toLocaleDateString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header - Fixed */}
            <div className="bg-white px-6 py-3 flex-shrink-0 border-b-2 border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 font-montserrat">
                  Filter Laporan
                </h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="px-6 py-4 flex-1 overflow-y-auto" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div className="space-y-4">

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Cabang ({branches.length} tersedia)
                  </label>
                  <select
                    value={selectedBranch || ''}
                    onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={branchesLoading || branches.length === 0}
                  >
                    <option value="">Semua Cabang</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {branchesLoading && (
                    <p className="text-xs text-blue-500 mt-1">Memuat daftar cabang...</p>
                  )}
                  {!branchesLoading && branches.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Tidak ada cabang tersedia</p>
                  )}
                </div>

                {/* Month Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-montserrat text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-montserrat text-sm font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Memuat...' : 'Terapkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <OperationalExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />

      {/* Referral Report Modal */}
      <ReferralReportModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        data={referralData}
        loading={referralLoading}
      />

      {/* Point Report Modal */}
      <PointReportModal
        isOpen={showPointModal}
        onClose={() => setShowPointModal(false)}
        data={pointData}
        loading={pointLoading}
      />
    </div>
  );
};

export default OperationalReport;
