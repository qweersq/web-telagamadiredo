import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, User, Phone, Mail, MapPin, Calendar, Briefcase, Heart, Crown, X, Eye, Download, Upload, Filter } from 'lucide-react';
import { getMembershipBadgeColor, getMembershipDiscountDisplay, formatPhoneNumber, getPhoneDisplayData } from '../../utils/labelFormatter';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import AddMembershipModal from '../../components/Modal/AddMembershipModal';
import CustomerExplanationModal from '../../components/Modal/CustomerExplanationModal';
import CustomerDetailModal from '../../components/Modal/CustomerDetailModal';
import CancelMembershipModal from '../../components/Modal/CancelMembershipModal';
import CustomerImportModal from '../../components/Modal/CustomerImportModal';
import CustomerFilterBottomSheet from '../../components/Modal/CustomerFilterBottomSheet';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { validatePhoneNumber, getPhonePlaceholder } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';

// Schema validation untuk customer form
const customerSchema = z.object({
  name: z.string()
    .min(1, 'Nama wajib diisi')
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  phone: z.string()
    .min(1, 'Nomor telepon wajib diisi')
    .max(20, 'Nomor telepon terlalu panjang'),
  address: z.string()
    .max(500, 'Alamat maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  gmaps: z.string()
    .url('Format Google Maps link tidak valid')
    .optional()
    .or(z.literal('')),
  branch_id: z.string()
    .min(1, 'Outlet wajib dipilih')
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    }, 'Outlet wajib dipilih')
});

const CustomerManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranchName, setUserBranchName] = useState(null);
  const [membershipFilter, setMembershipFilter] = useState('all'); // 'all', 'with_membership', 'without_membership'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'most_services'
  const [showAddMembershipModal, setShowAddMembershipModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelCustomer, setCancelCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [createPhoneValue, setCreatePhoneValue] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
    trigger
  } = useForm({
    resolver: zodResolver(customerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      gmaps: '',
      branch_id: null
    }
  });

  // Check if explanation modal has been shown before
  useEffect(() => {
    const hasSeenExplanation = localStorage.getItem('customer-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  // Fetch tenant_id, branch_id, and user role from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile(); 
        
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
        }
        
        // Try to get branch_id from profile.branch.id first, then fallback to profile.user.branch_id
        const branchIdFromProfile = profile?.branch?.id || profile?.user?.branch_id;
        if (branchIdFromProfile) {
          setBranchId(branchIdFromProfile);
        }
        
        // Also get branch name if available
        const branchNameFromProfile = profile?.branch?.name;
        if (branchNameFromProfile) {
          setUserBranchName(branchNameFromProfile);
        }
        
        if (profile?.user?.role) {
          setUserRole(profile.user.role);
        }
        
      } catch (error) {
        console.error('❌ CustomerManagement - Failed to load user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Fetch branches when tenantId changes (only for superadmin/superapp-superadmin)
  useEffect(() => {
    if (tenantId && userRole) {
      // Only fetch branches if user can access multiple branches
      const restrictedRoles = ['admin', 'employee'];
      if (!restrictedRoles.includes(userRole)) {
        fetchBranches();
      } else {
        // For admin/employee, set their branch as selected and don't fetch others
        if (branchId) {
          setSelectedBranchId(branchId);
        }
      }
    }
  }, [tenantId, userRole, branchId]);

  // Auto-set branch_id for admin/employee when creating customer
  useEffect(() => {
    if (userRole && ['admin', 'employee'].includes(userRole) && branchId) {
      setValue('branch_id', branchId);
    } else if (userRole && (userRole === 'superadmin' || userRole === 'superapp-superadmin')) {
      // For superadmin, reset branch_id to allow selection
      setValue('branch_id', null);
    }
  }, [userRole, branchId, setValue]);

  // Fetch customers when tenantId changes (initial load only)
  useEffect(() => {
    if (tenantId) {
      setSearchTerm(''); // Reset search term on initial load
      fetchCustomers(1, false, ''); // Empty search for initial load
    }
  }, [tenantId]);

  // Refetch customers when membership filter changes
  useEffect(() => {
    if (tenantId) {
      setCurrentPage(1);
      fetchCustomers(1, false, searchTerm);
    }
  }, [membershipFilter]);

  // Refetch customers when branch filter changes
  useEffect(() => {
    if (tenantId) {
      setCurrentPage(1);
      fetchCustomers(1, false, searchTerm);
    }
  }, [selectedBranchId]);

  // Refetch customers when sort filter changes
  useEffect(() => {
    if (tenantId) {
      setCurrentPage(1);
      fetchCustomers(1, false, searchTerm);
    }
  }, [sortBy]);

  // Handle navigation from Quick Order
  useEffect(() => {
    const selectedCustomerId = location.state?.selectedCustomerId;
    const fromQuickOrder = location.state?.from === 'quick-order';
    
    if (fromQuickOrder && selectedCustomerId && customers.length > 0) {
      // Find the customer and open add membership modal
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
        setShowAddMembershipModal(true);
      }
    }
  }, [location.state, customers]);

  // Handle search only on Enter key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      fetchCustomers(1, false, searchTerm);
    }
  };

  const fetchBranches = async () => {
    try {
      if (!tenantId) {
        return;
      }

      const params = {
        tenant_id: tenantId
      };
      
      const { data } = await instance.get('/branches', { params });
      
      // Handle different response structures
      const branchesData = data.data?.branches || data.data || data.branches || [];
      setBranches(branchesData);
      
      
      // Set default branch to current user's branch
      if (branchId) {
        setSelectedBranchId(branchId);
      }
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      console.error('❌ Error details:', error.response?.data);
      setBranches([]); // Set empty array on error
    }
  };

  const fetchCustomers = async (page = 1, isLoadMore = false, searchQuery = null) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Choose API endpoint based on membership filter
      let endpoint = '/customers'; // Default to all customers
      if (membershipFilter === 'with_membership') {
        endpoint = '/customers/with-membership';
      } else if (membershipFilter === 'without_membership') {
        endpoint = '/customers/without-membership';
      }
      
      const params = {
        page: page,
        limit: 10,
        search: searchQuery !== null ? searchQuery : (searchTerm || undefined),
        tenant_id: tenantId,
        sort_by: sortBy
      };

      // Add branch_id to params if selected
      if (selectedBranchId) {
        params.branch_id = selectedBranchId;
      }
      
      const { data } = await instance.get(endpoint, { params });
      
      if (isLoadMore) {
        setCustomers(prev => [...prev, ...data.data.customers]);
      } else {
        setCustomers(data.data.customers || []);
      }
      
      setCurrentPage(data.data.pagination.currentPage);
      setTotalPages(data.data.pagination.totalPages);
      setHasNextPage(data.data.pagination.hasNextPage);
      setTotalItems(data.data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const handleCreate = async (data) => {
    try {
      setIsSubmitting(true);

      // Determine branch_id based on user role
      let finalBranchId;
      if (userRole && ['admin', 'employee'].includes(userRole)) {
        // For admin/employee, always use branch_id from getUserProfile
        finalBranchId = branchId;
      } else {
        // For superadmin, use selected branch_id from form
        finalBranchId = data.branch_id;
      }

      const payload = {
        name: data.name,
        phone: data.phone,
        address: data.address,
        gmaps: data.gmaps || '',
        tenant_id: tenantId,
        branch_id: finalBranchId
      };
      
      await instance.post('/customers', payload);
      setShowCreateModal(false);
      reset();
      setCreatePhoneValue('');
      fetchCustomers(1, false, searchTerm);
      alert('Customer berhasil ditambahkan!');
    } catch (error) {
      console.error('Error creating customer:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menambahkan customer';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (customer) => {
    setEditingCustomer(customer);

    // Set form values using React Hook Form
    setValue('name', customer.name || '');
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setValue('gmaps', customer.gmaps || '');
    setEditPhoneValue(customer.phone || '');
    
    // Set branch_id based on user role
    if (userRole && ['admin', 'employee'].includes(userRole)) {
      // For admin/employee, use their branch_id
      setValue('branch_id', branchId?.toString() || '');
    } else {
      // For superadmin, use customer's branch_id
      setValue('branch_id', customer.branch_id?.toString() || '');
    }
    
    // Trigger validation to update isValid state
    await trigger();
  };

  const handleUpdate = async (data) => {
    try {
      setIsSubmitting(true);

      // Determine branch_id based on user role
      let finalBranchId;
      if (userRole && ['admin', 'employee'].includes(userRole)) {
        // For admin/employee, always use branch_id from getUserProfile
        finalBranchId = branchId;
      } else {
        // For superadmin, use selected branch_id from form
        finalBranchId = parseInt(data.branch_id, 10);
      }

      const payload = {
        name: data.name,
        phone: data.phone,
        address: data.address,
        gmaps: data.gmaps || '',
        tenant_id: tenantId,
        branch_id: finalBranchId
      };
      
      await instance.put(`/customers/${editingCustomer.id}`, payload);
      setEditingCustomer(null);
      reset();
      fetchCustomers(1, false, searchTerm);
      alert('Customer berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating customer:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Gagal memperbarui customer';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLoadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchCustomers(currentPage + 1, true);
    }
  };

  const handleAddMembership = (customer) => {
    setSelectedCustomer(customer);
    setShowAddMembershipModal(true);
  };

  const handleViewDetail = (customer) => {
    setDetailCustomer(customer);
    setShowDetailModal(true);
  };

  const handleCancelMembership = (customer) => {
    setCancelCustomer(customer);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (customer) => {
    try {
      if (!customer.current_membership) {
        alert('Customer tidak memiliki membership aktif');
        return;
      }

      // Update membership status to cancelled
      // Preserve payment_id to distinguish paid vs tier-based membership
      await instance.put(`/customer-memberships/${customer.current_membership.id}`, {
        customer_id: customer.id,
        membership_id: customer.current_membership.membership_id,
        payment_id: customer.current_membership.payment_id || null, // Preserve payment_id
        start_date: customer.current_membership.start_date,
        end_date: customer.current_membership.end_date,
        status: 'cancelled'
      });

      alert(`Membership ${customer.current_membership.membership?.name} berhasil dibatalkan untuk ${customer.name}!`);
      fetchCustomers(1, false, searchTerm); // Refresh customer list
      
      // Update editingCustomer jika sedang diedit
      if (editingCustomer && editingCustomer.id === customer.id) {
        const updatedCustomer = await instance.get(`/customers/${customer.id}`);
        setEditingCustomer(updatedCustomer.data.data);
      }
    } catch (error) {
      console.error('Error cancelling membership:', error);
      const errorMessage = error.response?.data?.message || 'Gagal membatalkan membership';
      alert(errorMessage);
      throw error;
    }
  };


  const handleRemoveMembership = async (customer) => {
    try {
      if (!customer.current_membership) {
        alert('Customer tidak memiliki membership aktif');
        return;
      }

      const confirmRemove = window.confirm(
        `Apakah Anda yakin ingin menghapus membership ${customer.current_membership.membership?.name} dari ${customer.name}?`
      );

      if (!confirmRemove) {
        return;
      }

      await instance.delete(`/customer-memberships/${customer.current_membership.id}`);
      alert('Membership berhasil dihapus dari customer!');
      fetchCustomers(1, false, searchTerm); // Refresh customer list
      
      // Update editingCustomer dengan data terbaru untuk menghilangkan membership
      if (editingCustomer) {
        const updatedCustomer = await instance.get(`/customers/${editingCustomer.id}`);
        setEditingCustomer(updatedCustomer.data.data);
      }
    } catch (error) {
      console.error('Error removing membership:', error);
      const errorMessage = error.response?.data?.message || 'Gagal menghapus membership';
      alert(errorMessage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
      case 'laki-laki':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'female':
      case 'perempuan':
        return <User className="w-5 h-5 text-pink-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  // Handle explanation modal
  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };

  const handleExplanationConfirm = () => {
    localStorage.setItem('customer-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  const handleDownloadCSV = async () => {
    try {
      setIsDownloading(true);
      
      // Build query parameters
      // Export: mengikuti filter yang sedang aktif di layar (branch)
      // Sort: Default by nama (abjad) di backend
      // tenant_id diambil dari JWT token di backend (req.user.tenant_id), tidak perlu dikirim
      const params = new URLSearchParams();

      // Add search if exists
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add branch filter — harus sama dengan dropdown "Outlet" di layar
      // null/empty = "Semua Outlet" (export seluruh tenant)
      if (selectedBranchId) {
        params.append('branch_id', selectedBranchId);
      }

      // Add membership filter
      params.append('membership_filter', membershipFilter);

      // UPDATED: Gunakan endpoint optimized ✅
      const response = await instance.get(`/customers/export-optimized?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      const filename = `customers_export_${today}.csv`;
      link.setAttribute('download', filename);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ Data customer berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      
      // Better error handling untuk error dari backend
      let errorMessage = 'Gagal mengunduh data customer';
      
      if (error.response && error.response.data) {
        // Try to extract error message from blob
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // Fallback jika tidak bisa parse
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };


  // Use customers directly since filtering is now done server-side
  const filteredCustomers = customers;

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner 
          title="Manajemen Customer" 
          description="Kelola data customer dan informasi kontak"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
            <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
              
              {/* Header Skeleton */}
              <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              
              {/* Search Skeleton */}
              <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 shadow-sm animate-pulse">
                <div className="h-10 bg-gray-200 rounded-xl"></div>
              </div>
              
              {/* Cards Skeleton */}
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm animate-pulse">
                    <div className="flex justify-between items-start mb-3">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Manajemen Pelanggan" 
        description="Kelola data pelanggan"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 pt-16 pb-4">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-6">

            {/* Action Buttons - Tokopedia Style */}
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex gap-3">
              {/* Add Button - Primary */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                <span>Tambah Pelanggan Baru</span>
              </button>
              
              {/* Help Button - Secondary */}
              <button
                onClick={() => setShowExplanationModal(true)}
                className="px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center justify-center"
                title="Bantuan & Panduan Pelanggan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterBottomSheet(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Filter className="w-4 h-4" />
                <span>Filter Pelanggan</span>
              </button>

              {/* Import & Download Buttons - Grid 2 columns (Only for superadmin) */}
              {(userRole === 1 || userRole === 'superadmin') && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    title="Import Customer dari CSV (Hanya Superadmin)"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import CSV</span>
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    title="Download Data Customer ke CSV (Hanya Superadmin)"
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mengunduh...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download CSV</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Summary Info - Tokopedia Style */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Semua Pelanggan</h3>
                    <p className="text-gray-600 text-sm">{totalItems || 0} pelanggan tersedia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Card - HIDDEN (using bottom sheet instead) */}
            {false && (
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Cari pelanggan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 font-medium"
                    />
                  </div>
                  <AnimatedButton
                    onClick={() => {
                      setCurrentPage(1);
                      fetchCustomers(1, false, searchTerm);
                    }}
                    variant="blue"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl"
                  >
                    <span>Cari</span>
                  </AnimatedButton>
                </div>
                
                {/* Branch Filter - Only show for superadmin/superapp-superadmin */}
                {userRole && !['admin', 'employee'].includes(userRole) && (
                  <div className="mb-2">
                    <select
                      value={selectedBranchId || ''}
                      onChange={(e) => setSelectedBranchId(e.target.value || null)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white font-montserrat"
                      disabled={branches.length === 0}
                    >
                      <option value="">
                        {branches.length === 0 ? 'Loading Outlet...' : 'Semua Outlet'}
                      </option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    {branches.length === 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Memuat daftar outlet...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Branch Info for Admin/Employee */}
                {userRole && ['admin', 'employee'].includes(userRole) && (
                  <div className="mb-2">
                    <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 font-montserrat">
                      Outlet: {userBranchName || 'Loading...'}
                    </div>
                  </div>
                )}
                
                {/* Membership Filter Tabs - Tokopedia Style */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setMembershipFilter('all')}
                    className={`flex-1 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      membershipFilter === 'all' 
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        membershipFilter === 'all' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                      Semua
                    </div>
                  </button>
                  <button
                    onClick={() => setMembershipFilter('with_membership')}
                    className={`flex-1 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      membershipFilter === 'with_membership' 
                        ? 'bg-white text-yellow-600 shadow-sm border border-yellow-200' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        membershipFilter === 'with_membership' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      Member
                    </div>
                  </button>
                  <button
                    onClick={() => setMembershipFilter('without_membership')}
                    className={`flex-1 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      membershipFilter === 'without_membership' 
                        ? 'bg-white text-gray-700 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        membershipFilter === 'without_membership' ? 'bg-gray-500' : 'bg-gray-400'
                      }`}></div>
                      Non-Member
                    </div>
                  </button>
                </div>
                
                {/* Sort Filter - Small dropdown below tabs */}
                <div className="mt-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white font-montserrat"
                  >
                    <option value="newest">Customer Baru</option>
                    <option value="most_services">Layanan Terbanyak</option>
                  </select>
                </div>
              </div>
            )}

            {/* Customer List - Tokopedia Style */}
            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm ? 'Tidak ada pelanggan yang ditemukan' : 
                     membershipFilter === 'all' ? 'Belum ada pelanggan' :
                     membershipFilter === 'with_membership' ? 'Tidak ada data pelanggan member' :
                     membershipFilter === 'without_membership' ? 'Tidak ada data pelanggan non-member' :
                     'Belum ada pelanggan'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Coba ubah kata kunci pencarian' : 
                     'Coba ubah filter atau tambahkan pelanggan baru'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
                      {/* Mobile Layout */}
                      <div className="block md:hidden">
                        {/* Header with name and membership badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-md truncate">
                              {customer.name}
                            </h3>
                            {/* Order & Service Count - Simple Text */}
                            <div className="flex gap-3 text-xs text-gray-600 font-montserrat mt-1">
                              {customer.total_orders > 0 && (
                                <span>{customer.total_orders} pesanan</span>
                              )}
                              {customer.total_order_details > 0 && (
                                <span>{customer.total_order_details} layanan</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                            {/* Membership Badge */}
                            {customer.current_membership && customer.current_membership.status === 'active' && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(customer.current_membership.membership?.name)}`}>
                                <Crown className="w-3 h-3" />
                                {customer.current_membership.membership?.name}
                                {/* Hanya tampilkan cancel button untuk paid membership */}
                                {customer.current_membership.payment_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelMembership(customer);
                                  }}
                                  className="ml-1 w-4 h-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-colors"
                                  title="Batalkan Membership"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                                )}
                              </span>
                            )}
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-600">
                                {formatPhoneNumber(customer.phone)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Address and Branch */}
                        <div className="space-y-2 mb-3">
                          {customer.address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2 font-medium">{customer.address}</span>
                            </div>
                          )}
                          {customer.branch && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">{customer.branch.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons - horizontal on mobile */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(customer)}
                            className="flex-1 px-3 py-2 bg-green-50 border-2 border-green-200 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 hover:border-green-300 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Detail
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="flex-1 px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="flex items-center justify-between">
                          {/* Left Content - Name, Counts, Phone, Address, Branch */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-base truncate">
                                  {customer.name}
                                </h3>
                                {/* Order & Service Count - Simple Text */}
                                <div className="flex gap-3 text-xs text-gray-600 font-montserrat mt-1">
                                  {customer.total_orders > 0 && (
                                    <span>{customer.total_orders} pesanan</span>
                                  )}
                                  {customer.total_order_details > 0 && (
                                    <span>{customer.total_order_details} layanan</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                {/* Phone */}
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-600">
                                    {formatPhoneNumber(customer.phone)}
                                  </div>
                                </div>
                                
                                {/* Address */}
                                {customer.address && (
                                  <div className="text-right min-w-0 max-w-xs">
                                    <div className="text-sm text-gray-600 truncate" title={customer.address}>
                                      {customer.address}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Branch */}
                                {customer.branch && (
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-blue-600">
                                      {customer.branch.name}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Actions - Membership Badge & Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            {/* Membership Badge */}
                            {customer.current_membership && customer.current_membership.status === 'active' && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(customer.current_membership.membership?.name)}`}>
                                <Crown className="w-3 h-3" />
                                {customer.current_membership.membership?.name}
                                {/* Hanya tampilkan cancel button untuk paid membership */}
                                {customer.current_membership.payment_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelMembership(customer);
                                  }}
                                  className="ml-1 w-4 h-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-colors"
                                  title="Batalkan Membership"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                                )}
                              </span>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetail(customer)}
                                className="px-3 py-2 bg-green-50 border-2 border-green-200 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 hover:border-green-300 transition-all duration-200 flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Detail
                              </button>
                              <button
                                onClick={() => handleEdit(customer)}
                                className="px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-3 flex justify-center">
                <AnimatedButton
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center text-xs font-semibold"
                  variant="blue"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                      Memuat...
                    </>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </AnimatedButton>
              </div>
            )}

            {/* Pagination Info */}
            {totalItems > 0 && (
              <div className="mt-2 text-center text-xs text-gray-600 font-medium">
                Menampilkan {filteredCustomers.length} dari {totalItems} pelanggan
                <span className="block mt-0.5 text-xs text-gray-500">
                  Filter: {membershipFilter === 'all' ? 'Semua Pelanggan' : 
                           membershipFilter === 'with_membership' ? 'Dengan Membership' : 
                           'Tanpa Membership'}
                </span>
                {totalPages > 1 && (
                  <span> • Halaman {currentPage} dari {totalPages}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Modal - Tokopedia Style */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(2rem, env(safe-area-inset-left))',
            paddingRight: 'max(2rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">Tambah Pelanggan</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                  setCreatePhoneValue('');
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <form 
              onSubmit={handleSubmit(handleCreate)} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div 
                className="p-6 space-y-4 overflow-y-auto flex-1"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Nama *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.name.message}</span>
                  </div>
                )}
              </div>
              
              <PhoneInputWithCountry
                value={createPhoneValue}
                onChange={(v) => {
                  setCreatePhoneValue(v);
                  setValue('phone', v);
                  trigger('phone');
                }}
                error={errors.phone?.message}
                required
              />
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Alamat
                </label>
                <textarea
                  {...register('address')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium resize-none ${
                    errors.address
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  rows="3"
                  placeholder="Masukkan alamat lengkap (opsional)"
                />
                {errors.address && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.address.message}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  {...register('gmaps')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.gmaps
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="https://maps.app.goo.gl/... (opsional)"
                />
                {errors.gmaps && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.gmaps.message}</span>
                  </div>
                )}
              </div>
              
              {/* Branch Selection - Only show for superadmin/superapp-superadmin */}
              {userRole && (userRole === 'superadmin' || userRole === 'superapp-superadmin') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Dari Outlet *
                  </label>
                  <select
                    {...register('branch_id')}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                      errors.branch_id
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    required
                  >
                    <option value="">Pilih Outlet</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch_id && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-red-500 text-xs">⚠️</span>
                      <span className="text-red-500 text-xs font-montserrat">{errors.branch_id.message}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Branch Info for Admin/Employee - Hidden field, auto-use branch from getUserProfile */}
              {userRole && ['admin', 'employee'].includes(userRole) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Outlet
                  </label>
                  <div className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600 font-medium">
                    {userBranchName || 'Loading...'}
                  </div>
                  {/* Hidden field to ensure branch_id is set */}
                  <input
                    type="hidden"
                    value={branchId || ''}
                    onChange={() => {}} // No-op since it's hidden
                  />
                </div>
              )}
              
                {/* Validation Summary */}
                {!isValid && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-sm">⚠️</span>
                      <span className="text-red-600 text-sm font-semibold">Form belum lengkap</span>
                    </div>
                    <p className="text-red-500 text-xs mt-1">
                      Pastikan semua field wajib diisi dengan benar
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                    setCreatePhoneValue('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`flex-1 px-6 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isValid || isSubmitting
                      ? 'bg-gray-400 border-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 hover:border-blue-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Tokopedia Style */}
      {editingCustomer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(2rem, env(safe-area-inset-left))',
            paddingRight: 'max(2rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-800 font-montserrat">Edit Pelanggan</h2>
                <div className="flex items-center gap-2">
                  {editingCustomer.current_membership && editingCustomer.current_membership.status === 'active' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold border ${getMembershipBadgeColor(editingCustomer.current_membership.membership?.name)}`}>
                      <Crown className="w-4 h-4" />
                      {editingCustomer.current_membership.membership?.name}
                    </span>
                  )}
                  {!editingCustomer.current_membership && (
                    <button
                      onClick={() => handleAddMembership(editingCustomer)}
                      className="px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors border border-yellow-200 bg-yellow-50 flex items-center gap-1 text-sm font-semibold"
                      title="Tambah Membership"
                    >
                      <span>Tambah Membership</span>
                    </button>
                  )}
                </div>
              </div>
            
            {/* Body - Scrollable */}
            <form 
              onSubmit={handleSubmit(handleUpdate)} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div 
                className="p-6 space-y-4 overflow-y-auto flex-1"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.name.message}</span>
                  </div>
                )}
              </div>
              
              <PhoneInputWithCountry
                value={editPhoneValue}
                onChange={(v) => {
                  setEditPhoneValue(v);
                  setValue('phone', v);
                  trigger('phone');
                }}
                error={errors.phone?.message}
                required
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Alamat
                </label>
                <textarea
                  {...register('address')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium resize-none ${
                    errors.address
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  rows="3"
                  placeholder="Masukkan alamat lengkap (opsional)"
                />
                {errors.address && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.address.message}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  {...register('gmaps')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.gmaps
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="https://maps.app.goo.gl/... (opsional)"
                />
                {errors.gmaps && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.gmaps.message}</span>
                  </div>
                )}
              </div>
              
              {/* Branch Selection - Only show for superadmin/superapp-superadmin */}
              {userRole && (userRole === 'superadmin' || userRole === 'superapp-superadmin') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Dari Outlet *
                  </label>
                  <select
                    {...register('branch_id')}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                      errors.branch_id
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Pilih Outlet</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch_id && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-red-500 text-xs">⚠️</span>
                      <span className="text-red-500 text-xs font-montserrat">{errors.branch_id.message}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Branch Info for Admin/Employee - Hidden field, auto-use branch from getUserProfile */}
              {userRole && ['admin', 'employee'].includes(userRole) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Outlet
                  </label>
                  <div className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600 font-medium">
                    {userBranchName || 'Loading...'}
                  </div>
                  {/* Hidden field to ensure branch_id is set */}
                  <input
                    type="hidden"
                    value={branchId || ''}
                    onChange={() => {}} // No-op since it's hidden
                  />
                </div>
              )}

              {/* Membership Info Section */}
              {editingCustomer.current_membership && editingCustomer.current_membership.status === 'active' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 mb-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Membership Aktif
                    </h4>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-0">
                    {/* Program & Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-800">{editingCustomer.current_membership.membership?.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                        {editingCustomer.current_membership.membership?.name}
                      </span>
                    </div>
                    
                    {/* Discount & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Diskon:</span>
                        <span className="text-sm font-bold text-green-600">
                          {getMembershipDiscountDisplay(editingCustomer.current_membership.membership?.discount_percentage)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          editingCustomer.current_membership.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {editingCustomer.current_membership.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Duration */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-600 font-medium">Periode:</span>
                      <span className="text-xs font-semibold text-gray-800">
                        {new Date(editingCustomer.current_membership.start_date).toLocaleDateString('id-ID')} - {new Date(editingCustomer.current_membership.end_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <button
                      onClick={() => handleRemoveMembership(editingCustomer)}
                      className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border-2 border-red-200 bg-red-50 flex items-center justify-center gap-2 text-sm font-semibold hover:border-red-300"
                      title="Hapus Membership"
                    >
                      <Crown className="w-3 h-3" />
                      <span>Hapus Membership</span>
                    </button>
                  </div>
                </div>
              )}
              
                {/* Validation Summary */}
                {!isValid && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-sm">⚠️</span>
                      <span className="text-red-600 text-sm font-semibold">Form belum lengkap</span>
                    </div>
                    <p className="text-red-500 text-xs mt-1">
                      Pastikan semua field wajib diisi dengan benar
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomer(null);
                    reset();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`flex-1 px-6 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isValid || isSubmitting
                      ? 'bg-gray-400 border-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 hover:border-blue-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memperbarui...
                    </>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Membership Modal */}
      <AddMembershipModal
        isOpen={showAddMembershipModal}
        onClose={() => {
          setShowAddMembershipModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSuccess={(customer, membership) => {
          alert(`Membership ${membership.name} berhasil ditambahkan ke ${customer.name}!`);
          fetchCustomers(1, false, searchTerm); // Refresh customer list
          if (editingCustomer) { // Update editingCustomer to refresh modal data
            const updatedCustomer = customers.find(c => c.id === editingCustomer.id);
            if (updatedCustomer) {
              setEditingCustomer(updatedCustomer);
            }
          }
        }}
        title="Tambah Membership ke"
      />

      {/* Explanation Modal */}
      <CustomerExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailCustomer(null);
        }}
        customer={detailCustomer}
      />

      {/* Cancel Membership Modal */}
      <CancelMembershipModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelCustomer(null);
        }}
        customer={cancelCustomer}
        onConfirm={handleConfirmCancel}
      />

      {/* Import Customer Modal */}
      <CustomerImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchCustomers(1, false, searchTerm);
        }}
      />

      {/* Filter Bottom Sheet */}
      <CustomerFilterBottomSheet
        isOpen={showFilterBottomSheet}
        onClose={() => setShowFilterBottomSheet(false)}
        searchTerm={searchTerm}
        membershipFilter={membershipFilter}
        sortBy={sortBy}
        selectedBranchId={selectedBranchId}
        branches={branches}
        userRole={userRole}
        userBranchName={userBranchName}
        showBranchFilter={userRole && !['admin', 'employee'].includes(userRole)}
        onApplyFilter={(filters) => {
          setSearchTerm(filters.searchTerm);
          setMembershipFilter(filters.membershipFilter);
          setSortBy(filters.sortBy);
          setSelectedBranchId(filters.selectedBranchId);
          setCurrentPage(1);
          fetchCustomers(1, false, filters.searchTerm);
        }}
        onResetFilter={() => {
          setSearchTerm('');
          setMembershipFilter('all');
          setSortBy('newest');
          setSelectedBranchId(null);
          setCurrentPage(1);
          fetchCustomers(1, false, '');
        }}
      />

    </div>
  );
};

export default CustomerManagement;
