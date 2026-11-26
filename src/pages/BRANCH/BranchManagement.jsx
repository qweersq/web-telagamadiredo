import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, Plus, Search, Edit, Trash2, MapPin, Users, Navigation, Wifi, WifiOff, Info, Building2, Store, RefreshCw, Phone, Utensils, Ticket, Layers} from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import {LocationPickerModal} from '../../components/LocationPicker';
import {SubscriptionLimitsCard, SubscriptionValidationModal} from '../../components/SubscriptionLimits';
import BranchDetailModal from '../../components/BRANCH/BranchDetailModal';
import SubscriptionValidationService from '../../services/subscriptionValidationService';
import instance from '../../config/api';
import {getUserProfile} from '../../utils/userProfileHelper';
import {validateFullPhone} from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';
import {createMitraRelation, getMitrasByParent, deleteMitraRelation} from './api/branchMitraApi';

const BranchManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState('branches'); // 'branches' or 'droppoint'
  const [branchFilterTab, setBranchFilterTab] = useState('active'); // 'active' or 'inactive'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Subscription validation states
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState('branch');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    manager_id: null,
    status: 'active',
    tenant_id: null,
    longitude: '',
    latitude: '',
    wa_session_id: '',
    branch_type: 'main',
    order_mode: 'loket'
  });

  // Mitra/Droppoint States
  const [createMode, setCreateMode] = useState('main'); // 'main' or 'mitra'
  const [selectedParentBranch, setSelectedParentBranch] = useState('');

  const [mitraRelations, setMitraRelations] = useState([]);
  const [mitraLoading, setMitraLoading] = useState(false);
  const [showAddMitraModal, setShowAddMitraModal] = useState(false);
  const [selectedMitraToAdd, setSelectedMitraToAdd] = useState('');

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();

      const params = {};
      if (profile?.tenant?.id) {
        params.tenant_id = profile.tenant.id;
      }

      const { data } = await instance.get('/branches', { params });
      setBranches(data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Form validation function
  const validateForm = () => {
    const errors = {};

    // Nama outlet wajib
    if (!formData.name.trim()) {
      errors.name = 'Nama outlet wajib diisi';
      console.log('❌ Name validation failed: empty');
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Nama outlet minimal 3 karakter';
      console.log('❌ Name validation failed: too short');
    } else {
      console.log('✅ Name validation passed');
    }

    // Alamat wajib
    if (!formData.address.trim()) {
      errors.address = 'Alamat outlet wajib diisi';
    } else if (formData.address.trim().length < 10) {
      errors.address = 'Alamat minimal 10 karakter';
    }

    const phoneError = validateFullPhone(formData.phone);
    if (phoneError) errors.phone = phoneError;

    // Kota wajib
    if (!formData.city.trim()) {
      errors.city = 'Kota wajib diisi';
    } else if (formData.city.trim().length < 3) {
      errors.city = 'Nama kota minimal 3 karakter';
    }

    // Koordinat wajib - periksa apakah koordinat ada dan valid
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (!formData.latitude || !formData.longitude || formData.latitude.trim() === '' || formData.longitude.trim() === '') {
      errors.coordinates = 'Koordinat lokasi wajib diisi';
    } else if (isNaN(lat) || isNaN(lng)) {
      errors.coordinates = 'Koordinat harus berupa angka yang valid';
    } else if (lat < -90 || lat > 90) {
      errors.coordinates = 'Latitude harus antara -90 dan 90';
    } else if (lng < -180 || lng > 180) {
      errors.coordinates = 'Longitude harus antara -180 dan 180';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // ✅ Validate subscription limits before creating branch
    if (subscriptionData) {
      const validation = SubscriptionValidationService.validateBranchCreation(subscriptionData);

      if (!validation.isValid) {
        setValidationType('branch');
        setShowValidationModal(true);
        return;
      }

      // Show warning if approaching limit
      if (validation.type === 'warning') {
        setValidationType('branch');
        setShowValidationModal(true);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        // '' -> null supaya kolom integer tidak menerima string kosong
        kitchen_branch_id: formData.kitchen_branch_id ? Number(formData.kitchen_branch_id) : null,
        branch_type: createMode === 'mitra' ? 'mitra' : 'main'
      };

      const response = await instance.post('/branches', payload);
      const newBranch = response.data.data;

      // If creating a mitra, also create the relation
      if (createMode === 'mitra' && selectedParentBranch) {
        await createMitraRelation(selectedParentBranch, newBranch.id);
        fetchMitras(selectedParentBranch); // Refresh mitra list
        alert('Droppoint baru berhasil dibuat dan dihubungkan!');
      } else {
        alert('Outlet baru berhasil dibuat');
      }

      closeCreateModal();
      fetchBranches();

      // ✅ Reload subscription data after successful creation
      const profile = await getUserProfile();
      if (profile && profile.subscription) {
        setSubscriptionData(profile.subscription);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Gagal membuat outlet baru: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranch = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Include branch_type and parent_branch_id in the payload - backend handles mitra relation
      const payload = {
        ...formData,
        // '' -> null supaya kolom integer tidak menerima string kosong
        kitchen_branch_id: formData.kitchen_branch_id ? Number(formData.kitchen_branch_id) : null,
        branch_type: formData.branch_type || editingBranch.branch_type || 'main',
        parent_branch_id: formData.branch_type === 'mitra' && selectedParentBranch
          ? selectedParentBranch.id
          : null
      };

      console.log('🔍 handleEditBranch - Submitting:', {
        branchId: editingBranch.id,
        branch_type: payload.branch_type,
        parent_branch_id: payload.parent_branch_id,
      });

      await instance.put(`/branches/${editingBranch.id}`, payload);

      closeEditModal();
      fetchBranches();
      alert(payload.branch_type === 'mitra' ? 'Droppoint berhasil diupdate!' : 'Outlet berhasil diupdate!');
    } catch (error) {
      console.error('❌ Error updating branch:', error);
      console.error('❌ Error response:', error.response?.data);
      alert('Gagal mengupdate outlet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBranch = async () => {
    try {
      await instance.put(`/branches/${branchToDelete.id}`, {
        ...branchToDelete,
        status: 'closed'
      });
      setShowDeleteModal(false);
      setBranchToDelete(null);
      fetchBranches();
    } catch (error) {
      console.error('Error closing branch:', error);
      alert('Gagal menutup outlet');
    }
  };

  const handleReactivateBranch = async (branch) => {
    try {
      await instance.put(`/branches/${branch.id}`, {
        ...branch,
        status: 'active'
      });
      fetchBranches();
      alert('Outlet berhasil diaktifkan kembali');
    } catch (error) {
      console.error('Error reactivating branch:', error);
      alert('Gagal mengaktifkan outlet');
    }
  };

  const handleLocationSelect = (latitude, longitude, address) => {
    setFormData(prev => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }));
    setShowLocationModal(false);
  };

  // Mitra Functions
  const fetchMitras = async (parentId) => {
    try {
      setMitraLoading(true);
      const mitras = await getMitrasByParent(parentId);
      setMitraRelations(mitras);
    } catch (error) {
      console.error('Error fetching mitras:', error);
    } finally {
      setMitraLoading(false);
    }
  };

  const handleAddMitra = async () => {
    if (!selectedParentBranch || !selectedMitraToAdd) return;

    try {
      await createMitraRelation(selectedParentBranch, selectedMitraToAdd);
      setShowAddMitraModal(false);
      setSelectedMitraToAdd('');
      fetchMitras(selectedParentBranch); // Refresh list
      alert('Droppoint berhasil ditambahkan!');
      fetchBranches(); // Refresh branches to update branch_type
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menambahkan droppoint');
    }
  };

  const handleDeleteMitra = async (relationId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus droppoint ini?')) return;

    try {
      await deleteMitraRelation(relationId);
      fetchMitras(selectedParentBranch); // Refresh list
      alert('Droppoint berhasil dihapus!');
      fetchBranches(); // Refresh branches to update branch_type
    } catch (error) {
      alert('Gagal menghapus droppoint');
    }
  };

  // ✅ Validation modal handlers

  const handleValidationConfirm = () => {
    setShowValidationModal(false);
    // Proceed with branch creation
    handleCreateBranch({ preventDefault: () => { } });
  };

  const handleValidationUpgrade = () => {
    setShowValidationModal(false);
    navigate('/billing-active-tenant-payment');
  };

  const openLocationModal = () => {
    setShowLocationModal(true);
  };

  const openEditModal = async (branch) => {
    setEditingBranch(branch);

    // Helper function to convert phone format
    const normalizePhone = (phone) => {
      if (!phone) return '';
      const cleaned = phone.replace(/[^0-9+]/g, '');

      // If starts with 08, convert to +628
      if (cleaned.startsWith('08')) {
        return '+62' + cleaned.substring(1);
      }

      // If starts with 8, convert to +628
      if (cleaned.startsWith('8') && !cleaned.startsWith('+')) {
        return '+62' + cleaned;
      }

      if (cleaned.startsWith('+62')) {
        return cleaned;
      }

      // If starts with 62, add +
      if (cleaned.startsWith('62')) {
        return '+' + cleaned;
      }

      return phone; // Return original if can't determine format
    };

    const newFormData = {
      name: branch.name || '',
      address: branch.address || '',
      phone: normalizePhone(branch.phone || ''),
      city: branch.city || '',
      manager_id: branch.manager_id,
      status: branch.status || 'active',
      tenant_id: branch.tenant_id,
      longitude: branch.longitude ? branch.longitude.toString() : '',
      latitude: branch.latitude ? branch.latitude.toString() : '',
      wa_session_id: branch.wa_session_id || '',
      order_mode: branch.order_mode || 'loket',
      kitchen_branch_id: branch.kitchen_branch_id || '',
      branch_type: branch.branch_type || 'main' // Load existing branch type
    };

    setFormData(newFormData);
    // Reset form errors when opening edit modal
    setFormErrors({});

    // If branch is mitra, use parentRelation from branch data directly
    if (branch.branch_type === 'mitra' && branch.parentRelation?.parentBranch) {
      setSelectedParentBranch(branch.parentRelation.parentBranch);
      console.log('✅ Loaded parent branch from data:', branch.parentRelation.parentBranch.name);
    } else {
      setSelectedParentBranch(null);
    }
  };

  // Opsi dapur pusat: semua outlet aktif termasuk outlet itu sendiri
  const kitchenBranchOptions = branches.filter((b) => b.status === 'active');

  const openDetailModal = (branch) => {
    setSelectedBranch(branch);
    setShowDetailModal(true);
  };

  const openCreateModal = async (mode = 'main') => {
    setCreateMode(mode);

    // ✅ Validate subscription limits before opening form
    if (subscriptionData) {
      const validation = SubscriptionValidationService.validateBranchCreation(subscriptionData);

      if (!validation.isValid || validation.type === 'warning') {
        setValidationType('branch');
        setShowValidationModal(true);
        return;
      }
    }

    setEditingBranch(null); // Pastikan editingBranch di-reset
    // Get tenant_id from user data
    try {
      const profile = await getUserProfile();
      setFormData({
        name: '',
        address: '',
        phone: '',
        city: '',
        manager_id: null,
        status: 'active',
        tenant_id: profile?.tenant?.id || null,
        longitude: '',
        latitude: '',
        wa_session_id: '',
        branch_type: mode === 'mitra' ? 'mitra' : 'main',
        order_mode: 'loket',
        kitchen_branch_id: ''
      }); // Reset form data
    } catch (error) {
      console.error('❌ BranchManagement - Failed to get tenant ID for create modal:', error);
      setFormData({
        name: '',
        address: '',
        phone: '',
        city: '',
        manager_id: null,
        status: 'active',
        tenant_id: null,
        longitude: '',
        latitude: '',
        wa_session_id: '',
        branch_type: mode === 'mitra' ? 'mitra' : 'main',
        order_mode: 'loket',
        kitchen_branch_id: ''
      });
    }
    setShowCreateModal(true);
  };

  const openCloseModal = (branch) => {
    setBranchToDelete(branch);
    setShowDeleteModal(true);
  };

  const closeCreateModal = async () => {
    setShowCreateModal(false);
    setEditingBranch(null);
    setFormErrors({});
    setIsSubmitting(false);
    // Get tenant_id from user data
    try {
      const profile = await getUserProfile();
      setFormData({
        name: '',
        address: '',
        phone: '',
        city: '',
        manager_id: null,
        status: 'active',
        tenant_id: profile?.tenant?.id || null,
        longitude: '',
        latitude: '',
        wa_session_id: '',
        order_mode: 'loket'
      });
    } catch (error) {
      console.error('❌ BranchManagement - Failed to get tenant ID for close modal:', error);
      setFormData({
        name: '',
        address: '',
        phone: '',
        city: '',
        manager_id: null,
        status: 'active',
        tenant_id: null,
        longitude: '',
        latitude: '',
        wa_session_id: '',
        order_mode: 'loket'
      });
    }
  };

  const closeEditModal = async () => {
    setEditingBranch(null);
    setFormErrors({});
    setIsSubmitting(false);
    // Get tenant_id from user data
    try {
      const profile = await getUserProfile();
      setFormData({
        name: '',
        address: '',
        phone: '',
        city: '',
        manager_id: null,
        status: 'active',
        tenant_id: profile?.tenant?.id || null,
        longitude: '',
        latitude: '',
        wa_session_id: '',
        order_mode: 'loket'
      });
    } catch (error) {
      console.error('❌ BranchManagement - Failed to get tenant ID for close edit modal:', error);
      setFormData({
        name: '',
        address: '',
        phone: '',
        city: '',
        manager_id: null,
        status: 'active',
        tenant_id: null,
        longitude: '',
        latitude: '',
        wa_session_id: '',
        order_mode: 'loket'
      });
    }
  };

  // Filter branches based on active tab
  const getBranchesByTab = (tab = branchFilterTab) => {
    if (tab === 'active') {
      return branches.filter(branch =>
        ['active', 'maintenance', 'suspended'].includes(branch.status)
      );
    } else {
      return branches.filter(branch =>
        ['inactive', 'closed'].includes(branch.status)
      );
    }
  };

  // Get counts for both tabs
  const activeBranches = getBranchesByTab('active');
  const inactiveBranches = getBranchesByTab('inactive');

  const cafeBranchCount = branches.filter(b => b.order_mode === 'cafe').length;
  const mixedBranchCount = branches.filter(b => b.order_mode === 'mixed').length;
  const loketBranchCount = branches.length - cafeBranchCount - mixedBranchCount;

  const filteredBranches = getBranchesByTab().filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: 'active', label: 'Aktif', color: 'bg-telaga-50 text-telaga-700 border border-telaga-200' },
    { value: 'inactive', label: 'Tidak Aktif', color: 'bg-telaga-50 text-telaga-900/60 border border-telaga-100' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-senja-50 text-senja-700 border border-senja-200' },
    { value: 'suspended', label: 'Ditangguhkan', color: 'bg-red-50 text-red-600 border border-red-200' },
    { value: 'closed', label: 'Ditutup', color: 'bg-red-100 text-red-700 border border-red-200' }
  ];

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-500 mx-auto"></div>
          <p className="mt-4 text-telaga-900/70">Memuat outlet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Manajemen Outlet"
        description="Kelola outlet & droppoint Agrowisata Telaga"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-[40px]">
        <div className="mx-auto px-4 md:px-10 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[30px]">

            {/* ✅ Subscription Limits Card - Branches Only */}
            {subscriptionData && (
              <SubscriptionLimitsCard
                subscriptionData={subscriptionData}
                onUpgrade={handleValidationUpgrade}
                type="branches"
              />
            )}

            {/* Ringkasan outlet */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Outlet', value: branches.length, icon: Building2, accent: 'text-telaga-700 bg-telaga-50' },
                { label: 'Aktif', value: activeBranches.length, icon: MapPin, accent: 'text-telaga-700 bg-telaga-50' },
                { label: 'Mode Cafe', value: cafeBranchCount, icon: Utensils, accent: 'text-senja-700 bg-senja-50' },
                { label: 'Mode Loket', value: loketBranchCount, icon: Ticket, accent: 'text-senja-700 bg-senja-50' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-telaga-100/80 bg-white p-3 shadow-[0_1px_2px_rgba(5,46,22,0.04)]">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.accent}`}>
                      <stat.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-montserrat font-medium text-telaga-900/50">{stat.label}</p>
                      <p className="text-base font-bold leading-tight font-montserrat text-telaga-950">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar: pencarian + aksi */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-telaga-900/35" />
                <input
                  type="text"
                  placeholder="Cari outlet, alamat, atau kota..."
                  className="w-full rounded-xl border border-telaga-100 bg-white py-3 pl-12 pr-10 font-montserrat text-sm text-telaga-950 placeholder:text-telaga-900/35 shadow-[0_1px_2px_rgba(5,46,22,0.04)] transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-telaga-900/40 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
                    aria-label="Hapus pencarian"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openCreateModal('main')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-telaga-700 px-4 py-3 font-montserrat text-sm font-semibold text-white shadow-sm transition-colors hover:bg-telaga-800 sm:flex-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Outlet</span>
                </button>
              </div>
            </div>

            {searchTerm && (
              <p className="-mt-3 mb-4 text-xs font-montserrat text-telaga-900/50">
                {filteredBranches.length} outlet ditemukan untuk “{searchTerm}”
              </p>
            )}

            {/* Tab utama */}
            <div className="mb-4 inline-flex rounded-xl border border-telaga-100 bg-white p-1">
              {[
                { key: 'branches', label: 'Semua Outlet', icon: Building2 },
                { key: 'droppoint', label: 'Droppoint', icon: Store },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMainTab(tab.key)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-montserrat text-sm font-semibold transition-colors ${
                    mainTab === tab.key
                      ? 'bg-telaga-700 text-white shadow-sm'
                      : 'text-telaga-900/55 hover:bg-telaga-50 hover:text-telaga-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Based on Main Tab */}
            {mainTab === 'branches' ? (
              <>
                {/* Filter status outlet */}
                <div className="mb-5 inline-flex rounded-xl border border-telaga-100 bg-white p-1">
                  {[
                    { key: 'active', label: 'Aktif', count: activeBranches.length, dot: 'bg-telaga-500' },
                    { key: 'inactive', label: 'Non-Aktif', count: inactiveBranches.length, dot: 'bg-telaga-900/25' },
                  ].map((tab) => {
                    const active = branchFilterTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setBranchFilterTab(tab.key)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 font-montserrat text-sm font-semibold transition-colors ${
                          active
                            ? 'bg-telaga-50 text-telaga-700'
                            : 'text-telaga-900/50 hover:bg-telaga-50/60 hover:text-telaga-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                        {tab.label}
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-montserrat text-[10px] font-bold ${
                            active ? 'bg-telaga-700 text-white' : 'bg-telaga-900/5 text-telaga-900/50'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mb-6 rounded-2xl border border-telaga-100/80 bg-white p-5 shadow-[0_1px_2px_rgba(5,46,22,0.04)]">
                <div className="mb-6">
                  <label className="mb-2 block font-montserrat text-sm font-semibold text-telaga-900/70">
                    Pilih Outlet Utama
                  </label>
                  <select
                    value={selectedParentBranch}
                    onChange={(e) => {
                      setSelectedParentBranch(e.target.value);
                      if (e.target.value) {
                        fetchMitras(e.target.value);
                      } else {
                        setMitraRelations([]);
                      }
                    }}
                    className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 font-montserrat text-sm text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  >
                    <option value="">-- Pilih Outlet Utama --</option>
                    {activeBranches
                      .filter(b => b.branch_type === 'main') // Only show main branches
                      .map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedParentBranch ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-semibold text-telaga-950">
                        Daftar Mitra/Droppoint
                      </h3>
                      {/* Check if limit reached */}
                      {(() => {
                        const isLimitReached = subscriptionData &&
                          subscriptionData.plan.max_branches &&
                          subscriptionData.plan.current_branches >= subscriptionData.plan.max_branches;

                        return (
                          <div className="relative group">
                            <button
                              onClick={() => {
                                if (!isLimitReached) {
                                  openCreateModal('mitra');
                                }
                              }}
                              disabled={isLimitReached}
                              className={`px-4 py-2 whitespace-nowrap text-white rounded-lg transition ${isLimitReached
                                  ? 'bg-telaga-300 cursor-not-allowed'
                                  : 'bg-telaga-400 hover:bg-telaga-700'
                                }`}
                            >
                              + Tambah
                            </button>
                            {isLimitReached && (
                              <div className="absolute right-0 bottom-full mb-2 w-64 bg-telaga-950 text-white text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-telaga-950 transform rotate-45"></div>
                                <div className="font-semibold mb-1">🚫 Batas Tercapai</div>
                                <div className="text-telaga-200">
                                  Anda telah mencapai batas maksimal {subscriptionData?.plan.max_branches} outlet. Upgrade paket untuk menambah droppoint.
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Optional: Button for existing if needed, or remove it */}
                      {/* <button onClick={() => setShowAddMitraModal(true)} ...> Link Existing </button> */}
                    </div>

                    {mitraLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telaga-500 mx-auto"></div>
                        <p className="mt-2 text-telaga-900/55">Memuat droppoint...</p>
                      </div>
                    ) : mitraRelations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mitraRelations.map(relation => (
                          <div key={relation.id} className="border border-telaga-100 rounded-xl p-4 bg-krem flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-telaga-950">
                                {relation.mitraBranch?.name}
                              </div>
                              <div className="text-sm text-telaga-900/70">
                                {relation.mitraBranch?.address}
                              </div>
                              <div className="text-xs text-telaga-900/55 mt-1">
                                ID: #{relation.mitraBranch?.id} • {relation.status}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteMitra(relation.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Hapus Droppoint"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-krem rounded-xl border border-dashed border-telaga-200">
                        <p className="text-telaga-900/55 mb-3">Belum ada droppoint terhubung ke outlet ini.</p>
                        <button
                          onClick={() => fetchMitras(selectedParentBranch)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-senja-100 text-senja-700 rounded-lg hover:bg-senja-200 transition text-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-telaga-200 bg-telaga-50/40 py-10 text-center">
                    <p className="font-montserrat text-sm text-telaga-900/55">
                      Silakan pilih Outlet Utama terlebih dahulu untuk mengelola droppoint.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Branches List - Tokopedia Style */}
            {mainTab === 'branches' && (
              <div className="space-y-4">
                {filteredBranches.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-telaga-200 bg-white py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-telaga-50">
                      <MapPin className="h-7 w-7 text-telaga-500" />
                    </div>
                    <h3 className="mb-1 font-montserrat text-base font-bold text-telaga-950">
                      {searchTerm
                        ? 'Outlet tidak ditemukan'
                        : branchFilterTab === 'active'
                          ? 'Belum ada outlet aktif'
                          : 'Belum ada outlet non-aktif'
                      }
                    </h3>
                    <p className="font-montserrat text-sm text-telaga-900/50">
                      {searchTerm
                        ? 'Coba kata kunci lain'
                        : branchFilterTab === 'active'
                          ? 'Tambahkan outlet pertama Anda'
                          : 'Semua outlet masih aktif'
                      }
                    </p>
                  </div>
                ) : (
                  filteredBranches.map((branch) => {
                    const isCafe = branch.order_mode === 'cafe';
                    const isMixed = branch.order_mode === 'mixed';
                    return (
                      <div
                        key={branch.id}
                        className="overflow-hidden rounded-2xl border border-telaga-100/80 bg-white shadow-[0_1px_2px_rgba(5,46,22,0.04)] transition-colors hover:border-telaga-200"
                      >
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-telaga-600 to-telaga-800 font-montserrat text-base font-bold text-white shadow-sm">
                              {branch.name.trim().charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-montserrat text-base font-bold text-telaga-950">
                                {branch.name}
                              </h3>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="rounded-md border border-telaga-100 bg-telaga-50 px-2 py-0.5 font-montserrat text-[10px] font-bold uppercase tracking-wide text-telaga-700">
                                  {branch.branch_type === 'main' ? 'Outlet' : 'Droppoint'}
                                </span>
                                <span className={`rounded-md px-2 py-0.5 font-montserrat text-[10px] font-semibold ${getStatusInfo(branch.status).color}`}>
                                  {getStatusInfo(branch.status).label}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-montserrat text-[10px] font-semibold ${
                                    isCafe
                                      ? 'border-senja-200 bg-senja-50 text-senja-700'
                                      : 'border-telaga-200 bg-telaga-50 text-telaga-700'
                                  }`}
                                >
                                  {isMixed ? <Layers className="h-3 w-3" /> : isCafe ? <Utensils className="h-3 w-3" /> : <Ticket className="h-3 w-3" />}
                                  {isMixed ? 'Campur' : isCafe ? 'Cafe' : 'Loket'}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                                <div className="flex items-start gap-2 text-telaga-900/70">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-telaga-500" />
                                  <span className="text-xs font-montserrat leading-relaxed">{branch.address}</span>
                                </div>
                                <div className="flex items-start gap-2 text-telaga-900/70">
                                  <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-telaga-500" />
                                  <span className="text-xs font-montserrat leading-relaxed">{branch.phone}</span>
                                </div>
                                <div className="flex items-start gap-2 text-telaga-900/70">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-telaga-500" />
                                  <span className="text-xs font-montserrat leading-relaxed">{branch.city}</span>
                                </div>
                                <div className="flex items-start gap-2 text-telaga-900/50">
                                  <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-telaga-400" />
                                  <span className="text-xs font-montserrat leading-relaxed">
                                    {isMixed
                                      ? 'Data tamu hanya untuk item F&B'
                                      : isCafe
                                        ? 'Pesanan pakai nama & no. meja'
                                        : 'Tanpa data tamu & meja'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:flex-shrink-0 sm:flex-col">
                            <button
                              onClick={() => openEditModal(branch)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-telaga-100 bg-white px-3 py-2 font-montserrat text-xs font-semibold text-telaga-700 transition-colors hover:bg-telaga-50"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            {branchFilterTab === 'inactive' && (
                              <button
                                onClick={() => handleReactivateBranch(branch)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-telaga-200 bg-telaga-50 px-3 py-2 font-montserrat text-xs font-semibold text-telaga-700 transition-colors hover:bg-telaga-100"
                                title="Aktifkan Kembali"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Aktifkan
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-telaga-50 bg-krem/60 px-4 py-2">
                          <span className="font-montserrat text-[11px] text-telaga-900/45">
                            Dibuat {new Date(branch.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="font-montserrat text-[11px] text-telaga-900/35">ID #{branch.id}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Mitra Modal */}
      {showAddMitraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-telaga-950 mb-4">Tambah Droppoint</h3>
            <p className="text-sm text-telaga-900/70 mb-4">
              Pilih outlet yang akan dijadikan Droppoint bawahan dari outlet utama terpilih.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-telaga-900/70 mb-2">Pilih Outlet Droppoint</label>
              <select
                value={selectedMitraToAdd}
                onChange={(e) => setSelectedMitraToAdd(e.target.value)}
                className="w-full p-3 border border-telaga-100 rounded-lg focus:ring-telaga-500 focus:border-telaga-500"
              >
                <option value="">-- Pilih Outlet --</option>
                {activeBranches
                  .filter(b =>
                    b.id !== parseInt(selectedParentBranch) && // Not self
                    b.branch_type === 'main' // Only show main branches (candidates to become mitra)
                  )
                  .map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddMitraModal(false)}
                className="px-4 py-2 text-telaga-900/70 hover:bg-telaga-50 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAddMitra}
                disabled={!selectedMitraToAdd}
                className={`px-4 py-2 text-white rounded-lg ${!selectedMitraToAdd ? 'bg-telaga-300 cursor-not-allowed' : 'bg-telaga-700 hover:bg-telaga-800'
                  }`}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Branch Modal - Tokopedia Style */}

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] border border-telaga-100">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between border-b border-telaga-50 p-5 flex-shrink-0">
              <h2 className="font-montserrat text-lg font-bold text-telaga-950">
                {createMode === 'mitra' ? 'Tambah Droppoint Baru' : 'Tambah Outlet Baru'}
              </h2>
              <button
                onClick={closeCreateModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700 transition-colors hover:bg-telaga-100"
                aria-label="Tutup"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div
              className="p-6 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <form onSubmit={handleCreateBranch} id="create-branch-form">
                {/* Required Fields Info */}
                <div className="mb-4 p-3 bg-telaga-50 border border-telaga-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-telaga-900">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Informasi Penting:</span>
                  </div>
                  <p className="text-xs text-telaga-800 mt-1">
                    Semua field dengan tanda <span className="text-red-500 font-bold">*</span> wajib diisi.
                    {createMode === 'mitra' && (
                      <span> Koordinat lokasi diperlukan untuk validasi absensi karyawan.</span>
                    )}
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      {createMode === 'mitra' ? 'Nama Droppoint' : 'Nama Outlet'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 focus:outline-none font-montserrat text-sm transition-colors ${formErrors.name
                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                        : 'border-telaga-100 bg-krem focus:border-telaga-500'
                        }`}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) {
                          setFormErrors({ ...formErrors, name: '' });
                        }
                      }}
                      placeholder={createMode === 'mitra' ? "Contoh: Droppoint A" : "Masukkan nama outlet"}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      {createMode === 'mitra' ? 'Alamat Droppoint' : 'Alamat'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 focus:outline-none font-montserrat text-sm transition-colors resize-none ${formErrors.address
                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                        : 'border-telaga-100 bg-krem focus:border-telaga-500'
                        }`}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (formErrors.address) {
                          setFormErrors({ ...formErrors, address: '' });
                        }
                      }}
                      placeholder={createMode === 'mitra' ? "Masukkan lokasi mitra/droppoint" : "Masukkan alamat lengkap outlet"}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.address}
                      </p>
                    )}
                  </div>
                  <PhoneInputWithCountry
                    value={formData.phone}
                    onChange={(full) => {
                      setFormData({ ...formData, phone: full });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    error={formErrors.phone}
                    label="Nomor Telepon"
                    required
                  />
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Kota <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-2 focus:ring-telaga-400/25 focus:border-telaga-400 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Masukkan nama kota"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                      Status
                    </label>
                    <select
                      required
                      className="w-full rounded-lg border border-telaga-100 bg-krem px-3 py-2.5 font-montserrat text-sm text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                      Mode Operasional
                    </label>
                    <select
                      required
                      className="w-full rounded-lg border border-telaga-100 bg-krem px-3 py-2.5 font-montserrat text-sm text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                      value={formData.order_mode || 'loket'}
                      onChange={(e) => setFormData({ ...formData, order_mode: e.target.value })}
                    >
                      <option value="loket">Loket — tanpa data tamu &amp; meja</option>
                      <option value="cafe">Cafe — wajib nama pemesan &amp; no meja</option>
                      <option value="mixed">Campur — loket + cafe (tamu hanya untuk item F&amp;B)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-telaga-900/45 font-montserrat">
                      Menentukan field tamu yang muncul di halaman Pesanan Cepat.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                      Dapur Pusat
                    </label>
                    <select
                      className="w-full rounded-lg border border-telaga-100 bg-krem px-3 py-2.5 font-montserrat text-sm text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                      value={formData.kitchen_branch_id || ''}
                      onChange={(e) => setFormData({ ...formData, kitchen_branch_id: e.target.value })}
                    >
                      <option value="">Tanpa dapur pusat (dimasak di outlet ini)</option>
                      {kitchenBranchOptions.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} - {branch.city || branch.address}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-telaga-900/45 font-montserrat">
                      Item dengan produksi &quot;Dapur Pusat&quot; akan dicetak sebagai tiket di dapur outlet ini.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Koordinat Lokasi <span className="text-red-500">*</span>
                    </label>
                    {formErrors.coordinates && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {formErrors.coordinates}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {/* Location Picker Button */}
                      <button
                        type="button"
                        onClick={openLocationModal}
                        className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-telaga-700 bg-telaga-50 border-2 border-telaga-200 hover:bg-telaga-100 hover:border-telaga-300 transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Ambil Lokasi GPS</span>
                      </button>

                      {/* Manual Input Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="-7.250000"
                            className="w-full px-3 py-2 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-500 focus:border-transparent font-montserrat text-sm"
                            value={formData.latitude}
                            onChange={(e) => {
                              setFormData({ ...formData, latitude: e.target.value });
                              if (formErrors.coordinates) {
                                setFormErrors({ ...formErrors, coordinates: '' });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="112.750000"
                            className="w-full px-3 py-2 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-500 focus:border-transparent font-montserrat text-sm"
                            value={formData.longitude}
                            onChange={(e) => {
                              setFormData({ ...formData, longitude: e.target.value });
                              if (formErrors.coordinates) {
                                setFormErrors({ ...formErrors, coordinates: '' });
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Current Coordinates Display */}
                      {(formData.latitude || formData.longitude) && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Koordinat Terpilih:</span>
                          </div>
                          <div className="text-xs text-green-700 mt-1">
                            Lat: {formData.latitude || 'Belum diisi'} |
                            Lng: {formData.longitude || 'Belum diisi'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* <div>
                  <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                    WhatsApp Session ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Otomatis dibuat oleh sistem"
                      className="w-full rounded-lg border border-telaga-100 bg-krem px-3 py-2.5 font-montserrat text-sm text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                      value={formData.wa_session_id}
                      onChange={(e) => setFormData({ ...formData, wa_session_id: e.target.value })}
                      disabled
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <WifiOff className="w-3 h-3 text-telaga-900/40" />
                    </div>
                  </div>
                  <p className="text-xs text-telaga-900/55 mt-1">
                    Session ID akan dibuat otomatis saat WA sudah terhubung.
                  </p>
                </div> */}
                </div>
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-telaga-50 flex-shrink-0 bg-white rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 rounded-xl border border-telaga-100 bg-white px-4 py-3 font-montserrat text-sm font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="create-branch-form"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-telaga-700 px-4 py-3 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-telaga-800 disabled:cursor-not-allowed disabled:bg-telaga-300"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    createMode === 'mitra' ? 'Simpan Droppoint' : 'Simpan Outlet'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Edit Branch Modal */}
      {editingBranch && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-telaga-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-telaga-100 rounded-xl flex items-center justify-center">
                  <Edit className="w-5 h-5 text-telaga-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-telaga-950">Edit Outlet</h2>
                  <p className="text-sm text-telaga-900/55">Ubah informasi outlet Anda</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700 transition-colors hover:bg-telaga-100"
                aria-label="Tutup"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div
              className="p-6 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <form onSubmit={handleEditBranch} id="edit-branch-form">
                {/* Required Fields Info */}
                <div className="mb-4 p-3 bg-telaga-50 border border-telaga-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-telaga-900">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Informasi Penting:</span>
                  </div>
                  <p className="text-xs text-telaga-800 mt-1">
                    Semua field dengan tanda <span className="text-red-500 font-bold">*</span> wajib diisi.
                    Koordinat lokasi diperlukan untuk validasi absensi karyawan.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Nama Outlet */}
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Nama Outlet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 focus:outline-none font-montserrat text-sm transition-colors ${formErrors.name
                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                        : 'border-telaga-100 bg-krem focus:border-telaga-500'
                        }`}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) {
                          setFormErrors({ ...formErrors, name: '' });
                        }
                      }}
                      placeholder="Masukkan nama outlet"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Alamat */}
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Alamat
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-2 focus:ring-telaga-400/25 focus:border-telaga-400 focus:outline-none font-montserrat text-sm bg-krem transition-colors resize-none"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Masukkan alamat lengkap outlet"
                    />
                  </div>

                  {/* Nomor Telepon */}
                  <PhoneInputWithCountry
                    value={formData.phone}
                    onChange={(full) => {
                      setFormData({ ...formData, phone: full });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    error={formErrors.phone}
                    label="Nomor Telepon"
                    required
                  />

                  {/* Kota */}
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Kota
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-2 focus:ring-telaga-400/25 focus:border-telaga-400 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Masukkan nama kota"
                    />
                  </div>

                  {/* Branch Type */}
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Tipe Outlet <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, branch_type: 'main' })}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.branch_type === 'main' || !formData.branch_type
                          ? 'border-telaga-500 bg-telaga-50'
                          : 'border-telaga-100 bg-krem hover:border-telaga-200'
                          }`}
                      >
                        <Building2 className={`w-5 h-5 ${formData.branch_type === 'main' || !formData.branch_type ? 'text-telaga-500' : 'text-telaga-900/55'}`} />
                        <div className="text-left">
                          <p className={`font-semibold text-sm ${formData.branch_type === 'main' || !formData.branch_type ? 'text-telaga-800' : 'text-telaga-900'}`}>Outlet</p>
                          <p className="text-xs text-telaga-900/55">Pusat operasional</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, branch_type: 'mitra' })}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.branch_type === 'mitra'
                          ? 'border-senja-500 bg-senja-50'
                          : 'border-telaga-100 bg-krem hover:border-telaga-200'
                          }`}
                      >
                        <Store className={`w-5 h-5 ${formData.branch_type === 'mitra' ? 'text-senja-500' : 'text-telaga-900/55'}`} />
                        <div className="text-left">
                          <p className={`font-semibold text-sm ${formData.branch_type === 'mitra' ? 'text-senja-700' : 'text-telaga-900'}`}>Droppoint</p>
                          <p className="text-xs text-telaga-900/55">Lokasi Droppoint</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Parent Branch Picker (only for mitra) */}
                  {formData.branch_type === 'mitra' && (
                    <div>
                      <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                        Outlet Induk <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-telaga-900/55 mb-2">
                        Order dari droppoint ini akan dikirim ke outlet induk yang dipilih
                      </p>
                      <select
                        required
                        className="w-full px-4 py-3 border-2 border-senja-200 rounded-xl focus:ring-0 focus:border-senja-500 focus:outline-none font-montserrat text-sm bg-senja-50 transition-colors"
                        value={selectedParentBranch?.id || ''}
                        onChange={(e) => {
                          const selected = branches.find(b => b.id === parseInt(e.target.value));
                          setSelectedParentBranch(selected);
                        }}
                      >
                        <option value="">-- Pilih Outlet Induk --</option>
                        {branches
                          .filter(b => b.status === 'active' && b.branch_type === 'main' && b.id !== editingBranch?.id)
                          .map(branch => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name} - {branch.city || branch.address}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Status Outlet
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-2 focus:ring-telaga-400/25 focus:border-telaga-400 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                      Mode Operasional
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-2 focus:ring-telaga-400/25 focus:border-telaga-400 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                      value={formData.order_mode || 'loket'}
                      onChange={(e) => setFormData({ ...formData, order_mode: e.target.value })}
                    >
                      <option value="loket">Loket — tanpa data tamu &amp; meja</option>
                      <option value="cafe">Cafe — wajib nama pemesan &amp; no meja</option>
                      <option value="mixed">Campur — loket + cafe (tamu hanya untuk item F&amp;B)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-telaga-900/45 font-montserrat">
                      Menentukan field tamu yang muncul di halaman Pesanan Cepat.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                      Dapur Pusat
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-2 focus:ring-telaga-400/25 focus:border-telaga-400 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                      value={formData.kitchen_branch_id || ''}
                      onChange={(e) => setFormData({ ...formData, kitchen_branch_id: e.target.value })}
                    >
                      <option value="">Tanpa dapur pusat (dimasak di outlet ini)</option>
                      {kitchenBranchOptions.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} - {branch.city || branch.address}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-telaga-900/45 font-montserrat">
                      Item dengan produksi &quot;Dapur Pusat&quot; akan dicetak sebagai tiket di dapur outlet ini.
                    </p>
                  </div>

                  {/* Koordinat */}
                  <div>
                    <label className="block text-sm font-semibold text-telaga-900/70 mb-2">
                      Koordinat Lokasi <span className="text-red-500">*</span>
                    </label>
                    {formErrors.coordinates && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {formErrors.coordinates}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {/* Location Picker Button */}
                      <button
                        type="button"
                        onClick={openLocationModal}
                        className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-telaga-700 bg-telaga-50 border-2 border-telaga-200 hover:bg-telaga-100 hover:border-telaga-300 transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Ambil Lokasi GPS</span>
                      </button>

                      {/* Manual Input Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="-7.250000"
                            className="w-full px-3 py-2 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-500 focus:border-transparent font-montserrat text-sm"
                            value={formData.latitude}
                            onChange={(e) => {
                              setFormData({ ...formData, latitude: e.target.value });
                              if (formErrors.coordinates) {
                                setFormErrors({ ...formErrors, coordinates: '' });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-telaga-900/70 mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="112.750000"
                            className="w-full px-3 py-2 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-500 focus:border-transparent font-montserrat text-sm"
                            value={formData.longitude}
                            onChange={(e) => {
                              setFormData({ ...formData, longitude: e.target.value });
                              if (formErrors.coordinates) {
                                setFormErrors({ ...formErrors, coordinates: '' });
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Current Coordinates Display */}
                      {(formData.latitude || formData.longitude) && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Koordinat Terpilih:</span>
                          </div>
                          <div className="text-xs text-green-700 mt-1">
                            Lat: {formData.latitude || 'Belum diisi'} |
                            Lng: {formData.longitude || 'Belum diisi'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Danger Action - Inside Content */}
                <div className="mt-6 pt-6 border-t border-telaga-100">
                  <button
                    type="button"
                    onClick={() => {
                      closeEditModal();
                      openCloseModal(editingBranch);
                    }}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    Nonaktifkan Outlet
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-telaga-50 flex-shrink-0 bg-white rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 rounded-xl border border-telaga-100 bg-white px-4 py-3 font-montserrat text-sm font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="edit-branch-form"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-telaga-700 hover:bg-telaga-800 transition-colors disabled:bg-telaga-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nonaktifkan Outlet Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header - Fixed */}
            <div className="flex items-center gap-3 p-6 border-b border-telaga-50 flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-telaga-950">Nonaktifkan Outlet</h2>
                <p className="text-sm text-telaga-900/55">Konfirmasi untuk menonaktifkan outlet</p>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div
              className="p-6 overflow-y-auto flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <p className="text-telaga-900 mb-3">
                Apakah Anda yakin ingin menonaktifkan outlet <strong>"{branchToDelete?.name}"</strong>?
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Perhatian:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Outlet akan diubah statusnya menjadi "Non-Aktif"</li>
                      <li>• Tidak akan muncul di operasional harian</li>
                      <li>• Data outlet tetap tersimpan untuk laporan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-telaga-50 flex-shrink-0 bg-white rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-xl border border-telaga-100 bg-white px-4 py-3 font-montserrat text-sm font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleCloseBranch}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        currentLat={formData.latitude}
        currentLng={formData.longitude}
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

      {/* Branch Detail Modal */}
      <BranchDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        branchId={selectedBranch?.id}
        branchName={selectedBranch?.name}
      />
    </div>
  );
};

export default BranchManagement;
