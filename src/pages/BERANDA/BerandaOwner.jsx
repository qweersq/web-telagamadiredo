import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import FinanceAddExpenseModal from '../FINANCE/components/FinanceAddExpenseModal';
import HelpTooltip from '../../components/WhatsAppTemplate/HelpTooltip';
import instance from '../../config/api';
import { getFinancialReport, getBranches } from '../FINANCE/api/financeApi';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, ShoppingBag, X, Info } from 'lucide-react';
import { getUserProfile, getTenantId, getBranchId, switchBranch, invalidateUserProfileCache } from '../../utils/userProfileHelper';
import { checkVersionFromProfile } from '../../utils/versionChecker';

const BerandaOwner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // State untuk Branch Selection Modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // State untuk NotaFree dan Pro Feature Modal
  const [isNotaFree, setIsNotaFree] = useState(false);
  const [showProFeatureModal, setShowProFeatureModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');

  // State untuk Points System Status
  const [pointsEnabled, setPointsEnabled] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        // Menggunakan userProfileHelper untuk mendapatkan data
        const profileData = await getUserProfile();
        if (profileData) {
          setUserData({
            ...profileData.user,
            branch: profileData.branch
          });

          // Check version update dari profile data
          try {
            const versionResult = checkVersionFromProfile(profileData);
            if (versionResult && versionResult.hasUpdate) {
              console.log('🌐 [BerandaOwner] Version update found:', versionResult.latestVersion);
              sessionStorage.setItem('app_version_update', JSON.stringify(versionResult));
              window.dispatchEvent(new CustomEvent('appVersionUpdate', { detail: versionResult }));
            } else {
              console.log('🌐 [BerandaOwner] Version is up to date');
            }
          } catch (versionError) {
            console.error('🌐 [BerandaOwner] Error checking version:', versionError);
          }
          // Fetch financial data menggunakan helper functions
          const tenantId = await getTenantId();
          const branchId = await getBranchId();

          if (tenantId) {
            fetchFinancialData(tenantId, branchId);
            fetchPointsStatus();
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle state dari redirect (ketika user NotaFree akses langsung URL PRO feature)
  useEffect(() => {
    if (location.state?.showProFeatureModal && location.state?.proFeatureName) {
      setShowProFeatureModal(true);
      setProFeatureName(location.state.proFeatureName);
      // Clear state dari location untuk avoid modal muncul lagi saat refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchFinancialData = async (tenantId, branchId) => {
    try {
      setFinancialLoading(true);
      const currentDate = new Date();
      const params = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        tenant_id: tenantId,
        branch_id: branchId // Gunakan branch_id dari userProfileHelper
      };

      const data = await getFinancialReport(params);
      setFinancialData(data.data || data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setFinancialData(null);
    } finally {
      setFinancialLoading(false);
    }
  };

  const fetchPointsStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await instance.get('/points-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        setPointsEnabled(apiData.enabled !== undefined ? Boolean(apiData.enabled) : false);
      }
    } catch (error) {
      console.error('Error fetching points status:', error);
      setPointsEnabled(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('workStartTime');
    sessionStorage.removeItem('fromPresent');
    sessionStorage.removeItem('fromIzin');
    navigate('/');
  };

  const handleExpenseSubmit = async (expenseData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await instance.post('/expenses', expenseData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Refresh financial data setelah expense berhasil ditambahkan
        const tenantId = await getTenantId();
        const branchId = await getBranchId();
        if (tenantId) {
          fetchFinancialData(tenantId, branchId);
        }

        // Tutup modal
        setShowExpenseModal(false);

        // Show success message
        alert('Pengeluaran berhasil ditambahkan!');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Gagal menambahkan pengeluaran. Silakan coba lagi.');
    }
  };

  // Function untuk handle button Pesanan
  const handleOrdersClick = async () => {
    try {
      setBranchLoading(true);
      const tenantId = await getTenantId();

      if (!tenantId) {
        alert('Tenant ID tidak ditemukan');
        return;
      }

      // Fetch branches berdasarkan tenant ID
      const branchesData = await getBranches(tenantId);

      setBranches(branchesData || []);
      setShowBranchModal(true);
    } catch (error) {
      alert('Gagal memuat data outlet. Silakan coba lagi.');
    } finally {
      setBranchLoading(false);
    }
  };

  // Function untuk handle branch selection
  const handleBranchSelect = async (branch) => {
    try {

      // Update user's branch_id via API
      const updatedUserData = await switchBranch(branch.id);

      // ✅ Invalidate profile cache agar data fresh
      // invalidateUserProfileCache();

      // Update userData state
      setUserData(prev => ({
        ...prev,
        branch_id: updatedUserData.branch_id,
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address
        }
      }));

      // Close modal
      setShowBranchModal(false);

      // Navigate to OrderDashboard dengan state from BerandaOwner
      navigate('/orders', { state: { from: '/berandaowner' } });

    } catch (error) {
      alert('Gagal mengubah outlet. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const menuCategories = [
    {
      title: 'BISNIS',
      items: [
        {
          title: 'Profile Bisnis',
          description: 'Kelola profile bisnis',
          icon: '🏛️',
          path: '/tenant-management',
          color: 'bg-telaga-600'
        },
        // {
        //   title: 'Billing & Payment',
        //   description: 'Kelola pembayaran & subscription',
        //   icon: '💳',
        //   path: '/billing-active-tenant-payment',
        //   color: 'bg-telaga-600'
        // },
        {
          title: 'Outlet',
          description: 'Kelola outlet bisnis',
          icon: '🏢',
          path: '/branch-management',
          color: 'bg-senja-500'
        },
        {
          title: 'Karyawan',
          description: 'Kelola informasi karyawan',
          icon: '👤',
          path: '/analisis-karyawan',
          color: 'bg-senja-500'
        },
        {
          title: 'Absensi Karyawan',
          description: 'Kelola kehadiran karyawan',
          icon: '⏰',
          path: '/absensi-karyawan',
          color: 'bg-telaga-700'
        },
        {
          title: 'Jadwal Kerja',
          description: 'Atur jam masuk & pulang per hari',
          icon: '🗓️',
          path: '/jadwal-kerja',
          color: 'bg-telaga-600'
        },
        {
          title: 'Shift',
          description: 'History shift',
          icon: '🔄',
          path: '/shift-management',
          color: 'bg-senja-600'
        },
        // {
        //   title: 'Beli AI Credit',
        //   description: 'Beli paket credit untuk AI deteksi',
        //   icon: '🤖',
        //   path: '/ai-credit',
        //   color: 'bg-telaga-700'
        // }
      ]
    },
    {
      title: 'PRODUK',
      items: [
        {
          title: 'Stok Barang',
          description: 'Pantau sisa stok & penjualan',
          icon: '📦',
          path: '/stok-barang',
          color: 'bg-telaga-600'
        },
        {
          title: 'Paket & Produk',
          description: 'Kelola paket wisata & produk jualan',
          icon: '🎟️',
          path: '/treatment-management',
          color: 'bg-telaga-600'
        },
        {
          title: 'Kategori Produk',
          description: 'Kelompokkan produk & paket',
          icon: '🗂️',
          path: '/product-category-management',
          color: 'bg-telaga-700'
        },
        // {
        //   title: 'Item',
        //   description: 'Kelola item',
        //   icon: '📦',
        //   path: '/item-management',
        //   color: 'bg-senja-600'
        // },
        {
          title: 'Promo',
          description: 'Kelola promo',
          icon: '🏷️',
          path: '/discount-management',
          color: 'bg-senja-500'
        },
        {
          title: 'Membership',
          description: 'Program member',
          icon: '👑',
          path: '/membership-management',
          color: 'bg-telaga-500'
        },
        {
          title: 'Customer',
          description: 'Data pelanggan',
          icon: '👥',
          path: '/customer-management',
          color: 'bg-telaga-700'
        },
        {
          title: 'FollowUp Manual',
          description: 'Customer lama',
          icon: '📞',
          path: '/followup-management',
          color: 'bg-senja-700',
          isProFeature: true
        },
        {
          title: 'Template FU',
          description: 'Template WhatsApp',
          icon: '📝',
          path: '/followup/templates',
          color: 'bg-telaga-600',
          isProFeature: true
        },
        // {
        //   title: 'Campaign Dashboard',
        //   description: 'Broadcast Campaign',
        //   icon: '📢',
        //   path: '/campaign-dashboard',
        //   color: 'bg-indigo-500'
        // }
      ]
    },
    {
      title: 'KEUANGAN',
      items: [
        {
          title: 'Akun & Pembayaran',
          description: 'Kelola akun keuangan',
          icon: '💳',
          path: '/finance-accounts',
          color: 'bg-telaga-600'
        },
        {
          title: 'Kategori Transaksi',
          description: 'Kelola kategori',
          icon: '🏷️',
          path: '/finance-categories',
          color: 'bg-senja-500'
        },
        {
          title: 'Transaksi Keuangan',
          description: 'Kelola transaksi',
          icon: '💸',
          path: '/finance-transactions',
          color: 'bg-senja-500'
        },
        {
          title: 'Pengeluaran',
          description: 'Kelola pengeluaran',
          icon: '📉',
          path: '/expense-management',
          color: 'bg-senja-600'
        },
        {
          title: 'Pemasukan Lainnya',
          description: 'Catat pemasukan non-order',
          icon: '📈',
          path: '/income-management',
          color: 'bg-telaga-700'
        },
      ]
    },
    {
      title: 'SETUP',
      items: [
        {
          title: 'Printer',
          description: 'Koneksi Bluetooth',
          icon: '🖨️',
          path: '/printer-management',
          color: 'bg-telaga-700'
        },
        {
          title: 'Struk Invoice',
          description: 'Atur tampilan struk',
          icon: '📄',
          path: '/printer-settings',
          color: 'bg-telaga-600',
          isProFeature: true
        },
        {
          title: 'Invoice Digital',
          description: 'Atur logo & warna',
          icon: '💻',
          path: '/invoice-digital-settings',
          color: 'bg-senja-500',
          isProFeature: true
        },
        {
          title: 'Sistem Poin',
          description: 'Atur konversi poin',
          icon: '🪙',
          path: '/points-settings',
          color: 'bg-senja-600'
        },
        // {
        //   title: 'WhatsApp',
        //   description: 'Konfigurasi sistem',
        //   icon: '💬',
        //   path: '/wa-setup',
        //   color: 'bg-telaga-500'
        // }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-krem flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-600 mx-auto"></div>
          <p className="mt-4 text-telaga-900/60 font-montserrat">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat bg-krem">
      <HeaderBerandaOwner
        // title="BERANDA OWNER"
        showLogout={true}
        hideUserMenu={false}
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Ringkasan Transaksi */}
            <div className="bg-white rounded-2xl border border-telaga-100 p-4 mb-6 shadow-sm shadow-telaga-900/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-telaga-950 font-montserrat tracking-wider">
                      Transaksi Bulan Ini
                    </h2>
                    <p className="text-xs text-telaga-900/60 font-montserrat mt-1">
                      {userData?.branch?.name || 'Telaga Madiredo'}
                    </p>
                  </div>
                  <HelpTooltip
                    title="Ringkasan Transaksi Bulan Ini"
                    content="Menampilkan Data Pemasukan & Pengeluaran"
                    position="bottom"
                    size="sm"
                  />
                </div>
                <AnimatedButton
                  variant="senja"
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3 py-1.5 text-sm font-montserrat flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Pengeluaran
                </AnimatedButton>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Total Pemasukan */}
                <div className="bg-telaga-50/40 rounded-xl border border-telaga-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-telaga-900/60 font-montserrat">Pemasukan</p>
                      {financialLoading ? (
                        <div className="animate-pulse">
                          <div className="h-5 bg-telaga-100 rounded mb-1"></div>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-telaga-700 font-montserrat">
                          {formatCurrency(financialData?.summary?.total_income)}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-telaga-700" />
                    </div>
                  </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="bg-telaga-50/40 rounded-xl border border-telaga-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-telaga-900/60 font-montserrat">Pengeluaran</p>
                      {financialLoading ? (
                        <div className="animate-pulse">
                          <div className="h-5 bg-telaga-100 rounded mb-1"></div>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-senja-600 font-montserrat">
                          {formatCurrency(financialData?.summary?.total_expense)}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-senja-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-senja-600" />
                    </div>
                  </div>
                </div>

                {/* Saldo Bersih */}
                <div className="bg-telaga-50/40 rounded-xl border border-telaga-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-telaga-900/60 font-montserrat">Saldo Bersih</p>
                      {financialLoading ? (
                        <div className="animate-pulse">
                          <div className="h-5 bg-telaga-100 rounded mb-1"></div>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-telaga-800 font-montserrat">
                          {formatCurrency(financialData?.summary?.net_balance)}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-telaga-800" />
                    </div>
                  </div>
                </div>

                {/* Total Transaksi */}
                <div className="bg-telaga-50/40 rounded-xl border border-telaga-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-telaga-900/60 font-montserrat">Jumlah Transaksi</p>
                      {financialLoading ? (
                        <div className="animate-pulse">
                          <div className="h-5 bg-telaga-100 rounded mb-1"></div>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-senja-700 font-montserrat">
                          {financialData?.summary?.transaction_count || 0}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-senja-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-senja-700" />
                    </div>
                  </div>
                </div>
              </div>


              {/* Action Buttons - Grid Layout */}
              <div className="grid grid-cols-1 gap-3">
                {/* Button Pesanan - Full Width */}
                <AnimatedButton
                  variant="telaga"
                  onClick={handleOrdersClick}
                  disabled={branchLoading}
                  className="w-full px-4 py-3 text-sm font-montserrat flex items-center justify-center gap-2 rounded-xl"
                >
                  {branchLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Lihat Pesanan</span>
                    </>
                  )}
                </AnimatedButton>

                {/* Button Laporan - Side by Side */}
                <div className="grid grid-cols-3 gap-3">
                  <AnimatedButton
                    variant="telaga"
                    onClick={() => navigate('/laporan-keuangan')}
                    className="px-3 py-3 text-xs font-montserrat flex items-center justify-center rounded-xl min-h-[60px]"
                  >
                    <span className="text-center leading-tight">Laporan Keuangan</span>
                  </AnimatedButton>
                  <AnimatedButton
                    variant="senja"
                    onClick={() => navigate('/laporan-operasional')}
                    className="px-3 py-3 text-xs font-montserrat flex items-center justify-center rounded-xl min-h-[60px]"
                  >
                    <span className="text-center leading-tight">Laporan Operasional</span>
                  </AnimatedButton>
                  <AnimatedButton
                    variant="default"
                    onClick={() => navigate('/laporan-kinerja')}
                    className="px-3 py-3 text-xs font-montserrat flex items-center justify-center rounded-xl min-h-[60px] bg-white outline outline-2 outline-telaga-200 text-telaga-800 font-semibold hover:bg-telaga-50 transition-colors"
                  >
                    <span className="text-center leading-tight">Laporan Kinerja</span>
                  </AnimatedButton>
                </div>
              </div>
            </div>

            {/* Menu Categories */}
            {menuCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-8">
                {/* Category Header */}
                <div className="mb-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-telaga-600 to-senja-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-telaga-950 font-montserrat tracking-wider">
                      {category.title}
                    </h3>
                  </div>
                  <div className="absolute left-0 bottom-0 w-full h-px bg-gradient-to-r from-telaga-200 via-telaga-100 to-transparent"></div>
                </div>

                {/* Category Menu Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {category.items.map((item, itemIndex) => {
                    const handleMenuClick = () => {
                      if (item.isProFeature && isNotaFree) {
                        setProFeatureName(item.title);
                        setShowProFeatureModal(true);
                      } else {
                        navigate(item.path, { state: { from: 'berandaowner' } });
                      }
                    };

                    return (
                      <div
                        key={itemIndex}
                        onClick={handleMenuClick}
                        className="group relative bg-white rounded-xl p-3 shadow-sm hover:shadow-lg hover:shadow-telaga-900/5 transition-all duration-300 cursor-pointer border border-telaga-100 hover:border-telaga-300 hover:bg-gradient-to-br hover:from-white hover:to-telaga-50/40 transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-telaga-950 text-sm leading-tight group-hover:text-telaga-700 transition-colors">
                                {item.title}
                              </h3>
                              {item.isProFeature && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r from-senja-500 to-senja-600 shadow-sm">
                                  PRO
                                </span>
                              )}
                              {item.path === '/points-settings' && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${pointsEnabled
                                    ? 'bg-gradient-to-r from-telaga-600 to-telaga-700'
                                    : 'bg-gradient-to-r from-senja-400 to-senja-500'
                                  }`}>
                                  {pointsEnabled ? 'AKTIF' : 'NONAKTIF'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-telaga-900/60 leading-tight group-hover:text-telaga-900">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-telaga-300 group-hover:text-telaga-600 flex-shrink-0 ml-2 transition-all duration-300 group-hover:translate-x-0.5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Subtle bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-telaga-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Stats */}
            {/* <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Ringkasan Hari Ini
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Karyawan Aktif</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Order Hari Ini</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Pendapatan</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Item Selesai</div>
                </div>
              </div>
            </div> */}

          </div>
        </div>
      </main>

      {/* Expense Modal */}
      <FinanceAddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={handleExpenseSubmit}
        selectedDate={new Date()}
      />

      {/* Branch Selection Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-telaga-950/60 px-4 py-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-telaga-900/10 ring-2 ring-telaga-100 max-w-md w-full p-6 relative animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-telaga-950 font-montserrat">
                Pilih Lokasi
              </h3>
              <button
                onClick={() => setShowBranchModal(false)}
                className="p-2 rounded-full bg-telaga-50 hover:bg-telaga-100 text-telaga-700 transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-telaga-900/60 text-sm font-montserrat mb-4">
                Pilih lokasi untuk melihat data pesanan:
              </p>

              {/* Branch List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {branches.length === 0 ? (
                  <div className="text-center py-8 text-telaga-900/50">
                    <p className="font-montserrat">Tidak ada lokasi tersedia</p>
                  </div>
                ) : (
                  branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch)}
                      className="w-full p-3 text-left bg-telaga-50/60 hover:bg-telaga-50 rounded-xl border border-telaga-100 hover:border-telaga-300 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-telaga-950 font-montserrat group-hover:text-telaga-700">
                            {branch.name}
                          </h4>
                          {branch.address && (
                            <p className="text-sm text-telaga-900/60 font-montserrat mt-1">
                              {branch.address}
                            </p>
                          )}
                          {branch.city && (
                            <p className="text-xs text-telaga-900/60 font-montserrat">
                              {branch.city}
                            </p>
                          )}
                        </div>
                        <div className="text-telaga-400 group-hover:text-telaga-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-telaga-100">
              <AnimatedButton
                variant="default"
                onClick={() => setShowBranchModal(false)}
                className="px-4 py-2 text-sm font-montserrat rounded-xl bg-white outline outline-2 outline-telaga-100 text-telaga-800 font-semibold hover:bg-telaga-50 transition-colors"
              >
                Batal
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Pro Feature Modal */}
      {showProFeatureModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-telaga-950/60 px-4 py-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-telaga-900/10 ring-2 ring-telaga-100 max-w-md w-full p-6 relative animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-senja-500 to-senja-600 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-telaga-950 font-montserrat">
                    Fitur {proFeatureName}
                  </h3>
                  <p className="text-sm text-telaga-900/60 font-montserrat">
                    Hanya untuk paket berbayar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProFeatureModal(false)}
                className="p-2 rounded-full bg-telaga-50 hover:bg-telaga-100 text-telaga-700 transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="bg-senja-50 border border-senja-200 rounded-2xl p-4 mb-4">
                <p className="text-sm text-senja-800 font-montserrat font-medium mb-2">
                  Fitur ini memungkinkan Anda untuk:
                </p>
                <ul className="space-y-2 text-sm text-senja-700 font-montserrat">
                  {proFeatureName === 'Struk Invoice' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Menambahkan logo di nota fisik</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengustomisasi teks terima kasih sesuai brand</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Menampilkan akun sosial media (Instagram, Website)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Menambahkan teks promo di struk</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Barcode/QR Code untuk invoice digital</span>
                      </li>
                    </>
                  )}
                  {proFeatureName === 'Invoice Digital' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengatur tampilan invoice digital sesuai brand bisnis Anda</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Menambahkan logo pada invoice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengustomisasi warna dan desain invoice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengatur template invoice sesuai kebutuhan</span>
                      </li>
                    </>
                  )}
                  {proFeatureName === 'FollowUp Manual' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengelola follow-up pelanggan secara manual</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengirim pesan follow-up ke customer lama</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengatur jadwal dan catatan follow-up</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Meningkatkan retensi pelanggan</span>
                      </li>
                    </>
                  )}
                  {proFeatureName === 'Template FU' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Membuat template pesan WhatsApp untuk follow-up</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengelola berbagai template pesan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Menggunakan template untuk follow-up yang lebih efisien</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-500 mt-0.5">•</span>
                        <span>Mengatur template sesuai kebutuhan bisnis</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <p className="text-sm text-telaga-900/60 font-montserrat text-center">
                Upgrade ke paket berbayar untuk mengakses fitur ini dan fitur premium lainnya.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <AnimatedButton
                variant="default"
                onClick={() => setShowProFeatureModal(false)}
                className="flex-1 px-4 py-2 text-sm font-montserrat rounded-xl bg-white outline outline-2 outline-telaga-100 text-telaga-800 font-semibold hover:bg-telaga-50 transition-colors"
              >
                Tutup
              </AnimatedButton>
              <AnimatedButton
                variant="telaga"
                onClick={() => {
                  setShowProFeatureModal(false);
                  navigate('/billing-active-tenant-payment');
                }}
                className="flex-1 px-4 py-2 text-sm font-montserrat"
              >
                Lihat Paket
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BerandaOwner;
