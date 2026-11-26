import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import {FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaSearch} from 'react-icons/fa';
import {Ticket, Package, Boxes, Check} from 'lucide-react';
import {stockService} from '../../services/stockService';
import {branchService} from '../../services/branchService';
const TreatmentManagement = () => {
  const navigate = useNavigate();
  // Semua data diambil sekaligus supaya angka di tab kategori akurat
  const ALL_PAGE_SIZE = 1000;
  // Field "Lini Bisnis" & "Jenis Tiket / Paket" disembunyikan; nilainya memakai default.
  const SHOW_TYPE_FIELDS = false;
  const DEFAULT_SERVICE_TYPE = 'Wisata';
  const DEFAULT_ITEM_TYPE = 'Tiket';
  const DEFAULT_PRODUCT_SERVICE = 'Makanan';
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'inactive'
  const [activeCategory, setActiveCategory] = useState(''); // '' = semua kategori
  const [tenantId, setTenantId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    type_item: DEFAULT_ITEM_TYPE,
    type_service: DEFAULT_SERVICE_TYPE,
    category_id: '',
    description: '',
    requires_tracking: true,
    production_mode: 'outlet',
    production_branch_id: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    type_item: '',
    type_service: '',
    price: '',
    description: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mode form: tiket/paket wisata atau produk barang fisik
  const [itemKind, setItemKind] = useState('paket'); // 'paket' | 'produk'

  // Stok awal (hanya untuk produk baru, sekali saat dibuat)
  const [manageStock, setManageStock] = useState(false);
  const [branches, setBranches] = useState([]);
  const [stockBranchId, setStockBranchId] = useState('');
  const [stockQty, setStockQty] = useState('0');
  const [stockMin, setStockMin] = useState('5');

  // State untuk dropdown type_item
  const [isCustomTypeItem, setIsCustomTypeItem] = useState(false);
  const [customTypeItem, setCustomTypeItem] = useState('');

  // State untuk dropdown type_service
  const [isCustomTypeService, setIsCustomTypeService] = useState(false);
  const [customTypeService, setCustomTypeService] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');

  // State untuk options dari API
  const [typeItemOptions, setTypeItemOptions] = useState([]);
  const [typeServiceOptions, setTypeServiceOptions] = useState([]);
  const [productCategoryOptions, setProductCategoryOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // State untuk modal penjelasan

  // Pagination states
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
      fetchTreatments(); // Reset to page 1 and clear existing treatments
    }
  }, [tenantId]);

  // Fetch options from API
  const fetchOptions = async () => {
    if (!tenantId) return;

    setLoadingOptions(true);
    try {
      const { data } = await instance.get('/treatments/options', {
        params: { tenant_id: tenantId }
      });

      if (data && data.data) {
        setTypeItemOptions(data.data.type_items || []);
        setTypeServiceOptions(data.data.type_services || []);
      }
    } catch (error) {
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch options when tenantId changes
  useEffect(() => {
    if (tenantId) {
      fetchOptions();
    }
  }, [tenantId]);

  // Kategori produk dari tabel product_categories (dipakai di dropdown modal)
  const fetchProductCategories = async () => {
    try {
      const { data } = await instance.get('/product-categories/options');
      setProductCategoryOptions(data?.data || []);
    } catch (error) {
      console.error('❌ TreatmentManagement - Failed to load product categories:', error);
      setProductCategoryOptions([]);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchProductCategories();
    }
  }, [tenantId]);

  // Outlet untuk penempatan stok awal produk
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchService.getBranches();
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setBranches(list);
        if (list.length > 0) setStockBranchId(String(list[0].id));
      } catch {
        setBranches([]);
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    filterTreatments();
  }, [treatments, activeTab, activeCategory]);

  // Kalau kategori terpilih dihapus / dinonaktifkan, kembalikan ke "Semua"
  useEffect(() => {
    if (!activeCategory) return;
    const exists = productCategoryOptions.some(
      (option) => String(option.value) === String(activeCategory)
    );
    if (!exists) setActiveCategory('');
  }, [productCategoryOptions, activeCategory]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);

      const collected = [];
      let pageNumber = 1;
      let lastPagination = pagination;

      // Ambil seluruh halaman sekaligus supaya hitungan di tab kategori akurat
      while (pageNumber <= 50) {
        const { data } = await instance.get('/treatments', {
          params: {
            tenant_id: tenantId,
            page: pageNumber,
            pageSize: ALL_PAGE_SIZE,
            search: searchTerm || undefined
          }
        });

        const payload = data.data;

        // Fallback: response array lama tanpa pagination
        if (Array.isArray(payload)) {
          setTreatments(payload);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: payload.length,
            itemsPerPage: payload.length,
            hasNextPage: false,
            hasPrevPage: false
          });
          return;
        }

        const list = payload?.treatments || [];
        collected.push(...list);
        lastPagination = payload?.pagination || lastPagination;

        if (!lastPagination?.hasNextPage || list.length === 0) break;
        pageNumber += 1;
      }

      setTreatments(collected);
      setPagination({
        ...lastPagination,
        currentPage: 1,
        totalItems: collected.length,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (error) {
      console.error('❌ TreatmentManagement - Failed to load treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTreatments = () => {
    let filtered = treatments;

    // Filter by active status
    if (activeTab === 'active') {
      filtered = filtered.filter(treatment => treatment.is_active);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(treatment => !treatment.is_active);
    }

    // Filter by kategori produk
    if (activeCategory) {
      filtered = filtered.filter(
        (treatment) => String(treatment.category_id ?? '') === String(activeCategory)
      );
    }

    setFilteredTreatments(filtered);
  };

  const isProductMode = itemKind === 'produk';

  const handleItemKindChange = (kind) => {
    if (kind === itemKind) return;

    setIsCustomTypeService(false);
    setCustomTypeService('');
    setIsCustomTypeItem(false);
    setCustomTypeItem('');

    const newForm = kind === 'produk'
      ? { ...formData, requires_tracking: false, type_service: DEFAULT_PRODUCT_SERVICE, type_item: DEFAULT_PRODUCT_SERVICE, category_id: '', unit: formData.unit || 'pcs' }
      : { ...formData, requires_tracking: true, type_service: DEFAULT_SERVICE_TYPE, type_item: DEFAULT_ITEM_TYPE, category_id: '', unit: '' };

    setItemKind(kind);
    setFormData(newForm);
    if (kind === 'produk') setManageStock(true);
    else setManageStock(false);

    const { errors, isValid } = validateForm(newForm, kind);
    setFormErrors(errors);
    setIsFormValid(isValid);
  };

  const handleCreate = async () => {
    // Prevent double submission
    if (isSubmitting) return;

    // Final validation before submission
    const { errors, isValid } = validateForm(formData, itemKind);
    setFormErrors(errors);

    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum menyimpan');
      return;
    }

    try {
      setIsSubmitting(true);

      const generatedName = generateServiceName(formData.name, formData.type_item, formData.type_service);

      const payload = {
        ...formData,
        name: generatedName,
        unit: isProductMode ? (formData.unit || 'pcs') : '',
        tenant_id: tenantId,
        requires_tracking: isProductMode ? false : formData.requires_tracking !== false,
        type_item: isProductMode ? formData.type_service : formData.type_item,
        type_service: formData.type_service || (isProductMode ? 'Makanan' : 'Wisata'),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        production_branch_id: formData.production_branch_id ? Number(formData.production_branch_id) : null
      };

      const created = await instance.post('/treatments', payload);
      const createdId = created?.data?.data?.id;

      // Stok awal hanya bisa diset sekali saat produk dibuat.
      if (isProductMode && manageStock && createdId && stockBranchId) {
        try {
          await stockService.startTracking({
            branchId: Number(stockBranchId),
            treatmentId: createdId,
            stock: Number(stockQty) || 0,
            minStock: Number(stockMin) || 0
          });
        } catch (stockError) {
          const stockMessage = stockError?.response?.data?.error?.message
            || 'Produk tersimpan, tetapi stok awal gagal diset. Atur lewat menu Stok Barang.';
          alert(stockMessage);
        }
      }

      setShowCreateModal(false);

      // Reset form and validation state
      resetFormState();

      fetchTreatments(); // Reset to page 1 after creating
      fetchOptions(); // Refresh options
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Gagal membuat layanan';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    // Prevent double submission
    if (isSubmitting) return;

    // Final validation before submission
    const { errors, isValid } = validateForm(formData, itemKind);
    setFormErrors(errors);

    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum menyimpan');
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate nama layanan
      const generatedName = generateServiceName(formData.name, formData.type_item, formData.type_service);

      const payload = {
        ...formData,
        name: generatedName,
        unit: isProductMode ? (formData.unit || 'pcs') : '',
        tenant_id: tenantId,
        requires_tracking: isProductMode ? false : formData.requires_tracking !== false,
        type_item: isProductMode ? formData.type_service : formData.type_item,
        type_service: formData.type_service || (isProductMode ? 'Makanan' : 'Wisata'),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        production_branch_id: formData.production_branch_id ? Number(formData.production_branch_id) : null
      };
      await instance.put(`/treatments/${editingTreatment.id}`, payload);
      setShowEditModal(false);
      setEditingTreatment(null);

      // Reset form and validation state
      resetFormState();

      fetchTreatments(); // Reset to page 1 after updating
      fetchOptions(); // Refresh options
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Gagal memperbarui layanan';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSearchSubmit = () => {
    if (tenantId) {
      fetchTreatments(); // Reset to page 1 when searching
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleToggleStatus = async (treatmentId) => {
    try {
      await instance.patch(`/treatments/${treatmentId}/toggle-status`);
      fetchTreatments(); // Reset to page 1 after toggling status
      fetchOptions(); // Refresh options
    } catch (error) {
      alert('Gagal mengubah status treatment');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Format number with dots as thousand separators (Indonesian format)
  const formatNumberWithDots = (value) => {
    if (!value) return '';
    // Remove all non-numeric characters
    const numericValue = value.toString().replace(/\D/g, '');
    if (!numericValue) return '';

    // Convert to number and format with dots
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('id-ID');
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return '';
    return formattedValue.replace(/\./g, '');
  };

  // Validation functions
  const validateField = (field, value, allValues = {}) => {
    let error = '';
    const trimmedValue = value?.toString().trim() || '';

    switch (field) {
      case 'name':
        if (!trimmedValue) {
          error = 'Nama wajib diisi';
        } else if (trimmedValue.length < 2) {
          error = 'Nama minimal 2 karakter';
        } else if (trimmedValue.length > 80) {
          error = 'Nama maksimal 80 karakter';
        }
        break;

      case 'type_item':
        if (!trimmedValue) {
          error = 'Jenis item wajib diisi';
        } else if (trimmedValue.length < 2) {
          error = 'Jenis item minimal 2 karakter';
        } else if (trimmedValue.length > 50) {
          error = 'Jenis item maksimal 50 karakter';
        } 
        break;

      case 'type_service':
        if (!trimmedValue) {
          error = 'Lini bisnis wajib dipilih';
        } else if (trimmedValue.length < 2) {
          error = 'Lini bisnis minimal 2 karakter';
        } else if (trimmedValue.length > 50) {
          error = 'Lini bisnis maksimal 50 karakter';
        }
        break;

      case 'price':
        if (!trimmedValue) {
          error = 'Harga wajib diisi';
        } else {
          const numericValue = parseInt(trimmedValue, 10);
          if (isNaN(numericValue) || numericValue <= 0) {
            error = 'Harga harus berupa angka positif';
          } else if (numericValue < 1000) {
            error = 'Harga minimal Rp 1.000';
          } else if (numericValue > 100000000) {
            error = 'Harga maksimal Rp 100.000.000';
          }
        }
        break;

      case 'description':
        if (trimmedValue && trimmedValue.length > 500) {
          error = 'Deskripsi maksimal 500 karakter';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const validateForm = (formData, kind = itemKind) => {
    const errors = {};
    let isValid = true;

    // Validate required fields
    // mode produk: jenis item diturunkan dari kategori, jadi tidak perlu divalidasi terpisah
    const requiredFields = kind === 'produk'
      ? ['name', 'type_service', 'price']
      : ['name', 'type_item', 'type_service', 'price'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      errors[field] = error;
      if (error) isValid = false;
    });

    // Validate optional fields
    const optionalFields = ['description'];
    optionalFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      errors[field] = error;
      // Don't set isValid to false for optional field errors
    });

    return { errors, isValid };
  };

  // Dapur produksi: 'outlet' = masak di outlet penjual, 'branch:<id>' = dapur outlet lain
  const productionTarget = formData.production_branch_id
    ? `branch:${formData.production_branch_id}`
    : 'outlet';

  const kitchenOutletOptions = branches.filter((branch) => branch.status === 'active');

  const handleProductionTargetChange = (rawValue) => {
    const value = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
    if (!value.startsWith('branch:')) {
      setFormData((prev) => ({ ...prev, production_mode: 'outlet', production_branch_id: '' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      production_mode: 'central',
      production_branch_id: value.slice('branch:'.length),
    }));
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
      unit: '',
      price: '',
      type_item: DEFAULT_ITEM_TYPE,
      type_service: DEFAULT_SERVICE_TYPE,
      category_id: '',
      description: '',
      requires_tracking: true,
      production_mode: 'outlet',
      production_branch_id: ''
    });
    setFormErrors({
      name: '',
      type_item: '',
      type_service: '',
      price: '',
      description: ''
    });
    setIsFormValid(false);
    setIsSubmitting(false);
    setDisplayPrice('');
    setIsCustomTypeItem(false);
    setCustomTypeItem('');
    setIsCustomTypeService(false);
    setCustomTypeService('');
    setItemKind('paket');
    setManageStock(false);
    setStockQty('0');
    setStockMin('5');
  };

  // Open create modal with reset state
  const openCreateModal = () => {
    resetFormState();
    setEditingTreatment(null);
    setShowCreateModal(true);
  };

  // Open edit modal with reset state
  const openEditModal = (treatment) => {
    setEditingTreatment(treatment);
    const priceString = treatment.price.toString();
    const formattedPrice = parseInt(priceString, 10).toLocaleString('id-ID');

    // Produk = punya satuan atau kategorinya kategori barang
    const productCategories = ['Makanan', 'Minuman', 'Snack', 'Souvenir'];
    const isProduct = Boolean(treatment.unit)
      || productCategories.includes(treatment.type_service);
    const kind = isProduct ? 'produk' : 'paket';

    const initialForm = {
      name: treatment.name || '',
      unit: treatment.unit || '',
      price: priceString,
      type_item: isProduct
        ? (treatment.type_item || DEFAULT_PRODUCT_SERVICE)
        : (treatment.type_item || DEFAULT_ITEM_TYPE),
      type_service: treatment.type_service || (isProduct ? DEFAULT_PRODUCT_SERVICE : DEFAULT_SERVICE_TYPE),
      category_id: treatment.category_id ? String(treatment.category_id) : '',
      description: treatment.description || '',
      requires_tracking: isProduct ? false : Boolean(treatment.requires_tracking),
      production_mode: treatment.production_mode || 'outlet',
      production_branch_id: treatment.production_branch_id ? String(treatment.production_branch_id) : ''
    };
    setFormData(initialForm);
    setDisplayPrice(formattedPrice);
    setItemKind(kind);
    setManageStock(false);
    setStockQty('0');
    setStockMin('5');

    // Reset validation state
    setFormErrors({
      name: '',
      type_item: '',
      type_service: '',
      price: '',
      description: ''
    });

    // Validate initial form
    const { isValid } = validateForm(initialForm, kind);
    setIsFormValid(isValid);
    setIsSubmitting(false);

    // Reset custom input states
    setIsCustomTypeItem(false);
    setCustomTypeItem('');
    setIsCustomTypeService(false);
    setCustomTypeService('');

    // Check if type_item is custom
    if (!isProduct && treatment.type_item && !typeItemOptions.some(item => item.value === treatment.type_item) && !getTypeItemOptions().includes(treatment.type_item)) {
      setIsCustomTypeItem(true);
      setCustomTypeItem(treatment.type_item);
    }

    // Check if type_service is custom
    if (!isProduct && treatment.type_service && !typeServiceOptions.some(option => option.value === treatment.type_service) && !getUniqueTypeServices().includes(treatment.type_service)) {
      setIsCustomTypeService(true);
      setCustomTypeService(treatment.type_service);
    }

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
    setEditingTreatment(null);
    setShowEditModal(false);
  };

  // Handle price input change with validation
  const handlePriceChange = (value) => {
    // Remove all non-numeric characters
    const cleanValue = value.replace(/\D/g, '');

    // Only format if we have a clean numeric value
    if (cleanValue) {
      const number = parseInt(cleanValue, 10);
      const formatted = number.toLocaleString('id-ID');
      setDisplayPrice(formatted);
      handleFieldChange('price', cleanValue);
    } else {
      setDisplayPrice('');
      handleFieldChange('price', '');
    }
  };

  // Count treatments by status
  const getTreatmentCounts = () => {
    // Use pagination totalItems for total count, but still filter loaded treatments for active/inactive
    const activeCount = treatments.filter(t => t.is_active).length;
    const inactiveCount = treatments.filter(t => !t.is_active).length;
    return {
      active: activeCount,
      inactive: inactiveCount,
      total: pagination.totalItems || 0
    };
  };

  const counts = getTreatmentCounts();

  // Modal tambah & edit memakai form yang sama
  const isEditing = showEditModal;

  // Get type_item options from API (with fallback to hardcoded)
  const getTypeItemOptions = () => {
    if (isProductMode) {
      return [];
    }
    if (typeItemOptions.length > 0) {
      return typeItemOptions.map(item => item.value).sort();
    }

    // Fallback hardcoded options
    const hardcodedOptions = [
      'Tiket', 'Paket', 'Wahana', 'Jasa', 'Parkir', 'Souvenir',
    ];

    const uniqueItems = [...new Set(treatments.map(t => t.type_item))];
    const allOptions = [...new Set([...hardcodedOptions, ...uniqueItems])];
    return allOptions.sort();
  };

  // Kategori yang relevan per mode
  const getTypeServiceOptions = () => {
    if (isProductMode) {
      const productCategories = ['Makanan', 'Minuman', 'Snack', 'Souvenir', 'Lainnya'];
      const existing = [...new Set(
        treatments.filter(t => t.unit).map(t => t.type_service).filter(Boolean)
      )];
      return [...new Set([...productCategories, ...existing])];
    }

    const serviceCategories = ['Wisata', 'Retribusi', 'Lainnya'];
    const existing = getUniqueTypeServices();
    return [...new Set([...serviceCategories, ...existing])];
  };

  // Get type_service options from API (with fallback to existing treatments)
  const getUniqueTypeServices = () => {
    if (typeServiceOptions.length > 0) {
      return typeServiceOptions.map(service => service.value).sort();
    }

    // Fallback to existing treatments
    const uniqueServices = [...new Set(treatments.map(t => t.type_service).filter(s => s && s.trim() !== ''))];
    return uniqueServices.sort();
  };

  // Label kategori produk terpilih (untuk pratinjau)
  const getSelectedCategoryLabel = () => {
    const id = formData.category_id;
    if (!id) return '';
    return productCategoryOptions.find((option) => String(option.value) === String(id))?.label || '';
  };

  // Nama item: pakai nama manual, kalau kosong turunkan dari tipe (fallback lama)
  const generateServiceName = (name, typeItem, typeService) => {
    const manualName = (name || '').trim();
    if (manualName) return manualName;
    return typeItem || typeService || '';
  };

  // Handle type_item selection
  const handleTypeItemChange = (value) => {
    if (value === 'custom') {
      setIsCustomTypeItem(true);
      handleFieldChange('type_item', customTypeItem);
    } else {
      setIsCustomTypeItem(false);
      setCustomTypeItem('');
      handleFieldChange('type_item', value);
    }
  };

  // Handle custom type_item input
  const handleCustomTypeItemChange = (value) => {
    setCustomTypeItem(value);
    handleFieldChange('type_item', value);
  };

  // Handle type_service selection
  const handleTypeServiceChange = (value) => {
    // Biarkan di-edit baik di mode produk maupun mode layanan
    if (value === 'custom') {
      setIsCustomTypeService(true);
      // Keep existing value if any, otherwise empty
      if (!customTypeService) {
        setCustomTypeService('');
        handleFieldChange('type_service', '');
      } else {
        handleFieldChange('type_service', customTypeService);
      }
    } else {
      setIsCustomTypeService(false);
      setCustomTypeService('');
      handleFieldChange('type_service', value);
      // Mode produk: jenis item mengikuti kategori (field Jenis disembunyikan)
      if (isProductMode) handleFieldChange('type_item', value);
    }
  };

  // Handle custom type_service input
  const handleCustomTypeServiceChange = (value) => {
    // Biarkan di-edit baik di mode produk maupun mode layanan
    setCustomTypeService(value);
    handleFieldChange('type_service', value);
  };

  // Handle explanation modal confirmation

  // Handle explanation modal close

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Tiket & Paket Wisata"
          description="Kelola tiket masuk, paket wisata & sewa"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-500 mx-auto"></div>
            <p className="mt-4 text-sm font-montserrat text-telaga-700/70">Memuat paket & produk...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Paket & Produk"
        description="Kelola paket wisata & produk jualan"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-4xl mx-auto mt-16">

            {/* Header: ringkasan + pencarian + filter */}
            <div className="mb-4 md:mb-6 overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-sm shadow-telaga-900/5">
              {/* Ringkasan disembunyikan (khusus Telaga)
              <div className="bg-gradient-to-br from-telaga-700 via-telaga-600 to-telaga-500 px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-telaga-100 font-montserrat">
                      Katalog
                    </p>
                    <h2 className="mt-0.5 truncate text-base font-bold text-white font-montserrat">
                      Daftar Tiket &amp; Paket
                    </h2>
                    <p className="mt-0.5 text-[11px] text-telaga-100/90 font-montserrat">
                      {counts.total} tiket &amp; paket terdaftar
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white font-montserrat backdrop-blur-sm">
                      {counts.active} Aktif
                    </span>
                    <span className="rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-semibold text-white/90 font-montserrat backdrop-blur-sm">
                      {counts.inactive} Nonaktif
                    </span>
                  </div>
                </div>
              </div>
              */}

              {/* Pencarian */}
              <div className="px-3 pt-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari paket atau produk... (Enter untuk cari)"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full rounded-xl border border-telaga-100 bg-telaga-50/40 py-2.5 pl-9 pr-9 text-sm font-montserrat text-telaga-900 placeholder-telaga-400/80 transition-all focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  />
                  <FaSearch
                    onClick={handleSearchSubmit}
                    className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 cursor-pointer text-telaga-400 transition-colors hover:text-telaga-600"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        handleSearchSubmit();
                      }}
                      className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-telaga-400 transition-colors hover:bg-telaga-100 hover:text-telaga-700"
                      title="Hapus pencarian"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filter status */}
              <div className="px-3 pt-2.5">
                <div className="flex gap-1.5 rounded-xl bg-telaga-50/70 p-1">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold font-montserrat transition-all ${
                      activeTab === 'active'
                        ? 'bg-white text-telaga-700 shadow-sm'
                        : 'text-telaga-600/70 hover:text-telaga-800'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${activeTab === 'active' ? 'bg-telaga-500' : 'bg-telaga-300'}`} />
                    Aktif
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${activeTab === 'active' ? 'bg-telaga-100 text-telaga-700' : 'bg-white/70 text-telaga-500'}`}>
                      {counts.active}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inactive')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold font-montserrat transition-all ${
                      activeTab === 'inactive'
                        ? 'bg-white text-senja-700 shadow-sm'
                        : 'text-telaga-600/70 hover:text-telaga-800'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${activeTab === 'inactive' ? 'bg-senja-500' : 'bg-telaga-300'}`} />
                    Nonaktif
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${activeTab === 'inactive' ? 'bg-senja-100 text-senja-700' : 'bg-white/70 text-telaga-500'}`}>
                      {counts.inactive}
                    </span>
                  </button>
                </div>
              </div>

              {/* Filter kategori produk — dibangun dari tabel product_categories */}
              {productCategoryOptions.length > 0 && (
                <div className="px-3 pt-2.5">
                  <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                      onClick={() => setActiveCategory('')}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold font-montserrat transition-all ${
                        activeCategory === ''
                          ? 'border-telaga-500 bg-telaga-600 text-white shadow-sm'
                          : 'border-telaga-100 bg-white text-telaga-700 hover:border-telaga-200 hover:bg-telaga-50'
                      }`}
                    >
                      Semua
                    </button>
                    {productCategoryOptions.map((category) => {
                      const id = String(category.value);
                      const isSelected = activeCategory === id;
                      const count = treatments.filter(
                        (treatment) => String(treatment.category_id ?? '') === id
                      ).length;

                      return (
                        <button
                          key={id}
                          onClick={() => setActiveCategory(id)}
                          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold font-montserrat transition-all ${
                            isSelected
                              ? 'border-telaga-500 bg-telaga-600 text-white shadow-sm'
                              : 'border-telaga-100 bg-white text-telaga-700 hover:border-telaga-200 hover:bg-telaga-50'
                          }`}
                        >
                          {category.label}
                          {count > 0 && (
                            <span
                              className={`rounded-full px-1.5 text-[10px] font-bold ${
                                isSelected ? 'bg-white/25 text-white' : 'bg-telaga-50 text-telaga-600'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aksi */}
              <div className="flex gap-2 px-3 pb-3 pt-2.5">
                <button
                  onClick={openCreateModal}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-telaga-600 to-telaga-500 px-4 py-2.5 text-sm font-semibold font-montserrat text-white shadow-sm shadow-telaga-600/25 transition-all hover:from-telaga-700 hover:to-telaga-600 active:scale-[0.98]"
                >
                  <FaPlus className="h-3 w-3" />
                  Tambah Item
                </button>
              </div>
            </div>

            {/* Daftar tiket & paket */}
            <div className="space-y-2">
              {filteredTreatments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-telaga-200 bg-white px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-telaga-50 text-telaga-500">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold font-montserrat text-telaga-900">
                    {searchTerm
                      ? 'Tidak ada item ditemukan'
                      : activeCategory
                        ? 'Belum ada item di kategori ini'
                        : 'Belum ada paket atau produk'}
                  </h3>
                  <p className="mt-1 text-xs font-montserrat text-telaga-900/55">
                    {searchTerm
                      ? 'Coba kata kunci lain'
                      : activeCategory
                        ? 'Pilih kategori lain atau tambahkan item baru'
                        : 'Mulai dengan menambahkan paket atau produk pertama'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTreatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="group overflow-hidden rounded-xl border border-telaga-100 bg-white transition-all hover:border-telaga-200 hover:shadow-sm hover:shadow-telaga-900/5"
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5 md:px-4">
                        {/* Ikon kategori */}
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${treatment.is_active ? 'bg-telaga-50 text-telaga-600' : 'bg-gray-100 text-gray-400'}`}>
                          {treatment.unit ? <Package className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                        </div>

                        {/* Info utama */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className={`truncate text-sm font-semibold font-montserrat ${treatment.is_active ? 'text-telaga-950' : 'text-telaga-900/45 line-through'}`}>
                              {treatment.name}
                            </h3>
                            {!treatment.is_active && (
                              <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-montserrat text-telaga-900/55">
                            {treatment.category?.name ? (
                              <span className="shrink-0 rounded bg-telaga-50 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-telaga-600">
                                {treatment.category.name}
                              </span>
                            ) : null}
                            {treatment.type_service ? (
                              <span className="truncate">{treatment.type_service}</span>
                            ) : (
                              <span className="italic opacity-70">Tanpa lini bisnis</span>
                            )}
                            {treatment.unit && (
                              <span className="shrink-0 rounded bg-telaga-50 px-1 py-0.5 text-[9px] font-bold uppercase text-telaga-600">
                                {treatment.unit}
                              </span>
                            )}
                            {treatment.description && (
                              <>
                                <span className="text-telaga-200">•</span>
                                <span className="hidden truncate sm:inline">{treatment.description}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Harga */}
                        <div className="shrink-0 text-right">
                          <div className={`text-sm font-bold font-montserrat ${treatment.is_active ? 'text-telaga-700' : 'text-telaga-900/40'}`}>
                            {formatPrice(treatment.price)}
                          </div>
                        </div>

                        {/* Aksi */}
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => openEditModal(treatment)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-telaga-100 bg-telaga-50/60 text-telaga-600 transition-all hover:bg-telaga-100 active:scale-95"
                            title="Edit"
                          >
                            <FaEdit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(treatment.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-95 ${
                              treatment.is_active
                                ? 'border-senja-100 bg-senja-50/70 text-senja-600 hover:bg-senja-100'
                                : 'border-telaga-100 bg-telaga-50/70 text-telaga-600 hover:bg-telaga-100'
                            }`}
                            title={treatment.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {treatment.is_active
                              ? <FaToggleOn className="h-3.5 w-3.5" />
                              : <FaToggleOff className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Info jumlah */}
                  {pagination.totalItems > 0 && (
                    <div className="pt-1 text-center text-[11px] font-montserrat text-telaga-900/45">
                      Menampilkan {filteredTreatments.length} dari {treatments.length} tiket &amp; paket
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {(showCreateModal || showEditModal) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-telaga-100 px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-telaga-50 text-telaga-600">
                {isProductMode ? <Package className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold font-montserrat text-telaga-950">
                  {isEditing
                    ? (isProductMode ? 'Edit Produk' : 'Edit Tiket / Paket')
                    : (isProductMode ? 'Tambah Produk' : 'Tambah Tiket / Paket')}
                </h3>
                <p className="mt-0.5 truncate text-[11px] font-montserrat text-telaga-900/55">
                  {isProductMode
                    ? 'Barang jualan yang stoknya bisa dipantau'
                    : 'Layanan wisata yang dijual ke pengunjung'}
                </p>
              </div>
              <button
                onClick={isEditing ? closeEditModal : closeCreateModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-telaga-900/40 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
                title="Tutup"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div
              className="flex-1 space-y-3.5 overflow-y-auto p-4"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              {/* Tipe item: layanan wisata atau produk barang */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Tipe Item <span className="text-senja-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-telaga-50/60 p-1">
                  <button
                    type="button"
                    onClick={() => handleItemKindChange('paket')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold font-montserrat transition-all ${
                      !isProductMode
                        ? 'bg-white text-telaga-800 shadow-sm'
                        : 'text-telaga-900/50 hover:text-telaga-700'
                    }`}
                  >
                    <Ticket className="h-3.5 w-3.5" />
                    Tiket / Paket
                  </button>
                  <button
                    type="button"
                    onClick={() => handleItemKindChange('produk')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold font-montserrat transition-all ${
                      isProductMode
                        ? 'bg-white text-telaga-800 shadow-sm'
                        : 'text-telaga-900/50 hover:text-telaga-700'
                    }`}
                  >
                    <Package className="h-3.5 w-3.5" />
                    Produk Barang
                  </button>
                </div>
              </div>

              {/* Nama item */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Nama {isProductMode ? 'Produk' : 'Tiket / Paket'} <span className="text-senja-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={isProductMode ? 'mis. Indomie Goreng' : 'mis. Paket Edukasi Sekolah'}
                  maxLength={80}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all placeholder:text-telaga-900/35 focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-telaga-100 bg-telaga-50/40 focus:border-telaga-400 focus:bg-white focus:ring-telaga-400/25'
                  }`}
                />
                {formErrors.name && <p className="mt-1 text-[11px] font-montserrat text-red-500">{formErrors.name}</p>}
              </div>

              {/* 1. Lini bisnis — disembunyikan, memakai default */}
              {SHOW_TYPE_FIELDS && (
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Lini Bisnis <span className="text-senja-500">*</span>
                </label>
                {!isCustomTypeService ? (
                  <select
                    value={formData.type_service || ''}
                    onChange={(e) => handleTypeServiceChange(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all focus:outline-none focus:ring-2 ${
                      formErrors.type_service
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-telaga-100 bg-telaga-50/40 focus:border-telaga-400 focus:bg-white focus:ring-telaga-400/25'
                    }`}
                  >
                    <option value="">Pilih lini bisnis</option>
                    <option value="custom" className="font-semibold text-telaga-600">
                      + Buat lini bisnis baru
                    </option>
                    {getTypeServiceOptions().map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={customTypeService}
                      onChange={(e) => handleCustomTypeServiceChange(e.target.value)}
                      className="w-full rounded-xl border border-telaga-200 bg-telaga-50/40 px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                      placeholder="Contoh: Makanan, Minuman, Wisata"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTypeService(false);
                        setCustomTypeService('');
                        setFormData({ ...formData, type_service: '' });
                      }}
                      className="text-[11px] font-montserrat text-telaga-600 underline hover:text-telaga-800"
                    >
                      ← Kembali ke pilihan
                    </button>
                  </div>
                )}
                {formErrors.type_service && (
                  <p className="mt-1 text-[11px] font-montserrat text-red-500">⚠️ {formErrors.type_service}</p>
                )}
              </div>
              )}

              {/* 1b. Kategori produk — diambil dari tabel product_categories */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Kategori Produk <span className="font-medium normal-case tracking-normal text-telaga-900/40">(opsional)</span>
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => handleFieldChange('category_id', e.target.value)}
                  className="w-full rounded-xl border border-telaga-100 bg-telaga-50/40 px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                >
                  <option value="">Tanpa kategori</option>
                  {productCategoryOptions.map((option) => (
                    <option key={option.value} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] font-montserrat text-telaga-900/45">
                  Mengelompokkan produk di katalog. Kelola daftarnya di menu Kategori Produk.
                </p>
              </div>

              {/* 2. Jenis — disembunyikan, memakai default */}
              {SHOW_TYPE_FIELDS && !isProductMode && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                    Jenis Tiket / Paket <span className="text-senja-500">*</span>
                  </label>
                  {!isCustomTypeItem ? (
                    <select
                      value={formData.type_item}
                      onChange={(e) => handleTypeItemChange(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all focus:outline-none focus:ring-2 ${
                        formErrors.type_item
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                          : 'border-telaga-100 bg-telaga-50/40 focus:border-telaga-400 focus:bg-white focus:ring-telaga-400/25'
                      }`}
                    >
                      <option value="">Pilih jenis</option>
                      <option value="custom" className="font-semibold text-telaga-600">
                        + Buat jenis baru
                      </option>
                      {getTypeItemOptions().map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={customTypeItem}
                        onChange={(e) => handleCustomTypeItemChange(e.target.value)}
                        className="w-full rounded-xl border border-telaga-200 bg-telaga-50/40 px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                        placeholder="Contoh: Tiket, Paket, Wahana, Parkir"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTypeItem(false);
                          setCustomTypeItem('');
                          setFormData({ ...formData, type_item: '' });
                        }}
                        className="text-[11px] font-montserrat text-telaga-600 underline hover:text-telaga-800"
                      >
                        ← Kembali ke pilihan
                      </button>
                    </div>
                  )}
                  {formErrors.type_item && (
                    <p className="mt-1 text-[11px] font-montserrat text-red-500">⚠️ {formErrors.type_item}</p>
                  )}
                </div>
              )}

              {/* 3. Harga */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Harga <span className="text-senja-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold font-montserrat text-telaga-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={displayPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm font-montserrat text-telaga-900 transition-all focus:outline-none focus:ring-2 ${
                      formErrors.price
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-telaga-100 bg-telaga-50/40 focus:border-telaga-400 focus:bg-white focus:ring-telaga-400/25'
                    }`}
                    placeholder="10.000"
                    inputMode="numeric"
                  />
                </div>
                {formErrors.price && (
                  <p className="mt-1 text-[11px] font-montserrat text-red-500">⚠️ {formErrors.price}</p>
                )}
              </div>

              {/* 3b. Satuan + stok awal — hanya untuk produk barang */}
              {isProductMode && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                      Dapur Produksi
                    </label>
                    <select
                      value={productionTarget}
                      onChange={(e) => handleProductionTargetChange(e.target.value)}
                      className="w-full rounded-xl border border-telaga-100 bg-telaga-50/40 px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                    >
                      <option value="outlet">Outlet sendiri — dimasak di tempat pesanan dibuat</option>
                      {kitchenOutletOptions.map((branch) => (
                        <option key={branch.id} value={`branch:${branch.id}`}>
                          {branch.name}{branch.city ? ` — ${branch.city}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] font-montserrat text-telaga-900/45">
                      Menu ini selalu dimasak di outlet yang dipilih, walaupun dipesan dari outlet lain.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                      Satuan <span className="font-medium normal-case tracking-normal text-telaga-900/40">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => handleFieldChange('unit', e.target.value)}
                      placeholder="pcs, porsi, gelas, botol"
                      maxLength={30}
                      className="w-full rounded-xl border border-telaga-100 bg-telaga-50/40 px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all placeholder:text-telaga-900/35 focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                    />
                  </div>

                  {!isEditing ? (
                    <div className="rounded-xl border border-telaga-100 bg-telaga-50/40 p-3">
                      <label className="flex items-start gap-2 text-[11px] font-semibold font-montserrat text-telaga-800">
                        <input
                          type="checkbox"
                          checked={manageStock}
                          onChange={(e) => setManageStock(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded accent-telaga-600"
                        />
                        <span className="flex-1">
                          Langsung aktifkan pelacakan stok
                          <span className="mt-0.5 block font-normal text-telaga-900/50">
                            Stok bisa ditambah/dikoreksi kapan saja di menu Stok Barang.
                          </span>
                        </span>
                      </label>

                      {manageStock && (
                        <div className="mt-2.5 space-y-2">
                          <select
                            value={stockBranchId}
                            onChange={(e) => setStockBranchId(e.target.value)}
                            className="w-full rounded-lg border border-telaga-100 bg-white px-3 py-2 text-sm font-montserrat text-telaga-900 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                          >
                            {branches.length === 0 && <option value="">Outlet belum tersedia</option>}
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                              </option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide font-montserrat text-telaga-600">
                                Stok awal
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stockQty}
                                onChange={(e) => setStockQty(e.target.value)}
                                inputMode="numeric"
                                className="w-full rounded-lg border border-telaga-100 bg-white px-3 py-2 text-sm font-montserrat text-telaga-900 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide font-montserrat text-telaga-600">
                                Min. stok
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stockMin}
                                onChange={(e) => setStockMin(e.target.value)}
                                inputMode="numeric"
                                className="w-full rounded-lg border border-telaga-100 bg-white px-3 py-2 text-sm font-montserrat text-telaga-900 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl border border-telaga-100 bg-telaga-50/60 px-3 py-2.5">
                      <Boxes className="mt-0.5 h-3.5 w-3.5 shrink-0 text-telaga-500" />
                      <p className="flex-1 text-[11px] font-montserrat text-telaga-900/60">
                        Jumlah stok tidak diubah di sini. Tambah atau koreksi stok lewat menu Stok Barang.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* 4. Deskripsi */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Deskripsi <span className="font-medium normal-case tracking-normal text-telaga-900/40">(opsional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-telaga-100 bg-telaga-50/40 px-3 py-2.5 text-sm font-montserrat text-telaga-900 transition-all placeholder-telaga-400/80 focus:border-telaga-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  placeholder={isProductMode ? 'Keterangan singkat produk' : 'Keterangan singkat tiket atau paket'}
                />
              </div>

              {/* 5. Pratinjau */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide font-montserrat text-telaga-700">
                  Pratinjau
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-telaga-100 bg-telaga-50/60 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-telaga-500">
                    {isProductMode ? <Package className="h-3.5 w-3.5" /> : <Ticket className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold font-montserrat text-telaga-950">
                      {formData.name?.trim() || formData.type_item
                        ? generateServiceName(formData.name, formData.type_item, formData.type_service)
                        : <span className="font-normal italic text-telaga-900/40">Belum ada nama</span>}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] font-montserrat text-telaga-900/55">
                      {getSelectedCategoryLabel() || formData.type_service || 'Tanpa kategori'}
                      {getSelectedCategoryLabel() && formData.type_service ? ` · ${formData.type_service}` : ''}
                      {isProductMode && formData.unit ? ` · per ${formData.unit}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-bold font-montserrat text-telaga-700">
                    {formData.price ? `Rp ${parseInt(formData.price, 10).toLocaleString('id-ID')}` : '—'}
                  </div>
                </div>
              </div>

              {/* Validasi */}
              {!isFormValid && (
                <div className="flex items-start gap-2 rounded-xl border border-senja-200 bg-senja-50/70 px-3 py-2">
                  <span className="text-xs text-senja-500">⚠️</span>
                  <p className="text-[11px] font-montserrat text-senja-800">
                    Lengkapi kolom bertanda <span className="font-semibold">*</span> untuk menyimpan.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-2 border-t border-telaga-100 bg-white p-4">
              <button
                onClick={isEditing ? closeEditModal : closeCreateModal}
                className="flex-1 rounded-xl border border-telaga-100 bg-white px-4 py-2.5 text-sm font-semibold font-montserrat text-telaga-700 transition-all hover:bg-telaga-50 active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={isEditing ? handleUpdate : handleCreate}
                disabled={!isFormValid || isSubmitting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold font-montserrat transition-all ${
                  !isFormValid || isSubmitting
                    ? 'cursor-not-allowed bg-telaga-100 text-telaga-400'
                    : 'bg-gradient-to-r from-telaga-600 to-telaga-500 text-white shadow-sm shadow-telaga-600/25 hover:from-telaga-700 hover:to-telaga-600 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-b-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  isEditing ? 'Simpan Perubahan' : 'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TreatmentManagement;
