import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import {searchItems} from '../ORDER/api/orderApi';
import instance from '../../config/api';
import {FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaSearch} from 'react-icons/fa';

const ItemManagement = ({ isFromAdmin = false }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  
  // State untuk search dengan relevansi
  const [searchItemInput, setSearchItemInput] = useState('');
  const [searchItemResults, setSearchItemResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    color: '',
    material: '',
    type: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    brand: '',
    color: '',
    material: '',
    type: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk modal penjelasan
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    if (tenantId) {
      fetchItems(1, true); // Reset to page 1 and clear existing items
    }
  }, [tenantId]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm]);

  const fetchItems = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      const response = await instance.get('/items', {
        params: {
          page: page,
          pageSize: 10,
          search: searchTerm || undefined
        }
      });
      
      const responseData = response.data.data;
      
      if (reset) {
        setItems(responseData.items || []);
        setPagination(responseData.pagination || pagination);
      } else {
        // Append new items for load more
        setItems(prevItems => [...prevItems, ...(responseData.items || [])]);
        setPagination(responseData.pagination || pagination);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ ItemManagement - Error fetching items:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  // Validation functions
  const validateField = (field, value, allValues = {}) => {
    let error = '';
    const trimmedValue = value?.toString().trim() || '';
    
    switch (field) {
      case 'name':
        if (!trimmedValue) {
          error = 'Nama item wajib diisi';
        } else if (trimmedValue.length < 2) {
          error = 'Nama item minimal 2 karakter';
        } else if (trimmedValue.length > 100) {
          error = 'Nama item maksimal 100 karakter';
        } 
        break;
        
      case 'brand':
        if (trimmedValue && trimmedValue.length > 0) {
          if (trimmedValue.length < 2) {
            error = 'Brand minimal 2 karakter';
          } else if (trimmedValue.length > 50) {
            error = 'Brand maksimal 50 karakter';
          } 
        }
        break;
        
      case 'color':
        if (trimmedValue && trimmedValue.length > 0) {
          if (trimmedValue.length < 2) {
            error = 'Warna minimal 2 karakter';
          } else if (trimmedValue.length > 30) {
            error = 'Warna maksimal 30 karakter';
          } 
        }
        break;
        
      case 'material':
        if (trimmedValue && trimmedValue.length > 0) {
          if (trimmedValue.length < 2) {
            error = 'Material minimal 2 karakter';
          } else if (trimmedValue.length > 50) {
            error = 'Material maksimal 50 karakter';
          } 
        }
        break;
        
      case 'type':
        if (trimmedValue && trimmedValue.length > 0) {
          if (trimmedValue.length < 2) {
            error = 'Tipe minimal 2 karakter';
          } else if (trimmedValue.length > 30) {
            error = 'Tipe maksimal 30 karakter';
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
    
    // Validate required fields
    const requiredFields = ['name'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      errors[field] = error;
      if (error) isValid = false;
    });
    
    // Validate optional fields
    const optionalFields = ['brand', 'color', 'material', 'type'];
    optionalFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      errors[field] = error;
      // Don't set isValid to false for optional field errors
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
      brand: '',
      color: '',
      material: '',
      type: ''
    });
    setFormErrors({
      name: '',
      brand: '',
      color: '',
      material: '',
      type: ''
    });
    setIsFormValid(false);
    setIsSubmitting(false);
  };

  // Open create modal with reset state
  const openCreateModal = () => {
    resetFormState();
    setEditingItem(null);
    setShowCreateModal(true);
  };

  // Open edit modal with reset state
  const openEditModal = (item) => {
    setEditingItem(item);
    const initialForm = {
      name: item.name || '',
      brand: item.brand || '',
      color: item.color || '',
      material: item.material || '',
      type: item.type || 'Shoes'
    };
    setFormData(initialForm);
    
    // Reset validation state
    setFormErrors({
      name: '',
      brand: '',
      color: '',
      material: '',
      type: ''
    });
    
    // Validate initial form
    const { isValid } = validateForm(initialForm);
    setIsFormValid(isValid);
    setIsSubmitting(false);
    
    setShowEditModal(true);
  };

  // Close create modal with state reset
  const closeCreateModal = () => {
    resetFormState();
    setShowCreateModal(false);
  };

  // Close edit modal with state reset
  const closeEditModal = () => {
    resetFormState();
    setEditingItem(null);
    setShowEditModal(false);
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
      
      const itemData = {
        ...formData,
        tenant_id: tenantId
      };

      await instance.post('/items', itemData);
      setShowCreateModal(false);
      
      // Reset form and validation state
      resetFormState();
      
      fetchItems(1, true); // Reset to page 1 after creating
      alert('Item berhasil dibuat');
    } catch (error) {
      console.error('❌ ItemManagement - Error creating item:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal membuat item';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !loadingMore) {
      fetchItems(currentPage + 1, false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Reset to page 1 when searching
    fetchItems(1, true);
  };

  // Search item dengan relevansi (Enter key trigger)
  const handleItemSearch = async (val, e) => {
    setSearchItemInput(val);
    if (e && e.key === 'Enter' && val) {
      try {
        setShowSearchResults(true);
        const response = await searchItems(val);
        
        // Handle response structure (bisa array atau object dengan pagination)
        const results = Array.isArray(response) ? response : (response?.items || []);
        const paginationInfo = response?.pagination || null;
        
        setSearchItemResults(results);
        
        // Show info message if available
      } catch (err) {
        setSearchItemResults([]);
      }
    }
    if (!val) {
      setSearchItemResults([]);
      setShowSearchResults(false);
    }
  };

  // Handler pilih item dari search results
  const handleSelectSearchItem = (selectedItem) => {
    setSearchItemInput(selectedItem.name);
    setSearchItemResults([]);
    setShowSearchResults(false);
    
    // Set form data untuk edit
    setFormData({
      name: selectedItem.name || '',
      brand: selectedItem.brand || '',
      color: selectedItem.color || '',
      material: selectedItem.material || '',
      type: selectedItem.type || ''
    });
    
    // Buka edit modal dengan item yang dipilih
    openEditModal(selectedItem);
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
      
      const itemData = {
        ...formData,
        tenant_id: tenantId
      };

      await instance.put(`/items/${editingItem.id}`, itemData);
      setShowEditModal(false);
      setEditingItem(null);
      
      // Reset form and validation state
      resetFormState();
      
      fetchItems(1, true); // Reset to page 1 after updating
      alert('Item berhasil diperbarui');
    } catch (error) {
      console.error('❌ ItemManagement - Error updating item:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal memperbarui item';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle explanation modal confirmation

  // Handle explanation modal close

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('workStartTime');
    sessionStorage.removeItem('fromPresent');
    sessionStorage.removeItem('fromIzin');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Manajemen Item"
          description="Kelola Item"
          showBackButton={true}
          backPath={isFromAdmin ? "/pengaturan" : "/berandaowner"}
          showUserMenu={true}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data Item...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      {/* Header */}
      <HeaderBerandaOwner
        title="Manajemen Item"
        description="Kelola Item"
        showBackButton={true}
        backPath={isFromAdmin ? "/pengaturan" : "/berandaowner"}
        showUserMenu={true}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-4xl mx-auto mt-16">
            
            {/* Search Bar - Tokopedia Style */}
            {/* <div className="mb-4 md:mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari item..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2.5 pl-10 pr-4 md:px-4 md:py-3 md:pl-12 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-montserrat text-sm placeholder-gray-400"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 md:left-4 md:w-4 md:h-4 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div> */}

            {/* Search dengan Relevansi - Tokopedia Style */}
            <div className="mb-4 md:mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari item dengan relevansi..."
                  value={searchItemInput}
                  onChange={(e) => setSearchItemInput(e.target.value)}
                  onKeyDown={(e) => handleItemSearch(e.target.value, e)}
                  className="w-full px-3 py-2.5 pl-10 pr-4 md:px-4 md:py-3 md:pl-12 bg-blue-50 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-montserrat text-sm placeholder-gray-400"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 md:left-4 md:w-4 md:h-4 text-blue-400" />
                {searchItemInput && (
                  <button
                    onClick={() => {
                      setSearchItemInput('');
                      setSearchItemResults([]);
                      setShowSearchResults(false);
                    }}
                    className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              
              {/* No Results */}
              {showSearchResults && searchItemResults.length === 0 && searchItemInput && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-blue-200 rounded-b-xl shadow-lg z-10 mt-1">
                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                    Tidak ada item yang ditemukan
                  </div>
                </div>
              )}
            </div>

            {/* Display Search Results or All Items */}
            {showSearchResults && searchItemResults.length > 0 ? (
              <div className="mb-4 md:mb-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🔍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-800">Hasil Pencarian</h3>
                      <p className="text-blue-600 text-sm">
                        {searchItemResults.length} item ditemukan
                        {searchItemResults.length === 50 && (
                          <span className="ml-2 text-blue-500 text-xs">
                            (menampilkan 50 hasil teratas)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 md:mb-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📦</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Semua Item</h3>
                      <p className="text-gray-600 text-sm">{pagination.totalItems || 0} item tersedia</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Tokopedia Style */}
            <div className="mb-4 md:mb-6 flex gap-3">
              {/* Add Button - Primary */}
              <button
                onClick={openCreateModal}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FaPlus className="w-3 h-3" />
                </div>
                <span>Tambah Item</span>
              </button>
              
            </div>

            {/* Items List - Tokopedia Style */}
            <div className="space-y-4">
              {(() => {
                // Tentukan data yang akan ditampilkan
                const displayData = showSearchResults && searchItemResults.length > 0 
                  ? searchItemResults 
                  : filteredItems;
                
                return displayData.length === 0 ? (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📦</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {searchTerm || (showSearchResults && searchItemInput) ? 'Tidak ada item yang ditemukan' : 'Belum ada data item'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchTerm || (showSearchResults && searchItemInput) ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan item pertama'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {displayData.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
                      {/* Mobile Layout */}
                      <div className="block md:hidden">
                        {/* Header with status */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-800 text-sm flex-1 min-w-0 pr-2">
                            {item.name}
                          </h3>
                          {/* <div className="flex flex-col gap-1 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                              item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.is_active !== false ? 'Aktif' : 'Nonaktif'}
                            </span>
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-blue-100 text-blue-800">
                              {item.type}
                            </span>
                          </div> */}
                        </div>
                        
                        {/* Item details */}
                        <div className="mb-3 space-y-1">
                          {item.brand && (
                            <div className="text-xs text-gray-600 font-medium">
                              <span className="font-semibold">Brand:</span> {item.brand}
                            </div>
                          )}
                          {item.color && (
                            <div className="text-xs text-gray-600 font-medium">
                              <span className="font-semibold">Warna:</span> {item.color}
                            </div>
                          )}
                          {item.material && (
                            <div className="text-xs text-gray-600 font-medium">
                              <span className="font-semibold">Material:</span> {item.material}
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons - horizontal on mobile */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="w-full px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            <FaEdit className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="flex items-start justify-between">
                          {/* Left Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-gray-800 text-base truncate">
                                {item.name}
                              </h3>
                              <div className="flex gap-2 ml-3">
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                  item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                </span>
                                <span className="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-blue-100 text-blue-800">
                                  {item.type}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              {item.brand && (
                                <div className="font-medium">
                                  <span className="font-semibold">Brand:</span> {item.brand}
                                </div>
                              )}
                              {item.color && (
                                <div className="font-medium">
                                  <span className="font-semibold">Warna:</span> {item.color}
                                </div>
                              )}
                              {item.material && (
                                <div className="font-medium">
                                  <span className="font-semibold">Material:</span> {item.material}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Right Actions */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-4 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center gap-2"
                            >
                              <FaEdit className="w-3 h-3" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button - Tokopedia Style - Hidden when search results are active */}
                  {!showSearchResults && pagination.hasNextPage && (
                    <div className="text-center mt-6">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-3 bg-gray-50 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        {loadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            Memuat...
                          </>
                        ) : (
                          `Muat Lebih Banyak (${pagination.totalItems - items.length} tersisa)`
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Pagination Info - Tokopedia Style - Hidden when search results are active */}
                  {!showSearchResults && pagination.totalItems > 0 && (
                    <div className="text-center mt-4 text-sm text-gray-500 font-medium">
                      Menampilkan {items.length} dari {pagination.totalItems} item
                    </div>
                  )}
                </div>
              );
            })()}
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
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">Tambah Item Baru</h2>
              <button
                onClick={closeCreateModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div 
              className="p-6 space-y-4 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Item *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm placeholder-gray-400 ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Contoh: Air Force 1, Converse All Star"
                />
                {formErrors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.name}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Nike, Adidas, Converse"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Warna
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Putih, Hitam, Biru"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => handleFieldChange('material', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Leather, Canvas, Mesh"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipe
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Sneakers, Sport, Running"
                />
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
            
            {/* Modal Footer - Fixed */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <button
                onClick={closeCreateModal}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isFormValid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">Edit Item</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div 
              className="p-6 space-y-4 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Item *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 text-sm placeholder-gray-400 ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Contoh: Air Force 1, Converse All Star"
                />
                {formErrors.name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.name}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Nike, Adidas, Converse"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Warna
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Putih, Hitam, Biru"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => handleFieldChange('material', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Leather, Canvas, Mesh"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipe
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder="Contoh: Sneakers, Sport, Running"
                />
              </div>
            </div>
            
            {/* Modal Footer - Fixed */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <button
                onClick={closeEditModal}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleUpdate}
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isFormValid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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

    </div>
  );
};

export default ItemManagement;
