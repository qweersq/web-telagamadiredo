import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { formatCurrency } from '../../utils/labelFormatter';
import {
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaTimesCircle,
  FaKey,
  FaLock,
  FaEyeSlash
} from 'react-icons/fa';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';

const InfoRow = ({ label, value, wrap = false }) => (
  <div className="flex items-start justify-between gap-4 border-b border-telaga-50 pb-2.5 last:border-0 last:pb-0">
    <span className="flex-shrink-0 font-montserrat text-xs text-telaga-900/50">{label}</span>
    <span className={`text-right font-montserrat text-xs font-semibold text-telaga-950 ${wrap ? 'break-words' : 'truncate'}`}>
      {value || '-'}
    </span>
  </div>
);

const SectionCard = ({ icon, title, children }) => (
  <section className="rounded-2xl border border-telaga-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-telaga-50 text-telaga-700">{icon}</span>
      <h3 className="font-montserrat text-sm font-bold text-telaga-950">{title}</h3>
    </div>
    <div className="space-y-2.5">{children}</div>
  </section>
);

const TenantManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    address: '',
    phone: '',
    city: ''
  });
  const [formErrors, setFormErrors] = useState({
    business_name: '',
    address: '',
    phone: '',
    city: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isPasswordFormValid, setIsPasswordFormValid] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);

      // Get user profile to get tenant_id
      const profile = await getUserProfile();
      if (!profile || !profile.tenant) {
        throw new Error('User profile or tenant data not found');
      }

      const tenantId = profile.tenant.id;

      // Use getById instead of getAll
      const response = await instance.get(`/tenants/${tenantId}`);
      const tenantData = response.data.data;

      // Convert single tenant to array format for compatibility
      setTenants([tenantData]);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'business_name':
        if (!value || value.trim() === '') {
          error = 'Nama bisnis wajib diisi';
        } else if (value.trim().length < 2) {
          error = 'Nama bisnis minimal 2 karakter';
        } else if (value.trim().length > 25) {
          error = 'Nama bisnis maksimal 25 karakter';
        } 
        break;
        
      case 'address':
        if (!value || value.trim() === '') {
          error = 'Alamat wajib diisi';
        } else if (value.trim().length < 10) {
          error = 'Alamat minimal 10 karakter';
        } else if (value.trim().length > 500) {
          error = 'Alamat maksimal 500 karakter';
        }
        break;
        
      case 'phone':
        if (!value || value.trim() === '') {
          error = 'Nomor telepon wajib diisi';
        } else if (value.replace(/\D/g, '').length < 7) {
          error = 'Nomor telepon terlalu pendek';
        }
        break;
        
      case 'city':
        if (!value || value.trim() === '') {
          error = 'Kota wajib diisi';
        } else if (value.trim().length < 2) {
          error = 'Nama kota minimal 2 karakter';
        } else if (value.trim().length > 50) {
          error = 'Nama kota maksimal 50 karakter';
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
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      errors[field] = error;
      if (error) isValid = false;
    });
    
    return { errors, isValid };
  };

  const handleFieldChange = (field, value) => {
    // Update form data
    setEditForm(prev => ({ ...prev, [field]: value }));
    
    // Validate field in real-time
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
    
    // Check overall form validity
    const updatedForm = { ...editForm, [field]: value };
    const { isValid } = validateForm(updatedForm);
    setIsFormValid(isValid);
  };

  // Password validation functions
  const validatePasswordField = (field, value, allValues = {}) => {
    let error = '';
    const trimmedValue = value.trim();
    
    switch (field) {
      case 'current_password':
        if (!trimmedValue) {
          error = 'Password lama wajib diisi';
        } else if (trimmedValue.length < 6) {
          error = 'Password lama minimal 6 karakter';
        }
        break;
        
      case 'new_password':
        if (!trimmedValue) {
          error = 'Password baru wajib diisi';
        } else if (trimmedValue.length < 8) {
          error = 'Password baru minimal 8 karakter';
        } else if (trimmedValue.length > 50) {
          error = 'Password baru maksimal 50 karakter';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(trimmedValue)) {
          error = 'Password baru harus mengandung huruf besar, huruf kecil, dan angka';
        } else if (allValues.current_password && trimmedValue === allValues.current_password) {
          error = 'Password baru harus berbeda dari password lama';
        }
        break;
        
      case 'confirm_password':
        if (!trimmedValue) {
          error = 'Konfirmasi password wajib diisi';
        } else if (allValues.new_password && trimmedValue !== allValues.new_password) {
          error = 'Konfirmasi password tidak sama dengan password baru';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  const validatePasswordForm = (formData) => {
    const errors = {};
    let isValid = true;
    
    Object.keys(formData).forEach(field => {
      const error = validatePasswordField(field, formData[field], formData);
      errors[field] = error;
      if (error) isValid = false;
    });
    
    return { errors, isValid };
  };

  const handlePasswordFieldChange = (field, value) => {
    // Update form data
    const updatedForm = { ...passwordForm, [field]: value };
    setPasswordForm(updatedForm);
    
    // Validate field in real-time
    const error = validatePasswordField(field, value, updatedForm);
    setPasswordErrors(prev => ({ ...prev, [field]: error }));
    
    // Check overall form validity
    const { isValid } = validatePasswordForm(updatedForm);
    setIsPasswordFormValid(isValid);
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    const initialForm = {
      business_name: tenant.business_name || '',
      address: tenant.address || '',
      phone: tenant.phone || '',
      city: tenant.city || ''
    };
    setEditForm(initialForm);
    
    // Reset validation state
    setFormErrors({
      business_name: '',
      address: '',
      phone: '',
      city: ''
    });
    
    // Validate initial form
    const { isValid } = validateForm(initialForm);
    setIsFormValid(isValid);
    setIsSubmitting(false);
    
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    // Final validation before submission
    const { errors, isValid } = validateForm(editForm);
    setFormErrors(errors);
    
    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum menyimpan');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await instance.put(`/tenants/${selectedTenant.id}`, editForm);
      setShowEditModal(false);
      alert('Data tenant berhasil diperbarui');
      window.location.reload(); // Reload page to fetch fresh data
    } catch (error) {
      console.error('Error updating tenant:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal memperbarui data tenant';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    // Prevent double submission
    if (isPasswordSubmitting) return;
    
    // Final validation before submission
    const { errors, isValid } = validatePasswordForm(passwordForm);
    setPasswordErrors(errors);
    
    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum mengubah password');
      return;
    }

    try {
      setIsPasswordSubmitting(true);
      
      // Find owner user from tenant.users array
      const ownerUser = selectedTenant.users?.find(user => user.role === 'superadmin');
      if (!ownerUser) {
        alert('Data pemilik tidak ditemukan');
        return;
      }

      await instance.put(`/users/${ownerUser.id}/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      setShowPasswordModal(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      alert('Password berhasil diubah');
      window.location.reload(); // Reload page to fetch fresh data
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal mengubah password. Pastikan password lama benar.';
      alert(errorMessage);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const openPasswordModal = (tenant) => {
    setSelectedTenant(tenant);
    const initialPasswordForm = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    };
    setPasswordForm(initialPasswordForm);
    
    // Reset validation state
    setPasswordErrors({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    
    // Validate initial form
    const { isValid } = validatePasswordForm(initialPasswordForm);
    setIsPasswordFormValid(isValid);
    setIsPasswordSubmitting(false);
    
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setShowPasswordModal(true);
  };

  const openSubscriptionModal = (tenant) => {
    setSelectedTenant(tenant);
    setShowSubscriptionModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="h-3 w-3" />;
      case 'trial':
        return <FaClock className="h-3 w-3" />;
      case 'suspended':
        return <FaTimesCircle className="h-4 w-4" />;
      case 'inactive':
        return <FaExclamationTriangle className="h-3 w-3" />;
      default:
        return <FaExclamationTriangle className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-telaga-100 text-telaga-900 border border-telaga-200';
      case 'trial':
        return 'bg-senja-100 text-senja-800 border border-senja-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border border-red-200 font-semibold';
      case 'inactive':
        return 'bg-senja-100 text-senja-800 border border-senja-200';
      default:
        return 'bg-telaga-50 text-telaga-950 border border-telaga-100';
    }
  };

  const getSubscriptionColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-telaga-100 text-telaga-900 border border-telaga-200';
      case 'trial':
        return 'bg-senja-100 text-senja-800 border border-senja-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border border-red-200 font-semibold';
      case 'cancelled':
        return 'bg-telaga-50 text-telaga-950 border border-telaga-200 font-semibold shadow-sm';
      default:
        return 'bg-telaga-50 text-telaga-950 border border-telaga-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tidak ada';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Data Tenant & Pemilik"
          description="Kelola data tenant & pemilik Agrowisata Telaga"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
          hideLogout={true}
          hideUserMenu={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-600 mx-auto"></div>
            <p className="mt-4 font-montserrat text-sm text-telaga-900/50">Memuat data tenant...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Data Tenant & Pemilik"
        description="Kelola data tenant & pemilik Agrowisata Telaga"
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

            {/* Single Tenant View */}
            {tenants.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const tenant = tenants[0];
                  const ownerUser = tenant.users?.find(user => user.role === 'superadmin');
                  const status = tenant.display_status?.status || tenant.status;
                  const statusName = tenant.display_status?.name || tenant.status;
                  const initial = tenant.business_name?.charAt(0)?.toUpperCase() || 'T';

                  return (
                    <>
                      <div className="overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-sm">
                        <div className="relative bg-gradient-to-br from-telaga-700 via-telaga-800 to-telaga-950 px-5 py-6 sm:px-7">
                          <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-white/5" />
                          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/5" />
                          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3.5">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 font-montserrat text-lg font-bold text-white ring-1 ring-white/25">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-montserrat text-[10px] uppercase tracking-[0.2em] text-telaga-300">
                                  Data Tenant
                                </p>
                                <h2 className="truncate font-montserrat text-xl font-bold leading-tight text-white">
                                  {tenant.business_name}
                                </h2>
                                <p className="truncate font-montserrat text-xs text-telaga-200">
                                  {tenant.email || 'Email belum diisi'}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-montserrat text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/20">
                              {getStatusIcon(status)}
                              {statusName}
                            </span>
                          </div>
                        </div>

                        {tenant.display_status?.end_date && (
                          <div className="flex items-center gap-2 border-t border-telaga-100 bg-telaga-50/70 px-5 py-3 sm:px-7">
                            <FaCalendarAlt className="h-3.5 w-3.5 flex-shrink-0 text-telaga-600" />
                            <span className="font-montserrat text-xs font-medium text-telaga-800">
                              {tenant.display_status.type === 'subscription' ? 'Langganan berakhir' : 'Masa trial berakhir'}
                            </span>
                            <span className="ml-auto font-montserrat text-xs font-bold text-telaga-900">
                              {formatDate(tenant.display_status.end_date)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <SectionCard icon={<FaBuilding className="h-3.5 w-3.5" />} title="Informasi Bisnis">
                          <InfoRow label="Nama Bisnis" value={tenant.business_name} />
                          <InfoRow label="Email" value={tenant.email} />
                          <InfoRow label="Telepon" value={tenant.phone} />
                          <InfoRow label="Kota" value={tenant.city} />
                          <InfoRow label="Alamat" value={tenant.address} wrap />
                        </SectionCard>

                        <SectionCard icon={<FaUser className="h-3.5 w-3.5" />} title="Data Pemilik">
                          {ownerUser ? (
                            <>
                              <InfoRow label="Nama" value={ownerUser.name} />
                              <InfoRow label="Email" value={ownerUser.email} />
                              <InfoRow label="Role" value={ownerUser.role === 'superadmin' ? 'Owner' : ownerUser.role} />
                              <InfoRow label="Status Akun" value={ownerUser.status} />
                            </>
                          ) : (
                            <p className="py-2 font-montserrat text-xs text-telaga-900/50">
                              Data pemilik tidak ditemukan
                            </p>
                          )}
                        </SectionCard>
                      </div>

                      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                        <button
                          onClick={() => handleEdit(tenant)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-telaga-200 bg-white px-4 py-3 font-montserrat text-sm font-semibold text-telaga-800 transition-colors hover:bg-telaga-50"
                        >
                          <FaEdit className="h-3.5 w-3.5" />
                          Edit Data Tenant
                        </button>
                        <button
                          onClick={() => openPasswordModal(tenant)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-telaga-700 px-4 py-3 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-telaga-800"
                        >
                          <FaKey className="h-3.5 w-3.5" />
                          Ganti Password
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-telaga-200 bg-white/60 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-telaga-50 text-telaga-500">
                  <FaBuilding className="h-6 w-6" />
                </div>
                <h3 className="mb-1 font-montserrat text-base font-bold text-telaga-950">Tidak ada data tenant</h3>
                <p className="font-montserrat text-xs text-telaga-900/50">Data tenant akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal - Tokopedia Style */}
      {showEditModal && selectedTenant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{ 
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl border border-telaga-100 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-telaga-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-telaga-950 font-montserrat">Edit Data Tenant</h3>
                <p className="text-sm text-telaga-900/70 mt-1 font-montserrat">Perbarui informasi bisnis Anda</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 bg-telaga-50 hover:bg-telaga-100 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                <FaTimesCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div 
              className="p-6 space-y-6 overflow-y-auto flex-1"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {/* Business Name - Editable */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2 font-montserrat">
                  Nama Bisnis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => handleFieldChange('business_name', e.target.value)}
                  maxLength={25}
                  className={`w-full px-4 py-3 border border-telaga-100 bg-krem rounded-xl focus:ring-2 focus:ring-telaga-400/25 transition-all duration-200 font-montserrat text-sm placeholder-telaga-900/30 ${
                    formErrors.business_name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-telaga-100 bg-krem focus:border-telaga-400'
                  }`}
                  placeholder="Masukkan nama bisnis"
                />
                {formErrors.business_name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.business_name}</span>
                  </div>
                )}
              </div>

              {/* Address - Editable */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2 font-montserrat">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 border border-telaga-100 bg-krem rounded-xl focus:ring-2 focus:ring-telaga-400/25 transition-all duration-200 font-montserrat text-sm placeholder-telaga-900/30 resize-none ${
                    formErrors.address 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-telaga-100 bg-krem focus:border-telaga-400'
                  }`}
                  placeholder="Masukkan alamat lengkap"
                />
                {formErrors.address && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.address}</span>
                  </div>
                )}
              </div>

              {/* Phone - Editable */}
              <PhoneInputWithCountry
                value={editForm.phone}
                onChange={(full) => handleFieldChange('phone', full)}
                error={formErrors.phone}
                label="Nomor Telepon"
                required
              />

              {/* City - Editable */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2 font-montserrat">
                  Kota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className={`w-full px-4 py-3 border border-telaga-100 bg-krem rounded-xl focus:ring-2 focus:ring-telaga-400/25 transition-all duration-200 font-montserrat text-sm placeholder-telaga-900/30 ${
                    formErrors.city 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-telaga-100 bg-krem focus:border-telaga-400'
                  }`}
                  placeholder="Masukkan nama kota"
                />
                {formErrors.city && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{formErrors.city}</span>
                  </div>
                )}
              </div>

              {/* Form Validation Summary */}
              {!isFormValid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">⚠️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-1">Perbaiki Kesalahan Form</h4>
                      <p className="text-xs text-red-700 font-montserrat">
                        Mohon perbaiki kesalahan yang ditandai dengan warna merah sebelum menyimpan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Read-only fields info */}
              <div className="bg-telaga-50 border border-telaga-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">ℹ️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-telaga-900 text-sm mb-1">Informasi Penting</h4>
                    <p className="text-xs text-telaga-900/70 font-montserrat">
                      Email dan nama pemilik tidak dapat diubah karena akan mempengaruhi sistem lainnya.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex gap-3 p-6 border-t border-telaga-100 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 bg-telaga-50 hover:bg-telaga-100 text-telaga-900 rounded-xl font-semibold text-sm transition-all duration-200 font-montserrat"
              >
                Batal
              </button>
              <button
                onClick={handleUpdate}
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 font-montserrat flex items-center justify-center gap-2 ${
                  !isFormValid || isSubmitting
                    ? 'bg-telaga-200 text-telaga-900/40 cursor-not-allowed'
                    : 'bg-telaga-700 hover:bg-telaga-800 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal - Tokopedia Style */}
      {showPasswordModal && selectedTenant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{ 
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl border border-telaga-100 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-telaga-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-telaga-950 font-montserrat">Ganti Password Pemilik</h3>
                <p className="text-sm text-telaga-900/70 mt-1 font-montserrat">
                  Mengubah password untuk: <strong className="text-telaga-700">{selectedTenant.users?.find(user => user.role === 'superadmin')?.name || selectedTenant.owner_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="h-8 w-8 bg-telaga-50 hover:bg-telaga-100 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                <FaTimesCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div 
              className="p-6 space-y-6 overflow-y-auto flex-1"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2 font-montserrat">
                  Password Lama <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) => handlePasswordFieldChange('current_password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border border-telaga-100 bg-krem rounded-xl focus:ring-2 focus:ring-telaga-400/25 transition-all duration-200 font-montserrat text-sm placeholder-telaga-900/30 ${
                      passwordErrors.current_password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                    }`}
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-telaga-900/40 hover:text-telaga-800 transition-colors duration-200"
                  >
                    {showPasswords.current ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{passwordErrors.current_password}</span>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2 font-montserrat">
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) => handlePasswordFieldChange('new_password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border border-telaga-100 bg-krem rounded-xl focus:ring-2 focus:ring-telaga-400/25 transition-all duration-200 font-montserrat text-sm placeholder-telaga-900/30 ${
                      passwordErrors.new_password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                    }`}
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-telaga-900/40 hover:text-telaga-800 transition-colors duration-200"
                  >
                    {showPasswords.new ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{passwordErrors.new_password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2 font-montserrat">
                  Konfirmasi Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onChange={(e) => handlePasswordFieldChange('confirm_password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border border-telaga-100 bg-krem rounded-xl focus:ring-2 focus:ring-telaga-400/25 transition-all duration-200 font-montserrat text-sm placeholder-telaga-900/30 ${
                      passwordErrors.confirm_password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                    }`}
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-telaga-900/40 hover:text-telaga-800 transition-colors duration-200"
                  >
                    {showPasswords.confirm ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-red-500 text-xs">⚠️</span>
                    <span className="text-red-500 text-xs font-montserrat">{passwordErrors.confirm_password}</span>
                  </div>
                )}
              </div>

              {/* Password Validation Summary */}
              {!isPasswordFormValid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">⚠️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-1">Perbaiki Kesalahan Password</h4>
                      <p className="text-xs text-red-700 font-montserrat">
                        Mohon perbaiki kesalahan yang ditandai dengan warna merah sebelum mengubah password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="bg-telaga-50 border border-telaga-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">🔒</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-telaga-900 text-sm mb-1">Ketentuan Password Baru</h4>
                    <ul className="text-xs text-telaga-900/70 font-montserrat space-y-1">
                      <li>• Minimal 8 karakter, maksimal 50 karakter</li>
                      <li>• Harus mengandung huruf besar (A-Z)</li>
                      <li>• Harus mengandung huruf kecil (a-z)</li>
                      <li>• Harus mengandung angka (0-9)</li>
                      <li>• Harus berbeda dari password lama</li>
                      <li>• Gunakan password yang kuat dan unik</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex gap-3 p-6 border-t border-telaga-100 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 bg-telaga-50 hover:bg-telaga-100 text-telaga-900 rounded-xl font-semibold text-sm transition-all duration-200 font-montserrat"
              >
                Batal
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={!isPasswordFormValid || isPasswordSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 font-montserrat flex items-center justify-center gap-2 ${
                  !isPasswordFormValid || isPasswordSubmitting
                    ? 'bg-telaga-200 text-telaga-900/40 cursor-not-allowed'
                    : 'bg-telaga-700 hover:bg-telaga-800 text-white'
                }`}
              >
                {isPasswordSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mengubah Password...</span>
                  </>
                ) : (
                  'Ubah Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription History Modal - Tokopedia Style */}
      {showSubscriptionModal && selectedTenant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
          style={{ 
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl border border-telaga-100 w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-telaga-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-telaga-950 font-montserrat">History Langganan</h3>
                <p className="text-sm text-telaga-900/70 mt-1 font-montserrat">
                  Riwayat langganan untuk {selectedTenant.business_name}
                </p>
              </div>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="h-8 w-8 bg-telaga-50 hover:bg-telaga-100 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                <FaTimesCircle className="h-4 w-4" />
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
              {selectedTenant.subscriptions && selectedTenant.subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {selectedTenant.subscriptions.map((subscription) => (
                    <div key={subscription.id} className={`rounded-xl p-5 border transition-all duration-200 hover:shadow-md ${
                      subscription.status === 'active' 
                        ? 'bg-telaga-50 border-telaga-200 shadow-sm' 
                        : 'bg-krem border-telaga-100'
                    }`}>
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            subscription.status === 'active' ? 'bg-telaga-500' : 'bg-krem0'
                          }`}>
                            <span className="text-white text-sm">📋</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-telaga-950 text-lg font-montserrat truncate">
                              {subscription.plan?.name || 'Plan Langganan'}
                            </h4>
                            <p className="text-sm text-telaga-900/70 font-montserrat truncate">
                              ID: #{subscription.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                          {subscription.status === 'active' && (
                            <span className="px-3 py-1 bg-telaga-100 text-telaga-900 rounded-full text-xs font-semibold border border-telaga-200 whitespace-nowrap">
                              SEDANG AKTIF
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSubscriptionColor(subscription.status)}`}>
                            {subscription.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-telaga-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-telaga-900/50 text-sm">💰</span>
                            <span className="text-xs font-semibold text-telaga-900/70 font-montserrat">Harga</span>
                          </div>
                          <p className="text-lg font-bold text-telaga-950 font-montserrat">
                            {formatCurrency(subscription.plan?.price || 0)}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-telaga-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-telaga-900/50 text-sm">⏱️</span>
                            <span className="text-xs font-semibold text-telaga-900/70 font-montserrat">Durasi</span>
                          </div>
                          <p className="text-lg font-bold text-telaga-950 font-montserrat">
                            {subscription.plan?.duration_days || 0} hari
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-telaga-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-telaga-900/50 text-sm">📅</span>
                            <span className="text-xs font-semibold text-telaga-900/70 font-montserrat">Mulai</span>
                          </div>
                          <p className="text-sm font-semibold text-telaga-950 font-montserrat">
                            {formatDate(subscription.start_date)}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-telaga-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-telaga-900/50 text-sm">🏁</span>
                            <span className="text-xs font-semibold text-telaga-900/70 font-montserrat">Berakhir</span>
                          </div>
                          <p className="text-sm font-semibold text-telaga-950 font-montserrat">
                            {formatDate(subscription.end_date)}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-telaga-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-telaga-900/50 text-sm">🆔</span>
                            <span className="text-xs font-semibold text-telaga-900/70 font-montserrat">ID Langganan</span>
                          </div>
                          <p className="text-sm font-semibold text-telaga-950 font-montserrat">
                            #{subscription.id}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-telaga-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-telaga-900/50 text-sm">📊</span>
                            <span className="text-xs font-semibold text-telaga-900/70 font-montserrat">Status</span>
                          </div>
                          <p className="text-sm font-semibold text-telaga-950 font-montserrat capitalize">
                            {subscription.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-telaga-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-telaga-900/40">📋</span>
                  </div>
                  <h4 className="text-lg font-semibold text-telaga-950 mb-2 font-montserrat">Tidak Ada History Langganan</h4>
                  <p className="text-telaga-900/50 font-montserrat">Belum ada riwayat langganan untuk tenant ini</p>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex justify-end p-6 border-t border-telaga-100 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-6 py-3 bg-telaga-50 hover:bg-telaga-100 text-telaga-900 rounded-xl font-semibold text-sm transition-all duration-200 font-montserrat"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
