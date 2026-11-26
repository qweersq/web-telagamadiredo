import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Percent, DollarSign } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import PromoExplanationModal from '../../components/Modal/PromoExplanationModal';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';

const DiscountManagement = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'inactive'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'percent',
    discount: ''
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    type: '',
    discount: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if explanation modal has been shown before
  useEffect(() => {
    const hasSeenExplanation = localStorage.getItem('promo-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  // Fetch tenant_id from API
  useEffect(() => {
    const loadTenantId = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
        }
      } catch (error) {
        console.error('❌ DiscountManagement - Failed to load tenant ID:', error);
      }
    };
    
    loadTenantId();
  }, []);

  // Fetch discounts when tenantId changes
  useEffect(() => {
    if (tenantId) {
      fetchDiscounts();
    }
  }, [tenantId]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get('/discounts', {
        params: {
          tenant_id: tenantId
        }
      });
      setDiscounts(data.data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    // Final validation before submission
    const { errors, isValid } = validateForm(formData);
    setFormErrors(errors);
    
    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum menyimpan');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        discount: parseFormattedNumber(formData.discount), // Parse formatted value to numeric
        tenant_id: tenantId
      };
      await instance.post('/discounts', payload);
      setShowCreateModal(false);
      
      // Reset form and validation state
      resetFormState();
      
      fetchDiscounts();
      alert('Promo berhasil dibuat');
    } catch (error) {
      console.error('Error creating discount:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal membuat promo';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdate = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    // Final validation before submission
    const { errors, isValid } = validateForm(formData);
    setFormErrors(errors);
    
    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum menyimpan');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        discount: parseFormattedNumber(formData.discount), // Parse formatted value to numeric
        tenant_id: tenantId
      };
      await instance.put(`/discounts/${editingDiscount.id}`, payload);
      setEditingDiscount(null);
      
      // Reset form and validation state
      resetFormState();
      
      fetchDiscounts();
      alert('Promo berhasil diperbarui');
    } catch (error) {
      console.error('Error updating discount:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal memperbarui promo';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleToggleStatus = async (discount) => {
    try {
      await instance.patch(`/discounts/${discount.id}/toggle-status`);
      fetchDiscounts();
    } catch (error) {
      console.error('Error toggling discount status:', error);
    }
  };

  // Handle explanation modal
  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };

  const handleExplanationConfirm = () => {
    localStorage.setItem('promo-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  // Format number with dots as thousand separators (Indonesian format)
  const formatNumberWithDots = (value) => {
    if (!value) return '';
    
    // Handle decimal format from database (e.g., "15000.00" -> "15000")
    let cleanValue = value.toString();
    
    // If it's a decimal number, remove the decimal part
    if (cleanValue.includes('.')) {
      cleanValue = cleanValue.split('.')[0];
    }
    
    // Remove all non-numeric characters
    const numericValue = cleanValue.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format with dots
    const number = parseInt(numericValue, 10);
    // Use simple formatting for smaller numbers to avoid scientific notation
    if (number >= 1000) {
      return number.toLocaleString('id-ID');
    } else {
      return number.toString();
    }
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return '';
    return formattedValue.replace(/\./g, '');
  };

  // Handle discount input change
  const handleDiscountChange = (value) => {
    // Remove all non-numeric characters
    const cleanValue = value.replace(/\D/g, '');
    
    // Only format if we have a clean numeric value
    if (cleanValue) {
      const number = parseInt(cleanValue, 10);
      const formatted = number.toLocaleString('id-ID');
      setFormData(prev => ({ ...prev, discount: formatted }));
    } else {
      setFormData(prev => ({ ...prev, discount: '' }));
    }
  };

  // Validation functions
  const validateField = (field, value, allValues = {}) => {
    let error = '';
    const trimmedValue = value?.toString().trim() || '';
    
    switch (field) {
      case 'name':
        if (!trimmedValue) {
          error = 'Nama promo wajib diisi';
        } else if (trimmedValue.length < 2) {
          error = 'Nama promo minimal 2 karakter';
        } else if (trimmedValue.length > 100) {
          error = 'Nama promo maksimal 100 karakter';
        }
        // Removed character validation - allow any characters
        break;
        
      case 'type':
        if (!trimmedValue) {
          error = 'Tipe promo wajib dipilih';
        } else if (!['percent', 'nominal'].includes(trimmedValue)) {
          error = 'Tipe promo tidak valid';
        }
        break;
        
      case 'discount':
        if (!trimmedValue) {
          error = 'Nilai promo wajib diisi';
        } else {
          const cleanValue = trimmedValue.replace(/\./g, '');
          const numericValue = parseInt(cleanValue, 10);
          if (isNaN(numericValue) || numericValue <= 0) {
            error = 'Nilai promo harus berupa angka positif';
          } else {
            // Additional validation based on type
            const currentType = allValues.type || formData.type;
            if (currentType === 'percent' && numericValue > 100) {
              error = 'Persentase tidak boleh lebih dari 100%';
            } else if (currentType === 'nominal' && numericValue < 1000) {
              error = 'Nominal minimal Rp 1.000';
            }
          }
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  const validateForm = (formData) => {
    const errors = {};
    let isValid = true;
    
    // Validate all required fields
    const requiredFields = ['name', 'type', 'discount'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      errors[field] = error;
      if (error) isValid = false;
    });
    
    return { errors, isValid };
  };

  const handleFieldChange = (field, value) => {
    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate field in real-time
    const error = validateField(field, value, { ...formData, [field]: value });
    setFormErrors(prev => ({ ...prev, [field]: error }));
    
    // Check overall form validity
    const updatedForm = { ...formData, [field]: value };
    const { isValid } = validateForm(updatedForm);
    setIsFormValid(isValid);
  };

  // Reset form state function
  const resetFormState = () => {
    setFormData({
      name: '',
      type: 'percent',
      discount: ''
    });
    setFormErrors({
      name: '',
      type: '',
      discount: ''
    });
    setIsFormValid(false);
    setIsSubmitting(false);
  };

  // Open create modal with reset state
  const openCreateModal = () => {
    resetFormState();
    setEditingDiscount(null);
    setShowCreateModal(true);
  };

  // Open edit modal with reset state
  const openEditModal = (discount) => {
    setEditingDiscount(discount);
    const initialForm = {
      name: discount.name || '',
      type: discount.type || 'percent',
      discount: formatNumberWithDots(discount.discount.toString())
    };
    setFormData(initialForm);
    
    // Reset validation state
    setFormErrors({
      name: '',
      type: '',
      discount: ''
    });
    
    // Validate initial form
    const { isValid } = validateForm(initialForm);
    setIsFormValid(isValid);
    setIsSubmitting(false);
    
    setShowCreateModal(false); // Close create modal if open
  };

  // Close create modal with state reset
  const closeCreateModal = () => {
    resetFormState();
    setShowCreateModal(false);
  };

  // Close edit modal with state reset
  const closeEditModal = () => {
    resetFormState();
    setEditingDiscount(null);
  };

  // Filter discounts based on active tab
  const filteredDiscounts = discounts.filter(discount => {
    if (activeTab === 'active') return discount.is_active;
    if (activeTab === 'inactive') return !discount.is_active;
    return true;
  });

  // Filter by search term
  const searchFilteredDiscounts = filteredDiscounts.filter(discount =>
    discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count discounts by status
  const activeCount = discounts.filter(d => d.is_active).length;
  const inactiveCount = discounts.filter(d => !d.is_active).length;

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner 
          title="Manajemen Promo" 
          description="Kelola Promo"
          showBackButton={true}
          backPath="/berandaowner"
          showUserMenu={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data Promo...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Manajemen Promo" 
        description="Kelola Promo"
        showBackButton={true}
        fromBerandaOwner={true}
        showUserMenu={true}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-4xl mx-auto mt-16">

            {/* Action Buttons - Tokopedia Style */}
            <div className="mb-6 flex gap-3">
              {/* Add Button - Primary */}
              <button
                onClick={openCreateModal}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                <span>Tambah Promo</span>
              </button>
              
              {/* Help Button - Secondary */}
              <button
                onClick={() => setShowExplanationModal(true)}
                className="px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center justify-center"
                title="Bantuan & Panduan Promo"
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
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Semua Promo</h3>
                    <p className="text-gray-600 text-sm">{discounts.length} promo tersedia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar - Tokopedia Style */}
            <div className="bg-white rounded-xl border-2 border-gray-100 p-4 md:p-6 mb-6 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari promo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Tabs - Tokopedia Style */}
            <div className="bg-white rounded-xl border-2 border-gray-100 p-2 mb-6 shadow-sm">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'active'
                      ? 'bg-blue-50 text-blue-600 shadow-sm border-2 border-blue-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activeTab === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                    Aktif
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'inactive'
                      ? 'bg-red-50 text-red-600 shadow-sm border-2 border-red-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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


            {/* Discount List - Tokopedia Style */}
            <div className="space-y-4">
              {searchFilteredDiscounts.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Percent className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm ? 'Tidak ada promo yang ditemukan' : 'Belum ada data promo'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan promo pertama'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchFilteredDiscounts.map((discount) => (
                    <div key={discount.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
                      {/* Mobile Layout */}
                      <div className="block md:hidden">
                        {/* Header with name, value, and type in one row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-md truncate">
                              {discount.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {discount.type === 'percent' ? `${discount.discount}%` : `Rp ${formatNumberWithDots(discount.discount.toString())}`}
                              </div>
                                <div className="flex items-center justify-end gap-1 text-xs text-gray-600">
                                  {/* {discount.type === 'percent' ? (
                                    <Percent className="w-3 h-3" />
                                  ) : (
                                    <DollarSign className="w-3 h-3" />
                                  )} */}
                                  <span className="font-medium">
                                    {discount.type === 'percent' ? 'Percent' : 'Nominal'}
                                  </span>
                                </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        {/* <div className="mb-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {discount.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div> */}
                        
                        {/* Action buttons - horizontal on mobile */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(discount)}
                            className="flex-1 px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(discount)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                              discount.is_active 
                                ? 'bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300' 
                                : 'bg-green-50 border-2 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'
                            }`}
                            title={discount.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {discount.is_active ? (
                              <>
                                <ToggleRight className="w-3 h-3" />
                                Nonaktif
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3 h-3" />
                                Aktifkan
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="flex items-center justify-between">
                          {/* Left Content - Name, Value, and Type in one row */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-gray-800 text-base truncate flex-1 min-w-0">
                                {discount.name}
                              </h3>
                              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                {/* Discount Value and Type */}
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {discount.type === 'percent' ? `${discount.discount}%` : `Rp ${formatNumberWithDots(discount.discount.toString())}`}
                                  </div>
                                    <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                      {/* {discount.type === 'percent' ? (
                                        <Percent className="w-4 h-4" />
                                      ) : (
                                        <DollarSign className="w-4 h-4" />
                                      )} */}
                                      <span className="font-medium">
                                        {discount.type === 'percent' ? 'Percent' : 'Nominal'}
                                      </span>
                                    </div>
                                </div>
                                
                                {/* Status Badges */}
                                <div className="flex gap-2">
                                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                    discount.type === 'percent' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {discount.type === 'percent' ? 'Persentase' : 'Nominal'}
                                  </span>
                                  {/* <span className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                    discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {discount.is_active ? 'Aktif' : 'Nonaktif'}
                                  </span> */}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Actions */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => openEditModal(discount)}
                              className="px-4 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center gap-2"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(discount)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                                discount.is_active 
                                  ? 'bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300' 
                                  : 'bg-green-50 border-2 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'
                              }`}
                              title={discount.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {discount.is_active ? (
                                <>
                                  <ToggleRight className="w-3 h-3" />
                                  Nonaktif
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-3 h-3" />
                                  Aktifkan
                                </>
                              )}
                            </button>
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

      {/* Create Modal */}
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
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">Tambah Promo</h2>
              <button
                onClick={closeCreateModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div 
              className="p-6 space-y-4 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Nama Promo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Masukkan nama promo"
                />
                {formErrors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.name}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Tipe Promo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    handleFieldChange('type', e.target.value);
                    // Reset discount value when type changes to avoid confusion
                    handleFieldChange('discount', '');
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Nilai Promo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.discount}
                    onChange={(e) => {
                      handleDiscountChange(e.target.value);
                      handleFieldChange('discount', e.target.value);
                    }}
                    className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                      formErrors.discount
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder={formData.type === 'percent' ? '10' : '10000'}
                    inputMode="numeric"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                    {formData.type === 'percent' ? '%' : 'Rp'}
                  </div>
                </div>
                {formErrors.discount && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.discount}</span>
                  </div>
                )}
              </div>
              
              {/* Validation Summary */}
              {!isFormValid && (
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
                onClick={closeCreateModal}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl transition-colors text-sm font-semibold flex items-center justify-center gap-2 ${
                  !isFormValid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDiscount && (
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
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">Edit Promo</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div 
              className="p-6 space-y-4 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Nama Promo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Masukkan nama promo"
                />
                {formErrors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.name}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Tipe Promo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    handleFieldChange('type', e.target.value);
                    // Reset discount value when type changes to avoid confusion
                    handleFieldChange('discount', '');
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Nilai Promo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.discount}
                    onChange={(e) => {
                      handleDiscountChange(e.target.value);
                      handleFieldChange('discount', e.target.value);
                    }}
                    className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-gray-50 font-medium ${
                      formErrors.discount
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder={formData.type === 'percent' ? '10' : '10000'}
                    inputMode="numeric"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                    {formData.type === 'percent' ? '%' : 'Rp'}
                  </div>
                </div>
                {formErrors.discount && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.discount}</span>
                  </div>
                )}
              </div>
              
              {/* Validation Summary */}
              {!isFormValid && (
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
                onClick={closeEditModal}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleUpdate}
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl transition-colors text-sm font-semibold flex items-center justify-center gap-2 ${
                  !isFormValid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <PromoExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />

    </div>
  );
};

export default DiscountManagement;
