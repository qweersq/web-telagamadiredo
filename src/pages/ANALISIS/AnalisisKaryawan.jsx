import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import EmployeeModal from '../../components/Modal/EmployeeModal';
import EmployeeExplanationModal from '../../components/Modal/EmployeeExplanationModal';
import { SubscriptionLimitsCard, SubscriptionValidationModal } from '../../components/SubscriptionLimits';
import SubscriptionValidationService from '../../services/subscriptionValidationService';
import instance from '../../config/api';
import { getUserProfile, invalidateUserProfileCache } from '../../utils/userProfileHelper';
import { getRoleLabel, getRoleBadgeClass } from '../../utils/roleValidator';
import { FaFilter, FaTimes, FaMapMarkerAlt, FaUserTag, FaSearch, FaUsers, FaPlus, FaPhone, FaChevronRight, FaCheck } from 'react-icons/fa';
import { Info } from 'lucide-react';

const AnalisisKaryawan = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterBranch, setFilterBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [filterRole, setFilterRole] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'inactive'
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // State untuk employee modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState('create');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // State untuk filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // State untuk explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  
  // ✅ Subscription validation states
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState('users');

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setLoadingBranches(true);
      
      // Load both data simultaneously
      await Promise.all([
        fetchEmployees(false, 1),
        fetchBranches()
      ]);
      
      // ✅ Load subscription data for validation
      try {
        const profile = await getUserProfile();
        if (profile && profile.subscription) {
          setSubscriptionData(profile.subscription);
        }
      } catch (error) {
      }
      
      // Ensure minimum loading time to prevent glitch
      setTimeout(() => {
        setLoading(false);
        setLoadingBranches(false);
      }, 500);
    };
    
    loadInitialData();
    
    // Check if user has seen explanation before
    const hasSeenExplanation = localStorage.getItem('employee_explanation_seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []); // Only run on mount

  // Refetch when filters change
  useEffect(() => {
    if (!loading) { // Only refetch if not in initial loading
      // Reset data immediately when filter changes
      setEmployees([]);
      setTotalEmployees(0);
      setHasMoreData(true);
      fetchEmployees(false, 1); // Always start from page 1 when filters change
    }
  }, [filterBranch, filterRole, activeTab]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showEmployeeModal) {
        setShowEmployeeModal(false);
      }
    };

    if (showEmployeeModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEmployeeModal]);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(async () => {
      if (!loading) { // Only search if not in initial loading
        setIsSearching(true);
        setCurrentPage(1); // Reset to first page when searching
        // Reset data when searching
        setEmployees([]);
        setTotalEmployees(0);
        setHasMoreData(true);
        await fetchEmployees(false, 1); // Always start from page 1 when searching
        setIsSearching(false);
      }
    }, 500); // 500ms delay

    setSearchTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  const fetchEmployees = async (isLoadMore = false, pageNumber = null) => {
    try {
      // Get user data for tenant_id
      const profile = await getUserProfile();
      const userData = {
        tenant_id: profile?.tenant?.id,
        branch_id: profile?.branch?.id
      };
      
      // Use provided page number or current page
      const pageToFetch = pageNumber !== null ? pageNumber : currentPage;
      
      // Build query parameters sesuai dokumentasi API
      const params = new URLSearchParams();
      params.append('page', pageToFetch.toString());
      params.append('pageSize', pageSize.toString());
      
      // Add tenant_id for data isolation
      if (userData.tenant_id) {
        params.append('tenant_id', userData.tenant_id);
      }
      
      // Filter berdasarkan cabang
      if (filterBranch) {
        params.append('branch_id', filterBranch);
      }
      
      // Filter berdasarkan pencarian
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Filter berdasarkan status berdasarkan activeTab
      params.append('status', activeTab);
      
      // Filter berdasarkan role (hanya employee, admin, dan supervisor; superadmin tidak termasuk)
      if (filterRole) {
        params.append('role', filterRole);
      }
      
      
      const { data } = await instance.get(`/employees?${params.toString()}`);
      
      if (data.success && data.data.employees) {
        if (isLoadMore) {
          // Append new data to existing data
          setEmployees(prev => [...prev, ...data.data.employees]);
        } else {
          // Replace existing data
          setEmployees(data.data.employees);
        }
        setTotalEmployees(data.data.pagination?.total || 0);
        
        // Check if there's more data based on pagination
        const pagination = data.data.pagination;
        
        if (pagination) {
          const hasMore = pagination.page < pagination.totalPages;
          setHasMoreData(hasMore);
        } else {
          // Fallback: check if we got less data than pageSize
          const hasMore = data.data.employees.length === pageSize;
          setHasMoreData(hasMore);
        }
      } else {
        if (!isLoadMore) {
          setEmployees([]);
          setTotalEmployees(0);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      if (!isLoadMore) {
        setEmployees([]);
        setTotalEmployees(0);
      }
      setHasMoreData(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setBranchesError(null);
      
      // Get user data for tenant_id
      const profile = await getUserProfile();
      const userData = {
        tenant_id: profile?.tenant?.id,
        branch_id: profile?.branch?.id
      };
      
      const params = {};
      if (userData.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }
      
      const { data } = await instance.get('/branches', { params });
      
      if (data.success && data.data) {
        setBranches(data.data);
      } else {
        setBranches([]);
        setBranchesError('Gagal memuat data cabang');
      }
    } catch (error) {
      setBranches([]);
      setBranchesError('Gagal memuat data cabang. Silakan coba lagi.');
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

  const handleEmployeeClick = (employee) => {
    navigate(`/analisis-karyawan/${employee.id}`);
  };

  const handleAddEmployee = () => {
    // Clear error message
    setErrorMessage(null);
    
    // ✅ Validate subscription limits before creating employee
    if (subscriptionData) {
      const validation = SubscriptionValidationService.validateUserCreation(subscriptionData);
      
      if (!validation.isValid) {
        setValidationType('users');
        setShowValidationModal(true);
        return;
      }
      
      // Show warning if approaching limit
      if (validation.type === 'warning') {
        setValidationType('users');
        setShowValidationModal(true);
        return;
      }
    }
    
    setEmployeeModalMode('create');
    setShowEmployeeModal(true);
  };

  const handleEmployeeModalSuccess = (newEmployee) => {
    // Clear error message on success
    setErrorMessage(null);
    
    // Refresh employee list after adding new employee
    setCurrentPage(1);
    setEmployees([]);
    setTotalEmployees(0);
    setHasMoreData(true);
    fetchEmployees(false, 1);
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
    
    // ✅ Reload subscription data after successful creation
    const reloadSubscriptionData = async () => {
      try {
        // Clear cache dulu agar fetch data terbaru dari API
        invalidateUserProfileCache();
        const profile = await getUserProfile();
        if (profile && profile.subscription) {
          setSubscriptionData(profile.subscription);
        }
      } catch (error) { 
        console.error('Error reloading subscription data:', error);
      }
    };
    reloadSubscriptionData();
  };

  const handleEmployeeModalError = (error) => {
    // Transform error message
    let message = error;
    if (error && error.toLowerCase().includes('email already registered')) {
      message = 'Email sudah pernah terdaftar di sistem';
    }
    setErrorMessage(message);
    // Auto hide error after 5 seconds
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  // ✅ Validation modal handlers
  const handleValidationConfirm = () => {
    setShowValidationModal(false);
    // Proceed with employee creation
    setEmployeeModalMode('create');
    setShowEmployeeModal(true);
  };

  const handleValidationUpgrade = () => {
    setShowValidationModal(false);
    // Navigate to upgrade page or show upgrade modal
    // You can implement upgrade navigation here
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    
    setLoadingMore(true);
    
    // Calculate next page number
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // Fetch next page data with the correct page number
    await fetchEmployees(true, nextPage);
    
    setLoadingMore(false);
  };



  // Filtering is now handled by the API, so we just use the employees data directly
  const filteredEmployees = employees;

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner 
          title="Data Karyawan"
          description="Kelola data dan analisis kinerja karyawan"
          hideLogout={true}
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
        />
        
        {/* Main Content dengan overflow scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
            <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
              
              {/* Buttons Skeleton */}
              <div className="mb-4 flex gap-3 animate-pulse">
                <div className="h-10 bg-telaga-100 rounded-lg w-20"></div>
                <div className="h-10 bg-telaga-100 rounded-lg w-32"></div>
              </div>
              
              {/* Filter and Search Skeleton */}
              <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 shadow-sm animate-pulse">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-telaga-100 rounded w-24 mb-2"></div>
                    <div className="h-10 bg-telaga-100 rounded-xl"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="h-4 bg-telaga-100 rounded w-20 mb-2"></div>
                      <div className="h-10 bg-telaga-100 rounded-xl"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-telaga-100 rounded w-16 mb-2"></div>
                      <div className="h-10 bg-telaga-100 rounded-xl"></div>
                    </div>
                  </div>
              </div>
            </div>

              {/* Status Tabs Skeleton */}
              <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 shadow-sm animate-pulse">
                <div className="flex space-x-1 bg-telaga-50 p-1 rounded-lg">
                  <div className="flex-1 py-2 px-4 rounded-md bg-telaga-100"></div>
                  <div className="flex-1 py-2 px-4 rounded-md bg-telaga-100"></div>
                </div>
              </div>

              {/* Employee List Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm animate-pulse">
                <div className="p-4 md:p-6 border-b border-telaga-100">
                  <div className="h-6 bg-telaga-100 rounded w-32"></div>
                </div>
                <div className="divide-y divide-telaga-100">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="p-4 md:p-6">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-telaga-100 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-telaga-100 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-telaga-100 rounded w-48 mb-1"></div>
                          <div className="h-3 bg-telaga-100 rounded w-24"></div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex flex-col sm:flex-row gap-1">
                            <div className="h-6 bg-telaga-100 rounded-full w-16"></div>
                            <div className="h-6 bg-telaga-100 rounded-full w-12"></div>
                          </div>
                          <div className="w-4 h-4 bg-telaga-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        </main>
      </div>
    );
  }



  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat bg-krem">
      <HeaderBerandaOwner
        title="Manajemen Karyawan"
        description="Kelola data & analisis kinerja karyawan Agrowisata Telaga"
        hideLogout={true}
        hideUserMenu={true}
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />

      <main className="flex-1 overflow-y-auto mt-[40px]">
        <div className="mx-auto px-4 md:px-10 pt-6 pb-10">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-6 space-y-4">

            {subscriptionData && (
              <SubscriptionLimitsCard
                subscriptionData={subscriptionData}
                onUpgrade={handleValidationUpgrade}
                type="users"
              />
            )}

            {showSuccessMessage && (
              <div className="flex items-center gap-3 rounded-xl border border-telaga-200 bg-telaga-50 px-4 py-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-telaga-100 text-telaga-700">
                  <FaCheck className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-montserrat text-sm font-semibold text-telaga-900">Berhasil!</p>
                  <p className="font-montserrat text-xs text-telaga-900/60">Karyawan baru berhasil ditambahkan</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <FaTimes className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-montserrat text-sm font-semibold text-red-800">Gagal menambahkan karyawan</p>
                  <p className="font-montserrat text-xs text-red-600">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 transition-colors hover:text-red-600"
                >
                  <FaTimes className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Ringkasan */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-telaga-100 bg-white px-4 py-3 shadow-sm">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-telaga-50 text-telaga-700">
                  <FaUsers className="h-4 w-4" />
                </div>
                <p className="font-montserrat text-xl font-bold leading-none text-telaga-950">{totalEmployees}</p>
                <p className="mt-1 font-montserrat text-[11px] text-telaga-900/50">Total karyawan</p>
              </div>
              <div className="rounded-2xl border border-telaga-100 bg-white px-4 py-3 shadow-sm">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-telaga-50 text-telaga-700">
                  <FaCheck className="h-4 w-4" />
                </div>
                <p className="font-montserrat text-xl font-bold leading-none text-telaga-950">{filteredEmployees.length}</p>
                <p className="mt-1 font-montserrat text-[11px] text-telaga-900/50">Ditampilkan</p>
              </div>
              <div className="rounded-2xl border border-telaga-100 bg-white px-4 py-3 shadow-sm">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-senja-50 text-senja-700">
                  <FaFilter className="h-4 w-4" />
                </div>
                <p className="font-montserrat text-xl font-bold leading-none text-telaga-950">
                  {[filterBranch, filterRole, searchTerm].filter(Boolean).length}
                </p>
                <p className="mt-1 font-montserrat text-[11px] text-telaga-900/50">Filter aktif</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-telaga-900/35" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama atau email karyawan..."
                    className="w-full rounded-xl border border-telaga-100 bg-krem py-2.5 pl-10 pr-9 font-montserrat text-sm text-telaga-950 placeholder-telaga-900/35 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-telaga-900/40 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-telaga-200 bg-white px-4 py-2.5 font-montserrat text-sm font-semibold text-telaga-800 transition-colors hover:bg-telaga-50 sm:flex-none"
                  >
                    <FaFilter className="h-3.5 w-3.5" />
                    Filter
                    {(filterBranch || filterRole) && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-telaga-700 px-1 font-montserrat text-[10px] font-bold text-white">
                        {[filterBranch, filterRole].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleAddEmployee}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-telaga-700 px-4 py-2.5 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-telaga-800 sm:flex-none"
                  >
                    <FaPlus className="h-3.5 w-3.5" />
                    Tambah
                  </button>
                  <button
                    onClick={() => setShowExplanationModal(true)}
                    title="Informasi manajemen karyawan"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-telaga-100 bg-telaga-50 text-telaga-700 transition-colors hover:bg-telaga-100"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filter aktif */}
              {(filterBranch || filterRole) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-telaga-50 pt-3">
                  {filterBranch && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-telaga-200 bg-telaga-50 py-1 pl-2.5 pr-1.5">
                      <FaMapMarkerAlt className="h-2.5 w-2.5 text-telaga-600" />
                      <span className="font-montserrat text-[11px] font-semibold text-telaga-800">
                        {branches.find(branch => branch.id === parseInt(filterBranch))?.name || 'Cabang'}
                      </span>
                      <button
                        onClick={() => setFilterBranch('')}
                        className="rounded-full p-0.5 text-telaga-600 transition-colors hover:bg-telaga-100"
                      >
                        <FaTimes className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {filterRole && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-senja-200 bg-senja-50 py-1 pl-2.5 pr-1.5">
                      <FaUserTag className="h-2.5 w-2.5 text-senja-600" />
                      <span className="font-montserrat text-[11px] font-semibold text-senja-800">
                        {getRoleLabel(filterRole)}
                      </span>
                      <button
                        onClick={() => setFilterRole('')}
                        className="rounded-full p-0.5 text-senja-600 transition-colors hover:bg-senja-100"
                      >
                        <FaTimes className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFilterBranch('');
                      setFilterRole('');
                      setSearchTerm('');
                    }}
                    className="ml-auto inline-flex items-center gap-1 font-montserrat text-[11px] font-semibold text-telaga-900/50 transition-colors hover:text-red-600"
                  >
                    <FaTimes className="h-2.5 w-2.5" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Tabs status */}
            <div className="inline-flex w-full rounded-xl border border-telaga-100 bg-white p-1 shadow-sm sm:w-auto">
              {[
                { key: 'active', label: 'Aktif', dot: 'bg-telaga-600' },
                { key: 'inactive', label: 'Tidak Aktif', dot: 'bg-senja-500' },
              ].map(({ key, label, dot }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2 font-montserrat text-sm font-semibold transition-colors sm:flex-none ${
                    activeTab === key
                      ? 'bg-telaga-700 text-white'
                      : 'text-telaga-900/60 hover:bg-telaga-50'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${activeTab === key ? 'bg-telaga-300' : dot}`} />
                  {label}
                </button>
              ))}
            </div>

            {/* Daftar karyawan */}
            <div className="overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-telaga-50 px-4 py-3.5 sm:px-5">
                <div>
                  <h2 className="font-montserrat text-sm font-bold text-telaga-950">
                    Daftar Karyawan {activeTab === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </h2>
                  <p className="mt-0.5 font-montserrat text-[11px] text-telaga-900/50">
                    Menampilkan {filteredEmployees.length} dari {totalEmployees} karyawan
                  </p>
                </div>
                <span className="rounded-full bg-telaga-50 px-2.5 py-1 font-montserrat text-[11px] font-semibold text-telaga-700">
                  {filteredEmployees.length}
                </span>
              </div>

              <div className="divide-y divide-telaga-50">
                {filteredEmployees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => handleEmployeeClick(employee)}
                    className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-telaga-50/60 sm:px-5"
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-telaga-600 to-telaga-800 font-montserrat text-sm font-bold text-white">
                      {employee.name?.charAt(0)?.toUpperCase() || 'K'}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-montserrat text-sm font-bold text-telaga-950">{employee.name}</p>
                      <p className="truncate font-montserrat text-xs text-telaga-900/50">{employee.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1 font-montserrat text-[11px] text-telaga-900/55">
                          <FaMapMarkerAlt className="h-2.5 w-2.5 text-telaga-400" />
                          {employee.branch?.name || 'Cabang tidak diketahui'}
                        </span>
                        {employee.phone && (
                          <span className="inline-flex items-center gap-1 font-montserrat text-[11px] text-telaga-900/55">
                            <FaPhone className="h-2.5 w-2.5 text-telaga-400" />
                            {employee.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 font-montserrat text-[10px] font-semibold ${getRoleBadgeClass(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-montserrat text-[10px] font-semibold ${
                        employee.status === 'active'
                          ? 'bg-telaga-50 text-telaga-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${employee.status === 'active' ? 'bg-telaga-500' : 'bg-red-400'}`} />
                        {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <FaChevronRight className="mt-3 h-3 w-3 flex-shrink-0 text-telaga-900/25 transition-colors group-hover:text-telaga-600" />
                  </button>
                ))}
              </div>

              {filteredEmployees.length === 0 && !loading && (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-telaga-50 text-telaga-500">
                    <FaUsers className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-montserrat text-base font-bold text-telaga-950">
                    {searchTerm || filterBranch || filterRole
                      ? 'Tidak ada karyawan ditemukan'
                      : 'Belum ada data karyawan'}
                  </h3>
                  <p className="font-montserrat text-xs text-telaga-900/50">
                    {searchTerm || filterBranch || filterRole
                      ? `Tidak ada karyawan ${activeTab === 'active' ? 'aktif' : 'tidak aktif'} yang sesuai filter`
                      : `Belum ada data karyawan ${activeTab === 'active' ? 'aktif' : 'tidak aktif'}`}
                  </p>
                </div>
              )}

              {filteredEmployees.length > 0 && hasMoreData && (
                <div className="border-t border-telaga-50 p-3.5">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-montserrat text-sm font-semibold transition-colors ${
                      loadingMore
                        ? 'cursor-not-allowed bg-telaga-50 text-telaga-900/35'
                        : 'border border-telaga-200 bg-white text-telaga-800 hover:bg-telaga-50'
                    }`}
                  >
                    {loadingMore ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-telaga-400" />
                        Memuat...
                      </>
                    ) : (
                      'Muat Lebih Banyak'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>


      {/* Employee Modal */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setErrorMessage(null);
        }}
        employee={null}
        onSuccess={handleEmployeeModalSuccess}
        onError={handleEmployeeModalError}
        mode={employeeModalMode}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-telaga-50 px-5 py-4">
              <div>
                <h3 className="font-montserrat text-base font-bold text-telaga-950">Filter Data Karyawan</h3>
                <p className="mt-0.5 font-montserrat text-xs text-telaga-900/50">
                  Persempit daftar berdasarkan cabang atau role
                </p>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-telaga-50 text-telaga-700 transition-colors hover:bg-telaga-100"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="mb-1.5 block font-montserrat text-xs font-semibold text-telaga-900/70">
                  Cari Karyawan
                </label>
                <div className="relative">
                  <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-telaga-900/35" />
                  <input
                    type="text"
                    placeholder="Nama atau email karyawan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-telaga-100 bg-krem py-2.5 pl-9 pr-9 font-montserrat text-sm text-telaga-950 placeholder-telaga-900/35 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  />
                  {isSearching && (
                    <span className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-b-2 border-telaga-400" />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-montserrat text-xs font-semibold text-telaga-900/70">
                  Cabang
                </label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  disabled={loadingBranches}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-3.5 py-2.5 font-montserrat text-sm text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25 disabled:cursor-not-allowed disabled:bg-telaga-50/60"
                >
                  <option value="">{loadingBranches ? 'Memuat cabang...' : 'Semua cabang'}</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {branchesError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="font-montserrat text-xs text-red-600">{branchesError}</p>
                    <button
                      onClick={fetchBranches}
                      className="mt-1 font-montserrat text-xs font-semibold text-telaga-700 underline hover:text-telaga-900"
                    >
                      Coba lagi
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block font-montserrat text-xs font-semibold text-telaga-900/70">
                  Role
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '', label: 'Semua' },
                    { value: 'employee', label: 'Karyawan' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'supervisor', label: 'Supervisor' },
                  ].map(option => (
                    <button
                      key={option.value || 'all'}
                      onClick={() => setFilterRole(option.value)}
                      className={`rounded-full border px-3.5 py-1.5 font-montserrat text-xs font-semibold transition-colors ${
                        filterRole === option.value
                          ? 'border-telaga-700 bg-telaga-700 text-white'
                          : 'border-telaga-100 bg-white text-telaga-900/60 hover:bg-telaga-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-2 border-t border-telaga-100 bg-white px-5 py-4">
              <button
                onClick={() => {
                  setFilterBranch('');
                  setFilterRole('');
                  setSearchTerm('');
                }}
                className="flex-1 rounded-xl border border-telaga-200 bg-white py-2.5 font-montserrat text-sm font-semibold text-telaga-800 transition-colors hover:bg-telaga-50"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 rounded-xl bg-telaga-700 py-2.5 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-telaga-800"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Employee Explanation Modal */}
      <EmployeeExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />

      {/* ✅ Subscription Validation Modal */}
      <SubscriptionValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        subscriptionData={subscriptionData}
        validationType={validationType}
        onConfirm={handleValidationConfirm}
        onUpgrade={handleValidationUpgrade}
      />
    </div>
  );
};

export default AnalisisKaryawan;
