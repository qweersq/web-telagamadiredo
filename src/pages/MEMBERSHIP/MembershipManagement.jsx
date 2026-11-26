import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import MembershipExplanationModal from '../../components/Modal/MembershipExplanationModal';
import MembershipDetailModal from '../../components/Modal/MembershipDetailModal';
import instance from '../../config/api';
import { FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaSearch, FaCrown, FaPercent, FaEye } from 'react-icons/fa';
import { getUserProfile } from '../../utils/userProfileHelper';
import { getMembershipDiscountDisplay, formatCurrency, formatNumber } from '../../utils/labelFormatter';

// Schema validation untuk membership form
const membershipSchema = z.object({
  name: z.string()
    .min(1, 'Nama membership wajib diisi')
    .min(2, 'Nama membership minimal 2 karakter')
    .max(50, 'Nama membership maksimal 50 karakter')
    .optional(),
  description: z.string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
  discount_percentage: z.string()
    .min(1, 'Persentase diskon wajib diisi')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, 'Persentase diskon harus antara 0-100%'),
  price: z.string()
    .min(1, 'Harga membership wajib diisi')
    .refine((val) => {
      // Handle both formatted currency and plain numbers
      const cleanValue = val.replace(/[^\d]/g, '');
      const num = parseInt(cleanValue, 10);
      return !isNaN(num) && num > 0;
    }, 'Harga harus berupa angka positif'),
  duration_days: z.string()
    .min(1, 'Durasi wajib diisi')
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1;
    }, 'Durasi minimal 1 hari'),
  min_points: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true; // Optional field
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0;
    }, 'Minimum poin harus berupa angka positif atau 0')
});

const MembershipManagement = () => {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMemberships, setFilteredMemberships] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'all', 'active', 'inactive'
  const [tenantId, setTenantId] = useState('');
  const [userRole, setUserRole] = useState(null); // ✅ Add user role state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMinPointsExplanation, setShowMinPointsExplanation] = useState(false);

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
    resolver: zodResolver(membershipSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      discount_percentage: '',
      price: '',
      duration_days: '',
      min_points: ''
    }
  });

  // Watch price field untuk format display
  const watchedPrice = watch('price');

  // Check if explanation modal has been shown before
  useEffect(() => {
    const hasSeenExplanation = localStorage.getItem('membership-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  useEffect(() => {
    // Get tenant_id and user role from API
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
        }
        // ✅ Get user role for validation
        if (profile?.user?.role) {
          setUserRole(profile.user.role);
        }
      } catch (error) {
        console.error('❌ MembershipManagement - Failed to load user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchMemberships();
    }
  }, [tenantId]);

  useEffect(() => {
    let filtered = memberships.filter(membership =>
      membership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by active status
    if (activeTab === 'active') {
      filtered = filtered.filter(membership => membership.is_active);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(membership => !membership.is_active);
    }

    setFilteredMemberships(filtered);
  }, [searchTerm, memberships, activeTab]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get('/memberships');
      setMemberships(data.data.memberships || []);
    } catch (error) {
      console.error('❌ Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name: data.name,
        description: data.description || '',
        discount_percentage: parseFloat(data.discount_percentage),
        price: parseFloat(data.price.replace(/[^\d]/g, '')),
        duration_days: parseInt(data.duration_days),
        min_points: data.min_points && data.min_points !== '' ? parseInt(data.min_points, 10) : null,
        is_active: true
      };
      
      await instance.post('/memberships', payload);
      alert('Membership berhasil dibuat!');
      
      // Reset form dan close modal
      reset();
      setShowCreateModal(false);
      fetchMemberships();
    } catch (error) {
      console.error('Error creating membership:', error);
      const errorMessage = error.response?.data?.message || 'Gagal membuat membership';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (membership) => {
    setEditingMembership(membership);
    
    // Handle string decimal from API response
    const priceString = membership.price.toString();
    // Convert decimal string to clean number for form
    const cleanPrice = parseFloat(priceString).toString();
    
    // Set form values using React Hook Form
    setValue('name', membership.name);
    setValue('description', membership.description || '');
    setValue('discount_percentage', membership.discount_percentage.toString());
    setValue('price', cleanPrice);
    setValue('duration_days', membership.duration_days.toString());
    setValue('min_points', membership.min_points !== null && membership.min_points !== undefined ? membership.min_points.toString() : '');
    
    setShowEditModal(true);
  };

  const handleUpdate = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name: data.name,
        description: data.description || '',
        discount_percentage: parseFloat(data.discount_percentage),
        price: parseFloat(data.price.replace(/[^\d]/g, '')),
        duration_days: parseInt(data.duration_days),
        min_points: data.min_points && data.min_points !== '' ? parseInt(data.min_points, 10) : null,
        is_active: editingMembership.is_active
      };
      
      await instance.put(`/memberships/${editingMembership.id}`, payload);
      alert('Membership berhasil diperbarui!');
      
      // Reset form dan close modal
      reset();
      setShowEditModal(false);
      setEditingMembership(null);
      fetchMemberships();
    } catch (error) {
      console.error('Error updating membership:', error);
      const errorMessage = error.response?.data?.message || 'Gagal memperbarui membership';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (membershipId) => {
    try {
      await instance.patch(`/memberships/${membershipId}/toggle-status`);
      fetchMemberships();
    } catch (error) {
      console.error('Error toggling membership status:', error);
      const errorMessage = error.response?.data?.message || 'Gagal mengubah status membership';
      alert(errorMessage);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    reset();
    setShowMinPointsExplanation(false); // Reset explanation state
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    reset();
    setShowMinPointsExplanation(false); // Reset explanation state
    setShowCreateModal(false);
  };

  const closeEditModal = () => {
    reset();
    setShowMinPointsExplanation(false); // Reset explanation state
    setEditingMembership(null);
    setShowEditModal(false);
  };

  // Handle explanation modal
  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };

  const handleExplanationConfirm = () => {
    localStorage.setItem('membership-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  // Handle detail modal
  const openDetailModal = (membershipId) => {
    setSelectedMembershipId(membershipId);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMembershipId(null);
  };


  const formatPrice = (price) => {
    return formatCurrency(price, { showSymbol: true, minimumFractionDigits: 0 });
  };

  // Format number with dots as thousand separators (Indonesian format)
  const formatNumberInput = (value) => {
    const number = value.replace(/\D/g, '');
    return formatNumber(parseInt(number, 10));
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatNumberInput(value);
    setDisplayPrice(formattedValue);
    setFormData(prev => ({
      ...prev,
      price: value.replace(/\D/g, '')
    }));
  };

  const getMembershipTypeColor = (name) => {
    switch (name.toLowerCase()) {
      case 'lite':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'vip':
        return 'bg-yellow-100 text-yellow-800';
      case 'platinum':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner 
          title="Manajemen Membership" 
          description="Kelola program membership"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data membership...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Manajemen Membership" 
        description="Kelola program membership"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-16 pb-4">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-6">

            {/* Action Buttons - Tokopedia Style */}
            <div className="mb-6 flex gap-3">
              {/* Add Button - Primary (Only for superadmin) */}
              {userRole === 'superadmin' && (
              <button
                onClick={openCreateModal}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FaPlus className="w-3 h-3" />
                </div>
                <span>Tambah Membership Baru</span>
              </button>
              )}
              
              {/* Help Button - Secondary */}
              <button
                onClick={() => setShowExplanationModal(true)}
                className="px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center justify-center"
                title="Bantuan & Panduan Membership"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Summary Info - Tokopedia Style */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                    <FaCrown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Semua Membership</h3>
                    <p className="text-gray-600 text-sm">{memberships.length} membership tersedia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Filter - Tokopedia Style */}
            <div className="mb-4">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'active'
                      ? 'bg-white text-green-600 shadow-sm border border-green-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activeTab === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    Aktif
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'inactive'
                      ? 'bg-white text-red-600 shadow-sm border border-red-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activeTab === 'inactive' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    Nonaktif
                  </div>
                </button>
              </div>
            </div>

            {/* Search - Tokopedia Style */}
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari membership..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 font-medium"
                />
              </div>
            </div>

            {/* Memberships List - Tokopedia Style */}
            <div className="space-y-4">
              {filteredMemberships.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCrown className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Belum ada membership
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Mulai dengan menambahkan membership pertama
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMemberships.map((membership) => (
                    <div key={membership.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
                      {/* Mobile Layout */}
                      <div className="block md:hidden">
                        {/* Header with name and price in one row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-md truncate">
                              {membership.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {formatPrice(membership.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Membership Info - Simple Tags */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                            {Math.round(membership.discount_percentage)}%
                          </span>
                          {membership.min_points !== null && membership.min_points !== undefined && (
                            <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                              Min {formatNumber(membership.min_points)} poin
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium">
                            {membership.duration_days} hari
                          </span>
                        </div>
                        
                        {/* Action buttons - horizontal on mobile */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailModal(membership.id)}
                            className="flex-1 px-3 py-2 bg-purple-50 border-2 border-purple-200 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            <FaEye className="w-3 h-3" />
                            Detail
                          </button>
                          {userRole === 'superadmin' && (
                            <>
                          <button
                            onClick={() => handleEdit(membership)}
                            className="flex-1 px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            <FaEdit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(membership.id)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                              membership.is_active 
                                ? 'bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300' 
                                : 'bg-green-50 border-2 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'
                            }`}
                            title={membership.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {membership.is_active ? (
                              <>
                                <FaToggleOn className="w-3 h-3" />
                                Nonaktif
                              </>
                            ) : (
                              <>
                                <FaToggleOff className="w-3 h-3" />
                                Aktifkan
                              </>
                            )}
                          </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="flex items-center justify-between">
                          {/* Left Content - Name, Price, and Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-800 text-base truncate flex-1 min-w-0">
                                {membership.name}
                              </h3>
                              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                {/* Membership Price */}
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {formatPrice(membership.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Membership Info - Simple Tags */}
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                                {Math.round(membership.discount_percentage)}%
                              </span>
                              {membership.min_points !== null && membership.min_points !== undefined && (
                                <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                                  Min {formatNumber(membership.min_points)} poin
                                </span>
                              )}
                              <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium">
                                {membership.duration_days} hari
                              </span>
                            </div>
                          </div>
                          
                          {/* Right Actions */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => openDetailModal(membership.id)}
                              className="px-4 py-2 bg-purple-50 border-2 border-purple-200 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 flex items-center gap-2"
                            >
                              <FaEye className="w-3 h-3" />
                              Detail
                            </button>
                            {userRole === 'superadmin' && (
                              <>
                            <button
                              onClick={() => handleEdit(membership)}
                              className="px-4 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center gap-2"
                            >
                              <FaEdit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(membership.id)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                                membership.is_active 
                                  ? 'bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300' 
                                  : 'bg-green-50 border-2 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'
                              }`}
                              title={membership.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {membership.is_active ? (
                                <>
                                  <FaToggleOn className="w-3 h-3" />
                                  Nonaktif
                                </>
                              ) : (
                                <>
                                  <FaToggleOff className="w-3 h-3" />
                                  Aktifkan
                                </>
                              )}
                            </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">Buat Membership Baru</h2>
              <button
                onClick={closeCreateModal}
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
                  Nama Membership *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Contoh: Silver, Gold, Platinum"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.name.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Deskripsi</label>
                <textarea
                  {...register('description')}
                  placeholder="Deskripsi membership..."
                  rows={3}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium resize-none ${
                    errors.description
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.description && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.description.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Persentase Diskon (%) *
                </label>
                <input
                  type="number"
                  {...register('discount_percentage')}
                  placeholder="10"
                  min="0"
                  max="100"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.discount_percentage
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.discount_percentage && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.discount_percentage.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Harga Membership *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('price')}
                    placeholder="300000"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                      errors.price
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleanValue = value.replace(/[^\d]/g, '');
                      setValue('price', cleanValue, { shouldValidate: true });
                    }}
                  />
                  {watchedPrice && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                      {formatNumber(parseInt(watchedPrice, 10))}
                    </div>
                  )}
                </div>
                {errors.price && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.price.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Durasi (Hari) *
                </label>
                <input
                  type="number"
                  {...register('duration_days')}
                  placeholder="365"
                  min="1"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.duration_days
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.duration_days && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.duration_days.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Minimum Poin (Lifetime Points) <span className="text-gray-400 text-xs">(Opsional)</span>
                </label>
                <input
                  type="number"
                  {...register('min_points')}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.min_points
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <div className="mt-2 flex items-center justify-between">
                  {!showMinPointsExplanation && (
                    <p className="text-xs text-gray-500 font-montserrat">
                      Minimum lifetime_points untuk tier ini. <button type="button" onClick={() => setShowMinPointsExplanation(true)} className="text-blue-600 hover:text-blue-700 underline">Klik untuk penjelasan detail</button>
                    </p>
                  )}
                  {showMinPointsExplanation && (
                    <button
                      type="button"
                      onClick={() => setShowMinPointsExplanation(false)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold font-montserrat flex items-center gap-1"
                    >
                      Sembunyikan Penjelasan
                      <span className="text-blue-600">▲</span>
                    </button>
                  )}
                </div>
                {showMinPointsExplanation && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-900 font-montserrat mb-2">
                          Apa itu Minimum Poin?
                        </p>
                        <p className="text-xs text-blue-800 font-montserrat leading-relaxed">
                          Minimum poin adalah batas minimum <strong>lifetime_points</strong> yang harus dimiliki customer untuk mendapatkan tier membership ini. Sistem akan otomatis upgrade tier customer ketika <strong>lifetime_points</strong> mereka mencapai atau melebihi minimum poin tier ini.
                        </p>
                        <p className="text-xs text-blue-800 font-montserrat leading-relaxed mt-2">
                          <strong>💡 Cara Mendapatkan Membership:</strong>
                        </p>
                        <ul className="text-xs text-blue-800 font-montserrat leading-relaxed mt-1 space-y-1 list-disc list-inside">
                          <li>Jika <strong>Harga {'>'} 0</strong>: Customer bisa <strong>bayar langsung</strong> (shortcut) untuk mendapatkan membership tanpa harus menunggu lifetime_points</li>
                          <li>Jika <strong>Min Poin diisi</strong>: Customer bisa dapat membership <strong>via lifetime_points</strong> (otomatis upgrade saat mencapai min poin)</li>
                          <li>Jika <strong>keduanya</strong>: Customer bisa pilih salah satu cara (bayar langsung atau via lifetime_points)</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-blue-900 font-montserrat mb-2">
                          Study Case:
                        </p>
                        <div className="space-y-2 text-xs text-blue-800 font-montserrat">
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 1: Tier Member</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>0</strong></p>
                            <p className="text-gray-700">• Semua customer baru otomatis dapat tier ini</p>
                            <p className="text-gray-700">• Discount: 5%</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 2: Tier Silver</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>1,000</strong></p>
                            <p className="text-gray-700">• Customer dengan lifetime_points ≥ 1,000 otomatis upgrade ke Silver</p>
                            <p className="text-gray-700">• Discount: 10%</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 3: Tier Gold</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>5,000</strong></p>
                            <p className="text-gray-700">• Customer dengan lifetime_points ≥ 5,000 otomatis upgrade ke Gold</p>
                            <p className="text-gray-700">• Discount: 15%</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 4: Tier Platinum</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>10,000</strong></p>
                            <p className="text-gray-700">• Customer dengan lifetime_points ≥ 10,000 otomatis upgrade ke Platinum</p>
                            <p className="text-gray-700">• Discount: 20%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700 font-semibold font-montserrat mb-1">
                          💡 Tips:
                        </p>
                        <ul className="text-xs text-blue-800 font-montserrat space-y-1 list-disc list-inside">
                          <li>Kosongkan field ini jika membership ini <strong>hanya bisa dibeli langsung</strong> (shortcut only)</li>
                          <li>Set minimum poin dari yang <strong>terkecil ke terbesar</strong> (0, 1000, 5000, 10000)</li>
                          <li>Tier akan <strong>otomatis upgrade</strong> saat customer mencapai minimum poin</li>
                          <li>Jika customer punya <strong>paid membership aktif</strong>, tier tidak akan auto-upgrade sampai paid membership expire</li>
                          <li>Setelah paid membership expire, tier akan <strong>re-evaluate</strong> berdasarkan lifetime_points saat ini</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {errors.min_points && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.min_points.message}</span>
                  </div>
                )}
              </div>
                
                {/* Validation Summary */}
                {!isValid && (
                  <div className="px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400 text-sm">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 font-montserrat">
                          Mohon lengkapi semua field yang wajib diisi untuk melanjutkan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isValid || isSubmitting
                      ? 'bg-gray-300 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 border-2 border-blue-500 text-white hover:bg-blue-600 hover:border-blue-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Membuat...
                    </>
                  ) : (
                    'Buat'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Tokopedia Style */}
      {showEditModal && (
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
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">Edit Membership</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
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
                  Nama Membership *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Contoh: Silver, Gold, Platinum"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.name.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Deskripsi</label>
                <textarea
                  {...register('description')}
                  placeholder="Deskripsi membership..."
                  rows={3}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium resize-none ${
                    errors.description
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.description && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.description.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Persentase Diskon (%) *
                </label>
                <input
                  type="number"
                  {...register('discount_percentage')}
                  placeholder="10"
                  min="0"
                  max="100"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.discount_percentage
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.discount_percentage && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.discount_percentage.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Harga Membership *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('price')}
                    placeholder="300000"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                      errors.price
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleanValue = value.replace(/[^\d]/g, '');
                      setValue('price', cleanValue, { shouldValidate: true });
                    }}
                  />
                  {watchedPrice && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                      {formatNumber(parseInt(watchedPrice, 10))}
                    </div>
                  )}
                </div>
                {errors.price && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.price.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Durasi (Hari) *
                </label>
                <input
                  type="number"
                  {...register('duration_days')}
                  placeholder="365"
                  min="1"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.duration_days
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {errors.duration_days && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.duration_days.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Minimum Poin (Lifetime Points) <span className="text-gray-400 text-xs">(Opsional)</span>
                </label>
                <input
                  type="number"
                  {...register('min_points')}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    errors.min_points
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <div className="mt-2 flex items-center justify-between">
                  {!showMinPointsExplanation && (
                    <p className="text-xs text-gray-500 font-montserrat">
                      Minimum lifetime_points untuk tier ini. <button type="button" onClick={() => setShowMinPointsExplanation(true)} className="text-blue-600 hover:text-blue-700 underline">Klik untuk penjelasan detail</button>
                    </p>
                  )}
                  {showMinPointsExplanation && (
                    <button
                      type="button"
                      onClick={() => setShowMinPointsExplanation(false)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold font-montserrat flex items-center gap-1"
                    >
                      Sembunyikan Penjelasan
                      <span className="text-blue-600">▲</span>
                    </button>
                  )}
                </div>
                {showMinPointsExplanation && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-900 font-montserrat mb-2">
                          Apa itu Minimum Poin?
                        </p>
                        <p className="text-xs text-blue-800 font-montserrat leading-relaxed">
                          Minimum poin adalah batas minimum <strong>lifetime_points</strong> yang harus dimiliki customer untuk mendapatkan tier membership ini. Sistem akan otomatis upgrade tier customer ketika <strong>lifetime_points</strong> mereka mencapai atau melebihi minimum poin tier ini.
                        </p>
                        <p className="text-xs text-blue-800 font-montserrat leading-relaxed mt-2">
                          <strong>💡 Cara Mendapatkan Membership:</strong>
                        </p>
                        <ul className="text-xs text-blue-800 font-montserrat leading-relaxed mt-1 space-y-1 list-disc list-inside">
                          <li>Jika <strong>Harga {'>'} 0</strong>: Customer bisa <strong>bayar langsung</strong> (shortcut) untuk mendapatkan membership tanpa harus menunggu lifetime_points</li>
                          <li>Jika <strong>Min Poin diisi</strong>: Customer bisa dapat membership <strong>via lifetime_points</strong> (otomatis upgrade saat mencapai min poin)</li>
                          <li>Jika <strong>keduanya</strong>: Customer bisa pilih salah satu cara (bayar langsung atau via lifetime_points)</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-blue-900 font-montserrat mb-2">
                          Study Case:
                        </p>
                        <div className="space-y-2 text-xs text-blue-800 font-montserrat">
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 1: Tier Member</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>0</strong></p>
                            <p className="text-gray-700">• Semua customer baru otomatis dapat tier ini</p>
                            <p className="text-gray-700">• Discount: 5%</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 2: Tier Silver</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>1,000</strong></p>
                            <p className="text-gray-700">• Customer dengan lifetime_points ≥ 1,000 otomatis upgrade ke Silver</p>
                            <p className="text-gray-700">• Discount: 10%</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 3: Tier Gold</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>5,000</strong></p>
                            <p className="text-gray-700">• Customer dengan lifetime_points ≥ 5,000 otomatis upgrade ke Gold</p>
                            <p className="text-gray-700">• Discount: 15%</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="font-semibold mb-1">Contoh 4: Tier Platinum</p>
                            <p className="text-gray-700">• Minimum Poin: <strong>10,000</strong></p>
                            <p className="text-gray-700">• Customer dengan lifetime_points ≥ 10,000 otomatis upgrade ke Platinum</p>
                            <p className="text-gray-700">• Discount: 20%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700 font-semibold font-montserrat mb-1">
                          💡 Tips:
                        </p>
                        <ul className="text-xs text-blue-800 font-montserrat space-y-1 list-disc list-inside">
                          <li>Kosongkan field ini jika membership ini <strong>hanya bisa dibeli langsung</strong> (shortcut only)</li>
                          <li>Set minimum poin dari yang <strong>terkecil ke terbesar</strong> (0, 1000, 5000, 10000)</li>
                          <li>Tier akan <strong>otomatis upgrade</strong> saat customer mencapai minimum poin</li>
                          <li>Jika customer punya <strong>paid membership aktif</strong>, tier tidak akan auto-upgrade sampai paid membership expire</li>
                          <li>Setelah paid membership expire, tier akan <strong>re-evaluate</strong> berdasarkan lifetime_points saat ini</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {errors.min_points && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{errors.min_points.message}</span>
                  </div>
                )}
              </div>
                
                {/* Validation Summary */}
                {!isValid && (
                  <div className="px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400 text-sm">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 font-montserrat">
                          Mohon lengkapi semua field yang wajib diisi untuk melanjutkan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isValid || isSubmitting
                      ? 'bg-gray-300 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 border-2 border-blue-500 text-white hover:bg-blue-600 hover:border-blue-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

      {/* Explanation Modal */}
      <MembershipExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />

      {/* Detail Modal */}
      <MembershipDetailModal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        membershipId={selectedMembershipId}
      />

    </div>
  );
};

export default MembershipManagement;
