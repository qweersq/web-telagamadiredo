import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, MapPin, Building2, Shield, UserCheck, Eye, EyeOff } from 'lucide-react';
import instance from '../../config/api';
import { validateFullPhone } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../PhoneInput/PhoneInputWithCountry';
import { getTenantId, getUserData } from '../../utils/userProfileHelper';

const EmployeeModal = ({
  isOpen,
  onClose,
  employee = null,
  onSuccess,
  onError,
  mode = 'create' // 'create' atau 'update'
}) => {
  const [formData, setFormData] = useState({
    branch_id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    status: 'active',
    role: 'employee'
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tenantId, setTenantId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const { data } = await instance.get('/branches');
      if (data.success) {
        setBranches(data.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  // Initialize form data when employee prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (employee && mode === 'update') {
        setFormData({
          branch_id: employee.branch_id || '',
          name: employee.name || '',
          email: employee.email || '',
          password: '', // Don't pre-fill password for update
          phone: employee.phone || '',
          address: employee.address || '',
          status: employee.status || 'active',
          role: employee.role || 'employee'
        });
      } else if (mode === 'create') {
        // Set default role based on current user role
        const defaultRole = currentUserRole === 'owner' ? 'employee' : 'employee';
        setFormData({
          branch_id: '',
          name: '',
          email: '',
          password: '',
          phone: '',
          address: '',
          status: 'active',
          role: defaultRole
        });
      }
    }
  }, [employee, mode, isOpen, currentUserRole]);

  // Fetch branches, tenant_id, and user role when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      fetchTenantId();
      fetchCurrentUserRole();
    }
  }, [isOpen]);

  // Fetch tenant_id from user profile
  const fetchTenantId = async () => {
    try {
      const id = await getTenantId();
      setTenantId(id);
    } catch (error) {
    }
  };

  // Fetch current user role for validation
  const fetchCurrentUserRole = async () => {
    try {
      const userData = await getUserData();
      const role = userData?.role || userData?.user_role;
      setCurrentUserRole(role);
    } catch (error) {
    }
  };

  // Get available roles based on current user role
  const getAvailableRoles = () => {
    if (!currentUserRole) return [];

    switch (currentUserRole) {
      case 'superadmin':
        return [
          { value: 'admin', label: 'Admin' },
          { value: 'supervisor', label: 'Supervisor' },
          { value: 'employee', label: 'Karyawan' }
        ];
      default:
        return [
          { value: 'employee', label: 'Karyawan' }
        ];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    const phoneError = validateFullPhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (!formData.branch_id) {
      newErrors.branch_id = 'Cabang wajib dipilih';
    }

    // Role validation based on current user role
    if (currentUserRole) {
      const availableRoles = getAvailableRoles();
      const isValidRole = availableRoles.some(role => role.value === formData.role);

      if (!isValidRole) {
        newErrors.role = `Anda tidak dapat membuat user dengan role ${formData.role}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = { ...formData };

      // ✅ SECURITY: tenant_id should NOT be sent from frontend
      // Server will use tenant_id from JWT token for security
      // Remove tenant_id if somehow included
      if (submitData.tenant_id) {
        delete submitData.tenant_id;
      }

      // Remove password if empty (for update mode)
      if (mode === 'update' && !submitData.password) {
        delete submitData.password;
      }

      let response;
      if (mode === 'create') {
        response = await instance.post('/users', submitData);
      } else {
        response = await instance.put(`/users/${employee.id}`, submitData);
      }

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      } else {
        const errorMsg = response.data.message || 'Terjadi kesalahan';
        setErrors({ submit: errorMsg });
        // Call onError callback if provided
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (error) {
      let errorMsg = 'Terjadi kesalahan saat menyimpan data';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      }
      setErrors({ submit: errorMsg });
      // Call onError callback if provided
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Only reset form data if it's create mode
    if (mode === 'create') {
      setFormData({
        branch_id: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        status: 'active',
        role: 'employee'
      });
    }
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl border border-telaga-100 shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-telaga-50 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-telaga-600 to-telaga-800 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-telaga-950 font-montserrat">
                  {mode === 'create' ? 'Tambah Karyawan Baru' : 'Edit Karyawan'}
                </h2>
                <p className="text-xs text-telaga-900/50">
                  {mode === 'create'
                    ? 'Buat akun karyawan dengan informasi lengkap'
                    : 'Update informasi karyawan'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 bg-telaga-50 rounded-xl flex items-center justify-center text-telaga-700 hover:bg-telaga-100 transition-colors"
            >
              <X className="w-4 h-4 text-telaga-700" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div
          className="px-6 py-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm font-medium">{errors.submit}</span>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-telaga-950 flex items-center gap-2">
                <User className="w-5 h-5 text-telaga-700" />
                Informasi Personal
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-telaga-900/35" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none font-montserrat text-sm transition-colors ${errors.name
                        ? 'border-red-300 bg-red-50'
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                        }`}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <PhoneInputWithCountry
                  value={formData.phone}
                  onChange={(full) => {
                    setFormData(prev => ({ ...prev, phone: full }));
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  error={errors.phone}
                  label="Nomor Telepon"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                  Alamat
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-telaga-900/35" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-telaga-100 rounded-xl focus:outline-none font-montserrat text-sm bg-krem focus:border-telaga-400 focus:ring-2 focus:ring-telaga-400/25 transition-colors resize-none"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
              </div>
            </div>

            {/* Work Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-telaga-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-telaga-700" />
                Informasi Kerja
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Branch */}
                <div>
                  <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                    Cabang *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-telaga-900/35" />
                    </div>
                    <select
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none font-montserrat text-sm transition-colors appearance-none ${errors.branch_id
                        ? 'border-red-300 bg-red-50'
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                        }`}
                    >
                      <option value="">Pilih cabang</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-telaga-900/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.branch_id && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.branch_id}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-telaga-900/35" />
                    </div>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none font-montserrat text-sm transition-colors appearance-none ${errors.role
                        ? 'border-red-300 bg-red-50'
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                        }`}
                      disabled={!currentUserRole}
                    >
                      <option value="">Pilih role</option>
                      {getAvailableRoles().map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-telaga-900/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.role && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.role}
                    </p>
                  )}
                  {!currentUserRole && (
                    <p className="text-[11px] text-telaga-900/50 mt-1 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-telaga-200 border-t-telaga-600 rounded-full animate-spin"></div>
                      Memuat role yang tersedia...
                    </p>
                  )}
                  {formData.role === 'admin' && (
                    <p className="text-telaga-800 text-[11px] mt-1.5 font-montserrat bg-telaga-50 border border-telaga-100 px-3 py-2 rounded-lg">
                      <strong>Admin</strong> — Dapat mengelola shift, pesanan, data customer, dan akses peran qc, kurir serta teknisi
                    </p>
                  )}
                  {formData.role === 'employee' && (
                    <p className="text-telaga-800 text-[11px] mt-1.5 font-montserrat bg-telaga-50 border border-telaga-100 px-3 py-2 rounded-lg">
                      <strong>Karyawan</strong> — Akses beranda operasional (Teknisi, Kurir, QC). Tidak dapat mengakses fitur manajemen
                    </p>
                  )}
                  {formData.role === 'supervisor' && (
                    <p className="text-senja-800 text-[11px] mt-1.5 font-montserrat bg-senja-50 border border-senja-100 px-3 py-2 rounded-lg">
                      <strong>Supervisor</strong> — Sama seperti Admin (shift, pesanan, data customer), tetapi bisa melihat dan pindah ke semua cabang
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCheck className="h-4 w-4 text-telaga-900/35" />
                  </div>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-telaga-100 rounded-xl focus:outline-none font-montserrat text-sm bg-krem focus:border-telaga-400 focus:ring-2 focus:ring-telaga-400/25 transition-colors appearance-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-telaga-900/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-telaga-900/50 mt-1">
                  Jika status dinonaktifkan, karyawan tidak dapat login ke aplikasi
                </p>
              </div>
            </div>

            {/* Login Information Section - NEW */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-telaga-950 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-telaga-700" />
                  Informasi Login
                </h3>
                <p className="text-[11px] text-telaga-900/50 mt-1">
                  Email dan password ini digunakan karyawan untuk masuk ke aplikasi
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-telaga-900/35" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none font-montserrat text-sm transition-colors ${errors.email
                        ? 'border-red-300 bg-red-50'
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                        }`}
                      placeholder="Masukkan email untuk login"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-telaga-900/70 mb-1.5">
                    Password {mode === 'create' ? '*' : '(Kosongkan jika tidak ingin mengubah)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-telaga-900/35" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none font-montserrat text-sm transition-colors ${errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-telaga-100 bg-krem focus:border-telaga-400'
                        }`}
                      placeholder={mode === 'create' ? 'Masukkan password' : 'Kosongkan jika tidak mengubah'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-telaga-900/35 hover:text-telaga-800" />
                      ) : (
                        <Eye className="h-4 w-4 text-telaga-900/35 hover:text-telaga-800" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-krem/60 border-t border-telaga-100 px-6 py-4 rounded-b-2xl flex-shrink-0">
          {/* Error Message - Above Buttons */}
          {errors.submit && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-red-800">Gagal Menyimpan</div>
                <div className="text-xs text-red-600">
                  {errors.submit.toLowerCase().includes('email already registered')
                    ? 'Email sudah pernah terdaftar di sistem'
                    : errors.submit}
                </div>
              </div>
              <button
                onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-telaga-800 bg-white border border-telaga-200 hover:bg-telaga-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-telaga-700 hover:bg-telaga-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  {mode === 'create' ? 'Tambah' : 'Simpan'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
